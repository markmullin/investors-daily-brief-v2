import express from 'express';
import { advancedDataQualityCollector } from '../services/fundamentals/advancedDataQualityCollector.js';
import { redis } from '../config/database.js';

const router = express.Router();

/**
 * *** ADVANCED FUNDAMENTALS WITH ML DATA QUALITY ***
 * 
 * These routes implement the user's requirements for:
 * - Perfect data accuracy with advanced quality controls
 * - Machine learning approaches for anomaly detection
 * - Historical analysis for accounting irregularities  
 * - Top 10-25 results instead of just 5
 * - No synthetic/sample data - only real FMP API data
 */

/**
 * *** COLLECT S&P 500 WITH ADVANCED QUALITY CONTROLS ***
 */
router.post('/advanced/collect', async (req, res) => {
  try {
    console.log('🧠 [ADVANCED] Starting advanced quality-controlled collection...');
    
    const result = await advancedDataQualityCollector.collectWithQualityControls();
    
    res.json({
      success: true,
      message: 'Advanced quality-controlled S&P 500 collection completed',
      result,
      features: [
        '🧠 Machine learning outlier detection',
        '📊 Statistical anomaly detection',
        '🎯 Peer group analysis and ranking',
        '📈 Historical trend validation',
        '🔍 Multi-source data validation',
        '⚡ Quality score filtering (60+ only)'
      ],
      note: 'This takes 45-60 minutes but provides institutional-grade data quality',
      nextSteps: [
        'Use /advanced/top-performers/15 for quality-filtered results',
        'Try /advanced/quality-analysis for detailed quality metrics',
        'Check /advanced/anomalies for accounting irregularities'
      ]
    });
    
  } catch (error) {
    console.error('❌ [ADVANCED] Collection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Advanced collection failed',
      details: error.message
    });
  }
});

/**
 * *** GET TOP PERFORMERS WITH ADVANCED QUALITY (10-25 results) ***
 */
router.get('/advanced/top-performers/:count?/:metric?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 15;
    const metric = req.params.metric || null;
    
    if (count < 5 || count > 50) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 5 and 50',
        suggestion: 'Use a reasonable range for meaningful analysis'
      });
    }
    
    console.log(`🧠 [ADVANCED] Getting top ${count} performers${metric ? ` for ${metric}` : ''}...`);
    
    const result = await advancedDataQualityCollector.getEnhancedTopPerformers(count, metric);
    
    res.json({
      ...result,
      message: `Advanced quality-filtered top ${count} performers`,
      qualityFeatures: [
        'Quality score ≥60 required',
        'Anomaly detection applied',
        'Peer group percentiles included',
        'Outlier scores calculated',
        'Data completeness validated'
      ]
    });
    
  } catch (error) {
    console.error('❌ [ADVANCED] Top performers failed:', error);
    
    if (error.message.includes('No advanced quality data available')) {
      return res.status(404).json({
        success: false,
        error: 'No advanced quality data available',
        message: 'Run /advanced/collect first to build quality-controlled dataset',
        estimatedTime: '45-60 minutes for complete S&P 500 collection'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Advanced top performers failed',
      details: error.message
    });
  }
});

/**
 * *** QUALITY ANALYSIS DASHBOARD ***
 */
router.get('/advanced/quality-analysis', async (req, res) => {
  try {
    console.log('🧠 [ADVANCED] Generating quality analysis dashboard...');
    
    const data = await redis.get('sp500:advanced_quality_fundamentals');
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No advanced quality data available',
        message: 'Run /advanced/collect first'
      });
    }
    
    const companies = JSON.parse(data);
    
    // Quality score distribution
    const qualityDistribution = {
      excellent: companies.filter(c => c.qualityAnalysis.qualityScore >= 90).length,
      good: companies.filter(c => c.qualityAnalysis.qualityScore >= 70 && c.qualityAnalysis.qualityScore < 90).length,
      fair: companies.filter(c => c.qualityAnalysis.qualityScore >= 50 && c.qualityAnalysis.qualityScore < 70).length,
      poor: companies.filter(c => c.qualityAnalysis.qualityScore < 50).length
    };
    
    // Anomaly analysis
    const anomalyTypes = {};
    companies.forEach(c => {
      c.qualityAnalysis.anomalyFlags.forEach(flag => {
        anomalyTypes[flag] = (anomalyTypes[flag] || 0) + 1;
      });
    });
    
    // Sector quality analysis
    const sectorQuality = {};
    companies.forEach(c => {
      if (!sectorQuality[c.sector]) {
        sectorQuality[c.sector] = { total: 0, avgQuality: 0, anomalies: 0 };
      }
      sectorQuality[c.sector].total++;
      sectorQuality[c.sector].avgQuality += c.qualityAnalysis.qualityScore;
      if (c.qualityAnalysis.hasAnomalies) {
        sectorQuality[c.sector].anomalies++;
      }
    });
    
    // Calculate averages
    for (const sector of Object.keys(sectorQuality)) {
      sectorQuality[sector].avgQuality = Math.round(sectorQuality[sector].avgQuality / sectorQuality[sector].total);
    }
    
    // Data completeness analysis
    const avgCompleteness = Math.round(companies.reduce((sum, c) => sum + c.dataCompleteness, 0) / companies.length);
    
    res.json({
      success: true,
      qualityAnalysis: {
        totalCompanies: companies.length,
        averageQualityScore: Math.round(companies.reduce((sum, c) => sum + c.qualityAnalysis.qualityScore, 0) / companies.length),
        averageDataCompleteness: avgCompleteness,
        qualityDistribution,
        anomalyTypes,
        sectorQuality
      },
      recommendations: {
        dataScience: [
          `${qualityDistribution.poor} companies have quality scores <50 - consider manual review`,
          `${Object.keys(anomalyTypes).length} different anomaly types detected`,
          'Implement time-series analysis for trend validation',
          'Consider cross-validation with SEC filings'
        ],
        qualityImprovements: [
          'Focus on sectors with low average quality scores',
          'Implement additional data sources for validation',
          'Add real-time analyst estimate integration',
          'Enhance historical consistency checking'
        ]
      },
      lastUpdated: companies[0]?.dataTimestamp
    });
    
  } catch (error) {
    console.error('❌ [ADVANCED] Quality analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Quality analysis failed',
      details: error.message
    });
  }
});

/**
 * *** ANOMALY DETECTION REPORT ***
 */
router.get('/advanced/anomalies', async (req, res) => {
  try {
    console.log('🔍 [ADVANCED] Generating anomaly detection report...');
    
    const data = await redis.get('sp500:advanced_quality_fundamentals');
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No advanced quality data available',
        message: 'Run /advanced/collect first'
      });
    }
    
    const companies = JSON.parse(data);
    const companiesWithAnomalies = companies.filter(c => c.qualityAnalysis.hasAnomalies);
    
    // Group by anomaly type
    const anomalyGroups = {};
    companiesWithAnomalies.forEach(company => {
      company.qualityAnalysis.anomalyFlags.forEach(flag => {
        if (!anomalyGroups[flag]) {
          anomalyGroups[flag] = [];
        }
        anomalyGroups[flag].push({
          symbol: company.symbol,
          companyName: company.companyName,
          sector: company.sector,
          qualityScore: company.qualityAnalysis.qualityScore,
          relevantMetrics: getRelevantMetricsForAnomaly(flag, company)
        });
      });
    });
    
    // Sort each group by quality score (lowest first - most concerning)
    for (const flag of Object.keys(anomalyGroups)) {
      anomalyGroups[flag].sort((a, b) => a.qualityScore - b.qualityScore);
    }
    
    res.json({
      success: true,
      anomalies: {
        totalCompaniesWithAnomalies: companiesWithAnomalies.length,
        percentageAffected: parseFloat((companiesWithAnomalies.length / companies.length * 100).toFixed(2)),
        anomalyGroups
      },
      recommendations: {
        immediate: [
          'Review companies with quality scores <40',
          'Investigate extreme growth rates for stock splits',
          'Cross-check impossible profit margins with SEC filings',
          'Validate debt levels with recent quarterly reports'
        ],
        dataScience: [
          'Implement automated stock split detection',
          'Add historical volatility analysis',
          'Use machine learning clustering for peer validation',
          'Integrate real-time news sentiment for context'
        ]
      },
      criticalAnomalies: companiesWithAnomalies
        .filter(c => c.qualityAnalysis.qualityScore < 40)
        .map(c => ({
          symbol: c.symbol,
          companyName: c.companyName,
          qualityScore: c.qualityAnalysis.qualityScore,
          anomalies: c.qualityAnalysis.anomalyFlags
        })),
      lastUpdated: companies[0]?.dataTimestamp
    });
    
  } catch (error) {
    console.error('❌ [ADVANCED] Anomaly detection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Anomaly detection failed',
      details: error.message
    });
  }
});

/**
 * *** STATUS CHECK FOR ADVANCED SYSTEM ***
 */
router.get('/advanced/status', async (req, res) => {
  try {
    const data = await redis.get('sp500:advanced_quality_fundamentals');
    const hasData = !!data;
    
    let stats = null;
    if (hasData) {
      const companies = JSON.parse(data);
      stats = {
        totalCompanies: companies.length,
        avgQualityScore: Math.round(companies.reduce((sum, c) => sum + c.qualityAnalysis.qualityScore, 0) / companies.length),
        companiesWithAnomalies: companies.filter(c => c.qualityAnalysis.hasAnomalies).length,
        lastUpdated: companies[0]?.dataTimestamp
      };
    }
    
    res.json({
      success: true,
      advancedSystemStatus: {
        dataAvailable: hasData,
        stats,
        features: [
          '🧠 Machine Learning Quality Analysis',
          '📊 Statistical Outlier Detection',
          '🔍 Anomaly Detection for Accounting Issues',
          '🎯 Peer Group Analysis and Rankings',
          '📈 Historical Trend Validation',
          '⚡ Quality Score Filtering (0-100)',
          '🏆 Top 5-50 Configurable Results'
        ]
      },
      availableEndpoints: [
        'POST /advanced/collect - Full quality-controlled collection (45-60min)',
        'GET /advanced/top-performers/15 - Top 15 with quality filtering',
        'GET /advanced/top-performers/25/revenueGrowthYoY - Top 25 for specific metric',
        'GET /advanced/quality-analysis - Quality dashboard',
        'GET /advanced/anomalies - Anomaly detection report',
        'GET /advanced/status - This status endpoint'
      ],
      recommendation: hasData ? 
        'Advanced quality data available - try /advanced/top-performers/15' :
        'Run /advanced/collect to build quality-controlled dataset'
    });
    
  } catch (error) {
    console.error('❌ [ADVANCED] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      details: error.message
    });
  }
});

/**
 * Helper function for anomaly reporting
 */
function getRelevantMetricsForAnomaly(flag, company) {
  switch (flag) {
    case 'extreme_earnings_growth':
      return { earningsGrowthYoY: company.earningsGrowthYoY };
    case 'extreme_revenue_growth':
      return { revenueGrowthYoY: company.revenueGrowthYoY };
    case 'impossible_profit_margin':
      return { profitMargin: company.profitMargin };
    case 'impossible_roe':
      return { roe: company.roe };
    case 'extreme_debt_levels':
      return { debtToEquityRatio: company.debtToEquityRatio };
    case 'revenue_earnings_divergence':
      return { 
        revenueGrowthYoY: company.revenueGrowthYoY,
        earningsGrowthYoY: company.earningsGrowthYoY
      };
    default:
      return {};
  }
}

export default router;
