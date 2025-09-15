// PORTFOLIO DATA QUALITY SERVICE - FIXED VERSION
// Ensures every stock has up-to-date, accurate financial metrics from FMP

import fmpService from './fmpService.js';
import NodeCache from 'node-cache';
import fs from 'fs/promises';
import path from 'path';

class PortfolioDataQualityService {
  constructor() {
    // Cache for 1 hour to avoid re-checking same stocks
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.qualityReport = null;
    this.lastValidation = null;
  }

  // MAIN METHOD: Validate data quality for entire portfolio
  async validatePortfolioDataQuality(tickers = []) {
    console.log('🔍 PORTFOLIO DATA QUALITY VALIDATION STARTING...');
    console.log('=' .repeat(70));
    
    const startTime = Date.now();
    
    // If no tickers provided, try to get from sample portfolio
    if (tickers.length === 0) {
      try {
        tickers = await this.getPortfolioTickers();
      } catch (error) {
        console.log('📝 Using default validation tickers...');
        tickers = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'BRK.B', 'JNJ', 'V'];
      }
    }
    
    console.log(`📊 Validating ${tickers.length} stocks: ${tickers.join(', ')}`);
    
    const results = {
      totalStocks: tickers.length,
      validatedStocks: 0,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      failed: 0,
      stockResults: [],
      summary: {},
      recommendations: [],
      timestamp: new Date().toISOString()
    };
    
    // Validate each stock
    for (const ticker of tickers) {
      try {
        console.log(`\n🔍 Validating ${ticker}...`);
        const stockQuality = await this.validateStockDataQuality(ticker);
        
        results.stockResults.push(stockQuality);
        results.validatedStocks++;
        
        // Categorize by quality
        switch (stockQuality.overallQuality) {
          case 'HIGH':
            results.highQuality++;
            console.log(`  ✅ ${ticker}: HIGH quality (${stockQuality.score}%)`);
            break;
          case 'MEDIUM':
            results.mediumQuality++;
            console.log(`  ⚠️ ${ticker}: MEDIUM quality (${stockQuality.score}%)`);
            break;
          case 'LOW':
            results.lowQuality++;
            console.log(`  ❌ ${ticker}: LOW quality (${stockQuality.score}%)`);
            break;
          case 'FAILED':
            results.failed++;
            console.log(`  💥 ${ticker}: FAILED validation`);
            break;
        }
        
      } catch (error) {
        console.error(`  💥 ${ticker}: Validation failed - ${error.message}`);
        results.failed++;
        results.stockResults.push({
          ticker,
          overallQuality: 'FAILED',
          score: 0,
          error: error.message,
          issues: ['Validation failed'],
          metrics: {
            quarterly: { issues: [] },
            annual: { issues: [] },
            growth: { issues: [] },
            consistency: { issues: [] }
          },
          dataFreshness: { issues: [] },
          completeness: { missing: [] },
          recommendations: []
        });
      }
    }
    
    // Generate summary and recommendations
    results.summary = this.generateQualitySummary(results);
    results.recommendations = this.generateRecommendations(results);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️ Validation completed in ${duration}s`);
    
    // Store results
    this.qualityReport = results;
    this.lastValidation = new Date();
    
    // Save to file for reference
    await this.saveQualityReport(results);
    
    return results;
  }

  // Validate data quality for a single stock
  async validateStockDataQuality(ticker) {
    const cacheKey = `quality_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const result = {
      ticker,
      overallQuality: 'HIGH',
      score: 100,
      issues: [],
      metrics: {
        quarterly: { issues: [] },
        annual: { issues: [] },
        growth: { issues: [] },
        consistency: { issues: [] }
      },
      dataFreshness: { issues: [], quarterlyAge: null },
      completeness: { missing: [], present: [] },
      recommendations: []
    };
    
