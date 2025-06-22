import express from 'express';
import marketAnalysisService from '../services/marketAnalysisService.js';
import { marketService } from '../services/apiServices.js';
import eodService from '../services/eodService.js';

const router = express.Router();

// Simple technical indicator calculations with explicit logging
function calculateMA200Simple(data) {
  console.log('calculateMA200Simple called with', data.length, 'points');
  
  const result = [...data];
  for (let i = 199; i < result.length; i++) {
    const slice = result.slice(i - 199, i + 1);
    const sum = slice.reduce((acc, d) => acc + (d.close || d.price || 0), 0);
    result[i].ma200 = sum / 200;
  }
  
  const ma200Count = result.filter(d => d.ma200 !== null && d.ma200 !== undefined).length;
  console.log('MA200 calculated for', ma200Count, 'points');
  return result;
}

function calculateRSISimple(data) {
  console.log('calculateRSISimple called with', data.length, 'points');
  
  const result = [...data];
  const period = 14;
  
  if (data.length < period + 1) {
    console.log('Not enough data for RSI');
    return result;
  }
  
  // Calculate price changes
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push((data[i].close || data[i].price) - (data[i-1].close || data[i-1].price));
  }
  
  // Calculate RSI
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    
    for (let j = i - period; j < i; j++) {
      const change = changes[j];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i].rsi = 100 - (100 / (1 + rs));
  }
  
  const rsiCount = result.filter(d => d.rsi !== null && d.rsi !== undefined).length;
  console.log('RSI calculated for', rsiCount, 'points');
  return result;
}

// Historical data endpoint
router.get('/history/:symbol', async (req, res) => {
  console.log('\n=== HISTORY ENDPOINT HIT ===');
  
  try {
    const { symbol } = req.params;
    const { period } = req.query;
    
    console.log('Symbol:', symbol, 'Period:', period);
    
    // Get data from EOD service
    const data = await eodService.getHistoricalPrices(symbol, period);
    console.log('Raw data length:', data.length);
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Skip indicators for intraday
    if (period === '1d' || period === '5d') {
      console.log('Skipping indicators for intraday period');
      return res.json(data);
    }
    
    // Calculate indicators
    console.log('Calculating indicators...');
    let processedData = calculateMA200Simple(data);
    processedData = calculateRSISimple(processedData);
    
    // Log sample results
    const sample = processedData[Math.floor(processedData.length / 2)];
    console.log('Sample from middle:', {
      date: sample.date,
      price: sample.price || sample.close,
      ma200: sample.ma200,
      rsi: sample.rsi
    });
    
    // Filter displayed data
    const displayedData = processedData.filter(item => item.isDisplayed !== false);
    console.log('Sending', displayedData.length, 'displayed points');
    
    res.json(displayedData);
  } catch (error) {
    console.error('History endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Other required endpoints (minimized for clarity)
router.get('/news', async (req, res) => {
  try {
    res.json({ articles: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/data', async (req, res) => {
  try {
    const data = await marketService.getData();
    res.json(Object.entries(data).map(([symbol, quote]) => ({
      symbol,
      name: quote.name || symbol,
      close: quote.close,
      change_p: quote.change_p
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
