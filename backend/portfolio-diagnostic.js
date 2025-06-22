// Portfolio Diagnostic Tool
// Run this to debug portfolio issues

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function runDiagnostics() {
  console.log('=== Portfolio Diagnostics ===\n');
  
  try {
    // 1. Check portfolio data
    console.log('1. Fetching portfolio data...');
    const portfolioRes = await fetch(`${API_BASE}/portfolio/portfolio_1`);
    const portfolio = await portfolioRes.json();
    
    console.log('\nPortfolio Summary:');
    console.log(`- Total Holdings: ${Object.keys(portfolio.holdings || {}).length}`);
    console.log(`- Total Value: $${portfolio.summary?.totalValue?.toFixed(2) || 0}`);
    console.log(`- Total Cost: $${portfolio.summary?.totalCost?.toFixed(2) || 0}`);
    console.log(`- Total Gain: $${portfolio.summary?.totalGain?.toFixed(2) || 0} (${portfolio.summary?.totalGainPercent?.toFixed(2)}%)`);
    
    // 2. Check individual holdings
    console.log('\n2. Holdings with price issues:');
    const priceIssues = [];
    
    for (const [symbol, holding] of Object.entries(portfolio.holdings || {})) {
      const hasPriceIssue = !holding.currentPrice || holding.currentPrice === holding.avgCost;
      
      if (hasPriceIssue || symbol.includes('BRK')) {
        priceIssues.push({
          symbol,
          quantity: holding.quantity,
          avgCost: holding.avgCost,
          currentPrice: holding.currentPrice,
          issue: hasPriceIssue ? 'No live price' : 'Check price'
        });
      }
    }
    
    if (priceIssues.length > 0) {
      console.table(priceIssues);
    } else {
      console.log('No price issues detected');
    }
    
    // 3. Check transactions
    console.log('\n3. Fetching transaction history...');
    const txnRes = await fetch(`${API_BASE}/portfolio/portfolio_1/transactions`);
    const transactions = await txnRes.json();
    
    console.log(`Total transactions: ${transactions.length}`);
    
    // Group by symbol and account
    const txnSummary = {};
    transactions.forEach(txn => {
      const key = `${txn.symbol}-${txn.account}`;
      if (!txnSummary[key]) {
        txnSummary[key] = { 
          symbol: txn.symbol, 
          account: txn.account,
          buys: 0, 
          sells: 0, 
          totalBought: 0, 
          totalSold: 0 
        };
      }
      
      if (txn.action === 'BUY') {
        txnSummary[key].buys++;
        txnSummary[key].totalBought += txn.quantity;
      } else {
        txnSummary[key].sells++;
        txnSummary[key].totalSold += txn.quantity;
      }
    });
    
    console.log('\nTransaction Summary by Symbol/Account:');
    console.table(Object.values(txnSummary));
    
    // 4. Check debug endpoint
    console.log('\n4. Fetching debug data...');
    const debugRes = await fetch(`${API_BASE}/portfolio/portfolio_1/debug`);
    const debugData = await debugRes.json();
    
    console.log('\nAccount Summary:');
    console.table(debugData.accountSummary);
    
    // 5. Test price fetching for problem symbols
    console.log('\n5. Testing price fetch for problem symbols...');
    const testSymbols = ['BRK.B', 'NVDA', 'AAPL'];
    
    for (const symbol of testSymbols) {
      try {
        console.log(`\nTesting ${symbol}...`);
        // First check if we can get the quote directly
        const quoteRes = await fetch(`${API_BASE}/stocks/quote/${symbol}`);
        if (quoteRes.ok) {
          const quote = await quoteRes.json();
          console.log(`✓ ${symbol}: $${quote.price || 'N/A'} (${quote.change || 0} / ${quote.changePercent || 0}%)`);
        } else {
          console.log(`✗ ${symbol}: Failed to fetch - ${quoteRes.status}`);
        }
      } catch (err) {
        console.log(`✗ ${symbol}: Error - ${err.message}`);
      }
    }
    
    // 6. Check for duplicate positions
    console.log('\n6. Checking for duplicate or incorrect positions...');
    const positionCheck = {};
    
    for (const [symbol, holding] of Object.entries(portfolio.holdings || {})) {
      const netPosition = holding.quantity;
      const accounts = Object.entries(holding.accounts || {});
      
      console.log(`\n${symbol}:`);
      console.log(`  Total Quantity: ${netPosition}`);
      console.log(`  Avg Cost: $${holding.avgCost.toFixed(2)}`);
      console.log(`  Current Price: $${(holding.currentPrice || holding.avgCost).toFixed(2)}`);
      console.log(`  Accounts:`, accounts.map(([acc, data]) => `${acc}: ${data.quantity}`).join(', '));
      
      // Check if quantities match
      const accountTotal = accounts.reduce((sum, [, data]) => sum + data.quantity, 0);
      if (Math.abs(accountTotal - netPosition) > 0.01) {
        console.log(`  ⚠️  WARNING: Account total (${accountTotal}) doesn't match position (${netPosition})`);
      }
    }
    
  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

// Run diagnostics
console.log('Starting portfolio diagnostics...\n');
runDiagnostics().then(() => {
  console.log('\n=== Diagnostics Complete ===');
}).catch(err => {
  console.error('Fatal error:', err);
});
