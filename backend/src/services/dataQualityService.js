// Universal Data Quality Framework
// This will work for ALL stocks, not just individual fixes

import edgarService from './edgarService.js';
import eodService from './eodService.js';

class DataQualityService {
  constructor() {
    this.validationRules = {
      revenue: {
        minQuarterly: 1e6,    // $1M minimum
        maxQuarterly: 1e12,   // $1T maximum
        maxGrowthRate: 10,    // 1000% max growth
        minGrowthRate: -0.9   // -90% max decline
      },
      prices: {
        maxDailyChange: 0.5,  // 50% max daily change
        minPrice: 0.01,       // $0.01 minimum
        maxPrice: 100000      // $100k maximum
      }
    };
  }

  // Universal stock data validation
  async validateStockData(symbol) {
    console.log(`🔍 Validating data quality for ${symbol}...`);
    
    const results = {
      symbol,
      edgar: await this.validateEdgarData(symbol),
      prices: await this.validatePriceData(symbol),
      overall: 'pending'
    };
    
    results.overall = this.calculateOverallScore(results);
    return results;
  }

  // Validate EDGAR financial data
  async validateEdgarData(symbol) {
    try {
      const data = await edgarService.getCompanyFacts(symbol);
      const validation = {
        hasData: !!data,
        hasRevenue: false,
        hasQuarterlyData: false,
        hasRecentData: false,
        fiscalYearDetected: null,
        dataQualityScore: 0,
        issues: [],
        rawDataStructure: null
      };

      if (!data) {
        validation.issues.push('No EDGAR data available');
        return validation;
      }

      // Enhanced data structure analysis
      validation.rawDataStructure = {
        hasCompanyName: !!data.companyName,
        hasFiscalData: !!data.fiscalData,
        hasFundamentals: !!data.fundamentals,
        fiscalDataKeys: data.fiscalData ? Object.keys(data.fiscalData) : [],
        fundamentalsKeys: data.fundamentals ? Object.keys(data.fundamentals) : []
      };

      console.log(`📊 EDGAR data structure for ${symbol}:`, validation.rawDataStructure);

      // Check revenue data with improved structure handling
      const revenues = data.fiscalData?.Revenues || data.fundamentals?.fiscalData?.Revenues;
      if (revenues) {
        validation.hasRevenue = true;
        
        // Check quarterly data with multiple possible structures
        const quarterlyData = revenues.quarterly || revenues.qtd || [];
        if (quarterlyData && quarterlyData.length > 0) {
          validation.hasQuarterlyData = true;
          
          console.log(`📈 Found ${quarterlyData.length} quarterly revenue points for ${symbol}`);
          
          // Check data recency (within 6 months)
          const latestQuarter = quarterlyData[0];
          if (latestQuarter && latestQuarter.end) {
            const latestDate = new Date(latestQuarter.end);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            if (latestDate > sixMonthsAgo) {
              validation.hasRecentData = true;
            } else {
              validation.issues.push(`Latest quarterly data is old: ${latestDate.toLocaleDateString()}`);
            }
            
            // Detect fiscal year end
            validation.fiscalYearDetected = this.detectFiscalYearEnd(quarterlyData);
            
          } else {
            validation.issues.push('Invalid quarterly data structure - missing end dates');
          }
          
        } else {
          validation.issues.push('No quarterly revenue data found in EDGAR response');
          console.log(`❌ Revenue structure for ${symbol}:`, JSON.stringify(revenues, null, 2));
        }
        
        // Validate growth rates if fundamentals exist
        if (data.fundamentals) {
          const growthIssues = this.validateGrowthRates(data.fundamentals);
          validation.issues.push(...growthIssues);
        }
        
      } else {
        validation.issues.push('No revenue data found in EDGAR response');
        console.log(`❌ No revenue found in fiscal data keys:`, validation.rawDataStructure.fiscalDataKeys);
      }

      // Calculate quality score
      validation.dataQualityScore = this.calculateEdgarScore(validation);
      
      return validation;
      
    } catch (error) {
      console.error(`❌ EDGAR validation error for ${symbol}:`, error.message);
      return {
        hasData: false,
        issues: [`EDGAR error: ${error.message}`],
        dataQualityScore: 0,
        rawError: error.stack
      };
    }
  }

