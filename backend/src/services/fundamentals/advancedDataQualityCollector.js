import fmpService from '../fmpService.js';
import { redis } from '../../config/database.js';

/**
 * *** ADVANCED DATA QUALITY COLLECTOR - FIXED SAVE LOGIC ***
 * 
 * This service implements machine learning and statistical approaches for
 * fundamentals data quality improvement, addressing user requirements for:
 * - Perfect data accuracy (no synthetic data)
 * - Historical analysis for anomaly detection  
 * - Advanced data science approaches
 * - Top 10-25 results instead of just 5
 * - BULLETPROOF SAVE LOGIC - NO MORE DATA LOSS
 */

export class AdvancedDataQualityCollector {
  constructor() {
    this.fmp = fmpService;
    this.cache_ttl = 7 * 24 * 60 * 60; // 7 days
  }

  /**
   * Get S&P 500 constituents with error handling
   */
  async getSP500Constituents() {
    try {
      // Try to get S&P 500 list from FMP
      const sp500Data = await this.fmp.makeRequest('/v3/sp500_constituent', {}, 1440);
      
      if (sp500Data && Array.isArray(sp500Data) && sp500Data.length > 0) {
        console.log(`✅ [ADVANCED] Retrieved ${sp500Data.length} S&P 500 constituents from FMP`);
        return sp500Data;
      }
      
      // Fallback to most common S&P 500 symbols if API fails
      console.log('⚠️ [ADVANCED] Using fallback S&P 500 list');
      return this.getFallbackSP500List();
      
    } catch (error) {
      console.error('❌ [ADVANCED] Error getting S&P 500 constituents:', error.message);
      return this.getFallbackSP500List();
    }
  }

  /**
   * Fallback S&P 500 list (major companies)
   */
  getFallbackSP500List() {
    return [
      { symbol: 'AAPL' }, { symbol: 'MSFT' }, { symbol: 'GOOGL' }, { symbol: 'AMZN' }, { symbol: 'NVDA' },
      { symbol: 'TSLA' }, { symbol: 'META' }, { symbol: 'BRK.B' }, { symbol: 'UNH' }, { symbol: 'JNJ' },
      { symbol: 'JPM' }, { symbol: 'V' }, { symbol: 'PG' }, { symbol: 'HD' }, { symbol: 'MA' },
      { symbol: 'AVGO' }, { symbol: 'PFE' }, { symbol: 'KO' }, { symbol: 'ABBV' }, { symbol: 'BAC' },
      { symbol: 'PEP' }, { symbol: 'TMO' }, { symbol: 'COST' }, { symbol: 'DIS' }, { symbol: 'ABT' },
      { symbol: 'WMT' }, { symbol: 'ACN' }, { symbol: 'VZ' }, { symbol: 'ADBE' }, { symbol: 'LLY' },
      { symbol: 'NKE' }, { symbol: 'MRK' }, { symbol: 'DHR' }, { symbol: 'TXN' }, { symbol: 'XOM' },
      { symbol: 'BMY' }, { symbol: 'QCOM' }, { symbol: 'ORCL' }, { symbol: 'NEE' }, { symbol: 'AMGN' },
      { symbol: 'CVX' }, { symbol: 'PM' }, { symbol: 'T' }, { symbol: 'MDT' }, { symbol: 'UNP' },
      { symbol: 'LOW' }, { symbol: 'HON' }, { symbol: 'CVS' }, { symbol: 'SCHW' }, { symbol: 'LMT' }
    ];
  }

