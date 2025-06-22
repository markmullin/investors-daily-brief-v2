import express from 'express';
import marketService from '../services/marketService.js';

const router = express.Router();

// Temporary in-memory storage (we'll use knowledge graph via MCP later)
let portfolios = {
  portfolio_1: {
    id: 'portfolio_1',
    name: 'My Investment Portfolio',
    created_date: '2025-05-28',
    total_value: 0,
    transactions: [],
    holdings: {},
    accounts: {} // Track by account
  }
};

// Get portfolio data with live prices
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const portfolio = portfolios[id];
  
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  // Get live prices for all holdings
  const holdingsArray = Object.values(portfolio.holdings);
  const symbols = holdingsArray.map(h => h.symbol);
  
  console.log(`Fetching prices for ${symbols.length} symbols:`, symbols);
  
  if (symbols.length > 0) {
    try {
      // Fetch current prices
      const priceData = await marketService.getMultipleQuotes(symbols);
      
      console.log('Price data received:', Object.keys(priceData).length, 'quotes');
      
      // Update holdings with live data
      const enhancedHoldings = {};
      let totalValue = 0;
      let totalCost = 0;
      let dayChange = 0;
      let pricesFetched = 0;
      let pricesFailed = 0;
      
      for (const holding of holdingsArray) {
        const quote = priceData[holding.symbol] || {};
        
        // Use live price if available, otherwise fall back to average cost
        const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
        if (hasValidPrice) {
          pricesFetched++;
        } else {
          pricesFailed++;
          console.log(`No price for ${holding.symbol}, using cost basis ${holding.avgCost}`);
        }
        
        const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
        
        const currentValue = holding.quantity * currentPrice;
        const costBasis = holding.quantity * holding.avgCost;
        const gain = currentValue - costBasis;
        const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
        
        // Calculate day change only if we have valid quote data
        const dayChangeAmount = hasValidPrice && quote.change !== undefined
          ? holding.quantity * quote.change
          : 0;
        
        enhancedHoldings[holding.symbol] = {
          ...holding,
          currentPrice: currentPrice,
          currentValue: currentValue,
          costBasis: costBasis,
          gain: gain,
          gainPercent: gainPercent,
          dayChange: dayChangeAmount,
          dayChangePercent: quote.changePercent || 0,
          previousClose: quote.previousClose || currentPrice,
          hasLivePrice: hasValidPrice,
          priceTimestamp: quote.timestamp || null,
          priceError: quote.error || null
        };
        
        totalValue += currentValue;
        totalCost += costBasis;
        dayChange += dayChangeAmount;
      }
      
      console.log(`Prices fetched: ${pricesFetched}, failed: ${pricesFailed}`);
      console.log(`Total value: ${totalValue}, total cost: ${totalCost}`);
      
      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
      const dayChangePercent = (totalValue - dayChange) > 0 
        ? (dayChange / (totalValue - dayChange)) * 100 
        : 0;
      
      return res.json({
        ...portfolio,
        holdings: enhancedHoldings,
        summary: {
          totalValue: totalValue,
          totalCost: totalCost,
          totalGain: totalGain,
          totalGainPercent: totalGainPercent,
          dayChange: dayChange,
          dayChangePercent: dayChangePercent,
          lastUpdated: new Date().toISOString(),
          pricesFetched: pricesFetched,
          pricesFailed: pricesFailed
        }
      });
    } catch (error) {
      console.error('Error fetching live prices:', error);
      console.error('Error stack:', error.stack);
      
      // Calculate values using cost basis when price fetch fails completely
      let totalCostBasis = 0;
      const fallbackHoldings = {};
      
      for (const holding of holdingsArray) {
        const costBasis = holding.quantity * holding.avgCost;
        totalCostBasis += costBasis;
        
        fallbackHoldings[holding.symbol] = {
          ...holding,
          currentPrice: holding.avgCost,
          currentValue: costBasis,
          costBasis: costBasis,
          gain: 0,
          gainPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          previousClose: holding.avgCost,
          hasLivePrice: false,
          priceTimestamp: null,
          priceError: 'Price fetch failed'
        };
      }
      
      return res.json({
        ...portfolio,
        holdings: fallbackHoldings,
        summary: {
          totalValue: totalCostBasis,
          totalCost: totalCostBasis,
          totalGain: 0,
          totalGainPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          error: 'Unable to fetch live prices - showing cost basis',
          lastUpdated: new Date().toISOString()
        }
      });
    }
  }
  
  res.json(portfolio);
});

