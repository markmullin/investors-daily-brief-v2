import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  Target,
  AlertCircle, 
  CheckCircle2, 
  Info,
  RefreshCw,
  BarChart3,
  Thermometer,
  Zap,
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
  RadialBarChart,
  RadialBar
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

// Correlation color mapping
const getCorrelationColor = (correlation) => {
  if (correlation > 0.7) return '#EF4444'; // High positive correlation - red
  if (correlation > 0.3) return '#F59E0B'; // Moderate positive - orange
  if (correlation > -0.3) return '#6B7280'; // Low correlation - gray
  if (correlation > -0.7) return '#3B82F6'; // Moderate negative - blue
  return '#10B981'; // High negative correlation - green
};

function RiskAnalysis({ portfolioData }) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // FIXED: Use real backend API endpoint for portfolio risk analysis
  const fetchRiskAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching portfolio risk analysis from backend API...');
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/portfolio_1/risk-analysis`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Portfolio risk analysis received:', data);
      
      setRiskData(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching portfolio risk analysis:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch risk analysis on component mount
  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  // Process correlation matrix for heatmap display
  const correlationMatrix = useMemo(() => {
    if (!riskData?.riskAnalysis?.correlationMatrix) return [];
    
    const matrix = riskData.riskAnalysis.correlationMatrix;
    const symbols = Object.keys(matrix);
    const matrixData = [];
    
    symbols.forEach((symbol1, i) => {
      symbols.forEach((symbol2, j) => {
        const correlation = matrix[symbol1]?.[symbol2] || 0;
        matrixData.push({
          symbol1,
          symbol2,
          correlation,
          x: j,
          y: i,
          color: getCorrelationColor(correlation)
        });
      });
    });
    
    return { data: matrixData, symbols };
  }, [riskData]);

  // Process concentration data for chart
  const concentrationData = useMemo(() => {
    if (!riskData?.riskAnalysis?.concentrationAnalysis?.positions) return [];
    
    return riskData.riskAnalysis.concentrationAnalysis.positions.slice(0, 8).map(position => ({
      ...position,
      color: position.isConcentrated ? '#EF4444' : '#6B7280'
    }));
  }, [riskData]);

  // Process stress test data
  const stressTestData = useMemo(() => {
    if (!riskData?.riskAnalysis?.stressTests) return [];
    
    return riskData.riskAnalysis.stressTests.map(test => ({
      ...test,
      color: getRiskColor(test.riskLevel)
    }));
  }, [riskData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRiskAnalysis().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Portfolio Risk</h3>
              <p className="text-gray-600">Computing risk metrics, correlations, and stress scenarios...</p>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Risk Analysis Error</h3>
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
  const hasPortfolioData = riskData?.portfolio?.holdings && Object.keys(riskData.portfolio.holdings).length > 0;

  if (!hasPortfolioData) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id="risk-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#EF4444" strokeWidth="0.5"/>
                  <polygon points="4,1 7,7 1,7" fill="#EF4444"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#risk-grid)" />
            </svg>
          </div>
          
          <div className="relative p-12 text-center">
            {/* Premium Header */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Risk Analysis</h2>
              <p className="text-xl text-gray-600 mb-2">Comprehensive portfolio risk assessment and stress testing</p>
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                <Activity className="w-4 h-4 mr-2" />
                Multi-Factor Risk Modeling
              </div>
            </div>

            {/* Professional Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-red-300 hover:border-red-400 transition-all duration-300 mb-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Risk Assessment Ready</h3>
                  <p className="text-gray-700 text-lg mb-4 max-w-md">
                    Upload your portfolio CSV to unlock comprehensive risk analysis and stress testing
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Beta and volatility analysis</p>
                    <p>✓ Value at Risk (VaR) calculations</p>
                    <p>✓ Correlation matrix and concentration risk</p>
                    <p>✓ Multi-scenario stress testing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <div className="text-red-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-red-900 text-lg mb-2">Risk Metrics</h4>
                <p className="text-red-800 text-sm">Beta, volatility, VaR analysis</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="text-orange-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-orange-900 text-lg mb-2">Stress Testing</h4>
                <p className="text-orange-800 text-sm">Multiple scenario analysis</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                <div className="text-yellow-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-yellow-900 text-lg mb-2">Correlation Analysis</h4>
                <p className="text-yellow-800 text-sm">Diversification assessment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskMetrics = riskData.riskAnalysis?.riskMetrics || {};
  const concentrationAnalysis = riskData.riskAnalysis?.concentrationAnalysis || {};
  const insights = riskData.riskAnalysis?.insights || { alerts: [], recommendations: [], strengths: [], risks: [] };

  return (
    <div className="space-y-8">
      {/* Portfolio Data Source Confirmation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-lg">
                Real Portfolio Risk Assessment • {Object.keys(riskData.portfolio.holdings).length} Holdings
              </p>
              <p className="text-emerald-800 text-sm">
                Risk analysis based on your actual portfolio composition and correlations
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Portfolio Beta */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">
              Portfolio Beta
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-700 mb-2">
              {riskMetrics.beta ? riskMetrics.beta.toFixed(2) : 'N/A'}
            </p>
            <p className="text-blue-600 font-semibold">
              Market Sensitivity
            </p>
            <p className="text-blue-500 text-sm">
              {riskMetrics.beta > 1.2 ? 'High Volatility' : 
               riskMetrics.beta > 0.8 ? 'Market-like' : 'Defensive'}
            </p>
          </div>
        </div>

        {/* Portfolio Volatility */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Thermometer className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-orange-700 uppercase tracking-wider">
              Volatility
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-orange-700 mb-2">
              {riskMetrics.volatility ? `${(riskMetrics.volatility * 100).toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-orange-600 font-semibold">
              Annualized
            </p>
            <p className="text-orange-500 text-sm">
              {riskMetrics.volatility > 0.25 ? 'High Risk' : 
               riskMetrics.volatility > 0.15 ? 'Moderate Risk' : 'Low Risk'}
            </p>
          </div>
        </div>

        {/* Value at Risk */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-red-700 uppercase tracking-wider">
              VaR (95%)
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-red-700 mb-2">
              {riskMetrics.valueAtRisk ? `${(riskMetrics.valueAtRisk * 100).toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-red-600 font-semibold">
              Max Daily Loss
            </p>
            <p className="text-red-500 text-sm">
              95% confidence
            </p>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wider">
              Sharpe Ratio
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-purple-700 mb-2">
              {riskMetrics.sharpeRatio ? riskMetrics.sharpeRatio.toFixed(2) : 'N/A'}
            </p>
            <p className="text-purple-600 font-semibold">
              Risk-Adjusted Return
            </p>
            <p className="text-purple-500 text-sm">
              {riskMetrics.sharpeRatio > 1.0 ? 'Excellent' : 
               riskMetrics.sharpeRatio > 0.5 ? 'Good' : 'Poor'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Concentration Risk */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-red-600" />
              Concentration Risk
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              concentrationAnalysis.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
              concentrationAnalysis.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {concentrationAnalysis.riskLevel || 'Low'} Risk
            </div>
          </div>
          
          {concentrationData.length > 0 ? (
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={concentrationData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
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
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Portfolio Weight']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontWeight: 600
                      }}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {concentrationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                <div>
                  <span className="text-gray-600 font-medium">Top 5 Concentration:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    {concentrationAnalysis.top5Concentration?.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Positions {'>'}10%:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    {concentrationAnalysis.concentratedPositions || 0}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No concentration data</p>
              </div>
            </div>
          )}
        </div>

        {/* Stress Testing */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-3 text-orange-600" />
            Stress Test Scenarios
          </h3>
          {stressTestData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stressTestData} layout="horizontal" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="scenario"
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Portfolio Impact']}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="portfolioImpact" radius={[0, 4, 4, 0]}>
                    {stressTestData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Zap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No stress test data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correlation Matrix */}
      {correlationMatrix.symbols.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-purple-600" />
            Correlation Matrix
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid gap-1 p-4 bg-gray-50 rounded-xl" style={{ 
                gridTemplateColumns: `80px repeat(${correlationMatrix.symbols.length}, 1fr)`,
                gridTemplateRows: `40px repeat(${correlationMatrix.symbols.length}, 1fr)`
              }}>
                {/* Empty corner */}
                <div></div>
                
                {/* Column headers */}
                {correlationMatrix.symbols.map(symbol => (
                  <div key={symbol} className="text-xs font-bold text-gray-700 text-center py-2">
                    <div className="transform -rotate-45 origin-center whitespace-nowrap">
                      {symbol}
                    </div>
                  </div>
                ))}
                
                {/* Rows */}
                {correlationMatrix.symbols.map((symbol1, i) => (
                  <React.Fragment key={symbol1}>
                    {/* Row header */}
                    <div className="text-xs font-bold text-gray-700 text-right pr-3 py-2 flex items-center justify-end bg-gray-100 rounded-lg">
                      {symbol1}
                    </div>
                    
                    {/* Correlation cells */}
                    {correlationMatrix.symbols.map((symbol2, j) => {
                      const correlation = correlationMatrix.data.find(
                        d => d.symbol1 === symbol1 && d.symbol2 === symbol2
                      )?.correlation || 0;
                      
                      return (
                        <div
                          key={`${symbol1}-${symbol2}`}
                          className="text-xs font-bold text-white text-center py-2 rounded-lg cursor-pointer transform hover:scale-105 transition-transform duration-200"
                          style={{ 
                            backgroundColor: getCorrelationColor(correlation),
                            opacity: 0.9,
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.3)'
                          }}
                          title={`${symbol1} vs ${symbol2}: ${correlation.toFixed(2)}`}
                        >
                          {correlation.toFixed(2)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
            <h5 className="font-bold text-gray-900 mb-4 text-center">Correlation Scale</h5>
            <div className="flex items-center justify-center space-x-8 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-600 rounded-lg shadow-sm"></div>
                <span>High Positive (&gt;0.7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-500 rounded-lg shadow-sm"></div>
                <span>Moderate (0.3-0.7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-500 rounded-lg shadow-sm"></div>
                <span>Low (-0.3-0.3)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg shadow-sm"></div>
                <span>Negative (-0.7--0.3)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-600 rounded-lg shadow-sm"></div>
                <span>High Negative (&lt;-0.7)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Risk Insights */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-3 text-yellow-600" />
          Risk Analysis Insights
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts & Risks */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Alerts & Risk Factors
            </h4>
            
            {/* Alerts */}
            {insights.alerts && insights.alerts.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-red-600">Risk Alerts</h5>
                {insights.alerts.map((alert, index) => (
                  <div key={index} className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-red-800">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risks */}
            {insights.risks && insights.risks.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-orange-600">Risk Factors</h5>
                {insights.risks.map((risk, index) => (
                  <div key={index} className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm font-medium text-orange-800">{risk.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!insights.alerts || insights.alerts.length === 0) && (!insights.risks || insights.risks.length === 0) && (
              <div className="p-6 bg-green-50 rounded-xl text-center border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-green-700">No significant risk alerts detected</p>
                <p className="text-xs text-green-600 mt-1">Portfolio risk profile appears healthy</p>
              </div>
            )}
          </div>

          {/* Recommendations & Strengths */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-500" />
              Recommendations & Strengths
            </h4>
            
            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-blue-600">Risk Recommendations</h5>
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

            {(!insights.recommendations || insights.recommendations.length === 0) && (!insights.strengths || insights.strengths.length === 0) && (
              <div className="p-6 bg-gray-50 rounded-xl text-center border border-gray-200">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Risk analysis in progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Risk Metrics */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Additional Risk Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {riskMetrics.alpha ? riskMetrics.alpha.toFixed(2) : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 font-medium">Alpha</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {riskMetrics.maxDrawdown ? `${(riskMetrics.maxDrawdown * 100).toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 font-medium">Max Drawdown</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {riskMetrics.sortinoRatio ? riskMetrics.sortinoRatio.toFixed(2) : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 font-medium">Sortino Ratio</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {riskMetrics.trackingError ? `${(riskMetrics.trackingError * 100).toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 font-medium">Tracking Error</p>
          </div>
        </div>
      </div>

      {/* Refresh Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">Risk Analysis</h4>
            <p className="text-gray-600">
              Last updated: {lastUpdated?.toLocaleString()}
              {riskData?.portfolio?.summary?.lastUpdated && (
                <span className="block text-sm">
                  Portfolio data: {new Date(riskData.portfolio.summary.lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskAnalysis;