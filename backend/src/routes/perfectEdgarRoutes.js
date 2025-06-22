// PERFECT EDGAR ROUTES
// API endpoints for the perfect EDGAR data extraction system

import express from 'express';
import perfectEdgarService from '../services/edgarPerfect/perfectEdgarService.js';
import eodService from '../services/eodService.js';

const router = express.Router();

// Get perfect financial data for a single company
router.get('/perfect/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { forceRefresh } = req.query;
    
    console.log(`\n🎯 Perfect EDGAR API: Fetching data for ${symbol}...`);
    
    // Get perfect financial data
    const financialData = await perfectEdgarService.getPerfectFinancialData(
      symbol,
      { forceRefresh: forceRefresh === 'true' }
    );
    
    // Get current market data
    const marketData = await eodService.getSingleStockData(symbol);
    
    // Combine with market data
    const result = {
      ...financialData,
      marketData: {
        currentPrice: marketData.price,
        marketCap: marketData.marketCap,
        change: marketData.change,
        changePercent: marketData.changePercent,
        volume: marketData.volume
      },
      valuation: {}
    };
    
    // Calculate valuation metrics
    if (financialData.financials.netIncome && marketData.marketCap) {
      result.valuation.peRatio = marketData.marketCap / (financialData.financials.netIncome.value * 4); // Annualized
    }
    
    if (financialData.financials.revenue && marketData.marketCap) {
      result.valuation.psRatio = marketData.marketCap / (financialData.financials.revenue.value * 4); // Annualized
    }
    
    if (financialData.financials.shareholdersEquity && marketData.marketCap) {
      result.valuation.pbRatio = marketData.marketCap / financialData.financials.shareholdersEquity.value;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Perfect EDGAR API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch perfect financial data',
      message: error.message,
      ticker: req.params.symbol
    });
  }
});

// Batch process multiple companies
router.post('/perfect/batch', async (req, res) => {
  try {
    const { symbols, forceRefresh } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Please provide an array of symbols'
      });
    }
    
    console.log(`\n📊 Perfect EDGAR Batch API: Processing ${symbols.length} companies...`);
    
    // Process in batches
    const batchResults = await perfectEdgarService.batchProcess(
      symbols,
      { forceRefresh }
    );
    
    res.json({
      success: true,
      count: batchResults.results.length,
      results: batchResults.results,
      errors: batchResults.errors,
      statistics: perfectEdgarService.getExtractionStats()
    });
    
  } catch (error) {
    console.error('Perfect EDGAR Batch API Error:', error);
    res.status(500).json({
      error: 'Batch processing failed',
      message: error.message
    });
  }
});

// Get data quality report
router.get('/perfect/quality/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Get the data first
    const data = await perfectEdgarService.getPerfectFinancialData(symbol);
    
    // Generate detailed quality report
    const qualityReport = {
      ticker: symbol,
      companyName: data.companyName,
      dataQuality: data.dataQuality,
      coverage: {
        totalFields: Object.keys(data.financials).length,
        requiredFields: {
          present: data.dataQuality.details.missingFields 
            ? 8 - data.dataQuality.details.missingFields.length 
            : 8,
          total: 8,
          missing: data.dataQuality.details.missingFields || []
        }
      },
      sources: data.metadata.sources,
      fieldDetails: {}
    };
    
    // Add field-level details
    Object.entries(data.financials).forEach(([field, value]) => {
      qualityReport.fieldDetails[field] = {
        value: value.value,
        source: value.source || value.primarySource,
        confidence: value.confidence,
        hasMultiplePeriods: Array.isArray(value.values),
        periodCount: value.values ? value.values.length : 1
      };
    });
    
    res.json(qualityReport);
    
  } catch (error) {
    console.error('Quality Report Error:', error);
    res.status(500).json({
      error: 'Failed to generate quality report',
      message: error.message
    });
  }
});

// Get extraction statistics
router.get('/perfect/stats', async (req, res) => {
  try {
    const stats = perfectEdgarService.getExtractionStats();
    
    res.json({
      ...stats,
      qualityThresholds: {
        minimum: 0.8,
        target: 0.95
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// Compare old vs new extraction
router.get('/perfect/compare/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`\n🔄 Comparing extraction methods for ${symbol}...`);
    
    // Import old services
    const edgarService = await import('../services/edgarService.js');
    const enhancedEdgarService = await import('../services/enhancedEdgarService.js');
    
    // Get data from all sources
    const [oldData, enhancedData, perfectData] = await Promise.allSettled([
      edgarService.default.getCompanyFacts(symbol),
      enhancedEdgarService.default.getCompanyFacts(symbol),
      perfectEdgarService.getPerfectFinancialData(symbol)
    ]);
    
    const comparison = {
      ticker: symbol,
      methods: {
        original: {
          success: oldData.status === 'fulfilled',
          fieldCount: oldData.value ? Object.keys(oldData.value.fiscalData || {}).length : 0,
          error: oldData.reason?.message
        },
        enhanced: {
          success: enhancedData.status === 'fulfilled',
          fieldCount: enhancedData.value ? Object.keys(enhancedData.value.fiscalData || {}).length : 0,
          error: enhancedData.reason?.message
        },
        perfect: {
          success: perfectData.status === 'fulfilled',
          fieldCount: perfectData.value ? Object.keys(perfectData.value.financials || {}).length : 0,
          quality: perfectData.value?.dataQuality?.overallScore,
          error: perfectData.reason?.message
        }
      },
      improvement: {
        fieldIncrease: 0,
        qualityScore: 0
      }
    };
    
    // Calculate improvement
    if (comparison.methods.perfect.success) {
      const oldFields = Math.max(
        comparison.methods.original.fieldCount,
        comparison.methods.enhanced.fieldCount
      );
      comparison.improvement.fieldIncrease = oldFields > 0
        ? ((comparison.methods.perfect.fieldCount - oldFields) / oldFields) * 100
        : 100;
      comparison.improvement.qualityScore = (comparison.methods.perfect.quality || 0) * 100;
    }
    
    res.json(comparison);
    
  } catch (error) {
    console.error('Comparison Error:', error);
    res.status(500).json({
      error: 'Failed to compare extraction methods',
      message: error.message
    });
  }
});

export default router;
