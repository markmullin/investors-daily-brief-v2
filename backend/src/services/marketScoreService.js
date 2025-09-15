import marketAnalysisService from './marketAnalysisService.js';

class MarketScoreService {
  constructor() {
    this.gradeThresholds = {
      'A+': 95,
      'A': 90,
      'A-': 85,
      'B+': 80,
      'B': 75,
      'B-': 70,
      'C+': 65,
      'C': 60,
      'C-': 55,
      'D+': 50,
      'D': 45,
      'D-': 40,
      'F': 0
    };
  }

  async getMarketGrade() {
    try {
      // Get real-time market data
      const marketSnapshot = await marketAnalysisService.getMarketSnapshot();
      
      // Calculate individual component grades
      const grades = {
        overall: this.calculateGrade(marketSnapshot.conditions.score),
        components: {
          technicals: this.calculateComponentGrade(marketSnapshot, 'technical'),
          breadth: this.calculateComponentGrade(marketSnapshot, 'breadth'),
          momentum: this.calculateComponentGrade(marketSnapshot, 'momentum'),
          sentiment: this.calculateComponentGrade(marketSnapshot, 'sentiment')
        },
        timestamp: Date.now()
      };

      // Add detailed analysis for each grade
      grades.analysis = this.generateGradeAnalysis(grades, marketSnapshot);

      return grades;
    } catch (error) {
      console.error('Error calculating market grade:', error);
      throw error;
    }
  }

  calculateGrade(score) {
    // Convert numerical score to letter grade
    for (const [grade, threshold] of Object.entries(this.gradeThresholds)) {
      if (score >= threshold) {
        return {
          letter: grade,
          score: score,
          percentile: this.calculatePercentile(score)
        };
      }
    }
    return { letter: 'F', score: score, percentile: 0 };
  }

  calculateComponentGrade(snapshot, component) {
    let score;
    
    switch (component) {
      case 'technical':
        score = this.calculateTechnicalScore(snapshot);
        break;
      case 'breadth':
        score = this.calculateBreadthScore(snapshot);
        break;
      case 'momentum':
        score = this.calculateMomentumScore(snapshot);
        break;
      case 'sentiment':
        score = this.calculateSentimentScore(snapshot);
        break;
      default:
        throw new Error(`Unknown component: ${component}`);
    }

    return this.calculateGrade(score);
  }

  calculateTechnicalScore(snapshot) {
    const { metrics } = snapshot.conditions;
    
    // Weight different technical factors
    const trendScore = metrics.trend.aboveSma20 ? 
                      Math.min(50 + metrics.trend.strength, 100) : 
                      Math.max(50 - metrics.trend.strength, 0);
    
    const volatilityScore = Math.max(0, 100 - metrics.volatility.percentile);
    
    return Math.round((trendScore * 0.6) + (volatilityScore * 0.4));
  }

  calculateBreadthScore(snapshot) {
    const { breadth } = snapshot.conditions.metrics;
    
    // Calculate score based on advance-decline ratio
    const adScore = (breadth.advanceDeclineRatio > 1) ?
                   Math.min(breadth.advanceDeclineRatio * 50, 100) :
                   50 / breadth.advanceDeclineRatio;
    
    // Factor in the percentage of advancing stocks
    const participationScore = (breadth.advancing / breadth.total) * 100;
    
    return Math.round((adScore * 0.6) + (participationScore * 0.4));
  }

  calculateMomentumScore(snapshot) {
    const { metrics } = snapshot.conditions;
    
    // Calculate momentum based on trend strength and volume
    const trendMomentum = metrics.trend.strength;
    const volumeMomentum = (metrics.volume.ratio - 1) * 100;
    
    return Math.round(Math.min(Math.max(
      (trendMomentum * 0.7) + (volumeMomentum * 0.3),
      0
    ), 100));
  }

  calculateSentimentScore(snapshot) {
    return Math.round(snapshot.sentiment.score * 100);
  }

  calculatePercentile(score) {
    const grades = Object.values(this.gradeThresholds).sort((a, b) => b - a);
    const position = grades.findIndex(threshold => score >= threshold);
    return Math.round(((grades.length - position) / grades.length) * 100);
  }

