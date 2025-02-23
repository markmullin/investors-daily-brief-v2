import { marketService } from './apiServices.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

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
    
    const trend1 = this.calculateTrendStrength(recent1);
    const trend2 = this.calculateTrendStrength(recent2);
    
    return {
      primary: trend1,
      secondary: trend2,
      relative: trend1 - trend2,
      interpretation: this.getTrendInterpretation(trend1, trend2)
    };
  },

  analyzeMacroTrends(normalizedDataArray) {
    const recentPeriod = 20;
    const trends = normalizedDataArray.map(data => {
      const recent = data.slice(-recentPeriod);
      return this.calculateTrendStrength(recent);
    });

    return {
      strength: trends,
      interpretation: this.getMacroTrendInterpretation(trends)
    };
  },

  calculateTrendStrength(data) {
    if (!data.length) return 0;
    const prices = data.map(d => d.price);
    const x = Array.from({length: data.length}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * prices[i], 0);
    const sumX2 = x.reduce((a, i) => a + i * i, 0);
    
    const n = data.length;
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  },

  getTrendInterpretation(trend1, trend2) {
    if (trend1 > 1 && trend2 > 1) return "Strong positive correlation";
    if (trend1 < -1 && trend2 < -1) return "Strong negative correlation";
    if (Math.abs(trend1 - trend2) > 1.5) return "Significant divergence";
    return "Neutral relationship";
  },

  getMacroTrendInterpretation(trends) {
    const avgTrend = trends.reduce((a, b) => a + b, 0) / trends.length;
    if (avgTrend > 1) return "Strong positive trend across assets";
    if (avgTrend < -1) return "Strong negative trend across assets";
    return "Mixed trends across assets";
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
        positive: "Semiconductor strength leading software indicates healthy tech demand",
        negative: "Software outperformance suggests defensive positioning",
        threshold: 0.5
      },
      consumer: {
        positive: "Discretionary outperformance indicates strong consumer spending",
        negative: "Staples outperformance suggests defensive consumer positioning",
        threshold: 0.3
      },
      financial: {
        positive: "Financial strength indicates healthy credit conditions",
        negative: "Real estate outperformance suggests yield-seeking behavior",
        threshold: 0.4
      },
      industrial: {
        positive: "Energy outperformance signals strong global demand",
        negative: "Industrial leadership suggests healthy economic growth",
        threshold: 0.45
      },
      momentum: {
        positive: "Equal-weight leadership shows healthy market breadth",
        negative: "Momentum outperformance indicates narrow leadership",
        threshold: 0.35
      },
      style: {
        positive: "Value leadership suggests inflation expectations",
        negative: "Growth outperformance indicates low-rate environment",
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
        positive: "Yield curve steepening suggests economic growth",
        negative: "Yield curve flattening suggests caution",
        threshold: 0.4
      },
      stocksBonds: {
        positive: "Risk-on conditions with healthy credit",
        negative: "Bond outperformance signals risk-off",
        threshold: 0.5
      },
      crypto: {
        positive: "Bitcoin outperformance suggests risk appetite",
        negative: "Gold outperformance indicates flight to safety",
        threshold: 0.6
      },
      inflation: {
        positive: "TIPS outperformance suggests rising inflation",
        negative: "Nominal bond leadership indicates deflation risk",
        threshold: 0.3
      },
      commodities: {
        positive: "Oil strength suggests strong global demand",
        negative: "Dollar strength indicates tighter conditions",
        threshold: 0.45
      },
      global: {
        positive: "Emerging market strength signals global growth",
        negative: "Developed market leadership suggests defensiveness",
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

    const avgTrend = trends.strength.reduce((a, b) => a + b, 0) / trends.strength.length;
    const scoreImpact = avgTrend > analysis.threshold ? 5 :
                       avgTrend < -analysis.threshold ? -5 : 0;

    return {
      scoreImpact,
      interpretation: avgTrend > analysis.threshold ? analysis.positive : analysis.negative,
      trends
    };
  }
};

export default marketRelationships;