    try {
      // Get FMP data instead of EDGAR
      console.log(`    📡 Fetching FMP data for ${ticker}...`);
      const fmpData = await fmpService.getCompanyFinancials(ticker);
      
      if (!fmpData || !fmpData.financialStatements) {
        throw new Error('No financial data available');
      }
      
      console.log(`    ✅ FMP data fetched for ${ticker}`);
      
      // COMPREHENSIVE DATA QUALITY CHECKS
      
      // 1. DATA COMPLETENESS CHECK
      const completeness = this.checkDataCompleteness(fmpData.financialStatements);
      result.completeness = completeness;
      result.score -= Math.max(0, 100 - completeness.score);
      
      // 2. DATA FRESHNESS CHECK  
      const freshness = this.checkDataFreshness(fmpData.financialStatements);
      result.dataFreshness = freshness;
      result.score -= Math.max(0, 100 - freshness.score);
      
      // 3. QUARTERLY DATA VALIDATION
      const quarterlyValidation = this.validateQuarterlyData(fmpData.financialStatements);
      result.metrics.quarterly = quarterlyValidation;
      if (quarterlyValidation.issues && quarterlyValidation.issues.length > 0) {
        result.score -= quarterlyValidation.issues.length * 5;
        result.issues.push(...quarterlyValidation.issues);
      }
      
      // 4. ANNUAL DATA VALIDATION
      const annualValidation = this.validateAnnualData(fmpData.financialStatements);
      result.metrics.annual = annualValidation;
      if (annualValidation.issues && annualValidation.issues.length > 0) {
        result.score -= annualValidation.issues.length * 3;
        result.issues.push(...annualValidation.issues);
      }
      
      // 5. GROWTH CALCULATION VALIDATION
      const growthValidation = this.validateGrowthCalculations(fmpData.ratios);
      result.metrics.growth = growthValidation;
      if (growthValidation.issues && growthValidation.issues.length > 0) {
        result.score -= growthValidation.issues.length * 2;
        result.issues.push(...growthValidation.issues);
      }
      
      // 6. DATA CONSISTENCY CHECK
      const consistencyCheck = this.checkDataConsistency(fmpData.financialStatements);
      result.metrics.consistency = consistencyCheck;
      if (consistencyCheck.issues && consistencyCheck.issues.length > 0) {
        result.score -= consistencyCheck.issues.length * 3;
        result.issues.push(...consistencyCheck.issues);
      }
      
      // DETERMINE OVERALL QUALITY
      result.score = Math.max(0, Math.min(100, result.score));
      
      if (result.score >= 85) {
        result.overallQuality = 'HIGH';
      } else if (result.score >= 60) {
        result.overallQuality = 'MEDIUM';
        result.recommendations.push('Some data quality issues detected - review recommendations');
      } else {
        result.overallQuality = 'LOW';
        result.recommendations.push('Significant data quality issues - manual review required');
      }
      
      // Add specific recommendations
      const stockRecs = this.generateStockRecommendations(result);
      result.recommendations.push(...stockRecs);
      
    } catch (error) {
      console.error(`    ❌ ${ticker} validation error:`, error.message);
      result.overallQuality = 'FAILED';
      result.score = 0;
      result.issues = [`Data validation failed: ${error.message}`];
      result.recommendations = ['Unable to validate - check FMP data availability'];
    }
    