  // FIXED: Validate historical price data using correct method names
  async validatePriceData(symbol) {
    try {
      console.log(`📊 Validating price data for ${symbol}...`);
      
      let data;
      // FIXED: Use the correct method name from eodService
      try {
        // Try the actual method that exists
        data = await eodService.getHistoricalPrices(symbol, '1y');
        console.log(`✅ Successfully fetched historical prices: ${data?.length || 0} points`);
      } catch (error) {
        console.log(`❌ getHistoricalPrices failed: ${error.message}`);
        
        // Fallback to single stock data if available
        try {
          const stockData = await eodService.getSingleStockData(symbol);
          data = stockData.historicalData || [];
          console.log(`📈 Fallback to single stock data: ${data?.length || 0} points`);
        } catch (fallbackError) {
          console.log(`❌ Fallback also failed: ${fallbackError.message}`);
          throw new Error(`All price data methods failed: ${error.message}, ${fallbackError.message}`);
        }
      }

      const validation = {
        hasData: !!data && data.length > 0,
        dataPoints: data?.length || 0,
        hasSplitIssues: false,
        priceValidation: 'unknown',
        issues: [],
        dataStructure: null
      };

      if (!data || data.length === 0) {
        validation.issues.push('No historical price data available');
        return validation;
      }

      // Analyze data structure
      const samplePoint = data[0];
      validation.dataStructure = {
        hasDate: !!samplePoint.date,
        hasClose: !!samplePoint.close,
        hasPrice: !!samplePoint.price,
        hasVolume: !!samplePoint.volume,
        hasOHLC: !!(samplePoint.open && samplePoint.high && samplePoint.low),
        samplePoint: samplePoint
      };

      console.log(`📊 Price data structure for ${symbol}:`, validation.dataStructure);

      // Check for split adjustment issues
      const splitIssues = this.detectSplitIssues(data);
      if (splitIssues.length > 0) {
        validation.hasSplitIssues = true;
        validation.issues.push(...splitIssues);
      }

      // Validate price continuity
      const continuityIssues = this.validatePriceContinuity(data);
      validation.issues.push(...continuityIssues);

      validation.priceValidation = validation.issues.length === 0 ? 'good' : 'issues_found';
      
      return validation;
      
    } catch (error) {
      console.error(`❌ Price validation error for ${symbol}:`, error.message);
      return {
        hasData: false,
        issues: [`Price data error: ${error.message}`],
        priceValidation: 'error',
        rawError: error.stack
      };
    }
  }

  // Enhanced fiscal year detection with better error handling
  detectFiscalYearEnd(quarterlyData) {
    try {
      if (!quarterlyData || !Array.isArray(quarterlyData) || quarterlyData.length === 0) {
        return null;
      }

      // Look at the most recent quarterly filings
      const recentQuarters = quarterlyData.slice(0, 8);
      const months = recentQuarters
        .filter(q => q && q.end)
        .map(q => {
          try {
            return new Date(q.end).getMonth() + 1;
          } catch (e) {
            return null;
          }
        })
        .filter(m => m !== null);
      
      if (months.length === 0) {
        return null;
      }

      // Find the most common quarter-end month pattern
      const monthCounts = {};
      months.forEach(month => {
        const quarterEnd = this.getQuarterEndMonth(month);
        monthCounts[quarterEnd] = (monthCounts[quarterEnd] || 0) + 1;
      });
      
      if (Object.keys(monthCounts).length === 0) {
        return null;
      }

      const mostCommonMonth = Object.keys(monthCounts).reduce((a, b) => 
        monthCounts[a] > monthCounts[b] ? a : b
      );
      
      return parseInt(mostCommonMonth);
    } catch (error) {
      console.error('Error detecting fiscal year end:', error.message);
      return null; // Default to null if detection fails
    }
  }

