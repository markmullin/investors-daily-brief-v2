/**
 * *** ENHANCED ANALYST PROJECTIONS ENDPOINT ***
 * 
 * Purpose: Get comprehensive forward-looking analyst projections
 * Including: Projected revenue growth, projected net income, forward estimates
 */

import express from 'express';
import fmpService from '../services/fmpService.js';
import unifiedDataService from '../services/unifiedDataService.js';

const router = express.Router();

/**
 * *** COMPREHENSIVE ANALYST PROJECTIONS ENDPOINT ***
 * Gets all forward-looking analyst data including growth projections
 */
router.get('/analyst-projections/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔮 [ANALYST PROJECTIONS] Getting comprehensive forward-looking data for ${symbol}...`);
    
    // Get multiple analyst data sources in parallel
    const [
      analystEstimates,
      earningsEstimates, 
      consensusData,
      currentFundamentals,
      quote
    ] = await Promise.all([
      fmpService.makeRequest(`/v3/analyst-estimates/${symbol}`, {}, 360),
      fmpService.makeRequest(`/v3/earning_call_transcript/${symbol}`, {}, 1440).catch(() => null), // Optional
      fmpService.makeRequest(`/v4/earning_call_transcript`, { symbol }, 1440).catch(() => null), // Alternative endpoint
      unifiedDataService.getFundamentals(symbol),
      unifiedDataService.getRealTimeQuote(symbol)
    ]);
    
    if (!analystEstimates || analystEstimates.length === 0) {
      return res.json({
        success: true,
        symbol: symbol,
        projections: null,
        message: 'No analyst projections available for this symbol'
      });
    }
    
    console.log(`📊 [ANALYST PROJECTIONS] Found ${analystEstimates.length} estimate periods for ${symbol}`);
    
    // Process quarterly and annual estimates
    const quarterlyEstimates = analystEstimates.filter(est => est.period === 'quarter').slice(0, 8);
    const annualEstimates = analystEstimates.filter(est => est.period === 'year').slice(0, 4);
    
    // Calculate projected growth rates from estimates
    const projectedGrowthRates = calculateProjectedGrowthRates(annualEstimates, currentFundamentals);
    
    // Format comprehensive projections
    const analystProjections = {
      symbol: symbol,
      currentPrice: quote?.price,
      currentFundamentals: {
        revenue: currentFundamentals?.revenue,
        netIncome: currentFundamentals?.netIncome,
        eps: currentFundamentals?.eps,
        lastUpdated: currentFundamentals?.timestamp
      },
      
      // *** FORWARD-LOOKING REVENUE PROJECTIONS ***
      revenueProjections: {
        quarterly: quarterlyEstimates.map(est => ({
          period: est.date,
          estimatedRevenue: est.estimatedRevenueAvg,
          revenueHigh: est.estimatedRevenueHigh,
          revenueLow: est.estimatedRevenueLow,
          analystCount: est.numberAnalystsEstimatedRevenue || 0,
          growthFromPriorYear: calculateGrowthFromPriorYear(est, 'revenue')
        })),
        annual: annualEstimates.map(est => ({
          year: new Date(est.date).getFullYear(),
          period: est.date,
          estimatedRevenue: est.estimatedRevenueAvg,
          revenueHigh: est.estimatedRevenueHigh,
          revenueLow: est.estimatedRevenueLow,
          analystCount: est.numberAnalystsEstimatedRevenue || 0,
          projectedGrowthRate: calculateYearOverYearGrowth(est, annualEstimates, 'revenue')
        }))
      },
      
      // *** FORWARD-LOOKING EARNINGS PROJECTIONS ***
      earningsProjections: {
        quarterly: quarterlyEstimates.map(est => ({
          period: est.date,
          estimatedEPS: est.estimatedEpsAvg,
          epsHigh: est.estimatedEpsHigh,
          epsLow: est.estimatedEpsLow,
          analystCount: est.numberAnalystsEstimatedEps || 0,
          growthFromPriorYear: calculateGrowthFromPriorYear(est, 'eps')
        })),
        annual: annualEstimates.map(est => ({
          year: new Date(est.date).getFullYear(),
          period: est.date,
          estimatedEPS: est.estimatedEpsAvg,
          epsHigh: est.estimatedEpsHigh,
          epsLow: est.estimatedEpsLow,
          analystCount: est.numberAnalystsEstimatedEps || 0,
          projectedGrowthRate: calculateYearOverYearGrowth(est, annualEstimates, 'eps'),
          impliedNetIncome: est.estimatedEpsAvg ? (est.estimatedEpsAvg * (currentFundamentals?.marketCap / quote?.price || 1)) : null
        }))
      },
      
      // *** PROJECTED GROWTH SUMMARY ***
      projectedGrowthRates: {
        nextYearRevenueGrowth: projectedGrowthRates.nextYearRevenueGrowth,
        nextYearEarningsGrowth: projectedGrowthRates.nextYearEarningsGrowth,
        twoYearRevenueCAGR: projectedGrowthRates.twoYearRevenueCAGR,
        twoYearEarningsCAGR: projectedGrowthRates.twoYearEarningsCAGR,
        longTermGrowthRate: projectedGrowthRates.longTermGrowthRate
      },
      
      // *** CONSENSUS SUMMARY ***
      consensusSummary: {
        revenueConsensus: calculateConsensus(annualEstimates, 'revenue'),
        earningsConsensus: calculateConsensus(annualEstimates, 'eps'),
        nextYearTargets: getNextYearTargets(annualEstimates),
        analystCount: Math.max(...annualEstimates.map(est => est.numberAnalystsEstimatedRevenue || 0))
      },
      
      dataSource: 'FMP Premium API - Comprehensive Analyst Projections',
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`✅ [ANALYST PROJECTIONS] Processed projections for ${symbol}:`, {
      quarterlyEstimates: analystProjections.revenueProjections.quarterly.length,
      annualEstimates: analystProjections.revenueProjections.annual.length,
      nextYearRevenueGrowth: projectedGrowthRates.nextYearRevenueGrowth,
      nextYearEarningsGrowth: projectedGrowthRates.nextYearEarningsGrowth
    });
    
    res.json({
      success: true,
      symbol: symbol,
      projections: analystProjections
    });
    
  } catch (error) {
    console.error(`❌ [ANALYST PROJECTIONS] Failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load analyst projections',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * *** ENHANCED ANALYST ESTIMATES WITH GROWTH CALCULATIONS ***
 * Replaces the basic analyst-estimates endpoint
 */
router.get('/analyst-estimates/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📈 [ENHANCED ESTIMATES] Getting analyst estimates with growth projections for ${symbol}...`);
    
    const [estimates, currentFundamentals] = await Promise.all([
      fmpService.makeRequest(`/v3/analyst-estimates/${symbol}`, {}, 360),
      unifiedDataService.getFundamentals(symbol).catch(() => null)
    ]);
    
    if (!estimates || estimates.length === 0) {
      return res.json({
        success: true,
        symbol: symbol,
        estimates: null,
        message: 'No analyst estimates available'
      });
    }
    
    // Enhanced formatting with growth calculations
    const formattedEstimates = estimates.slice(0, 12).map((estimate, index) => {
      const nextEstimate = estimates[index + 1]; // For growth calculation
      
      return {
        period: estimate.date,
        year: new Date(estimate.date).getFullYear(),
        quarter: getQuarterFromDate(estimate.date),
        
        // *** REVENUE PROJECTIONS ***
        revenueEstimate: estimate.estimatedRevenueAvg,
        revenueHigh: estimate.estimatedRevenueHigh,
        revenueLow: estimate.estimatedRevenueLow,
        revenueGrowthProjected: nextEstimate ? 
          calculateGrowthBetweenEstimates(estimate.estimatedRevenueAvg, nextEstimate.estimatedRevenueAvg) : null,
        
        // *** EARNINGS PROJECTIONS ***  
        epsEstimate: estimate.estimatedEpsAvg,
        epsHigh: estimate.estimatedEpsHigh,
        epsLow: estimate.estimatedEpsLow,
        earningsGrowthProjected: nextEstimate ?
          calculateGrowthBetweenEstimates(estimate.estimatedEpsAvg, nextEstimate.estimatedEpsAvg) : null,
        
        // *** ANALYST COVERAGE ***
        analystCount: estimate.numberAnalystsEstimatedRevenue || 0,
        
        // *** COMPARISON TO CURRENT ***
        vs_current: currentFundamentals ? {
          revenueGrowthFromCurrent: currentFundamentals.revenue ? 
            ((estimate.estimatedRevenueAvg - currentFundamentals.revenue) / currentFundamentals.revenue * 100) : null,
          epsGrowthFromCurrent: currentFundamentals.eps ?
            ((estimate.estimatedEpsAvg - currentFundamentals.eps) / currentFundamentals.eps * 100) : null
        } : null
      };
    });
    
    // Calculate summary growth projections
    const growthSummary = calculateEstimatesGrowthSummary(formattedEstimates, currentFundamentals);
    
    res.json({
      success: true,
      symbol: symbol,
      estimates: formattedEstimates,
      growthSummary: growthSummary,
      dataSource: 'FMP Premium API - Enhanced Analyst Estimates with Growth Projections',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [ENHANCED ESTIMATES] Failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load enhanced analyst estimates',
      details: error.message
    });
  }
});

/**
 * *** HELPER FUNCTIONS FOR GROWTH CALCULATIONS ***
 */

function calculateProjectedGrowthRates(annualEstimates, currentFundamentals) {
  if (!annualEstimates || annualEstimates.length < 2) {
    return {
      nextYearRevenueGrowth: null,
      nextYearEarningsGrowth: null,
      twoYearRevenueCAGR: null,
      twoYearEarningsCAGR: null,
      longTermGrowthRate: null
    };
  }
  
  const currentYear = annualEstimates[0];
  const nextYear = annualEstimates[1];
  const twoYearsOut = annualEstimates[2];
  
  // Calculate next year growth
  const nextYearRevenueGrowth = currentYear.estimatedRevenueAvg && nextYear.estimatedRevenueAvg ?
    ((nextYear.estimatedRevenueAvg - currentYear.estimatedRevenueAvg) / currentYear.estimatedRevenueAvg * 100) : null;
    
  const nextYearEarningsGrowth = currentYear.estimatedEpsAvg && nextYear.estimatedEpsAvg ?
    ((nextYear.estimatedEpsAvg - currentYear.estimatedEpsAvg) / currentYear.estimatedEpsAvg * 100) : null;
  
  // Calculate 2-year CAGR
  const twoYearRevenueCAGR = currentYear.estimatedRevenueAvg && twoYearsOut?.estimatedRevenueAvg ?
    (Math.pow(twoYearsOut.estimatedRevenueAvg / currentYear.estimatedRevenueAvg, 1/2) - 1) * 100 : null;
    
  const twoYearEarningsCAGR = currentYear.estimatedEpsAvg && twoYearsOut?.estimatedEpsAvg ?
    (Math.pow(twoYearsOut.estimatedEpsAvg / currentYear.estimatedEpsAvg, 1/2) - 1) * 100 : null;
  
  // Estimate long-term growth rate (average of available years)
  const allGrowthRates = [];
  for (let i = 0; i < annualEstimates.length - 1; i++) {
    const current = annualEstimates[i];
    const next = annualEstimates[i + 1];
    if (current.estimatedRevenueAvg && next.estimatedRevenueAvg) {
      const growth = (next.estimatedRevenueAvg - current.estimatedRevenueAvg) / current.estimatedRevenueAvg * 100;
      allGrowthRates.push(growth);
    }
  }
  
  const longTermGrowthRate = allGrowthRates.length > 0 ?
    allGrowthRates.reduce((sum, rate) => sum + rate, 0) / allGrowthRates.length : null;
  
  return {
    nextYearRevenueGrowth,
    nextYearEarningsGrowth,
    twoYearRevenueCAGR,
    twoYearEarningsCAGR,
    longTermGrowthRate
  };
}

function calculateYearOverYearGrowth(currentEstimate, allEstimates, field) {
  const currentYear = new Date(currentEstimate.date).getFullYear();
  const priorYearEstimate = allEstimates.find(est => 
    new Date(est.date).getFullYear() === currentYear - 1
  );
  
  if (!priorYearEstimate) return null;
  
  const currentValue = field === 'revenue' ? currentEstimate.estimatedRevenueAvg : currentEstimate.estimatedEpsAvg;
  const priorValue = field === 'revenue' ? priorYearEstimate.estimatedRevenueAvg : priorYearEstimate.estimatedEpsAvg;
  
  if (!currentValue || !priorValue) return null;
  
  return ((currentValue - priorValue) / priorValue * 100);
}

function calculateGrowthFromPriorYear(estimate, field) {
  // This would need historical data to calculate properly
  // For now, return null as we'd need additional API calls
  return null;
}

function calculateGrowthBetweenEstimates(current, next) {
  if (!current || !next || current === 0) return null;
  return ((next - current) / current * 100);
}

function calculateConsensus(annualEstimates, field) {
  if (!annualEstimates || annualEstimates.length === 0) return null;
  
  const values = annualEstimates.map(est => 
    field === 'revenue' ? est.estimatedRevenueAvg : est.estimatedEpsAvg
  ).filter(val => val !== null && val !== undefined);
  
  if (values.length === 0) return null;
  
  return {
    consensus: values.reduce((sum, val) => sum + val, 0) / values.length,
    high: Math.max(...values),
    low: Math.min(...values),
    spread: Math.max(...values) - Math.min(...values)
  };
}

function getNextYearTargets(annualEstimates) {
  const nextYear = new Date().getFullYear() + 1;
  const nextYearEstimate = annualEstimates.find(est => 
    new Date(est.date).getFullYear() === nextYear
  );
  
  if (!nextYearEstimate) return null;
  
  return {
    year: nextYear,
    revenueTarget: nextYearEstimate.estimatedRevenueAvg,
    epsTarget: nextYearEstimate.estimatedEpsAvg,
    analystCount: nextYearEstimate.numberAnalystsEstimatedRevenue || 0
  };
}

function getQuarterFromDate(dateString) {
  const date = new Date(dateString);
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
}

function calculateEstimatesGrowthSummary(estimates, currentFundamentals) {
  const futureEstimates = estimates.filter(est => new Date(est.period) > new Date());
  
  if (futureEstimates.length === 0) return null;
  
  const revenueGrowthRates = futureEstimates
    .map(est => est.revenueGrowthProjected)
    .filter(rate => rate !== null);
    
  const earningsGrowthRates = futureEstimates
    .map(est => est.earningsGrowthProjected)
    .filter(rate => rate !== null);
  
  return {
    averageProjectedRevenueGrowth: revenueGrowthRates.length > 0 ?
      revenueGrowthRates.reduce((sum, rate) => sum + rate, 0) / revenueGrowthRates.length : null,
    averageProjectedEarningsGrowth: earningsGrowthRates.length > 0 ?
      earningsGrowthRates.reduce((sum, rate) => sum + rate, 0) / earningsGrowthRates.length : null,
    totalForwardEstimates: futureEstimates.length,
    longestProjection: futureEstimates.length > 0 ? 
      Math.max(...futureEstimates.map(est => new Date(est.period).getFullYear())) : null
  };
}

export default router;
