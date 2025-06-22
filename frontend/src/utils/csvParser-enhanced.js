// Enhanced CSV Parser with better cost basis handling and error reporting

// FIXED: Enhanced position parser with better cost basis detection
export function parsePositionsCSV(csvText, accountName = 'Unknown') {
  console.log('*** ENHANCED: Parsing positions CSV for account:', accountName);
  
  const lines = csvText.split(/\r?\n/);
  const transactions = [];
  const warnings = [];
  
  // Try to detect position format more broadly
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();
    // Look for key position indicators - be more flexible
    if ((line.includes('symbol') || line.includes('ticker')) && 
        (line.includes('quantity') || line.includes('shares') || line.includes('qty')) && 
        (line.includes('cost basis') || line.includes('average cost') || line.includes('avg cost') || 
         line.includes('cost per share') || line.includes('basis') || line.includes('price paid'))) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('Could not find position headers. Looking for Symbol, Quantity, and Cost Basis columns.');
  }
  
  const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/['"]/g, ''));
  console.log('Position headers:', headers);
  
  // ENHANCED: Map columns with better flexibility
  const colMap = {};
  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    
    // Symbol detection
    if (h.includes('symbol') || h.includes('ticker') || h === 'stock') colMap.symbol = index;
    
    // Description/Name detection
    if (h.includes('description') || h.includes('name') || h.includes('company')) colMap.description = index;
    
    // Quantity detection
    if (h.includes('quantity') || h.includes('qty') || h.includes('shares') || h === 'units') colMap.quantity = index;
    
    // ENHANCED: Better cost basis detection
    if (h.includes('cost basis total') || h === 'cost basis' || h.includes('total cost') || 
        h.includes('total value') || h.includes('book value')) colMap.costBasis = index;
    
    // ENHANCED: Better average cost detection
    if (h.includes('average cost') || h.includes('avg cost') || h.includes('cost per share') || 
        h.includes('price paid') || h.includes('unit cost') || h.includes('basis per share') ||
        (h.includes('cost') && h.includes('share')) || h === 'avg price') colMap.avgCost = index;
    
    // Account detection - FIXED to avoid "% of Account"
    if ((h === 'account' || h === 'account name' || h === 'account number') && 
        !h.includes('%') && !h.includes('percent')) colMap.account = index;
    
    // Current value detection
    if (h.includes('current value') || h.includes('market value') || h.includes('current market value')) colMap.currentValue = index;
    
    // ENHANCED: Additional fields that might help with cost basis
    if (h.includes('total gain') || h.includes('unrealized')) colMap.totalGain = index;
    if (h.includes('last price') || h.includes('current price')) colMap.currentPrice = index;
  });
  
  console.log('ENHANCED Column mapping:', colMap);
  
  // Parse data rows
  const dataRows = lines.slice(headerIndex + 1)
    .filter(line => line.trim() && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('account total'))
    .map(line => {
      // Handle quoted CSV values better
      const matches = line.match(/(".*?"|[^,]+)/g);
      return matches ? matches.map(m => m.replace(/['"]/g, '').trim()) : [];
    });
  
  let skippedCount = 0;
  let importedCount = 0;
  const positionSummary = [];
  const costBasisIssues = [];
  
  dataRows.forEach((row, index) => {
    if (row.length < 3) return;
    
    let symbol = row[colMap.symbol]?.toString().toUpperCase().trim() || '';
    const quantity = parseFloat(row[colMap.quantity]?.replace(/[,$]/g, '')) || 0;
    const costBasisTotal = parseFloat(row[colMap.costBasis]?.replace(/[$,()]/g, '')) || 0;
    const avgCost = parseFloat(row[colMap.avgCost]?.replace(/[$,()]/g, '')) || 0;
    const currentValue = parseFloat(row[colMap.currentValue]?.replace(/[$,()]/g, '')) || 0;
    const currentPrice = parseFloat(row[colMap.currentPrice]?.replace(/[$,()]/g, '')) || 0;
    
    // Debug specific symbols
    if (symbol === 'NVDA' || symbol === 'NVIDIA' || symbol.includes('NVIDIA')) {
      console.log(`*** NVIDIA DEBUG ***`);
      console.log(`Raw data:`, row);
      console.log(`Symbol: ${symbol}, Qty: ${quantity}, AvgCost: ${avgCost}, CostBasis: ${costBasisTotal}, CurrentValue: ${currentValue}`);
    }
    
    if (symbol === 'COHR' || symbol.includes('COHERENT')) {
      console.log(`*** COHERENT DEBUG ***`);
      console.log(`Raw data:`, row);
      console.log(`Symbol: ${symbol}, Qty: ${quantity}, AvgCost: ${avgCost}, CostBasis: ${costBasisTotal}, CurrentValue: ${currentValue}`);
    }
    
    // Enhanced filtering for valid positions
    if (!symbol || symbol === '--' || symbol.includes('**') || symbol.includes('CORE') || 
        symbol.includes('SWEEP') || symbol.includes('MONEY MARKET') || symbol.includes('CASH') ||
        symbol.includes('FDIC') || quantity <= 0) {
      console.log(`Skipping invalid position: ${symbol} (qty: ${quantity})`);
      skippedCount++;
      return;
    }
    
    // ENHANCED: Better symbol standardization
    if (symbol === 'BRK/B' || symbol === 'BRK-B' || symbol === 'BRK B') {
      symbol = 'BRK.B';
    }
    
    // ENHANCED: More aggressive cost basis calculation
    let pricePerShare = 0;
    
    // Method 1: Use average cost if available
    if (avgCost > 0) {
      pricePerShare = avgCost;
      console.log(`${symbol}: Using avgCost ${pricePerShare}`);
    }
    // Method 2: Calculate from cost basis total
    else if (costBasisTotal > 0 && quantity > 0) {
      pricePerShare = costBasisTotal / quantity;
      console.log(`${symbol}: Calculated from costBasisTotal ${costBasisTotal}/${quantity} = ${pricePerShare}`);
    }
    // Method 3: Try to derive from current value (risky but better than nothing)
    else if (currentValue > 0 && currentPrice > 0 && quantity > 0) {
      // This is the current market value, not cost basis, but it's a fallback
      pricePerShare = currentValue / quantity;
      console.log(`${symbol}: Using currentValue fallback ${currentValue}/${quantity} = ${pricePerShare}`);
      costBasisIssues.push(`${symbol}: No cost basis found, using current market value as fallback`);
    }
    
    // ENHANCED: Better validation and error reporting
    if (pricePerShare <= 0) {
      console.log(`❌ SKIPPING ${symbol} - no valid cost basis found:`);
      console.log(`   AvgCost: ${avgCost}, CostBasisTotal: ${costBasisTotal}, CurrentValue: ${currentValue}`);
      console.log(`   Raw avgCost: "${row[colMap.avgCost]}", Raw costBasis: "${row[colMap.costBasis]}"`);
      skippedCount++;
      costBasisIssues.push(`${symbol}: No valid cost basis data found - check your CSV export settings`);
      return;
    }
    
    // ENHANCED: Sanity check for unrealistic prices
    if (pricePerShare > 10000) {
      console.log(`⚠️  WARNING: ${symbol} has very high cost basis: $${pricePerShare.toFixed(2)} - please verify`);
      costBasisIssues.push(`${symbol}: Unusually high cost basis $${pricePerShare.toFixed(2)} - please verify`);
    }
    
    // Import the position
    const accountDisplayName = accountName; // Always use provided account name
    
    transactions.push({
      date: new Date().toISOString().split('T')[0], // Use today's date
      action: 'BUY',
      symbol: symbol,
      quantity: quantity,
      price: pricePerShare,
      fees: 0,
      account: accountDisplayName,
      isPositionImport: true // Flag to indicate this is from position import
    });
    
    positionSummary.push({
      symbol: symbol,
      quantity: quantity,
      avgCost: pricePerShare,
      totalValue: quantity * pricePerShare,
      account: accountDisplayName,
      method: avgCost > 0 ? 'avgCost' : costBasisTotal > 0 ? 'calculated' : 'fallback'
    });
    
    console.log(`✅ Imported position: ${symbol} - ${quantity} shares @ $${pricePerShare.toFixed(2)} (${accountDisplayName})`);
    importedCount++;
  });
  
  // ENHANCED: Add warnings about cost basis issues
  if (costBasisIssues.length > 0) {
    warnings.push({
      type: 'cost_basis_issues',
      message: `Cost basis issues found for ${costBasisIssues.length} positions: ${costBasisIssues.join('; ')}`,
      severity: 'warning'
    });
  }
  
  // Add warning about position imports
  if (importedCount > 0) {
    warnings.push({
      type: 'position_import',
      message: 'These positions will be imported as BUY transactions with today\'s date. This will not include any previously sold positions.',
      severity: 'warning'
    });
  }
  
  console.log(`*** ENHANCED: Position import summary: ${importedCount} imported, ${skippedCount} skipped ***`);
  
  return {
    format: 'positions',
    transactions,
    summary: {
      totalTransactions: transactions.length,
      symbols: [...new Set(transactions.map(t => t.symbol))],
      totalValue: transactions.reduce((sum, t) => sum + (t.quantity * t.price), 0),
      importedCount,
      skippedCount,
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    },
    warnings,
    positionSummary,
    costBasisIssues
  };
}

// Enhanced main parser that handles both transactions and positions
export function parsePortfolioCSV(csvText, accountName = 'Unknown') {
  console.log('*** ENHANCED: Starting CSV parse for account:', accountName);
  console.log('First 500 chars:', csvText.substring(0, 500));
  
  // First, check if this is a positions file by looking at the content
  const lowerText = csvText.toLowerCase();
  const firstLine = csvText.split('\n')[0].toLowerCase();
  
  // Enhanced position indicators - more comprehensive list
  const positionIndicators = [
    'cost basis total',
    'average cost basis',
    'total gain/loss',
    'percent of account',
    'current value',
    'market value',
    'unrealized gain',
    'gain/loss',
    'last price',
    'cost basis',
    'average cost',
    'total cost',
    'price paid',
    'unit cost'
  ];
  
  // Count how many position indicators we find
  let positionIndicatorCount = 0;
  positionIndicators.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      positionIndicatorCount++;
      console.log(`Found position indicator: ${indicator}`);
    }
  });
  
  // Check if it's missing transaction indicators
  const hasActionColumn = lowerText.includes(',action,') || lowerText.includes('"action"') || 
                         firstLine.includes('action');
  const hasBuySellWords = lowerText.includes(' buy ') || lowerText.includes(' sell ') || 
                          lowerText.includes(' bought ') || lowerText.includes(' sold ') ||
                          lowerText.includes('purchase') || lowerText.includes('sale');
  
  console.log(`Position indicators found: ${positionIndicatorCount}`);
  console.log(`Has action column: ${hasActionColumn}`);
  console.log(`Has buy/sell words: ${hasBuySellWords}`);
  
  // Enhanced detection logic
  // If we have ANY position indicators and no action column, it's likely a positions file
  if (positionIndicatorCount >= 1 && !hasActionColumn) {
    console.log('*** ENHANCED: Detected positions file based on indicators');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // Check if headers strongly suggest positions
  if ((firstLine.includes('cost basis') || firstLine.includes('gain/loss') || 
       firstLine.includes('current value') || firstLine.includes('market value')) && 
      !firstLine.includes('action')) {
    console.log('*** ENHANCED: Detected positions file based on headers');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // Additional check: if file name suggests positions
  if (firstLine.includes('symbol') && firstLine.includes('quantity') && 
      (firstLine.includes('price') || firstLine.includes('value')) && 
      !hasBuySellWords && !hasActionColumn) {
    console.log('*** ENHANCED: Detected positions file based on structure');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // Otherwise, use the transaction parser
  console.log('*** ENHANCED: Using transaction parser...');
  
  // Split into lines and handle different line endings
  const lines = csvText.split(/\r?\n/);
  console.log('Total lines:', lines.length);
  
  // Find the header row (first row with multiple columns)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = lines[i].split(',');
    console.log(`Line ${i} has ${cols.length} columns:`, lines[i].substring(0, 100));
    if (cols.length > 3) {
      headerIndex = i;
      break;
    }
  }
  
  const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('Using headers from line', headerIndex, ':', headers);
  
  const dataRows = lines.slice(headerIndex + 1)
    .filter(line => line.trim())
    .map(line => {
      // Handle quoted values properly
      const matches = line.match(/(".*?"|[^,]+)/g);
      return matches ? matches.map(m => m.replace(/"/g, '').trim()) : [];
    });
  
  console.log('Data rows:', dataRows.length);
  
  // Detect broker format
  const format = detectBrokerFormat(headers);
  console.log('Detected format:', format);
  
  let transactions = [];
  let warnings = [];
  
  switch (format) {
    case 'schwab':
      const schwabResult = parseSchwabCSV(dataRows, headers, accountName);
      transactions = schwabResult.transactions || schwabResult;
      warnings = schwabResult.warnings || [];
      break;
    case 'fidelity':
      const fidelityResult = parseFidelityCSV(dataRows, headers, accountName);
      transactions = fidelityResult.transactions || fidelityResult;
      warnings = fidelityResult.warnings || [];
      break;
    case 'generic':
      // For generic format, use Schwab parser as fallback
      const genericResult = parseSchwabCSV(dataRows, headers, accountName);
      transactions = genericResult.transactions || genericResult;
      warnings = genericResult.warnings || [];
      break;
    default:
      console.error('Unknown format. Headers:', headers);
      throw new Error('Unable to detect CSV format. Please ensure your CSV has columns for: Symbol, Quantity, Price, and Date. Detected headers: ' + headers.join(', '));
  }
  
  console.log('*** ENHANCED: Final transactions:', transactions.length);
  if (transactions.length > 0) {
    console.log('First transaction:', transactions[0]);
  }
  
  return {
    format,
    transactions,
    summary: {
      totalTransactions: transactions.length,
      symbols: [...new Set(transactions.map(t => t.symbol))],
      dateRange: {
        start: transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0]?.date || ''),
        end: transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0]?.date || '')
      }
    },
    warnings
  };
}

