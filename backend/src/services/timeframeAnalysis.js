import { marketService } from './apiServices.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const timeframeAnalysis = {
  async getTimeframeData(symbol, period) {
    try {
      const data = await marketService.getHistoricalData(symbol);
      const periodMap = {
        daily: 1,
        weekly: 5,
        monthly: 21,
        quarterly: 63,
        yearly: 252
      };
      
      return data.slice(-periodMap[period]);
    } catch (error) {
      console.error(`Error fetching ${period} data:`, error);
      return [];
    }
  },

  async calculateTimeframeScores(symbol = 'SPY.US') {
    const timeframes = {
      yearly: { weight: 0.50, data: await this.getTimeframeData(symbol, 'yearly') },
      quarterly: { weight: 0.25, data: await this.getTimeframeData(symbol, 'quarterly') },
      monthly: { weight: 0.15, data: await this.getTimeframeData(symbol, 'monthly') },
      weekly: { weight: 0.075, data: await this.getTimeframeData(symbol, 'weekly') },
      daily: { weight: 0.025, data: await this.getTimeframeData(symbol, 'daily') }
    };

    const scores = {};
    for (const [timeframe, info] of Object.entries(timeframes)) {
      scores[timeframe] = {
        price: this.calculatePriceScore(info.data),
        momentum: this.calculateMomentumScore(info.data),
        volatility: this.calculateVolatilityScore(info.data),
        volume: this.calculateVolumeScore(info.data),
        weight: info.weight
      };
    }

    return scores;
  },

  calculatePriceScore(data) {
    if (!data.length) return 50;
    
    const currentPrice = data[data.length - 1].price;
    const startPrice = data[0].price;
    const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
    
    // Calculate moving averages
    const ma50 = this.calculateMA(data.slice(-50));
    const ma200 = this.calculateMA(data.slice(-200));
    
    let score = 50;
    
    // Price trend scoring
    if (priceChange > 20) score += 20;
    else if (priceChange > 10) score += 15;
    else if (priceChange > 5) score += 10;
    else if (priceChange < -20) score -= 20;
    else if (priceChange < -10) score -= 15;
    else if (priceChange < -5) score -= 10;
    
    // Moving average relationship
    if (currentPrice > ma50 && currentPrice > ma200) score += 15;
    else if (currentPrice > ma50) score += 10;
    else if (currentPrice < ma50 && currentPrice < ma200) score -= 15;
    
    return Math.min(100, Math.max(0, score));
  },

  calculateMomentumScore(data) {
    if (!data.length) return 50;
    
    const rsi = this.calculateRSI(data);
    const momentum = this.calculateMomentumIndicator(data);
    
    let score = 50;
    
    // RSI scoring
    if (rsi > 70) score += 10;
    else if (rsi < 30) score -= 10;
    
    // Momentum scoring
    if (momentum > 0.8) score += 20;
    else if (momentum > 0.6) score += 15;
    else if (momentum < 0.2) score -= 20;
    else if (momentum < 0.4) score -= 15;
    
    return Math.min(100, Math.max(0, score));
  },

  calculateVolatilityScore(data) {
    if (!data.length) return 50;
    
    const volatility = this.calculateHistoricalVolatility(data);
    const avgVolatility = this.getAverageVolatility(data);
    
    let score = 50;
    
    if (volatility < avgVolatility * 0.5) score += 20;
    else if (volatility < avgVolatility * 0.8) score += 15;
    else if (volatility > avgVolatility * 2) score -= 20;
    else if (volatility > avgVolatility * 1.5) score -= 15;
    
    return Math.min(100, Math.max(0, score));
  },

  calculateVolumeScore(data) {
    if (!data.length) return 50;
    
    const currentVolume = data[data.length - 1].volume;
    const avgVolume = this.calculateAverageVolume(data);
    const volumeRatio = currentVolume / avgVolume;
    
    let score = 50;
    
    if (volumeRatio > 2.0) score += 20;
    else if (volumeRatio > 1.5) score += 15;
    else if (volumeRatio < 0.5) score -= 20;
    else if (volumeRatio < 0.75) score -= 15;
    
    return Math.min(100, Math.max(0, score));
  },

  // Helper calculations
  calculateMA(data) {
    return data.reduce((sum, day) => sum + day.price, 0) / data.length;
  },

  calculateRSI(data, period = 14) {
    const changes = data.map((d, i, arr) => 
      i > 0 ? d.price - arr[i-1].price : 0
    ).slice(1);
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.reduce((a, b) => a + b) / period;
    const avgLoss = losses.reduce((a, b) => a + b) / period;
    
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  },

  calculateMomentumIndicator(data) {
    const prices = data.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    const lookbackPeriods = [5, 10, 20, 60];
    
    let momentumScore = 0;
    lookbackPeriods.forEach(period => {
      if (prices.length >= period) {
        const pastPrice = prices[prices.length - period];
        momentumScore += (currentPrice > pastPrice) ? 0.25 : 0;
      }
    });
    
    return momentumScore;
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

export default timeframeAnalysis;
