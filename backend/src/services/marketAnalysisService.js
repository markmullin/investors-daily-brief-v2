import { eodService, marketService } from './apiServices.js';

class MarketAnalysisService {
  async getTopMover() {
    try {
      const sp500Data = await eodService.getSP500Components();
      const quotes = await Promise.all(
        sp500Data.slice(0, 100).map(symbol => eodService.getRealTimeQuote(symbol))
      );

      // Filter valid quotes and sort by absolute change
      const validQuotes = quotes
        .filter(quote => quote && quote.change_p)
        .sort((a, b) => Math.abs(b.change_p) - Math.abs(a.change_p));

      if (!validQuotes.length) return null;

      const topMover = validQuotes[0];
      const history = await eodService.getHistoricalData(topMover.symbol);

      return {
        symbol: topMover.symbol,
        price: topMover.close,
        changePercent: topMover.change_p,
        reason: `Significant price movement of ${Math.abs(topMover.change_p).toFixed(2)}%`,
        history: history.map(item => ({
          ...item,
          price: item.price,
          ma200: this.calculate200MA(history, history.indexOf(item))
        }))
      };
    } catch (error) {
      console.error('Error getting top mover:', error);
      return null;
    }
  }

  calculate200MA(data, currentIndex) {
    const startIndex = Math.max(0, currentIndex - 199);
    const slice = data.slice(startIndex, currentIndex + 1);
    const sum = slice.reduce((acc, item) => acc + item.price, 0);
    return sum / slice.length;
  }
}

export default new MarketAnalysisService();