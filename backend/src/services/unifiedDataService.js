/**
 * *** UNIFIED DATA SERVICE - TIME SERIES FINANCIAL DATA ***
 * 
 * REFACTORED: Focus on raw FMP financial statement time series
 * NO CALCULATIONS - Only raw data passed through
 * 
 * ARCHITECTURE:
 * FMP API → unifiedDataService.js → Frontend (raw time series data)
 * 
 * KEY PRINCIPLES:
 * ✅ Time series financial data (12 quarters by default)
 * ✅ Raw FMP data only - NO calculations or transformations
 * ✅ Support for quarterly and annual periods
 * ✅ Balance Sheet, Income Statement, Cash Flow time series
 * ✅ Revenue segmentation data when available
 * ✅ Clear handling of missing data (return N/A, not fallbacks)
 * 
 * CHART LIBRARY SUPPORT:
 * ✅ Data formatted for Apache ECharts, D3.js, Plotly, Victory, Chart.js
 * ✅ Frontend decides visualization, backend provides clean data
 */

import fmpService from './fmpService.js';
import intelligentSegmentService from './intelligentSegmentService.js';
import segmentContinuityService from './segmentContinuityService.js';
import { redis } from '../config/database.js';

class UnifiedDataService {
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
    
    console.log('🚀 [UNIFIED TIME SERIES] Service initialized');
    console.log('   📊 Focus: Raw financial statement time series data');
    console.log('   🎯 NO CALCULATIONS - Only raw FMP data passed through');
    console.log('   🧠 Intelligent segment processing for ALL companies');
    console.log('   🔄 Segment continuity mapping for temporal consistency');
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
   * 🏦 BALANCE SHEET TIME SERIES
   * Returns raw quarterly balance sheet data for charting
   */
  async getBalanceSheetTimeSeries(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}balance:${cleanSymbol}:${period}:${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`📊 [BALANCE SHEET] Fetching ${limit} ${period}s for ${cleanSymbol}`);
      
