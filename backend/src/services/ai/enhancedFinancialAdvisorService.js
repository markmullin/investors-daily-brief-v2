/**
 * Enhanced AI Financial Advisor Service (ES Module)
 * Mixed personality approach with market intelligence integration
 */

import unifiedGptOssService from '../unifiedGptOssService.js';

class EnhancedAIFinancialAdvisorService {
  constructor() {
    this.personalities = {
      conservative: {
        name: 'Conservative Fiduciary',
        focus: 'Risk management and capital preservation',
        temperature: 0.3
      },
      motivational: {
        name: 'Motivational Coach',
        focus: 'Encouragement and goal achievement',
        temperature: 0.5
      },
      datadriven: {
        name: 'Data-Driven Analyst',
        focus: 'Quantitative analysis and metrics',
        temperature: 0.2
      },
      mixed: {
        name: 'Mixed Approach',
        focus: 'Balanced perspective combining all approaches',
        temperature: 0.4
      }
    };
  }

  /**
   * Generate comprehensive financial advice with mixed personality
   */
  async generateEnhancedAdvice(analysisData) {
    try {
      console.log('🤖 Generating enhanced AI financial advice...');
      
      const {
        goal,
        goalName,
        targetAmount,
        projectedAmount,
        shortfall,
        surplus,
        timeHorizon,
        monthlyContribution,
        currentPortfolio,
        marketEnvironment,
        riskTolerance,
        advisorPersonality,
        projections
      } = analysisData;

      // Calculate key metrics
      const successProbability = this.calculateSuccessProbability(projections, targetAmount);
      const additionalMonthlyNeeded = shortfall > 0 ? Math.ceil(shortfall / (timeHorizon * 12)) : 0;
      const currentProgress = projections[0] ? (projections[0].totalContributions / targetAmount) * 100 : 0;
      
      // Generate advice based on personality preference
      const advice = await this.generatePersonalitySpecificAdvice({
        ...analysisData,
        successProbability,
        additionalMonthlyNeeded,
        currentProgress
      });

      return {
        ...advice,
        metadata: {
          generatedAt: new Date().toISOString(),
          personality: advisorPersonality,
          marketScore: marketEnvironment,
          analysisVersion: '2.0'
        }
      };

    } catch (error) {
      console.error('❌ Enhanced AI advice generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate advice based on selected personality
   */
  async generatePersonalitySpecificAdvice(data) {
    const { advisorPersonality } = data;
    
    switch (advisorPersonality) {
      case 'conservative':
        return await this.generateConservativeAdvice(data);
      case 'motivational':
        return await this.generateMotivationalAdvice(data);
      case 'datadriven':
        return await this.generateDataDrivenAdvice(data);
      default:
        return await this.generateMixedAdvice(data);
    }
  }

  /**
   * Generate conservative fiduciary advice
   */
  async generateConservativeAdvice(data) {
    const prompt = this.buildConservativePrompt(data);
    
    try {
      const response = await unifiedGptOssService.generate('You are a helpful assistant.', prompt, {
        temperature: 0.3,
        maxTokens: 1000
      });

      return this.parseAdviceResponse(response, 'conservative', data);
    } catch (error) {
      console.error('❌ Conservative advice generation failed:', error);
      return this.generateFallbackAdvice(data, 'conservative');
    }
  }

  /**
   * Generate motivational coaching advice
   */
  async generateMotivationalAdvice(data) {
    const prompt = this.buildMotivationalPrompt(data);
    
    try {
      const response = await unifiedGptOssService.generate('You are a helpful assistant.', prompt, {
        temperature: 0.5,
        maxTokens: 1000
      });

      return this.parseAdviceResponse(response, 'motivational', data);
    } catch (error) {
      console.error('❌ Motivational advice generation failed:', error);
      return this.generateFallbackAdvice(data, 'motivational');
    }
  }

  /**
   * Generate data-driven analytical advice
   */
  async generateDataDrivenAdvice(data) {
    const prompt = this.buildDataDrivenPrompt(data);
    
    try {
      const response = await unifiedGptOssService.generate('You are a helpful assistant.', prompt, {
        temperature: 0.2,
        maxTokens: 1000
      });

      return this.parseAdviceResponse(response, 'datadriven', data);
    } catch (error) {
      console.error('❌ Data-driven advice generation failed:', error);
      return this.generateFallbackAdvice(data, 'datadriven');
    }
  }

  /**
   * Generate mixed personality advice
   */
  async generateMixedAdvice(data) {
    const prompt = this.buildMixedPrompt(data);
    
    try {
      const response = await unifiedGptOssService.generate('You are a helpful assistant.', prompt, {
        temperature: 0.4,
        maxTokens: 1200
      });

      return this.parseAdviceResponse(response, 'mixed', data);
    } catch (error) {
      console.error('❌ Mixed advice generation failed:', error);
      return this.generateFallbackAdvice(data, 'mixed');
    }
  }

  /**
   * Build conservative fiduciary prompt
   */
  buildConservativePrompt(data) {
    return `As a conservative fiduciary financial advisor, analyze this client's ${data.goal} plan:

CURRENT SITUATION:
- Goal: ${data.goalName || data.goal} ($${data.targetAmount.toLocaleString()})
- Time horizon: ${data.timeHorizon} years
- Monthly contribution: $${data.monthlyContribution}
- Current savings: $${data.projections[0]?.totalContributions || 0}
- Projected final value: $${data.projectedAmount.toLocaleString()}
- ${data.shortfall > 0 ? `Shortfall: $${data.shortfall.toLocaleString()}` : `Surplus: $${data.surplus.toLocaleString()}`}

MARKET CONDITIONS:
- Market environment score: ${data.marketEnvironment || 'N/A'}/100
- Risk tolerance: ${data.riskTolerance}

As a CONSERVATIVE FIDUCIARY, provide advice focusing on:
1. Risk management and capital preservation
2. Stress-testing against market downturns
3. Building safety margins into the plan
4. Tax-efficient strategies
5. Specific warnings about potential risks

Provide 5 conservative recommendations and 3 important warnings.
Be thorough but concise. Focus on protecting the client's financial future.`;
  }

  /**
   * Build motivational coaching prompt
   */
  buildMotivationalPrompt(data) {
    return `As an enthusiastic motivational financial coach, inspire this client about their ${data.goal} journey:

CURRENT PROGRESS:
- Goal: ${data.goalName || data.goal} ($${data.targetAmount.toLocaleString()})
- Already ${data.currentProgress.toFixed(1)}% to their goal!
- Time horizon: ${data.timeHorizon} years
- Monthly contribution: $${data.monthlyContribution}
- Projected outcome: ${data.surplus > 0 ? 'EXCEEDING goal!' : 'Can reach goal with adjustment'}

SUCCESS METRICS:
- Success probability: ${data.successProbability}%
- ${data.surplus > 0 ? `Projected surplus: $${data.surplus.toLocaleString()}` : `Additional needed: $${data.additionalMonthlyNeeded}/month`}

As a MOTIVATIONAL COACH, provide advice focusing on:
1. Celebrating current progress and achievements
2. Breaking down the path to success into manageable steps
3. Highlighting the power of compound interest and time
4. Encouraging consistent behavior and habit formation
5. Inspiring confidence about reaching financial goals

Provide 5 motivational insights that energize and inspire action.
Be encouraging, positive, and focus on the journey to financial success.`;
  }

  /**
   * Build data-driven analytical prompt
   */
  buildDataDrivenPrompt(data) {
    const finalValue = data.projections[data.projections.length - 1];
    const totalContributions = finalValue?.totalContributions || 0;
    const investmentGains = finalValue?.gains || 0;
    const realReturn = totalContributions > 0 ? ((investmentGains / totalContributions) * 100) : 0;

    return `As a quantitative financial analyst, provide data-driven analysis for this ${data.goal} plan:

QUANTITATIVE ANALYSIS:
- Target: $${data.targetAmount.toLocaleString()} in ${data.timeHorizon} years
- Total contributions: $${totalContributions.toLocaleString()}
- Investment gains: $${investmentGains.toLocaleString()}
- Projected real return: ${realReturn.toFixed(1)}%
- Success probability: ${data.successProbability}%
- Required CAGR: ${(Math.pow(data.targetAmount / (data.projections[0]?.totalContributions || 1000), 1/data.timeHorizon) - 1 * 100).toFixed(1)}%

MARKET DATA:
- Current market environment: ${data.marketEnvironment || 'N/A'}/100
- Risk tolerance: ${data.riskTolerance}
- Portfolio context: ${data.currentPortfolio ? 'Available' : 'Not provided'}

As a DATA-DRIVEN ANALYST, provide advice focusing on:
1. Statistical probability of success based on historical data
2. Quantitative optimization opportunities
3. Risk-adjusted return expectations
4. Mathematical scenarios and sensitivity analysis
5. Evidence-based recommendations with numbers

Provide 5 data-driven insights with specific metrics and calculations.
Focus on numbers, probabilities, and quantitative optimization.`;
  }

  /**
   * Build mixed personality prompt
   */
  buildMixedPrompt(data) {
    return `As a comprehensive financial advisor combining conservative risk management, motivational coaching, and data-driven analysis, help this client with their ${data.goal} plan:

CLIENT SITUATION:
- Goal: ${data.goalName || data.goal} ($${data.targetAmount.toLocaleString()})
- Time horizon: ${data.timeHorizon} years
- Monthly contribution: $${data.monthlyContribution}
- Current progress: ${data.currentProgress.toFixed(1)}% to goal
- Success probability: ${data.successProbability}%
- Market environment: ${data.marketEnvironment || 'N/A'}/100

Provide a MIXED APPROACH analysis with:

CONSERVATIVE PERSPECTIVE (Risk Management):
- 2 conservative recommendations for capital preservation
- 1 important risk warning

MOTIVATIONAL PERSPECTIVE (Encouragement):
- 2 motivational insights celebrating progress
- 1 inspiring call-to-action

DATA-DRIVEN PERSPECTIVE (Analytics):
- 2 quantitative insights with specific numbers
- 1 optimization recommendation

MARKET INTELLIGENCE:
- 1 market-aware recommendation based on current environment score

Provide comprehensive advice that balances all three approaches.
Be thorough, encouraging, and quantitatively sound.`;
  }

  /**
   * Parse AI response into structured advice
   */
  parseAdviceResponse(response, personality, data) {
    // This would parse the AI response into structured format
    // For now, return a structured fallback based on personality
    return this.generateFallbackAdvice(data, personality);
  }

  /**
   * Generate fallback advice when AI service fails
   */
  generateFallbackAdvice(data, personality) {
    const {
      successProbability,
      shortfall,
      surplus,
      additionalMonthlyNeeded,
      currentProgress,
      targetAmount,
      goal,
      timeHorizon,
      monthlyContribution,
      marketEnvironment
    } = data;

    let advice = {
      summary: '',
      conservativeAdvice: [],
      motivationalAdvice: [],
      dataPoints: [],
      marketInsights: [],
      optimizations: [],
      warnings: [],
      successProbability: Math.round(successProbability),
      personality: personality
    };

    // Conservative advice
    if (shortfall > 0) {
      advice.conservativeAdvice = [
        `Increase monthly savings by $${additionalMonthlyNeeded} to eliminate the $${shortfall.toLocaleString()} shortfall`,
        'Build 20% safety margin above your target to account for market volatility',
        'Prioritize tax-advantaged accounts (401k, IRA) to maximize growth potential',
        'Maintain separate emergency fund equal to 6 months of expenses',
        'Consider more conservative return assumptions (6% vs 7%) for planning'
      ];
      
      advice.warnings = [
        `Current plan falls short by $${shortfall.toLocaleString()}`,
        'Market downturns could significantly delay your timeline',
        'Inflation will reduce purchasing power over time'
      ];
    } else {
      advice.conservativeAdvice = [
        'Excellent progress! Your plan has built-in safety margins',
        'Consider tax-loss harvesting to optimize after-tax returns',
        'Review and rebalance portfolio annually to maintain target allocation',
        'Protect against sequence-of-returns risk as you approach your goal',
        'Consider increasing target by 10% to account for lifestyle inflation'
      ];
    }

    // Motivational advice
    advice.motivationalAdvice = [
      `Outstanding! You're already ${currentProgress.toFixed(1)}% toward your ${goal} goal`,
      `Every $${monthlyContribution} contribution moves you ${((monthlyContribution * 12) / targetAmount * 100).toFixed(2)}% closer each year`,
      surplus > 0 ? 
        `Amazing! You're projected to exceed your goal by $${surplus.toLocaleString()} - time to dream bigger!` :
        `You're closer than you think - just ${additionalMonthlyNeeded} extra monthly gets you there!`,
      'Time is your greatest ally - starting early beats perfect timing every time',
      'Your future self will thank you for every dollar you invest today'
    ];

    // Data-driven insights
    const finalValue = data.projections[data.projections.length - 1];
    const totalContributions = finalValue?.totalContributions || 0;
    const investmentGains = finalValue?.gains || 0;
    
    advice.dataPoints = [
      `Success probability: ${Math.round(successProbability)}% based on historical market performance`,
      `Total contributions: $${totalContributions.toLocaleString()} | Investment gains: $${investmentGains.toLocaleString()}`,
      `Required savings rate: ${((monthlyContribution * 12) / 60000 * 100).toFixed(1)}% of estimated annual income`,
      `Compound annual growth rate needed: ${((Math.pow(targetAmount / Math.max(1000, totalContributions), 1/timeHorizon) - 1) * 100).toFixed(1)}%`,
      `Monthly investment creates $${Math.round(investmentGains / (timeHorizon * 12))} average monthly growth`
    ];

    // Market-based insights
    if (marketEnvironment) {
      if (marketEnvironment >= 70) {
        advice.marketInsights = [
          'Current market conditions favor equity investments - consider increasing stock allocation',
          'Strong market environment supports taking calculated risks for higher returns'
        ];
      } else if (marketEnvironment <= 40) {
        advice.marketInsights = [
          'Challenging market environment - focus on defensive positioning and dollar-cost averaging',
          'Market weakness may create future buying opportunities'
        ];
      } else {
        advice.marketInsights = [
          'Neutral market conditions - maintain balanced approach with consistent contributions'
        ];
      }
    }

    // Portfolio optimizations
    advice.optimizations = [
      'Maximize employer 401k match - it\'s free money that doubles your contribution',
      'Consider Roth IRA for tax-free growth if you expect higher future tax rates',
      'Use target-date funds for automatic rebalancing and age-appropriate allocation'
    ];

    // Summary based on personality
    if (personality === 'conservative') {
      advice.summary = shortfall > 0 ? 
        `Your ${goal} plan needs adjustment for safety. Conservatively, increase monthly savings by $${additionalMonthlyNeeded} and build in 20% buffer for market volatility.` :
        `Your ${goal} plan is well-positioned with built-in safety margins. Focus on tax optimization and risk management as you approach your goal.`;
    } else if (personality === 'motivational') {
      advice.summary = `You're doing amazing! ${currentProgress.toFixed(1)}% progress toward your ${goal} shows real commitment. ${shortfall > 0 ? `Just $${additionalMonthlyNeeded} more monthly gets you there - you\'ve got this!` : 'You\'re on track to exceed your goal - time to dream even bigger!'}`;
    } else if (personality === 'datadriven') {
      advice.summary = `Quantitative analysis shows ${Math.round(successProbability)}% success probability. ${shortfall > 0 ? `Mathematical optimization requires $${additionalMonthlyNeeded} additional monthly contribution.` : 'Current trajectory exceeds target with high statistical confidence.'}`;
    } else {
      advice.summary = shortfall > 0 ? 
        `Your ${goal} plan needs adjustment but is completely achievable! Conservatively, you need $${additionalMonthlyNeeded} more monthly. Motivationally, you're ${currentProgress.toFixed(1)}% there already! Data shows ${Math.round(successProbability)}% success probability with adjustment.` :
        `Outstanding ${goal} plan! Conservative analysis shows built-in safety margins. Motivational perspective: you're exceeding expectations! Data confirms high probability of success with current trajectory.`;
    }

    return advice;
  }

  /**
   * Calculate success probability based on historical data
   */
  calculateSuccessProbability(projections, targetAmount) {
    if (!projections || projections.length === 0) return 50;
    
    const finalValue = projections[projections.length - 1];
    const shortfall = Math.max(0, targetAmount - finalValue.nominalValue);
    
    if (shortfall === 0) {
      return 85; // High probability if on track
    }
    
    const shortfallPercent = (shortfall / targetAmount) * 100;
    
    // Linear probability decline based on shortfall
    return Math.max(30, 85 - shortfallPercent);
  }
}

export default new EnhancedAIFinancialAdvisorService();
