import { marketService } from './apiServices.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const technicalAnalysis = {
  async calculateTechnicalFactors(symbol = 'SPY.US') {
    const data = await marketService.getHistoricalData(symbol);
    if (!data.length) return null;

    return {
      movingAverages: this.analyzeMovingAverages(data),
      momentum: this.analyzeMomentum(data),
      breadth: await this.analyzeBreadth(),
      volatility: this.analyzeVolatility(data),
      volume: this.analyzeVolume(data)
    };
  },

  analyzeMovingAverages(data) {
    const currentPrice = data[data.length - 1].price;
    const ma50 = this.calculateMA(data.slice(-50));
    const ma200 = this.calculateMA(data.slice(-200));

    const ma50Trend = this.calculateTrend(data.slice(-50));
    const ma200Trend = this.calculateTrend(data.slice(-200));

    return {
      score: this.scoreMAs(currentPrice, ma50, ma200, ma50Trend, ma200Trend),
      details: {
        priceVsMa50: (currentPrice / ma50 - 1) * 100,
        priceVsMa200: (currentPrice / ma200 - 1) * 100,
        ma50Trend,
        ma200Trend,
        goldenCross: ma50 > ma200,
        deathCross: ma50 < ma200 && ma50Trend < 0
      }
    };
  },

  calculateTrend(data, periods = 20) {
    const prices = data.map(d => d.price);
    const x = Array.from({length: periods}, (_, i) => i);
    const n = periods;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * prices[i], 0);
    const sumXX = x.reduce((a, i) => a + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  },

  scoreMAs(currentPrice, ma50, ma200, ma50Trend, ma200Trend) {
    let score = 50;
    
    // Price vs MAs
    if (currentPrice > ma50 && currentPrice > ma200) score += 15;
    else if (currentPrice > ma50) score += 10;
    else if (currentPrice < ma50 && currentPrice < ma200) score -= 15;
    
    // Trends
    if (ma50Trend > 0 && ma200Trend > 0) score += 15;
    else if (ma50Trend > 0) score += 10;
    else if (ma50Trend < 0 && ma200Trend < 0) score -= 15;
    
    // Golden/Death Cross
    if (ma50 > ma200 && ma50Trend > 0) score += 10;
    else if (ma50 < ma200 && ma50Trend < 0) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  },

  analyzeMomentum(data) {
    const rsi = this.calculateRSI(data);
    const macd = this.calculateMACD(data);
    
    let score = 50;
    
    // RSI scoring
    if (rsi > 70) score += 15;
    else if (rsi < 30) score -= 15;
    
    // MACD scoring
    if (macd.signal > 0 && macd.histogram > 0) score += 15;
    else if (macd.signal < 0 && macd.histogram < 0) score -= 15;
    
    return {
      score: Math.min(100, Math.max(0, score)),
      details: {
        rsi,
        macd
      }
    };
  },

  async analyzeBreadth() {
    try {
      const sectorData = await marketService.getSectorData();
      const advancers = sectorData.filter(s => s.change_p > 0).length;
      const decliners = sectorData.filter(s => s.change_p < 0).length;
      const unchanged = sectorData.length - advancers - decliners;
      
      const advanceDeclineRatio = advancers / (decliners || 1);
      const participation = (advancers + decliners) / sectorData.length;
      
      return {
        score: this.scoreBreadth(advanceDeclineRatio, participation),
        details: {
          advanceDeclineRatio,
          participation,
          advancers,
          decliners,
          unchanged
        }
      };
    } catch (error) {
      console.error('Error analyzing breadth:', error);
      return { score: 50, details: {} };
    }
  },

  scoreBreadth(advanceDeclineRatio, participation) {
    let score = 50;
    
    if (advanceDeclineRatio > 2.5) score += 25;
    else if (advanceDeclineRatio > 2.0) score += 20;
    else if (advanceDeclineRatio > 1.5) score += 15;
    else if (advanceDeclineRatio < 0.5) score -= 15;
    else if (advanceDeclineRatio < 0.75) score -= 10;
    
    if (participation > 0.85) score += 15;
    else if (participation > 0.75) score += 10;
    else if (participation < 0.45) score -= 15;
    else if (participation < 0.55) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  },

  analyzeVolatility(data) {
    const volatility = this.calculateHistoricalVolatility(data);
    const avgVolatility = this.getAverageVolatility(data);
    const volRatio = volatility / avgVolatility;
    
    const recentHighs = data.slice(-20).filter(d => 
      d.price === Math.max(...data.slice(-20).map(x => x.price))
    ).length;
    
    const recentLows = data.slice(-20).filter(d => 
      d.price === Math.min(...data.slice(-20).map(x => x.price))
    ).length;

    return {
      score: this.scoreVolatility(volRatio, recentHighs, recentLows),
      details: {
        currentVolatility: volatility,
        averageVolatility: avgVolatility,
        volatilityRatio: volRatio,
        recentHighs,
        recentLows
      }
    };
  },

  scoreVolatility(volRatio, recentHighs, recentLows) {
    let score = 50;
    
    // Volatility scoring
    if (volRatio < 0.5) score += 20;
    else if (volRatio < 0.8) score += 15;
    else if (volRatio > 2.0) score -= 20;
    else if (volRatio > 1.5) score -= 15;
    
    // Recent highs/lows impact
    if (recentHighs > recentLows) score += 10;
    else if (recentLows > recentHighs) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  },

  analyzeVolume(data) {
    const currentVolume = data[data.length - 1].volume;
    const avgVolume = this.calculateAverageVolume(data);
    const volumeRatio = currentVolume / avgVolume;
    
    const volumeTrend = this.calculateTrend(data.slice(-20).map(d => ({
      price: d.volume
    })));

    return {
      score: this.scoreVolume(volumeRatio, volumeTrend),
      details: {
        currentVolume,
        averageVolume: avgVolume,
        volumeRatio,
        volumeTrend
      }
    };
  },

  scoreVolume(volumeRatio, volumeTrend) {
    let score = 50;
    
    // Volume ratio scoring
    if (volumeRatio > 2.0) score += 20;
    else if (volumeRatio > 1.5) score += 15;
    else if (volumeRatio < 0.5) score -= 20;
    else if (volumeRatio < 0.75) score -= 15;
    
    // Volume trend scoring
    if (volumeTrend > 0) score += 10;
    else if (volumeTrend < 0) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  },

  // Helper calculations
  calculateMA(data) {
    return data.reduce((sum, day) => sum + day.price, 0) / data.length;
  },

  calculateRSI(data, period = 14) {
    const changes = data.slice(-period-1).map((d, i, arr) => 
      i > 0 ? d.price - arr[i-1].price : 0
    ).slice(1);
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.reduce((a, b) => a + b) / period;
    const avgLoss = losses.reduce((a, b) => a + b) / period;
    
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  },

  calculateMACD(data) {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA(
      data.map(d => ({ price: macdLine })),
      9
    );
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  },

  calculateEMA(data, period) {
    const k = 2 / (period + 1);
    let ema = data[0].price;
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].price * k) + (ema * (1 - k));
    }
    
    return ema;
  },

  calculateHistoricalVolatility(data) {
    const returns = data.map((d, i, arr) => 
      i > 0 ? Math.log(d.price / arr[i-1].price) : 0
    ).slice(1);
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  },

  getAverageVolatility(data) {
    const periods = Math.min(data.length, 252);
    const volatilities = [];
    
    for (let i = periods; i < data.length; i++) {
      volatilities.push(this.calculateHistoricalVolatility(data.slice(i - periods, i)));
    }
    
    return volatilities.reduce((a, b) => a + b) / volatilities.length;
  },

  calculateAverageVolume(data) {
    return data.reduce((sum, day) => sum + day.volume, 0) / data.length;
  }
};

export default technicalAnalysis;
