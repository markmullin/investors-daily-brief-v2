import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  RefreshCw,
  BarChart3,
  PieChart,
  Upload,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// FIXED: Get correct API base URL for production vs development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://investors-daily-brief.onrender.com'
  : 'http://localhost:5000';

// Color schemes for different score ranges
const getScoreColor = (score) => {
  if (score >= 80) return '#10B981'; // Green
  if (score >= 60) return '#3B82F6'; // Blue  
  if (score >= 40) return '#F59E0B'; // Yellow
  if (score >= 20) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Average';
  return 'Poor';
};

// Style allocation colors
const STYLE_COLORS = {
  growth: '#3B82F6',
  value: '#10B981', 
  blend: '#F59E0B'
};

function PerformanceAnalytics({ portfolioData }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // FIXED: Use real backend API endpoint for portfolio analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching portfolio analytics from backend API...');
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/portfolio_1/analytics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Portfolio analytics received:', data);
      
      setAnalytics(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching portfolio analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics on component mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Process style allocation data for pie chart
  const styleAllocationData = useMemo(() => {
    if (!analytics?.analytics?.portfolioMetrics?.styleAllocation) return [];
    
    const allocation = analytics.analytics.portfolioMetrics.styleAllocation;
    return [
      { name: 'Growth', value: allocation.growth || 0, color: STYLE_COLORS.growth },
      { name: 'Value', value: allocation.value || 0, color: STYLE_COLORS.value },
      { name: 'Blend', value: allocation.blend || 0, color: STYLE_COLORS.blend }
    ].filter(item => item.value > 0);
  }, [analytics]);

  // Process portfolio metrics for display
  const portfolioMetrics = useMemo(() => {
    if (!analytics?.analytics?.portfolioMetrics) return null;
    
    const metrics = analytics.analytics.portfolioMetrics;
    return {
      weightedPE: metrics.weightedPE || 0,
      weightedROE: metrics.weightedROE || 0,
      avgRevenueGrowth: metrics.avgRevenueGrowth || 0,
      qualityScore: metrics.qualityScore || 0,
      valueScore: metrics.valueScore || 0,
      growthScore: metrics.growthScore || 0,
      financialHealthScore: metrics.financialHealthScore || 0
    };
  }, [analytics]);

  // Process insights data
  const insights = useMemo(() => {
    if (!analytics?.analytics?.insights) return { alerts: [], recommendations: [], strengths: [], risks: [] };
    return analytics.analytics.insights;
  }, [analytics]);

  // Score data for radial charts
  const scoreData = useMemo(() => {
    if (!portfolioMetrics) return [];
    
    return [
      { name: 'Quality', score: portfolioMetrics.qualityScore, fill: getScoreColor(portfolioMetrics.qualityScore) },
      { name: 'Value', score: portfolioMetrics.valueScore, fill: getScoreColor(portfolioMetrics.valueScore) },
      { name: 'Growth', score: portfolioMetrics.growthScore, fill: getScoreColor(portfolioMetrics.growthScore) },
      { name: 'Health', score: portfolioMetrics.financialHealthScore, fill: getScoreColor(portfolioMetrics.financialHealthScore) }
    ];
  }, [portfolioMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Portfolio Performance</h3>
              <p className="text-gray-600">Computing fundamental metrics and performance analytics...</p>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Retry Analysis</span>
          </button>
        </div>
      </div>
    );
  }

  // Check if we have sufficient portfolio data
  const hasPortfolioData = analytics?.portfolio?.holdings && Object.keys(analytics.portfolio.holdings).length > 0;

  if (!hasPortfolioData) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-xl shadow-lg border border-green-200 overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id="performance-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#10B981" strokeWidth="0.5"/>
                  <circle cx="5" cy="5" r="1" fill="#10B981"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#performance-grid)" />
            </svg>
          </div>
          
          <div className="relative p-12 text-center">
            {/* Premium Header */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Performance Analytics</h2>
              <p className="text-xl text-gray-600 mb-2">Comprehensive portfolio analysis and benchmarking</p>
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <Activity className="w-4 h-4 mr-2" />
                Real FMP Fundamental Data
              </div>
            </div>

            {/* Professional Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-green-300 hover:border-green-400 transition-all duration-300 mb-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Portfolio Analysis Ready</h3>
                  <p className="text-gray-700 text-lg mb-4 max-w-md">
                    Upload your portfolio CSV to unlock comprehensive performance analytics with real fundamental data
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Real FMP API fundamental metrics</p>
                    <p>✓ Weighted P/E, ROE, and growth analysis</p>
                    <p>✓ Quality, Value, Growth, and Health scores</p>
                    <p>✓ Style allocation and sector analysis</p>
                    <p>✓ AI-powered insights and recommendations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="text-green-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-green-900 text-lg mb-2">Real Fundamental Data</h4>
                <p className="text-green-800 text-sm">P/E, ROE, growth from FMP API</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h4 className="font-bold text-blue-900 text-lg mb-2">Quality Scoring</h4>
                <p className="text-blue-800 text-sm">Multi-factor health assessment</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                <div className="text-indigo-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-indigo-900 text-lg mb-2">Style Analysis</h4>
                <p className="text-indigo-800 text-sm">Growth/Value/Blend allocation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Data Source Confirmation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-lg">
                Real Portfolio Analytics • {Object.keys(analytics.portfolio.holdings).length} Holdings
              </p>
              <p className="text-emerald-800 text-sm">
                Analysis powered by FMP API fundamental data with live market prices
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weighted P/E */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">
              Weighted P/E
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-700 mb-2">
              {portfolioMetrics?.weightedPE ? portfolioMetrics.weightedPE.toFixed(1) : 'N/A'}
            </p>
            <p className="text-blue-600 font-semibold">
              Price-to-Earnings
            </p>
            <p className="text-blue-500 text-sm">
              {portfolioMetrics?.weightedPE < 15 ? 'Undervalued' : 
               portfolioMetrics?.weightedPE < 25 ? 'Fair Value' : 'Expensive'}
            </p>
          </div>
        </div>

        {/* Weighted ROE */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-green-700 uppercase tracking-wider">
              Weighted ROE
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-green-700 mb-2">
              {portfolioMetrics?.weightedROE ? `${portfolioMetrics.weightedROE.toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-green-600 font-semibold">
              Return on Equity
            </p>
            <p className="text-green-500 text-sm">
              {portfolioMetrics?.weightedROE > 15 ? 'Excellent' : 
               portfolioMetrics?.weightedROE > 10 ? 'Good' : 'Below Average'}
            </p>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wider">
              Avg Growth
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-purple-700 mb-2">
              {portfolioMetrics?.avgRevenueGrowth ? `${portfolioMetrics.avgRevenueGrowth.toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-purple-600 font-semibold">
              Revenue Growth
            </p>
            <p className="text-purple-500 text-sm">
              {portfolioMetrics?.avgRevenueGrowth > 15 ? 'High Growth' : 
               portfolioMetrics?.avgRevenueGrowth > 5 ? 'Moderate' : 'Low Growth'}
            </p>
          </div>
        </div>

        {/* Overall Quality */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-orange-700 uppercase tracking-wider">
              Quality Score
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-orange-700 mb-2">
              {portfolioMetrics?.qualityScore ? Math.round(portfolioMetrics.qualityScore) : 'N/A'}
            </p>
            <p className="text-orange-600 font-semibold">
              Out of 100
            </p>
            <p className="text-orange-500 text-sm">
              {getScoreLabel(portfolioMetrics?.qualityScore || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Health Scores */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-indigo-600" />
            Portfolio Health Scores
          </h3>
          {scoreData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={scoreData}>
                  <RadialBar
                    dataKey="score"
                    cornerRadius={10}
                    fill="#8884d8"
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}/100`, 'Score']}
                    labelFormatter={(label) => `${label} Score`}
                    contentStyle={{
                      backgroundColor: '#F8FAFC',
                      border: '2px solid #E2E8F0',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Calculating scores...</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {scoreData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="font-bold text-gray-900">{item.score.toFixed(0)}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Style Allocation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-6 h-6 mr-3 text-purple-600" />
            Investment Style Allocation
          </h3>
          {styleAllocationData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={styleAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {styleAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Allocation']}
                    labelFormatter={(label) => `${label} Style`}
                    contentStyle={{
                      backgroundColor: '#F8FAFC',
                      border: '2px solid #E2E8F0',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Calculating allocation...</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm font-medium">
            {styleAllocationData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-700">{item.name}</span>
                <span className="font-bold text-gray-900">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Insights Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-3 text-yellow-600" />
          Portfolio Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts & Recommendations */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 h-5 text-orange-500" />
              Alerts & Recommendations
            </h4>
            
            {/* Alerts */}
            {insights.alerts && insights.alerts.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-orange-600">Performance Alerts</h5>
                {insights.alerts.map((alert, index) => (
                  <div key={index} className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-orange-800">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-blue-600">Performance Recommendations</h5>
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-blue-800">{rec.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!insights.alerts || insights.alerts.length === 0) && (!insights.recommendations || insights.recommendations.length === 0) && (
              <div className="p-6 bg-green-50 rounded-xl text-center border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-green-700">No alerts or recommendations at this time</p>
                <p className="text-xs text-green-600 mt-1">Portfolio appears well-balanced</p>
              </div>
            )}
          </div>

          {/* Strengths & Risks */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-500" />
              Portfolio Strengths & Risks
            </h4>
            
            {/* Strengths */}
            {insights.strengths && insights.strengths.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-green-600">Portfolio Strengths</h5>
                {insights.strengths.map((strength, index) => (
                  <div key={index} className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-green-800">{strength.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risks */}
            {insights.risks && insights.risks.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-red-600">Risk Factors</h5>
                {insights.risks.map((risk, index) => (
                  <div key={index} className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-red-800">{risk.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!insights.strengths || insights.strengths.length === 0) && (!insights.risks || insights.risks.length === 0) && (
              <div className="p-6 bg-gray-50 rounded-xl text-center border border-gray-200">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Portfolio analysis in progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Section */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">Performance Analysis</h4>
            <p className="text-gray-600">
              Last updated: {lastUpdated?.toLocaleString()}
              {analytics?.portfolio?.summary?.lastUpdated && (
                <span className="block text-sm">
                  Portfolio data: {new Date(analytics.portfolio.summary.lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerformanceAnalytics;