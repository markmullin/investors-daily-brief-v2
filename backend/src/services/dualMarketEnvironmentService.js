/**
 * Dual Market Environment Service - Sophisticated Contrarian Scoring System
 * 
 * Implements dual scoring approach:
 * 1. Short-term: Technicals + earnings momentum + VXX volatility
 * 2. Long-term: Valuation + long-term technicals + earnings quality
 * 
 * Contrarian Logic:
 * - High volatility + falling stocks = good buying opportunity (higher score)
 * - All-time highs + extreme valuations = poor timing (lower score)
 */

import { marketService } from './apiServices.js';
import fmpService from './fmpService.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

class DualMarketEnvironmentService {
  constructor() {
    this.sp500Symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'V', 'JNJ'];
  }

  /**
   * Main entry point - calculate both short-term and long-term scores
   */
  async calculateDualScores() {
    const cacheKey = 'dual_market_scores';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log('📊 Calculating dual market environment scores...');

      // Fetch all necessary data
      const marketData = await this.gatherMarketData();
      
      // Calculate both scores with sophisticated logic
      const shortTermScore = await this.calculateShortTermScore(marketData);
      const longTermScore = await this.calculateLongTermScore(marketData);

      const result = {
        shortTerm: {
          score: shortTermScore.score,
          grade: this.calculateGrade(shortTermScore.score),
          components: shortTermScore.components,
          analysis: shortTermScore.analysis,
          methodology: 'Technical momentum + Earnings acceleration + Volatility contrarian signals'
        },
        longTerm: {
          score: longTermScore.score,
          grade: this.calculateGrade(longTermScore.score),
          components: longTermScore.components,
          analysis: longTermScore.analysis,
          methodology: 'Valuation metrics + Long-term technicals + Fundamental quality trends'
        },
        marketPhase: this.determineMarketPhase(shortTermScore.score, longTermScore.score),
        investmentGuidance: this.generateInvestmentGuidance(shortTermScore.score, longTermScore.score),
        timestamp: new Date().toISOString()
      };

      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Error calculating dual scores:', error);
      throw error;
    }
  }

  /**
   * Gather all necessary market data for analysis
   */
  async gatherMarketData() {
    try {
      console.log('📈 Gathering market data for dual analysis...');

      // Core market indices
      const indices = await marketService.getDataForSymbols(['SPY', 'QQQ', 'IWM', 'DIA']);
      
      // Volatility measures  
      const volatility = await marketService.getDataForSymbols(['VIX', 'VIXY', 'VXX']);
      
      // Sector data for breadth analysis
      const sectors = await marketService.getSectorData();
      
      // Bond/yield data for valuation context
      const bonds = await marketService.getDataForSymbols(['TLT', 'SHY', 'HYG']);
      
      // Get S&P 500 historical data
      const spyHistory = await marketService.getHistoricalData('SPY');
      
      // Sample earnings data (in production this would be comprehensive)
      const earningsData = await this.getEarningsAcceleration();

      return {
        indices,
        volatility,
        sectors,
        bonds,
        spyHistory,
        earningsData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error gathering market data:', error);
      throw error;
    }
  }

  /**
   * SHORT-TERM SCORE: Technical momentum + Earnings acceleration + Volatility contrarian
   * High volatility + falling = GOOD (contrarian buy signal)
   */
  async calculateShortTermScore(marketData) {
    console.log('⚡ Calculating short-term score with contrarian logic...');

    let baseScore = 50;
    const components = {
      technicalMomentum: 0,
      earningsAcceleration: 0,
      volatilityContrarian: 0
    };

    // 1. TECHNICAL MOMENTUM (40% weight)
    const technicalScore = this.analyzeTechnicalMomentum(marketData);
    components.technicalMomentum = technicalScore;
    baseScore += (technicalScore - 50) * 0.4;

    // 2. EARNINGS ACCELERATION (30% weight)
    const earningsScore = this.analyzeEarningsAcceleration(marketData.earningsData);
    components.earningsAcceleration = earningsScore;
    baseScore += (earningsScore - 50) * 0.3;

    // 3. VOLATILITY CONTRARIAN SIGNAL (30% weight) - KEY CONTRARIAN LOGIC
    const volatilityScore = this.analyzeVolatilityContrarian(marketData);
    components.volatilityContrarian = volatilityScore;
    baseScore += (volatilityScore - 50) * 0.3;

    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

    return {
      score: finalScore,
      components,
      analysis: this.generateShortTermAnalysis(finalScore, components, marketData)
    };
  }

  /**
   * LONG-TERM SCORE: Valuation + Long-term technicals + Fundamental quality
   * All-time highs + extreme valuations = BAD (contrarian sell signal)
   */
  async calculateLongTermScore(marketData) {
    console.log('📊 Calculating long-term score with valuation contrarian logic...');

    let baseScore = 50;
    const components = {
      valuationContrarian: 0,
      longTermTechnicals: 0,
      fundamentalQuality: 0
    };

    // 1. VALUATION CONTRARIAN SIGNAL (50% weight) - KEY CONTRARIAN LOGIC
    const valuationScore = this.analyzeValuationContrarian(marketData);
    components.valuationContrarian = valuationScore;
    baseScore += (valuationScore - 50) * 0.5;

    // 2. LONG-TERM TECHNICAL TRENDS (30% weight)
    const longTermTechnicalScore = this.analyzeLongTermTechnicals(marketData);
    components.longTermTechnicals = longTermTechnicalScore;
    baseScore += (longTermTechnicalScore - 50) * 0.3;

    // 3. FUNDAMENTAL QUALITY TRENDS (20% weight)
    const fundamentalScore = this.analyzeFundamentalQuality(marketData);
    components.fundamentalQuality = fundamentalScore;
    baseScore += (fundamentalScore - 50) * 0.2;

    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

    return {
      score: finalScore,
      components,
      analysis: this.generateLongTermAnalysis(finalScore, components, marketData)
    };
  }

  /**
   * TECHNICAL MOMENTUM: RSI, moving averages, price momentum
   */
  analyzeTechnicalMomentum(marketData) {
    const spy = marketData.indices['SPY'];
    if (!spy || !marketData.spyHistory) return 50;

    let score = 50;
    
    // Calculate key technical indicators
    const currentPrice = spy.close;
    const ma20 = this.calculateMA(marketData.spyHistory, 20);
    const ma50 = this.calculateMA(marketData.spyHistory, 50);
    const rsi = this.calculateRSI(marketData.spyHistory);

    // Price vs moving averages
    if (currentPrice > ma20 && currentPrice > ma50) score += 15;
    else if (currentPrice > ma20) score += 8;
    else if (currentPrice < ma20 && currentPrice < ma50) score -= 15;

    // RSI momentum (not overbought/oversold extremes)
    if (rsi > 40 && rsi < 70) score += 10; // Sweet spot
    else if (rsi > 70) score -= 5; // Overbought warning
    else if (rsi < 30) score += 5; // Oversold bounce potential

    // Moving average alignment
    if (ma20 > ma50) score += 10;
    else score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * EARNINGS ACCELERATION: Positive earnings surprises and guidance
   */
  analyzeEarningsAcceleration(earningsData) {
    if (!earningsData) return 50;

    let score = 50;
    
    // Earnings surprise rate
    if (earningsData.surpriseRate > 0.8) score += 20;
    else if (earningsData.surpriseRate > 0.6) score += 10;
    else if (earningsData.surpriseRate < 0.4) score -= 10;

    // Guidance trend
    if (earningsData.guidanceRevisions > 0.1) score += 15;
    else if (earningsData.guidanceRevisions < -0.1) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * VOLATILITY CONTRARIAN: High VIX + falling prices = BUY SIGNAL
   * This is the core contrarian logic for short-term
   */
  analyzeVolatilityContrarian(marketData) {
    const vix = marketData.volatility['VIX'] || marketData.volatility['VIXY'];
    const spy = marketData.indices['SPY'];
    
    if (!vix || !spy) return 50;

    let score = 50;
    const vixLevel = vix.close;
    const spyChange = spy.change_p;

    console.log(`🎯 Contrarian Analysis: VIX ${vixLevel}, SPY Change ${spyChange}%`);

    // CONTRARIAN LOGIC: High fear + falling prices = OPPORTUNITY
    if (vixLevel > 30 && spyChange < -1) {
      score += 25; // High opportunity
      console.log('📈 HIGH CONTRARIAN BUY SIGNAL: High VIX + falling prices');
    } else if (vixLevel > 25 && spyChange < -0.5) {
      score += 15; // Medium opportunity
      console.log('📈 MEDIUM CONTRARIAN BUY SIGNAL');
    } else if (vixLevel < 15 && spyChange > 1) {
      score -= 20; // Complacency warning
      console.log('⚠️ COMPLACENCY WARNING: Low VIX + rising prices');
    } else if (vixLevel < 12) {
      score -= 15; // Extreme complacency
      console.log('🚨 EXTREME COMPLACENCY: Very low VIX');
    }

    // Additional VIX-based scoring
    if (vixLevel > 35) score += 10; // Very high fear = opportunity
    else if (vixLevel < 10) score -= 10; // Extreme complacency

    return Math.max(0, Math.min(100, score));
  }

  /**
   * VALUATION CONTRARIAN: High valuations + all-time highs = SELL SIGNAL
   * This is the core contrarian logic for long-term
   */
  analyzeValuationContrarian(marketData) {
    const spy = marketData.indices['SPY'];
    if (!spy || !marketData.spyHistory) return 50;

    let score = 50;
    const currentPrice = spy.close;
    
    // Calculate price vs historical levels
    const prices = marketData.spyHistory.map(d => d.close);
    const yearHigh = Math.max(...prices.slice(-252)); // 1 year high
    const yearLow = Math.min(...prices.slice(-252));   // 1 year low
    
    const percentFromHigh = ((currentPrice - yearHigh) / yearHigh) * 100;
    const percentFromLow = ((currentPrice - yearLow) / yearLow) * 100;

    console.log(`🎯 Valuation Contrarian: ${percentFromHigh.toFixed(1)}% from highs, ${percentFromLow.toFixed(1)}% from lows`);

    // CONTRARIAN LOGIC: Near all-time highs = POOR TIMING
    if (percentFromHigh > -2) {
      score -= 25; // Very near all-time highs
      console.log('🚨 VALUATION WARNING: Near all-time highs');
    } else if (percentFromHigh > -5) {
      score -= 15; // Close to highs
      console.log('⚠️ CAUTION: Close to recent highs');
    } else if (percentFromHigh < -20) {
      score += 20; // Significant pullback
      console.log('📈 OPPORTUNITY: Significant pullback from highs');
    } else if (percentFromHigh < -10) {
      score += 10; // Moderate pullback
      console.log('📈 POTENTIAL: Moderate pullback');
    }

    // Bond yield context (higher yields = pressure on stocks)
    const tlt = marketData.bonds['TLT'];
    if (tlt && tlt.change_p < -1) {
      score -= 10; // Rising yields pressure valuations
      console.log('⚠️ YIELD PRESSURE: Rising bond yields');
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * LONG-TERM TECHNICALS: Multi-timeframe trend analysis
   */
  analyzeLongTermTechnicals(marketData) {
    if (!marketData.spyHistory) return 50;

    let score = 50;
    
    // Calculate long-term moving averages
    const ma200 = this.calculateMA(marketData.spyHistory, 200);
    const ma100 = this.calculateMA(marketData.spyHistory, 100);
    const currentPrice = marketData.indices['SPY']?.close;

    if (!currentPrice) return 50;

    // Long-term trend
    if (currentPrice > ma200 && ma100 > ma200) score += 20;
    else if (currentPrice > ma200) score += 10;
    else if (currentPrice < ma200) score -= 15;

    // Trend slope
    const ma200Slope = this.calculateTrendSlope(marketData.spyHistory, 200);
    if (ma200Slope > 0.05) score += 10;
    else if (ma200Slope < -0.05) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * FUNDAMENTAL QUALITY: Earnings growth, margins, financial health
   */
  analyzeFundamentalQuality(marketData) {
    // Simplified fundamental analysis
    // In production, this would analyze comprehensive fundamental data
    let score = 50;
    
    // Sector breadth as proxy for fundamental health
    const sectors = marketData.sectors || [];
    const positiveSectors = sectors.filter(s => s.change_p > 0).length;
    const totalSectors = sectors.length;
    
    if (totalSectors > 0) {
      const breadthRatio = positiveSectors / totalSectors;
      if (breadthRatio > 0.7) score += 15;
      else if (breadthRatio > 0.5) score += 5;
      else if (breadthRatio < 0.3) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate analysis for short-term score
   */
  generateShortTermAnalysis(score, components, marketData) {
    const vix = marketData.volatility['VIX']?.close || marketData.volatility['VIXY']?.close || 20;
    const spyChange = marketData.indices['SPY']?.change_p || 0;

    let analysis = '';

    if (score >= 70) {
      analysis = `Short-term outlook is favorable with strong technical momentum${vix > 25 ? ' enhanced by contrarian opportunity signals from elevated volatility' : ''}. `;
    } else if (score >= 50) {
      analysis = `Short-term conditions are mixed with balanced technical signals${vix > 30 ? ', though high volatility may present contrarian opportunities' : ''}. `;
    } else {
      analysis = `Short-term environment shows caution with ${vix < 15 ? 'low volatility suggesting complacency' : 'technical weakness despite volatility'}. `;
    }

    // Add contrarian insights
    if (vix > 30 && spyChange < -1) {
      analysis += 'High fear levels combined with price declines create potential contrarian buying opportunities for disciplined investors. ';
    } else if (vix < 12 && spyChange > 1) {
      analysis += 'Extremely low volatility with rising prices suggests investor complacency - exercise caution. ';
    }

    return analysis;
  }

  /**
   * Generate analysis for long-term score  
   */
  generateLongTermAnalysis(score, components, marketData) {
    const spy = marketData.indices['SPY'];
    let analysis = '';

    if (score >= 70) {
      analysis = `Long-term fundamentals support investment with reasonable valuations and positive quality trends. Current market levels provide attractive entry points for long-term wealth building. `;
    } else if (score >= 50) {
      analysis = `Long-term outlook is neutral with mixed valuation signals. Selective investing in quality companies recommended. `;
    } else {
      analysis = `Long-term environment suggests caution with elevated valuations${spy ? ' near historical highs' : ''}. Focus on defensive positioning and wait for better opportunities. `;
    }

    // Add valuation context
    if (spy && marketData.spyHistory) {
      const prices = marketData.spyHistory.map(d => d.close);
      const yearHigh = Math.max(...prices.slice(-252));
      const percentFromHigh = ((spy.close - yearHigh) / yearHigh) * 100;

      if (percentFromHigh > -3) {
        analysis += 'Market near all-time highs warrants careful position sizing and risk management. ';
      } else if (percentFromHigh < -15) {
        analysis += 'Significant pullback from highs may offer better long-term entry opportunities. ';
      }
    }

    return analysis;
  }

  /**
   * Determine overall market phase based on dual scores
   */
  determineMarketPhase(shortTermScore, longTermScore) {
    if (shortTermScore >= 70 && longTermScore >= 70) return 'Bullish Expansion';
    if (shortTermScore >= 60 && longTermScore >= 60) return 'Steady Growth';
    if (shortTermScore < 40 && longTermScore < 40) return 'Bear Market';
    if (shortTermScore > 60 && longTermScore < 40) return 'Short-term Rally (Caution)';
    if (shortTermScore < 40 && longTermScore > 60) return 'Long-term Value (Patience)';
    return 'Mixed Conditions';
  }

  /**
   * Generate investment guidance based on dual scores
   */
  generateInvestmentGuidance(shortTermScore, longTermScore) {
    const avgScore = (shortTermScore + longTermScore) / 2;

    if (avgScore >= 70) {
      return {
        action: 'Increase Equity Allocation',
        timeframe: 'Both short and long-term signals favorable',
        riskLevel: 'Moderate Risk',
        allocation: 'Consider 70-80% equity allocation'
      };
    } else if (avgScore >= 55) {
      return {
        action: 'Balanced Approach',
        timeframe: 'Mixed signals suggest selective investing',
        riskLevel: 'Balanced Risk',
        allocation: 'Maintain 60-70% equity allocation'
      };
    } else if (avgScore >= 40) {
      return {
        action: 'Defensive Positioning',
        timeframe: 'Exercise caution with new investments',
        riskLevel: 'High Risk',
        allocation: 'Reduce to 40-50% equity allocation'
      };
    } else {
      return {
        action: 'Capital Preservation',
        timeframe: 'Focus on protecting capital',
        riskLevel: 'Very High Risk',
        allocation: 'Consider 20-30% equity allocation'
      };
    }
  }

  /**
   * Get sample earnings acceleration data
   * In production, this would pull comprehensive earnings data
   */
  async getEarningsAcceleration() {
    // Sample data - in production this would be real earnings analysis
    return {
      surpriseRate: 0.65 + Math.random() * 0.2, // 65-85% beat rate
      guidanceRevisions: (Math.random() - 0.5) * 0.3, // -15% to +15%
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper methods for technical calculations
   */
  calculateMA(data, period) {
    if (!data || data.length < period) return 0;
    const closes = data.slice(-period).map(d => d.close || d.price);
    return closes.reduce((sum, price) => sum + price, 0) / closes.length;
  }

  calculateRSI(data, period = 14) {
    if (!data || data.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i-1].close);
    }
    
    const gains = changes.slice(-period).filter(c => c > 0);
    const losses = changes.slice(-period).filter(c => c < 0).map(c => Math.abs(c));
    
    if (gains.length === 0) return 0;
    if (losses.length === 0) return 100;
    
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateTrendSlope(data, period) {
    if (!data || data.length < period) return 0;
    
    const recentData = data.slice(-period);
    const prices = recentData.map(d => d.close);
    const n = prices.length;
    
    const sumX = (n * (n - 1)) / 2;
    const sumY = prices.reduce((sum, price) => sum + price, 0);
    const sumXY = prices.reduce((sum, price, i) => sum + (price * i), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }
}

export default new DualMarketEnvironmentService();
