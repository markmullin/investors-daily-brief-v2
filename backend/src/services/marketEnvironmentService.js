import { marketService } from './apiServices.js';
import braveService from './braveService.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

// Add these new functions to marketEnvironmentService.js

const marketRelationships = {
  async analyzeMarketRelationships() {
    try {
      // Get industry relationships data
      const industryData = await this.getIndustryRelationships();
      const macroData = await this.getMacroRelationships();
      
      return {
        industry: this.scoreIndustryRelationships(industryData),
        macro: this.scoreMacroRelationships(macroData)
      };
    } catch (error) {
      console.error('Error analyzing market relationships:', error);
      return {
        industry: { score: 50, details: {} },
        macro: { score: 50, details: {} }
      };
    }
  },

  async getIndustryRelationships() {
    try {
      const pairs = {
        tech: ['SMH.US', 'XSW.US'],
        consumer: ['XLP.US', 'XLY.US'],
        financial: ['XLF.US', 'XLRE.US'],
        industrial: ['XLE.US', 'XLI.US'],
        momentum: ['MTUM.US', 'RSP.US'],
        style: ['IVE.US', 'IVW.US']
      };

      const data = {};
      for (const [key, symbols] of Object.entries(pairs)) {
        const [sym1, sym2] = symbols;
        const performance = await Promise.all([
          marketService.getHistoricalData(sym1),
          marketService.getHistoricalData(sym2)
        ]);
        
        data[key] = {
          symbols,
          performance: this.calculateRelativePerformance(performance[0], performance[1])
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching industry relationships:', error);
      return {};
    }
  },

  async getMacroRelationships() {
    try {
      const relationships = {
        yields: ['SHY.US', 'IEF.US', 'TLT.US'],
        stocksBonds: ['SPY.US', 'BND.US', 'JNK.US'],
        crypto: ['IBIT.US', 'GLD.US'],
        inflation: ['TIPS.US', 'TLT.US'],
        commodities: ['USO.US', 'UUP.US'],
        global: ['EEM.US', 'EFA.US', 'UUP.US']
      };

      const data = {};
      for (const [key, symbols] of Object.entries(relationships)) {
        const performanceData = await Promise.all(
          symbols.map(sym => marketService.getHistoricalData(sym))
        );
        
        data[key] = {
          symbols,
          performance: this.calculateMacroPerformance(performanceData)
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching macro relationships:', error);
      return {};
    }
  },

  calculateRelativePerformance(data1, data2) {
    // Calculate relative performance between two assets
    const normalize = (data) => {
      const startPrice = data[0].price;
      return data.map(d => ({
        date: d.date,
        price: (d.price / startPrice - 1) * 100
      }));
    };

    const norm1 = normalize(data1);
    const norm2 = normalize(data2);
    
    return {
      relative: norm1.map((d, i) => ({
        date: d.date,
        spread: d.price - (norm2[i] ? norm2[i].price : 0)
      })),
      trend: this.analyzeTrend(norm1, norm2)
    };
  },

  calculateMacroPerformance(dataArray) {
    // Calculate relative performance for multiple assets
    const normalized = dataArray.map(data => {
      const startPrice = data[0].price;
      return data.map(d => ({
        date: d.date,
        price: (d.price / startPrice - 1) * 100
      }));
    });

    return {
      relative: normalized[0].map((d, i) => ({
        date: d.date,
        values: dataArray.map((_, j) => 
          normalized[j][i] ? normalized[j][i].price : null
        )
      })),
      trends: this.analyzeMacroTrends(normalized)
    };
  },

  analyzeTrend(data1, data2) {
    const recentPeriod = 20; // Last month of trading
    const recent1 = data1.slice(-recentPeriod);
    const recent2 = data2.slice(-recentPeriod);
    
    const trend1 = technicalAnalysis.calculateTrend(recent1);
    const trend2 = technicalAnalysis.calculateTrend(recent2);
    
    return {
      primary: trend1,
      secondary: trend2,
      relative: trend1 - trend2
    };
  },

  analyzeMacroTrends(normalizedDataArray) {
    const recentPeriod = 20;
    return normalizedDataArray.map(data => {
      const recent = data.slice(-recentPeriod);
      return technicalAnalysis.calculateTrend(recent);
    });
  },

  scoreIndustryRelationships(data) {
    let score = 50;
    const details = {};

    // Score each relationship
    for (const [key, relationship] of Object.entries(data)) {
      const trend = relationship.performance.trend;
      const analysis = this.analyzeIndustryRelationship(key, trend);
      
      score += analysis.scoreImpact;
      details[key] = analysis;
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      details
    };
  },

  scoreMacroRelationships(data) {
    let score = 50;
    const details = {};

    // Score each macro relationship
    for (const [key, relationship] of Object.entries(data)) {
      const trends = relationship.performance.trends;
      const analysis = this.analyzeMacroRelationship(key, trends);
      
      score += analysis.scoreImpact;
      details[key] = analysis;
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      details
    };
  },

  analyzeIndustryRelationship(key, trend) {
    const analyses = {
      tech: {
        positive: 'Semiconductor strength leading software indicates healthy tech demand and early-cycle growth',
        negative: 'Software outperformance over semiconductors suggests defensive positioning and late-cycle behavior',
        threshold: 0.5
      },
      consumer: {
        positive: 'Discretionary outperformance indicates strong consumer spending and economic confidence',
        negative: 'Staples outperformance suggests defensive consumer positioning and economic concerns',
        threshold: 0.3
      },
      financial: {
        positive: 'Financial sector leading real estate suggests healthy credit conditions and rising rate environment',
        negative: 'Real estate outperformance over financials indicates yield-seeking behavior and growth concerns',
        threshold: 0.4
      },
      industrial: {
        positive: 'Energy outperformance over industrials signals strong global demand and potential inflationary pressures',
        negative: 'Industrial leadership over energy suggests healthy economic growth without commodity constraints',
        threshold: 0.45
      },
      momentum: {
        positive: 'Equal-weight leadership shows healthy market breadth and early-cycle characteristics',
        negative: 'Momentum outperformance indicates narrow market leadership and potential late-cycle behavior',
        threshold: 0.35
      },
      style: {
        positive: 'Value leadership suggests rising rates environment and inflation expectations',
        negative: 'Growth outperformance indicates low-rate environment and growth scarcity premium',
        threshold: 0.4
      }
    };

    const analysis = analyses[key];
    if (!analysis) {
        return {
            scoreImpact: 0,
            interpretation: 'Relationship analysis not available',
            trend: trend.relative
        };
    }

    const scoreImpact = trend.relative > analysis.threshold ? 5 :
                       trend.relative < -analysis.threshold ? -5 : 0;

    return {
      scoreImpact,
      interpretation: trend.relative > analysis.threshold ? analysis.positive : analysis.negative,
      trend: trend.relative
    };
  },

  analyzeMacroRelationship(key, trends) {
    const analyses = {
      yields: {
        positive: 'Yield curve steepening suggests economic growth expectations and healthy financial conditions',
        negative: 'Yield curve flattening/inversion warns of potential economic slowdown and monetary policy concerns',
        threshold: 0.4
      },
      stocksBonds: {
        positive: 'Strong stock performance vs bonds indicates risk appetite, while stable credit (JNK) suggests healthy conditions',
        negative: 'Bond outperformance and widening credit spreads (JNK weakness) signal risk-off environment',
        threshold: 0.5
      },
      crypto: {
        positive: 'Bitcoin outperformance vs gold suggests risk appetite and technological adoption',
        negative: 'Gold outperformance over Bitcoin indicates flight to traditional safe havens and risk aversion',
        threshold: 0.6
      },
      inflation: {
        positive: 'TIPS outperformance suggests rising inflation expectations and economic growth',
        negative: 'Nominal bond (TLT) leadership indicates deflation concerns or flight to safety',
        threshold: 0.3
      },
      commodities: {
        positive: 'Oil strength vs dollar suggests strong global demand and potential inflationary pressures',
        negative: 'Dollar strength vs oil indicates tighter financial conditions and potential demand concerns',
        threshold: 0.45
      },
      global: {
        positive: 'Emerging market strength vs developed markets signals global growth and risk appetite',
        negative: 'Developed market and dollar strength suggests defensive positioning and growth concerns',
        threshold: 0.5
      }
    };

    const analysis = analyses[key];
    if (!analysis) {
        return {
            scoreImpact: 0,
            interpretation: 'Relationship analysis not available',
            trends
        };
    }

    const averageTrend = trends.reduce((a, b) => a + b, 0) / trends.length;
    const scoreImpact = averageTrend > analysis.threshold ? 5 :
                       averageTrend < -analysis.threshold ? -5 : 0;

    return {
      scoreImpact,
      interpretation: averageTrend > analysis.threshold ? analysis.positive : analysis.negative,
      trends
    };
  }
};

// Add these new functions to marketEnvironmentService.js

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
    const ma50 = timeframeAnalysis.calculateMA(data.slice(-50));
    const ma200 = timeframeAnalysis.calculateMA(data.slice(-200));

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
    const prices = data.slice(-periods).map(d => d.price);
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
    const volatility = timeframeAnalysis.calculateHistoricalVolatility(data);
    const avgVolatility = timeframeAnalysis.getAverageVolatility(data);
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
    const avgVolume = timeframeAnalysis.calculateAverageVolume(data);
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
  }
};

// Add these new functions to marketEnvironmentService.js

// New helper functions for timeframe analysis
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

const marketEnvironmentService = {
  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 63) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 57) return 'D+';
    if (score >= 53) return 'D';
    if (score >= 50) return 'D-';
    return 'F';
  },

  async calculateMarketScore() {
    const cacheKey = 'market_environment_score';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Fetch all data first
        const marketData = await marketService.getData();
        const sectorData = await marketService.getSectorData();
        const vixData = await marketService.getDataForSymbols(['VIXY']);
        
        // Calculate scores with the same data
        const technicalScore = await this.calculateTechnicalScore(marketData, vixData);
        const breadthScore = await this.calculateBreadthScore(sectorData);
        const sentimentScore = await this.calculateSentimentScore(vixData);

        // Round scores before weighting to ensure consistency
        const normalizedScores = {
            technical: Math.round(technicalScore),
            breadth: Math.round(breadthScore),
            sentiment: Math.round(sentimentScore)
        };

        const weights = {
            technical: 0.4,
            breadth: 0.3,
            sentiment: 0.3
        };

        // Calculate weighted scores
        const weightedScores = {
            technical: Math.round(normalizedScores.technical * weights.technical),
            breadth: Math.round(normalizedScores.breadth * weights.breadth),
            sentiment: Math.round(normalizedScores.sentiment * weights.sentiment)
        };

        // Calculate final score with fixed precision
        const finalScore = Math.round(
            normalizedScores.technical * weights.technical +
            normalizedScores.breadth * weights.breadth +
            normalizedScores.sentiment * weights.sentiment
        );

        // Prepare detailed result - using normalizedScores instead of raw scores
        const result = {
            overallScore: finalScore,
            grade: this.calculateGrade(finalScore),
            components: {
                technical: normalizedScores.technical,
                technicalGrade: this.calculateGrade(normalizedScores.technical),
                technicalWeight: weights.technical,
                technicalWeightedScore: weightedScores.technical,
                
                breadth: normalizedScores.breadth,
                breadthGrade: this.calculateGrade(normalizedScores.breadth),
                breadthWeight: weights.breadth,
                breadthWeightedScore: weightedScores.breadth,
                
                sentiment: normalizedScores.sentiment,
                sentimentGrade: this.calculateGrade(normalizedScores.sentiment),
                sentimentWeight: weights.sentiment,
                sentimentWeightedScore: weightedScores.sentiment
            },
            analysis: this.generateAnalysis(finalScore, normalizedScores),
            timestamp: Date.now()
        };

        // Cache the result
        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error calculating market environment:', error);
        throw error;
    }
},

  async calculateTechnicalScore(marketData) {
    const spyData = marketData['SPY.US'];
    if (!spyData) return 50;

    let score = 75;

    const history = await marketService.getHistoricalData('SPY.US');
    const ma50 = this.calculateMA(history, 50);
    const ma200 = this.calculateMA(history, 200);
    
    if (spyData.close > ma50) score += 15;
    if (spyData.close > ma200) score += 15;

    const rsi = this.calculateRSI(history);
    if (rsi > 70) score -= 10;
    else if (rsi < 30) score += 10;
    
    const vix = await marketService.getDataForSymbols(['VIXY']);
    if (vix.VIXY?.close < 35) score += 25;
    else if (vix.VIXY?.close < 40) score += 20;
    else if (vix.VIXY?.close < 45) score += 15;
    else if (vix.VIXY?.close > 60) score -= 15;
    else if (vix.VIXY?.close > 50) score -= 10;

    return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
  },

  async calculateBreadthScore(sectorData) {
    let score = 75;
    
    const breadthMetrics = this.analyzeBreadth(sectorData);
    
    const advDeclineRatio = breadthMetrics.advanceDecline;
    if (advDeclineRatio > 2.5) score += 25;
    else if (advDeclineRatio > 2.0) score += 20;
    else if (advDeclineRatio > 1.5) score += 15;
    else if (advDeclineRatio < 0.5) score -= 15;
    else if (advDeclineRatio < 0.75) score -= 10;
    
    const participation = breadthMetrics.participation;
    if (participation > 0.85) score += 25;
    else if (participation > 0.75) score += 20;
    else if (participation > 0.65) score += 15;
    else if (participation < 0.45) score -= 15;
    else if (participation < 0.55) score -= 10;
    
    const rotationStrength = breadthMetrics.strength;
    const breadthThrust = breadthMetrics.breadthThrust;
    
    if (rotationStrength > 4 && breadthThrust > 0.8) score += 25;
    else if (rotationStrength > 2 && breadthThrust > 0.6) score += 20;
    else if (rotationStrength > 0 && breadthThrust > 0.5) score += 15;
    else if (rotationStrength < -2 || breadthThrust < 0.3) score -= 15;

    return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
  },

  // In backend/src/services/marketEnvironmentService.js
