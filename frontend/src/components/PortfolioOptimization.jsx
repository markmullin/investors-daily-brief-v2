import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  Sliders, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Settings,
  Activity,
  DollarSign,
  PieChart,
  TrendingDown,
  Upload
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ComposedChart,
  Line,
  Area,
  LineChart
} from 'recharts';

// FIXED: Get correct API base URL for production vs development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://investors-daily-brief.onrender.com'
  : 'http://localhost:5000';

// Risk level color mapping
const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return '#10B981';
    case 'moderate': case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    default: return '#6B7280';
  }
};

// Action color mapping for rebalancing
const getActionColor = (action) => {
  switch (action?.toUpperCase()) {
    case 'BUY': return '#10B981';
    case 'SELL': return '#EF4444';
    default: return '#6B7280';
  }
};

function PortfolioOptimization({ portfolioData }) {
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Optimization settings
  const [optimizationSettings, setOptimizationSettings] = useState({
    type: 'max_sharpe', // max_sharpe, min_risk, target_return
    riskTolerance: 'moderate', // conservative, moderate, aggressive
    investmentHorizon: 'long_term', // short_term, medium_term, long_term
    constraints: {
      minWeight: 0.0,
      maxWeight: 0.35,
      maxTurnover: 0.2
    }
  });

  const [showSettings, setShowSettings] = useState(false);

  // FIXED: Use real backend API endpoint for portfolio optimization
  const fetchOptimization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Fetching portfolio optimization from backend API...');
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/portfolio_1/optimization`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Portfolio optimization received:', data);
      
      setOptimizationData(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching portfolio optimization:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch optimization on component mount
  useEffect(() => {
    fetchOptimization();
  }, []);

  // Process efficient frontier data for chart
  const efficientFrontierData = useMemo(() => {
    if (!optimizationData?.optimization?.efficientFrontier) return [];
    
    return optimizationData.optimization.efficientFrontier.map((point, index) => ({
      ...point,
      volatilityPercent: point.volatility * 100,
      returnPercent: point.expectedReturn * 100,
      color: point.sharpeRatio > 1.0 ? '#10B981' : point.sharpeRatio > 0.5 ? '#F59E0B' : '#EF4444'
    }));
  }, [optimizationData]);

  // Process allocation comparison data
  const allocationComparisonData = useMemo(() => {
    if (!optimizationData?.optimization) return [];
    
    const currentWeights = optimizationData.optimization.currentAllocation?.weights || {};
    const optimalWeights = optimizationData.optimization.optimalAllocation?.weights || {};
    
    const symbols = new Set([...Object.keys(currentWeights), ...Object.keys(optimalWeights)]);
    
    return Array.from(symbols).map(symbol => ({
      symbol,
      current: (currentWeights[symbol] || 0) * 100,
      optimal: (optimalWeights[symbol] || 0) * 100,
      difference: ((optimalWeights[symbol] || 0) - (currentWeights[symbol] || 0)) * 100
    })).sort((a, b) => b.optimal - a.optimal).slice(0, 8);
  }, [optimizationData]);

  // Process risk budget data
  const riskBudgetData = useMemo(() => {
    if (!optimizationData?.optimization?.riskBudget) return [];
    
    return optimizationData.optimization.riskBudget.slice(0, 8).map(item => ({
      ...item,
      color: item.riskDensity > 1.5 ? '#EF4444' : item.riskDensity > 1.0 ? '#F59E0B' : '#10B981'
    }));
  }, [optimizationData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOptimization().finally(() => setRefreshing(false));
  };

  const handleSettingsChange = (key, value) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleConstraintChange = (constraint, value) => {
    setOptimizationSettings(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [constraint]: parseFloat(value) || 0
      }
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimizing Portfolio Allocation</h3>
              <p className="text-gray-600">Running Modern Portfolio Theory optimization...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimization Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Retry Optimization</span>
          </button>
        </div>
      </div>
    );
  }

  // Check if we have sufficient portfolio data
  const hasPortfolioData = optimizationData?.portfolio?.holdings && Object.keys(optimizationData.portfolio.holdings).length >= 2;

  if (!hasPortfolioData) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-200 overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id="optimization-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="6" cy="6" r="2" fill="#6366F1"/>
                  <circle cx="3" cy="9" r="1" fill="#8B5CF6"/>
                  <circle cx="9" cy="3" r="1" fill="#8B5CF6"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#optimization-grid)" />
            </svg>
          </div>
          
          <div className="relative p-12 text-center">
            {/* Premium Header */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Portfolio Optimization</h2>
              <p className="text-xl text-gray-600 mb-2">Modern Portfolio Theory and efficient frontier analysis</p>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                <Activity className="w-4 h-4 mr-2" />
                Institutional-Grade Optimization
              </div>
            </div>

            {/* Professional Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-indigo-300 hover:border-indigo-400 transition-all duration-300 mb-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Portfolio Required</h3>
                  <p className="text-gray-700 text-lg mb-4 max-w-md">
                    Need at least 2 holdings for optimization. Upload your portfolio CSV to unlock portfolio optimization tools.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Modern Portfolio Theory optimization</p>
                    <p>✓ Efficient frontier analysis</p>
                    <p>✓ Risk-return optimization</p>
                    <p>✓ Rebalancing recommendations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                <div className="text-indigo-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h4 className="font-bold text-indigo-900 text-lg mb-2">Efficient Frontier</h4>
                <p className="text-indigo-800 text-sm">Risk-return optimization curve</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="text-purple-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-purple-900 text-lg mb-2">Smart Rebalancing</h4>
                <p className="text-purple-800 text-sm">Automated optimization recommendations</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-blue-900 text-lg mb-2">Risk Management</h4>
                <p className="text-blue-800 text-sm">Advanced risk budgeting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const optimization = optimizationData.optimization;
  const currentMetrics = optimization?.currentAllocation?.metrics || {};
  const optimalMetrics = optimization?.optimalAllocation?.metrics || {};
  const improvement = optimalMetrics.sharpeRatio - currentMetrics.sharpeRatio;

  return (
    <div className="space-y-8">
      {/* Portfolio Data Source Confirmation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-lg">
                Real Portfolio Optimization • {Object.keys(optimizationData.portfolio.holdings).length} Holdings
              </p>
              <p className="text-emerald-800 text-sm">
                Modern Portfolio Theory optimization based on your actual holdings
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Optimizing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Optimization Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-gray-600" />
            Optimization Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Optimization Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Optimization Type</label>
              <select
                value={optimizationSettings.type}
                onChange={(e) => handleSettingsChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="max_sharpe">Maximum Sharpe Ratio</option>
                <option value="min_risk">Minimum Risk</option>
                <option value="target_return">Target Return</option>
              </select>
            </div>

            {/* Risk Tolerance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Risk Tolerance</label>
              <select
                value={optimizationSettings.riskTolerance}
                onChange={(e) => handleSettingsChange('riskTolerance', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            {/* Investment Horizon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Investment Horizon</label>
              <select
                value={optimizationSettings.investmentHorizon}
                onChange={(e) => handleSettingsChange('investmentHorizon', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="short_term">Short Term (&lt;1 year)</option>
                <option value="medium_term">Medium Term (1-5 years)</option>
                <option value="long_term">Long Term (&gt;5 years)</option>
              </select>
            </div>

            {/* Max Position Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Max Position Size</label>
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.05"
                value={optimizationSettings.constraints.maxWeight}
                onChange={(e) => handleConstraintChange('maxWeight', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">Maximum allocation per holding</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Portfolio */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">
              Current Portfolio
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-blue-700 font-medium">Expected Return:</span>
              <span className="font-bold text-blue-900">{(currentMetrics.expectedReturn * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-700 font-medium">Volatility:</span>
              <span className="font-bold text-blue-900">{(currentMetrics.volatility * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-700 font-medium">Sharpe Ratio:</span>
              <span className="font-bold text-blue-900">{currentMetrics.sharpeRatio?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Optimal Portfolio */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-green-700 uppercase tracking-wider">
              Optimal Portfolio
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-green-700 font-medium">Expected Return:</span>
              <span className="font-bold text-green-900">{(optimalMetrics.expectedReturn * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700 font-medium">Volatility:</span>
              <span className="font-bold text-green-900">{(optimalMetrics.volatility * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700 font-medium">Sharpe Ratio:</span>
              <span className="font-bold text-green-900">{optimalMetrics.sharpeRatio?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Improvement Potential */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${improvement > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {improvement > 0 ? 
                <TrendingUp className="h-5 w-5 text-white" /> : 
                <TrendingDown className="h-5 w-5 text-white" />
              }
            </div>
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wider">
              Improvement
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-purple-700 font-medium">Sharpe Improvement:</span>
              <span className={`font-bold ${improvement > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                {improvement > 0 ? '+' : ''}{improvement.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-purple-700 font-medium">Trades Required:</span>
              <span className="font-bold text-purple-900">{optimization?.rebalancingRecommendations?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-purple-700 font-medium">Status:</span>
              <span className={`text-sm font-bold ${improvement > 0.1 ? 'text-green-600' : improvement > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                {improvement > 0.1 ? 'High Potential' : improvement > 0 ? 'Some Benefit' : 'Well Optimized'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Efficient Frontier */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-indigo-600" />
              Efficient Frontier
            </h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Optimization settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          {efficientFrontierData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    type="number"
                    dataKey="volatilityPercent"
                    name="Volatility"
                    unit="%"
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="number"
                    dataKey="returnPercent"
                    name="Expected Return"
                    unit="%"
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value.toFixed(1)}%`, 
                      name === 'returnPercent' ? 'Expected Return' : 
                      name === 'volatilityPercent' ? 'Volatility' : name
                    ]}
                    labelFormatter={() => 'Portfolio'}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Scatter data={efficientFrontierData} fill="#6366F1">
                    {efficientFrontierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                  
                  {/* Mark current and optimal portfolios */}
                  <Scatter 
                    data={[{
                      volatilityPercent: currentMetrics.volatility * 100,
                      returnPercent: currentMetrics.expectedReturn * 100
                    }]} 
                    fill="#EF4444" 
                    shape="star"
                    name="Current Portfolio"
                  />
                  <Scatter 
                    data={[{
                      volatilityPercent: optimalMetrics.volatility * 100,
                      returnPercent: optimalMetrics.expectedReturn * 100
                    }]} 
                    fill="#10B981" 
                    shape="diamond"
                    name="Optimal Portfolio"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Generating efficient frontier...</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-center space-x-8 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                <span>Current Portfolio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                <span>Optimal Portfolio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-sm"></div>
                <span>Efficient Frontier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Comparison */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-6 h-6 mr-3 text-purple-600" />
            Current vs Optimal Allocation
          </h3>
          {allocationComparisonData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="symbol" 
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Allocation']}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="current" fill="#EF4444" name="Current" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="optimal" fill="#10B981" name="Optimal" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Generating allocation comparison...</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-center space-x-8 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
                <span>Current Allocation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
                <span>Optimal Allocation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rebalancing Recommendations */}
      {optimization?.rebalancingRecommendations?.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Sliders className="w-6 h-6 mr-3 text-orange-600" />
            Rebalancing Recommendations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Symbol</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Action</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Current %</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Target %</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Change</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Priority</th>
                </tr>
              </thead>
              <tbody>
                {optimization.rebalancingRecommendations.slice(0, 10).map((rec, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{rec.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rec.action === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {rec.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">{rec.currentWeight.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-sm font-medium">{rec.targetWeight.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      <span className={`font-bold ${rec.weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rec.weightChange > 0 ? '+' : ''}{rec.weightChange.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold">
                      ${rec.dollarChange.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rec.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rec.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Insights */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-xl mb-3">Portfolio Optimization Insights</h4>
            <p className="text-indigo-800 mb-4 text-lg leading-relaxed">
              Based on Modern Portfolio Theory analysis, your portfolio could achieve a 
              <span className="font-bold"> {(optimalMetrics.expectedReturn * 100).toFixed(1)}%</span> expected return 
              with <span className="font-bold">{(optimalMetrics.volatility * 100).toFixed(1)}%</span> volatility 
              through optimal rebalancing.
            </p>
            
            {improvement > 0.1 && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-3">
                <p className="text-green-800 font-semibold">
                  📈 Significant improvement potential detected - Sharpe ratio could increase by {improvement.toFixed(2)}.
                </p>
              </div>
            )}
            
            {optimization?.rebalancingRecommendations?.length > 5 && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-3">
                <p className="text-orange-800 font-semibold">
                  ⚠️ Multiple rebalancing trades recommended - consider implementing gradually to minimize market impact.
                </p>
              </div>
            )}
            
            <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4">
              <p className="text-indigo-800 font-semibold">
                💡 Optimization based on {optimizationSettings.type.replace('_', ' ')} approach with 
                {optimizationSettings.riskTolerance} risk tolerance for {optimizationSettings.investmentHorizon.replace('_', ' ')} horizon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">Portfolio Optimization</h4>
            <p className="text-gray-600">
              Last updated: {lastUpdated?.toLocaleString()}
              {optimizationData?.portfolio?.summary?.lastUpdated && (
                <span className="block text-sm">
                  Portfolio data: {new Date(optimizationData.portfolio.summary.lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Optimizing...' : 'Re-optimize'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortfolioOptimization;