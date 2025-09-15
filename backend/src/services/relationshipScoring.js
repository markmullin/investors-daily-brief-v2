// Scoring weights and thresholds for market relationships
const RELATIONSHIP_WEIGHTS = {
  industry: {
    tech: 0.20,        // Tech sector relationships
    consumer: 0.15,     // Consumer discretionary vs staples
    financial: 0.15,    // Financial sector relationships
    industrial: 0.15,   // Industrial/Energy relationships
    momentum: 0.15,     // Market breadth/momentum
    style: 0.20         // Value vs Growth dynamics
  },
  macro: {
    yields: 0.20,       // Yield curve dynamics
    stocksBonds: 0.20,  // Stock-bond relationship
    crypto: 0.10,       // Crypto-Gold relationship
    inflation: 0.15,    // TIPS vs Nominal bonds
    commodities: 0.15,  // Oil-Dollar relationship
    global: 0.20        // Global market relationships
  }
};

const TREND_THRESHOLDS = {
  strong: 5.0,   // Strong trend threshold (%)
  moderate: 2.5, // Moderate trend threshold (%)
  weak: 1.0      // Weak trend threshold (%)
};

const relationshipScoring = {
  calculateRelationshipScores(relationshipData) {
    if (!relationshipData) return null;

    const scores = {
      industry: this.calculateIndustryScores(relationshipData.industry),
      macro: this.calculateMacroScores(relationshipData.macro),
      timestamp: Date.now()
    };

    // Calculate composite score
    scores.composite = this.calculateCompositeScore(scores);

    return scores;
  },

  calculateIndustryScores(industryData) {
    if (!industryData) return { score: 50, details: {} };

    const details = {};
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [key, relationship] of Object.entries(industryData)) {
      const weight = RELATIONSHIP_WEIGHTS.industry[key] || 0;
      const analysis = this.analyzeRelationshipTrend(relationship);
      
      details[key] = {
        score: analysis.score,
        trend: analysis.trend,
        impact: analysis.impact,
        weight
      };

      weightedScore += analysis.score * weight;
      totalWeight += weight;
    }

    return {
      score: Math.round(weightedScore / totalWeight),
      details
    };
  },

  calculateMacroScores(macroData) {
    if (!macroData) return { score: 50, details: {} };

    const details = {};
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [key, relationship] of Object.entries(macroData)) {
      const weight = RELATIONSHIP_WEIGHTS.macro[key] || 0;
      const analysis = this.analyzeMacroTrend(relationship);
      
      details[key] = {
        score: analysis.score,
        trends: analysis.trends,
        impact: analysis.impact,
        weight
      };

      weightedScore += analysis.score * weight;
      totalWeight += weight;
    }

    return {
      score: Math.round(weightedScore / totalWeight),
      details
    };
  },

  analyzeRelationshipTrend(relationship) {
    const recentData = relationship.performance.relative.slice(-20); // Last month of trading
    
    if (recentData.length === 0) {
      return { score: 50, trend: 0, impact: 'neutral' };
    }

    // Calculate trend
    const trend = this.calculateTrendStrength(recentData.map(d => d.spread));
    
    // Calculate score based on trend
    const score = this.calculateTrendScore(trend);
    
    // Determine impact
    const impact = this.determineTrendImpact(trend);

    return { score, trend, impact };
  },

  analyzeMacroTrend(relationship) {
    const recentData = relationship.performance.relative.slice(-20);
    
    if (recentData.length === 0) {
      return { score: 50, trends: [], impact: 'neutral' };
    }

    // Analyze each component's trend
    const trends = recentData[0].values.map((_, index) => {
      const series = recentData.map(d => d.values[index]);
      return this.calculateTrendStrength(series);
    });

    // Calculate overall score
    const score = this.calculateMacroScore(trends);
    
    // Determine impact
    const impact = this.determineMacroImpact(trends);

    return { score, trends, impact };
  },

  calculateTrendStrength(data) {
    const n = data.length;
    if (n < 2) return 0;

    // Calculate linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  },

  calculateTrendScore(trend) {
    const absChange = Math.abs(trend);
    let score = 50;

    if (absChange > TREND_THRESHOLDS.strong) {
      score += trend > 0 ? 25 : -25;
    } else if (absChange > TREND_THRESHOLDS.moderate) {
      score += trend > 0 ? 15 : -15;
    } else if (absChange > TREND_THRESHOLDS.weak) {
      score += trend > 0 ? 5 : -5;
    }

    return Math.min(100, Math.max(0, score));
  },

  calculateMacroScore(trends) {
    // Average the trend scores
    const scores = trends.map(trend => this.calculateTrendScore(trend));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  },

  determineTrendImpact(trend) {
    const absChange = Math.abs(trend);
    
    if (absChange > TREND_THRESHOLDS.strong) {
      return trend > 0 ? 'strongly positive' : 'strongly negative';
    } else if (absChange > TREND_THRESHOLDS.moderate) {
      return trend > 0 ? 'moderately positive' : 'moderately negative';
    } else if (absChange > TREND_THRESHOLDS.weak) {
      return trend > 0 ? 'slightly positive' : 'slightly negative';
    }
    return 'neutral';
  },

  determineMacroImpact(trends) {
    const avgTrend = trends.reduce((a, b) => a + b, 0) / trends.length;
    return this.determineTrendImpact(avgTrend);
  },

  calculateCompositeScore(scores) {
    const industryWeight = 0.5;  // 50% weight to industry relationships
    const macroWeight = 0.5;     // 50% weight to macro relationships

    const compositeScore = Math.round(
      scores.industry.score * industryWeight +
      scores.macro.score * macroWeight
    );

    return {
      score: compositeScore,
      components: {
        industry: {
          score: scores.industry.score,
          weight: industryWeight
        },
        macro: {
          score: scores.macro.score,
          weight: macroWeight
        }
      },
      interpretation: this.interpretCompositeScore(compositeScore)
    };
  },

  interpretCompositeScore(score) {
    if (score >= 80) {
      return "Market relationships strongly supportive of current trends";
    } else if (score >= 60) {
      return "Market relationships moderately supportive";
    } else if (score >= 40) {
      return "Mixed signals from market relationships";
    } else if (score >= 20) {
      return "Market relationships showing stress";
    } else {
      return "Significant stress in market relationships";
    }
  }
};

export default relationshipScoring;
