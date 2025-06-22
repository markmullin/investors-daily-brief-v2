// Minimal test server to verify indicators are calculated
import express from 'express';
import dotenv from 'dotenv';
import eodService from './src/services/eodService.js';

dotenv.config();

const app = express();
const VERSION = 'test-minimal-v1';

console.log(`Starting minimal test server - VERSION: ${VERSION}`);

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Version endpoint
app.get('/api/market/version', (req, res) => {
  res.json({ version: VERSION, timestamp: new Date().toISOString() });
});

// Test history endpoint with indicators
app.get('/api/market/history/:symbol', async (req, res) => {
  console.log(`History endpoint called for ${req.params.symbol}`);
  
  try {
    const { symbol } = req.params;
    const { period = '1y' } = req.query;
    
    // Get data
    const data = await eodService.getHistoricalPrices(symbol, period);
    console.log(`Got ${data.length} data points`);
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Skip indicators for intraday
    if (period === '1d' || period === '5d') {
      return res.json(data);
    }
    
    // Calculate MA200
    console.log('Calculating MA200...');
    let processedData = data.map((item, index) => {
      let ma200 = null;
      if (index >= 199) {
        const slice = data.slice(index - 199, index + 1);
        const sum = slice.reduce((acc, d) => acc + (d.close || d.price || 0), 0);
        ma200 = sum / 200;
      }
      return { ...item, ma200 };
    });
    
    // Calculate RSI
    console.log('Calculating RSI...');
    const period_rsi = 14;
    if (processedData.length >= period_rsi + 1) {
      // Calculate price changes
      const changes = [];
      for (let i = 1; i < processedData.length; i++) {
        changes.push((processedData[i].close || processedData[i].price) - 
                    (processedData[i-1].close || processedData[i-1].price));
      }
      
      // Set initial RSI to null
      for (let i = 0; i < period_rsi; i++) {
        processedData[i].rsi = null;
      }
      
      // Calculate RSI
      for (let i = period_rsi; i < processedData.length; i++) {
        let gains = 0, losses = 0;
        for (let j = i - period_rsi; j < i; j++) {
          const change = changes[j];
          if (change > 0) gains += change;
          else losses += Math.abs(change);
        }
        
        const avgGain = gains / period_rsi;
        const avgLoss = losses / period_rsi;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        processedData[i].rsi = 100 - (100 / (1 + rs));
      }
    }
    
    // Filter displayed data
    const displayedData = processedData.filter(item => item.isDisplayed !== false);
    
    // Log summary
    const ma200Count = displayedData.filter(d => d.ma200 != null).length;
    const rsiCount = displayedData.filter(d => d.rsi != null).length;
    console.log(`Sending ${displayedData.length} points: ${ma200Count} with MA200, ${rsiCount} with RSI`);
    
    res.json(displayedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Minimal test server running on port ${port}`);
  console.log(`Test version at: http://localhost:${port}/api/market/version`);
  console.log(`Test history at: http://localhost:${port}/api/market/history/SPY.US?period=1y`);
});
