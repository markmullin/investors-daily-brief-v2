/**
 * ENHANCED CSV PARSER WITH STOCK SPLIT DETECTION AND CORRECTION
 * Fixes the critical NVIDIA stock split calculation issues mentioned in knowledge graph
 * Handles complex stock split scenarios for accurate cost basis tracking
 */

// Stock split history database for major stocks
const STOCK_SPLIT_HISTORY = {
  'NVDA': [
    { date: '2024-06-10', ratio: 10, type: 'split', description: '10:1 stock split' },
    { date: '2021-07-20', ratio: 4, type: 'split', description: '4:1 stock split' },
    { date: '2007-09-11', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '2006-04-07', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '2001-06-27', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '2000-06-12', ratio: 2, type: 'split', description: '2:1 stock split' }
  ],
  'TSLA': [
    { date: '2022-08-25', ratio: 3, type: 'split', description: '3:1 stock split' },
    { date: '2020-08-31', ratio: 5, type: 'split', description: '5:1 stock split' }
  ],
  'AAPL': [
    { date: '2020-08-31', ratio: 4, type: 'split', description: '4:1 stock split' },
    { date: '2014-06-09', ratio: 7, type: 'split', description: '7:1 stock split' },
    { date: '2005-02-28', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '2000-06-21', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '1987-06-16', ratio: 2, type: 'split', description: '2:1 stock split' }
  ],
  'GOOGL': [
    { date: '2022-07-18', ratio: 20, type: 'split', description: '20:1 stock split' },
    { date: '2014-04-03', ratio: 2, type: 'split', description: '2:1 stock split (GOOG/GOOGL)' }
  ],
  'AMZN': [
    { date: '2022-06-06', ratio: 20, type: 'split', description: '20:1 stock split' },
    { date: '1999-09-02', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '1998-06-02', ratio: 2, type: 'split', description: '2:1 stock split' },
    { date: '1999-01-05', ratio: 3, type: 'split', description: '3:1 stock split' }
  ]
};

/**
 * Detect potential stock split scenarios in portfolio positions
 * This is the core function that fixes the NVIDIA calculation issues
 */
