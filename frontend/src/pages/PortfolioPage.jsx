import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Upload, Calculator, BarChart3, TrendingUp, DollarSign, PieChart, Shield, Activity, TrendingDown, Settings, AlertTriangle, Building2, HelpCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import tab components
const CSVUploadModal = lazy(() => import('../components/CSVUploadModal'));
const PerformanceAnalytics = lazy(() => import('../components/PerformanceAnalytics'));
const RiskAnalysis = lazy(() => import('../components/RiskAnalysis'));
const PortfolioOptimization = lazy(() => import('../components/PortfolioOptimization'));

// Main portfolio dashboard component
const PortfolioTracker = lazy(() => import('../components/PortfolioTracker'));

// 13F Smart Money component
const SmartMoneyHub = lazy(() => import('../components/institutional/SmartMoneyHub'));

// Institutional-grade analytics
const MonteCarloSimulation = lazy(() => import('../components/analytics/MonteCarloSimulation'));
const CorrelationAnalysis = lazy(() => import('../components/analytics/CorrelationAnalysis'));
const ValueAtRisk = lazy(() => import('../components/analytics/ValueAtRisk'));

const PortfolioPage = () => {
  const { requireAuth, user } = useAuth();
  
  // Load portfolio data from localStorage on mount
  const loadPortfolioFromStorage = () => {
    try {
      const stored = localStorage.getItem('portfolioData');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('✅ Loaded portfolio data from localStorage:', {
          totalValue: parsed.summary?.totalValue || parsed.totalValue,
          holdingsCount: parsed.holdings ? Object.keys(parsed.holdings).length : 0,
          lastUpdated: parsed.lastUpdated
        });
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error loading portfolio from localStorage:', error);
    }
    return {
      totalValue: null,
      totalReturn: null,
      dayChange: null,
      bestPerformer: { symbol: null, return: null },
      holdings: {},
      summary: null
    };
  };

  // Main portfolio state with localStorage initialization
  const [portfolioData, setPortfolioData] = useState(loadPortfolioFromStorage);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [csvUploadStatus, setCsvUploadStatus] = useState(null);

  // Save portfolio data to localStorage whenever it changes
  useEffect(() => {
    const hasData = portfolioData.summary?.totalValue !== null || 
                   portfolioData.totalValue !== null || 
                   (portfolioData.holdings && Object.keys(portfolioData.holdings).length > 0);
    
    if (hasData) {
      try {
        const dataToStore = {
          ...portfolioData,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('portfolioData', JSON.stringify(dataToStore));
        console.log('💾 Saved portfolio data to localStorage');
      } catch (error) {
        console.error('❌ Error saving portfolio to localStorage:', error);
      }
    }
  }, [portfolioData]);

  // Fetch portfolio from backend
  const fetchPortfolioFromBackend = async () => {
    try {
      console.log('🔄 Fetching fresh portfolio data from backend...');
      const response = await fetch('http://localhost:5000/api/portfolio/portfolio_1');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched fresh portfolio data from backend:', data);
        
        const hasHoldings = data && data.holdings && typeof data.holdings === 'object' && Object.keys(data.holdings).length > 0;
        
        if (hasHoldings) {
          console.log('🎯 Portfolio has holdings:', Object.keys(data.holdings));
          handlePortfolioUpdate(data);
          return true;
        } else {
          console.log('📭 No holdings found in portfolio data');
        }
      } else {
        console.log('⚠️ Backend portfolio endpoint returned:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch from backend (offline/network issue):', error.message);
    }
    return false;
  };

  // Load fresh data on mount if localStorage is stale or empty
  useEffect(() => {
    const initializePortfolio = async () => {
      const stored = localStorage.getItem('portfolioData');
      const hasStoredData = stored && JSON.parse(stored).holdings && Object.keys(JSON.parse(stored).holdings).length > 0;
      
      if (!hasStoredData) {
        console.log('📥 No portfolio data in localStorage, checking backend...');
        await fetchPortfolioFromBackend();
      } else {
        // Check if stored data is more than 1 hour old
        try {
          const parsed = JSON.parse(stored);
          const lastUpdated = new Date(parsed.lastUpdated);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (lastUpdated < oneHourAgo) {
            console.log('⏰ Portfolio data is stale, fetching fresh data...');
            await fetchPortfolioFromBackend();
          } else {
            console.log('✅ Using fresh portfolio data from localStorage');
          }
        } catch (error) {
          console.log('🔄 Error checking data age, fetching fresh data...');
          await fetchPortfolioFromBackend();
        }
      }
    };

    initializePortfolio();
  }, []);

  // Handle portfolio data updates
  const handlePortfolioUpdate = (newData) => {
    console.log('🔄 Portfolio data updated:', newData);
    setPortfolioData(prev => ({ ...prev, ...newData }));
  };

  // Handle CSV upload completion with backend refresh
  const handleCSVUploadComplete = async (data) => {
    console.log('📊 CSV upload completed, refreshing portfolio data...');
    setCsvUploadStatus('success');
    
    // Wait a moment for backend to process, then fetch fresh data
    setTimeout(async () => {
      const refreshed = await fetchPortfolioFromBackend();
      if (!refreshed && data) {
        // Fallback to provided data if backend fetch fails
        handlePortfolioUpdate(data);
      }
    }, 1000);
    
    setTimeout(() => setCsvUploadStatus(null), 5000);
  };

  // Manual refresh function
  const refreshPortfolioData = async () => {
    console.log('🔄 Manual refresh triggered...');
    const success = await fetchPortfolioFromBackend();
    if (success) {
      setCsvUploadStatus('refreshed');
      setTimeout(() => setCsvUploadStatus(null), 3000);
    }
  };

  // Clear portfolio data function
  const clearPortfolioData = () => {
    localStorage.removeItem('portfolioData');
    setPortfolioData({
      totalValue: null,
      totalReturn: null,
      dayChange: null,
      bestPerformer: { symbol: null, return: null },
      holdings: {},
      summary: null
    });
    console.log('🗑️ Portfolio data cleared');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Check if portfolio has data
  const hasPortfolioData = () => {
    const summaryValue = portfolioData.summary?.totalValue;
    const directValue = portfolioData.totalValue;
    const holdingsCount = portfolioData.holdings ? Object.keys(portfolioData.holdings).length : 0;
    
    return (summaryValue !== null && summaryValue > 0) || 
           (directValue !== null && directValue > 0) || 
           holdingsCount > 0;
  };

  const hasData = hasPortfolioData();

  // Extract portfolio summary data
  const getPortfolioSummary = () => {
    if (portfolioData.summary) {
      return portfolioData.summary;
    }
    
    return {
      totalValue: portfolioData.totalValue,
      totalGain: portfolioData.totalReturn,
      totalGainPercent: portfolioData.totalGainPercent,
      dayChange: portfolioData.dayChange,
      dayChangePercent: portfolioData.dayChangePercent
    };
  };

  const summary = getPortfolioSummary();

  // Handle CSV upload with auth check
  const handleCSVUploadClick = () => {
    requireAuth(() => setShowCSVUpload(true));
  };

  // Handle portfolio save with auth check
  const handleSavePortfolio = () => {
    requireAuth(() => {
      console.log('Saving portfolio for user:', user?.email);
      if (user) {
        localStorage.setItem(`userPortfolio_${user.id}`, JSON.stringify(portfolioData));
        setCsvUploadStatus('saved');
        setTimeout(() => setCsvUploadStatus(null), 3000);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Management</h1>
              <p className="text-gray-600">Track your investments and learn from smart money</p>
              {hasData && portfolioData.lastUpdated && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ Portfolio loaded • {Object.keys(portfolioData.holdings || {}).length} holdings • {formatCurrency(summary?.totalValue)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Refresh button */}
              {hasData && (
                <button 
                  onClick={refreshPortfolioData}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              )}
              {/* Save Portfolio Button */}
              {hasData && (
                <button 
                  onClick={handleSavePortfolio}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{user ? 'Save Portfolio' : 'Sign in to Save'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Notifications */}
          {csvUploadStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Portfolio Successfully Updated!</p>
                  <p className="text-sm text-green-700">Your CSV data has been imported and processed.</p>
                </div>
              </div>
            </div>
          )}

          {csvUploadStatus === 'refreshed' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Portfolio Data Refreshed!</p>
                  <p className="text-sm text-blue-700">Latest data has been loaded.</p>
                </div>
              </div>
            </div>
          )}

          {csvUploadStatus === 'saved' && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Portfolio Saved!</p>
                  <p className="text-sm text-purple-700">Your portfolio has been saved to your account.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Streamlined */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Upload Section - Prominent and Clean */}
        {!hasData && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 border border-blue-200">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Portfolio</h2>
              <p className="text-gray-600 mb-6">Import your brokerage CSV to start tracking performance and get insights</p>
              <button
                onClick={handleCSVUploadClick}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium inline-flex items-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Upload CSV</span>
              </button>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700">Supported Brokers</div>
                  <div className="text-xs text-gray-600 mt-1">Schwab, Fidelity, Robinhood, E*TRADE, 20+ more</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700">Account Types</div>
                  <div className="text-xs text-gray-600 mt-1">401(k), IRA, Roth, HSA, Taxable</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700">Auto-Processing</div>
                  <div className="text-xs text-gray-600 mt-1">Splits, dividends, cost basis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Analysis with Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Enhanced Tab Navigation - Now includes Smart Money */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-0 px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart, description: 'Portfolio dashboard' },
                { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'Returns & benchmarks' },
                { id: 'risk', label: 'Risk', icon: AlertTriangle, description: 'Risk analytics & VaR' },
                { id: 'smartmoney', label: 'Smart Money', icon: Building2, description: '13F insights' },
                { id: 'optimization', label: 'Optimization', icon: Settings, description: 'Rebalancing' }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`py-4 px-4 border-b-2 font-medium text-sm flex flex-col items-center space-y-1 transition-colors whitespace-nowrap min-w-[120px] ${
                      selectedTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    title={tab.description}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                    <span className="text-xs text-gray-400 font-normal">{tab.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Upload Button for existing users */}
                {hasData && (
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Portfolio Dashboard</h3>
                    <button
                      onClick={handleCSVUploadClick}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Update Portfolio</span>
                    </button>
                  </div>
                )}

                {/* Portfolio Tracker Component */}
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading portfolio dashboard...</span>
                  </div>
                }>
                  <PortfolioTracker />
                </Suspense>

                {/* Data Management Section */}
                {hasData && (
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Last updated:</span> {portfolioData.lastUpdated ? new Date(portfolioData.lastUpdated).toLocaleString() : 'Unknown'}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={refreshPortfolioData}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Refresh Data
                      </button>
                      <button
                        onClick={clearPortfolioData}
                        className="text-red-600 hover:text-red-800 text-sm underline"
                      >
                        Clear Portfolio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'performance' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Analytics</h3>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Loading performance analytics...</span>
                  </div>
                }>
                  <PerformanceAnalytics portfolioData={portfolioData} />
                </Suspense>
              </div>
            )}

            {selectedTab === 'risk' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Analytics Suite</h3>
                
                {/* Risk Analysis with Sharpe Ratio */}
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Analyzing portfolio risk...</span>
                  </div>
                }>
                  <RiskAnalysis portfolioData={portfolioData} />
                </Suspense>
                
                {/* Monte Carlo Simulation */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Monte Carlo Simulation</h4>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Running simulations...</span>
                    </div>
                  }>
                    <MonteCarloSimulation 
                      portfolioData={portfolioData}
                      initialValue={summary?.totalValue || 100000}
                      timeHorizon={10}
                      goalAmount={200000}
                    />
                  </Suspense>
                </div>

                {/* Value at Risk */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Value at Risk (VaR)</h4>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span className="ml-3 text-gray-600">Calculating VaR...</span>
                    </div>
                  }>
                    <ValueAtRisk 
                      portfolioData={portfolioData}
                      portfolioValue={summary?.totalValue || 100000}
                      confidenceLevels={[95, 99]}
                    />
                  </Suspense>
                </div>

                {/* Correlation Analysis */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Correlation Analysis</h4>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Calculating correlations...</span>
                    </div>
                  }>
                    <CorrelationAnalysis portfolioData={portfolioData} />
                  </Suspense>
                </div>
              </div>
            )}

            {selectedTab === 'smartmoney' && (
              <div>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading Smart Money Hub...</span>
                  </div>
                }>
                  <SmartMoneyHub userPortfolio={portfolioData} />
                </Suspense>
              </div>
            )}

            {selectedTab === 'optimization' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Optimization</h3>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Generating optimization recommendations...</span>
                  </div>
                }>
                  <PortfolioOptimization portfolioData={portfolioData} />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      <Suspense fallback={null}>
        <CSVUploadModal
          isOpen={showCSVUpload}
          onClose={() => setShowCSVUpload(false)}
          onUploadComplete={handleCSVUploadComplete}
        />
      </Suspense>
    </div>
  );
};

export default PortfolioPage;