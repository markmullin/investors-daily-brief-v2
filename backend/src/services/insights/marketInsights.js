import NodeCache from 'node-cache';
import marketEnvironmentService from '../marketEnvironmentService.js';
import relationshipScoring from '../relationshipScoring.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const marketInsights = {
  async generateMarketInsights() {
    try {
      const [relationships, environmentData] = await Promise.all([
        marketEnvironmentService.analyzeMarketRelationships(),
        marketEnvironmentService.calculateMarketScore()
      ]);

      const relationshipScores = relationshipScoring.calculateRelationshipScores(relationships);
      
      return {
        industry: this.generateIndustryInsights(relationships.industry, relationshipScores.industry),
        macro: this.generateMacroInsights(relationships.macro, relationshipScores.macro),
        environment: this.generateEnvironmentInsights(environmentData),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error generating market insights:', error);
      throw error;
    }
  },

  generateIndustryInsights(industryData, scores) {
    const insights = {};
    
    // Process each industry relationship
    for (const [key, data] of Object.entries(industryData)) {
      insights[key] = {
        score: scores.details[key]?.score || 50,
        trend: this.analyzeTrend(data.performance.relative),
        correlation: this.analyzeCorrelation(data.performance.relative),
        implications: this.getIndustryImplications(key, data, scores.details[key]),
        actionItems: this.getIndustryActionItems(key, data, scores.details[key])
      };
    }

    return {
      insights,
      summary: this.generateIndustrySummary(insights),
      alert_level: this.calculateAlertLevel(insights)
    };
  },

  generateMacroInsights(macroData, scores) {
    const insights = {};
    
    // Process each macro relationship
    for (const [key, data] of Object.entries(macroData)) {
      insights[key] = {
        score: scores.details[key]?.score || 50,
        trends: this.analyzeMacroTrends(data.performance.relative),
        correlations: this.analyzeMacroCorrelations(data.performance.relative),
        implications: this.getMacroImplications(key, data, scores.details[key]),
        actionItems: this.getMacroActionItems(key, data, scores.details[key])
      };
    }

    return {
      insights,
      summary: this.generateMacroSummary(insights),
      alert_level: this.calculateMacroAlertLevel(insights)
    };
  },

  generateEnvironmentInsights(environmentData) {
    return {
      current_phase: this.determineMarketPhase(environmentData),
      risk_level: this.assessRiskLevel(environmentData),
      momentum: this.analyzeMomentum(environmentData),
      breadth: this.analyzeBreadth(environmentData),
      implications: this.getEnvironmentImplications(environmentData)
    };
  },

  analyzeTrend(data) {
    const recent = data.slice(-20); // Last month
    if (recent.length < 2) return { direction: 'neutral', strength: 0 };

    const values = recent.map(d => d.spread);
    const trend = this.calculateTrendStrength(values);
    
    return {
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
      strength: Math.abs(trend),
      significant: Math.abs(trend) > 1.5
    };
  },

  analyzeCorrelation(data) {
    const recent = data.slice(-60); // Last quarter
    if (recent.length < 30) return { value: 0, stability: 'insufficient_data' };

    const correlations = this.calculateRollingCorrelation(recent);
    const stability = this.assessCorrelationStability(correlations);

    return {
      value: correlations[correlations.length - 1],
      stability,
      breakdown: this.detectCorrelationBreakdown(correlations)
    };
  },

  calculateTrendStrength(values) {
    const n = values.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  },

  calculateRollingCorrelation(data, window = 20) {
    const correlations = [];
    for (let i = window; i < data.length; i++) {
      const slice = data.slice(i - window, i);
      correlations.push(this.calculateCorrelation(slice));
    }
    return correlations;
  },

  calculateCorrelation(data) {
    // Pearson correlation calculation
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
      sumY2 += point.y * point.y;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  },

  assessCorrelationStability(correlations) {
    const recent = correlations.slice(-10);
    const std = this.calculateStandardDeviation(recent);
    
    if (std < 0.1) return 'stable';
    if (std < 0.2) return 'moderate';
    return 'unstable';
  },

  detectCorrelationBreakdown(correlations) {
    const recent = correlations.slice(-5);
    const previous = correlations.slice(-10, -5);
    
    const recentAvg = this.calculateAverage(recent);
    const previousAvg = this.calculateAverage(previous);
    
    const change = Math.abs(recentAvg - previousAvg);
    
    return {
      detected: change > 0.3,
      magnitude: change,
      direction: recentAvg > previousAvg ? 'strengthening' : 'weakening'
    };
  },

  calculateStandardDeviation(values) {
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.calculateAverage(squareDiffs));
  },

  calculateAverage(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  },

  getIndustryImplications(key, data, scores) {
    const baseImplications = {
      tech: {
        positive: "Semiconductor strength leading software indicates healthy tech demand",
        negative: "Software outperformance suggests defensive positioning",
        neutral: "Mixed signals in tech relationship dynamics"
      },
      consumer: {
        positive: "Consumer discretionary strength indicates healthy spending",
        negative: "Defensive consumer positioning suggests caution",
        neutral: "Balanced consumer sector dynamics"
      },
      financial: {
        positive: "Financial strength indicates healthy credit conditions",
        negative: "Financial weakness suggests credit stress",
        neutral: "Stable financial sector conditions"
      }
    };

    const direction = data.performance.trend.direction;
    return baseImplications[key]?.[direction] || "Monitoring sector dynamics";
  },

  getMacroImplications(key, data, scores) {
    const baseImplications = {
      yields: {
        positive: "Yield curve steepening suggests economic growth",
        negative: "Yield curve flattening indicates caution",
        neutral: "Neutral yield curve dynamics"
      },
      stocksBonds: {
        positive: "Risk-on conditions with healthy credit",
        negative: "Risk-off positioning with credit stress",
        neutral: "Balanced risk conditions"
      },
      global: {
        positive: "Synchronized global growth dynamics",
        negative: "Global growth divergence",
        neutral: "Mixed global conditions"
      }
    };

    const direction = data.performance.trends.primary;
    return baseImplications[key]?.[direction] || "Monitoring global dynamics";
  },

  getIndustryActionItems(key, data, scores) {
    const score = scores?.score || 50;
    const trend = data.performance.trend;

    if (score > 70) {
      return ["Maintain exposure", "Monitor momentum", "Track relative strength"];
    } else if (score < 30) {
      return ["Reduce exposure", "Implement hedges", "Monitor for stabilization"];
    }
    return ["Balance exposure", "Focus on quality", "Monitor trends"];
  },

  getMacroActionItems(key, data, scores) {
    const score = scores?.score || 50;
    const trends = data.performance.trends;

    if (score > 70) {
      return ["Maintain macro exposure", "Monitor correlations", "Track global flows"];
    } else if (score < 30) {
      return ["Reduce risk exposure", "Increase hedges", "Monitor stress indicators"];
    }
    return ["Balance exposures", "Monitor conditions", "Track key levels"];
  },

  generateIndustrySummary(insights) {
    const scores = Object.values(insights).map(i => i.score);
    const avgScore = this.calculateAverage(scores);
    
    if (avgScore > 70) {
      return "Industry relationships show broad strength";
    } else if (avgScore < 30) {
      return "Industry relationships indicate stress";
    }
    return "Mixed industry relationship dynamics";
  },

  generateMacroSummary(insights) {
    const scores = Object.values(insights).map(i => i.score);
    const avgScore = this.calculateAverage(scores);
    
    if (avgScore > 70) {
      return "Macro relationships support risk-taking";
    } else if (avgScore < 30) {
      return "Macro relationships suggest caution";
    }
    return "Balanced macro relationship dynamics";
  },

  calculateAlertLevel(insights) {
    const scores = Object.values(insights).map(i => i.score);
    const avgScore = this.calculateAverage(scores);
    
    if (avgScore > 80) return 'low';
    if (avgScore > 60) return 'moderate';
    if (avgScore > 40) return 'elevated';
    return 'high';
  },

  calculateMacroAlertLevel(insights) {
    const scores = Object.values(insights).map(i => i.score);
    const avgScore = this.calculateAverage(scores);
    
    if (avgScore > 80) return 'low';
    if (avgScore > 60) return 'moderate';
    if (avgScore > 40) return 'elevated';
    return 'high';
  }
};

export default marketInsights;