export function detectAndCorrectStockSplits(positions, symbol, currentMarketPrice = null) {
  console.log(`🔍 STOCK SPLIT ANALYSIS: Analyzing ${symbol} positions for split scenarios`);
  
  if (!positions || positions.length === 0) {
    return { correctedPositions: positions, splitDetected: false };
  }
  
  const splitHistory = STOCK_SPLIT_HISTORY[symbol] || [];
  const today = new Date();
  
  // Analyze each position for potential split issues
  const analysisResults = positions.map(position => {
    const analysis = {
      original: { ...position },
      corrected: { ...position },
      splitDetected: false,
      splitRatio: 1,
      splitDate: null,
      confidence: 0,
      method: 'none'
    };
    
    // Method 1: Compare with current market price (if available)
    if (currentMarketPrice && position.avgCost > 0) {
      const priceRatio = currentMarketPrice / position.avgCost;
      console.log(`💰 Price ratio analysis for ${symbol}: Market $${currentMarketPrice} / Cost $${position.avgCost} = ${priceRatio.toFixed(2)}x`);
      
      // Check if ratio suggests a recent stock split
      const possibleSplitRatios = [2, 3, 4, 5, 7, 10, 20];
      for (const ratio of possibleSplitRatios) {
        const tolerance = 0.15; // 15% tolerance for market fluctuations
        const lowerBound = ratio * (1 - tolerance);
        const upperBound = ratio * (1 + tolerance);
        
        if (priceRatio >= lowerBound && priceRatio <= upperBound) {
          console.log(`🎯 POTENTIAL ${ratio}:1 SPLIT DETECTED: Price ratio ${priceRatio.toFixed(2)} matches ${ratio}:1 split pattern`);
          
          // Find the most recent split that could explain this ratio
          const recentSplit = splitHistory.find(split => {
            const splitDate = new Date(split.date);
            const daysSinceSplit = (today - splitDate) / (1000 * 60 * 60 * 24);
            return split.ratio === ratio && daysSinceSplit > 0 && daysSinceSplit < 3650; // Within 10 years
          });
          
          if (recentSplit) {
            analysis.splitDetected = true;
            analysis.splitRatio = ratio;
            analysis.splitDate = recentSplit.date;
            analysis.confidence = 90;
            analysis.method = 'market_price_comparison';
            
            // Correct the position
            analysis.corrected.quantity = Math.round(position.quantity / ratio);
            analysis.corrected.avgCost = position.avgCost * ratio;
            analysis.corrected.originalQuantity = position.quantity;
            analysis.corrected.originalAvgCost = position.avgCost;
            analysis.corrected.splitAdjusted = true;
            analysis.corrected.splitDetails = recentSplit;
            
            console.log(`✅ SPLIT CORRECTION APPLIED:`);
            console.log(`   Original: ${position.quantity} shares @ $${position.avgCost}`);
            console.log(`   Corrected: ${analysis.corrected.quantity} shares @ $${analysis.corrected.avgCost}`);
            console.log(`   Split: ${recentSplit.description} on ${recentSplit.date}`);
            
            break;
          }
        }
      }
    }
    
    // Method 2: Historical split-based correction for known dates
    if (!analysis.splitDetected && position.date) {
      const positionDate = new Date(position.date);
      
      // Find splits that occurred after this position was acquired
      const applicableSplits = splitHistory.filter(split => {
        const splitDate = new Date(split.date);
        return splitDate > positionDate;
      });
      
      if (applicableSplits.length > 0) {
        console.log(`📅 HISTORICAL SPLIT ANALYSIS: Found ${applicableSplits.length} splits after position date`);
        
        // Calculate cumulative split ratio
        let cumulativeSplitRatio = 1;
        applicableSplits.forEach(split => {
          cumulativeSplitRatio *= split.ratio;
        });
        
        if (cumulativeSplitRatio > 1) {
          analysis.splitDetected = true;
          analysis.splitRatio = cumulativeSplitRatio;
          analysis.confidence = 95;
          analysis.method = 'historical_split_dates';
          
          // Apply cumulative split adjustment
          analysis.corrected.quantity = position.quantity * cumulativeSplitRatio;
          analysis.corrected.avgCost = position.avgCost / cumulativeSplitRatio;
          analysis.corrected.splitAdjusted = true;
          analysis.corrected.appliedSplits = applicableSplits;
          
          console.log(`✅ HISTORICAL SPLIT CORRECTION:`);
          console.log(`   Position date: ${position.date}`);
          console.log(`   Applicable splits: ${applicableSplits.map(s => s.description).join(', ')}`);
          console.log(`   Original: ${position.quantity} shares @ $${position.avgCost}`);
          console.log(`   Corrected: ${analysis.corrected.quantity} shares @ $${analysis.corrected.avgCost.toFixed(4)}`);
        }
      }
    }
    
    // Method 3: Pattern-based detection for unusual cost basis
    if (!analysis.splitDetected && position.avgCost > 0) {
      // For NVIDIA specifically, check for common pre-split price ranges
      if (symbol === 'NVDA') {
        const suspiciousRanges = [
          { min: 100, max: 200, likelySplit: 4, description: 'Pre-2021 4:1 split range' },
          { min: 200, max: 600, likelySplit: 10, description: 'Pre-2024 10:1 split range' },
          { min: 600, max: 1500, likelySplit: 10, description: 'Pre-2024 high price range' }
        ];
        
        const matchingRange = suspiciousRanges.find(range => 
          position.avgCost >= range.min && position.avgCost <= range.max
        );
        
        if (matchingRange && currentMarketPrice && currentMarketPrice < 400) {
          console.log(`🎯 NVDA PATTERN DETECTION: Cost $${position.avgCost} in ${matchingRange.description}`);
          
          analysis.splitDetected = true;
          analysis.splitRatio = matchingRange.likelySplit;
          analysis.confidence = 75;
          analysis.method = 'pattern_detection';
          
          analysis.corrected.quantity = Math.round(position.quantity / matchingRange.likelySplit);
          analysis.corrected.avgCost = position.avgCost * matchingRange.likelySplit;
          analysis.corrected.splitAdjusted = true;
          analysis.corrected.patternMatch = matchingRange.description;
          
          console.log(`⚠️  PATTERN-BASED CORRECTION (${analysis.confidence}% confidence):`);
          console.log(`   Original: ${position.quantity} shares @ $${position.avgCost}`);
          console.log(`   Corrected: ${analysis.corrected.quantity} shares @ $${analysis.corrected.avgCost}`);
        }
      }
    }
    
    return analysis;
  });
  
  // Compile results
  const correctedPositions = analysisResults.map(result => result.corrected);
  const splitDetected = analysisResults.some(result => result.splitDetected);
  const highConfidenceSplits = analysisResults.filter(result => result.confidence >= 85);
  
  if (splitDetected) {
    console.log(`🎉 STOCK SPLIT ANALYSIS COMPLETE for ${symbol}:`);
    console.log(`   Positions analyzed: ${positions.length}`);
    console.log(`   Splits detected: ${analysisResults.filter(r => r.splitDetected).length}`);
    console.log(`   High confidence corrections: ${highConfidenceSplits.length}`);
  }
  
  return {
    correctedPositions,
    splitDetected,
    analysisResults,
    summary: {
      totalPositions: positions.length,
      splitsDetected: analysisResults.filter(r => r.splitDetected).length,
      highConfidenceCorrections: highConfidenceSplits.length,
      methods: [...new Set(analysisResults.map(r => r.method))]
    }
  };
}

