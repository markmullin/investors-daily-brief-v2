// Enhanced CSV Parser with STOCK SPLIT CORRECTION integrated
// This fixes the NVIDIA $850 → $85 split issue and similar problems

import { applySplitAdjustments, hasKnownSplits, calculateCumulativeSplitRatio } from './stockSplitDatabase.js';

export function parsePositionsCSV(csvText, accountName = 'Unknown') {
  console.log('*** STOCK SPLIT ENHANCED: Parsing positions CSV for account:', accountName);
  
  const lines = csvText.split(/\r?\n/);
  const transactions = [];
  const warnings = [];
  const splitAdjustments = []; // Track what splits were applied
  
  // Try to detect position format more broadly - FIXED: Better detection for simple position files
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();
    // Look for key position indicators - ENHANCED: Added simple Symbol+Quantity+Price detection
    if ((line.includes('symbol') || line.includes('ticker')) && 
        (line.includes('quantity') || line.includes('shares') || line.includes('qty')) && 
        (line.includes('cost basis') || line.includes('average cost') || line.includes('avg cost') || 
         line.includes('cost per share') || line.includes('basis') || line.includes('price paid') ||
         line.includes('price'))) {  // This covers both complex and simple position files
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('Could not find position headers. Looking for Symbol, Quantity, and Cost Basis or Price columns.');
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
    
    // ENHANCED: Better average cost detection - FIXED: Added "price" support for simple CSV
    if (h.includes('average cost') || h.includes('avg cost') || h.includes('cost per share') || 
        h.includes('price paid') || h.includes('unit cost') || h.includes('basis per share') ||
        (h.includes('cost') && h.includes('share')) || h === 'avg price' || h === 'price') colMap.avgCost = index;
    
    // Account detection - ENHANCED for aggregation detection
    if ((h === 'account' || h === 'account name' || h === 'account number' || h === 'institution' || 
         h === 'account type' || h === 'source' || h === 'broker') && 
        !h.includes('%') && !h.includes('percent')) colMap.account = index;
    
    // Current value detection
    if (h.includes('current value') || h.includes('market value') || h.includes('current market value')) colMap.currentValue = index;
    
    // ENHANCED: Additional fields that might help with cost basis
    if (h.includes('total gain') || h.includes('unrealized')) colMap.totalGain = index;
    if (h.includes('last price') || h.includes('current price')) colMap.currentPrice = index;
    
    // *** NEW: Account aggregation detection ***
    if (h.includes('institution') || h.includes('institution name')) colMap.institution = index;
    if (h.includes('external') || h.includes('linked')) colMap.external = index;
    if (h.includes('source account') || h.includes('source')) colMap.sourceAccount = index;
    
    // Position status detection
    if (h.includes('status') || h.includes('position status')) colMap.status = index;
    if (h.includes('open') || h.includes('closed')) colMap.positionType = index;
    
    // Date detection for simple position files
    if (h.includes('date') || h === 'date') colMap.date = index;
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
  
  // *** NEW: Account aggregation analysis ***
  const accountAnalysis = analyzeAccountAggregation(dataRows, colMap, accountName);
  console.log('*** ACCOUNT AGGREGATION ANALYSIS ***', accountAnalysis);
  
  let skippedCount = 0;
  let importedCount = 0;
  let splitCorrectionCount = 0;
  const positionSummary = [];
  const costBasisIssues = [];
  const skippedPositions = []; // Track what was skipped and why
  const externalPositions = []; // Track positions from external accounts
  
  dataRows.forEach((row, index) => {
    if (row.length < 3) return;
    
    let symbol = row[colMap.symbol]?.toString().toUpperCase().trim() || '';
    const rawQuantity = parseFloat(row[colMap.quantity]?.replace(/[,$]/g, '')) || 0;
    const costBasisTotal = parseFloat(row[colMap.costBasis]?.replace(/[$,()]/g, '')) || 0;
    const rawAvgCost = parseFloat(row[colMap.avgCost]?.replace(/[$,()]/g, '')) || 0;
    const currentValue = parseFloat(row[colMap.currentValue]?.replace(/[$,()]/g, '')) || 0;
    const currentPrice = parseFloat(row[colMap.currentPrice]?.replace(/[$,()]/g, '')) || 0;
    const positionDate = row[colMap.date]?.toString().trim() || new Date().toISOString().split('T')[0];
    
    // *** NEW: Account source analysis ***
    const accountSource = row[colMap.account]?.toString().trim() || '';
    const institution = row[colMap.institution]?.toString().trim() || '';
    const external = row[colMap.external]?.toString().toLowerCase().trim() || '';
    const sourceAccount = row[colMap.sourceAccount]?.toString().trim() || '';
    
    // *** NEW: Check if this position is from an external/linked account ***
    const isExternalPosition = isPositionFromExternalAccount(
      symbol, accountSource, institution, external, sourceAccount, accountName, accountAnalysis
    );
    
    if (isExternalPosition.isExternal) {
      console.log(`🔗 EXTERNAL ACCOUNT POSITION: ${symbol} - ${isExternalPosition.reason}`);
      externalPositions.push({
        symbol: symbol,
        reason: isExternalPosition.reason,
        accountSource: accountSource,
        institution: institution,
        quantity: rawQuantity,
        currentValue: currentValue
      });
      skippedPositions.push({ 
        symbol, 
        reason: `External account (${isExternalPosition.reason})`, 
        quantity: rawQuantity,
        accountSource: accountSource
      });
      skippedCount++;
      return; // Skip external positions
    }
    
    // Standard position validation (keep existing logic)
    const status = row[colMap.status]?.toString().toLowerCase().trim() || '';
    const positionType = row[colMap.positionType]?.toString().toLowerCase().trim() || '';
    
    // Debug specific symbols
    if (symbol === 'NVDA' || symbol === 'NVIDIA' || symbol.includes('NVIDIA')) {
      console.log(`*** NVIDIA STOCK SPLIT DEBUG ***`);
      console.log(`Raw data:`, row);
      console.log(`Symbol: ${symbol}, RawQty: ${rawQuantity}, RawAvgCost: ${rawAvgCost}, CostBasis: ${costBasisTotal}, CurrentValue: ${currentValue}`);
      console.log(`AccountSource: ${accountSource}, Institution: ${institution}, External: ${external}`);
      console.log(`IsExternal: ${isExternalPosition.isExternal}, Reason: ${isExternalPosition.reason}`);
    }
    
    // Enhanced filtering for valid positions
    if (!symbol || symbol === '--' || symbol.includes('**') || symbol.includes('CORE') || 
        symbol.includes('SWEEP') || symbol.includes('MONEY MARKET') || symbol.includes('CASH') ||
        symbol.includes('FDIC')) {
      console.log(`❌ Skipping invalid position: ${symbol} (invalid symbol)`);
      skippedPositions.push({ symbol, reason: 'Invalid symbol', quantity: rawQuantity });
      skippedCount++;
      return;
    }
    
    // Enhanced quantity filtering
    if (rawQuantity <= 0) {
      console.log(`❌ Skipping zero/negative quantity: ${symbol} (qty: ${rawQuantity})`);
      skippedPositions.push({ symbol, reason: 'Zero or negative quantity', quantity: rawQuantity });
      skippedCount++;
      return;
    }
    
    // Skip closed positions if detected
    if (status.includes('closed') || positionType.includes('closed')) {
      console.log(`❌ Skipping closed position: ${symbol} (status: ${status || positionType})`);
      skippedPositions.push({ symbol, reason: 'Closed position', quantity: rawQuantity });
      skippedCount++;
      return;
    }
    
    // ENHANCED: Better symbol standardization
    if (symbol === 'BRK/B' || symbol === 'BRK-B' || symbol === 'BRK B') {
      symbol = 'BRK.B';
    }
    
    // ENHANCED: More aggressive cost basis calculation
    let rawPricePerShare = 0;
    
    // Method 1: Use average cost if available
    if (rawAvgCost > 0) {
      rawPricePerShare = rawAvgCost;
      console.log(`${symbol}: Using rawAvgCost/price ${rawPricePerShare}`);
    }
    // Method 2: Calculate from cost basis total
    else if (costBasisTotal > 0 && rawQuantity > 0) {
      rawPricePerShare = costBasisTotal / rawQuantity;
      console.log(`${symbol}: Calculated from costBasisTotal ${costBasisTotal}/${rawQuantity} = ${rawPricePerShare}`);
    }
    // Method 3: Try to derive from current value (risky but better than nothing)
    else if (currentValue > 0 && currentPrice > 0 && rawQuantity > 0) {
      // This is the current market value, not cost basis, but it's a fallback
      rawPricePerShare = currentValue / rawQuantity;
      console.log(`${symbol}: Using currentValue fallback ${currentValue}/${rawQuantity} = ${rawPricePerShare}`);
      costBasisIssues.push(`${symbol}: No cost basis found, using current market value as fallback`);
    }
    
    // ENHANCED: Better validation and error reporting
    if (rawPricePerShare <= 0) {
      console.log(`❌ SKIPPING ${symbol} - no valid cost basis found:`);
      console.log(`   AvgCost: ${rawAvgCost}, CostBasisTotal: ${costBasisTotal}, CurrentValue: ${currentValue}`);
      console.log(`   Raw avgCost: "${row[colMap.avgCost]}", Raw costBasis: "${row[colMap.costBasis]}"`);
      skippedPositions.push({ symbol, reason: 'No valid cost basis data', quantity: rawQuantity });
      skippedCount++;
      costBasisIssues.push(`${symbol}: No valid cost basis data found - check your CSV export settings`);
      return;
    }
    
    // *** STOCK SPLIT CORRECTION LOGIC ***
    console.log(`🔍 CHECKING STOCK SPLITS for ${symbol}: ${rawQuantity} shares @ $${rawPricePerShare.toFixed(2)}`);
    
    // Try to apply split adjustments (this is the core fix for NVIDIA etc.)
    const splitResult = applySplitAdjustments(symbol, rawQuantity, rawPricePerShare, positionDate);
    
    const finalQuantity = splitResult.adjustedQuantity;
    const finalPrice = splitResult.adjustedPrice;
    
    if (splitResult.splitInfo.applied) {
      console.log(`✅ STOCK SPLIT APPLIED to ${symbol}:`);
      console.log(`   Before: ${rawQuantity} shares @ $${rawPricePerShare.toFixed(2)} = $${(rawQuantity * rawPricePerShare).toFixed(2)}`);
      console.log(`   After:  ${finalQuantity} shares @ $${finalPrice.toFixed(2)} = $${(finalQuantity * finalPrice).toFixed(2)}`);
      console.log(`   Split ratio: ${splitResult.splitInfo.cumulativeRatio}:1`);
      
      splitAdjustments.push({
        symbol,
        originalQuantity: rawQuantity,
        originalPrice: rawPricePerShare,
        adjustedQuantity: finalQuantity,
        adjustedPrice: finalPrice,
        splitRatio: splitResult.splitInfo.cumulativeRatio,
        method: splitResult.splitInfo.method
      });
      
      splitCorrectionCount++;
    } else {
      console.log(`ℹ️  No split correction needed for ${symbol}`);
    }
    
    // ENHANCED: Sanity check for unrealistic prices (after split adjustment)
    if (finalPrice > 10000) {
      console.log(`⚠️  WARNING: ${symbol} has very high cost basis: $${finalPrice.toFixed(2)} - please verify`);
      costBasisIssues.push(`${symbol}: Unusually high cost basis $${finalPrice.toFixed(2)} - please verify`);
    }
    
    // Import the position (using split-adjusted values)
    const accountDisplayName = accountName; // Always use provided account name
    
    transactions.push({
      date: positionDate, // Use actual date from CSV or today's date
      action: 'BUY',
      symbol: symbol,
      quantity: finalQuantity, // SPLIT-ADJUSTED QUANTITY
      price: finalPrice, // SPLIT-ADJUSTED PRICE
      fees: 0,
      account: accountDisplayName,
      isPositionImport: true, // Flag to indicate this is from position import
      currentValue: currentValue, // Store current value for validation
      originalRow: row.slice(0, 5), // Store first 5 columns for debugging
      nativePosition: true, // Flag to indicate this is a native position, not external
      splitAdjusted: splitResult.splitInfo.applied, // Flag to indicate split was applied
      splitInfo: splitResult.splitInfo // Store split information for debugging
    });
    
    positionSummary.push({
      symbol: symbol,
      quantity: finalQuantity, // SPLIT-ADJUSTED
      avgCost: finalPrice, // SPLIT-ADJUSTED
      totalValue: finalQuantity * finalPrice,
      currentValue: currentValue,
      account: accountDisplayName,
      method: rawAvgCost > 0 ? 'avgCost' : costBasisTotal > 0 ? 'calculated' : 'fallback',
      splitAdjusted: splitResult.splitInfo.applied,
      splitRatio: splitResult.splitInfo.cumulativeRatio
    });
    
    if (splitResult.splitInfo.applied) {
      console.log(`✅ Imported SPLIT-CORRECTED position: ${symbol} - ${finalQuantity} shares @ $${finalPrice.toFixed(2)} (${accountDisplayName}) [${splitResult.splitInfo.cumulativeRatio}:1 split applied]`);
    } else {
      console.log(`✅ Imported native position: ${symbol} - ${finalQuantity} shares @ $${finalPrice.toFixed(2)} (${accountDisplayName})`);
    }
    
    importedCount++;
  });
  
  // *** NEW: Add split correction summary ***
  if (splitCorrectionCount > 0) {
    warnings.push({
      type: 'split_corrections_applied',
      message: `Applied stock split corrections to ${splitCorrectionCount} positions: ${splitAdjustments.map(adj => `${adj.symbol} (${adj.splitRatio}:1)`).join(', ')}`,
      severity: 'info',
      splitAdjustments: splitAdjustments
    });
    
    console.log('\n*** STOCK SPLIT CORRECTIONS APPLIED ***');
    splitAdjustments.forEach(adj => {
      console.log(`- ${adj.symbol}: ${adj.originalQuantity} → ${adj.adjustedQuantity} shares, $${adj.originalPrice.toFixed(2)} → $${adj.adjustedPrice.toFixed(2)}/share (${adj.splitRatio}:1 split)`);
    });
  }
  
  // *** NEW: Add detailed external positions summary ***
  if (externalPositions.length > 0) {
    console.log('\n*** EXTERNAL POSITIONS FILTERED OUT ***');
    externalPositions.forEach(pos => {
      console.log(`- ${pos.symbol}: ${pos.reason} (qty: ${pos.quantity}, source: ${pos.accountSource})`);
    });
    
    warnings.push({
      type: 'external_positions_filtered',
      message: `Filtered out ${externalPositions.length} positions from linked external accounts: ${externalPositions.map(p => `${p.symbol} (${p.reason})`).join(', ')}`,
      severity: 'info',
      externalPositions: externalPositions
    });
  }
  
  // Add detailed skipped positions summary
  if (skippedPositions.length > 0) {
    console.log('\n*** SKIPPED POSITIONS SUMMARY ***');
    skippedPositions.forEach(pos => {
      console.log(`- ${pos.symbol}: ${pos.reason} (qty: ${pos.quantity})`);
    });
    
    warnings.push({
      type: 'skipped_positions',
      message: `Skipped ${skippedPositions.length} positions: ${skippedPositions.map(p => `${p.symbol} (${p.reason})`).join(', ')}`,
      severity: 'info',
      skippedPositions: skippedPositions
    });
  }
  
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
    const splitNote = splitCorrectionCount > 0 ? ` Stock split corrections applied to ${splitCorrectionCount} positions.` : '';
    warnings.push({
      type: 'position_import',
      message: `Imported ${importedCount} native ${accountName} positions. External/linked account positions were automatically filtered out for clean account separation.${splitNote}`,
      severity: 'info'
    });
  }
  
  console.log(`*** STOCK SPLIT ENHANCED: Position import summary: ${importedCount} native imported, ${skippedCount} filtered (${externalPositions.length} external), ${splitCorrectionCount} split-corrected ***`);
  
  return {
    format: 'positions',
    transactions,
    summary: {
      totalTransactions: transactions.length,
      symbols: [...new Set(transactions.map(t => t.symbol))],
      totalValue: transactions.reduce((sum, t) => sum + (t.quantity * t.price), 0),
      importedCount,
      skippedCount,
      externalFilteredCount: externalPositions.length,
      splitCorrectionCount, // NEW: Track split corrections
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    },
    warnings,
    positionSummary,
    costBasisIssues,
    skippedPositions, // Return skipped positions for UI display
    externalPositions, // Return external positions for UI display
    splitAdjustments, // NEW: Return split adjustments for UI display
    accountAnalysis // Return analysis for debugging
  };
}