  /**
   * *** FIXED: Collect S&P 500 fundamentals with BULLETPROOF SAVE LOGIC ***
   */
  async collectWithQualityControls() {
    const processingStats = {
      startTime: new Date().toISOString(),
      companiesAttempted: 0,
      companiesSuccessful: 0,
      companiesFailed: 0,
      dataProcessed: false,
      qualityAnalysisCompleted: false,
      saveAttempted: false,
      saveVerified: false,
      finalDataCount: 0
    };
    
    try {
      console.log('🧠 [ADVANCED] Starting FIXED quality-controlled S&P 500 collection...');
      
      // Get S&P 500 constituents
      const sp500List = await this.getSP500Constituents();
      processingStats.companiesAttempted = sp500List.length;
      console.log(`🧠 [ADVANCED] Processing ${sp500List.length} S&P 500 companies...`);
      
      const qualityData = [];
      const batchSize = 5; // Conservative for API limits
      const delay = 2000; // 2 seconds between calls
      
      for (let i = 0; i < sp500List.length; i += batchSize) {
        const batch = sp500List.slice(i, i + batchSize);
        console.log(`🧠 [ADVANCED] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sp500List.length/batchSize)}...`);
        
        for (const company of batch) {
          try {
            const enhancedData = await this.getEnhancedCompanyData(company.symbol);
            if (enhancedData) {
              qualityData.push(enhancedData);
              processingStats.companiesSuccessful++;
              console.log(`✅ [ADVANCED] Processed ${company.symbol}: ${enhancedData.companyName}`);
            } else {
              processingStats.companiesFailed++;
              console.log(`⚠️ [ADVANCED] No data for ${company.symbol}`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, delay));
            
          } catch (error) {
            console.error(`❌ [ADVANCED] Failed to process ${company.symbol}:`, error.message);
            processingStats.companiesFailed++;
            continue;
          }
        }
        
        // Longer delay between batches
        if (i + batchSize < sp500List.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      console.log(`✅ [ADVANCED] Data collection completed: ${qualityData.length} companies collected`);
      processingStats.dataProcessed = true;
      
      // *** CRITICAL VALIDATION: Ensure we have data before proceeding ***
      if (qualityData.length === 0) {
        throw new Error('No company data collected - collection failed');
      }
      
      console.log(`🧠 [ADVANCED] Applying quality analysis to ${qualityData.length} companies...`);
      
      // Apply advanced quality analysis
      const analyzedData = await this.applyAdvancedQualityAnalysis(qualityData);
      processingStats.qualityAnalysisCompleted = true;
      
      // *** CRITICAL VALIDATION: Ensure analysis produced results ***
      if (!analyzedData || analyzedData.length === 0) {
        throw new Error('Quality analysis failed - no analyzed data produced');
      }
      
      console.log(`✅ [ADVANCED] Quality analysis completed: ${analyzedData.length} companies analyzed`);
      
      // *** BULLETPROOF SAVE LOGIC WITH VERIFICATION ***
      console.log('💾 [SAVE] Attempting to save data to Redis...');
      processingStats.saveAttempted = true;
      
      const saveKey = 'sp500:advanced_quality_fundamentals';
      const dataToSave = JSON.stringify(analyzedData);
      
      // Validate JSON serialization worked
      if (!dataToSave || dataToSave.length < 1000) {
        throw new Error('JSON serialization failed or produced insufficient data');
      }
      
      console.log(`💾 [SAVE] Serialized ${dataToSave.length} bytes of data`);
      
      // Save to Redis with error handling
      const saveResult = await redis.setex(saveKey, this.cache_ttl, dataToSave);
      console.log(`💾 [SAVE] Redis setex result: ${saveResult}`);
      
      // *** CRITICAL: VERIFY THE SAVE ACTUALLY WORKED ***
      console.log('🔍 [VERIFY] Verifying save operation...');
      const verifyData = await redis.get(saveKey);
      
      if (!verifyData) {
        throw new Error('Save verification failed - no data found after save');
      }
      
      const verifyParsed = JSON.parse(verifyData);
      if (!verifyParsed || verifyParsed.length !== analyzedData.length) {
        throw new Error(`Save verification failed - expected ${analyzedData.length} companies, got ${verifyParsed?.length || 0}`);
      }
      
      processingStats.saveVerified = true;
      processingStats.finalDataCount = verifyParsed.length;
      
      console.log(`✅ [SAVE VERIFIED] Successfully saved and verified ${verifyParsed.length} companies`);
      
      const result = {
        success: true,
        companiesProcessed: qualityData.length,
        companiesAnalyzed: analyzedData.length,
        companiesSaved: verifyParsed.length,
        dataQualityScore: this.calculateOverallQualityScore(analyzedData),
        anomaliesDetected: analyzedData.filter(c => c.qualityAnalysis.hasAnomalies).length,
        cacheKey: saveKey,
        processingStats,
        verification: {
          savedSuccessfully: true,
          dataIntegrity: 'verified',
          accessibleVia: '/api/fundamentals/advanced/top-performers/15'
        }
      };
      
      console.log('🎉 [ADVANCED] Collection completed successfully with verified save!');
      return result;
      
    } catch (error) {
      console.error('❌ [ADVANCED] Quality collection failed:', error);
      console.error('📊 [STATS] Processing stats:', processingStats);
      
      // Provide detailed error information
      throw new Error(`Collection failed: ${error.message} | Stats: attempted=${processingStats.companiesAttempted}, successful=${processingStats.companiesSuccessful}, saveAttempted=${processingStats.saveAttempted}, saveVerified=${processingStats.saveVerified}`);
    }
  }

  /**
   * Get enhanced company data with multiple data sources
   */
  async getEnhancedCompanyData(symbol) {
    try {
      // Parallel data fetching for efficiency
      const [profile, keyMetrics, ratios, growth, income, cashFlow] = await Promise.all([
        this.fmp.getCompanyProfile(symbol),
        this.fmp.getKeyMetrics(symbol),
        this.fmp.getFinancialRatios(symbol),
        this.fmp.getFinancialGrowth(symbol),
        this.fmp.getIncomeStatement(symbol),
        this.fmp.getCashFlow(symbol)
      ]);

      if (!profile || profile.length === 0) return null;

      const companyProfile = profile[0];
      const latestMetrics = keyMetrics?.[0] || {};
      const latestRatios = ratios?.[0] || {};
      const latestGrowth = growth?.[0] || {};
      const latestIncome = income?.[0] || {};
      const latestCashFlow = cashFlow?.[0] || {};

      // Enhanced data structure with quality metadata
      const enhancedData = {
        // Basic company info
        symbol,
        companyName: companyProfile.companyName,
        sector: companyProfile.sector,
        industry: companyProfile.industry,
        marketCap: companyProfile.mktCap,
        
        // Core fundamental metrics
        revenueGrowthYoY: this.safeNumber(latestGrowth.revenueGrowth * 100),
        earningsGrowthYoY: this.safeNumber(latestGrowth.netIncomeGrowth * 100),
        fcfGrowthYoY: this.safeNumber(latestGrowth.freeCashFlowGrowth * 100),
        profitMargin: this.safeNumber(latestRatios.netProfitMargin * 100),
        roe: this.safeNumber(latestRatios.returnOnEquity * 100),
        debtToEquityRatio: this.safeNumber(latestRatios.debtEquityRatio),
        
        // Additional quality metrics
        currentRatio: this.safeNumber(latestRatios.currentRatio),
        quickRatio: this.safeNumber(latestRatios.quickRatio),
        priceToEarnings: this.safeNumber(latestRatios.priceEarningsRatio),
        priceToBook: this.safeNumber(latestRatios.priceToBookRatio),
        
        // Historical data for trend analysis
        historicalMetrics: {
          revenue3YearGrowth: this.safeNumber(latestGrowth.threeYRevenueGrowthPerShare * 100),
          earnings3YearGrowth: this.safeNumber(latestGrowth.threeYNetIncomeGrowthPerShare * 100),
          fcf3YearGrowth: this.safeNumber(latestGrowth.threeYFreeCashFlowGrowthPerShare * 100)
        },
        
        // Data source metadata
        dataTimestamp: new Date().toISOString(),
        fmpDataAge: latestMetrics.date || latestIncome.date || 'unknown',
        dataCompleteness: this.calculateDataCompleteness({
          profile: !!companyProfile,
          metrics: !!latestMetrics.date,
          ratios: !!latestRatios.date,
          growth: !!latestGrowth.date,
          income: !!latestIncome.date,
          cashFlow: !!latestCashFlow.date
        })
      };

      return enhancedData;

    } catch (error) {
      console.error(`❌ [ADVANCED] Failed to get enhanced data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Apply advanced statistical and ML-based quality analysis
   */
  async applyAdvancedQualityAnalysis(rawData) {
    console.log('🧠 [ML] Applying advanced quality analysis...');
    
    // Validate input data
    if (!rawData || rawData.length === 0) {
      throw new Error('No raw data provided for quality analysis');
    }
    
    // Calculate statistical baselines for outlier detection
    const metricBaselines = this.calculateMetricBaselines(rawData);
    
    const analyzedData = rawData.map(company => {
      const qualityAnalysis = {
        // Outlier detection using multiple methods
        outlierScores: this.calculateOutlierScores(company, metricBaselines),
        
        // Anomaly detection
        hasAnomalies: false,
        anomalyFlags: [],
        
        // Data quality score (0-100)
        qualityScore: 0,
        
        // Peer group analysis
        peerGroupRanking: {},
        
        // Confidence intervals
        confidenceIntervals: {}
      };
      
      // Detect specific anomalies
      qualityAnalysis.anomalyFlags = this.detectAnomalies(company);
      qualityAnalysis.hasAnomalies = qualityAnalysis.anomalyFlags.length > 0;
      
      // Calculate overall quality score
      qualityAnalysis.qualityScore = this.calculateQualityScore(company, qualityAnalysis);
      
      // Add peer group rankings
      qualityAnalysis.peerGroupRanking = this.calculatePeerGroupRanking(company, rawData);
      
      return {
        ...company,
        qualityAnalysis
      };
    });
    
    console.log('✅ [ML] Advanced quality analysis completed');
    
    // Validate output data
    if (!analyzedData || analyzedData.length === 0) {
      throw new Error('Quality analysis produced no results');
    }
    
    return analyzedData;
  }

  /**
   * Calculate statistical baselines for each metric
   */
  calculateMetricBaselines(data) {
    const metrics = ['revenueGrowthYoY', 'earningsGrowthYoY', 'fcfGrowthYoY', 'profitMargin', 'roe', 'debtToEquityRatio'];
    const baselines = {};
    
    for (const metric of metrics) {
      const values = data
        .map(c => c[metric])
        .filter(v => v !== null && v !== undefined && !isNaN(v));
      
      if (values.length === 0) continue;
      
      const sorted = values.sort((a, b) => a - b);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      baselines[metric] = {
        mean,
        stdDev,
        median: sorted[Math.floor(sorted.length / 2)],
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q3: sorted[Math.floor(sorted.length * 0.75)],
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    }
    
    return baselines;
  }

  /**
   * Calculate outlier scores using multiple statistical methods
   */
  calculateOutlierScores(company, baselines) {
    const scores = {};
    
    for (const [metric, baseline] of Object.entries(baselines)) {
      const value = company[metric];
      if (value === null || value === undefined || isNaN(value)) {
        scores[metric] = { zscore: 0, iqr: 0, percentile: 50 };
        continue;
      }
      
      // Z-score method
      const zscore = Math.abs((value - baseline.mean) / baseline.stdDev);
      
      // IQR method
      const iqr = baseline.q3 - baseline.q1;
      const iqrScore = Math.max(
        (baseline.q1 - value) / (1.5 * iqr),
        (value - baseline.q3) / (1.5 * iqr)
      );
      
      // Percentile ranking
      const percentile = this.calculatePercentile(value, baseline);
      
      scores[metric] = {
        zscore: parseFloat(zscore.toFixed(2)),
        iqr: parseFloat(Math.max(0, iqrScore).toFixed(2)),
        percentile: parseFloat(percentile.toFixed(1))
      };
    }
    
    return scores;
  }

  /**
   * Detect specific business and accounting anomalies
   */
  detectAnomalies(company) {
    const anomalies = [];
    
    // Extreme growth rates (potential stock splits or accounting issues)
    if (company.earningsGrowthYoY > 500) {
      anomalies.push('extreme_earnings_growth');
    }
    if (company.revenueGrowthYoY > 300) {
      anomalies.push('extreme_revenue_growth');
    }
    
    // Impossible combinations
    if (company.profitMargin > 80) {
      anomalies.push('impossible_profit_margin');
    }
    if (company.roe > 200) {
      anomalies.push('impossible_roe');
    }
    
    // Debt concerns
    if (company.debtToEquityRatio > 10) {
      anomalies.push('extreme_debt_levels');
    }
    
    // Inconsistent metrics
    if (company.revenueGrowthYoY > 50 && company.earningsGrowthYoY < -50) {
      anomalies.push('revenue_earnings_divergence');
    }
    
    // Missing critical data
    if (!company.marketCap || company.marketCap < 1000000) {
      anomalies.push('missing_market_cap');
    }
    
    return anomalies;
  }

  /**
   * Calculate overall quality score (0-100)
   */
  calculateQualityScore(company, analysis) {
    let score = 100;
    
    // Deduct for anomalies
    score -= analysis.anomalyFlags.length * 15;
    
    // Deduct for extreme outliers
    const extremeOutliers = Object.values(analysis.outlierScores)
      .filter(s => s.zscore > 3 || s.iqr > 2).length;
    score -= extremeOutliers * 10;
    
    // Deduct for data completeness
    score -= (100 - company.dataCompleteness) * 0.3;
    
    // Minimum score
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate peer group ranking
   */
  calculatePeerGroupRanking(company, allData) {
    const sectorPeers = allData.filter(c => c.sector === company.sector);
    const ranking = {};
    
    const metrics = ['revenueGrowthYoY', 'earningsGrowthYoY', 'profitMargin', 'roe'];
    
    for (const metric of metrics) {
      const sorted = sectorPeers
        .filter(c => c[metric] !== null && !isNaN(c[metric]))
        .sort((a, b) => b[metric] - a[metric]);
      
      const rank = sorted.findIndex(c => c.symbol === company.symbol) + 1;
      ranking[metric] = {
        rank,
        totalPeers: sorted.length,
        percentile: Math.round((1 - rank / sorted.length) * 100)
      };
    }
    
    return ranking;
  }

  /**
   * Get enhanced top performers with configurable count
   */
  async getEnhancedTopPerformers(count = 15, metric = null) {
    try {
      const data = await redis.get('sp500:advanced_quality_fundamentals');
      if (!data) {
        throw new Error('No advanced quality data available - run collection first');
      }
      
      const companies = JSON.parse(data);
      const validCount = Math.min(Math.max(count, 5), 50); // Between 5-50
      
      const metrics = [
        { key: 'revenueGrowthYoY', name: 'Revenue Growth YoY', direction: 'desc' },
        { key: 'earningsGrowthYoY', name: 'Earnings Growth YoY', direction: 'desc' },
        { key: 'fcfGrowthYoY', name: 'FCF Growth YoY', direction: 'desc' },
        { key: 'profitMargin', name: 'Profit Margin', direction: 'desc' },
        { key: 'roe', name: 'Return on Equity', direction: 'desc' },
        { key: 'debtToEquityRatio', name: 'Debt-to-Equity Ratio', direction: 'asc' }
      ];
      
      const metricsToProcess = metric ? metrics.filter(m => m.key === metric) : metrics;
      const results = {};
      
      for (const metricDef of metricsToProcess) {
        const validCompanies = companies.filter(c => 
          c[metricDef.key] !== null && 
          c[metricDef.key] !== undefined && 
          !isNaN(c[metricDef.key]) &&
          c.qualityAnalysis.qualityScore >= 60 // Only high-quality data
        );
        
        const sorted = validCompanies.sort((a, b) => {
          return metricDef.direction === 'desc' ? 
            b[metricDef.key] - a[metricDef.key] : 
            a[metricDef.key] - b[metricDef.key];
        });
        
        results[metricDef.key] = {
          metricName: metricDef.name,
          direction: metricDef.direction,
          totalValidCompanies: validCompanies.length,
          qualityFiltered: companies.length - validCompanies.length,
          topPerformers: sorted.slice(0, validCount).map((company, index) => ({
            rank: index + 1,
            symbol: company.symbol,
            companyName: company.companyName,
            sector: company.sector,
            value: company[metricDef.key],
            marketCap: company.marketCap,
            qualityScore: company.qualityAnalysis.qualityScore,
            anomalies: company.qualityAnalysis.anomalyFlags,
            peerPercentile: company.qualityAnalysis.peerGroupRanking[metricDef.key]?.percentile || null,
            dataAge: company.fmpDataAge
          }))
        };
      }
      
      return {
        success: true,
        count: validCount,
        results,
        qualityInfo: {
          totalCompanies: companies.length,
          averageQualityScore: Math.round(companies.reduce((sum, c) => sum + c.qualityAnalysis.qualityScore, 0) / companies.length),
          companiesWithAnomalies: companies.filter(c => c.qualityAnalysis.hasAnomalies).length
        },
        dataSource: 'Advanced Quality-Controlled FMP Data',
        lastUpdated: companies[0]?.dataTimestamp
      };
      
    } catch (error) {
      console.error('❌ [ADVANCED] Enhanced top performers failed:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  safeNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return parseFloat(parseFloat(value).toFixed(2));
  }

  calculateDataCompleteness(sources) {
    const total = Object.keys(sources).length;
    const available = Object.values(sources).filter(Boolean).length;
    return Math.round((available / total) * 100);
  }

  calculatePercentile(value, baseline) {
    if (value <= baseline.min) return 0;
    if (value >= baseline.max) return 100;
    
    // Simple linear interpolation for percentile
    if (value <= baseline.median) {
      return 50 * (value - baseline.min) / (baseline.median - baseline.min);
    } else {
      return 50 + 50 * (value - baseline.median) / (baseline.max - baseline.median);
    }
  }

  calculateOverallQualityScore(data) {
    const avgScore = data.reduce((sum, c) => sum + c.qualityAnalysis.qualityScore, 0) / data.length;
    return Math.round(avgScore);
  }
}

export const advancedDataQualityCollector = new AdvancedDataQualityCollector();
