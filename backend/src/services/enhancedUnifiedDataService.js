/**
 * Enhanced Revenue Segments Service with Total Revenue Reconciliation
 * This fix ensures we always show the full revenue picture
 * Chief Software Engineer Solution
 */

import fmpService from './fmpService.js';
import intelligentSegmentService from './intelligentSegmentService.js';
import segmentContinuityService from './segmentContinuityService.js';
import { redis } from '../config/database.js';

class EnhancedUnifiedDataService {
  constructor() {
    this.fmp = fmpService;
    this.segmentProcessor = intelligentSegmentService;
    this.continuityService = segmentContinuityService;
    
    // Tiered caching strategy
    this.cacheTTL = {
      hot: 60,        // 1 minute - real-time quotes
      warm: 900,      // 15 minutes - market data
      cold: 3600,     // 1 hour - financial statements
      frozen: 86400   // 24 hours - historical financials
    };
    
    // Redis key prefixes
    this.keyPrefixes = {
      quote: 'unified:quote:',
      timeseries: 'unified:timeseries:',
      segments: 'unified:segments:',
      market: 'unified:market:'
    };
    
    console.log('🚀 [ENHANCED UNIFIED SERVICE] Initialized with revenue reconciliation');
  }

  /**
   * Core caching engine
   */
  async getCachedData(key, fetchFunction, ttl) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`📦 [CACHE HIT] ${key}`);
        return JSON.parse(cached);
      }

      console.log(`🌐 [CACHE MISS] Fetching fresh data for ${key}`);
      const freshData = await fetchFunction();
      
      if (freshData !== null && freshData !== undefined) {
        await redis.setex(key, ttl, JSON.stringify(freshData));
        console.log(`💾 [CACHED] ${key} (TTL: ${ttl}s)`);
      }
      
      return freshData;
    } catch (error) {
      console.error(`❌ [CACHE ERROR] ${key}:`, error.message);
      return await fetchFunction();
    }
  }

  /**
   * Symbol standardization
   */
  standardizeSymbol(symbol) {
    // Remove any suffixes like .US
    return symbol.replace(/\.(US|NYSE|NASDAQ|AMEX)$/i, '').toUpperCase();
  }

  /**
   * 🎯 ENHANCED REVENUE SEGMENTATION WITH RECONCILIATION
   * Always shows complete revenue picture including unallocated amounts
   */
  async getRevenueSegmentationWithReconciliation(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.segments}revenue:${cleanSymbol}:${period}:${limit}:reconciled:v1`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`🎯 [REVENUE SEGMENTS] Fetching with reconciliation for ${cleanSymbol}`);
      
      try {
        // 1. Get segment data from FMP
        const segmentsUrl = `https://financialmodelingprep.com/api/v4/revenue-product-segmentation?symbol=${cleanSymbol}&period=${period}&structure=flat&apikey=${this.fmp.apiKey}`;
        const segmentsResponse = await fetch(segmentsUrl);
        
        // 2. Get income statement data for total revenue
        const incomeData = await this.getIncomeStatementTimeSeries(cleanSymbol, period, limit);
        
        if (!segmentsResponse.ok || !incomeData || incomeData.dataPoints === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] Data unavailable, using total revenue fallback`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        const segmentsData = await segmentsResponse.json();
        
        if (!segmentsData || !Array.isArray(segmentsData) || segmentsData.length === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] Empty response, using total revenue fallback`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        // 3. Create revenue lookup map
        const revenueMap = {};
        incomeData.data.forEach(quarter => {
          revenueMap[quarter.date] = quarter.revenue || 0;
        });
        
        // 4. Process segments with reconciliation
        const reconciledData = [];
        const allSegments = new Set();
        let hasValidSegmentData = false;
        let totalMissingRevenue = 0;
        let quartersWithMissingRevenue = 0;
        
        segmentsData.forEach(quarterData => {
          const date = Object.keys(quarterData)[0];
          const segments = quarterData[date];
          const totalRevenue = revenueMap[date] || 0;
          
          if (segments && typeof segments === 'object' && totalRevenue > 0) {
            hasValidSegmentData = true;
            
            // Calculate segment total
            let segmentTotal = 0;
            const quarterSegments = {};
            
            Object.entries(segments).forEach(([name, value]) => {
              if (typeof value === 'number' && value > 0) {
                quarterSegments[name] = value;
                segmentTotal += value;
                allSegments.add(name);
              }
            });
            
            // Add unallocated/other revenue if segments don't add up
            const difference = totalRevenue - segmentTotal;
            const percentageMissing = totalRevenue > 0 ? (difference / totalRevenue * 100) : 0;
            
            if (Math.abs(difference) > totalRevenue * 0.01) { // More than 1% difference
              quarterSegments['Unallocated/Other'] = difference;
              allSegments.add('Unallocated/Other');
              totalMissingRevenue += Math.abs(difference);
              quartersWithMissingRevenue++;
              
              console.log(`📊 [${cleanSymbol}] ${date}: Added $${(difference/1e6).toFixed(0)}M unallocated (${percentageMissing.toFixed(1)}%)`);
            }
            
            reconciledData.push({
              date: date,
              period: period,
              segments: quarterSegments,
              totalRevenue: totalRevenue,
              segmentTotal: segmentTotal,
              reconciliationAmount: difference,
              isReconciled: Math.abs(difference) > totalRevenue * 0.01
            });
          }
        });
        
        // If no valid segment data found, fall back to total revenue
        if (!hasValidSegmentData || allSegments.size === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] No valid segments, using total revenue fallback`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        // Convert set to array and ensure consistent ordering
        const segmentNames = Array.from(allSegments).sort((a, b) => {
          // Put Unallocated/Other at the end
          if (a === 'Unallocated/Other') return 1;
          if (b === 'Unallocated/Other') return -1;
          return a.localeCompare(b);
        });
        
        // Limit data and ensure all quarters have all segments
        const limitedData = reconciledData.slice(0, limit);
        const normalizedData = limitedData.map(quarter => {
          const normalizedSegments = {};
          
          segmentNames.forEach(segment => {
            normalizedSegments[segment] = quarter.segments[segment] || null;
          });
          
          return {
            date: quarter.date,
            period: quarter.period,
            segments: normalizedSegments,
            metadata: {
              totalRevenue: quarter.totalRevenue,
              isReconciled: quarter.isReconciled,
              reconciliationAmount: quarter.reconciliationAmount
            }
          };
        });
        
        // Create base result
        const baseResult = {
          symbol: cleanSymbol,
          hasSegmentData: true,
          segments: segmentNames,
          dataPoints: normalizedData.length,
          data: normalizedData,
          reconciliationInfo: {
            hasUnallocatedRevenue: allSegments.has('Unallocated/Other'),
            quartersWithMissingRevenue: quartersWithMissingRevenue,
            averageMissingPercentage: quartersWithMissingRevenue > 0 
              ? (totalMissingRevenue / normalizedData.reduce((sum, q) => sum + q.metadata.totalRevenue, 0) * 100)
              : 0
          },
          message: quartersWithMissingRevenue > 0
            ? `Revenue segments reconciled. ${quartersWithMissingRevenue} quarters had unallocated revenue added.`
            : `Revenue segment data complete for ${cleanSymbol}`
        };
        
        // Apply segment processing pipeline
        console.log(`🔄 [REVENUE SEGMENTS] Applying continuity mapping for ${cleanSymbol}`);
        const continuityResult = this.continuityService.processSegments(cleanSymbol, baseResult);
        
        console.log(`🧠 [REVENUE SEGMENTS] Applying intelligent processing for ${cleanSymbol}`);
        const processedResult = this.segmentProcessor.processCompanySegments(continuityResult, cleanSymbol);
        
        // Add reconciliation warning if significant
        if (processedResult.reconciliationInfo?.averageMissingPercentage > 5) {
          processedResult.warning = `Note: On average, ${processedResult.reconciliationInfo.averageMissingPercentage.toFixed(1)}% of revenue is not allocated to specific segments. This "Unallocated/Other" category may include corporate revenue, eliminations, or other adjustments.`;
        }
        
        return processedResult;
        
      } catch (error) {
        console.error(`❌ [REVENUE SEGMENTS] Error for ${cleanSymbol}:`, error.message);
        return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
      }
    }, this.cacheTTL.cold);
  }

  /**
   * Get income statement time series (needed for reconciliation)
   */
  async getIncomeStatementTimeSeries(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}income:${cleanSymbol}:${period}:${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`💰 [INCOME STATEMENT] Fetching ${limit} ${period}s for ${cleanSymbol}`);
      
      try {
        const data = await this.fmp.getIncomeStatement(cleanSymbol, period);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ [INCOME STATEMENT] No data for ${cleanSymbol}`);
          return {
            symbol: cleanSymbol,
            period: period,
            dataPoints: 0,
            data: []
          };
        }
        
        const timeSeries = data.slice(0, limit);
        
        return {
          symbol: cleanSymbol,
          period: period,
          dataPoints: timeSeries.length,
          latestQuarter: timeSeries[0]?.date,
          oldestQuarter: timeSeries[timeSeries.length - 1]?.date,
          data: timeSeries.map(quarter => ({
            date: quarter.date,
            period: quarter.period,
            revenue: quarter.revenue || null,
            netIncome: quarter.netIncome || null,
            grossProfit: quarter.grossProfit || null,
            operatingIncome: quarter.operatingIncome || null
          }))
        };
        
      } catch (error) {
        console.error(`❌ [INCOME STATEMENT] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * Create fallback data using total revenue
   */
  async createTotalRevenueFallback(symbol, period, limit) {
    console.log(`📊 [REVENUE FALLBACK] Creating total revenue fallback for ${symbol}`);
    
    try {
      const incomeData = await this.getIncomeStatementTimeSeries(symbol, period, limit);
      
      if (!incomeData || incomeData.dataPoints === 0) {
        return {
          symbol: symbol,
          hasSegmentData: false,
          data: [],
          message: `No revenue data available for ${symbol}`,
          isFallback: true
        };
      }
      
      const segmentData = incomeData.data.map(quarter => ({
        date: quarter.date,
        period: quarter.period,
        segments: {
          'Total Revenue': quarter.revenue || 0
        },
        metadata: {
          totalRevenue: quarter.revenue || 0,
          isReconciled: false,
          reconciliationAmount: 0
        }
      }));
      
      return {
        symbol: symbol,
        hasSegmentData: true,
        segments: ['Total Revenue'],
        dataPoints: segmentData.length,
        data: segmentData,
        message: `Showing total revenue for ${symbol} (segment breakdown not available)`,
        isFallback: true,
        reconciliationInfo: {
          hasUnallocatedRevenue: false,
          quartersWithMissingRevenue: 0,
          averageMissingPercentage: 0
        },
        segmentColorMap: {
          'Total Revenue': '#3b82f6'
        }
      };
      
    } catch (error) {
      console.error(`❌ [REVENUE FALLBACK] Error for ${symbol}:`, error.message);
      return {
        symbol: symbol,
        hasSegmentData: false,
        data: [],
        error: error.message,
        message: `Unable to retrieve revenue data: ${error.message}`,
        isFallback: true
      };
    }
  }
}

// Export enhanced service
export default new EnhancedUnifiedDataService();