// *** NEW: Function to analyze if CSV contains multiple account aggregation ***
function analyzeAccountAggregation(dataRows, colMap, targetAccountName) {
  const analysis = {
    hasMultipleAccounts: false,
    accountSources: new Set(),
    institutions: new Set(),
    externalIndicators: new Set(),
    patterns: [],
    targetBroker: targetAccountName.toLowerCase()
  };
  
  // Sample first 20 rows to analyze patterns
  const sampleRows = dataRows.slice(0, Math.min(20, dataRows.length));
  
  sampleRows.forEach(row => {
    if (row.length < 3) return;
    
    const accountSource = row[colMap.account]?.toString().trim() || '';
    const institution = row[colMap.institution]?.toString().trim() || '';
    const external = row[colMap.external]?.toString().trim() || '';
    const sourceAccount = row[colMap.sourceAccount]?.toString().trim() || '';
    
    if (accountSource) analysis.accountSources.add(accountSource);
    if (institution) analysis.institutions.add(institution);
    if (external) analysis.externalIndicators.add(external);
    if (sourceAccount) analysis.accountSources.add(sourceAccount);
  });
  
  // Detect if we have multiple account sources
  analysis.hasMultipleAccounts = analysis.accountSources.size > 1 || analysis.institutions.size > 1;
  
  // Convert sets to arrays for easier processing
  analysis.accountSources = Array.from(analysis.accountSources);
  analysis.institutions = Array.from(analysis.institutions);
  analysis.externalIndicators = Array.from(analysis.externalIndicators);
  
  return analysis;
}

