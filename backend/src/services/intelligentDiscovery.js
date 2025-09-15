// Intelligent Discovery Service - PRODUCTION READY
import axios from 'axios';

const FMP_API_KEY = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';

class IntelligentDiscoveryService {
  
  // MARKET PULSE: Stocks with unusual activity patterns
  async getMarketPulse() {
    try {
      // Get stocks with unusual volume AND price movement
      const [volumeRes, priceRes, newsRes] = await Promise.all([
        axios.get(`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${FMP_API_KEY}`),
        axios.get(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_API_KEY}`),
        axios.get(`https://financialmodelingprep.com/api/v3/stock-news?limit=20&apikey=${FMP_API_KEY}`)
      ]);
      
      // Combine signals: high volume + significant price move + news coverage
      const activeStocks = volumeRes.data || [];
      const gainers = priceRes.data || [];
      const news = newsRes.data || [];
      
      // Score stocks by multiple factors
      const stockScores = {};
      
      // Volume signal (most active)
      activeStocks.slice(0, 20).forEach((stock, idx) => {
        if (!stockScores[stock.symbol]) {
          stockScores[stock.symbol] = { 
            symbol: stock.symbol, 
            name: stock.name,
            score: 0,
            signals: [],
            changePercent: stock.changesPercentage || 0
          };
        }
        stockScores[stock.symbol].score += (20 - idx); // Higher score for more volume
        stockScores[stock.symbol].signals.push('High Volume');
      });
      
      // Price movement signal
      gainers.slice(0, 10).forEach((stock, idx) => {
        if (!stockScores[stock.symbol]) {
          stockScores[stock.symbol] = { 
            symbol: stock.symbol, 
            name: stock.name,
            score: 0,
            signals: [],
            changePercent: stock.changesPercentage || 0
          };
        }
        stockScores[stock.symbol].score += (10 - idx);
        stockScores[stock.symbol].signals.push(`${stock.chan