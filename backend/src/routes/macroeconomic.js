import express from 'express';
import fredService from '../services/fredService.js';  // Use the updated service with M2
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Clear cache on startup to ensure fresh data with M2 money supply
cache.flushAll();
console.log('Macroeconomic cache cleared - using FRED service with M2 money supply');

// NEW: Get monetary policy data (includes M2 money supply)
router.get('/monetary-policy', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const cacheKey = `macro_monetary_policy_${period}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached monetary policy data');
      return res.json(cachedData);
    }
    
    console.log('Fetching fresh monetary policy data including M2 money supply');
    const data = await fredService.getMonetaryPolicy();
    
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching monetary policy data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monetary policy data',
      message: error.message 
    });
  }
});

// Get all macroeconomic data
router.get('/all', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const cacheKey = `macro_all_with_m2_${period}`;  // Updated cache key
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Returning cached macro data with M2 for period: ${period}`);
      return res.json(cachedData);
    }
    
    console.log(`Fetching fresh macro data with M2 for period: ${period}`);
    const data = await fredService.getAllMacroData();
    
    // Cache the data
    cache.set(cacheKey, data);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching macro data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch macroeconomic data',
      message: error.message 
    });
  }
});

// Get interest rates data
router.get('/interest-rates', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const cacheKey = `macro_interest_${period}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const data = await fredService.getInterestRates();
    cache.set(cacheKey, data);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching interest rates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interest rates data',
      message: error.message 
    });
  }
});

// Get growth and inflation data
router.get('/growth-inflation', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const cacheKey = `macro_growth_inflation_${period}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const data = await fredService.getGrowthAndInflation();
    cache.set(cacheKey, data);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching growth and inflation data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch growth and inflation data',
      message: error.message 
    });
  }
});