// *** NEW: Function to determine if a position is from an external/linked account ***
function isPositionFromExternalAccount(symbol, accountSource, institution, external, sourceAccount, targetAccountName, analysis) {
  const targetBroker = targetAccountName.toLowerCase();
  
  // Check 1: Explicit external indicators
  if (external.includes('external') || external.includes('linked')) {
    return { isExternal: true, reason: 'Marked as external/linked' };
  }
  
  // Check 2: Institution name doesn't match target broker
  if (institution) {
    const instLower = institution.toLowerCase();
    if (instLower.includes('schwab') && !targetBroker.includes('schwab')) {
      return { isExternal: true, reason: 'Schwab linked account' };
    }
    if (instLower.includes('fidelity') && !targetBroker.includes('fidelity')) {
      return { isExternal: true, reason: 'Fidelity linked account' };
    }
    if (instLower.includes('vanguard') && !targetBroker.includes('vanguard')) {
      return { isExternal: true, reason: 'Vanguard linked account' };
    }
    if (instLower.includes('etrade') && !targetBroker.includes('etrade')) {
      return { isExternal: true, reason: 'E*TRADE linked account' };
    }
    if (instLower.includes('ameritrade') && !targetBroker.includes('ameritrade')) {
      return { isExternal: true, reason: 'TD Ameritrade linked account' };
    }
  }
  
  // Check 3: Account source analysis
  if (accountSource) {
    const sourceLower = accountSource.toLowerCase();
    
    // Common patterns for external accounts
    if (sourceLower.includes('external') || sourceLower.includes('linked') || 
        sourceLower.includes('aggregated') || sourceLower.includes('other')) {
      return { isExternal: true, reason: 'External account source' };
    }
    
    // Specific broker detection in account source
    if (sourceLower.includes('schwab') && !targetBroker.includes('schwab')) {
      return { isExternal: true, reason: 'Schwab account source' };
    }
    if (sourceLower.includes('fidelity') && !targetBroker.includes('fidelity')) {
      return { isExternal: true, reason: 'Fidelity account source' };
    }
    if (sourceLower.includes('vanguard') && !targetBroker.includes('vanguard')) {
      return { isExternal: true, reason: 'Vanguard account source' };
    }
  }
  
  // Check 4: Pattern-based detection
  // If we detected multiple institutions and this symbol appears with a different institution
  if (analysis.hasMultipleAccounts && analysis.institutions.length > 1) {
    // Look for the primary institution (most common one that matches target)
    const primaryInstitution = analysis.institutions.find(inst => 
      inst.toLowerCase().includes(targetBroker) || 
      targetBroker.includes(inst.toLowerCase())
    );
    
    if (primaryInstitution && institution && institution !== primaryInstitution) {
      return { isExternal: true, reason: `Different institution: ${institution}` };
    }
  }
  
  // Check 5: Symbol-specific known patterns (fallback for hard cases)
  // If we're importing to Fidelity but find typical Schwab-heavy positions, check more carefully
  if (targetBroker.includes('fidelity')) {
    // These are commonly high-concentration positions in Schwab accounts
    const schwabHeavySymbols = ['NVDA', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'];
    if (schwabHeavySymbols.includes(symbol)) {
      // Check if there are indicators this might be from a linked Schwab account
      if (analysis.institutions.some(inst => inst.toLowerCase().includes('schwab')) ||
          analysis.accountSources.some(src => src.toLowerCase().includes('schwab'))) {
        return { isExternal: true, reason: 'Likely from linked Schwab account' };
      }
    }
  }
  
  return { isExternal: false, reason: 'Native position' };
}

// Enhanced main parser that handles both transactions and positions WITH STOCK SPLIT SUPPORT
export function parsePortfolioCSV(csvText, accountName = 'Unknown') {
  console.log('*** STOCK SPLIT ENHANCED: Starting CSV parse for account:', accountName);
  console.log('First 500 chars:', csvText.substring(0, 500));
  
  // First, check if this is a positions file by looking at the content
  const lowerText = csvText.toLowerCase();
  const firstLine = csvText.split('\n')[0].toLowerCase();
  
  // Enhanced position indicators - more comprehensive list - FIXED: Added "price"
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
    'unit cost',
    'price'  // FIXED: Added price as position indicator
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
  
  // FIXED: Enhanced detection logic for simple position files
  // If we have ANY position indicators and no action column, it's likely a positions file
  if (positionIndicatorCount >= 1 && !hasActionColumn) {
    console.log('*** STOCK SPLIT ENHANCED: Detected positions file based on indicators');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // Check if headers strongly suggest positions
  if ((firstLine.includes('cost basis') || firstLine.includes('gain/loss') || 
       firstLine.includes('current value') || firstLine.includes('market value')) && 
      !firstLine.includes('action')) {
    console.log('*** STOCK SPLIT ENHANCED: Detected positions file based on headers');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // CRITICAL FIX: Detect simple position files (Symbol, Quantity, Price format)
  if (firstLine.includes('symbol') && firstLine.includes('quantity') && 
      firstLine.includes('price') && !hasActionColumn && !hasBuySellWords) {
    console.log('*** STOCK SPLIT ENHANCED: Detected simple positions file (Symbol, Quantity, Price format)');
    return parsePositionsCSV(csvText, accountName);
  }
  
  // Otherwise, use the transaction parser
  console.log('*** STOCK SPLIT ENHANCED: Using transaction parser...');
  
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
  let splitAdjustments = []; // Track split adjustments for transaction imports too
  
  switch (format) {
    case 'schwab':
      const schwabResult = parseSchwabCSV(dataRows, headers, accountName);
      transactions = schwabResult.transactions || schwabResult;
      warnings = schwabResult.warnings || [];
      splitAdjustments = schwabResult.splitAdjustments || [];
      break;
    case 'fidelity':
      const fidelityResult = parseFidelityCSV(dataRows, headers, accountName);
      transactions = fidelityResult.transactions || fidelityResult;
      warnings = fidelityResult.warnings || [];
      splitAdjustments = fidelityResult.splitAdjustments || [];
      break;
    case 'generic':
      // For generic format, use Schwab parser as fallback
      const genericResult = parseSchwabCSV(dataRows, headers, accountName);
      transactions = genericResult.transactions || genericResult;
      warnings = genericResult.warnings || [];
      splitAdjustments = genericResult.splitAdjustments || [];
      break;
    default:
      console.error('Unknown format. Headers:', headers);
      throw new Error('Unable to detect CSV format. Please ensure your CSV has columns for: Symbol, Quantity, Price, and Date. Detected headers: ' + headers.join(', '));
  }
  
  console.log('*** STOCK SPLIT ENHANCED: Final transactions:', transactions.length);
  if (transactions.length > 0) {
    console.log('First transaction:', transactions[0]);
  }
  
  return {
    format,
    transactions,
    summary: {
      totalTransactions: transactions.length,
      symbols: [...new Set(transactions.map(t => t.symbol))],
      splitCorrectionCount: splitAdjustments.length, // NEW: Track split corrections
      dateRange: {
        start: transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0]?.date || ''),
        end: transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0]?.date || '')
      }
    },
    warnings,
    splitAdjustments // NEW: Return split adjustments
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

// Parse Schwab CSV format - ENHANCED to handle buy/sell only WITH SPLIT SUPPORT
export function parseSchwabCSV(rows, headers, accountName = 'Schwab') {
  console.log('*** STOCK SPLIT ENHANCED: Parsing Schwab CSV with', rows.length, 'rows for account:', accountName);
  const transactions = [];
  const warnings = [];
  const splitAdjustments = [];
  let skippedTransactions = 0;
  let splitCorrectionCount = 0;
  
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
    const rawQuantity = parseFloat(row[colMap.quantity]) || 0;
    const rawPrice = parseFloat(row[colMap.price]) || 0;
    const transactionDate = row[colMap.date] || new Date().toISOString().split('T')[0];
    
    // Special handling for BRK
    if (symbol === 'BRK/B' || symbol === 'BRK-B') {
      symbol = 'BRK.B';
    }
    
    // If no price column, try to extract from amount
    let finalPrice = rawPrice;
    if (finalPrice === 0 && colMap.amount !== undefined) {
      const amount = Math.abs(parseFloat(row[colMap.amount]) || 0);
      if (amount > 0 && rawQuantity > 0) {
        finalPrice = amount / quantity;
      }
    }
    
    if (symbol && rawQuantity > 0 && finalPrice > 0) {
      // *** STOCK SPLIT CORRECTION FOR TRANSACTIONS ***
      console.log(`🔍 CHECKING STOCK SPLITS for transaction ${symbol}: ${rawQuantity} shares @ $${finalPrice.toFixed(2)} on ${transactionDate}`);
      
      const splitResult = applySplitAdjustments(symbol, rawQuantity, finalPrice, transactionDate);
      
      const adjustedQuantity = splitResult.adjustedQuantity;
      const adjustedPrice = splitResult.adjustedPrice;
      
      if (splitResult.splitInfo.applied) {
        console.log(`✅ TRANSACTION SPLIT APPLIED to ${symbol}:`);
        console.log(`   Before: ${rawQuantity} shares @ $${finalPrice.toFixed(2)}`);
        console.log(`   After:  ${adjustedQuantity} shares @ $${adjustedPrice.toFixed(2)}`);
        console.log(`   Split ratio: ${splitResult.splitInfo.cumulativeRatio}:1`);
        
        splitAdjustments.push({
          symbol,
          originalQuantity: rawQuantity,
          originalPrice: finalPrice,
          adjustedQuantity: adjustedQuantity,
          adjustedPrice: adjustedPrice,
          splitRatio: splitResult.splitInfo.cumulativeRatio,
          method: splitResult.splitInfo.method,
          transactionDate: transactionDate
        });
        
        splitCorrectionCount++;
      }
      
      transactions.push({
        date: transactionDate,
        action: isBuy ? 'BUY' : 'SELL',
        symbol: symbol,
        quantity: adjustedQuantity, // SPLIT-ADJUSTED
        price: adjustedPrice, // SPLIT-ADJUSTED
        fees: parseFloat(row[colMap.fees]) || 0,
        account: accountName,
        splitAdjusted: splitResult.splitInfo.applied,
        splitInfo: splitResult.splitInfo
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
  
  if (splitCorrectionCount > 0) {
    warnings.push({
      type: 'split_corrections_applied',
      message: `Applied stock split corrections to ${splitCorrectionCount} transactions: ${splitAdjustments.map(adj => `${adj.symbol} (${adj.splitRatio}:1)`).join(', ')}`,
      severity: 'info'
    });
  }
  
  console.log('*** STOCK SPLIT ENHANCED: Parsed', transactions.length, 'Schwab transactions with', splitCorrectionCount, 'split corrections');
  return { transactions, warnings, splitAdjustments };
}

// Parse Fidelity CSV format WITH SPLIT SUPPORT
export function parseFidelityCSV(rows, headers, accountName = 'Fidelity') {
  console.log('*** STOCK SPLIT ENHANCED: Parsing Fidelity CSV with', rows.length, 'rows for account:', accountName);
  const transactions = [];
  const warnings = [];
  const splitAdjustments = [];
  let skippedTransactions = 0;
  let splitCorrectionCount = 0;
  
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
    const rawQuantity = Math.abs(parseFloat(row[colMap.quantity]) || 0); // Fidelity might use negative for sells
    let rawPrice = parseFloat(row[colMap.price]) || 0;
    const transactionDate = row[colMap.date] || new Date().toISOString().split('T')[0];
    
    // Special handling for BRK
    if (symbol === 'BRK/B' || symbol === 'BRK-B') {
      symbol = 'BRK.B';
    }
    
    // If no price, try to calculate from amount
    if (rawPrice === 0 && colMap.amount !== undefined) {
      const amount = Math.abs(parseFloat(row[colMap.amount]) || 0);
      if (amount > 0 && rawQuantity > 0) {
        rawPrice = amount / rawQuantity;
      }
    }
    
    if (symbol && rawQuantity > 0 && rawPrice > 0) {
      // *** STOCK SPLIT CORRECTION FOR FIDELITY TRANSACTIONS ***
      console.log(`🔍 CHECKING STOCK SPLITS for Fidelity transaction ${symbol}: ${rawQuantity} shares @ $${rawPrice.toFixed(2)} on ${transactionDate}`);
      
      const splitResult = applySplitAdjustments(symbol, rawQuantity, rawPrice, transactionDate);
      
      const adjustedQuantity = splitResult.adjustedQuantity;
      const adjustedPrice = splitResult.adjustedPrice;
      
      if (splitResult.splitInfo.applied) {
        console.log(`✅ FIDELITY TRANSACTION SPLIT APPLIED to ${symbol}:`);
        console.log(`   Before: ${rawQuantity} shares @ $${rawPrice.toFixed(2)}`);
        console.log(`   After:  ${adjustedQuantity} shares @ $${adjustedPrice.toFixed(2)}`);
        console.log(`   Split ratio: ${splitResult.splitInfo.cumulativeRatio}:1`);
        
        splitAdjustments.push({
          symbol,
          originalQuantity: rawQuantity,
          originalPrice: rawPrice,
          adjustedQuantity: adjustedQuantity,
          adjustedPrice: adjustedPrice,
          splitRatio: splitResult.splitInfo.cumulativeRatio,
          method: splitResult.splitInfo.method,
          transactionDate: transactionDate
        });
        
        splitCorrectionCount++;
      }
      
      transactions.push({
        date: transactionDate,
        action: action,
        symbol: symbol,
        quantity: adjustedQuantity, // SPLIT-ADJUSTED
        price: adjustedPrice, // SPLIT-ADJUSTED
        fees: parseFloat(row[colMap.fees]) || 0,
        account: accountName,
        splitAdjusted: splitResult.splitInfo.applied,
        splitInfo: splitResult.splitInfo
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
  
  if (splitCorrectionCount > 0) {
    warnings.push({
      type: 'split_corrections_applied',
      message: `Applied stock split corrections to ${splitCorrectionCount} Fidelity transactions: ${splitAdjustments.map(adj => `${adj.symbol} (${adj.splitRatio}:1)`).join(', ')}`,
      severity: 'info'
    });
  }
  
  console.log('*** STOCK SPLIT ENHANCED: Parsed', transactions.length, 'Fidelity transactions with', splitCorrectionCount, 'split corrections');
  return { transactions, warnings, splitAdjustments };
}