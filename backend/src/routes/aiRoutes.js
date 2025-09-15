/**
 * Enhanced AI Financial Advisor Routes (ES Module)
 * Handles goal-based planning with mixed personality approach
 */

import express from 'express';
import EnhancedFinancialAdvisorService from '../services/ai/enhancedFinancialAdvisorService.js';

const router = express.Router();

/**
 * POST /api/ai/enhanced-financial-advisor
 * Generate comprehensive financial advice with mixed personality approach
 */
router.post('/enhanced-financial-advisor', async (req, res) => {
  try {
    console.log('🤖 Processing enhanced financial advisor request...');
    
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
    } = req.body;

    // Validate required fields
    if (!goal || !targetAmount || !timeHorizon || !monthlyContribution) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['goal', 'targetAmount', 'timeHorizon', 'monthlyContribution']
      });
    }

    // Generate enhanced advice
    const advice = await EnhancedFinancialAdvisorService.generateEnhancedAdvice({
      goal,
      goalName: goalName || goal,
      targetAmount,
      projectedAmount,
      shortfall: shortfall || 0,
      surplus: surplus || 0,
      timeHorizon,
      monthlyContribution,
      currentPortfolio,
      marketEnvironment,
      riskTolerance: riskTolerance || 'moderate',
      advisorPersonality: advisorPersonality || 'mixed',
      projections: projections || []
    });

    res.json({
      success: true,
      advice,
      timestamp: new Date().toISOString(),
      version: '2.0'
    });

  } catch (error) {
    console.error('❌ Enhanced financial advisor request failed:', error);
    res.status(500).json({
      error: 'Failed to generate financial advice',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/financial-advisor
 * Legacy endpoint for basic financial advice (maintained for compatibility)
 */
router.post('/financial-advisor', async (req, res) => {
  try {
    console.log('🤖 Processing basic financial advisor request...');
    
    // Convert legacy request to enhanced format
    const enhancedRequest = {
      ...req.body,
      advisorPersonality: 'mixed'
    };

    const advice = await EnhancedFinancialAdvisorService.generateEnhancedAdvice(enhancedRequest);

    res.json({
      success: true,
      ...advice,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Basic financial advisor request failed:', error);
    res.status(500).json({
      error: 'Failed to generate financial advice',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/advisor-personalities
 * Get available advisor personality types
 */
router.get('/advisor-personalities', (req, res) => {
  try {
    const personalities = {
      mixed: {
        name: 'Mixed Approach',
        description: 'Balanced perspective combining conservative risk management, motivational coaching, and data-driven analysis',
        icon: 'brain',
        color: 'purple'
      },
      conservative: {
        name: 'Conservative Fiduciary',
        description: 'Focus on risk management, capital preservation, and stress-testing plans against market downturns',
        icon: 'shield',
        color: 'blue'
      },
      motivational: {
        name: 'Motivational Coach',
        description: 'Encouraging and inspiring approach focused on goal achievement and building confidence',
        icon: 'trophy',
        color: 'green'
      },
      datadriven: {
        name: 'Data-Driven Analyst',
        description: 'Quantitative analysis with statistical insights, probabilities, and evidence-based recommendations',
        icon: 'bar-chart',
        color: 'indigo'
      }
    };

    res.json({
      personalities,
      default: 'mixed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get advisor personalities:', error);
    res.status(500).json({
      error: 'Failed to get advisor personalities',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/goal-optimization
 * Optimize financial goal parameters
 */
router.post('/goal-optimization', async (req, res) => {
  try {
    console.log('🎯 Processing goal optimization request...');
    
    const {
      currentAmount,
      targetAmount,
      timeHorizon,
      expectedReturn,
      riskTolerance
    } = req.body;

    // Validate inputs
    if (!targetAmount || !timeHorizon) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['targetAmount', 'timeHorizon']
      });
    }

    // Calculate optimization scenarios
    const scenarios = calculateOptimizationScenarios({
      currentAmount: currentAmount || 0,
      targetAmount,
      timeHorizon,
      expectedReturn: expectedReturn || 7,
      riskTolerance: riskTolerance || 'moderate'
    });

    res.json({
      success: true,
      scenarios,
      recommendations: generateOptimizationRecommendations(scenarios),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Goal optimization failed:', error);
    res.status(500).json({
      error: 'Failed to optimize goal',
      message: error.message
    });
  }
});

/**
 * Calculate optimization scenarios
 */
function calculateOptimizationScenarios(params) {
  const { currentAmount, targetAmount, timeHorizon, expectedReturn } = params;
  
  // Calculate monthly payment needed
  const monthlyRate = expectedReturn / 100 / 12;
  const futureValueCurrent = currentAmount * Math.pow(1 + monthlyRate, timeHorizon * 12);
  const remainingNeeded = targetAmount - futureValueCurrent;
  
  // PMT calculation for remaining amount
  const monthlyPayment = remainingNeeded > 0 ? 
    (remainingNeeded * monthlyRate) / (Math.pow(1 + monthlyRate, timeHorizon * 12) - 1) : 0;

  return {
    requiredMonthlyPayment: Math.max(0, Math.round(monthlyPayment)),
    futureValueOfCurrentSavings: Math.round(futureValueCurrent),
    totalContributionsNeeded: Math.round(monthlyPayment * timeHorizon * 12),
    scenarios: [
      {
        name: 'Conservative (6% return)',
        monthlyPayment: Math.round(calculateMonthlyPayment(params, 6)),
        probability: 85
      },
      {
        name: 'Moderate (7% return)',
        monthlyPayment: Math.round(calculateMonthlyPayment(params, 7)),
        probability: 70
      },
      {
        name: 'Aggressive (8% return)',
        monthlyPayment: Math.round(calculateMonthlyPayment(params, 8)),
        probability: 50
      }
    ]
  };
}

/**
 * Calculate monthly payment for specific return rate
 */
function calculateMonthlyPayment(params, returnRate) {
  const { currentAmount, targetAmount, timeHorizon } = params;
  const monthlyRate = returnRate / 100 / 12;
  const futureValueCurrent = currentAmount * Math.pow(1 + monthlyRate, timeHorizon * 12);
  const remainingNeeded = targetAmount - futureValueCurrent;
  
  if (remainingNeeded <= 0) return 0;
  
  return (remainingNeeded * monthlyRate) / (Math.pow(1 + monthlyRate, timeHorizon * 12) - 1);
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(scenarios) {
  const conservativePayment = scenarios.scenarios[0].monthlyPayment;
  const moderatePayment = scenarios.scenarios[1].monthlyPayment;
  
  return [
    {
      type: 'payment_strategy',
      title: 'Start Conservative, Increase Over Time',
      description: `Begin with $${conservativePayment}/month, then increase by 3-5% annually as income grows`,
      priority: 'high'
    },
    {
      type: 'tax_optimization',
      title: 'Maximize Tax-Advantaged Accounts',
      description: 'Use 401(k) and IRA to reduce taxes and boost effective returns by 20-30%',
      priority: 'high'
    },
    {
      type: 'automation',
      title: 'Automate Your Success',
      description: 'Set up automatic transfers on payday to remove temptation and ensure consistency',
      priority: 'medium'
    },
    {
      type: 'flexibility',
      title: 'Build in Flexibility',
      description: `Target $${moderatePayment}/month but adjust based on life circumstances and market conditions`,
      priority: 'medium'
    }
  ];
}

export default router;
