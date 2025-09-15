import React from 'react';
import { Lightbulb, TrendingUp, Shield, DollarSign, Target, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const PortfolioRecommendations = ({ financialData, goalsData, portfolioData }) => {
  // Generate personalized recommendations based on financial health and goals
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Check if we have the necessary data
    if (!financialData || !goalsData) {
      return [{
        type: 'info',
        priority: 'medium',
        title: 'Complete Your Profile',
        description: 'Add your financial information and goals above to get personalized investment recommendations.',
        action: 'Fill out the sections above',
        icon: AlertCircle
      }];
    }

    const { healthScore, investmentCapacity, monthlyIncome, monthlyExpenses, totalDebt, emergencyFund } = financialData;
    const { goals, riskTolerance } = goalsData;

    // Emergency Fund Check
    if (emergencyFund < monthlyExpenses * 3) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Build Emergency Fund First',
        description: `You currently have ${Math.round(emergencyFund / monthlyExpenses)} months of expenses saved. Aim for at least 3-6 months before aggressive investing.`,
        action: 'Allocate $' + Math.round((monthlyExpenses * 3 - emergencyFund) / 12) + '/month to emergency fund',
        icon: Shield
      });
    }

    // High-Interest Debt Check
    if (totalDebt > monthlyIncome * 6) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Pay Down High-Interest Debt',
        description: 'Your debt-to-income ratio is high. Focus on paying down high-interest debt (credit cards, personal loans) before investing.',
        action: 'Consider debt avalanche or snowball method',
        icon: AlertCircle
      });
    }

    // Investment Allocation Recommendations
    if (investmentCapacity > 0) {
      // 401(k) Match
      recommendations.push({
        type: 'success',
        priority: 'high',
        title: 'Max Out Employer 401(k) Match',
        description: 'If your employer offers a 401(k) match, contribute at least enough to get the full match - it\'s free money!',
        action: 'Check with HR about your 401(k) match percentage',
        icon: DollarSign
      });

      // Roth IRA
      if (monthlyIncome < 12000) { // Rough Roth IRA income limit check
        recommendations.push({
          type: 'success',
          priority: 'medium',
          title: 'Open a Roth IRA',
          description: 'Your income qualifies for a Roth IRA. Contribute up to $6,500/year ($7,500 if 50+) for tax-free growth.',
          action: 'Open Roth IRA with Vanguard, Fidelity, or Schwab',
          icon: TrendingUp
        });
      }

      // Taxable Account
      if (investmentCapacity > 500) {
        recommendations.push({
          type: 'info',
          priority: 'medium',
          title: 'Start Taxable Investment Account',
          description: 'After maxing retirement accounts, invest in a taxable brokerage account for flexibility.',
          action: 'Open account and start with index funds',
          icon: TrendingUp
        });
      }
    }

    // Goal-Specific Recommendations
    goals.forEach(goal => {
      const monthlyNeeded = Math.round(goal.targetAmount / (goal.timeHorizon * 12));
      const allocation = getRecommendedAllocation(goal.timeHorizon, riskTolerance);
      
      recommendations.push({
        type: 'info',
        priority: 'medium',
        title: `Investment Strategy for ${goal.name}`,
        description: `For your ${goal.timeHorizon}-year goal, we recommend ${allocation}. You need to save $${monthlyNeeded}/month.`,
        action: `Set up automatic investment of $${monthlyNeeded}/month`,
        icon: Target
      });
    });

    // Portfolio Diversification (if they have existing portfolio)
    if (portfolioData && portfolioData.holdings && Object.keys(portfolioData.holdings).length > 0) {
      recommendations.push({
        type: 'info',
        priority: 'low',
        title: 'Review Portfolio Diversification',
        description: 'Based on your current holdings, ensure proper diversification across asset classes and sectors.',
        action: 'Use our portfolio optimization tool',
        icon: Shield
      });
    }

    return recommendations;
  };

  const getRecommendedAllocation = (timeHorizon, riskTolerance) => {
    if (timeHorizon < 3) {
      return '20% stocks (bond index funds), 80% bonds/cash';
    } else if (timeHorizon < 10) {
      if (riskTolerance === 'conservative') return '40% stocks, 60% bonds';
      if (riskTolerance === 'moderate') return '60% stocks, 40% bonds';
      return '70% stocks, 30% bonds';
    } else {
      if (riskTolerance === 'conservative') return '60% stocks, 40% bonds';
      if (riskTolerance === 'moderate') return '80% stocks, 20% bonds';
      return '90% stocks, 10% bonds';
    }
  };

  const recommendations = generateRecommendations();

  // Sort by priority
  const sortedRecommendations = recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
          <Lightbulb className="w-8 h-8 mr-3 text-yellow-500" />
          Personalized Investment Recommendations
        </h3>
        <p className="text-gray-600">AI-powered recommendations based on your financial health, goals, and risk profile</p>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedRecommendations.map((rec, index) => {
          const Icon = rec.icon;
          const bgColor = rec.type === 'warning' ? 'red' : rec.type === 'success' ? 'green' : 'blue';
          const priorityBadgeColor = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'gray';
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-6 bg-gradient-to-r from-${bgColor}-50 to-white border-${bgColor}-200`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-${bgColor}-100`}>
                  <Icon className={`w-6 h-6 text-${bgColor}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium bg-${priorityBadgeColor}-100 text-${priorityBadgeColor}-800 rounded-full`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{rec.description}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`font-medium text-${bgColor}-700`}>Action:</span>
                    <span className="text-gray-700">{rec.action}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      {financialData && goalsData && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Investment Action Plan</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Monthly Investment Capacity</h5>
              <p className="text-2xl font-bold text-purple-800">
                ${financialData.investmentCapacity?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Available after expenses</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Total Goal Amount</h5>
              <p className="text-2xl font-bold text-purple-800">
                ${goalsData.goals?.reduce((sum, goal) => sum + parseInt(goal.targetAmount || 0), 0).toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Across {goalsData.goals?.length || 0} goals</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Risk Profile</h5>
              <p className="text-2xl font-bold text-purple-800 capitalize">
                {goalsData.riskTolerance || 'Not Set'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Investment style</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              <CheckCircle className="inline w-4 h-4 mr-2" />
              <strong>Next Steps:</strong> Follow the high-priority recommendations above to optimize your investment strategy. 
              Remember to review and adjust your plan quarterly as your financial situation changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRecommendations;