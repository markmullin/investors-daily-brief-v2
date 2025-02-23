import axios from 'axios';

class EODService {
  constructor() {
    this.baseURL = 'https://eodhd.com/api';
    this.apiKey = process.env.EOD_API_KEY;
  }

  async getMarketData() {
    try {
      // Added TLT to the symbols list
      const stockSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'TLT'].map(s => `${s}.US`).join(',');
      console.log('Fetching bulk quotes for:', stockSymbols);

      const stocksResponse = await axios.get(
        `${this.baseURL}/real-time/${stockSymbols}`, {
          params: {
            api_token: this.apiKey,
            fmt: 'json'
          }
        }
      );

      console.log('Stock data received:', stocksResponse.data);
      const stocksData = Array.isArray(stocksResponse.data) ? stocksResponse.data : [stocksResponse.data];
      return stocksData.map(this.normalizeStockData.bind(this));

    } catch (error) {
      console.error('Error fetching market data:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async getSingleStockData(symbol) {
    try {
      const response = await axios.get(
        `${this.baseURL}/real-time/${symbol}`, {
          params: {
            api_token: this.apiKey,
            fmt: 'json'
          }
        }
      );
      return this.normalizeStockData(response.data);
    } catch (error) {
      console.error(`Error fetching ${symbol} data:`, error.message);
      throw error;
    }
  }

  normalizeStockData(data) {
    try {
      const symbol = (data.code || '').replace('.US', '').replace('^', '');
      return {
        symbol,
        code: data.code,
        name: this.getStockName(symbol),
        price: this.getNumericValue(data.close || data.price),
        open: this.getNumericValue(data.open),
        high: this.getNumericValue(data.high),
        low: this.getNumericValue(data.low),
        previousClose: this.getNumericValue(data.previousClose),
        volume: this.getNumericValue(data.volume),
        change: this.getNumericValue(data.change),
        changePercent: this.getNumericValue(data.change_p || data.change_percent),
        timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString()
      };
    } catch (error) {
      console.error('Error normalizing stock data:', error.message);
      return null;
    }
  }

  getNumericValue(value) {
    if (value === null || value === undefined || value === 'NA') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  getStockName(symbol) {
    const names = {
      'SPY': 'S&P 500 ETF',
      'QQQ': 'Nasdaq 100 ETF',
      'DIA': 'Dow Jones ETF',
      'IWM': 'Russell 2000 ETF',
      'VIX': 'Volatility Index',
      'TLT': 'Treasury Bond ETF'
    };
    return names[symbol] || symbol;
  }
  async fetchEODData(symbol, period = '1y') {
    try {
      const response = await axios.get(
        `${this.baseURL}/eod/${symbol}`, {
          params: {
            api_token: this.apiKey,
            fmt: 'json',
            period: period,
            order: 'asc'
          }
        }
      );
      
      return response.data.map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        close: item.close,
        volume: item.volume
      }));
    } catch (error) {
      console.error(`Error fetching EOD data for ${symbol}:`, error.message);
      throw error;
    }
  }
}

export default new EODService();