// Add a transaction
router.post('/:id/transaction', (req, res) => {
  const { id } = req.params;
  const { date, symbol, action, quantity, price, fees = 0, account = 'Unknown' } = req.body;
  
  const portfolio = portfolios[id];
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  // Validate required fields
  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({ error: 'Missing required fields: symbol, action, quantity, price' });
  }
  
  // Add transaction
  const transaction = {
    id: `txn_${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    symbol: symbol.toUpperCase(),
    action: action.toUpperCase(),
    quantity: parseFloat(quantity),
    price: parseFloat(price),
    fees: parseFloat(fees),
    account: account,
    total: (parseFloat(quantity) * parseFloat(price)) + parseFloat(fees)
  };
  
  portfolio.transactions.push(transaction);
  
  // Update holdings
  if (!portfolio.holdings[transaction.symbol]) {
    portfolio.holdings[transaction.symbol] = {
      symbol: transaction.symbol,
      quantity: 0,
      avgCost: 0,
      totalCost: 0,
      accounts: {} // Track by account
    };
  }
  
  const holding = portfolio.holdings[transaction.symbol];
  
  // Track by account
  if (!holding.accounts[account]) {
    holding.accounts[account] = { quantity: 0, totalCost: 0 };
  }
  
  if (transaction.action === 'BUY') {
    const newTotalCost = holding.totalCost + transaction.total;
    const newQuantity = holding.quantity + transaction.quantity;
    holding.quantity = newQuantity;
    holding.totalCost = newTotalCost;
    holding.avgCost = newTotalCost / newQuantity;
    
    // Update account-specific data
    holding.accounts[account].quantity += transaction.quantity;
    holding.accounts[account].totalCost += transaction.total;
  } else if (transaction.action === 'SELL') {
    holding.quantity -= transaction.quantity;
    
    // Update account-specific data
    holding.accounts[account].quantity -= transaction.quantity;
    
    if (holding.quantity <= 0.001) { // Use small epsilon for floating point
      delete portfolio.holdings[transaction.symbol];
    } else {
      // For simplicity, keep the same average cost (in reality, we'd track lots)
      holding.totalCost = holding.avgCost * holding.quantity;
    }
  }
  
  res.json({ 
    message: 'Transaction added successfully', 
    transaction,
    holdings: portfolio.holdings 
  });
});

// FIXED: Enhanced batch import with proper account isolation
router.post('/:id/transactions/batch', (req, res) => {
  const { id } = req.params;
  const { transactions, clearExisting = false, accountName = 'Unknown', mergeMode = 'add' } = req.body;
  
  const portfolio = portfolios[id];
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  if (!Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Transactions must be an array' });
  }
  
  console.log(`\n=== FIXED: Batch import: ${transactions.length} transactions for account: ${accountName}, merge mode: ${mergeMode} ===`);
  
  // Check if this is a position import
  const isPositionImport = transactions.length > 0 && transactions.every(t => t.isPositionImport);
  console.log(`Is position import: ${isPositionImport}`);
  
  // FIXED: Handle replace mode with proper account isolation
  if (mergeMode === 'replace') {
    console.log(`\nFIXED: Handling replace mode for account: ${accountName}`);
    
    if (isPositionImport) {
      // For position imports, handle account-specific replacement
      console.log(`Position import - clearing positions for account: ${accountName}`);
      
      // Get current holdings for this account
      const currentAccountSymbols = new Set();
      Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
        if (holding.accounts && holding.accounts[accountName] && holding.accounts[accountName].quantity > 0) {
          currentAccountSymbols.add(symbol);
        }
      });
      
      console.log(`Current symbols in ${accountName}:`, Array.from(currentAccountSymbols));
      
      // Get symbols in the new import
      const newSymbols = new Set(transactions.map(t => t.symbol.toUpperCase()));
      console.log(`New symbols being imported:`, Array.from(newSymbols));
      
      // Find symbols that need to be sold (in current but not in new)
      const symbolsToSell = Array.from(currentAccountSymbols).filter(s => !newSymbols.has(s));
      console.log(`Symbols to sell (no longer in positions):`, symbolsToSell);
      
      // Create SELL transactions for missing symbols
      const sellDate = new Date().toISOString().split('T')[0];
      symbolsToSell.forEach(symbol => {
        const holding = portfolio.holdings[symbol];
        const accountData = holding.accounts[accountName];
        if (accountData && accountData.quantity > 0) {
          console.log(`Creating SELL transaction for ${symbol}: ${accountData.quantity} shares`);
          
          // Create a sell transaction to close the position
          const sellTransaction = {
            id: `txn_sell_${Date.now()}_${symbol}`,
            date: sellDate,
            symbol: symbol,
            action: 'SELL',
            quantity: accountData.quantity,
            price: holding.avgCost, // Use average cost for the sell
            fees: 0,
            account: accountName,
            total: accountData.quantity * holding.avgCost,
            autoGenerated: true,
            reason: 'Position not in latest import'
          };
          
          portfolio.transactions.push(sellTransaction);
          
          // FIXED: Update holdings properly with account isolation
          holding.quantity -= accountData.quantity;
          if (holding.quantity > 0) {
            holding.totalCost = holding.avgCost * holding.quantity;
          }
          accountData.quantity = 0;
          accountData.totalCost = 0;
          
          // Remove holding if quantity is zero across all accounts
          if (holding.quantity <= 0.001) {
            delete portfolio.holdings[symbol];
          }
        }
      });
    } else {
      // FIXED: For transaction imports, only clear transactions for this specific account
      console.log(`Transaction import - clearing transactions for account: ${accountName}`);
      
      const originalTransactionCount = portfolio.transactions.length;
      portfolio.transactions = portfolio.transactions.filter(t => t.account !== accountName);
      const removedTransactionCount = originalTransactionCount - portfolio.transactions.length;
      console.log(`Removed ${removedTransactionCount} transactions for account ${accountName}`);
      
      // FIXED: Rebuild holdings ONLY for affected symbols, preserving other accounts
      const affectedSymbols = new Set();
      
      // Find all symbols that were affected by removing transactions
      Object.keys(portfolio.holdings).forEach(symbol => {
        const holding = portfolio.holdings[symbol];
        if (holding.accounts && holding.accounts[accountName]) {
          affectedSymbols.add(symbol);
        }
      });
      
      console.log(`Affected symbols for account ${accountName}:`, Array.from(affectedSymbols));
      
      // FIXED: Only rebuild holdings for affected symbols, preserve other accounts
      affectedSymbols.forEach(symbol => {
        const holding = portfolio.holdings[symbol];
        if (holding.accounts && holding.accounts[accountName]) {
          // Remove this account's data
          delete holding.accounts[accountName];
          
          // Recalculate totals from remaining accounts
          let totalQuantity = 0;
          let totalCost = 0;
          
          Object.values(holding.accounts).forEach(accountData => {
            totalQuantity += accountData.quantity || 0;
            totalCost += accountData.totalCost || 0;
          });
          
          if (totalQuantity > 0) {
            holding.quantity = totalQuantity;
            holding.totalCost = totalCost;
            holding.avgCost = totalCost / totalQuantity;
          } else {
            // No holdings left for this symbol
            delete portfolio.holdings[symbol];
          }
        }
      });
      
      // FIXED: Rebuild account data from remaining transactions for affected symbols only
      portfolio.transactions.forEach(txn => {
        if (affectedSymbols.has(txn.symbol)) {
          const holding = portfolio.holdings[txn.symbol];
          if (!holding) {
            // This symbol was completely removed, recreate it
            portfolio.holdings[txn.symbol] = {
              symbol: txn.symbol,
              quantity: 0,
              avgCost: 0,
              totalCost: 0,
              accounts: {}
            };
          }
          
          const holdingRef = portfolio.holdings[txn.symbol];
          if (!holdingRef.accounts[txn.account]) {
            holdingRef.accounts[txn.account] = { quantity: 0, totalCost: 0 };
          }
          
          // Recalculate from scratch for this account
          if (txn.action === 'BUY') {
            holdingRef.accounts[txn.account].quantity += txn.quantity;
            holdingRef.accounts[txn.account].totalCost += txn.total;
          } else if (txn.action === 'SELL') {
            holdingRef.accounts[txn.account].quantity -= txn.quantity;
          }
        }
      });
      
      // Recalculate overall holdings for affected symbols
      affectedSymbols.forEach(symbol => {
        const holding = portfolio.holdings[symbol];
        if (holding) {
          let totalQuantity = 0;
          let totalCost = 0;
          
          Object.values(holding.accounts).forEach(accountData => {
            totalQuantity += accountData.quantity || 0;
            totalCost += accountData.totalCost || 0;
          });
          
          if (totalQuantity > 0) {
            holding.quantity = totalQuantity;
            holding.totalCost = totalCost;
            holding.avgCost = totalCost / totalQuantity;
          } else {
            delete portfolio.holdings[symbol];
          }
        }
      });
    }
  } else if (clearExisting) {
    // Clear everything
    portfolio.transactions = [];
    portfolio.holdings = {};
  }
  
  let successCount = 0;
  const errors = [];
  const importedSymbols = new Set();
  
  // Process each transaction with validation
  transactions.forEach((txnData, index) => {
    try {
      const { date, symbol, action, quantity, price, fees = 0, account, isPositionImport } = txnData;
      
      // Validate required fields
      if (!symbol || !action || !quantity || !price) {
        errors.push({ index, error: 'Missing required fields' });
        return;
      }
      
      // Validate numeric values
      const parsedQuantity = parseFloat(quantity);
      const parsedPrice = parseFloat(price);
      const parsedFees = parseFloat(fees);
      
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        errors.push({ index, error: `Invalid quantity: ${quantity}` });
        return;
      }
      
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push({ index, error: `Invalid price: ${price}` });
        return;
      }
      
      const finalAccount = account || accountName;
      
      // Add transaction
      const transaction = {
        id: `txn_${Date.now()}_${index}`,
        date: date || new Date().toISOString().split('T')[0],
        symbol: symbol.toUpperCase(),
        action: action.toUpperCase(),
        quantity: parsedQuantity,
        price: parsedPrice,
        fees: parsedFees,
        account: finalAccount,
        total: (parsedQuantity * parsedPrice) + parsedFees,
        isPositionImport: isPositionImport || false
      };
      
      portfolio.transactions.push(transaction);
      importedSymbols.add(transaction.symbol);
      
      // Update holdings
      if (!portfolio.holdings[transaction.symbol]) {
        portfolio.holdings[transaction.symbol] = {
          symbol: transaction.symbol,
          quantity: 0,
          avgCost: 0,
          totalCost: 0,
          accounts: {}
        };
      }
      
      const holding = portfolio.holdings[transaction.symbol];
      
      // Initialize account tracking
      if (!holding.accounts[finalAccount]) {
        holding.accounts[finalAccount] = { quantity: 0, totalCost: 0, avgCost: 0 };
      }
      
      if (transaction.action === 'BUY') {
        // Update overall holding
        const newTotalCost = holding.totalCost + transaction.total;
        const newQuantity = holding.quantity + transaction.quantity;
        holding.quantity = newQuantity;
        holding.totalCost = newTotalCost;
        holding.avgCost = newTotalCost / newQuantity;
        
        // Update account-specific data
        const accountHolding = holding.accounts[finalAccount];
        const newAccountCost = accountHolding.totalCost + transaction.total;
        const newAccountQty = accountHolding.quantity + transaction.quantity;
        accountHolding.quantity = newAccountQty;
        accountHolding.totalCost = newAccountCost;
        accountHolding.avgCost = newAccountCost / newAccountQty;
      } else if (transaction.action === 'SELL') {
        // Update overall holding
        holding.quantity -= transaction.quantity;
        
        // Update account-specific data
        const accountHolding = holding.accounts[finalAccount];
        accountHolding.quantity -= transaction.quantity;
        
        // Adjust total costs proportionally
        if (holding.quantity <= 0.001) {
          delete portfolio.holdings[transaction.symbol];
        } else {
          holding.totalCost = holding.avgCost * holding.quantity;
          if (accountHolding.quantity > 0) {
            accountHolding.totalCost = accountHolding.avgCost * accountHolding.quantity;
          } else {
            accountHolding.totalCost = 0;
            accountHolding.avgCost = 0;
          }
        }
      }
      
      successCount++;
    } catch (error) {
      errors.push({ index, error: error.message });
    }
  });
  
  // Log summary
  console.log(`\nFIXED: Import complete: ${successCount} transactions imported for account ${accountName}`);
  console.log(`Symbols imported: ${Array.from(importedSymbols).join(', ')}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    console.log('First few errors:', errors.slice(0, 5));
  }
  
  // Log current holdings after import
  console.log('\nCurrent holdings after import:');
  Object.values(portfolio.holdings).forEach(h => {
    console.log(`- ${h.symbol}: ${h.quantity} shares @ $${h.avgCost.toFixed(2)} = $${(h.quantity * h.avgCost).toFixed(2)}`);
    if (h.accounts) {
      Object.entries(h.accounts).forEach(([acc, data]) => {
        if (data.quantity > 0) {
          console.log(`  └─ ${acc}: ${data.quantity} shares @ $${(data.avgCost || 0).toFixed(2)}`);
        }
      });
    }
  });
  
  res.json({ 
    message: `FIXED: Imported ${successCount} transactions successfully for ${accountName}`,
    successCount,
    errors,
    totalHoldings: Object.keys(portfolio.holdings).length,
    accountName,
    importedSymbols: Array.from(importedSymbols)
  });
});