  generateGradeAnalysis(grades, snapshot) {
    const analysis = {
      summary: this.generateSummary(grades.overall, snapshot),
      components: {}
    };

    // Generate analysis for each component
    for (const [component, grade] of Object.entries(grades.components)) {
      analysis.components[component] = this.generateComponentAnalysis(
        component,
        grade,
        snapshot
      );
    }

    return analysis;
  }

  generateSummary(grade, snapshot) {
    const { metrics } = snapshot.conditions;
    const sentiment = snapshot.sentiment;

    let summary = `Current market conditions warrant a ${grade.letter} grade (${grade.score}/100). `;

    // Market Direction and Strength
    summary += `The market is currently in a ${metrics.trend.aboveSma20 ? 'positive' : 'negative'} trend, `;
    summary += `with ${Math.abs(metrics.trend.deviation).toFixed(1)}% ${metrics.trend.aboveSma20 ? 'above' : 'below'} the 20-day moving average. `;

    // Market Breadth
    summary += `Market breadth is ${metrics.breadth.advanceDeclineRatio > 1 ? 'healthy' : 'weak'}, `;
    summary += `with ${metrics.breadth.advancing} advancing stocks versus ${metrics.breadth.declining} declining. `;

    // Volume Analysis
    summary += `Trading volume is ${metrics.volume.ratio > 1.1 ? 'above' : metrics.volume.ratio < 0.9 ? 'below' : 'near'} average levels, `;
    summary += `at ${(metrics.volume.ratio * 100).toFixed(0)}% of the 20-day average. `;

    // Volatility
    summary += `Market volatility is ${
      metrics.volatility.percentile > 75 ? 'high' :
      metrics.volatility.percentile > 50 ? 'elevated' :
      metrics.volatility.percentile > 25 ? 'moderate' : 'low'
    }, `;
    summary += `with the VIX at the ${metrics.volatility.percentile.toFixed(0)}th percentile of its yearly range. `;

    // Sentiment
    summary += `Overall market sentiment is ${sentiment.marketBias}, `;
    summary += `with a confidence level of ${(sentiment.confidence * 100).toFixed(0)}%.`;

    return summary;
  }

  generateComponentAnalysis(component, grade, snapshot) {
    const { metrics } = snapshot.conditions;

    switch (component) {
      case 'technical':
        return {
          grade: grade.letter,
          score: grade.score,
          analysis: `Technical factors are ${grade.score >= 70 ? 'strong' : grade.score >= 50 ? 'moderate' : 'weak'}, ` +
                   `with price momentum ${metrics.trend.aboveSma20 ? 'above' : 'below'} key moving averages and ` +
                   `${metrics.volatility.percentile > 75 ? 'elevated' : 'normal'} volatility levels.`
        };

      case 'breadth':
        return {
          grade: grade.letter,
          score: grade.score,
          analysis: `Market breadth is ${grade.score >= 70 ? 'robust' : grade.score >= 50 ? 'fair' : 'concerning'}, ` +
                   `with an advance-decline ratio of ${metrics.breadth.advanceDeclineRatio.toFixed(2)} and ` +
                   `${((metrics.breadth.advancing / metrics.breadth.total) * 100).toFixed(1)}% of stocks advancing.`
        };

      case 'momentum':
        return {
          grade: grade.letter,
          score: grade.score,
          analysis: `Market momentum is ${grade.score >= 70 ? 'strong' : grade.score >= 50 ? 'moderate' : 'weak'}, ` +
                   `based on trend strength of ${metrics.trend.strength.toFixed(1)} and ` +
                   `volume levels at ${(metrics.volume.ratio * 100).toFixed(0)}% of average.`
        };

      case 'sentiment':
        return {
          grade: grade.letter,
          score: grade.score,
          analysis: `Market sentiment is ${grade.score >= 70 ? 'bullish' : grade.score >= 50 ? 'neutral' : 'bearish'}, ` +
                   `with ${snapshot.sentiment.confidence.toFixed(2)} confidence based on recent market news and data.`
        };

      default:
        return {
          grade: grade.letter,
          score: grade.score,
          analysis: 'Component analysis not available.'
        };
    }
  }
}

export default new MarketScoreService();