// Detect which broker format based on column headers
export function detectBrokerFormat(headers) {
  const headerStr = headers.join(',').toLowerCase();
  
  console.log('CSV Headers detected:', headers);
  console.log('Headers string:', headerStr);
  
  // Charles Schwab format detection
  if (headerStr.includes('symbol') && headerStr.includes('quantity') && 
      (headerStr.includes('price') || headerStr.includes('amount'))) {
    return 'schwab';
  }
  
  // Fidelity format detection - check for various possible formats
  if ((headerStr.includes('symbol') || headerStr.includes('security id')) && 
      (headerStr.includes('quantity') || headerStr.includes('shares')) && 
      (headerStr.includes('acquisition') || headerStr.includes('price') || headerStr.includes('run date'))) {
    return 'fidelity';
  }
  
  // Alternative Schwab format
  if (headerStr.includes('action') && headerStr.includes('symbol') && headerStr.includes('quantity')) {
    return 'schwab';
  }
  
  // Generic format (if columns are named appropriately)
  if (headerStr.includes('symbol') && (headerStr.includes('quantity') || headerStr.includes('shares'))) {
    return 'generic';
  }
  
  return 'unknown';
}

// Parse Schwab CSV format - ENHANCED to handle buy/sell only
export function parseSchwabCSV(rows, headers, accountName = 'Schwab') {
  console.log('*** ENHANCED: Parsing Schwab CSV with', rows.length, 'rows for account:', accountName);
  const transactions = [];
  const warnings = [];
  let skippedTransactions = 0;
  
  // Find column indices (case-insensitive)
  const colMap = {};
  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    if (h.includes('date')) colMap.date = index;
    if (h.includes('action')) colMap.action = index;
    if (h.includes('symbol')) colMap.symbol = index;
    if (h.includes('quantity')) colMap.quantity = index;
    if (h.includes('price')) colMap.price = index;
    if (h.includes('amount')) colMap.amount = index;
    if (h.includes('fees') || h.includes('commission')) colMap.fees = index;
  });
  
  console.log('Column mapping:', colMap);
  
  rows.forEach((row, index) => {
    if (row.length < 3) return; // Skip empty rows
    
    // Debug first few rows
    if (index < 3) {
      console.log(`Row ${index}:`, row);
    }
    
    const action = row[colMap.action]?.toString().toUpperCase() || '';
    
    // STRICT: Only accept actual buy/sell transactions
    const isBuy = action.includes('YOU BOUGHT') || action === 'BUY' || 
                  action === 'BOUGHT' || action.includes('PURCHASE');
    const isSell = action.includes('YOU SOLD') || action === 'SELL' || 
                   action === 'SOLD';
    
    if (!isBuy && !isSell) {
      if (index < 5) console.log(`Skipping row ${index} - not a buy/sell transaction:`, action);
      skippedTransactions++;
      return;
    }
    
    let symbol = row[colMap.symbol]?.toString().toUpperCase().trim() || '';
    const quantity = parseFloat(row[colMap.quantity]) || 0;
    const price = parseFloat(row[colMap.price]) || 0;
    
    // Special handling for BRK
    if (symbol === 'BRK/B' || symbol === 'BRK-B') {
      symbol = 'BRK.B';
    }
    
    // If no price column, try to extract from amount
    let finalPrice = price;
    if (finalPrice === 0 && colMap.amount !== undefined) {
      const amount = Math.abs(parseFloat(row[colMap.amount]) || 0);
      if (amount > 0 && quantity > 0) {
        finalPrice = amount / quantity;
      }
    }
    
    if (symbol && quantity > 0 && finalPrice > 0) {
      transactions.push({
        date: row[colMap.date] || new Date().toISOString().split('T')[0],
        action: isBuy ? 'BUY' : 'SELL',
        symbol: symbol,
        quantity: quantity,
        price: finalPrice,
        fees: parseFloat(row[colMap.fees]) || 0,
        account: accountName
      });
    }
  });
  
  if (skippedTransactions > 0) {
    warnings.push({
      type: 'skipped_transactions',
      message: `Skipped ${skippedTransactions} non-buy/sell transactions (dividends, fees, etc.)`,
      severity: 'info'
    });
  }
  
  console.log('*** ENHANCED: Parsed', transactions.length, 'Schwab transactions');
  return { transactions, warnings };
}