// Debug endpoint to inspect portfolio data
router.get('/:id/debug', (req, res) => {
  const { id } = req.params;
  const portfolio = portfolios[id];
  
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  // Get account summary
  const accountSummary = {};
  portfolio.transactions.forEach(txn => {
    if (!accountSummary[txn.account]) {
      accountSummary[txn.account] = { transactions: 0, symbols: new Set() };
    }
    accountSummary[txn.account].transactions++;
    accountSummary[txn.account].symbols.add(txn.symbol);
  });
  
  // Convert sets to arrays
  Object.keys(accountSummary).forEach(account => {
    accountSummary[account].symbols = Array.from(accountSummary[account].symbols);
  });
  
  res.json({
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      totalTransactions: portfolio.transactions.length,
      totalHoldings: Object.keys(portfolio.holdings).length
    },
    accountSummary,
    recentTransactions: portfolio.transactions.slice(-10),
    holdings: Object.keys(portfolio.holdings).map(symbol => ({
      symbol,
      quantity: portfolio.holdings[symbol].quantity,
      avgCost: portfolio.holdings[symbol].avgCost,
      totalCost: portfolio.holdings[symbol].totalCost,
      accounts: portfolio.holdings[symbol].accounts
    }))
  });
});

// Get all holdings
router.get('/:id/holdings', (req, res) => {
  const { id } = req.params;
  const portfolio = portfolios[id];
  
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  res.json(portfolio.holdings);
});

// Get all transactions
router.get('/:id/transactions', (req, res) => {
  const { id } = req.params;
  const portfolio = portfolios[id];
  
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  res.json(portfolio.transactions);
});

// Clear portfolio (useful for testing)
router.delete('/:id/clear', (req, res) => {
  const { id } = req.params;
  
  if (!portfolios[id]) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  portfolios[id] = {
    id: id,
    name: portfolios[id].name,
    created_date: portfolios[id].created_date,
    total_value: 0,
    transactions: [],
    holdings: {},
    accounts: {}
  };
  
  res.json({ message: 'Portfolio cleared successfully' });
});

// Test endpoint for debugging price fetching
router.get('/test/prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    const quotes = await marketService.getMultipleQuotes([symbol]);
    res.json({
      symbol,
      quote: quotes[symbol] || null,
      success: quotes[symbol] && quotes[symbol].price !== null
    });
  } catch (error) {
    res.json({
      symbol,
      error: error.message,
      success: false
    });
  }
});

// Test endpoint
router.get('/test/hello', (req, res) => {
  res.json({ message: 'Portfolio API is working!' });
});

export default router;