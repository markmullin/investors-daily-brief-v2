/**
 * Market Phase Service V2 - SIMPLIFIED
 * Detects market phase using only available FMP methods
 */

import fmpService from '../fmpService.js';
import redisService from '../redisService.js';

class MarketPhaseServiceV2 {
  constructor() {
    this.cacheKey = 'market:phase:v2';
    this.cacheTTL = 900; // 15 minutes
  }

  /**
   * Main method to detect current market phase
   * SIMPLIFIED: Uses only quote data and basic calculations
   */
  async detectPhase() {
    try {
      // Check cache first
      const cached = await redisService.get(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      console.log('📊 Detecting market phase from S&P 500 index (^GSPC)...');

      // Get actual S&P 500 index data (^GSPC)
      const currentData = await fmpService.getQuote('^GSPC');

      if (!currentData || !currentData[0]) {
        throw new Error('Unable to fetch S&P 500 data');
      }

      const quote = currentData[0];
      const current = quote.price;
      const yearHigh = quote.yearHigh;
      const yearLow = quote.yearLow;
      const change = quote.changesPercentage;

      // Calculate position within 52-week range
      const range = yearHigh - yearLow;
      const positionInRange = ((current - yearLow) / range) * 100;

      // Simple phase detection based on available data
      let phase = 'UNKNOWN';
      let confidence = 0;
      let message = '';

      if (!yearHigh || !yearLow) {
        phase = 'DATA_UNAVAILABLE';
        message = 'Insufficient data for phase detection';
      } else {
        // Determine phase based on position in 52-week range
        const fromHigh = ((yearHigh - current) / yearHigh) * 100;
        const fromLow = ((current - yearLow) / yearLow) * 100;

        if (fromHigh < 3) {
          // Within 3% of 52-week high
          phase = 'STRONG_BULL';
          confidence = 85;
          message = `Market near 52-week highs (${fromHigh.toFixed(1)}% below peak)`;
        } else if (fromHigh < 10) {
          // Within 10% of high
          phase = 'BULL';
          confidence = 75;
          message = `Uptrend intact (${fromHigh.toFixed(1)}% from highs)`;
        } else if (fromHigh < 20) {
          // 10-20% from high
          phase = 'CONSOLIDATION';
          confidence = 70;
          message = `Market consolidating (${fromHigh.toFixed(1)}% from highs)`;
        } else if (fromHigh < 30) {
          // 20-30% from high
          phase = 'CORRECTION';
          confidence = 75;
          message = `Market in correction (${fromHigh.toFixed(1)}% from highs)`;
        } else {
          // More than 30% from high
          phase = 'BEAR';
          confidence = 80;
          message = `Bear market conditions (${fromHigh.toFixed(1)}% from highs)`;
        }
      }

      // Build phase analysis
      const phaseAnalysis = {
        phase,
        confidence,
        message,
        data: {
          currentPrice: current,
          yearHigh,
          yearLow,
          percentFromHigh: ((yearHigh - current) / yearHigh) * 100,
          percentFromLow: ((current - yearLow) / yearLow) * 100,
          positionInRange,
          dayChange: change
        },
        signals: this.generateSignals(phase, positionInRange, change),
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await redisService.set(this.cacheKey, JSON.stringify(phaseAnalysis), this.cacheTTL);

      return phaseAnalysis;

    } catch (error) {
      console.error('❌ Error detecting market phase:', error);
      
      // Return error state
      return {
        phase: 'DATA_UNAVAILABLE',
        confidence: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate market signals based on phase
   */
  generateSignals(phase, positionInRange, dayChange) {
    const signals = [];

    // Phase-based signals
    switch (phase) {
      case 'STRONG_BULL':
        signals.push('Strong uptrend - Growth stocks favored');
        signals.push('Low volatility environment');
        if (dayChange > 0) signals.push('Momentum continuing');
        break;
      case 'BULL':
        signals.push('Healthy uptrend in place');
        signals.push('Buy-the-dip opportunities');
        break;
      case 'CONSOLIDATION':
        signals.push('Market taking a breather');
        signals.push('Sector rotation likely');
        signals.push('Wait for direction');
        break;
      case 'CORRECTION':
        signals.push('Increased volatility expected');
        signals.push('Quality stocks on sale');
        signals.push('Consider defensive positions');
        break;
      case 'BEAR':
        signals.push('Risk-off environment');
        signals.push('Capital preservation priority');
        signals.push('Look for oversold bounces');
        break;
    }

    // Position-based signals
    if (positionInRange > 80) {
      signals.push('Near resistance levels');
    } else if (positionInRange < 20) {
      signals.push('Near support levels');
    }

    // Momentum signals
    if (dayChange > 1) {
      signals.push('Strong daily momentum');
    } else if (dayChange < -1) {
      signals.push('Selling pressure today');
    }

    return signals;
  }
}

export default new MarketPhaseServiceV2();