// Find this function:
// In marketEnvironmentService.js - Update this specific method
async calculateSentimentScore() {
  try {
      let score = 75; // Base score
      
      // Get VIX data
      try {
          const vixData = await marketService.getDataForSymbols(['VIXY']);
          const vixy = vixData.VIXY?.close || 20;
          
          if (vixy < 35) score += 15;
          else if (vixy < 40) score += 10;
          else if (vixy < 45) score += 5;
          else if (vixy > 60) score -= 15;
          else if (vixy > 50) score -= 10;
      } catch (vixError) {
          console.warn('Error fetching VIX data:', vixError);
      }

      // Get sentiment data
      try {
          const symbols = ['SPY', 'QQQ', 'IWM'];
          const sentiments = await Promise.all(
              symbols.map(async sym => {
                  try {
                      return await braveService.getMarketSentiment(sym);
                  } catch (error) {
                      console.warn(`Error fetching sentiment for ${sym}:`, error);
                      return { sentiment: 0.5 };
                  }
              })
          );

          const validSentiments = sentiments.filter(s => s && typeof s.sentiment === 'number');
          
          if (validSentiments.length > 0) {
              const avgSentiment = validSentiments.reduce((acc, s) => acc + s.sentiment, 0) / validSentiments.length;
              
              if (avgSentiment > 0.8) score += 25;
              else if (avgSentiment > 0.6) score += 15;
              else if (avgSentiment > 0.4) score += 5;
              else if (avgSentiment < 0.2) score -= 25;
              else if (avgSentiment < 0.4) score -= 15;
          }
      } catch (sentimentError) {
          console.warn('Error in sentiment analysis:', sentimentError);
      }

      return Math.round(Math.max(0, Math.min(100, score)));
  } catch (error) {
      console.error('Error in calculateSentimentScore:', error);
      return 50; // Default neutral score
  }
},

  calculateMA(data, period) {
    return data.slice(-period).reduce((sum, day) => sum + day.price, 0) / period;
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

  analyzeBreadth(sectorData) {
    const advancing = sectorData.filter(s => s.change_p > 0);
    const declining = sectorData.filter(s => s.change_p < 0);
    const strong = sectorData.filter(s => s.change_p > 1);
    const weak = sectorData.filter(s => s.change_p < -1);

    return {
      advanceDecline: advancing.length / Math.max(1, declining.length),
      participation: (advancing.length + declining.length) / sectorData.length,
      strength: strong.length - weak.length,
      breadthThrust: advancing.length / sectorData.length
    };
  },

  generateAnalysis(score, components) {
    const { technical, breadth, sentiment } = components;
    const marketPhase = this.determineMarketPhase(components);
    const riskLevel = this.assessRiskLevel(components);

    const basic = `Market Overview: ${this.getMarketConditionNatural(score)}

Our analysis shows the market is in a ${marketPhase} phase. Here's what this means:

Technical Analysis: ${this.getTechnicalInsightBasic(technical)}

Market Health: ${this.getBreadthInsightBasic(breadth)}

Investor Sentiment: ${this.getSentimentInsightBasic(sentiment)}

Risk Level: ${this.getRiskInsightBasic(riskLevel)}

Bottom Line: ${this.generateBasicOutlook(score)}`;

    const advanced = `Market Analysis (${new Date().toLocaleDateString()}):

The market is exhibiting ${this.getMarketConditionNatural(score)} with the following key metrics:

Technical Framework: ${this.getTechnicalInsightAdvanced(technical)}

Market Internals: ${this.getBreadthInsightAdvanced(breadth)}

Sentiment Analysis: ${this.getSentimentInsightAdvanced(sentiment)}

Current Phase: ${marketPhase} with ${riskLevel} risk levels.
${this.getRiskInsightAdvanced(riskLevel)}

Strategic Outlook: ${this.generateAdvancedOutlook(technical, breadth, sentiment)}`;

    return { basic, advanced };
  },

  getMarketConditionNatural(score) {
    if (score >= 80) return "remarkably strong conditions";
    if (score >= 60) return "generally positive conditions";
    if (score >= 40) return "mixed but stable conditions";
    if (score >= 20) return "challenging conditions";
    return "significantly stressed conditions";
  },

  getTechnicalInsightBasic(score) {
    if (score >= 70) return "Price trends are showing strong upward momentum, with most indicators suggesting healthy buying interest.";
    if (score >= 50) return "Price trends are positive but showing some mixed signals, suggesting steady but cautious progress.";
    if (score >= 30) return "Price trends are showing some weakness, suggesting a more careful approach may be needed.";
    return "Price trends are showing concerning signs of weakness, suggesting defensive positioning may be appropriate.";
  },

  getTechnicalInsightAdvanced(score) {
    if (score >= 70) return "Technical framework exhibits robust momentum across multiple timeframes with constructive price action.";
    if (score >= 50) return "Price structure maintains positive trajectory with key technical levels holding support.";
    if (score >= 30) return "Technical configuration showing deterioration with key support levels under pressure.";
    return "Technical framework has weakened considerably with multiple support breaches.";
  },

  getBreadthInsightBasic(score) {
    if (score >= 70) return "Most stocks are participating in the market's movement, showing broad-based strength.";
    if (score >= 50) return "Market participation is reasonably healthy, though some sectors are stronger than others.";
    if (score >= 30) return "Fewer stocks are participating in market moves, suggesting increasing selectivity is needed.";
    return "Market participation has become very narrow, with only a small group of stocks showing strength.";
  },

  getBreadthInsightAdvanced(score) {
    if (score >= 70) return "Market internals exhibit robust breadth confirmation with strong advance-decline metrics.";
    if (score >= 50) return "Breadth metrics maintain constructive configuration despite some divergences.";
    if (score >= 30) return "Internal metrics showing notable deterioration across key breadth indicators.";
    return "Breadth measures indicate significant internal weakness with sustained distribution patterns.";
  },

  getSentimentInsightBasic(score) {
    if (score >= 70) return "Investors are showing confidence without excessive optimism.";
    if (score >= 50) return "Investor sentiment is balanced, suggesting room for further gains.";
    if (score >= 30) return "Investors are showing caution, which can create opportunities.";
    return "Investor sentiment is very negative, which historically can signal potential turning points.";
  },

  getSentimentInsightAdvanced(score) {
    if (score >= 70) return "Sentiment metrics indicate strong institutional conviction without extreme readings.";
    if (score >= 50) return "Sentiment configuration remains constructive with balanced positioning.";
    if (score >= 30) return "Sentiment indicators reflect increasing risk aversion with defensive positioning.";
    return "Sentiment measures approach historical extremes suggesting potential capitulation levels.";
  },

  getRiskInsightBasic(riskLevel) {
    switch(riskLevel) {
      case "below-average": return "Market conditions suggest lower than normal risk.";
      case "moderate": return "Risk levels are normal for current market conditions.";
      case "elevated": return "Markets are showing higher than normal risk levels.";
      case "high": return "Risk levels are significantly elevated.";
      default: return "Risk levels are within normal ranges.";
    }
  },

  getRiskInsightAdvanced(riskLevel) {
    switch(riskLevel) {
      case "below-average": return "Risk metrics indicate favorable risk/reward dynamics.";
      case "moderate": return "Risk parameters align with historical norms.";
      case "elevated": return "Risk metrics suggest deteriorating market dynamics.";
      case "high": return "Risk measures indicate significant deviation from historical norms.";
      default: return "Risk parameters remain within standard deviation bands.";
    }
  },

  generateBasicOutlook(score) {
    if (score >= 80) return "Current conditions strongly support maintaining market exposure while watching risk levels.";
    if (score >= 60) return "The environment supports measured investment while keeping some defensive positions.";
    if (score >= 40) return "A balanced approach between growth and defensive positions is warranted.";
    if (score >= 20) return "Focus on high-quality positions and consider increased defensive allocations.";
    return "Capital preservation should be the primary focus.";
  },

  generateAdvancedOutlook(technical, breadth, sentiment) {
    let outlook = "";
    if (technical > 70) {
      outlook += "Technical configuration supports maintaining tactical exposure. ";
    } else if (technical < 30) {
      outlook += "Technical deterioration warrants defensive positioning. ";
    }
    
    if (breadth > 70) {
      outlook += "Broad participation supports market resilience. ";
    } else if (breadth < 30) {
      outlook += "Narrow participation suggests selective exposure. ";
    }
    
    if (sentiment > 70) {
      outlook += "Monitor sentiment extremes for potential shifts.";
    } else if (sentiment < 30) {
      outlook += "Sentiment extremes may present contrarian opportunities.";
    }
    
    return outlook;
  },

  determineMarketPhase(components) {
    const { technical, breadth, sentiment } = components;
    
    if (technical > 80 && breadth > 70) return "strong expansion";
    if (technical > 60 && breadth > 50) return "steady growth";
    if (technical < 40 && breadth < 40) return "contraction";
    if (technical < 30 && sentiment < 30) return "risk-off";
    if (sentiment > 70 && technical < 50) return "recovery";
    return "consolidation";
  },

  assessRiskLevel(components) {
    const { technical, breadth, sentiment } = components;
    const avgScore = (technical + breadth + sentiment) / 3;
    
    if (avgScore > 80) return "below-average";
    if (avgScore > 60) return "moderate";
    if (avgScore < 40) return "elevated";
    if (avgScore < 30) return "high";
    return "normal";
  }
};

export { marketRelationships };
export default marketEnvironmentService;