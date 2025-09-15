/**
 * Sentiment Service V2
 * Analyzes market sentiment using VIX from FRED and other indicators
 * Calculates fear/greed components
 */

import fredService from '../fredService.js';
import fmpService from '../fmpService.js';
import redisService from '../redisService.js';

class SentimentServiceV2 {
  constructor() {
    this.cacheKey = 'market:sentiment:v2';
    this.cacheTTL = 900; // 15 minutes
    this.vixSeriesId = 'VIXCLS'; // CBOE Volatility Index from FRED
  }

  /**
   * Main method to analyze market sentiment
   */
  async analyzeSentiment() {
    try {
      // Check cache
      const cached = await redisService.get(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      console.log('😱 Analyzing market sentiment...');

      // Get VIX data from FRED
      const vixData = await this.getVIXData();

      // Get additional sentiment indicators
      const additionalIndicators = await this.getAdditionalIndicators();

      // Calculate fear/greed score
      const fearGreedScore = this.calculateFearGreedScore(vixData, additionalIndicators);

      const result = {
        vix: vixData.current,
        vixPercentile: vixData.percentile,
        vixZone: vixData.zone,
        vixTrend: vixData.trend,
        fearGreedScore: fearGreedScore.score,
        fearGreedZone: fearGreedScore.zone,
        components: {
          vix: fearGreedScore.components.vix,
          momentum: fearGreedScore.components.momentum,
          volumeRatio: fearGreedScore.components.volume,
          highLow: fearGreedScore.components.highLow
        },
        additionalIndicators,
        timestamp: new Date().toISOString()
      };

      // Cache result
      await redisService.set(this.cacheKey, JSON.stringify(result), this.cacheTTL);

      return result;

    } catch (error) {
      console.error('❌ Error analyzing sentiment:', error);
      return {
        vix: 20,
        vixPercentile: 50,
        vixZone: 'UNKNOWN',
        fearGreedScore: 50,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get VIX data from FRED
   */
  async getVIXData() {
    try {
      // Get VIX data using getSeriesData method
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const vixHistory = await fredService.getSeriesData(
        this.vixSeriesId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (!vixHistory || vixHistory.length === 0) {
        throw new Error('Unable to fetch VIX data from FRED');
      }

      // Get the most recent value
      const vixCurrent = vixHistory[vixHistory.length - 1];
      const currentValue = parseFloat(vixCurrent.value);
      const historicalValues = vixHistory
        .map(d => parseFloat(d.value))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);

      // Calculate percentile
      const percentile = this.calculatePercentile(historicalValues, currentValue);

      // Calculate trend (current vs 20-day average)
      const recent20Days = vixHistory.slice(-20).map(d => parseFloat(d.value));
      const avg20Day = recent20Days.reduce((a, b) => a + b, 0) / recent20Days.length;
      const trend = currentValue > avg20Day ? 'RISING' : currentValue < avg20Day ? 'FALLING' : 'STABLE';

      // Determine VIX zone
      const zone = this.getVIXZone(currentValue);

      return {
        current: currentValue,
        percentile: Math.round(percentile),
        zone,
        trend,
        average20Day: avg20Day.toFixed(2),
        yearHigh: Math.max(...historicalValues),
        yearLow: Math.min(...historicalValues)
      };

    } catch (error) {
      console.error('Error fetching VIX data:', error);
      // Fallback to FMP if FRED fails
      return await this.getVIXFromFMP();
    }
  }

  /**
   * Fallback method to get VIX from FMP
   */
  async getVIXFromFMP() {
    try {
      const vixQuote = await fmpService.getQuote('VIX');
      if (vixQuote && vixQuote.length > 0) {
        const current = vixQuote[0].price;
        return {
          current,
          percentile: 50, // Default percentile
          zone: this.getVIXZone(current),
          trend: vixQuote[0].change > 0 ? 'RISING' : 'FALLING'
        };
      }
    } catch (error) {
      console.error('Error fetching VIX from FMP:', error);
    }
    
    // Ultimate fallback
    return {
      current: 20,
      percentile: 50,
      zone: 'NORMAL',
      trend: 'UNKNOWN'
    };
  }

  /**
   * Get additional sentiment indicators
   */
  async getAdditionalIndicators() {
    try {
      const indicators = {};

      // Get Put/Call ratio if available
      // Note: FMP doesn't provide put/call ratio directly, so we approximate
      
      // Get market momentum (SPY performance)
      const spyData = await fmpService.getQuote('SPY');
      if (spyData && spyData.length > 0) {
        indicators.marketMomentum = {
          day1: spyData[0].changesPercentage,
          day5: await this.get5DayReturn('SPY'),
          day20: await this.get20DayReturn('SPY')
        };
      }

      // Get high/low ratio (approximated using market internals)
      const [advances, declines] = await this.getMarketInternals();
      indicators.advanceDecline = {
        advances,
        declines,
        ratio: advances / (declines || 1)
      };

      // Get volume analysis
      if (spyData && spyData.length > 0) {
        indicators.volumeAnalysis = {
          current: spyData[0].volume,
          average: spyData[0].avgVolume,
          ratio: spyData[0].volume / spyData[0].avgVolume
        };
      }

      return indicators;

    } catch (error) {
      console.error('Error getting additional indicators:', error);
      return {};
    }
  }

  /**
   * Calculate Fear & Greed Score
   */
  calculateFearGreedScore(vixData, indicators) {
    let totalScore = 0;
    let componentCount = 0;
    const components = {};

    // VIX Component (inverted - high VIX = fear)
    if (vixData && vixData.current) {
      const vixScore = this.vixToFearGreed(vixData.current);
      components.vix = vixScore;
      totalScore += vixScore;
      componentCount++;
    }

    // Momentum Component
    if (indicators.marketMomentum) {
      const momentumScore = this.momentumToFearGreed(indicators.marketMomentum.day20 || 0);
      components.momentum = momentumScore;
      totalScore += momentumScore;
      componentCount++;
    }

    // Volume Component
    if (indicators.volumeAnalysis) {
      const volumeScore = this.volumeToFearGreed(indicators.volumeAnalysis.ratio || 1);
      components.volume = volumeScore;
      totalScore += volumeScore;
      componentCount++;
    }

    // Advance/Decline Component
    if (indicators.advanceDecline) {
      const adScore = this.advanceDeclineToFearGreed(indicators.advanceDecline.ratio || 1);
      components.highLow = adScore;
      totalScore += adScore;
      componentCount++;
    }

    // Calculate average score
    const finalScore = componentCount > 0 ? Math.round(totalScore / componentCount) : 50;

    // Determine zone
    let zone;
    if (finalScore >= 75) zone = 'EXTREME_GREED';
    else if (finalScore >= 60) zone = 'GREED';
    else if (finalScore >= 40) zone = 'NEUTRAL';
    else if (finalScore >= 25) zone = 'FEAR';
    else zone = 'EXTREME_FEAR';

    return {
      score: finalScore,
      zone,
      components
    };
  }

  /**
   * Convert VIX to Fear/Greed score (0-100)
   */
  vixToFearGreed(vix) {
    // VIX ranges: <12 = extreme greed, 12-20 = normal, 20-30 = fear, >30 = extreme fear
    // Invert for fear/greed (high VIX = low score = fear)
    if (vix < 12) return 90;
    if (vix < 15) return 75;
    if (vix < 20) return 50;
    if (vix < 25) return 35;
    if (vix < 30) return 20;
    if (vix < 40) return 10;
    return 5;
  }

  /**
   * Convert momentum to Fear/Greed score
   */
  momentumToFearGreed(momentum) {
    // 20-day momentum: >5% = greed, <-5% = fear
    if (momentum > 5) return Math.min(90, 50 + momentum * 4);
    if (momentum > 0) return 50 + momentum * 5;
    if (momentum > -5) return 50 + momentum * 5;
    return Math.max(10, 50 + momentum * 4);
  }

  /**
   * Convert volume ratio to Fear/Greed score
   */
  volumeToFearGreed(ratio) {
    // High volume on down days = fear, on up days = greed
    // For simplicity, neutral volume = neutral sentiment
    if (ratio > 1.5) return 30; // High volume often = volatility/fear
    if (ratio > 1.2) return 40;
    if (ratio > 0.8) return 50;
    return 60; // Low volume = complacency/greed
  }

  /**
   * Convert advance/decline to Fear/Greed score
   */
  advanceDeclineToFearGreed(ratio) {
    // >2 = greed, <0.5 = fear
    if (ratio > 2) return 75;
    if (ratio > 1.5) return 65;
    if (ratio > 1) return 55;
    if (ratio > 0.5) return 35;
    return 20;
  }

  /**
   * Get VIX zone classification
   */
  getVIXZone(vix) {
    if (vix < 12) return 'COMPLACENCY';
    if (vix < 20) return 'NORMAL';
    if (vix < 30) return 'ELEVATED';
    if (vix < 40) return 'HIGH_FEAR';
    return 'PANIC';
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(sortedValues, value) {
    let count = 0;
    for (const v of sortedValues) {
      if (v < value) count++;
      else break;
    }
    return (count / sortedValues.length) * 100;
  }

  /**
   * Get 5-day return for a ticker
   */
  async get5DayReturn(ticker) {
    try {
      const history = await fmpService.getHistoricalPrice(ticker, { limit: 6 });
      if (history && history.length >= 6) {
        return ((history[0].close - history[5].close) / history[5].close) * 100;
      }
    } catch (error) {
      console.error(`Error getting 5-day return for ${ticker}:`, error);
    }
    return 0;
  }

  /**
   * Get 20-day return for a ticker
   */
  async get20DayReturn(ticker) {
    try {
      const history = await fmpService.getHistoricalPrice(ticker, { limit: 21 });
      if (history && history.length >= 21) {
        return ((history[0].close - history[20].close) / history[20].close) * 100;
      }
    } catch (error) {
      console.error(`Error getting 20-day return for ${ticker}:`, error);
    }
    return 0;
  }

  /**
   * Get market internals (advances/declines)
   * Using sector ETFs as proxy
   */
  async getMarketInternals() {
    try {
      const sectors = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLY', 'XLP', 'XLB', 'XLU', 'XLRE', 'XLC'];
      const quotes = await Promise.all(
        sectors.slice(0, 5).map(ticker => fmpService.getQuote(ticker))
      );
      
      let advances = 0;
      let declines = 0;
      
      quotes.forEach(quote => {
        if (quote && quote[0]) {
          if (quote[0].change > 0) advances++;
          else if (quote[0].change < 0) declines++;
        }
      });
      
      // Scale up to approximate market
      return [advances * 100, declines * 100];
      
    } catch (error) {
      console.error('Error getting market internals:', error);
      return [250, 250]; // Default 50/50
    }
  }
}

export default new SentimentServiceV2();