  getQuarterEndMonth(month) {
    // Standard quarters: Mar(3), Jun(6), Sep(9), Dec(12)
    // But some companies have shifted quarters
    if (month <= 3) return 3;
    if (month <= 6) return 6; 
    if (month <= 9) return 9;
    return 12;
  }

  // Enhanced growth rate validation with better error handling
  validateGrowthRates(fundamentals) {
    const issues = [];
    
    try {
      // Handle multiple possible growth data structures
      const growth = fundamentals.growth || fundamentals.legacy || {};
      
      // Check YoY revenue growth with multiple path attempts
      const yoyPaths = [
        ['yearOverYear', 'revenue', 'growth'],
        ['legacy', 'revenueGrowth'],
        ['ratios', 'revenueGrowthYoY']
      ];

      let yoyGrowth = null;
      for (const path of yoyPaths) {
        let current = growth;
        let found = true;
        
        for (const key of path) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && typeof current === 'number') {
          yoyGrowth = current;
          break;
        }
      }

      if (yoyGrowth !== null) {
        // Convert to decimal if it looks like a percentage
        const growthRate = Math.abs(yoyGrowth) > 10 ? yoyGrowth / 100 : yoyGrowth;
        
        if (growthRate > this.validationRules.revenue.maxGrowthRate) {
          issues.push(`Unrealistic YoY growth: ${(growthRate * 100).toFixed(1)}%`);
        }
        if (growthRate < this.validationRules.revenue.minGrowthRate) {
          issues.push(`Extreme YoY decline: ${(growthRate * 100).toFixed(1)}%`);
        }
      }

      // Check 5-year CAGR with multiple path attempts
      const cagrPaths = [
        ['fiveYear', 'revenue', 'cagr'],
        ['legacy', 'cagr'],
        ['growth', 'cagr5Y']
      ];

      let cagr = null;
      for (const path of cagrPaths) {
        let current = growth;
        let found = true;
        
        for (const key of path) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && typeof current === 'number') {
          cagr = current;
          break;
        }
      }