/**
 * Enhanced position parser with stock split correction
 * This replaces the existing parsePositionsCSV function
 */
export function parsePositionsCSVWithSplitCorrection(csvText, accountName = 'Unknown') {
  console.log('*** ENHANCED WITH STOCK SPLIT CORRECTION: Parsing positions CSV for account:', accountName);
  
  const lines = csvText.split(/\\r?\\n/);
  const transactions = [];
  const warnings = [];
  const splitCorrections = [];
  
  // ... (keep existing header detection logic)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();
    if ((line.includes('symbol') || line.includes('ticker')) && 
        (line.includes('quantity') || line.includes('shares') || line.includes('qty')) && 
        (line.includes('cost basis') || line.includes('average cost') || line.includes('avg cost') || 
         line.includes('cost per share') || line.includes('basis') || line.includes('price paid') ||
         line.includes('price'))) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('Could not find position headers. Looking for Symbol, Quantity, and Cost Basis or Price columns.');
  }
  
  const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/['"]/g, ''));
  console.log('Position headers:', headers);
  
  // ... (keep existing column mapping logic)
  const colMap = {};
  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    if (h.includes('symbol') || h.includes('ticker') || h === 'stock') colMap.symbol = index;
    if (h.includes('quantity') || h.includes('qty') || h.includes('shares') || h === 'units') colMap.quantity = index;
    if (h.includes('average cost') || h.includes('avg cost') || h.includes('cost per share') || 
        h.includes('price paid') || h.includes('unit cost') || h.includes('basis per share') ||
        (h.includes('cost') && h.includes('share')) || h === 'avg price' || h === 'price') colMap.avgCost = index;
    if (h.includes('date') || h === 'date') colMap.date = index;
    // ... other mappings
  });
  
  // Parse data rows and group by symbol for split analysis
  const dataRows = lines.slice(headerIndex + 1)
    .filter(line => line.trim() && !line.toLowerCase().includes('total'))
    .map(line => {
      const matches = line.match(/(".*?"|[^,]+)/g);
      return matches ? matches.map(m => m.replace(/['"]/g, '').trim()) : [];
    });
  
  // Group positions by symbol for split analysis
  const positionsBySymbol = {};
  
  dataRows.forEach((row, index) => {
    if (row.length < 3) return;
    
    let symbol = row[colMap.symbol]?.toString().toUpperCase().trim() || '';
    const quantity = parseFloat(row[colMap.quantity]?.replace(/[,$]/g, '')) || 0;
    const avgCost = parseFloat(row[colMap.avgCost]?.replace(/[$,()]/g, '')) || 0;
    const positionDate = row[colMap.date]?.toString().trim() || new Date().toISOString().split('T')[0];
    
    // Standard filtering (keep existing logic)
    if (!symbol || symbol === '--' || quantity <= 0 || avgCost <= 0) return;
    
    // Standardize symbol
    if (symbol === 'BRK/B' || symbol === 'BRK-B' || symbol === 'BRK B') {
      symbol = 'BRK.B';
    }
    
    if (!positionsBySymbol[symbol]) {
      positionsBySymbol[symbol] = [];
    }
    
    positionsBySymbol[symbol].push({
      symbol,
      quantity,
      avgCost,
      date: positionDate,
      originalRow: row,
      rowIndex: index
    });
  });
  
  // Process each symbol for stock split corrections
  Object.entries(positionsBySymbol).forEach(([symbol, positions]) => {
    console.log(`\\n📊 Processing ${symbol}: ${positions.length} positions`);
    
    // Get current market price for comparison (would need FMP API call in real implementation)
    let currentMarketPrice = null;
    // TODO: Integrate with FMP API to get current price
    // currentMarketPrice = await fmpService.getQuote(symbol).price;
    
    // Detect and correct stock splits
    const splitAnalysis = detectAndCorrectStockSplits(positions, symbol, currentMarketPrice);
    
    if (splitAnalysis.splitDetected) {
      splitCorrections.push({
        symbol,
        ...splitAnalysis.summary
      });
      
      warnings.push({
        type: 'stock_split_correction',
        message: `Applied stock split corrections for ${symbol}: ${splitAnalysis.summary.splitsDetected} positions adjusted with ${splitAnalysis.summary.highConfidenceCorrections} high-confidence corrections`,
        severity: 'info',
        symbol,
        details: splitAnalysis.summary
      });
    }
    
    // Convert corrected positions to transactions
    splitAnalysis.correctedPositions.forEach(position => {
      transactions.push({
        date: position.date,
        action: 'BUY',
        symbol: position.symbol,
        quantity: position.quantity,
        price: position.avgCost,
        fees: 0,
        account: accountName,
        isPositionImport: true,
        splitAdjusted: position.splitAdjusted || false,
        splitDetails: position.splitDetails || null,
        originalQuantity: position.originalQuantity,
        originalAvgCost: position.originalAvgCost
      });
      
      console.log(`✅ Imported ${position.splitAdjusted ? 'SPLIT-CORRECTED' : 'standard'} position: ${position.symbol} - ${position.quantity} shares @ $${position.avgCost.toFixed(4)}`);
    });
  });
  
  // Add comprehensive split correction warning
  if (splitCorrections.length > 0) {
    warnings.push({
      type: 'comprehensive_split_corrections',
      message: `Stock split corrections applied to ${splitCorrections.length} symbols: ${splitCorrections.map(s => `${s.symbol} (${s.splitsDetected} positions)`).join(', ')}`,
      severity: 'info',
      splitCorrections
    });
    
    console.log('\\n🎉 STOCK SPLIT CORRECTION SUMMARY:');
    splitCorrections.forEach(correction => {
      console.log(`  • ${correction.symbol}: ${correction.splitsDetected} positions corrected (${correction.highConfidenceCorrections} high confidence)`);
    });
  }
  
  return {
    format: 'positions',
    transactions,
    summary: {
      totalTransactions: transactions.length,
      symbols: [...new Set(transactions.map(t => t.symbol))],
      splitCorrections: splitCorrections.length,
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    },
    warnings,
    splitCorrections
  };
}

export default {
  detectAndCorrectStockSplits,
  parsePositionsCSVWithSplitCorrection,
  STOCK_SPLIT_HISTORY
};
