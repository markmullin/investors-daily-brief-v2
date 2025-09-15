import fmpService from '../fmpService.js';
import redisService from '../redisService.js';

class StockSplitService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 86400000; // 24 hours - splits don't change often
  }

  /**
   * Get historical stock splits for a symbol using FMP API
   * @param {string} symbol - Stock symbol (e.g., 'NVDA', 'TSLA')
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD), defaults to today
   * @returns {Array} Array of split objects with date, ratio, etc.
   */
  async getHistoricalSplits(symbol, fromDate = '2020-01-01', toDate = null) {
    if (!toDate) {
      toDate = new Date().toISOString().split('T')[0];
    }

    const cacheKey = `splits_${symbol}_${fromDate}_${toDate}`;
    
    // Check Redis cache first
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        console.log(`📚 Cache hit for ${symbol} splits`);
        return cached;
      }
    } catch (error) {
      console.warn('Redis cache unavailable, proceeding without cache');
    }

    try {
      console.log(`🔍 Fetching stock splits for ${symbol} from ${fromDate} to ${toDate}...`);
      
      // Use FMP API historical stock splits endpoint
      const splits = await fmpService.getHistoricalStockSplits(symbol, fromDate, toDate);
      
      if (!splits || splits.length === 0) {
        console.log(`ℹ️ No splits found for ${symbol}`);
        return [];
      }

      // Process and normalize split data
      const processedSplits = splits.map(split => ({
        symbol: symbol,
        date: split.date,
        ratio: this.parseSplitRatio(split.numerator, split.denominator),
        numerator: split.numerator,
        denominator: split.denominator,
        description: `${split.numerator}:${split.denominator} stock split`,
        multiplier: split.numerator / split.denominator,
        source: 'FMP_API'
      })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

      console.log(`✅ Found ${processedSplits.length} splits for ${symbol}:`, 
        processedSplits.map(s => `${s.date}: ${s.description}`));

      // Cache the result
      try {
        await redisService.set(cacheKey, processedSplits, this.cacheTimeout / 1000);
      } catch (error) {
        console.warn('Failed to cache split data:', error.message);
      }

      return processedSplits;

    } catch (error) {
      console.error(`❌ Error fetching splits for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Parse split ratio from numerator/denominator
   * @param {number} numerator - Split numerator (e.g., 4 in 4:1 split)
   * @param {number} denominator - Split denominator (e.g., 1 in 4:1 split)
   * @returns {string} Human readable ratio (e.g., "4:1")
   */
  parseSplitRatio(numerator, denominator) {
    return `${numerator}:${denominator}`;
  }

  /**
   * Calculate split-adjusted values for a position
   * @param {Object} position - Original position {quantity, price, date}
   * @param {Array} splits - Array of applicable splits
   * @returns {Object} Adjusted position {quantity, price, adjustments}
   */
  applySplitAdjustments(position, splits) {
    if (!splits || splits.length === 0) {
      return {
        ...position,
        adjustedQuantity: position.quantity,
        adjustedPrice: position.price,
        adjustments: [],
        splitAdjusted: false
      };
    }

    let adjustedQuantity = position.quantity;
    let adjustedPrice = position.price;
    const adjustments = [];

    // Apply splits that occurred after the position date
    const positionDate = new Date(position.date);
    const applicableSplits = splits.filter(split => new Date(split.date) > positionDate);

    console.log(`📊 Applying ${applicableSplits.length} splits to ${position.symbol || 'position'} from ${position.date}`);

    for (const split of applicableSplits) {
      const previousQuantity = adjustedQuantity;
      const previousPrice = adjustedPrice;

      // Apply split: multiply quantity by ratio, divide price by ratio
      adjustedQuantity = adjustedQuantity * split.multiplier;
      adjustedPrice = adjustedPrice / split.multiplier;

      adjustments.push({
        date: split.date,
        ratio: split.ratio,
        description: split.description,
        quantityBefore: previousQuantity,
        quantityAfter: adjustedQuantity,
        priceBefore: previousPrice,
        priceAfter: adjustedPrice,
        multiplier: split.multiplier
      });

      console.log(`  🔄 ${split.date} ${split.ratio} split: ${previousQuantity} → ${adjustedQuantity} shares, $${previousPrice.toFixed(2)} → $${adjustedPrice.toFixed(2)}`);
    }

    return {
      ...position,
      adjustedQuantity: Math.round(adjustedQuantity * 10000) / 10000, // Round to 4 decimal places
      adjustedPrice: Math.round(adjustedPrice * 100) / 100, // Round to 2 decimal places
      adjustments,
      splitAdjusted: adjustments.length > 0,
      originalQuantity: position.quantity,
      originalPrice: position.price
    };
  }

  /**
   * Detect split discrepancies in a portfolio
   * @param {Object} portfolio - Portfolio with holdings
   * @returns {Array} Array of potential split issues
   */
  async detectSplitDiscrepancies(portfolio) {
    const discrepancies = [];
    const holdings = Object.values(portfolio.holdings || {});

    console.log(`🔍 Scanning ${holdings.length} holdings for split discrepancies...`);

    for (const holding of holdings) {
      try {
        // Get splits for this symbol since 2020
        const splits = await this.getHistoricalSplits(holding.symbol);
        
        if (splits.length === 0) {
          continue; // No splits to worry about
        }

        // Check if the average cost seems too high (might indicate unadjusted split)
        const currentPrice = holding.currentPrice || holding.avgCost;
        const costRatio = holding.avgCost / currentPrice;

        // If cost basis is significantly higher than current price, might be split issue
        for (const split of splits) {
          const expectedCostRatio = split.multiplier;
          
          if (Math.abs(costRatio - expectedCostRatio) < expectedCostRatio * 0.1) {
            discrepancies.push({
              symbol: holding.symbol,
              type: 'potential_split_issue',
              suspectedSplit: split,
              currentQuantity: holding.quantity,
              currentAvgCost: holding.avgCost,
              currentPrice: currentPrice,
              costRatio: costRatio,
              expectedAdjustment: {
                newQuantity: holding.quantity * split.multiplier,
                newAvgCost: holding.avgCost / split.multiplier
              },
              confidence: 'medium'
            });
          }
        }

        // Check for obvious split patterns (e.g., cost basis that's exactly 2x, 4x, 10x current price)
        const commonSplitRatios = [2, 3, 4, 5, 10, 20];
        for (const ratio of commonSplitRatios) {
          if (Math.abs(costRatio - ratio) < 0.1) {
            const matchingSplit = splits.find(s => Math.abs(s.multiplier - ratio) < 0.1);
            if (matchingSplit) {
              discrepancies.push({
                symbol: holding.symbol,
                type: 'likely_split_issue',
                suspectedSplit: matchingSplit,
                currentQuantity: holding.quantity,
                currentAvgCost: holding.avgCost,
                currentPrice: currentPrice,
                costRatio: costRatio,
                expectedAdjustment: {
                  newQuantity: holding.quantity * ratio,
                  newAvgCost: holding.avgCost / ratio
                },
                confidence: 'high'
              });
            }
          }
        }

      } catch (error) {
        console.error(`Error checking splits for ${holding.symbol}:`, error.message);
      }
    }

    if (discrepancies.length > 0) {
      console.log(`⚠️ Found ${discrepancies.length} potential split discrepancies:`, 
        discrepancies.map(d => `${d.symbol}: ${d.type} (${d.confidence} confidence)`));
    } else {
      console.log(`✅ No split discrepancies detected`);
    }

    return discrepancies;
  }

  /**
   * Apply split adjustments to portfolio transactions
   * @param {Array} transactions - Array of transactions
   * @returns {Array} Adjusted transactions with split adjustments applied
   */
  async adjustTransactionsForSplits(transactions) {
    const adjustedTransactions = [];
    const symbolGroups = {};

    // Group transactions by symbol
    transactions.forEach(txn => {
      if (!symbolGroups[txn.symbol]) {
        symbolGroups[txn.symbol] = [];
      }
      symbolGroups[txn.symbol].push(txn);
    });

    console.log(`🔄 Adjusting transactions for ${Object.keys(symbolGroups).length} symbols...`);

    // Process each symbol group
    for (const [symbol, symbolTransactions] of Object.entries(symbolGroups)) {
      try {
        // Get splits for this symbol
        const splits = await this.getHistoricalSplits(symbol);
        
        if (splits.length === 0) {
          // No splits, add transactions as-is
          adjustedTransactions.push(...symbolTransactions);
          continue;
        }

        console.log(`📊 Processing ${symbolTransactions.length} transactions for ${symbol} with ${splits.length} splits`);

        // Sort transactions by date
        const sortedTransactions = symbolTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Adjust each transaction
        for (const txn of sortedTransactions) {
          const adjusted = this.applySplitAdjustments({
            symbol: txn.symbol,
            quantity: txn.quantity,
            price: txn.price,
            date: txn.date
          }, splits);

          const adjustedTransaction = {
            ...txn,
            quantity: adjusted.adjustedQuantity,
            price: adjusted.adjustedPrice,
            total: adjusted.adjustedQuantity * adjusted.adjustedPrice + (txn.fees || 0),
            splitAdjusted: adjusted.splitAdjusted,
            originalQuantity: adjusted.originalQuantity,
            originalPrice: adjusted.originalPrice,
            splitAdjustments: adjusted.adjustments
          };

          adjustedTransactions.push(adjustedTransaction);

          if (adjusted.splitAdjusted) {
            console.log(`  ✅ ${txn.symbol} ${txn.date}: ${adjusted.originalQuantity} → ${adjusted.adjustedQuantity} shares, $${adjusted.originalPrice.toFixed(2)} → $${adjusted.adjustedPrice.toFixed(2)}`);
          }
        }

      } catch (error) {
        console.error(`Error adjusting transactions for ${symbol}:`, error.message);
        // Add original transactions if adjustment fails
        adjustedTransactions.push(...symbolGroups[symbol]);
      }
    }

    const adjustedCount = adjustedTransactions.filter(t => t.splitAdjusted).length;
    console.log(`✅ Split adjustment complete: ${adjustedCount}/${adjustedTransactions.length} transactions were adjusted`);

    return adjustedTransactions;
  }

  /**
   * Get specific split information for common problem stocks
   * @returns {Object} Known splits for problem stocks
   */
  getKnownSplits() {
    return {
      'NVDA': [
        { date: '2021-07-20', ratio: '4:1', multiplier: 4, description: 'NVIDIA 4:1 stock split' },
        { date: '2007-09-11', ratio: '2:1', multiplier: 2, description: 'NVIDIA 2:1 stock split' },
        { date: '2006-04-07', ratio: '2:1', multiplier: 2, description: 'NVIDIA 2:1 stock split' },
        { date: '2001-06-27', ratio: '2:1', multiplier: 2, description: 'NVIDIA 2:1 stock split' },
        { date: '2000-06-12', ratio: '3:2', multiplier: 1.5, description: 'NVIDIA 3:2 stock split' }
      ],
      'TSLA': [
        { date: '2022-08-25', ratio: '3:1', multiplier: 3, description: 'Tesla 3:1 stock split' },
        { date: '2020-08-31', ratio: '5:1', multiplier: 5, description: 'Tesla 5:1 stock split' }
      ],
      'AAPL': [
        { date: '2020-08-31', ratio: '4:1', multiplier: 4, description: 'Apple 4:1 stock split' },
        { date: '2014-06-09', ratio: '7:1', multiplier: 7, description: 'Apple 7:1 stock split' },
        { date: '2005-02-28', ratio: '2:1', multiplier: 2, description: 'Apple 2:1 stock split' },
        { date: '2000-06-21', ratio: '2:1', multiplier: 2, description: 'Apple 2:1 stock split' },
        { date: '1987-06-16', ratio: '2:1', multiplier: 2, description: 'Apple 2:1 stock split' }
      ]
    };
  }

  /**
   * Fix a specific holding by applying split adjustments
   * @param {Object} holding - Holding to fix
   * @returns {Object} Fixed holding with split adjustments
   */
  async fixHoldingSplits(holding) {
    console.log(`🔧 Fixing splits for ${holding.symbol}...`);

    try {
      // Get all transactions for this holding to find the earliest date
      const earliestDate = holding.transactions && holding.transactions.length > 0
        ? holding.transactions.reduce((earliest, txn) => 
            new Date(txn.date) < new Date(earliest) ? txn.date : earliest, 
            holding.transactions[0].date)
        : '2020-01-01'; // Default lookback

      // Get historical splits
      const splits = await this.getHistoricalSplits(holding.symbol, earliestDate);

      if (splits.length === 0) {
        console.log(`ℹ️ No splits found for ${holding.symbol}, no adjustment needed`);
        return holding;
      }

      // Apply split adjustments
      const adjusted = this.applySplitAdjustments({
        symbol: holding.symbol,
        quantity: holding.quantity,
        price: holding.avgCost,
        date: earliestDate
      }, splits);

      const fixedHolding = {
        ...holding,
        quantity: adjusted.adjustedQuantity,
        avgCost: adjusted.adjustedPrice,
        totalCost: adjusted.adjustedQuantity * adjusted.adjustedPrice,
        splitAdjusted: true,
        originalQuantity: adjusted.originalQuantity,
        originalAvgCost: adjusted.originalPrice,
        splitAdjustments: adjusted.adjustments
      };

      console.log(`✅ ${holding.symbol} fixed: ${adjusted.originalQuantity} → ${adjusted.adjustedQuantity} shares, $${adjusted.originalPrice.toFixed(2)} → $${adjusted.adjustedPrice.toFixed(2)} avg cost`);

      return fixedHolding;

    } catch (error) {
      console.error(`❌ Error fixing splits for ${holding.symbol}:`, error.message);
      return holding; // Return original if fix fails
    }
  }
}

export default new StockSplitService();
