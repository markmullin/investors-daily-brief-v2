// Benchmark data routes for accurate portfolio comparison
import express from 'express';
import eodService from '../services/eodService.js';

const router = express.Router();

// FIXED: Dedicated endpoint for benchmark data (S&P 500 returns)
// This ensures we get exact period data without extra data for technical indicators
router.get('/returns/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { periods } = req.query;
    
    console.log(`\n📊 BENCHMARK RETURNS API: ${symbol}`);
    console.log(`Requested periods: ${periods || 'all'}`);
    
    // Format symbol for EOD API
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.US`;
    
    // Define exact periods for benchmark calculations
    const periodDefinitions = {
      '1W': { days: 7, label: '1 Week' },
      '1M': { days: 30, label: '1 Month' },
      '3M': { days: 90, label: '3 Months' },
      '1Y': { days: 365, label: '1 Year' },
      '3Y': { days: 1095, label: '3 Years' },
      '5Y': { days: 1825, label: '5 Years' }
    };
    
    // Get current date
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    // Fetch ALL historical data once (more efficient than multiple calls)
    // Request 6 years to ensure we have enough data for 5Y calculation
    const sixYearsAgo = new Date(now);
    sixYearsAgo.setFullYear(now.getFullYear() - 6);
    const startDate = sixYearsAgo.toISOString().split('T')[0];
    
    console.log(`Fetching data from ${startDate} to ${endDate}`);
    
    // Fetch daily data for accurate calculations
    const params = {
      from: startDate,
      to: endDate,
      interval: 'd'
    };
    
    const historicalData = await eodService.fetchEODData(formattedSymbol, params);
    
    if (!historicalData || historicalData.length === 0) {
      console.error('No historical data received');
      return res.status(404).json({ 
        error: 'No historical data available',
        symbol: symbol 
      });
    }
    
    console.log(`Received ${historicalData.length} data points`);
    
    // Sort chronologically
    historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get latest price
    const latestData = historicalData[historicalData.length - 1];
    const currentPrice = latestData.close;
    const latestDate = latestData.date;
    
    console.log(`Current ${symbol} price: $${currentPrice.toFixed(2)} on ${latestDate}`);
    
    // Calculate returns for each period
    const returns = {};
    
    // Helper function to find closest data point to target date
    const findClosestData = (targetDate) => {
      let closest = null;
      let minDiff = Infinity;
      
      for (const dataPoint of historicalData) {
        const pointDate = new Date(dataPoint.date);
        const diff = Math.abs(pointDate.getTime() - targetDate.getTime());
        
        if (diff < minDiff) {
          minDiff = diff;
          closest = dataPoint;
        }
      }
      
      return closest;
    };
    
    // Calculate returns for each period
    Object.entries(periodDefinitions).forEach(([periodKey, periodInfo]) => {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - periodInfo.days);
      
      console.log(`\nCalculating ${periodKey} return (${periodInfo.days} days)`);
      console.log(`Target date: ${targetDate.toISOString().split('T')[0]}`);
      
      const historicalData = findClosestData(targetDate);
      
      if (historicalData) {
        const historicalPrice = historicalData.close;
        const returnPct = ((currentPrice - historicalPrice) / historicalPrice) * 100;
        
        console.log(`Historical price: $${historicalPrice.toFixed(2)} on ${historicalData.date}`);
        console.log(`Return: ${returnPct.toFixed(2)}%`);
        
        returns[periodKey] = {
          return: returnPct,
          startDate: historicalData.date,
          startPrice: historicalPrice,
          endDate: latestDate,
          endPrice: currentPrice,
          days: periodInfo.days,
          label: periodInfo.label
        };
        
        // Calculate CAGR for periods >= 1 year
        if (periodKey === '1Y' || periodKey === '3Y' || periodKey === '5Y') {
          const years = periodInfo.days / 365;
          const cagr = (Math.pow(1 + (returnPct / 100), 1 / years) - 1) * 100;
          returns[periodKey].cagr = cagr;
          console.log(`CAGR: ${cagr.toFixed(2)}%`);
        }
      } else {
        console.log(`No data found for ${periodKey}`);
        returns[periodKey] = {
          return: null,
          error: 'Insufficient historical data',
          days: periodInfo.days,
          label: periodInfo.label
        };
      }
    });
    
    // Add 'ALL' period (same as 5Y for now)
    returns['ALL'] = returns['5Y'] ? { ...returns['5Y'], label: 'All Time' } : null;
    
    // Validation check for 5Y
    if (returns['5Y'] && returns['5Y'].return) {
      console.log(`\n✅ VALIDATION CHECK:`);
      console.log(`5Y Return: ${returns['5Y'].return.toFixed(2)}%`);
      console.log(`Expected (from Google): ~84.57%`);
      console.log(`Difference: ${Math.abs(returns['5Y'].return - 84.57).toFixed(2)} percentage points`);
    }
    
    const response = {
      symbol: symbol,
      currentPrice: currentPrice,
      lastUpdated: latestDate,
      returns: returns,
      dataPoints: historicalData.length
    };
    
    console.log(`\n✅ Benchmark calculation complete for ${symbol}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Benchmark calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate benchmark returns',
      message: error.message 
    });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Benchmark routes working',
    timestamp: new Date().toISOString()
  });
});

export default router;
