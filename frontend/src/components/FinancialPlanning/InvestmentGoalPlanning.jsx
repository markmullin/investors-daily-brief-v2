import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Home, School, Briefcase, PiggyBank, TrendingUp, Calendar, Shield, HelpCircle, 
  User, Lock, Mail, Calculator, Brain, DollarSign, AlertTriangle, Lightbulb, CheckCircle,
  BarChart3, Plus, Star, Clock, Gauge, Trophy, Zap, Play, Shuffle, RefreshCw, Award,
  Sparkles, Settings, TrendingDown, ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar, Label } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const InvestmentGoalPlanning = ({ onGoalsUpdate, onAccountSetup }) => {
  const { requireAuth, user, setShowLoginModal } = useAuth();
  
  const [goals, setGoals] = useState([]);
  const [riskTolerance, setRiskTolerance] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [activeGoalCalculator, setActiveGoalCalculator] = useState(null);
  
  // Goal form state
  const [newGoal, setNewGoal] = useState({
    type: '',
    name: '',
    targetAmount: '',
    timeHorizon: '',
    monthlyContribution: ''
  });

  // Account setup state
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // AI Calculator state (from AIFinancialAdvisor)
  const [currentScenario, setCurrentScenario] = useState('base');
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Calculator scenarios
  const [scenarios, setScenarios] = useState({
    base: {
      name: 'Current Plan',
      goalName: 'Your Goal',
      targetAmount: 100000,
      currentSavings: 0,
      monthlyContribution: 500,
      timeHorizon: 10,
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
    }
  });

  // Load user's saved goals if logged in
  useEffect(() => {
    if (user) {
      const savedGoals = localStorage.getItem(`userGoals_${user.id}`);
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        setGoals(parsed.goals || []);
        setRiskTolerance(parsed.riskTolerance || '');
      }
    }
  }, [user]);

  const goalTypes = [
    { id: 'retirement', label: 'Retirement', icon: Briefcase, color: 'blue' },
    { id: 'house', label: 'Buy a House', icon: Home, color: 'green' },
    { id: 'education', label: 'Education', icon: School, color: 'purple' },
    { id: 'emergency', label: 'Emergency Fund', icon: Shield, color: 'red' },
    { id: 'other', label: 'Other Goal', icon: PiggyBank, color: 'yellow' }
  ];

  const riskLevels = [
    { 
      level: 'conservative', 
      label: 'Conservative', 
      description: 'Preserve capital, minimal volatility',
      allocation: '20% stocks, 80% bonds',
      expectedReturn: 5
    },
    { 
      level: 'moderate', 
      label: 'Moderate', 
      description: 'Balanced growth and stability',
      allocation: '60% stocks, 40% bonds',
      expectedReturn: 7
    },
    { 
      level: 'aggressive', 
      label: 'Aggressive', 
      description: 'Maximum growth, higher volatility',
      allocation: '90% stocks, 10% bonds',
      expectedReturn: 9
    }
  ];

  const addGoal = () => {
    if (newGoal.type && newGoal.targetAmount && newGoal.timeHorizon) {
      requireAuth(() => {
        const goal = {
          ...newGoal,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          progress: 0
        };
        
        const updatedGoals = [...goals, goal];
        setGoals(updatedGoals);
        
        // Save to user's account
        if (user) {
          localStorage.setItem(`userGoals_${user.id}`, JSON.stringify({ goals: updatedGoals, riskTolerance }));
        }
        
        // Notify parent
        if (onGoalsUpdate) {
          onGoalsUpdate({ goals: updatedGoals, riskTolerance });
        }
        
        // Auto-populate calculator with this goal
        setActiveGoalCalculator(goal.id);
        const expectedReturn = riskTolerance === 'conservative' ? 5 : 
                              riskTolerance === 'aggressive' ? 9 : 7;
        
        setScenarios(prev => ({
          ...prev,
          base: {
            ...prev.base,
            goalName: goal.name,
            targetAmount: parseFloat(goal.targetAmount),
            timeHorizon: parseFloat(goal.timeHorizon),
            monthlyContribution: goal.monthlyContribution || Math.round(goal.targetAmount / (goal.timeHorizon * 12)),
            expectedReturn: expectedReturn,
            riskTolerance: riskTolerance || 'moderate'
          }
        }));
        
        // Reset form
        setNewGoal({
          type: '',
          name: '',
          targetAmount: '',
          timeHorizon: '',
          monthlyContribution: ''
        });
        setShowAddGoal(false);
        
        // Scroll to calculator
        setTimeout(() => {
          document.getElementById('compound-calculator')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }
  };

  const removeGoal = (goalId) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    
    // Save to user's account
    if (user) {
      localStorage.setItem(`userGoals_${user.id}`, JSON.stringify({ goals: updatedGoals, riskTolerance }));
    }
    
    if (onGoalsUpdate) {
      onGoalsUpdate({ goals: updatedGoals, riskTolerance });
    }
    
    if (activeGoalCalculator === goalId) {
      setActiveGoalCalculator(null);
    }
  };

  const handleRiskSelection = (level) => {
    setRiskTolerance(level);
    const riskProfile = riskLevels.find(r => r.level === level);
    
    // Update base scenario with new risk tolerance
    setScenarios(prev => ({
      ...prev,
      base: {
        ...prev.base,
        riskTolerance: level,
        expectedReturn: riskProfile?.expectedReturn || 7
      }
    }));
    
    // Save to user's account
    if (user) {
      localStorage.setItem(`userGoals_${user.id}`, JSON.stringify({ goals, riskTolerance: level }));
    }
    
    if (onGoalsUpdate) {
      onGoalsUpdate({ goals, riskTolerance: level });
    }
  };

  const handleAccountSetup = (e) => {
    e.preventDefault();
    if (accountData.password !== accountData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Trigger login modal instead of custom account setup
    setShowAccountSetup(false);
    setShowLoginModal(true);
  };

  // Calculate compound interest projections
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
      
      projections.push({
        year,
        age: scenario.currentAge + year,
        nominalValue: Math.round(currentValue),
        realValue: Math.round(realValue),
        totalContributions: Math.round(totalContributions),
        gains: Math.round(currentValue - totalContributions),
        yearlyContribution: (scenario.monthlyContribution + scenario.employer401kMatch) * 12,
        progress: Math.round((currentValue / scenario.targetAmount) * 100)
      });
    }
    
    return projections;
  }, []);

  // Monte Carlo Simulation
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

  // Generate AI advice
  const generateAIAdvice = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const scenario = scenarios[currentScenario];
      const projections = calculateProjections(scenario);
      const finalValue = projections[projections.length - 1];
      const shortfall = Math.max(0, scenario.targetAmount - finalValue.nominalValue);
      const surplus = Math.max(0, finalValue.nominalValue - scenario.targetAmount);
      
      const advice = {
        summary: shortfall > 0 
          ? `You're projected to fall short by $${shortfall.toLocaleString()}, but this is fixable! Consider increasing monthly contributions or extending your timeline.`
          : `Excellent! You're on track to exceed your goal by $${surplus.toLocaleString()}.`,
        suggestions: []
      };
      
      if (shortfall > 0) {
        const additionalMonthly = Math.ceil(shortfall / (scenario.timeHorizon * 12));
        advice.suggestions.push({
          title: "Increase Monthly Savings",
          description: `Add $${additionalMonthly}/month to reach your goal`,
          impact: "100% goal achievement"
        });
      }
      
      setAiAdvice(advice);
      setIsCalculating(false);
    }, 1000);
  }, [scenarios, currentScenario, calculateProjections]);

  // Auto-calculate when goal is selected
  useEffect(() => {
    if (activeGoalCalculator) {
      generateAIAdvice();
    }
  }, [activeGoalCalculator, scenarios, generateAIAdvice]);

  const selectedGoalType = goalTypes.find(g => g.id === newGoal.type);
  const GoalIcon = selectedGoalType?.icon || Target;

  // Render calculator section
  const renderGoalCalculator = () => {
    if (!activeGoalCalculator) return null;
    
    const goal = goals.find(g => g.id === activeGoalCalculator);
    if (!goal) return null;
    
    const scenario = scenarios.base;
    const projections = calculateProjections(scenario);
    const finalValue = projections[projections.length - 1];
    
    return (
      <div id="compound-calculator" className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-purple-600" />
            AI-Powered Calculator for: {goal.name}
          </h4>
          <button
            onClick={() => setActiveGoalCalculator(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        {/* Calculator inputs */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Contribution</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="number"
                value={scenario.monthlyContribution}
                onChange={(e) => setScenarios(prev => ({
                  ...prev,
                  base: { ...prev.base, monthlyContribution: parseInt(e.target.value) || 0 }
                }))}
                className="pl-7 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
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
                base: { ...prev.base, expectedReturn: parseFloat(e.target.value) || 7 }
              }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Savings</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="number"
                value={scenario.currentSavings}
                onChange={(e) => setScenarios(prev => ({
                  ...prev,
                  base: { ...prev.base, currentSavings: parseInt(e.target.value) || 0 }
                }))}
                className="pl-7 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>
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
                  base: { ...prev.base, employer401kMatch: parseInt(e.target.value) || 0 }
                }))}
                className="pl-7 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        {/* Projection chart */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <ReferenceLine y={scenario.targetAmount} stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2}>
                  <Label value="Goal" position="right" />
                </ReferenceLine>
                <Area
                  type="monotone"
                  dataKey="nominalValue"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#colorGrowth)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Final Value</div>
            <div className="text-2xl font-bold text-purple-600">
              ${finalValue.nominalValue.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Total Contributions</div>
            <div className="text-2xl font-bold text-blue-600">
              ${finalValue.totalContributions.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Investment Gains</div>
            <div className="text-2xl font-bold text-green-600">
              ${finalValue.gains.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Monte Carlo simulation */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={runMonteCarloSimulation}
            className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center ${isSimulating ? 'opacity-50' : ''}`}
            disabled={isSimulating}
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Monte Carlo Simulation
          </button>
          
          {monteCarloResults && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Success Rate:</span>
              <span className={`text-lg font-bold ${
                monteCarloResults.successRate >= 80 ? 'text-green-600' :
                monteCarloResults.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {monteCarloResults.successRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        {/* AI advice */}
        {aiAdvice && (
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center mb-2">
              <Brain className="w-5 h-5 text-purple-600 mr-2" />
              <h5 className="font-semibold text-gray-900">AI Financial Advisor</h5>
            </div>
            <p className="text-gray-700 mb-3">{aiAdvice.summary}</p>
            
            {aiAdvice.suggestions.length > 0 && (
              <div className="space-y-2">
                {aiAdvice.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-gray-900">{suggestion.title}</div>
                    <div className="text-sm text-gray-600">{suggestion.description}</div>
                    <div className="text-xs text-purple-600 mt-1">Impact: {suggestion.impact}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <Target className="w-8 h-8 mr-3 text-purple-600" />
            Investment Goals & Account Setup
          </h3>
          <p className="text-gray-600">Set your financial goals and see how to achieve them with our AI-powered calculator</p>
        </div>

        {/* Account Setup Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Account Setup</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {user ? `Logged in as ${user.email}` : 'Create your account to save your goals and track progress'}
                </p>
              </div>
              {!user && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In / Create Account</span>
                </button>
              )}
            </div>

            {user && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800">
                  ✅ You're logged in! Your goals and progress are automatically saved to your account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Goals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Your Investment Goals</h4>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>

          {/* Add Goal Form */}
          {showAddGoal && (
            <div className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h5 className="font-semibold text-gray-900 mb-4">Create New Goal</h5>
              
              {/* Goal Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {goalTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setNewGoal({ ...newGoal, type: type.id, name: type.label })}
                        className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center space-y-1 ${
                          newGoal.type === type.id
                            ? 'border-purple-600 bg-purple-100'
                            : 'border-gray-300 hover:border-purple-400'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="My Dream House"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="100,000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Horizon (years)
                  </label>
                  <input
                    type="number"
                    value={newGoal.timeHorizon}
                    onChange={(e) => setNewGoal({ ...newGoal, timeHorizon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  Add Goal
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Goals List */}
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => {
                const goalType = goalTypes.find(t => t.id === goal.type);
                const Icon = goalType?.icon || Target;
                const monthlyNeeded = Math.round(goal.targetAmount / (goal.timeHorizon * 12));
                const isActive = activeGoalCalculator === goal.id;
                
                return (
                  <div key={goal.id} className={`rounded-lg p-6 border-2 transition-all ${
                    isActive ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg bg-${goalType?.color || 'gray'}-100`}>
                          <Icon className={`w-6 h-6 text-${goalType?.color || 'gray'}-600`} />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{goal.name}</h5>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>Target: ${parseInt(goal.targetAmount).toLocaleString()}</p>
                            <p>Timeline: {goal.timeHorizon} years</p>
                            <p>Monthly needed: ${monthlyNeeded.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setActiveGoalCalculator(goal.id);
                            const expectedReturn = riskTolerance === 'conservative' ? 5 : 
                                                 riskTolerance === 'aggressive' ? 9 : 7;
                            setScenarios(prev => ({
                              ...prev,
                              base: {
                                ...prev.base,
                                goalName: goal.name,
                                targetAmount: parseFloat(goal.targetAmount),
                                timeHorizon: parseFloat(goal.timeHorizon),
                                monthlyContribution: monthlyNeeded,
                                expectedReturn: expectedReturn
                              }
                            }));
                            setTimeout(() => {
                              document.getElementById('compound-calculator')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center ${
                            isActive 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          <Calculator className="w-4 h-4 mr-1" />
                          {isActive ? 'Calculator Active' : 'Open Calculator'}
                        </button>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No goals set yet. Click "Add Goal" to get started!</p>
            </div>
          )}
        </div>

        {/* Risk Tolerance Assessment */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Tolerance Assessment</h4>
          <p className="text-gray-600 mb-6">Select your investment risk preference based on your comfort with market volatility</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riskLevels.map((risk) => (
              <button
                key={risk.level}
                onClick={() => handleRiskSelection(risk.level)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  riskTolerance === risk.level
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <h5 className="font-semibold text-gray-900 mb-2">{risk.label}</h5>
                <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                <p className="text-xs text-purple-600 font-medium">{risk.allocation}</p>
              </button>
            ))}
          </div>

          {riskTolerance && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800">
                ✅ Risk profile set to <strong>{riskTolerance}</strong>. This will help us recommend appropriate investments for your goals.
              </p>
            </div>
          )}
        </div>

        {/* AI-Powered Calculator Section */}
        {renderGoalCalculator()}
      </div>
    </div>
  );
};

export default InvestmentGoalPlanning;