/**
 * Market Risk Positioning Controller
 * Handles API requests for the interactive 0-100 risk gauge system
 */

import RiskPositioningEngine from '../services/riskPositioning/RiskPositioningEngine.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { marketDataRateLimit } from '../middleware/security.js';
import { catchAsync } from '../middleware/errorHandler.js';
import logger, { marketDataLogger } from '../utils/logger.js';

const riskEngine = new RiskPositioningEngine();

class RiskPositioningController {
  
  /**
   * Get current market risk positioning score
   * Supports both beginner and advanced analysis modes
   */
  static getCurrentRiskScore = catchAsync(async (req, res) => {
    const { mode = 'beginner' } = req.query;
    const userId = req.user?.id;
    
    marketDataLogger.info('Risk positioning score requested', {
      mode,
      userId,
      userExperience: req.user?.investmentExperience
    });

    try {
      // Get the risk calculation
      const riskData = await riskEngine.calculateRiskScore();
      
      // Format response based on user's experience level or requested mode
      const userExperience = req.user?.investmentExperience || 'beginner';
      const analysisMode = mode === 'advanced' || userExperience === 'advanced' || userExperience === 'professional' 
        ? 'advanced' 
        : 'beginner';

      const response = {
        success: true,
        score: riskData.score,
        mode: analysisMode,
        timestamp: riskData.timestamp,
        gauge: {
          score: riskData.score,
          level: RiskPositioningController.getScoreLevel(riskData.score),
          color: RiskPositioningController.getScoreColor(riskData.score),
          animation: RiskPositioningController.getAnimationConfig(riskData.score)
        },
        analysis: analysisMode === 'advanced' 
          ? RiskPositioningController.formatAdvancedAnalysis(riskData)
          : RiskPositioningController.formatBeginnerAnalysis(riskData),
        interactiveFeatures: {
          dragEnabled: true,
          explanationMode: analysisMode,
          historicalComparison: Boolean(userId),
          personalizedInsights: Boolean(userId && req.user?.riskProfile)
        },
        dataQuality: riskData.dataQuality,
        lastUpdate: riskData.timestamp,
        nextUpdate: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      };

      // Add personalized insights if user is logged in
      if (userId && req.user) {
        response.personalizedInsights = RiskPositioningController.generatePersonalizedInsights(
          riskData, 
          req.user
        );
      }

      res.json(response);

    } catch (error) {
      logger.error('Risk positioning calculation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to calculate market risk positioning',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }
  });

  /**
   * Get historical risk positioning data
   */
  static getHistoricalRiskData = catchAsync(async (req, res) => {
    const { period = '1month', userId } = req.query;
    
    try {
      // Implementation would query InfluxDB for historical data
      const historicalData = await RiskPositioningController.queryHistoricalData(period);
      
      res.json({
        success: true,
        period,
        data: historicalData,
        insights: RiskPositioningController.generateHistoricalInsights(historicalData)
      });

    } catch (error) {
      logger.error('Historical risk data query failed:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to retrieve historical risk data'
      });
    }
  });

  /**
   * Simulate risk score at different levels (for interactive gauge)
   */
  static simulateRiskLevel = catchAsync(async (req, res) => {
    const { score } = req.params;
    const scoreNum = parseInt(score);
    
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be a number between 0 and 100'
      });
    }

    try {
      const simulation = RiskPositioningController.generateScoreSimulation(scoreNum);
      
      res.json({
        success: true,
        score: scoreNum,
        simulation
      });

    } catch (error) {
      logger.error('Risk simulation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to generate risk simulation'
      });
    }
  });

  /**
   * Toggle between beginner and advanced analysis modes
   */
  static switchAnalysisMode = catchAsync(async (req, res) => {
    const { mode } = req.body;
    const userId = req.user?.id;

    if (!['beginner', 'advanced'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be either "beginner" or "advanced"'
      });
    }

    try {
      // Get current risk data
      const riskData = await riskEngine.calculateRiskScore();
      
      // Format according to requested mode
      const analysis = mode === 'advanced' 
        ? RiskPositioningController.formatAdvancedAnalysis(riskData)
        : RiskPositioningController.formatBeginnerAnalysis(riskData);

      res.json({
        success: true,
        mode,
        score: riskData.score,
        analysis,
        transitionAnimation: true
      });

    } catch (error) {
      logger.error('Mode switch failed:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to switch analysis mode'
      });
    }
  });

  /**
   * Get risk positioning explanation for education
   */
  static getEducationalContent = catchAsync(async (req, res) => {
    const { topic } = req.params;
    
    const educationalContent = {
      'risk-scoring': {
        title: 'How Risk Scoring Works',
        content: 'Our 0-100 risk score combines economic fundamentals, market technicals, investor sentiment, and macroeconomic conditions to give you a clear picture of current market risk levels.',
        examples: [
          'Score 80+ = Growth positioning with favorable conditions',
          'Score 50-70 = Balanced approach with selective investments', 
          'Score 20-40 = Defensive positioning with elevated caution'
        ]
      },
      'cycle-analysis': {
        title: 'Economic vs Market Cycles',
        content: 'Sometimes the economy and stock market tell different stories. Understanding these divergences helps identify contrarian opportunities and avoid momentum traps.',
        examples: [
          'Strong economy + weak market = Buying opportunity',
          'Weak economy + strong market = Potential trap',
          'Aligned cycles = Clear directional signal'
        ]
      },
      'interactive-gauge': {
        title: 'Using the Interactive Gauge',
        content: 'Drag the gauge to explore different risk levels and see how your strategy should change. Each level provides specific allocation guidance and key things to watch.',
        examples: [
          'Touch and drag to explore different scores',
          'See real-time allocation recommendations',
          'Understand what drives score changes'
        ]
      }
    };

    const content = educationalContent[topic];
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Educational topic not found'
      });
    }

    res.json({
      success: true,
      topic,
      education: content
    });
  });

  // Helper methods for formatting responses

  static formatBeginnerAnalysis(riskData) {
    const score = riskData.score;
    
    return {
      summary: {
        score: score,
        level: RiskPositioningController.getScoreLevel(score),
        meaning: RiskPositioningController.getBeginnerExplanation(score),
        recommendation: riskData.analysis.recommendation
      },
      simpleStrategy: {
        stocks: RiskPositioningController.getSimpleStockGuidance(score),
        whatToBuy: riskData.analysis.recommendation.focusAreas.slice(0, 3),
        whatToAvoid: riskData.analysis.recommendation.avoidAreas.slice(0, 3),
        cashLevel: riskData.analysis.recommendation.cashPosition
      },
      whyThisScore: RiskPositioningController.getSimpleScoreExplanation(riskData.components),
      watchOutFor: riskData.analysis.riskMonitors.slice(0, 3),
      whenToCheckAgain: riskData.analysis.nextReviewTriggers[0],
      learningTip: RiskPositioningController.getLearningTip(score)
    };
  }

  static formatAdvancedAnalysis(riskData) {
    return {
      currentAssessment: {
        score: riskData.score,
        assessment: riskData.analysis.overall,
        cycleAnalysis: riskData.analysis.cycleAnalysis,
        historicalContext: riskData.analysis.historicalContext
      },
      marketDynamics: {
        fundamentalStrength: riskData.components.fundamental.score,
        technicalCondition: riskData.components.technical.score,
        sentimentReading: riskData.components.sentiment.score,
        macroEnvironment: riskData.components.macro.score,
        keyInsights: riskData.analysis.strategicGuidance
      },
      strategicRecommendation: riskData.analysis.recommendation,
      riskMonitoring: {
        keyRisks: riskData.analysis.riskMonitors,
        reviewTriggers: riskData.analysis.nextReviewTriggers,
        timeHorizon: riskData.analysis.recommendation.timeHorizon
      },
      componentBreakdown: {
        fundamental: {
          score: riskData.components.fundamental.score,
          weight: riskData.components.fundamental.weight,
          description: 'Corporate earnings, valuations, economic growth'
        },
        technical: {
          score: riskData.components.technical.score,
          weight: riskData.components.technical.weight,
          description: 'Market momentum, breadth, volatility measures'
        },
        sentiment: {
          score: riskData.components.sentiment.score,
          weight: riskData.components.sentiment.weight,
          description: 'Investor psychology, positioning, flows'
        },
        macro: {
          score: riskData.components.macro.score,
          weight: riskData.components.macro.weight,
          description: 'Interest rates, inflation, employment conditions'
        }
      }
    };
  }

  static getScoreLevel(score) {
    if (score >= 80) return 'Maximum Growth';
    if (score >= 70) return 'Growth Positioning';
    if (score >= 60) return 'Moderate Growth';
    if (score >= 50) return 'Balanced';
    if (score >= 40) return 'Defensive';
    if (score >= 30) return 'Very Defensive';
    return 'Maximum Defense';
  }

  static getScoreColor(score) {
    if (score >= 80) return '#0066FF'; // Blue - Maximum Growth
    if (score >= 70) return '#00AA44'; // Green - Growth
    if (score >= 60) return '#88CC00'; // Light Green - Moderate Growth
    if (score >= 50) return '#FFAA00'; // Yellow - Balanced
    if (score >= 40) return '#FF6600'; // Orange - Defensive
    if (score >= 30) return '#FF3300'; // Red - Very Defensive
    return '#CC0000'; // Dark Red - Maximum Defense
  }

  static getAnimationConfig(score) {
    return {
      duration: 1500,
      easing: 'easeOutQuart',
      hapticFeedback: score > 75 || score < 25, // Haptic feedback for extreme scores
      pulseEffect: score > 85 || score < 15 // Pulse effect for very extreme scores
    };
  }

  static getBeginnerExplanation(score) {
    if (score >= 75) {
      return "The market is in a good spot for investing in stocks right now. Think of it like a green light - conditions are favorable for buying quality companies.";
    } else if (score >= 50) {
      return "The market has mixed signals. It's not a clear green or red light, so being selective with your investments makes sense.";
    } else {
      return "The market is showing warning signs. Like a yellow or red light, it's time to be more careful with your money.";
    }
  }

  static getSimpleStockGuidance(score) {
    if (score >= 75) {
      return "Focus on well-known, profitable companies (Apple, Microsoft, Johnson & Johnson)";
    } else if (score >= 50) {
      return "Stick to stable companies that pay dividends and have been around for decades";
    } else {
      return "Consider safer investments like treasury bonds and high-quality dividend stocks";
    }
  }

  static getSimpleScoreExplanation(components) {
    const reasons = [];
    
    if (components.fundamental.score > 60) {
      reasons.push("Companies are making good profits and growing");
    }
    if (components.macro.score > 60) {
      reasons.push("The economy is doing well overall");
    }
    if (components.technical.score > 60) {
      reasons.push("Stock prices aren't too expensive yet");
    }
    if (components.sentiment.score > 60) {
      reasons.push("People are optimistic but not crazy excited");
    }

    return reasons.length > 0 ? reasons : ["Market conditions are mixed with both positives and negatives"];
  }

  static getLearningTip(score) {
    if (score >= 75) {
      return "This score helps you know when it's generally safer to invest vs when to be more careful with your money!";
    } else if (score >= 50) {
      return "Mixed scores like this are when stock picking and research become most important.";
    } else {
      return "During uncertain times like this, preserving your money is often more important than trying to make more.";
    }
  }

  static generatePersonalizedInsights(riskData, user) {
    const insights = [];
    
    // Risk profile alignment
    const score = riskData.score;
    const userRisk = user.riskProfile;
    
    if (userRisk === 'conservative' && score > 70) {
      insights.push("Given your conservative risk profile, consider taking only partial advantage of current favorable conditions");
    } else if (userRisk === 'aggressive' && score < 40) {
      insights.push("Even with your aggressive risk tolerance, current conditions suggest a more defensive approach");
    }

    // Experience level guidance
    if (user.investmentExperience === 'beginner' && score < 50) {
      insights.push("As a beginning investor, focus on learning during this challenging period rather than taking big risks");
    }

    return insights;
  }

  static generateScoreSimulation(score) {
    return {
      level: RiskPositioningController.getScoreLevel(score),
      meaning: RiskPositioningController.getSimulationExplanation(score),
      allocation: RiskPositioningController.getSimulatedAllocation(score),
      keyActions: RiskPositioningController.getSimulatedActions(score),
      timeFrame: RiskPositioningController.getSimulatedTimeFrame(score)
    };
  }

  static getSimulatedAllocation(score) {
    if (score >= 80) return "85-90% stocks, 10-15% cash/bonds";
    if (score >= 70) return "70-80% stocks, 20-30% cash/bonds";
    if (score >= 60) return "60-70% stocks, 30-40% cash/bonds";
    if (score >= 50) return "50-60% stocks, 40-50% cash/bonds";
    if (score >= 40) return "40-50% stocks, 50-60% cash/bonds";
    if (score >= 30) return "30-40% stocks, 60-70% cash/bonds";
    return "20-30% stocks, 70-80% cash/bonds";
  }

  static getSimulatedActions(score) {
    if (score >= 80) return ["Buy quality growth stocks", "Consider international exposure", "Reduce cash holdings"];
    if (score >= 50) return ["Selective stock picking", "Focus on dividends", "Maintain some cash"];
    return ["Preserve capital", "Focus on safety", "Wait for better opportunities"];
  }

  static getSimulatedTimeFrame(score) {
    if (score >= 75) return "12-18 month bullish outlook";
    if (score >= 50) return "6-12 month cautious optimism";
    return "3-6 month defensive positioning";
  }

  static getSimulationExplanation(score) {
    if (score >= 90) return "Extremely favorable conditions - very rare, maybe 5% of the time";
    if (score >= 75) return "Strong growth environment - good time to be invested";
    if (score >= 50) return "Mixed conditions - requires careful stock selection";
    if (score >= 25) return "Challenging environment - preservation is key";
    return "Crisis conditions - maximum defense required";
  }

  static async queryHistoricalData(period) {
    // Implementation would query InfluxDB
    // For now, return mock data
    return [
      { date: '2024-01-01', score: 68 },
      { date: '2024-02-01', score: 72 },
      { date: '2024-03-01', score: 65 },
      { date: '2024-04-01', score: 73 },
      { date: '2024-05-01', score: 78 }
    ];
  }

  static generateHistoricalInsights(data) {
    const currentScore = data[data.length - 1]?.score || 50;
    const previousScore = data[data.length - 2]?.score || 50;
    const trend = currentScore > previousScore ? 'improving' : 'deteriorating';
    
    return {
      trend,
      volatility: 'moderate',
      keyMoves: ['March decline due to banking concerns', 'May recovery on earnings strength']
    };
  }
}

export default RiskPositioningController;
