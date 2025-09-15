// Stock Split Database for automatic portfolio corrections
// Contains major stock splits that commonly affect retail portfolios

export const STOCK_SPLITS = {
  // NVIDIA - Multiple splits including the major 10:1 in June 2024
  'NVDA': [
    { date: '2024-06-07', ratio: 10, type: '10:1', description: 'NVIDIA 10-for-1 split' },
    { date: '2021-07-20', ratio: 4, type: '4:1', description: 'NVIDIA 4-for-1 split' },
    { date: '2007-09-11', ratio: 2, type: '2:1', description: 'NVIDIA 2-for-1 split' },
    { date: '2006-04-07', ratio: 2, type: '2:1', description: 'NVIDIA 2-for-1 split' },
    { date: '2001-06-27', ratio: 2, type: '2:1', description: 'NVIDIA 2-for-1 split' },
    { date: '2000-06-12', ratio: 2, type: '2:1', description: 'NVIDIA 2-for-1 split' }
  ],
  
  // Tesla - Popular retail stock with multiple splits
  'TSLA': [
    { date: '2022-08-25', ratio: 3, type: '3:1', description: 'Tesla 3-for-1 split' },
    { date: '2020-08-31', ratio: 5, type: '5:1', description: 'Tesla 5-for-1 split' }
  ],
  
  // Apple - Very common in retail portfolios
  'AAPL': [
    { date: '2020-08-31', ratio: 4, type: '4:1', description: 'Apple 4-for-1 split' },
    { date: '2014-06-09', ratio: 7, type: '7:1', description: 'Apple 7-for-1 split' },
    { date: '2005-02-28', ratio: 2, type: '2:1', description: 'Apple 2-for-1 split' },
    { date: '2000-06-21', ratio: 2, type: '2:1', description: 'Apple 2-for-1 split' },
    { date: '1987-06-16', ratio: 2, type: '2:1', description: 'Apple 2-for-1 split' }
  ],
  
  // Amazon - Major tech holding
  'AMZN': [
    { date: '2022-06-06', ratio: 20, type: '20:1', description: 'Amazon 20-for-1 split' },
    { date: '1999-09-02', ratio: 2, type: '2:1', description: 'Amazon 2-for-1 split' },
    { date: '1998-06-02', ratio: 2, type: '2:1', description: 'Amazon 2-for-1 split' },
    { date: '1998-01-05', ratio: 3, type: '3:1', description: 'Amazon 3-for-1 split' }
  ],
  
  // Google/Alphabet - Common holding
  'GOOGL': [
    { date: '2022-07-18', ratio: 20, type: '20:1', description: 'Google Class A 20-for-1 split' }
  ],
  'GOOG': [
    { date: '2022-07-18', ratio: 20, type: '20:1', description: 'Google Class C 20-for-1 split' }
  ],
  
  // Microsoft - Blue chip holding
  'MSFT': [
    { date: '2019-09-18', ratio: 1, type: 'none', description: 'No recent splits' }, // Placeholder for consistency
    { date: '2003-02-18', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1999-03-29', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1998-02-23', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1996-12-09', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1994-05-23', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1992-06-27', ratio: 3, type: '3:2', description: 'Microsoft 3-for-2 split' },
    { date: '1991-04-16', ratio: 1.5, type: '3:2', description: 'Microsoft 3-for-2 split' },
    { date: '1990-04-18', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' },
    { date: '1987-09-21', ratio: 2, type: '2:1', description: 'Microsoft 2-for-1 split' }
  ],
  
  // Other popular retail stocks
  'META': [
    { date: '2022-02-01', ratio: 1, type: 'none', description: 'No splits since going public' }
  ],
  
  'BRK.B': [
    { date: '2010-01-21', ratio: 50, type: '50:1', description: 'Berkshire Hathaway Class B 50-for-1 split' }
  ],
  
  'SHOP': [
    { date: '2022-06-29', ratio: 10, type: '10:1', description: 'Shopify 10-for-1 split' }
  ],
  
  'NFLX': [
    { date: '2015-07-15', ratio: 7, type: '7:1', description: 'Netflix 7-for-1 split' },
    { date: '2004-02-12', ratio: 2, type: '2:1', description: 'Netflix 2-for-1 split' }
  ]
};

// Get applicable stock splits for a symbol after a given date
export function getApplicableSplits(symbol, afterDate) {
  const splits = STOCK_SPLITS[symbol] || [];
  const purchaseDate = new Date(afterDate);
  
  return splits.filter(split => {
    const splitDate = new Date(split.date);
    return splitDate > purchaseDate && split.ratio > 1; // Only actual splits, not reverse splits
  }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Chronological order
}

// Calculate cumulative split ratio for a symbol since a purchase date
export function calculateCumulativeSplitRatio(symbol, purchaseDate) {
  const applicableSplits = getApplicableSplits(symbol, purchaseDate);
  
  if (applicableSplits.length === 0) {
    return 1; // No splits
  }
  
  // Multiply all split ratios
  const cumulativeRatio = applicableSplits.reduce((total, split) => total * split.ratio, 1);
  
  console.log(`📊 ${symbol} cumulative split ratio since ${purchaseDate}: ${cumulativeRatio}x (${applicableSplits.length} splits)`);
  applicableSplits.forEach(split => {
    console.log(`  - ${split.date}: ${split.type} (${split.ratio}x)`);
  });
  
  return cumulativeRatio;
}

// Detect if a price suggests a stock split occurred
export function detectPotentialSplit(symbol, quantity, price, currentMarketPrice) {
  if (!currentMarketPrice || currentMarketPrice <= 0) {
    return null; // Can't detect without current price
  }
  
  // Calculate potential split ratios by comparing historical vs current price
  const priceRatio = price / currentMarketPrice;
  
  // Check for common split ratios
  const commonSplitRatios = [2, 3, 4, 5, 7, 10, 20, 50];
  
  for (const ratio of commonSplitRatios) {
    const lowerBound = ratio * 0.8; // Allow for some price movement
    const upperBound = ratio * 1.25;
    
    if (priceRatio >= lowerBound && priceRatio <= upperBound) {
      console.log(`🔍 Potential ${ratio}:1 split detected for ${symbol}: Historical price $${price} vs Current $${currentMarketPrice} (ratio: ${priceRatio.toFixed(2)})`);
      return {
        detectedRatio: ratio,
        confidence: Math.max(0, 1 - Math.abs(priceRatio - ratio) / ratio),
        priceRatio: priceRatio,
        reason: `Price ratio suggests ${ratio}:1 split`
      };
    }
  }
  
  return null;
}

// Apply stock split adjustments to position data
export function applySplitAdjustments(symbol, quantity, price, purchaseDate) {
  const today = new Date().toISOString().split('T')[0];
  
  // Method 1: Use known splits from database
  const cumulativeRatio = calculateCumulativeSplitRatio(symbol, purchaseDate || today);
  
  if (cumulativeRatio > 1) {
    const adjustedQuantity = quantity * cumulativeRatio;
    const adjustedPrice = price / cumulativeRatio;
    
    console.log(`✅ Split adjustment for ${symbol}: ${quantity} → ${adjustedQuantity} shares, $${price} → $${adjustedPrice}/share`);
    
    return {
      adjustedQuantity,
      adjustedPrice,
      splitInfo: {
        applied: true,
        cumulativeRatio,
        method: 'database',
        adjustedBy: cumulativeRatio
      }
    };
  }
  
  // Method 2: TODO - Could add market price detection here if we had current prices
  // For now, return original values
  return {
    adjustedQuantity: quantity,
    adjustedPrice: price,
    splitInfo: {
      applied: false,
      cumulativeRatio: 1,
      method: 'none',
      adjustedBy: 1
    }
  };
}

// Check if a symbol is known to have had splits
export function hasKnownSplits(symbol) {
  return STOCK_SPLITS.hasOwnProperty(symbol);
}

// Get all splits for a symbol (for debugging)
export function getAllSplits(symbol) {
  return STOCK_SPLITS[symbol] || [];
}

export default {
  STOCK_SPLITS,
  getApplicableSplits,
  calculateCumulativeSplitRatio,
  detectPotentialSplit,
  applySplitAdjustments,
  hasKnownSplits,
  getAllSplits
};