// Parse Fidelity CSV format
export function parseFidelityCSV(rows, headers, accountName = 'Fidelity') {
  console.log('*** ENHANCED: Parsing Fidelity CSV with', rows.length, 'rows for account:', accountName);
  const transactions = [];
  const warnings = [];
  let skippedTransactions = 0;
  
  // Find column indices (case-insensitive and flexible)
  const colMap = {};
  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    if (h.includes('run date') || h.includes('acquisition date') || h.includes('date')) colMap.date = index;
    if (h.includes('action') || h.includes('transaction') || h.includes('description')) colMap.action = index;
    if (h.includes('symbol') || h.includes('security id')) colMap.symbol = index;
    if (h.includes('quantity') || h.includes('shares')) colMap.quantity = index;
    if (h.includes('price') || h.includes('acquisition price') || h.includes('unit price')) colMap.price = index;
    if (h.includes('commission') || h.includes('fees')) colMap.fees = index;
    if (h.includes('amount')) colMap.amount = index;
  });
  
  console.log('Column mapping:', colMap);
  
  rows.forEach((row, index) => {
    if (row.length < 3) return; // Skip empty rows
    
    // Debug first few rows
    if (index < 3) {
      console.log(`Row ${index}:`, row);
    }
    
    // Fidelity might have different action descriptions
    const actionText = row[colMap.action]?.toString().toLowerCase() || '';
    let action = '';
    
    // STRICT: Only accept actual buy/sell transactions
    if (actionText.includes('you bought') || actionText === 'buy' || 
        actionText === 'bought' || actionText.includes('purchase')) {
      action = 'BUY';
    } else if (actionText.includes('you sold') || actionText === 'sell' || 
               actionText === 'sold') {
      action = 'SELL';
    } else {
      if (index < 5) console.log(`Skipping row ${index} - not a buy/sell transaction:`, actionText);
      skippedTransactions++;
      return; // Skip non buy/sell transactions
    }
    
    let symbol = row[colMap.symbol]?.toString().toUpperCase().trim() || '';
    const quantity = Math.abs(parseFloat(row[colMap.quantity]) || 0); // Fidelity might use negative for sells
    let price = parseFloat(row[colMap.price]) || 0;
    
    // Special handling for BRK
    if (symbol === 'BRK/B' || symbol === 'BRK-B') {
      symbol = 'BRK.B';
    }
    
    // If no price, try to calculate from amount
    if (price === 0 && colMap.amount !== undefined) {
      const amount = Math.abs(parseFloat(row[colMap.amount]) || 0);
      if (amount > 0 && quantity > 0) {
        price = amount / quantity;
      }
    }
    
    if (symbol && quantity > 0 && price > 0) {
      transactions.push({
        date: row[colMap.date] || new Date().toISOString().split('T')[0],
        action: action,
        symbol: symbol,
        quantity: quantity,
        price: price,
        fees: parseFloat(row[colMap.fees]) || 0,
        account: accountName
      });
    }
  });
  
  if (skippedTransactions > 0) {
    warnings.push({
      type: 'skipped_transactions',
      message: `Skipped ${skippedTransactions} non-buy/sell transactions (dividends, fees, etc.)`,
      severity: 'info'
    });
  }
  
  console.log('*** ENHANCED: Parsed', transactions.length, 'Fidelity transactions');
  return { transactions, warnings };
}