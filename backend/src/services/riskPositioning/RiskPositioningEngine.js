/**
 * Risk Positioning Engine - Core calculation logic for market risk assessment
 * FIXED: Proper class structure with all required methods
 */

class RiskPositioningEngine {
  constructor() {
    this.name = 'RiskPositioningEngine';
    this.version = '2.0.0';
  }

  /**
   * Calculate technical score based on market data
   */
  calculateTechnicalScore(data) {
    let score = 50;

    try {
      if (data.indices && data.indices.SPY) {
        const spy = data.indices.SPY;
        if (spy.trend === 'bullish') {
          score += 25;
          console.log(`📈 SPY bullish trend → +25 points`);
        } else if (spy.trend === 'bearish') {
          score -= 25;
          console.log(`📉 SPY bearish trend → -25 points`);
        }
      }

      if (data.breadth) {
        if (data.breadth.advanceDeclineRatio > 0.6) {
          score += 15;
          console.log(`🚀 Strong market breadth (${(data.breadth.advanceDeclineRatio * 100).toFixed(1)}%) → +15 points`);
        } else if (data.breadth.advanceDeclineRatio < 0.4) {
          score -= 15;
          console.log(`⚠️ Weak market breadth (${(data.breadth.advanceDeclineRatio * 100).toFixed(1)}%) → -15 points`);
        }
      }

      // FIXED: Use VXX instead of VIX for volatility analysis
      if (data.indices && data.indices.VXX) {
        const vxxLevel = data.indices.VXX.currentPrice || 20;
        // VXX interpretation: Lower VXX = lower volatility = more bullish
        if (vxxLevel < 15) {
          score += 10;
          console.log(`📉 Low VXX volatility (${vxxLevel.toFixed(1)}) → +10 points`);
        } else if (vxxLevel > 30) {
          score -= 10;
          console.log(`📈 High VXX volatility (${vxxLevel.toFixed(1)}) → -10 points`);
        } else {
          console.log(`📊 Moderate VXX volatility (${vxxLevel.toFixed(1)}) → neutral`);
        }
      } else if (data.vxxData) {
        // Fallback to vxxData if available
        const vxxLevel = data.vxxData.currentPrice || 20;
        if (vxxLevel < 15) {
          score += 10;
        } else if (vxxLevel > 30) {
          score -= 10;
        }
      }

    } catch (error) {
      console.warn('⚠️ Error calculating technical score:', error);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    console.log(`📊 Final Technical Score: ${finalScore}/100 (using VXX for volatility)`);
    
    return finalScore;
  }

  /**
   * Calculate fundamental score based on economic indicators
   */
  calculateFundamentalScore(data) {
    let score = 50;

    try {
      // Economic indicators analysis
      if (data.economic) {
        const econ = data.economic;
        
        // GDP growth
        if (econ.gdpGrowth > 2.5) {
          score += 15;
          console.log(`📈 Strong GDP growth (${econ.gdpGrowth}%) → +15 points`);
        } else if (econ.gdpGrowth < 1.0) {
          score -= 15;
          console.log(`📉 Weak GDP growth (${econ.gdpGrowth}%) → -15 points`);
        }

        // Unemployment rate
        if (econ.unemploymentRate < 4.0) {
          score += 10;
          console.log(`💼 Low unemployment (${econ.unemploymentRate}%) → +10 points`);
        } else if (econ.unemploymentRate > 6.0) {
          score -= 10;
          console.log(`⚠️ High unemployment (${econ.unemploymentRate}%) → -10 points`);
        }

        // Inflation rate
        if (econ.inflationRate > 2.0 && econ.inflationRate < 3.0) {
          score += 5;
          console.log(`🎯 Healthy inflation (${econ.inflationRate}%) → +5 points`);
        } else if (econ.inflationRate > 5.0) {
          score -= 15;
          console.log(`🔥 High inflation (${econ.inflationRate}%) → -15 points`);
        }
      }

      // Corporate earnings analysis
      if (data.earnings) {
        if (data.earnings.growth > 10) {
          score += 20;
          console.log(`💰 Strong earnings growth (${data.earnings.growth}%) → +20 points`);
        } else if (data.earnings.growth < -5) {
          score -= 20;
          console.log(`📉 Negative earnings growth (${data.earnings.growth}%) → -20 points`);
        }
      }

    } catch (error) {
      console.warn('⚠️ Error calculating fundamental score:', error);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    console.log(`📊 Final Fundamental Score: ${finalScore}/100`);
    
    return finalScore;
  }

  /**
   * Calculate sentiment score based on market sentiment indicators
   */
  calculateSentimentScore(data) {
    let score = 50;

    try {
      // Fear & Greed Index
      if (data.sentiment && data.sentiment.fearGreedIndex) {
        const fearGreed = data.sentiment.fearGreedIndex;
        if (fearGreed > 70) {
          score -= 10; // Extreme greed is bearish
          console.log(`🤑 Extreme greed (${fearGreed}) → -10 points`);
        } else if (fearGreed < 30) {
          score += 10; // Extreme fear is bullish contrarian signal
          console.log(`😨 Extreme fear (${fearGreed}) → +10 points (contrarian)`);
        } else {
          console.log(`😐 Neutral sentiment (${fearGreed}) → no change`);
        }
      }

      // Put/Call ratio
      if (data.sentiment && data.sentiment.putCallRatio) {
        const pcRatio = data.sentiment.putCallRatio;
        if (pcRatio > 1.2) {
          score += 15; // High put/call ratio is bullish contrarian
          console.log(`📈 High put/call ratio (${pcRatio}) → +15 points (contrarian)`);
        } else if (pcRatio < 0.8) {
          score -= 15; // Low put/call ratio is bearish
          console.log(`📉 Low put/call ratio (${pcRatio}) → -15 points`);
        }
      }

      // News sentiment
      if (data.sentiment && data.sentiment.newsScore) {
        const newsScore = data.sentiment.newsScore;
        if (newsScore > 0.6) {
          score += 10;
          console.log(`📰 Positive news sentiment (${newsScore}) → +10 points`);
        } else if (newsScore < 0.4) {
          score -= 10;
          console.log(`📰 Negative news sentiment (${newsScore}) → -10 points`);
        }
      }

    } catch (error) {
      console.warn('⚠️ Error calculating sentiment score:', error);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    console.log(`📊 Final Sentiment Score: ${finalScore}/100`);
    
    return finalScore;
  }

  /**
   * Calculate overall risk score by combining all factors
   */
  calculateOverallRiskScore(data) {
    console.log('🎯 Calculating Overall Risk Score...');
    
    try {
      const technicalScore = this.calculateTechnicalScore(data);
      const fundamentalScore = this.calculateFundamentalScore(data);
      const sentimentScore = this.calculateSentimentScore(data);

      // Weighted average (technical 40%, fundamental 40%, sentiment 20%)
      const overallScore = Math.round(
        (technicalScore * 0.4) + 
        (fundamentalScore * 0.4) + 
        (sentimentScore * 0.2)
      );

      const riskLevel = this.getRiskLevel(overallScore);
      const recommendation = this.getRecommendation(overallScore);

      console.log(`🎯 FINAL RISK ASSESSMENT:`);
      console.log(`   Technical: ${technicalScore}/100 (40% weight)`);
      console.log(`   Fundamental: ${fundamentalScore}/100 (40% weight)`);
      console.log(`   Sentiment: ${sentimentScore}/100 (20% weight)`);
      console.log(`   Overall Score: ${overallScore}/100`);
      console.log(`   Risk Level: ${riskLevel}`);
      console.log(`   Recommendation: ${recommendation}`);

      return {
        overallScore,
        riskLevel,
        recommendation,
        components: {
          technical: technicalScore,
          fundamental: fundamentalScore,
          sentiment: sentimentScore
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error calculating overall risk score:', error);
      
      // Return default moderate risk assessment
      return {
        overallScore: 50,
        riskLevel: 'Moderate',
        recommendation: 'Balanced positioning with risk management',
        components: {
          technical: 50,
          fundamental: 50,
          sentiment: 50
        },
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score >= 80) return 'Very Low Risk';
    if (score >= 70) return 'Low Risk';
    if (score >= 60) return 'Moderate-Low Risk';
    if (score >= 40) return 'Moderate Risk';
    if (score >= 30) return 'Moderate-High Risk';
    if (score >= 20) return 'High Risk';
    return 'Very High Risk';
  }

  /**
   * Get investment recommendation based on score
   */
  getRecommendation(score) {
    if (score >= 80) return 'Aggressive growth positioning recommended';
    if (score >= 70) return 'Growth positioning with moderate risk';
    if (score >= 60) return 'Balanced growth approach';
    if (score >= 40) return 'Balanced positioning with risk management';
    if (score >= 30) return 'Defensive positioning recommended';
    if (score >= 20) return 'Conservative approach with capital preservation';
    return 'Highly defensive positioning - preserve capital';
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      initialized: true,
      capabilities: [
        'technical-analysis',
        'fundamental-analysis', 
        'sentiment-analysis',
        'risk-scoring',
        'investment-recommendations'
      ]
    };
  }
}

export default RiskPositioningEngine;
