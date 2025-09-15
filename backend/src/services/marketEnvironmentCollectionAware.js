/**
 * Market Environment Collection-Aware Service
 * COMPLETELY REDESIGNED with proper investment logic
 */

import { marketService } from './apiServices.js';
import redisService from './redisService.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

class MarketEnvironmentCollectionAwareService {
  constructor() {
    this.cacheKeys = {
      shortTerm: 'market_environment:short_term_score',
      longTerm: 'market_environment:long_term_score',
      sp500Data: 'market_environment:sp500_analysis',
      collectionStatus: 'market_environment:collection_status'
    };
  }

  /**
   * Main entry point - checks if collection data exists, otherwise uses basic indicators
   */
  async calculateDualScores() {
    const cacheKey = 'dual_market_scores_aware';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log('📊 Checking for S&P 500 collection data...');

      // Check if we have collection data
      const collectionData = await this.getCollectionData();
      
      if (collectionData.hasData) {
        console.log('✅ Using S&P 500 collection data for dual scores');
        return await this.getDualScoresFromCollection(collectionData);
      } else {
        console.log('⚠️ No S&P 500 collection data - using basic market indicators');
        return await this.getDualScoresFromBasicData(collectionData.status);
      }

    } catch (error) {
      console.error('❌ Error in collection-aware scoring:', error);
      return await this.getFallbackScores();
    }
  }

  /**
   * Check for existing collection data
   */
  async getCollectionData() {
    try {
      const [shortTermData, longTermData, sp500Data, collectionStatus] = await Promise.all([
        redisService.get(this.cacheKeys.shortTerm),
        redisService.get(this.cacheKeys.longTerm),
        redisService.get(this.cacheKeys.sp500Data),
        redisService.get(this.cacheKeys.collectionStatus)
      ]);

      const hasData = !!(shortTermData && longTermData && sp500Data);

      return {
        hasData,
        shortTerm: shortTermData,
        longTerm: longTermData,
        sp500: sp500Data,
        status: collectionStatus,
        dataAge: shortTermData ? this.getDataAge(shortTermData.timestamp) : null
      };

    } catch (error) {
      console.error('❌ Error checking collection data:', error);
      return {
        hasData: false,
        status: { status: 'error', message: error.message }
      };
    }
  }

  /**
   * Generate dual scores from S&P 500 collection data (REAL ANALYSIS)
   */
  async getDualScoresFromCollection(collectionData) {
    console.log('🎯 Generating scores from S&P 500 individual stock analysis...');

    const result = {
      shortTerm: {
        score: collectionData.shortTerm.score,
        grade: this.calculateGrade(collectionData.shortTerm.score),
        components: {
          technicalAnalysis: Math.round(collectionData.shortTerm.breadth || 0),
          earningsAcceleration: Math.round(collectionData.shortTerm.average || 0),
          volatilityContrarian: Math.round(collectionData.shortTerm.score)
        },
        analysis: this.generateCollectionShortTermAnalysis(collectionData),
        methodology: 'S&P 500 individual stock technical analysis (60%) + earnings momentum (40%)',
        dataSource: 'sp500_collection',
        companiesAnalyzed: collectionData.shortTerm.companiesAnalyzed || 0
      },
      longTerm: {
        score: collectionData.longTerm.score,
        grade: this.calculateGrade(collectionData.longTerm.score),
        components: {
          valuationContrarian: Math.round(collectionData.longTerm.score),
          longTermTechnicals: Math.round(collectionData.longTerm.breadth || 0),
          fundamentalQuality: Math.round(collectionData.longTerm.average || 0)
        },
        analysis: this.generateCollectionLongTermAnalysis(collectionData),
        methodology: 'S&P 500 individual stock valuation analysis (60%) + fundamental health (40%)',
        dataSource: 'sp500_collection',
        companiesAnalyzed: collectionData.longTerm.companiesAnalyzed || 0
      },
      marketPhase: this.determineMarketPhase(collectionData.shortTerm.score, collectionData.longTerm.score),
      investmentGuidance: this.generateInvestmentGuidance(collectionData.shortTerm.score, collectionData.longTerm.score),
      timestamp: new Date().toISOString(),
      collectionInfo: {
        lastCollection: collectionData.shortTerm.timestamp,
        dataAge: this.getDataAge(collectionData.shortTerm.timestamp),
        companiesAnalyzed: collectionData.shortTerm.companiesAnalyzed,
        dataQuality: collectionData.sp500?.dataQuality || 'unknown'
      }
    };

    cache.set('dual_market_scores_aware', result);
    return result;
  }

  /**
   * Generate dual scores from basic market data (PRE-COLLECTION FALLBACK)
   * COMPLETELY REDESIGNED with proper investment logic
   */
  async getDualScoresFromBasicData(collectionStatus) {
    console.log('📊 Generating INVESTMENT-ORIENTED basic market indicator scores...');

    try {
      // Get basic market data
      const marketData = await this.gatherBasicMarketData();
      
      // Calculate scores with PROPER INVESTMENT LOGIC
      const shortTermScore = await this.calculateInvestmentShortTermScore(marketData);
      const longTermScore = await this.calculateInvestmentLongTermScore(marketData);

      const result = {
        shortTerm: {
          score: shortTermScore.score,
          grade: this.calculateGrade(shortTermScore.score),
          components: shortTermScore.components,
          analysis: shortTermScore.analysis,
          methodology: 'MOMENTUM-BASED: Trend strength + momentum + sector participation',
          dataSource: 'basic_indicators',
          companiesAnalyzed: 0
        },
        longTerm: {
          score: longTermScore.score,
          grade: this.calculateGrade(longTermScore.score),
          components: longTermScore.components,
          analysis: longTermScore.analysis,
          methodology: 'VALUATION-BASED: Market level vs historical + rate environment + valuation proxies',
          dataSource: 'basic_indicators',
          companiesAnalyzed: 0
        },
        marketPhase: this.determineMarketPhase(shortTermScore.score, longTermScore.score),
        investmentGuidance: this.generateInvestmentGuidance(shortTermScore.score, longTermScore.score),
        timestamp: new Date().toISOString(),
        collectionInfo: {
          status: collectionStatus?.status || 'not_run',
          message: collectionStatus?.message || 'S&P 500 collection has not been run yet',
          nextCollection: 'Run POST /api/market-environment/trigger-collection to enable full analysis',
          limitation: 'Using basic market indicators instead of individual S&P 500 stock analysis'
        }
      };

      cache.set('dual_market_scores_aware', result);
      return result;

    } catch (error) {
      console.error('❌ Error calculating basic scores:', error);
      return await this.getFallbackScores();
    }
  }

  /**
   * Gather basic market data for pre-collection analysis
   */
  async gatherBasicMarketData() {
    try {
      const [indices, sectors, bonds] = await Promise.all([
        marketService.getDataForSymbols(['SPY', 'QQQ', 'IWM', 'VIX']),
        marketService.getSectorData(),
        marketService.getDataForSymbols(['TLT', 'SHY'])
      ]);

      const spyHistory = await marketService.getHistoricalData('SPY');

      return { indices, sectors, bonds, spyHistory };
    } catch (error) {
      console.error('❌ Error gathering basic market data:', error);
      return { indices: {}, sectors: [], bonds: {}, spyHistory: [] };
    }
  }

  /**
   * COMPLETELY REDESIGNED: Investment-oriented short-term score (MOMENTUM)
   * High momentum = HIGH score (favorable for short-term trading)
   */
  async calculateInvestmentShortTermScore(marketData) {
    let score = 50; // Base neutral score
    const components = {};

    try {
      const spy = marketData.indices['SPY'];
      
      // 1. TREND STRENGTH (40% weight) - REWARD strong trends
      if (spy && marketData.spyHistory?.length > 200) {
        const ma20 = this.calculateMA(marketData.spyHistory, 20);
        const ma50 = this.calculateMA(marketData.spyHistory, 50);
        const ma200 = this.calculateMA(marketData.spyHistory, 200);
        
        let trendScore = 50;
        
        // REWARD uptrend hierarchy
        if (spy.close > ma20 && ma20 > ma50 && ma50 > ma200) {
          trendScore += 30; // Strong uptrend = EXCELLENT for momentum
        } else if (spy.close > ma20 && spy.close > ma50) {
          trendScore += 20; // Medium uptrend = GOOD for momentum
        } else if (spy.close > ma200) {
          trendScore += 10; // Long-term uptrend = OK for momentum
        } else {
          trendScore -= 20; // Downtrend = BAD for momentum
        }

        // Distance from all-time highs (closer = better for momentum)
        const yearHigh = Math.max(...marketData.spyHistory.slice(-252).map(d => d.close));
        const percentFromHigh = ((spy.close - yearHigh) / yearHigh) * 100;
        
        if (percentFromHigh > -2) {
          trendScore += 20; // Near highs = STRONG momentum
        } else if (percentFromHigh > -5) {
          trendScore += 10; // Close to highs = GOOD momentum
        } else if (percentFromHigh < -15) {
          trendScore -= 15; // Far from highs = WEAK momentum
        }
        
        components.trendStrength = Math.max(0, Math.min(100, trendScore));
        score += (trendScore - 50) * 0.4;
      }

      // 2. VOLATILITY ENVIRONMENT (30% weight) - CONTRARIAN but momentum-friendly
      const vix = marketData.indices['VIX'];
      if (vix) {
        let volatilityScore = 50;
        
        if (vix.close < 15) {
          volatilityScore += 25; // Low fear = EXCELLENT for momentum
        } else if (vix.close < 20) {
          volatilityScore += 15; // Normal volatility = GOOD for momentum
        } else if (vix.close < 30) {
          volatilityScore -= 5; // Elevated fear = OK but cautious
        } else {
          volatilityScore += 10; // Extreme fear = contrarian opportunity
        }
        
        components.volatilityEnvironment = Math.round(volatilityScore);
        score += (volatilityScore - 50) * 0.3;
      }

      // 3. MARKET BREADTH (30% weight) - REWARD participation
      if (marketData.sectors?.length > 0) {
        const positiveSectors = marketData.sectors.filter(s => s.change_p > 0).length;
        const breadthRatio = positiveSectors / marketData.sectors.length;
        
        let breadthScore = 30 + (breadthRatio * 40); // 30-70 range
        
        // BONUS for strong breadth
        if (breadthRatio > 0.8) breadthScore += 20; // Excellent breadth
        else if (breadthRatio > 0.6) breadthScore += 10; // Good breadth
        else if (breadthRatio < 0.3) breadthScore -= 15; // Poor breadth
        
        components.marketBreadth = Math.round(breadthScore);
        score += (breadthScore - 50) * 0.3;
      }

    } catch (error) {
      console.error('❌ Error in investment short-term calculation:', error);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: finalScore,
      components,
      analysis: this.generateShortTermAnalysis(finalScore, components)
    };
  }

  /**
   * COMPLETELY REDESIGNED: Investment-oriented long-term score (VALUATION)
   * High valuations = LOW score (poor for long-term wealth building)
   */
  async calculateInvestmentLongTermScore(marketData) {
    let score = 50; // Base neutral score
    const components = {};

    try {
      const spy = marketData.indices['SPY'];
      
      // 1. VALUATION LEVEL (50% weight) - PENALIZE expensive markets
      if (spy && marketData.spyHistory?.length > 252) {
        const yearHigh = Math.max(...marketData.spyHistory.slice(-252).map(d => d.close));
        const twoYearHigh = Math.max(...marketData.spyHistory.slice(-504).map(d => d.close));
        const percentFromYearHigh = ((spy.close - yearHigh) / yearHigh) * 100;
        
        let valuationScore = 50;
        
        // PENALIZE being near all-time highs (expensive)
        if (percentFromYearHigh > -2) {
          valuationScore -= 30; // Near all-time highs = EXPENSIVE
        } else if (percentFromYearHigh > -5) {
          valuationScore -= 20; // Close to highs = PRICEY
        } else if (percentFromYearHigh > -10) {
          valuationScore -= 10; // Somewhat below highs = FAIR
        } else if (percentFromYearHigh < -20) {
          valuationScore += 20; // Significant pullback = ATTRACTIVE
        }
        
        // Historical context (5+ year perspective)
        const fiveYearHigh = Math.max(...marketData.spyHistory.slice(-1260).map(d => d.close));
        const percentFromFiveYear = ((spy.close - fiveYearHigh) / fiveYearHigh) * 100;
        
        if (percentFromFiveYear > 10) {
          valuationScore -= 15; // Well above 5-year highs = STRETCHED
        }
        
        components.valuationLevel = Math.max(0, Math.min(100, valuationScore));
        score += (valuationScore - 50) * 0.5;
      }

      // 2. INTEREST RATE ENVIRONMENT (30% weight) - Impact on valuations
      const tlt = marketData.bonds['TLT'];
      if (tlt) {
        let rateScore = 50;
        
        // Rising rates = pressure on valuations (bad for long-term)
        if (tlt.change_p < -2) {
          rateScore -= 20; // Rapidly rising rates = VALUATION PRESSURE
        } else if (tlt.change_p < -1) {
          rateScore -= 10; // Rising rates = HEADWIND
        } else if (tlt.change_p > 1) {
          rateScore += 15; // Falling rates = TAILWIND for valuations
        }
        
        components.rateEnvironment = Math.round(rateScore);
        score += (rateScore - 50) * 0.3;
      }

      // 3. LONG-TERM TECHNICAL HEALTH (20% weight)
      if (marketData.spyHistory?.length > 200) {
        const ma200 = this.calculateMA(marketData.spyHistory, 200);
        let ltTechnicalScore = 50;
        
        const percentAbove200 = ((spy.close - ma200) / ma200) * 100;
        
        if (percentAbove200 > 10) {
          ltTechnicalScore -= 10; // Far above 200-day = EXTENDED
        } else if (percentAbove200 > 5) {
          ltTechnicalScore += 5; // Moderately above = OK
        } else if (percentAbove200 > 0) {
          ltTechnicalScore += 15; // Just above = HEALTHY
        } else if (percentAbove200 > -10) {
          ltTechnicalScore += 20; // Slightly below = OPPORTUNITY
        }
        
        components.longTermTechnicals = Math.round(ltTechnicalScore);
        score += (ltTechnicalScore - 50) * 0.2;
      }

    } catch (error) {
      console.error('❌ Error in investment long-term calculation:', error);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: finalScore,
      components,
      analysis: this.generateLongTermAnalysis(finalScore, components)
    };
  }

  /**
   * Generate short-term analysis with investment logic
   */
  generateShortTermAnalysis(score, components) {
    if (score >= 70) {
      return `Strong momentum conditions favor short-term trading strategies. Market trends, low volatility, and broad participation create favorable environment for momentum-based approaches. Current market structure supports near-term positioning.`;
    } else if (score >= 50) {
      return `Mixed momentum signals suggest selective short-term opportunities. While some technical indicators are positive, others show caution. Stock-specific momentum may outperform broad market strategies.`;
    } else {
      return `Weak momentum environment challenges short-term trading strategies. Poor breadth, elevated volatility, or negative trends suggest defensive positioning for short-term horizons. Consider reducing position sizes.`;
    }
  }

  /**
   * Generate long-term analysis with investment logic
   */
  generateLongTermAnalysis(score, components) {
    if (score >= 70) {
      return `Attractive conditions for long-term wealth building. Market pullbacks, reasonable valuations, or supportive rate environment create compelling entry opportunities for patient investors. Focus on quality companies at attractive prices.`;
    } else if (score >= 50) {
      return `Mixed conditions for long-term investing. While some metrics suggest opportunity, others indicate caution. Selective approach focusing on undervalued quality names may be warranted. Dollar-cost averaging could be effective.`;
    } else {
      return `Challenging environment for long-term wealth building. Elevated market levels, expensive valuations, or unfavorable rate environment suggest limited upside for patient investors. Consider defensive positioning and wait for better entry points.`;
    }
  }

  /**
   * Generate analysis for collection-based scores
   */
  generateCollectionShortTermAnalysis(collectionData) {
    const score = collectionData.shortTerm.score;
    const companies = collectionData.shortTerm.companiesAnalyzed || 0;
    
    const baseAnalysis = `Short-term analysis of ${companies} S&P 500 companies shows ${this.getScoreDescription(score)} momentum conditions. `;
    
    if (score >= 70) {
      return baseAnalysis + `Strong technical indicators and earnings acceleration across the majority of analyzed companies suggest favorable near-term market dynamics for momentum strategies.`;
    } else if (score >= 50) {
      return baseAnalysis + `Mixed technical and momentum signals across S&P 500 companies indicate selective opportunities with increased importance of individual stock selection.`;
    } else {
      return baseAnalysis + `Weak technical momentum and earnings deceleration across S&P 500 companies suggest defensive positioning may be warranted for short-term strategies.`;
    }
  }

  generateCollectionLongTermAnalysis(collectionData) {
    const score = collectionData.longTerm.score;
    const companies = collectionData.longTerm.companiesAnalyzed || 0;
    
    const baseAnalysis = `Long-term analysis of ${companies} S&P 500 companies shows ${this.getScoreDescription(score)} valuation and fundamental conditions. `;
    
    if (score >= 70) {
      return baseAnalysis + `Attractive valuations and strong fundamental health across the majority of analyzed companies support long-term wealth building strategies.`;
    } else if (score >= 50) {
      return baseAnalysis + `Mixed valuation and fundamental signals across S&P 500 companies suggest selective long-term investing with focus on quality at reasonable prices.`;
    } else {
      return baseAnalysis + `Elevated valuations and mixed fundamentals across S&P 500 companies warrant caution for long-term capital allocation. Wait for better entry opportunities.`;
    }
  }

  /**
   * Fallback scores for error conditions
   */
  async getFallbackScores() {
    return {
      shortTerm: {
        score: 75,
        grade: 'B+',
        analysis: 'Markets showing strong momentum at high levels - favorable for short-term strategies. Analysis temporarily unavailable.',
        methodology: 'Error fallback with realistic estimates',
        dataSource: 'fallback'
      },
      longTerm: {
        score: 35,
        grade: 'D+', 
        analysis: 'Expensive market valuations challenge long-term wealth building. Analysis temporarily unavailable.',
        methodology: 'Error fallback with realistic estimates',
        dataSource: 'fallback'
      },
      marketPhase: 'Late Cycle Bull Market',
      investmentGuidance: {
        action: 'Mixed Signals - Data Unavailable',
        timeframe: 'Good momentum, expensive valuations',
        allocation: 'Moderate equity allocation with quality focus'
      },
      timestamp: new Date().toISOString(),
      error: true
    };
  }

  // Keep all the existing helper methods but update market phase logic
  determineMarketPhase(shortTermScore, longTermScore) {
    if (shortTermScore >= 70 && longTermScore >= 70) return 'Early Bull Market';
    if (shortTermScore >= 70 && longTermScore < 40) return 'Late Bull Market';
    if (shortTermScore < 40 && longTermScore >= 70) return 'Bear Market Bottom';
    if (shortTermScore < 40 && longTermScore < 40) return 'Bear Market';
    if (shortTermScore >= 60 && longTermScore >= 60) return 'Steady Bull Market';
    return 'Mixed Conditions';
  }

  generateInvestmentGuidance(shortTermScore, longTermScore) {
    // New logic: Consider both scores separately
    if (shortTermScore >= 70 && longTermScore >= 60) {
      return {
        action: 'Aggressive Growth Strategy',
        timeframe: 'Both momentum and valuations favorable',
        riskLevel: 'Moderate-High Risk',
        allocation: 'Consider 80-90% equity allocation'
      };
    } else if (shortTermScore >= 70 && longTermScore < 40) {
      return {
        action: 'Momentum Trading Strategy',
        timeframe: 'Good for short-term, expensive for long-term',
        riskLevel: 'High Risk',
        allocation: 'Focus on momentum trades, avoid buy-and-hold'
      };
    } else if (shortTermScore < 40 && longTermScore >= 60) {
      return {
        action: 'Value Accumulation Strategy',
        timeframe: 'Poor momentum but attractive valuations',
        riskLevel: 'Low-Moderate Risk',
        allocation: 'Dollar-cost average into quality names'
      };
    } else if (shortTermScore < 40 && longTermScore < 40) {
      return {
        action: 'Capital Preservation',
        timeframe: 'Both momentum and valuations unfavorable',
        riskLevel: 'Very High Risk',
        allocation: 'Consider 20-30% equity allocation'
      };
    } else {
      return {
        action: 'Balanced Approach',
        timeframe: 'Mixed signals suggest balanced strategy',
        riskLevel: 'Moderate Risk',
        allocation: 'Maintain 60-70% equity allocation'
      };
    }
  }

  // Helper methods remain the same
  getDataAge(timestamp) {
    if (!timestamp) return null;
    const age = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(age / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Recently updated';
  }

  getScoreDescription(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'favorable';
    if (score >= 60) return 'moderately positive';
    if (score >= 50) return 'neutral';
    if (score >= 40) return 'cautious';
    if (score >= 30) return 'challenging';
    return 'unfavorable';
  }

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

export default new MarketEnvironmentCollectionAwareService();
