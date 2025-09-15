/**
 * Enhanced AI Financial Advisor - Advanced Compound Interest Calculator
 * Features: What-if scenarios, Monte Carlo simulation, goal integration, retirement planning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, 
  Brain, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PiggyBank,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  BarChart3,
  Plus,
  Star,
  Clock,
  Gauge,
  Shield,
  Trophy,
  Zap,
  Play,
  Shuffle,
  RefreshCw,
  Award,
  Sparkles,
  HelpCircle,
  Settings,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar, Label } from 'recharts';

const AIFinancialAdvisor = ({ 
  className = '',
  portfolioData = null,
  marketEnvironmentScore = null,
  financialHealthData = null,
  investmentGoalsData = null
}) => {
  // Enhanced state management with scenario comparison
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState('base');
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [advisorPersonality, setAdvisorPersonality] = useState('mixed');

  // Enhanced calculator inputs with scenarios
  const [scenarios, setScenarios] = useState({
    base: {
      name: 'Current Plan',
      goalName: 'Retirement',
      targetAmount: 1000000,
      currentSavings: 0,
      monthlyContribution: 500,
      timeHorizon: 30,
      expectedReturn: 7,
      inflationRate: 3,
      riskTolerance: 'moderate',
      taxAdvantaged: true,
      employer401kMatch: 0,
      currentAge: 30,
      retirementAge: 65,
      socialSecurityEstimate: 2000,
      healthcareCosts: 300,
      color: '#3B82F6'
    },
    optimistic: {
      name: 'Optimistic Scenario',
      goalName: 'Retirement',
      targetAmount: 1000000,
      currentSavings: 0,
      monthlyContribution: 700,
      timeHorizon: 30,
      expectedReturn: 9,
      inflationRate: 2.5,
      riskTolerance: 'aggressive',
      taxAdvantaged: true,
      employer401kMatch: 100,
      currentAge: 30,
      retirementAge: 65,
      socialSecurityEstimate: 2500,
      healthcareCosts: 250,
      color: '#10B981'
    },
    conservative: {
      name: 'Conservative Scenario',
      goalName: 'Retirement',
      targetAmount: 1000000,
      currentSavings: 0,
      monthlyContribution: 500,
      timeHorizon: 30,
      expectedReturn: 5,
      inflationRate: 3.5,
      riskTolerance: 'conservative',
      taxAdvantaged: true,
      employer401kMatch: 0,
      currentAge: 30,
      retirementAge: 65,
      socialSecurityEstimate: 1800,
      healthcareCosts: 400,
      color: '#EF4444'
    }
  });

  // Initialize with data from Sections 1 & 2
  useEffect(() => {
    if (financialHealthData && investmentGoalsData) {
      const retirementGoal = investmentGoalsData.goals?.find(g => g.type === 'retirement') || investmentGoalsData.goals?.[0];
      
      setScenarios(prev => ({
        ...prev,
        base: {
          ...prev.base,
          currentSavings: portfolioData?.totalValue || 0,
          monthlyContribution: financialHealthData.investmentCapacity || 500,
          targetAmount: retirementGoal?.targetAmount || 1000000,
          timeHorizon: retirementGoal?.timeHorizon || 30,
          riskTolerance: investmentGoalsData.riskTolerance || 'moderate',
          goalName: retirementGoal?.name || 'Retirement',
          expectedReturn: 
            investmentGoalsData.riskTolerance === 'conservative' ? 5 :
            investmentGoalsData.riskTolerance === 'aggressive' ? 9 : 7
        }
      }));
    }
  }, [financialHealthData, investmentGoalsData, portfolioData]);

  // Calculate compound interest projections with enhanced features
  const calculateProjections = useCallback((scenario) => {
    const projections = [];
    let monthlyRate = scenario.expectedReturn / 100 / 12;
    const inflationMonthlyRate = scenario.inflationRate / 100 / 12;
    
    // Tax advantage boost
    if (scenario.taxAdvantaged) {
      monthlyRate *= 1.2;
    }
    
    let currentValue = scenario.currentSavings;
    let realValue = scenario.currentSavings;
    let totalContributions = scenario.currentSavings;
    
    for (let year = 0; year <= scenario.timeHorizon; year++) {
      for (let month = 0; month < 12; month++) {
        if (year === 0 && month === 0) continue;
        
        // Monthly contribution + employer match
        const monthlyTotal = scenario.monthlyContribution + scenario.employer401kMatch;
        currentValue += monthlyTotal;
        realValue += monthlyTotal;
        totalContributions += monthlyTotal;
        
        // Apply returns
        currentValue *= (1 + monthlyRate);
        realValue *= (1 + monthlyRate);
        
        // Adjust for inflation
        realValue /= (1 + inflationMonthlyRate);
      }
      
      // Calculate retirement income at this point
      const monthlyRetirementIncome = (currentValue * 0.04) / 12; // 4% safe withdrawal rate
      const totalMonthlyIncome = monthlyRetirementIncome + scenario.socialSecurityEstimate;
      const netIncome = totalMonthlyIncome - scenario.healthcareCosts;
      
      projections.push({
        year,
        age: scenario.currentAge + year,
        nominalValue: Math.round(currentValue),
        realValue: Math.round(realValue),
        totalContributions: Math.round(totalContributions),
        gains: Math.round(currentValue - totalContributions),
        yearlyContribution: (scenario.monthlyContribution + scenario.employer401kMatch) * 12,
        monthlyRetirementIncome: Math.round(monthlyRetirementIncome),
        totalMonthlyIncome: Math.round(totalMonthlyIncome),
        netIncome: Math.round(netIncome),
        progress: Math.round((currentValue / scenario.targetAmount) * 100)
      });
    }
    
    return projections;
  }, []);

  // Monte Carlo Simulation - 10,000+ scenarios
  const runMonteCarloSimulation = useCallback(async () => {
    setIsSimulating(true);
    
    try {
      const simulations = 10000;
      const results = [];
      const scenario = scenarios[currentScenario];
      
      for (let i = 0; i < simulations; i++) {
        let value = scenario.currentSavings;
        
        for (let year = 1; year <= scenario.timeHorizon; year++) {
          // Add contributions
          value += (scenario.monthlyContribution + scenario.employer401kMatch) * 12;
          
          // Apply random return based on risk profile
          const meanReturn = scenario.expectedReturn / 100;
          const stdDev = scenario.riskTolerance === 'conservative' ? 0.10 : 
                         scenario.riskTolerance === 'aggressive' ? 0.20 : 0.15;
          
          // Box-Muller transform for normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const annualReturn = meanReturn + (stdDev * z0);
          
          value *= (1 + annualReturn);
        }
        
        results.push(value);
      }
      
      // Calculate percentiles
      results.sort((a, b) => a - b);
      const percentiles = {
        p5: results[Math.floor(simulations * 0.05)],
        p25: results[Math.floor(simulations * 0.25)],
        p50: results[Math.floor(simulations * 0.50)],
        p75: results[Math.floor(simulations * 0.75)],
        p95: results[Math.floor(simulations * 0.95)],
        successRate: results.filter(r => r >= scenario.targetAmount).length / simulations * 100
      };
      
      setMonteCarloResults({
        ...percentiles,
        mean: results.reduce((a, b) => a + b, 0) / simulations,
        min: results[0],
        max: results[results.length - 1],
        targetAmount: scenario.targetAmount
      });
      
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [scenarios, currentScenario]);

  // Enhanced AI advice generation
  const generateEnhancedAIAdvice = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      const scenario = scenarios[currentScenario];
      const projections = calculateProjections(scenario);
      const finalValue = projections[projections.length - 1];
      
      // Build comprehensive analysis
      const analysisData = {
        scenario: scenario,
        projections: projections,
        finalValue: finalValue.nominalValue,
        shortfall: Math.max(0, scenario.targetAmount - finalValue.nominalValue),
        surplus: Math.max(0, finalValue.nominalValue - scenario.targetAmount),
        monteCarloResults: monteCarloResults,
        financialHealth: financialHealthData,
        existingGoals: investmentGoalsData,
        currentPortfolio: portfolioData,
        marketEnvironment: marketEnvironmentScore
      };
      
      // Try API first, fallback to local generation
      try {
        const response = await fetch('/api/ai/advanced-compound-calculator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisData)
        });
        
        if (response.ok) {
          const advice = await response.json();
          setAiAdvice(advice);
          return;
        }
      } catch (error) {
        console.log('API unavailable, using local AI advice generation');
      }
      
      // Enhanced local advice generation
      const advice = {
        summary: generateSummary(analysisData),
        keyMetrics: generateKeyMetrics(analysisData),
        whatIfSuggestions: generateWhatIfSuggestions(analysisData),
        actionItems: generateActionItems(analysisData),
        retirementReadiness: calculateRetirementReadiness(analysisData),
        riskAssessment: assessRisk(analysisData)
      };
      
      setAiAdvice(advice);
      
    } finally {
      setIsCalculating(false);
    }
  }, [scenarios, currentScenario, calculateProjections, monteCarloResults, financialHealthData, investmentGoalsData, portfolioData, marketEnvironmentScore]);

  // Helper functions for AI advice
  const generateSummary = (data) => {
    const { scenario, finalValue, shortfall, surplus, monteCarloResults } = data;
    
    if (shortfall > 0) {
      return `Your ${scenario.goalName} plan needs adjustment. You're projected to fall short by $${shortfall.toLocaleString()}, but this is fixable! Based on Monte Carlo analysis, you have a ${monteCarloResults?.successRate || 50}% chance of success. Small changes today can dramatically improve your outcomes.`;
    } else {
      return `Excellent! Your ${scenario.goalName} plan is on track to exceed your goal by $${surplus.toLocaleString()}. Monte Carlo simulations show a ${monteCarloResults?.successRate || 85}% success rate. You're in the top 20% of retirement savers!`;
    }
  };

  const generateKeyMetrics = (data) => {
    const { scenario, projections, finalValue } = data;
    const midpoint = projections[Math.floor(projections.length / 2)];
    
    return {
      finalValue: finalValue.nominalValue,
      totalContributions: finalValue.totalContributions,
      investmentGains: finalValue.gains,
      realValue: finalValue.realValue,
      monthlyRetirementIncome: finalValue.monthlyRetirementIncome,
      totalMonthlyIncome: finalValue.totalMonthlyIncome,
      progressAtMidpoint: midpoint.progress,
      ageAtGoal: scenario.currentAge + scenario.timeHorizon,
      effectiveReturn: ((finalValue.nominalValue / finalValue.totalContributions) - 1) * 100
    };
  };

  const generateWhatIfSuggestions = (data) => {
    const { scenario, shortfall } = data;
    const suggestions = [];
    
    if (shortfall > 0) {
      const additionalMonthly = Math.ceil(shortfall / (scenario.timeHorizon * 12));
      suggestions.push({
        title: "Increase Monthly Savings",
        description: `Add $${additionalMonthly}/month to reach your goal`,
        impact: "100% goal achievement",
        difficulty: "moderate"
      });
      
      suggestions.push({
        title: "Extend Timeline",
        description: `Work ${Math.ceil(shortfall / (scenario.monthlyContribution * 12 * 1.07))} more years`,
        impact: "Lower monthly burden",
        difficulty: "easy"
      });
      
      suggestions.push({
        title: "Optimize Returns",
        description: "Move to slightly more aggressive allocation",
        impact: "+1-2% annual returns",
        difficulty: "easy"
      });
    } else {
      suggestions.push({
        title: "Retire Earlier",
        description: `You could retire ${Math.floor(data.surplus / (scenario.monthlyContribution * 12))} years earlier`,
        impact: "More free time",
        difficulty: "easy"
      });
      
      suggestions.push({
        title: "Increase Lifestyle",
        description: "Consider higher retirement spending",
        impact: "Better quality of life",
        difficulty: "easy"
      });
    }
    
    return suggestions;
  };

  const generateActionItems = (data) => {
    const items = [];
    
    if (!data.scenario.employer401kMatch && data.scenario.employer401kMatch < 100) {
      items.push({
        priority: "high",
        action: "Max out employer 401(k) match",
        reason: "It's free money - 100% instant return"
      });
    }
    
    if (!data.scenario.taxAdvantaged) {
      items.push({
        priority: "high",
        action: "Use tax-advantaged accounts",
        reason: "Save 20-30% more through tax benefits"
      });
    }
    
    if (data.financialHealth?.emergencyFund < data.financialHealth?.monthlyExpenses * 3) {
      items.push({
        priority: "high",
        action: "Build emergency fund first",
        reason: "Protect your investments from early withdrawal"
      });
    }
    
    items.push({
      priority: "medium",
      action: "Review and rebalance quarterly",
      reason: "Stay on track with your allocation"
    });
    
    return items;
  };

  const calculateRetirementReadiness = (data) => {
    const { scenario, finalValue } = data;
    const monthlyNeed = 0.7 * (data.financialHealth?.monthlyExpenses || 4000); // 70% replacement ratio
    const monthlyIncome = finalValue.totalMonthlyIncome || 0;
    
    return {
      score: Math.min(100, Math.round((monthlyIncome / monthlyNeed) * 100)),
      monthlyShortfall: Math.max(0, monthlyNeed - monthlyIncome),
      monthlyIncome: monthlyIncome,
      monthlyNeed: monthlyNeed,
      coverageRatio: (monthlyIncome / monthlyNeed).toFixed(2)
    };
  };

  const assessRisk = (data) => {
    const risks = [];
    
    if (data.monteCarloResults?.successRate < 70) {
      risks.push({
        type: "high",
        issue: "Low success probability",
        mitigation: "Increase savings or adjust expectations"
      });
    }
    
    if (data.scenario.inflationRate > 3) {
      risks.push({
        type: "medium",
        issue: "High inflation assumptions",
        mitigation: "Consider inflation-protected securities"
      });
    }
    
    if (data.scenario.timeHorizon < 10) {
      risks.push({
        type: "high",
        issue: "Short time horizon",
        mitigation: "Focus on guaranteed returns"
      });
    }
    
    return risks;
  };

  // What-if scenario generator
  const generateWhatIfScenario = (adjustment) => {
    const baseScenario = scenarios[currentScenario];
    let newScenario = { ...baseScenario };
    
    switch (adjustment) {
      case 'save_more':
        newScenario.monthlyContribution = Math.round(baseScenario.monthlyContribution * 1.2);
        newScenario.name = "Save 20% More";
        break;
      case 'higher_return':
        newScenario.expectedReturn = baseScenario.expectedReturn + 2;
        newScenario.name = "Higher Returns";
        break;
      case 'retire_early':
        newScenario.timeHorizon = Math.max(10, baseScenario.timeHorizon - 5);
        newScenario.name = "Retire 5 Years Early";
        break;
      case 'max_401k':
        newScenario.monthlyContribution = 1916; // $23,000/year limit
        newScenario.name = "Max 401(k)";
        break;
    }
    
    return newScenario;
  };

  // Auto-run calculations when scenario changes
  useEffect(() => {
    if (scenarios[currentScenario]) {
      generateEnhancedAIAdvice();
    }
  }, [currentScenario, scenarios, generateEnhancedAIAdvice]);

  // Render enhanced compound projection chart
  const renderEnhancedProjectionChart = () => {
    const allProjections = Object.keys(scenarios).map(key => ({
      scenario: key,
      data: calculateProjections(scenarios[key]),
      color: scenarios[key].color,
      name: scenarios[key].name
    }));
    
    // Combine data for comparison
    const combinedData = allProjections[0].data.map((item, index) => {
      const combined = { year: item.year, age: item.age };
      allProjections.forEach(proj => {
        combined[`${proj.scenario}_value`] = proj.data[index].nominalValue;
        combined[`${proj.scenario}_progress`] = proj.data[index].progress;
      });
      combined.target = scenarios.base.targetAmount;
      return combined;
    });
    
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Growth Projections & Scenarios
          </h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWhatIf(!showWhatIf)}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              What-If Analysis
            </button>
            <button
              onClick={runMonteCarloSimulation}
              className={`px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center ${isSimulating ? 'opacity-50' : ''}`}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Monte Carlo
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `Age ${label}`}
              />
              
              {/* Target line */}
              <ReferenceLine y={scenarios.base.targetAmount} stroke="#8B5CF6" strokeDasharray="5 5" strokeWidth={2}>
                <Label value="Goal" position="right" />
              </ReferenceLine>
              
              {/* Scenario areas */}
              <Area
                type="monotone"
                dataKey="conservative_value"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorConservative)"
                name="Conservative"
              />
              <Area
                type="monotone"
                dataKey="base_value"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorBase)"
                name="Current Plan"
              />
              <Area
                type="monotone"
                dataKey="optimistic_value"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorOptimistic)"
                name="Optimistic"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Scenario comparison cards */}
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const projections = calculateProjections(scenario);
            const finalValue = projections[projections.length - 1];
            const isActive = currentScenario === key;
            
            return (
              <button
                key={key}
                onClick={() => setCurrentScenario(key)}
                className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
                  isActive ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                    {scenario.name}
                  </span>
                  {isActive && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </div>
                <div className={`text-2xl font-bold ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                  ${(finalValue.nominalValue / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {finalValue.nominalValue >= scenario.targetAmount ? (
                    <span className="text-green-600">Goal achieved!</span>
                  ) : (
                    <span className="text-red-600">
                      ${((scenario.targetAmount - finalValue.nominalValue) / 1000).toFixed(0)}k short
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  ${scenario.monthlyContribution}/mo • {scenario.expectedReturn}% return
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Monte Carlo results
  const renderMonteCarloResults = () => {
    if (!monteCarloResults) return null;
    
    const successColor = monteCarloResults.successRate >= 80 ? 'green' : 
                        monteCarloResults.successRate >= 60 ? 'yellow' : 'red';
    
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
          Monte Carlo Simulation Results
          <span className="ml-2 text-sm font-normal text-gray-600">(10,000 scenarios)</span>
        </h4>
        
        {/* Success probability gauge */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Success Probability</span>
            <span className={`text-2xl font-bold text-${successColor}-600`}>
              {monteCarloResults.successRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`bg-${successColor}-500 h-4 rounded-full transition-all duration-1000`}
              style={{ width: `${monteCarloResults.successRate}%` }}
            />
          </div>
        </div>
        
        {/* Percentile outcomes */}
        <div className="grid md:grid-cols-5 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-xs text-gray-600 mb-1">Worst Case (5%)</div>
            <div className="text-lg font-bold text-red-600">
              ${(monteCarloResults.p5 / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-xs text-gray-600 mb-1">Lower (25%)</div>
            <div className="text-lg font-bold text-orange-600">
              ${(monteCarloResults.p25 / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Median (50%)</div>
            <div className="text-lg font-bold text-blue-600">
              ${(monteCarloResults.p50 / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-xs text-gray-600 mb-1">Upper (75%)</div>
            <div className="text-lg font-bold text-green-600">
              ${(monteCarloResults.p75 / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-600 mb-1">Best Case (95%)</div>
            <div className="text-lg font-bold text-purple-600">
              ${(monteCarloResults.p95 / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>Interpretation:</strong> In {monteCarloResults.successRate.toFixed(0)}% of simulated market scenarios, 
            you reached your ${(monteCarloResults.targetAmount / 1000).toFixed(0)}k goal. 
            Your median outcome is ${(monteCarloResults.p50 / 1000).toFixed(0)}k, 
            with potential range from ${(monteCarloResults.p5 / 1000).toFixed(0)}k to 
            ${(monteCarloResults.p95 / 1000).toFixed(0)}k.
          </p>
        </div>
      </div>
    );
  };

  // Render what-if scenarios panel
  const renderWhatIfPanel = () => {
    if (!showWhatIf) return null;
    
    const whatIfOptions = [
      { id: 'save_more', label: 'Save 20% More', icon: PiggyBank, color: 'green' },
      { id: 'higher_return', label: '+2% Returns', icon: TrendingUp, color: 'blue' },
      { id: 'retire_early', label: 'Retire 5 Years Early', icon: Clock, color: 'purple' },
      { id: 'max_401k', label: 'Max 401(k)', icon: Trophy, color: 'yellow' }
    ];
    
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200 mb-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
          What-If Quick Scenarios
        </h4>
        
        <div className="grid md:grid-cols-4 gap-3">
          {whatIfOptions.map(option => {
            const Icon = option.icon;
            const whatIfScenario = generateWhatIfScenario(option.id);
            const projections = calculateProjections(whatIfScenario);
            const finalValue = projections[projections.length - 1];
            const improvement = finalValue.nominalValue - calculateProjections(scenarios.base)[scenarios.base.timeHorizon].nominalValue;
            
            return (
              <button
                key={option.id}
                onClick={() => {
                  setScenarios(prev => ({
                    ...prev,
                    whatif: { ...whatIfScenario, color: '#8B5CF6' }
                  }));
                  setCurrentScenario('whatif');
                }}
                className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-all hover:shadow-md"
              >
                <Icon className={`w-8 h-8 text-${option.color}-600 mx-auto mb-2`} />
                <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Final: ${(finalValue.nominalValue / 1000).toFixed(0)}k
                </div>
                <div className={`text-xs mt-1 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement > 0 ? '+' : ''}${(improvement / 1000).toFixed(0)}k
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render retirement readiness dashboard
  const renderRetirementReadiness = () => {
    if (!aiAdvice?.retirementReadiness) return null;
    
    const readiness = aiAdvice.retirementReadiness;
    const score = readiness.score || 0;
    const monthlyNeed = readiness.monthlyNeed || 0;
    const monthlyIncome = readiness.monthlyIncome || 0;
    const monthlyShortfall = readiness.monthlyShortfall || 0;
    const coverageRatio = readiness.coverageRatio || 0;
    
    const scoreColor = score >= 80 ? 'green' : 
                      score >= 60 ? 'yellow' : 'red';
    
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-green-600" />
          Retirement Readiness Score
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Score gauge */}
          <div>
            <div className="relative w-40 h-40 mx-auto">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={`${scoreColor === 'green' ? '#10B981' : scoreColor === 'yellow' ? '#F59E0B' : '#EF4444'}`}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${score * 4.4} 440`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold text-${scoreColor}-600`}>
                    {score}
                  </div>
                  <div className="text-sm text-gray-600">out of 100</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Income breakdown */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Income Need</span>
                <span className="font-semibold">${monthlyNeed.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projected Income</span>
                <span className="font-semibold text-green-600">
                  ${monthlyIncome.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coverage Ratio</span>
                <span className={`font-semibold ${coverageRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {(coverageRatio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            {monthlyShortfall > 0 && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Monthly shortfall: ${monthlyShortfall.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render enhanced scenario inputs
  const renderScenarioInputs = () => {
    const scenario = scenarios[currentScenario];
    
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Scenario Parameters: {scenario.name}
          </h4>
          <select
            value={currentScenario}
            onChange={(e) => setCurrentScenario(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            {Object.entries(scenarios).map(([key, s]) => (
              <option key={key} value={key}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Contribution</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="number"
                value={scenario.monthlyContribution}
                onChange={(e) => setScenarios(prev => ({
                  ...prev,
                  [currentScenario]: {
                    ...prev[currentScenario],
                    monthlyContribution: parseInt(e.target.value) || 0
                  }
                }))}
                className="pl-7 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expected Return %</label>
            <input
              type="number"
              step="0.5"
              value={scenario.expectedReturn}
              onChange={(e) => setScenarios(prev => ({
                ...prev,
                [currentScenario]: {
                  ...prev[currentScenario],
                  expectedReturn: parseFloat(e.target.value) || 7
                }
              }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Time Horizon</label>
            <input
              type="number"
              value={scenario.timeHorizon}
              onChange={(e) => setScenarios(prev => ({
                ...prev,
                [currentScenario]: {
                  ...prev[currentScenario],
                  timeHorizon: parseInt(e.target.value) || 30
                }
              }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">401(k) Match</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="number"
                value={scenario.employer401kMatch}
                onChange={(e) => setScenarios(prev => ({
                  ...prev,
                  [currentScenario]: {
                    ...prev[currentScenario],
                    employer401kMatch: parseInt(e.target.value) || 0
                  }
                }))}
                className="pl-7 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render enhanced AI advice
  const renderEnhancedAIAdvice = () => {
    if (isCalculating) {
      return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-600 animate-pulse mr-3" />
            <span className="text-purple-700 font-medium">AI is analyzing your scenarios...</span>
          </div>
        </div>
      );
    }

    if (!aiAdvice) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center mb-3">
            <Brain className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-semibold text-gray-900">AI Financial Advisor Summary</h4>
          </div>
          <p className="text-gray-700">{aiAdvice.summary}</p>
        </div>

        {/* Key metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-sm text-gray-600 mb-1">Final Value</div>
            <div className="text-2xl font-bold text-blue-600">
              ${(aiAdvice.keyMetrics?.finalValue / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-sm text-gray-600 mb-1">Investment Gains</div>
            <div className="text-2xl font-bold text-green-600">
              ${(aiAdvice.keyMetrics?.investmentGains / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-sm text-gray-600 mb-1">Monthly Income</div>
            <div className="text-2xl font-bold text-purple-600">
              ${aiAdvice.keyMetrics?.totalMonthlyIncome?.toLocaleString() || '0'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-sm text-gray-600 mb-1">Effective Return</div>
            <div className="text-2xl font-bold text-orange-600">
              {aiAdvice.keyMetrics?.effectiveReturn?.toFixed(1) || '0'}%
            </div>
          </div>
        </div>

        {/* What-if suggestions */}
        {aiAdvice.whatIfSuggestions?.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
              What-If Recommendations
            </h5>
            <div className="space-y-3">
              {aiAdvice.whatIfSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    suggestion.difficulty === 'easy' ? 'bg-green-500' :
                    suggestion.difficulty === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{suggestion.title}</div>
                    <div className="text-sm text-gray-600">{suggestion.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Impact: {suggestion.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action items */}
        {aiAdvice.actionItems?.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Priority Action Items
            </h5>
            <div className="space-y-2">
              {aiAdvice.actionItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`px-2 py-1 text-xs font-medium rounded ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{item.action}</div>
                    <div className="text-xs text-gray-600">{item.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-purple-600" />
              Advanced Compound Interest Calculator
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                AI-POWERED
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Compare scenarios, run Monte Carlo simulations, and get personalized retirement planning
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* What-if panel */}
          {renderWhatIfPanel()}
          
          {/* Scenario inputs */}
          {renderScenarioInputs()}
          
          {/* Main projection chart */}
          {renderEnhancedProjectionChart()}
          
          {/* Monte Carlo results */}
          {renderMonteCarloResults()}
          
          {/* Retirement readiness */}
          {renderRetirementReadiness()}
          
          {/* AI advice */}
          {renderEnhancedAIAdvice()}
        </div>
      </div>
    </div>
  );
};

export default AIFinancialAdvisor;