    this.cache.set(cacheKey, result);
    return result;
  }

  // Check completeness of essential financial metrics
  checkDataCompleteness(financialStatements) {
    const essentialMetrics = [
      'revenue', 'netIncome', 'eps',
      'totalAssets', 'stockholdersEquity', 'sharesOutstanding'
    ];
    
    const result = {
      score: 100,
      present: [],
      missing: [],
      details: {}
    };
    
    essentialMetrics.forEach(metric => {
      // Check if FMP data has this metric
      const hasMetric = financialStatements.quarterly && 
                       financialStatements.quarterly.length > 0 && 
                       financialStatements.quarterly[0][metric] !== undefined;
      
      if (hasMetric) {
        result.present.push(metric);
        result.details[metric] = {
          quarterly: financialStatements.quarterly.length,
          annual: financialStatements.annual ? financialStatements.annual.length : 0,
          latest: financialStatements.quarterly[0].date
        };
      } else {
        result.missing.push(metric);
        result.score -= (100 / essentialMetrics.length);
      }
    });
    
    return result;
  }

  // Check freshness of financial data
  checkDataFreshness(financialStatements) {
    const result = {
      score: 100,
      latestQuarterly: null,
      latestAnnual: null,
      quarterlyAge: null,
      annualAge: null,
      issues: []
    };
    
    try {
      // Check quarterly data freshness
      if (financialStatements.quarterly && financialStatements.quarterly.length > 0) {
        const latestQuarterly = new Date(financialStatements.quarterly[0].date);
        result.latestQuarterly = financialStatements.quarterly[0].date;
        
        const now = new Date();
        const quarterlyAgeMonths = (now - latestQuarterly) / (1000 * 60 * 60 * 24 * 30);
        result.quarterlyAge = Math.round(quarterlyAgeMonths);
        
        if (quarterlyAgeMonths > 6) {
          result.score -= 20;
          result.issues.push(`Quarterly data is ${result.quarterlyAge} months old`);
        } else if (quarterlyAgeMonths > 4) {
          result.score -= 10;
          result.issues.push(`Quarterly data is ${result.quarterlyAge} months old - consider updating`);
        }
      } else {
        result.score -= 30;
        result.issues.push('No quarterly revenue data available');
      }
      
      // Check annual data freshness
      if (financialStatements.annual && financialStatements.annual.length > 0) {
        const latestAnnual = new Date(financialStatements.annual[0].date);
        result.latestAnnual = financialStatements.annual[0].date;
        
        const now = new Date();
        const annualAgeMonths = (now - latestAnnual) / (1000 * 60 * 60 * 24 * 30);
        result.annualAge = Math.round(annualAgeMonths);
        
        if (annualAgeMonths > 18) {
          result.score -= 15;
          result.issues.push(`Annual data is ${result.annualAge} months old`);
        }
      }
      
    } catch (error) {
      result.score -= 50;
      result.issues.push(`Error checking data freshness: ${error.message}`);
    }
    
    return result;
  }

  // Validate quarterly data quality
  validateQuarterlyData(financialStatements) {
    const result = {
      totalQuarters: 0,
      recentQuarters: 0,
      issues: [],
      coverage: {}
    };
    
    if (!financialStatements.quarterly) {
      result.issues.push('No quarterly data available');
      return result;
    }
    
    const quarters = financialStatements.quarterly;
    result.totalQuarters = quarters.length;
    
    // Check for recent quarters (last 2 years = 8 quarters)
    const recentQuarters = quarters.filter(q => {
      const qDate = new Date(q.date);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      return qDate >= twoYearsAgo;
    });
    
    result.recentQuarters = recentQuarters.length;
    
    if (recentQuarters.length < 4) {
      result.issues.push(`Only ${recentQuarters.length} recent quarters available`);
    }
    
    return result;
  }

  // Validate annual data quality
  validateAnnualData(financialStatements) {
    const result = {
      totalYears: 0,
      recentYears: 0,
      issues: [],
      coverage: {}
    };
    
    if (!financialStatements.annual) {
      result.issues.push('No annual data available');
      return result;
    }
    
    const years = financialStatements.annual;
    result.totalYears = years.length;
    
    // Check for recent years (last 5 years)
    const recentYears = years.filter(y => {
      const yDate = new Date(y.date);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      return yDate >= fiveYearsAgo;
    });
    
    result.recentYears = recentYears.length;
    
    if (recentYears.length < 3) {
      result.issues.push(`Only ${recentYears.length} recent annual periods available`);
    }
    
    return result;
  }

  // Validate growth calculations
  validateGrowthCalculations(ratios) {
    const result = {
      calculations: 0,
      successful: 0,
      issues: []
    };
    
    if (!ratios) {
      result.issues.push('No ratio calculations available');
      return result;
    }
    
    // Check basic ratio availability
    const expectedRatios = ['revenueGrowth', 'netIncomeGrowth', 'epsGrowth'];
    
    expectedRatios.forEach(ratio => {
      result.calculations++;
      if (ratios[ratio] !== undefined && ratios[ratio] !== null) {
        result.successful++;
      } else {
        result.issues.push(`${ratio} not calculated`);
      }
    });
    
    return result;
  }

  // Check data consistency across periods
  checkDataConsistency(financialStatements) {
    const result = {
      checks: 0,
      passed: 0,
      issues: []
    };
    
    // Check basic data structure consistency
    if (financialStatements.quarterly && financialStatements.annual) {
      result.checks++;
      
      if (financialStatements.quarterly.length > 0 && financialStatements.annual.length > 0) {
        result.passed++;
      } else {
        result.issues.push('Missing quarterly or annual data');
      }
    }
    
    return result;
  }

  // Generate recommendations for individual stock
  generateStockRecommendations(stockResult) {
    const recommendations = [];
    
    if (stockResult.completeness && stockResult.completeness.missing && stockResult.completeness.missing.length > 0) {
      recommendations.push(`Missing essential metrics: ${stockResult.completeness.missing.join(', ')}`);
    }
    
    if (stockResult.dataFreshness && stockResult.dataFreshness.quarterlyAge > 6) {
      recommendations.push('Quarterly data is stale - check for recent filings');
    }
    
    if (stockResult.metrics && stockResult.metrics.quarterly && stockResult.metrics.quarterly.recentQuarters < 4) {
      recommendations.push('Insufficient recent quarterly data - may affect calculations');
    }
    
    return recommendations;
  }

  // Generate overall portfolio quality summary - FIXED VERSION
  generateQualitySummary(results) {
    // Ensure we have valid data
    if (!results.stockResults || results.stockResults.length === 0) {
      return {
        overallHealthScore: '0',
        qualityDistribution: { HIGH: '0', MEDIUM: '0', LOW: '0', FAILED: '100' },
        stocksNeedingAttention: results.totalStocks,
        dataCompletenessIssues: 0,
        freshnessIssues: 0
      };
    }

    const validatedStocks = Math.max(1, results.validatedStocks); // Prevent division by zero
    
    const qualityDistribution = {
      HIGH: (results.highQuality / validatedStocks * 100).toFixed(1),
      MEDIUM: (results.mediumQuality / validatedStocks * 100).toFixed(1),
      LOW: (results.lowQuality / validatedStocks * 100).toFixed(1),
      FAILED: (results.failed / results.totalStocks * 100).toFixed(1)
    };
    
    // Calculate average score with proper null checks
    const stocksWithScores = results.stockResults.filter(r => r && typeof r.score === 'number');
    const averageScore = stocksWithScores.length > 0 
      ? stocksWithScores.reduce((sum, r) => sum + r.score, 0) / stocksWithScores.length
      : 0;
    
    // Count issues with proper null checks
    const dataCompletenessIssues = results.stockResults
      .filter(r => r && r.completeness && r.completeness.missing && r.completeness.missing.length > 0).length;
    
    const freshnessIssues = results.stockResults
      .filter(r => r && r.dataFreshness && r.dataFreshness.issues && r.dataFreshness.issues.length > 0).length;
    
    return {
      overallHealthScore: averageScore.toFixed(1),
      qualityDistribution,
      stocksNeedingAttention: results.lowQuality + results.failed,
      dataCompletenessIssues,
      freshnessIssues
    };
  }

  // Generate portfolio-level recommendations - FIXED VERSION
  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.failed > 0) {
      recommendations.push(`${results.failed} stocks failed validation - investigate FMP data availability`);
    }
    
    if (results.lowQuality > 0) {
      recommendations.push(`${results.lowQuality} stocks have low data quality - prioritize for manual review`);
    }
    
    // Safe filtering with null checks
    const freshnessIssues = results.stockResults
      .filter(r => r && r.dataFreshness && typeof r.dataFreshness.quarterlyAge === 'number' && r.dataFreshness.quarterlyAge > 6).length;
    
    if (freshnessIssues > 0) {
      recommendations.push(`${freshnessIssues} stocks have stale quarterly data`);
    }
    
    const completenessIssues = results.stockResults
      .filter(r => r && r.completeness && r.completeness.missing && r.completeness.missing.length > 0).length;
    
    if (completenessIssues > 0) {
      recommendations.push(`${completenessIssues} stocks missing essential metrics`);
    }
    
    if (results.summary && parseFloat(results.summary.overallHealthScore) < 75) {
      recommendations.push('Overall portfolio data quality below 75% - systematic review recommended');
    }
    
    return recommendations;
  }

  // Get tickers from sample portfolio file
  async getPortfolioTickers() {
    try {
      const portfolioPath = path.join(process.cwd(), '..', 'sample-portfolio.csv');
      const content = await fs.readFile(portfolioPath, 'utf-8');
      
      // Simple CSV parsing for ticker column
      const lines = content.split('\n').filter(line => line.trim());
      const tickers = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const columns = lines[i].split(',');
        if (columns[0] && columns[0].trim()) {
          tickers.push(columns[0].trim());
        }
      }
      
      return tickers.slice(0, 10); // Limit to 10 stocks for reasonable validation time
    } catch (error) {
      throw new Error(`Could not read portfolio file: ${error.message}`);
    }
  }

  // Save quality report to file
  async saveQualityReport(report) {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      const reportPath = path.join(dataDir, 'portfolio-quality-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 Quality report saved to: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save quality report:', error.message);
    }
  }

  // Get last validation report
  getLastQualityReport() {
    return {
      report: this.qualityReport,
      timestamp: this.lastValidation
    };
  }

  // Quick validation summary for dashboard
  async getPortfolioHealthSummary(tickers = []) {
    const report = await this.validatePortfolioDataQuality(tickers);
    
    return {
      overallScore: report.summary.overallHealthScore,
      totalStocks: report.totalStocks,
      distribution: report.summary.qualityDistribution,
      issuesCount: report.summary.stocksNeedingAttention,
      lastUpdated: report.timestamp,
      topIssues: report.recommendations.slice(0, 3)
    };
  }
}

export default new PortfolioDataQualityService();