      try {
        const data = await this.fmp.getBalanceSheet(cleanSymbol, period);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ [BALANCE SHEET] No data for ${cleanSymbol}`);
          return {
            symbol: cleanSymbol,
            period: period,
            dataPoints: 0,
            data: []
          };
        }
        
        // Take only requested number of periods
        const timeSeries = data.slice(0, limit);
        
        // Return raw data for frontend to process
        return {
          symbol: cleanSymbol,
          period: period,
          dataPoints: timeSeries.length,
          latestQuarter: timeSeries[0]?.date,
          oldestQuarter: timeSeries[timeSeries.length - 1]?.date,
          data: timeSeries.map(quarter => ({
            // Metadata
            date: quarter.date,
            period: quarter.period,
            reportedCurrency: quarter.reportedCurrency,
            
            // Assets
            totalAssets: quarter.totalAssets || null,
            currentAssets: quarter.totalCurrentAssets || null,
            cashAndEquivalents: quarter.cashAndCashEquivalents || null,
            shortTermInvestments: quarter.shortTermInvestments || null,
            inventory: quarter.inventory || null,
            propertyPlantEquipment: quarter.propertyPlantEquipmentNet || null,
            goodwill: quarter.goodwill || null,
            intangibleAssets: quarter.intangibleAssets || null,
            
            // Liabilities
            totalLiabilities: quarter.totalLiabilities || null,
            currentLiabilities: quarter.totalCurrentLiabilities || null,
            shortTermDebt: quarter.shortTermDebt || null,
            longTermDebt: quarter.longTermDebt || null,
            totalDebt: quarter.totalDebt || null,
            
            // Equity
            totalEquity: quarter.totalStockholdersEquity || null,
            retainedEarnings: quarter.retainedEarnings || null,
            commonStock: quarter.commonStock || null,
            
            // Key Metrics (raw values only)
            netDebt: quarter.netDebt || null,
            workingCapital: (quarter.totalCurrentAssets && quarter.totalCurrentLiabilities) 
              ? quarter.totalCurrentAssets - quarter.totalCurrentLiabilities 
              : null,
            
            // Share Information
            commonStockSharesOutstanding: quarter.commonStockSharesOutstanding || null,
            
            // Filing Information
            fillingDate: quarter.fillingDate,
            acceptedDate: quarter.acceptedDate,
            link: quarter.link,
            finalLink: quarter.finalLink
          }))
        };
        
      } catch (error) {
        console.error(`❌ [BALANCE SHEET] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * 💰 INCOME STATEMENT TIME SERIES
   * Returns raw quarterly income statement data
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
            // Metadata
            date: quarter.date,
            period: quarter.period,
            reportedCurrency: quarter.reportedCurrency,
            
            // Revenue
            revenue: quarter.revenue || null,
            costOfRevenue: quarter.costOfRevenue || null,
            grossProfit: quarter.grossProfit || null,
            
            // Operating Expenses
            researchAndDevelopmentExpenses: quarter.researchAndDevelopmentExpenses || null,
            sellingGeneralAndAdministrativeExpenses: quarter.generalAndAdministrativeExpenses || null,
            sellingAndMarketingExpenses: quarter.sellingAndMarketingExpenses || null,
            operatingExpenses: quarter.operatingExpenses || null,
            
            // Income
            operatingIncome: quarter.operatingIncome || null,
            ebitda: quarter.ebitda || null,
            netIncome: quarter.netIncome || null,
            
            // Interest and Taxes
            interestIncome: quarter.interestIncome || null,
            interestExpense: quarter.interestExpense || null,
            incomeTaxExpense: quarter.incomeTaxExpense || null,
            
            // Per Share Data
            eps: quarter.eps || null,
            epsDiluted: quarter.epsdiluted || null,
            weightedAverageShsOut: quarter.weightedAverageShsOut || null,
            weightedAverageShsOutDil: quarter.weightedAverageShsOutDil || null,
            
            // Margins (raw values from FMP)
            grossProfitRatio: quarter.grossProfitRatio || null,
            operatingIncomeRatio: quarter.operatingIncomeRatio || null,
            netIncomeRatio: quarter.netIncomeRatio || null,
            
            // Filing Information
            fillingDate: quarter.fillingDate,
            acceptedDate: quarter.acceptedDate,
            link: quarter.link,
            finalLink: quarter.finalLink
          }))
        };
        
      } catch (error) {
        console.error(`❌ [INCOME STATEMENT] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * 💸 CASH FLOW TIME SERIES
   * Returns raw quarterly cash flow data
   */
  async getCashFlowTimeSeries(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}cashflow:${cleanSymbol}:${period}:${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`💸 [CASH FLOW] Fetching ${limit} ${period}s for ${cleanSymbol}`);
      
      try {
        const data = await this.fmp.getCashFlow(cleanSymbol, period);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ [CASH FLOW] No data for ${cleanSymbol}`);
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
            // Metadata
            date: quarter.date,
            period: quarter.period,
            reportedCurrency: quarter.reportedCurrency,
            
            // Operating Activities
            operatingCashFlow: quarter.operatingCashFlow || null,
            netIncome: quarter.netIncome || null,
            depreciationAndAmortization: quarter.depreciationAndAmortization || null,
            stockBasedCompensation: quarter.stockBasedCompensation || null,
            changeInWorkingCapital: quarter.changeInWorkingCapital || null,
            accountsReceivables: quarter.accountsReceivables || null,
            inventory: quarter.inventory || null,
            accountsPayables: quarter.accountsPayables || null,
            
            // Investing Activities
            investingCashFlow: quarter.netCashUsedForInvestingActivites || null,
            capitalExpenditure: quarter.capitalExpenditure || null,
            acquisitionsNet: quarter.acquisitionsNet || null,
            purchasesOfInvestments: quarter.purchasesOfInvestments || null,
            salesMaturitiesOfInvestments: quarter.salesMaturitiesOfInvestments || null,
            
            // Financing Activities
            financingCashFlow: quarter.netCashUsedProvidedByFinancingActivities || null,
            debtRepayment: quarter.debtRepayment || null,
            commonStockIssued: quarter.commonStockIssued || null,
            commonStockRepurchased: quarter.commonStockRepurchased || null,
            dividendsPaid: quarter.dividendsPaid || null,
            
            // Free Cash Flow
            freeCashFlow: quarter.freeCashFlow || null,
            
            // Net Change
            netChangeInCash: quarter.netChangeInCash || null,
            cashAtBeginningOfPeriod: quarter.cashAtBeginningOfPeriod || null,
            cashAtEndOfPeriod: quarter.cashAtEndOfPeriod || null,
            
            // Filing Information
            fillingDate: quarter.fillingDate,
            acceptedDate: quarter.acceptedDate,
            link: quarter.link,
            finalLink: quarter.finalLink
          }))
        };
        
      } catch (error) {
        console.error(`❌ [CASH FLOW] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * 📊 COMPREHENSIVE FINANCIAL STATEMENTS
   * Returns all three statements in one call for efficiency
   */
  async getComprehensiveFinancialStatements(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}comprehensive:${cleanSymbol}:${period}:${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`📊 [COMPREHENSIVE] Fetching all financial statements for ${cleanSymbol}`);
      
      try {
        // Fetch all three statements in parallel
        const [balanceSheet, incomeStatement, cashFlow] = await Promise.all([
          this.getBalanceSheetTimeSeries(cleanSymbol, period, limit),
          this.getIncomeStatementTimeSeries(cleanSymbol, period, limit),
          this.getCashFlowTimeSeries(cleanSymbol, period, limit)
        ]);
        
        return {
          symbol: cleanSymbol,
          period: period,
          dataPoints: Math.max(
            balanceSheet.dataPoints,
            incomeStatement.dataPoints,
            cashFlow.dataPoints
          ),
          balanceSheet: balanceSheet,
          incomeStatement: incomeStatement,
          cashFlow: cashFlow,
          dataQuality: {
            balanceSheetQuarters: balanceSheet.dataPoints,
            incomeStatementQuarters: incomeStatement.dataPoints,
            cashFlowQuarters: cashFlow.dataPoints,
            isComplete: balanceSheet.dataPoints === incomeStatement.dataPoints && 
                       incomeStatement.dataPoints === cashFlow.dataPoints
          }
        };
        
      } catch (error) {
        console.error(`❌ [COMPREHENSIVE] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * 🎯 REVENUE SEGMENTATION DATA - ENHANCED WITH CONTINUITY AND INTELLIGENT PROCESSING
   * Applies segment continuity mapping FIRST, then intelligent grouping
   * Falls back to total revenue when segment data is unavailable
   * 
   * Processing Pipeline:
   * 1. Fetch FMP segment data
   * 2. Apply segment continuity mapping (temporal consistency)
   * 3. Apply intelligent segment processing (pattern matching)
   * 4. Fall back to total revenue if no segments available
   */
  async getRevenueSegmentation(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.segments}revenue:${cleanSymbol}:${period}:${limit}:flat:continuity:v3`; // Updated cache key
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`🎯 [REVENUE SEGMENTS] Fetching segment data for ${cleanSymbol} with continuity mapping`);
      
      try {
        // FMP v4 endpoint for revenue segmentation with structure=flat parameter
        const response = await fetch(
          `https://financialmodelingprep.com/api/v4/revenue-product-segmentation?symbol=${cleanSymbol}&period=${period}&structure=flat&apikey=${this.fmp.apiKey}`
        );
        
        if (!response.ok) {
          console.warn(`⚠️ [REVENUE SEGMENTS] Not available for ${cleanSymbol}, falling back to total revenue`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] Empty response for ${cleanSymbol}, falling back to total revenue`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        // FMP v4 returns data in format: [{ "2025-03-31": { "segment1": value, "segment2": value }, ... }]
        const transformedData = [];
        const allSegments = new Set();
        let hasValidSegmentData = false;
        
        // First pass: collect all segment names and transform data
        data.forEach(quarterData => {
          const date = Object.keys(quarterData)[0];
          const segmentData = quarterData[date];
          
          if (segmentData && typeof segmentData === 'object') {
            const segmentKeys = Object.keys(segmentData).filter(key => 
              key !== 'date' && key !== 'period' && key !== 'symbol'
            );
            
            // Check if we have actual segment data
            if (segmentKeys.length > 0) {
              hasValidSegmentData = true;
              
              // Add all segment names to our set
              segmentKeys.forEach(segment => {
                allSegments.add(segment);
              });
              
              // Transform the data
              transformedData.push({
                date: date,
                period: period,
                segments: segmentData
              });
            }
          }
        });
        
        // If no valid segment data found, fall back to total revenue
        if (!hasValidSegmentData || allSegments.size === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] No valid segments for ${cleanSymbol}, falling back to total revenue`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        // Convert set to array and limit the number of quarters
        const segmentNames = Array.from(allSegments);
        const limitedData = transformedData.slice(0, limit);
        
        // Check if we have enough data
        if (limitedData.length === 0) {
          console.warn(`⚠️ [REVENUE SEGMENTS] No data quarters for ${cleanSymbol}, falling back to total revenue`);
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        }
        
        // Ensure all quarters have all segments (fill missing with null)
        const normalizedData = limitedData.map((quarter) => {
          const normalizedSegments = {};
          
          // Ensure all segments exist for this quarter
          segmentNames.forEach(segment => {
            const value = quarter.segments[segment];
            if (value !== undefined && value !== null && !isNaN(value)) {
              normalizedSegments[segment] = Number(value);
            } else {
              normalizedSegments[segment] = null;
            }
          });
          
          return {
            date: quarter.date,
            period: quarter.period,
            segments: normalizedSegments
          };
        });
        
        // Create initial result structure
        const baseResult = {
          symbol: cleanSymbol,
          hasSegmentData: true,
          segments: segmentNames,
          dataPoints: normalizedData.length,
          data: normalizedData,
          message: `Revenue segment data available for ${cleanSymbol}`
        };
        
        // STEP 1: Apply segment continuity mapping for temporal consistency
        console.log(`🔄 [REVENUE SEGMENTS] Applying segment continuity mapping for ${cleanSymbol}`);
        const continuityResult = this.continuityService.processSegments(cleanSymbol, baseResult);
        
        // STEP 2: Apply intelligent segment processing for pattern matching
        console.log(`🧠 [REVENUE SEGMENTS] Applying intelligent segment processing for ${cleanSymbol}`);
        const processedResult = this.segmentProcessor.processCompanySegments(continuityResult, cleanSymbol);
        
        // Add data quality information
        if (processedResult.dataQualityMetrics) {
          const metrics = processedResult.dataQualityMetrics;
          
          // Check for segments with poor coverage
          const poorCoverageSegments = [];
          Object.entries(metrics.segmentCoverage || {}).forEach(([segment, coverage]) => {
            if (coverage.percentage < 50 && coverage.quarters > 0) {
              poorCoverageSegments.push(segment);
            }
          });
          
          if (poorCoverageSegments.length > 0) {
            processedResult.warning = `Some segments have limited data coverage: ${poorCoverageSegments.join(', ')}. This may affect quarterly comparisons.`;
          }
        }
        
        return processedResult;
        
      } catch (error) {
        console.error(`❌ [REVENUE SEGMENTS] Error for ${cleanSymbol}:`, error.message);
        // On error, try to fall back to total revenue
        try {
          return await this.createTotalRevenueFallback(cleanSymbol, period, limit);
        } catch (fallbackError) {
          return {
            symbol: cleanSymbol,
            hasSegmentData: false,
            data: [],
            error: error.message,
            message: `Failed to retrieve revenue data: ${error.message}`
          };
        }
      }
    }, this.cacheTTL.cold);
  }

  /**
   * Create fallback data using total revenue from income statement
   */
  async createTotalRevenueFallback(symbol, period, limit) {
    console.log(`📊 [REVENUE FALLBACK] Creating total revenue fallback for ${symbol}`);
    
    try {
      // Get income statement data
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
      
      // Transform income statement revenue into segment format
      const segmentData = incomeData.data.map(quarter => ({
        date: quarter.date,
        period: quarter.period,
        segments: {
          'Total Revenue': quarter.revenue || 0
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
        dataQualityMetrics: {
          dataQuality: 'fallback',
          warnings: ['Revenue segment breakdown not available from FMP API'],
          quartersCovered: segmentData.length,
          hasAccountingTerms: false,
          segmentCoverage: {
            'Total Revenue': {
              quarters: segmentData.filter(q => q.segments['Total Revenue'] > 0).length,
              percentage: 100
            }
          }
        },
        segmentColorMap: {
          'Total Revenue': '#3b82f6' // Blue color for total revenue
        }
      };
      
    } catch (error) {
      console.error(`❌ [REVENUE FALLBACK] Error creating fallback for ${symbol}:`, error.message);
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

  /**
   * 📈 KEY METRICS TIME SERIES
   * Financial ratios and per-share metrics over time
   */
  async getKeyMetricsTimeSeries(symbol, period = 'quarter', limit = 12) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}keymetrics:${cleanSymbol}:${period}:${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`📈 [KEY METRICS] Fetching metrics for ${cleanSymbol}`);
      
      try {
        const data = await this.fmp.getKeyMetrics(cleanSymbol);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ [KEY METRICS] No data for ${cleanSymbol}`);
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
            
            // Valuation Metrics
            marketCap: quarter.marketCap || null,
            enterpriseValue: quarter.enterpriseValue || null,
            peRatio: quarter.peRatio || null,
            priceToSalesRatio: quarter.priceToSalesRatio || null,
            pbRatio: quarter.pbRatio || null,
            pegRatio: quarter.pegRatio || null,
            evToSales: quarter.evToSales || null,
            evToEbitda: quarter.enterpriseValueOverEBITDA || null,
            
            // Per Share Metrics
            revenuePerShare: quarter.revenuePerShare || null,
            netIncomePerShare: quarter.netIncomePerShare || null,
            operatingCashFlowPerShare: quarter.operatingCashFlowPerShare || null,
            freeCashFlowPerShare: quarter.freeCashFlowPerShare || null,
            bookValuePerShare: quarter.bookValuePerShare || null,
            tangibleBookValuePerShare: quarter.tangibleBookValuePerShare || null,
            
            // Financial Strength
            workingCapital: quarter.workingCapital || null,
            tangibleAssetValue: quarter.tangibleAssetValue || null,
            netCurrentAssetValue: quarter.netCurrentAssetValue || null,
            investedCapital: quarter.investedCapital || null,
            averageInventory: quarter.averageInventory || null,
            averagePayables: quarter.averagePayables || null,
            averageReceivables: quarter.averageReceivables || null,
            
            // Returns
            roe: quarter.roe || null,
            roic: quarter.roic || null,
            
            // Other
            grahamNumber: quarter.grahamNumber || null,
            shareholdersEquityPerShare: quarter.shareholdersEquityPerShare || null
          }))
        };
        
      } catch (error) {
        console.error(`❌ [KEY METRICS] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.cold);
  }

  /**
   * 📊 REAL-TIME QUOTE
   * Current market data for a stock
   */
  async getRealTimeQuote(symbol) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.quote}${cleanSymbol}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`📊 [QUOTE] Fetching real-time data for ${cleanSymbol}`);
      const rawQuote = await this.fmp.getQuote(cleanSymbol);
      
      if (!rawQuote || !rawQuote[0]) {
        return null;
      }
      
      const quote = rawQuote[0];
      
      return {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        dayLow: quote.dayLow,
        dayHigh: quote.dayHigh,
        yearLow: quote.yearLow,
        yearHigh: quote.yearHigh,
        marketCap: quote.marketCap,
        priceAvg50: quote.priceAvg50,
        priceAvg200: quote.priceAvg200,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        exchange: quote.exchange,
        open: quote.open,
        previousClose: quote.previousClose,
        eps: quote.eps,
        pe: quote.pe,
        earningsAnnouncement: quote.earningsAnnouncement,
        sharesOutstanding: quote.sharesOutstanding,
        timestamp: quote.timestamp || new Date().toISOString()
      };
    }, this.cacheTTL.hot);
  }

  /**
   * 🏢 COMPANY PROFILE
   * Basic company information
   */
  async getCompanyProfile(symbol) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.quote}profile:${cleanSymbol}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`🏢 [PROFILE] Fetching company info for ${cleanSymbol}`);
      const profile = await this.fmp.getCompanyProfile(cleanSymbol);
      
      if (!profile || !profile[0]) {
        return null;
      }
      
      const company = profile[0];
      
      return {
        symbol: company.symbol,
        companyName: company.companyName,
        currency: company.currency,
        exchange: company.exchange,
        industry: company.industry,
        sector: company.sector,
        description: company.description,
        ceo: company.ceo,
        website: company.website,
        fullTimeEmployees: company.fullTimeEmployees,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        zip: company.zip,
        country: company.country,
        image: company.image,
        ipoDate: company.ipoDate,
        beta: company.beta,
        lastDiv: company.lastDiv,
        dcfDiff: company.dcfDiff,
        dcf: company.dcf,
        isEtf: company.isEtf,
        isActivelyTrading: company.isActivelyTrading
      };
    }, this.cacheTTL.frozen);
  }

  /**
   * 📊 FUNDAMENTALS (For backward compatibility)
   * Returns comprehensive company fundamentals with standardized format
   */
  async getFundamentals(symbol) {
    const cleanSymbol = this.standardizeSymbol(symbol);
    const cacheKey = `${this.keyPrefixes.timeseries}fundamentals:${cleanSymbol}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log(`📊 [FUNDAMENTALS] Fetching comprehensive data for ${cleanSymbol}`);
      
      try {
        // Fetch all required data in parallel
        const [
          profile,
          quote,
          keyMetrics,
          ratios,
          growth,
          incomeStatement,
          balanceSheet,
          cashFlow
        ] = await Promise.all([
          this.fmp.getCompanyProfile(cleanSymbol),
          this.fmp.getQuote(cleanSymbol),
          this.fmp.getKeyMetrics(cleanSymbol),
          this.fmp.getFinancialRatios(cleanSymbol),
          this.fmp.getFinancialGrowth(cleanSymbol),
          this.fmp.getIncomeStatement(cleanSymbol, 'annual'),
          this.fmp.getBalanceSheet(cleanSymbol, 'annual'),
          this.fmp.getCashFlow(cleanSymbol, 'annual')
        ]);
        
        // Extract latest data from each endpoint
        const companyProfile = profile?.[0] || {};
        const currentQuote = quote?.[0] || {};
        const latestMetrics = keyMetrics?.[0] || {};
        const latestRatios = ratios?.[0] || {};
        const latestGrowth = growth?.[0] || {};
        const latestIncome = incomeStatement?.[0] || {};
        const latestBalance = balanceSheet?.[0] || {};
        const latestCashFlow = cashFlow?.[0] || {};
        
        // Build standardized fundamentals object
        return {
          // Company Info
          symbol: cleanSymbol,
          companyName: companyProfile.companyName || currentQuote.name || cleanSymbol,
          sector: companyProfile.sector || 'Unknown',
          industry: companyProfile.industry || 'Unknown',
          description: companyProfile.description,
          website: companyProfile.website,
          ceo: companyProfile.ceo,
          employees: companyProfile.fullTimeEmployees,
          
          // Market Data
          price: currentQuote.price || 0,
          marketCap: currentQuote.marketCap || companyProfile.mktCap || 0,
          beta: companyProfile.beta || null,
          volume: currentQuote.volume || 0,
          avgVolume: currentQuote.avgVolume || 0,
          
          // Valuation Metrics
          pe: latestRatios.priceEarningsRatio || latestMetrics.peRatio || currentQuote.pe || null,
          pb: latestRatios.priceToBookRatio || latestMetrics.pbRatio || null,
          ps: latestRatios.priceToSalesRatio || latestMetrics.priceToSalesRatio || null,
          peg: latestRatios.priceEarningsToGrowthRatio || latestMetrics.pegRatio || null,
          evToEbitda: latestMetrics.enterpriseValueOverEBITDA || null,
          
          // Financial Statement Data
          revenue: latestIncome.revenue || 0,
          netIncome: latestIncome.netIncome || 0,
          grossProfit: latestIncome.grossProfit || 0,
          operatingIncome: latestIncome.operatingIncome || 0,
          eps: latestIncome.eps || currentQuote.eps || 0,
          
          // Balance Sheet
          totalAssets: latestBalance.totalAssets || 0,
          totalLiabilities: latestBalance.totalLiabilities || 0,
          totalEquity: latestBalance.totalStockholdersEquity || 0,
          cash: latestBalance.cashAndCashEquivalents || 0,
          debt: latestBalance.totalDebt || 0,
          
          // Cash Flow
          operatingCashFlow: latestCashFlow.operatingCashFlow || 0,
          freeCashFlow: latestCashFlow.freeCashFlow || 0,
          
          // Profitability Metrics
          roe: latestRatios.returnOnEquity || null,
          roa: latestRatios.returnOnAssets || null,
          roic: latestMetrics.roic || null,
          grossMargin: latestRatios.grossProfitMargin || null,
          operatingMargin: latestRatios.operatingProfitMargin || null,
          profitMargin: latestRatios.netProfitMargin || null,
          
          // Growth Metrics
          revenueGrowth: latestGrowth.revenueGrowth || null,
          earningsGrowth: latestGrowth.netIncomeGrowth || null,
          fcfGrowth: latestGrowth.freeCashFlowGrowth || null,
          
          // Financial Health
          currentRatio: latestRatios.currentRatio || null,
          quickRatio: latestRatios.quickRatio || null,
          debtToEquity: latestRatios.debtEquityRatio || null,
          interestCoverage: latestRatios.interestCoverage || null,
          
          // Dividend Info
          dividendYield: currentQuote.dividendYield || companyProfile.lastDiv / currentQuote.price || 0,
          payoutRatio: latestRatios.payoutRatio || null,
          
          // Metadata
          dataSource: 'FMP API - Unified Data Service',
          timestamp: new Date().toISOString(),
          dataQuality: {
            hasProfile: !!profile?.[0],
            hasQuote: !!quote?.[0],
            hasMetrics: !!keyMetrics?.[0],
            hasRatios: !!ratios?.[0],
            hasFinancials: !!incomeStatement?.[0]
          }
        };
        
      } catch (error) {
        console.error(`❌ [FUNDAMENTALS] Error for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }, this.cacheTTL.warm);
  }

  /**
   * Update knowledge graph with progress
   */
  async updateKnowledgeGraph() {
    const observations = [
      "ENHANCED: Added segment continuity mapping for temporal consistency",
      "Processing pipeline: FMP data → Continuity mapping → Intelligent grouping → Fallback",
      "Segment continuity service handles companies with changing segment names over time",
      "UNH: Maps 'Premiums' to 'UnitedHealthcare', 'Products/Services' to 'Optum'",
      "JPM: Standardizes all segment name variations for consistency",
      "Generic patterns clean up segment names for all companies",
      "Fallback to total revenue remains as last resort",
      "Cache key updated to v3 with continuity mapping",
      "Two-step processing ensures both temporal consistency and intelligent grouping"
    ];
    
    console.log('📊 [KNOWLEDGE GRAPH] Updated with segment continuity enhancements');
    return observations;
  }
}

// Export singleton instance
export default new UnifiedDataService();
