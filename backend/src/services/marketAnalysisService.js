// backend/src/services/marketAnalysisService.js
import axios from 'axios';
import { marketService } from './apiServices.js';
import { SP500_COMPONENTS } from '../data/sp500Components.js';

class MarketAnalysisService {
  async getNewsForSymbol(symbol) {
    try {
      const response = await axios.get(`https://eodhd.com/api/news`, {
        params: {
          s: symbol,
          api_token: process.env.EOD_API_KEY,
          limit: 1,
          offset: 0
        }
      });

      if (response.data && response.data.length > 0) {
        return response.data[0].title;
      }
      return null;
    } catch (error) {
      console.error('Error fetching news:', error);
      return null;
    }
  }

  async getTopMover() {
    try {
      // Get quotes for all SP500 components at once
      const quotes = await marketService.getDataForSymbols(SP500_COMPONENTS);
      console.log('Raw quotes data:', quotes);  // Add this log
      
      if (!quotes) {
        console.log('No quotes data received');
        return null;
      }

      // Convert to array and find biggest mover
      const movingStocks = Object.entries(quotes)
        .map(([symbol, data]) => ({
          symbol,
          price: data.close,
          changePercent: data.change_p || 0
        }))
        .filter(stock => 
          stock.price && 
          stock.changePercent && 
          !isNaN(stock.changePercent) && 
          Math.abs(stock.changePercent) > 0.1  // Only include stocks with significant moves
        )
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

      console.log('Processed moving stocks:', movingStocks);  // Add this log

      if (!movingStocks.length) {
        console.log('No valid movers found');
        return null;
      }

      const topMover = movingStocks[0];
      console.log('Selected top mover:', topMover);  // Add this log

      // Calculate daily change
      const dailyChange = (topMover.price * topMover.changePercent / 100);

      // Get historical data
      const history = await marketService.getHistoricalData(topMover.symbol);
      
      const result = {
        symbol: topMover.symbol,
        price: topMover.price,
        changePercent: topMover.changePercent,
        dailyChange: dailyChange,
        change: dailyChange,
        reason: `${topMover.symbol} moved ${Math.abs(topMover.changePercent).toFixed(2)}% today`,
        history: history || []
      };

      console.log('Returning mover data:', result);  // Add this log
      return result;

    } catch (error) {
      console.error('Error in getTopMover:', error);
      return null;
    }
  }
}

export default new MarketAnalysisService();