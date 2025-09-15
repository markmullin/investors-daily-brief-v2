  /**
   * *** ENHANCED: EXTRACT PRICE TARGET DATA with debugging and fallbacks ***
   */
  extractPriceTargetData(priceTargets, currentPrice) {
    try {
      console.log(`🔍 [PRICE TARGET DEBUG] Raw data:`, priceTargets ? `Array length: ${priceTargets.length}` : 'null/undefined');
      
      if (!priceTargets) {
        console.log(`⚠️ [PRICE TARGET] No price target data received`);
        return null;
      }
      
      if (!Array.isArray(priceTargets)) {
        console.log(`⚠️ [PRICE TARGET] Data is not an array:`, typeof priceTargets);
        return null;
      }
      
      if (priceTargets.length === 0) {
        console.log(`⚠️ [PRICE TARGET] Empty array received`);
        return null;
      }
      
      const target = priceTargets[0];
      console.log(`🎯 [PRICE TARGET] First target object:`, JSON.stringify(target, null, 2));
      
      if (!target) {
        console.log(`⚠️ [PRICE TARGET] First element is null/undefined`);
        return null;
      }
      
      // Try multiple field names that FMP might use
      const avgTarget = target.averagePriceTarget || 
                       target.avgPriceTarget || 
                       target.average_price_target ||
                       target.consensusPriceTarget ||
                       target.targetPrice;
                       
      const highTarget = target.highestPriceTarget || 
                        target.maxPriceTarget ||
                        target.highest_price_target ||
                        target.highTarget;
                        
      const lowTarget = target.lowestPriceTarget ||
                       target.minPriceTarget ||
                       target.lowest_price_target ||
                       target.lowTarget;
      
      console.log(`📊 [PRICE TARGET] Extracted values: avg=${avgTarget}, high=${highTarget}, low=${lowTarget}, currentPrice=${currentPrice}`);
      
      // Calculate upside if we have both target and current price
      let upside = null;
      if (avgTarget && currentPrice && typeof avgTarget === 'number' && typeof currentPrice === 'number' && currentPrice > 0) {
        upside = Math.round(((avgTarget - currentPrice) / currentPrice * 100) * 10) / 10;
        console.log(`📈 [PRICE TARGET] Calculated upside: ${upside}%`);
      } else {
        console.log(`⚠️ [PRICE TARGET] Cannot calculate upside - avgTarget: ${avgTarget}, currentPrice: ${currentPrice}`);
      }
      
      const result = {
        avgPriceTarget: avgTarget || null,
        highTarget: highTarget || null,
        lowTarget: lowTarget || null,
        analystCount: target.numberOfAnalystsWithEstimates || 
                     target.analystCount || 
                     target.number_of_analysts || 0,
        upside: upside,
        lastUpdated: target.lastUpdated || target.last_updated || null,
        rawData: target // Include raw data for debugging
      };
      
      console.log(`✅ [PRICE TARGET] Final result:`, result);
      return result;
      
    } catch (error) {
      console.error('❌ [PRICE TARGET] Error extracting price target data:', error.message);
      console.error('Stack trace:', error.stack);
      return null;
    }
  }