// Get labor and consumer data
router.get('/labor-consumer', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const cacheKey = `macro_labor_consumer_${period}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const data = await fredService.getLaborAndConsumer();
    cache.set(cacheKey, data);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching labor and consumer data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch labor and consumer data',
      message: error.message 
    });
  }
});

// UPDATED: Get analysis for macroeconomic indicators (now includes M2)
router.get('/analysis', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    const data = await fredService.getAllMacroData();
    
    // Generate analysis based on the data
    const analysis = {
      monetaryPolicy: {
        title: 'Monetary Policy & Money Supply',
        summary: generateMonetaryPolicyAnalysis(data.monetaryPolicy),
        trend: getMonetaryPolicyTrend(data.monetaryPolicy)
      },
      interestRates: {
        title: 'Interest Rate Environment',
        summary: generateInterestRateAnalysis(data.interestRates),
        trend: getInterestRateTrend(data.interestRates)
      },
      growthInflation: {
        title: 'Growth and Inflation Dynamics',
        summary: generateGrowthInflationAnalysis(data.growthInflation),
        trend: getGrowthInflationTrend(data.growthInflation)
      },
      laborConsumer: {
        title: 'Labor Market and Consumer Health',
        summary: generateLaborConsumerAnalysis(data.laborConsumer),
        trend: getLaborConsumerTrend(data.laborConsumer)
      }
    };
    
    res.json(analysis);
  } catch (error) {
    console.error('Error generating macro analysis:', error);
    res.status(500).json({ 
      error: 'Failed to generate macroeconomic analysis',
      message: error.message 
    });
  }
});

// NEW: Helper function for monetary policy analysis
function generateMonetaryPolicyAnalysis(data) {
  if (!data?.latest) {
    return 'Insufficient data for monetary policy analysis.';
  }
  
  const { m2MoneySupply, m2Growth, fedFundsRate, twoYear, tenYear } = data.latest;
  
  let analysis = '';
  
  if (m2MoneySupply?.value) {
    analysis += `M2 money supply at $${(m2MoneySupply.value / 1000).toFixed(1)}T`;
    
    if (m2Growth?.value) {
      analysis += ` (${m2Growth.value > 0 ? '+' : ''}${m2Growth.value.toFixed(1)}% YoY growth). `;
      
      if (m2Growth.value > 5) {
        analysis += 'Money supply growing rapidly, potentially inflationary. ';
      } else if (m2Growth.value < 0) {
        analysis += 'Money supply contracting, potentially deflationary. ';
      } else {
        analysis += 'Money supply growth moderate. ';
      }
    }
  }
  
  if (fedFundsRate?.value) {
    analysis += `Fed Funds rate at ${fedFundsRate.value.toFixed(2)}%. `;
    
    if (fedFundsRate.value > 4) {
      analysis += 'Monetary policy remains restrictive. ';
    } else if (fedFundsRate.value < 2) {
      analysis += 'Monetary policy is accommodative. ';
    } else {
      analysis += 'Monetary policy is neutral. ';
    }
  }
  
  return analysis || 'Unable to generate monetary policy analysis.';
}

function getMonetaryPolicyTrend(data) {
  if (!data?.data?.M2_YOY?.length) return 'neutral';
  
  const m2Data = data.data.M2_YOY;
  const recent = m2Data.slice(-3);
  if (recent.length < 3) return 'neutral';
  
  const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const first = recent[0].value;
  
  if (avg > first + 1) return 'expansionary';
  if (avg < first - 1) return 'contractionary';
  return 'stable';
}

// Helper functions for analysis - updated to match new data structure
function generateInterestRateAnalysis(data) {
  if (!data?.data?.DGS2?.length || !data?.data?.DGS10?.length) {
    return 'Insufficient data for interest rate analysis.';
  }
  
  const latest2Y = data.latest?.twoYear?.value;
  const latest10Y = data.latest?.tenYear?.value;
  const latest30Y = data.latest?.thirtyYear?.value;
  
  if (!latest2Y || !latest10Y) {
    return 'Unable to retrieve latest interest rate data.';
  }
  
  const spread2Y10Y = latest10Y - latest2Y;
  const isInverted = spread2Y10Y < 0;
  
  let analysis = `Current yields: 2Y at ${latest2Y.toFixed(2)}%, 10Y at ${latest10Y.toFixed(2)}%`;
  if (latest30Y) {
    analysis += `, 30Y at ${latest30Y.toFixed(2)}%`;
  }
  analysis += `. `;
  
  if (isInverted) {
    analysis += `The yield curve is inverted with a 2Y-10Y spread of ${spread2Y10Y.toFixed(2)}%, historically indicating recession concerns. `;
  } else {
    analysis += `The yield curve shows a normal positive slope with a 2Y-10Y spread of ${spread2Y10Y.toFixed(2)}%. `;
  }
  
  return analysis;
}

function generateGrowthInflationAnalysis(data) {
  if (!data?.data?.A191RL1Q225SBEA?.length || !data?.data?.CPI_YOY?.length) {
    return 'Insufficient data for growth and inflation analysis.';
  }
  
  const latestGDP = data.latest?.gdpGrowth?.value;
  const latestCPI = data.latest?.cpi?.value;
  const latestPCE = data.latest?.pce?.value;
  
  if (!latestGDP || !latestCPI) {
    return 'Unable to retrieve latest growth and inflation data.';
  }
  
  let analysis = `GDP growth at ${latestGDP.toFixed(1)}% annually, `;
  analysis += `CPI inflation at ${latestCPI.toFixed(1)}% YoY`;
  
  if (latestPCE) {
    analysis += `, PCE inflation at ${latestPCE.toFixed(1)}% YoY`;
  }
  analysis += `. `;
  
  if (latestCPI > 3) {
    analysis += 'Inflation remains elevated above the Fed\'s 2% target. ';
  } else if (latestCPI < 2) {
    analysis += 'Inflation is running below the Fed\'s 2% target. ';
  } else {
    analysis += 'Inflation is near the Fed\'s 2% target. ';
  }
  
  return analysis;
}

function generateLaborConsumerAnalysis(data) {
  if (!data?.data?.UNRATE?.length || !data?.data?.RETAIL_YOY?.length) {
    return 'Insufficient data for labor and consumer analysis.';
  }
  
  const latestUnemployment = data.latest?.unemployment?.value;
  const latestRetailSales = data.latest?.retailSales?.value;
  
  if (!latestUnemployment || !latestRetailSales) {
    return 'Unable to retrieve latest labor and consumer data.';
  }
  
  let analysis = `Unemployment rate at ${latestUnemployment.toFixed(1)}%, `;
  
  if (latestUnemployment < 4) {
    analysis += 'indicating a tight labor market. ';
  } else if (latestUnemployment > 5) {
    analysis += 'showing some labor market weakness. ';
  } else {
    analysis += 'suggesting a balanced labor market. ';
  }
  
  analysis += `Retail sales growth at ${latestRetailSales.toFixed(1)}% YoY, `;
  
  if (latestRetailSales > 3) {
    analysis += 'indicating strong consumer spending.';
  } else if (latestRetailSales < 0) {
    analysis += 'showing weakness in consumer spending.';
  } else {
    analysis += 'showing moderate consumer activity.';
  }
  
  return analysis;
}

function getInterestRateTrend(data) {
  if (!data?.data?.DGS10?.length) return 'neutral';
  
  const tenYearData = data.data.DGS10;
  const recent = tenYearData.slice(-3);
  if (recent.length < 3) return 'neutral';
  
  const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const first = recent[0].value;
  
  if (avg > first * 1.05) return 'rising';
  if (avg < first * 0.95) return 'falling';
  return 'stable';
}

function getGrowthInflationTrend(data) {
  if (!data?.data?.A191RL1Q225SBEA?.length) return 'neutral';
  
  const gdpData = data.data.A191RL1Q225SBEA;
  const recent = gdpData.slice(-2);
  if (recent.length < 2) return 'neutral';
  
  const latest = recent[recent.length - 1].value;
  const previous = recent[0].value;
  
  if (latest > previous + 0.5) return 'accelerating';
  if (latest < previous - 0.5) return 'decelerating';
  return 'stable';
}

function getLaborConsumerTrend(data) {
  if (!data?.data?.UNRATE?.length) return 'neutral';
  
  const unemploymentData = data.data.UNRATE;
  const recent = unemploymentData.slice(-3);
  if (recent.length < 3) return 'neutral';
  
  const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const first = recent[0].value;
  
  // For unemployment, lower is better
  if (avg < first - 0.1) return 'improving';
  if (avg > first + 0.1) return 'weakening';
  return 'stable';
}

export default router;