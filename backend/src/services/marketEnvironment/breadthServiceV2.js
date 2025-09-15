/**
 * Market Breadth Service V2 - FIXED
 * Calculates market breadth using actual available data
 */

import fmpService from '../fmpService.js';
import redisService from '../redisService.js';

class BreadthServiceV2 {
  constructor() {
    this.cacheKey = 'market:breadth:v2';
    this.cacheTTL = 900; // 15 minutes
    this.sectors = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLY', 'XLP', 'XLB', 'XLU', 'XLRE', 'XLC'];
  }

  /**
   * Calculate market breadth and trend
   */
  async calculateBreadth() {
    try {
      // Check cache
      const cached = await redisService.get(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      console.log('📈 Calculating market breadth using sector ETFs...');

      // Fetch quotes for all sector ETFs
      const sectorQuotes = await this.fetchSectorQuotes();

      // Calculate breadth metrics
      const breadthMetrics = this.calculateBreadthMetrics(sectorQuotes);

      // Determine trend based on sectors
      const trend = this.calculateTrend(sectorQuotes);

      const result = {
        breadth: breadthMetrics,
        trend: trend,
        sectorDetails: sectorQuotes,
        timestamp: new Date().toISOString()
      };

      // Cache result
      await redisService.set(this.cacheKey, JSON.stringify(result), this.cacheTTL);

      return result;

    } catch (error) {
      console.error('❌ Error calculating breadth:', error);
      return {
        breadth: { 
          percentAbove50MA: 50, 
          advancing: 5,
          declining: 6,
          participation: 50,
          classification: 'NEUTRAL' 
        },
        trend: { 
          direction: 'NEUTRAL', 
          strength: 0 
        },
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch quotes for all sector ETFs
   */
  async fetchSectorQuotes() {
    const results = [];
    
    for (const ticker of this.sectors) {
      try {
        const quote = await fmpService.getQuote(ticker);
        
        if (quote && quote[0]) {
          const q = quote[0];
          results.push({
            ticker,
            name: this.getSectorName(ticker),
            price: q.price,
            change: q.change,
            changePercent: q.changesPercentage,
            yearHigh: q.yearHigh,
            yearLow: q.yearLow,
            // Calculate position in 52-week range as proxy for trend
            positionInRange: ((q.price - q.yearLow) / (q.yearHigh - q.yearLow)) * 100,
            volume: q.volume,
            avgVolume: q.avgVolume,
            volumeRatio: q.volume / q.avgVolume,
            isPositive: q.changesPercentage > 0
          });
        }
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Calculate breadth metrics from sector data
   */
  calculateBreadthMetrics(sectorData) {
    if (sectorData.length === 0) {
      return {
        percentAbove50MA: 50,
        advancing: 0,
        declining: 0,
        participation: 50,
        classification: 'NO_DATA'
      };
    }

    // Count advancing vs declining sectors
    const advancing = sectorData.filter(s => s.isPositive).length;
    const declining = sectorData.filter(s => !s.isPositive).length;
    
    // Use position in 52-week range as proxy for trend strength
    // Sectors above 50% of their range are considered "above MA"
    const aboveMidRange = sectorData.filter(s => s.positionInRange > 50).length;
    const percentAbove = (aboveMidRange / sectorData.length) * 100;
    
    // Calculate participation (advancing / total)
    const participation = Math.round((advancing / sectorData.length) * 100);

    // Classify breadth
    let classification = 'NEUTRAL';
    if (percentAbove > 70) classification = 'STRONG';
    else if (percentAbove > 55) classification = 'POSITIVE';
    else if (percentAbove < 30) classification = 'WEAK';
    else if (percentAbove < 45) classification = 'NEGATIVE';

    return {
      percentAbove50MA: Math.round(percentAbove),
      advancing,
      declining,
      participation,
      classification
    };
  }

  /**
   * Calculate market trend based on sector performance
   */
  calculateTrend(sectorData) {
    if (sectorData.length === 0) {
      return {
        direction: 'UNKNOWN',
        strength: 0
      };
    }

    // Calculate average change across sectors
    const avgChange = sectorData.reduce((sum, s) => sum + s.changePercent, 0) / sectorData.length;
    
    // Calculate average position in range
    const avgPosition = sectorData.reduce((sum, s) => sum + s.positionInRange, 0) / sectorData.length;
    
    // Determine direction
    let direction = 'NEUTRAL';
    if (avgChange > 0.5 && avgPosition > 60) direction = 'STRONG_UP';
    else if (avgChange > 0) direction = 'UP';
    else if (avgChange < -0.5 && avgPosition < 40) direction = 'STRONG_DOWN';
    else if (avgChange < 0) direction = 'DOWN';

    // Calculate strength (0-100)
    const strength = Math.min(100, Math.abs(avgChange) * 20);

    return {
      direction,
      strength: Math.round(strength),
      avgChange: parseFloat(avgChange.toFixed(2)),
      avgPosition: Math.round(avgPosition)
    };
  }

  /**
   * Get sector name from ETF ticker
   */
  getSectorName(ticker) {
    const sectorMap = {
      'XLK': 'Technology',
      'XLF': 'Financials',
      'XLV': 'Healthcare',
      'XLE': 'Energy',
      'XLI': 'Industrials',
      'XLY': 'Consumer Discretionary',
      'XLP': 'Consumer Staples',
      'XLB': 'Materials',
      'XLU': 'Utilities',
      'XLRE': 'Real Estate',
      'XLC': 'Communication Services'
    };
    return sectorMap[ticker] || ticker;
  }
}

export default new BreadthServiceV2();
