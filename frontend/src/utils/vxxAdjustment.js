// CONSERVATIVE VXX adjustment - only applies when absolutely necessary
// This version is much more careful about detecting real splits vs normal volatility

export function adjustVXXForCorporateActions(rawData) {
  if (!rawData || rawData.length < 2) return rawData;
  
  console.log(`VXX: Starting conservative analysis of ${rawData.length} data points`);
  
  // Sort data chronologically (oldest first)
  const sortedData = [...rawData].sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));
  
  // Quick data quality check - if current prices look reasonable, don't adjust
  const recentPrices = sortedData.slice(-30).map(item => item.price || item.close).filter(p => p > 0);
  if (recentPrices.length > 0) {
    const avgRecentPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    console.log(`VXX: Average recent price: $${avgRecentPrice.toFixed(2)}`);
    
    // If recent prices are in reasonable VXX range ($10-$100), data is likely already adjusted
    if (avgRecentPrice >= 10 && avgRecentPrice <= 100) {
      console.log('VXX: Recent prices look reasonable, skipping adjustment');
      return rawData.map(item => ({
        ...item,
        price: item.price || item.close,
        originalPrice: item.price || item.close,
        adjustmentApplied: false
      }));
    }
  }
  
  // Only proceed with adjustment if prices look problematic
  console.log('VXX: Recent prices look problematic, proceeding with conservative adjustment');
  
  const adjustedData = [];
  let adjustmentCount = 0;
  
  for (let i = 0; i < sortedData.length; i++) {
    const current = sortedData[i];
    const currentPrice = current.price || current.close || 0;
    
    if (i === 0) {
      adjustedData.push({
        ...current,
        price: currentPrice,
        originalPrice: currentPrice,
        adjustmentApplied: false
      });
      continue;
    }
    
    const previous = sortedData[i - 1];
    const previousPrice = previous.price || previous.close || 0;
    
    if (previousPrice <= 0 || currentPrice <= 0) {
      adjustedData.push({
        ...current,
        price: currentPrice,
        originalPrice: currentPrice,
        adjustmentApplied: false
      });
      continue;
    }
    
    const priceRatio = currentPrice / previousPrice;
    
    // MUCH MORE CONSERVATIVE: Only adjust for very clear splits (4x+ jumps)
    // Also check volume for confirmation (splits usually have high volume)
    if (priceRatio >= 4.0) {
      const splitRatio = Math.round(priceRatio);
      const volumeConfirmation = current.volume > (previous.volume * 2); // High volume suggests real corporate action
      
      if (volumeConfirmation || splitRatio >= 5) {
        console.log(`VXX: Confirmed reverse split at ${current.date}: ${splitRatio}:1 (price: $${previousPrice.toFixed(2)} → $${currentPrice.toFixed(2)}, volume: ${current.volume})`);
        
        // Apply adjustment to all previous data
        for (let j = 0; j < adjustedData.length; j++) {
          adjustedData[j].price *= splitRatio;
          adjustedData[j].adjustmentApplied = true;
        }
        adjustmentCount++;
      }
    }
    
    adjustedData.push({
      ...current,
      price: currentPrice,
      originalPrice: currentPrice,
      adjustmentApplied: adjustmentCount > 0
    });
  }
  
  console.log(`VXX: Applied ${adjustmentCount} conservative adjustments`);
  
  // Sort back to original order
  return adjustedData.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
}

// Alternative: NO ADJUSTMENT - for testing if data is already correct
export function noAdjustmentVXX(rawData) {
  console.log('VXX: Using raw data without any adjustments');
  return rawData.map(item => ({
    ...item,
    price: item.price || item.close,
    originalPrice: item.price || item.close,
    adjustmentApplied: false
  }));
}

// Simple outlier removal only
export function simpleVXXClean(rawData) {
  if (!rawData || rawData.length < 2) return rawData;
  
  console.log(`VXX: Simple cleaning of ${rawData.length} data points`);
  
  return rawData
    .filter(item => {
      const price = item.price || item.close || 0;
      // Only remove obvious bad data - VXX should be between $5-$150 in any reasonable scenario
      return price >= 5 && price <= 150;
    })
    .map(item => ({
      ...item,
      price: item.price || item.close,
      originalPrice: item.price || item.close,
      adjustmentApplied: false
    }));
}