      if (cagr !== null) {
        // Convert to decimal if it looks like a percentage
        const cagrRate = Math.abs(cagr) > 10 ? cagr / 100 : cagr;
        
        if (cagrRate > this.validationRules.revenue.maxGrowthRate) {
          issues.push(`Unrealistic 5Y CAGR: ${(cagrRate * 100).toFixed(1)}%`);
        }
      }

    } catch (error) {
      issues.push(`Growth validation error: ${error.message}`);
    }
    
    return issues;
  }

  // Enhanced split detection with better data handling
  detectSplitIssues(priceData) {
    const issues = [];
    
    try {
      if (!priceData || !Array.isArray(priceData) || priceData.length < 2) {
        return issues;
      }

      // Check for unrealistic price jumps that suggest unadjusted splits
      const checkCount = Math.min(priceData.length - 1, 100);
      
      for (let i = 1; i < checkCount; i++) {
        const current = priceData[i-1];
        const previous = priceData[i];
        
        // Handle multiple possible price field names
        const currentPrice = current.close || current.price || current.adjusted_close;
        const prevPrice = previous.close || previous.price || previous.adjusted_close;
        
        if (currentPrice && prevPrice && typeof currentPrice === 'number' && typeof prevPrice === 'number') {
          const change = Math.abs(currentPrice - prevPrice) / prevPrice;
          
          // Flag jumps > 50% as potential split issues
          if (change > 0.5) {
            const ratio = currentPrice / prevPrice;
            
            // Check if it's a clean split ratio (2:1, 3:1, etc.)
            if (this.isLikelySplitRatio(ratio)) {
              const dateStr = current.date || current.timestamp || 'unknown date';
              issues.push(`Potential unadjusted split: ${dateStr} (${ratio.toFixed(1)}:1 ratio)`);
            }
          }
        }
      }
    } catch (error) {
      issues.push(`Split detection error: ${error.message}`);
    }
    
    return issues;
  }

  isLikelySplitRatio(ratio) {
    // Common split ratios: 2:1, 3:1, 4:1, 5:1, 10:1, etc.
    const commonRatios = [0.5, 0.33, 0.25, 0.2, 0.1, 2, 3, 4, 5, 10];
    return commonRatios.some(r => Math.abs(ratio - r) < 0.05);
  }

  // Enhanced price continuity validation
  validatePriceContinuity(priceData) {
    const issues = [];
    
    try {
      if (!priceData || !Array.isArray(priceData) || priceData.length < 2) {
        return issues;
      }

      let suspiciousJumps = 0;
      const checkCount = Math.min(priceData.length - 1, 250); // Check last year
      
      for (let i = 1; i < checkCount; i++) {
        const current = priceData[i-1];
        const previous = priceData[i];
        
        // Handle multiple possible price field names
        const currentPrice = current.close || current.price || current.adjusted_close;
        const prevPrice = previous.close || previous.price || previous.adjusted_close;
        
        if (currentPrice && prevPrice && typeof currentPrice === 'number' && typeof prevPrice === 'number') {
          const change = Math.abs(currentPrice - prevPrice) / prevPrice;
          
          if (change > this.validationRules.prices.maxDailyChange) {
            suspiciousJumps++;
          }
        }
      }
      
      if (suspiciousJumps > 5) {
        issues.push(`Many suspicious price jumps detected: ${suspiciousJumps}`);
      }
      
    } catch (error) {
      issues.push(`Price continuity error: ${error.message}`);
    }
    
    return issues;
  }

  // Calculate overall data quality scores
  calculateEdgarScore(validation) {
    let score = 0;
    if (validation.hasData) score += 25;
    if (validation.hasRevenue) score += 25;
    if (validation.hasQuarterlyData) score += 25;
    if (validation.hasRecentData) score += 25;
    
    // Deduct for issues
    score -= validation.issues.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateOverallScore(results) {
    const edgarScore = results.edgar.dataQualityScore || 0;
    const priceScore = results.prices.hasData ? 
      (results.prices.issues.length === 0 ? 100 : 50) : 0;
    
    const overall = (edgarScore + priceScore) / 2;
    
    if (overall >= 80) return 'excellent';
    if (overall >= 60) return 'good';
    if (overall >= 40) return 'fair';
    return 'poor';
  }

  // Enhanced system-wide validation with better error handling
  async validateMultipleStocks(symbols) {
    console.log('🔍 Running system-wide data quality validation...\n');
    
    const results = {};
    
    for (const symbol of symbols) {
      try {
        console.log(`\n📊 Validating ${symbol}...`);
        results[symbol] = await this.validateStockData(symbol);
        
        const result = results[symbol];
        console.log(`✅ ${symbol}: ${result.overall} (EDGAR: ${result.edgar.dataQualityScore}%, Price: ${result.prices.hasData ? 'OK' : 'FAIL'})`);
        
        if (result.edgar.issues.length > 0) {
          console.log(`   EDGAR Issues: ${result.edgar.issues.join(', ')}`);
        }
        
        if (result.prices.issues.length > 0) {
          console.log(`   Price Issues: ${result.prices.issues.join(', ')}`);
        }
        
      } catch (error) {
        results[symbol] = { 
          symbol,
          error: error.message,
          overall: 'error'
        };
        console.log(`❌ ${symbol}: Error - ${error.message}`);
      }
    }
    
    return results;
  }

  // NEW: Quick validation method for single stock (for API endpoint)
  async quickValidate(symbol) {
    try {
      const results = await this.validateStockData(symbol);
      return {
        symbol,
        status: results.overall,
        edgarScore: results.edgar.dataQualityScore,
        priceData: results.prices.hasData,
        issues: [
          ...results.edgar.issues,
          ...results.prices.issues
        ],
        summary: `${results.overall} quality (${results.edgar.dataQualityScore}% EDGAR)`
      };
    } catch (error) {
      return {
        symbol,
        status: 'error',
        error: error.message,
        summary: 'Validation failed'
      };
    }
  }
}

export default new DataQualityService();
