import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Building2, Users, Eye, Maximize2, ArrowUpRight, DollarSign, TrendingUp, Calendar, MapPin, Target, Award, BarChart2, GraduationCap, Bell, AlertTriangle, Sparkles } from 'lucide-react';
import PortfolioComparison from './PortfolioComparison';
import SmartMoneyEducation from './SmartMoneyEducation';

const InstitutionalPortfoliosCarousel = ({ userPortfolio }) => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' or 'detailed'
  
  // New states for enhanced features
  const [showComparison, setShowComparison] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [smartMoneyAlerts, setSmartMoneyAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    fetchInstitutionalPortfolios();
    fetchSmartMoneyAlerts();
  }, []);

  const fetchInstitutionalPortfolios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/institutional/portfolios?limit=21');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPortfolios(data.data);
      } else {
        throw new Error(data.error || 'Failed to load institutional portfolios');
      }
    } catch (error) {
      console.error('❌ Error loading institutional portfolios:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartMoneyAlerts = async () => {
    // Mock smart money alerts - in production, this would fetch from backend
    const mockAlerts = [
      {
        id: 1,
        manager: 'Warren Buffett',
        action: 'bought',
        stock: 'AAPL',
        company: 'Apple Inc.',
        amount: '$4.8B',
        change: '+12%',
        date: '2025-01-15',
        type: 'new_position'
      },
      {
        id: 2,
        manager: 'Ray Dalio',
        action: 'increased',
        stock: 'GLD',
        company: 'SPDR Gold Trust',
        amount: '$2.1B',
        change: '+25%',
        date: '2025-01-14',
        type: 'increase'
      },
      {
        id: 3,
        manager: 'Cathie Wood',
        action: 'sold',
        stock: 'TSLA',
        company: 'Tesla Inc.',
        amount: '$1.5B',
        change: '-18%',
        date: '2025-01-12',
        type: 'decrease'
      }
    ];
    
    setSmartMoneyAlerts(mockAlerts);
  };

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0';
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const formatShares = (shares) => {
    if (!shares) return 'N/A';
    return shares.toLocaleString();
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % portfolios.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolios.length) % portfolios.length);
  };

  const handleViewDetails = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setViewMode('detailed');
  };

  const handleComparePortfolio = (portfolio) => {
    if (!userPortfolio || !userPortfolio.holdings || userPortfolio.holdings.length === 0) {
      alert('Please upload your portfolio first to compare with smart money managers.');
      return;
    }
    setSelectedPortfolio(portfolio);
    setShowComparison(true);
  };

  const handleLearnMore = (managerName) => {
    setSelectedManager(managerName);
    setShowEducation(true);
  };

  const getInvestmentStyleIcon = (style) => {
    const styleMap = {
      'Value Investing': '💎',
      'Growth/Tech': '🚀', 
      'Technology Growth': '🚀',
      'Activist Value': '⚔️',
      'Macro/Systematic': '🌍',
      'Asset Manager': '🏛️',
      'Multi-Strategy/Quant': '🔬',
      'Event-Driven': '⚡',
      'Disruptive Innovation': '🔮',
      'Technology/Venture': '🌟'
    };
    return styleMap[style] || '📊';
  };

  const getManagerStory = (portfolio) => {
    const stories = {
      'Warren Buffett': "The Oracle of Omaha has built wealth through patient value investing for over 60 years. His letters to shareholders are studied by investors worldwide.",
      'Ray Dalio': "Founder of the world's largest hedge fund, Bridgewater Associates. Pioneered systematic investing and radical transparency in management.",
      'Bill Ackman': "Famous activist investor who takes large positions and pushes for corporate change. Known for bold bets and public battles with management.",
      'Seth Klarman': "The secretive value investor runs Baupost Group with a focus on margin of safety. Rarely gives interviews but is highly respected on Wall Street.",
      'Dan Loeb': "Sharp-tongued activist investor known for colorful letters to CEOs. Third Point focuses on event-driven opportunities and corporate restructuring.",
      'Ken Griffin': "Built Citadel into a multi-strategy powerhouse using quantitative methods and technology. One of the highest-paid hedge fund managers.",
      'Steve Cohen': "Former SAC Capital founder now runs Point72. Known for trading acumen and building a multi-manager platform with hundreds of portfolio managers.",
      'Stanley Druckenmiller': "Legendary macro investor and former partner of George Soros. Known for making massive, concentrated bets on currency and economic trends.",
      'Cathie Wood': "Innovation-focused investor who became famous for early Tesla and Bitcoin calls. ARK focuses on disruptive technologies and genomics.",
      'BlackRock Inc': "The world's largest asset manager with $10+ trillion under management. Larry Fink has built an indexing and ETF empire.",
      'The Vanguard Group': "Pioneer of low-cost index investing founded by Jack Bogle. Mutual structure means profits go back to fund shareholders.",
      'State Street Global Advisors': "Creator of the first ETF (SPY) and major player in institutional asset management. Known for SPDR ETF family.",
      'Fidelity Management': "Boston-based investment giant known for active management and low-cost index funds. Strong retail and 401(k) presence.",
      'JPMorgan Asset Management': "Investment arm of America's largest bank. Combines traditional asset management with alternative investments."
    };
    
    return stories[portfolio.managerName] || stories[portfolio.institutionName] || 
           `${portfolio.description || 'Leading institutional investor with focus on ' + portfolio.style.toLowerCase() + ' strategies.'} Manages ${formatCurrency(portfolio.totalAUM)} across ${portfolio.holdingsCount} holdings.`;
  };

  const SmartMoneyAlerts = () => (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-yellow-600" />
          Smart Money Alerts
          <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
        </h3>
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAlerts ? 'Hide' : 'Show All'}
        </button>
      </div>
      
      {showAlerts && (
        <div className="space-y-3">
          {smartMoneyAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  alert.action === 'bought' ? 'bg-green-500' :
                  alert.action === 'increased' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">
                    {alert.manager} {alert.action} <span className="font-bold text-blue-600">{alert.stock}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {alert.company} • {alert.amount} ({alert.change})
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{alert.date}</span>
            </div>
          ))}
        </div>
      )}
      
      {!showAlerts && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span>{smartMoneyAlerts.length} new smart money moves this week</span>
        </div>
      )}
    </div>
  );

  const StoryCard = ({ portfolio, rank }) => {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 max-w-4xl mx-auto shadow-xl border border-blue-200">
        {/* Header with ranking and navigation hint */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
              #{rank}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {getInvestmentStyleIcon(portfolio.style)} {portfolio.style}
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {currentIndex + 1} of {portfolios.length}
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Manager Story */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {portfolio.institutionName}
              </h2>
              <div className="flex items-center space-x-2 text-xl text-blue-600 font-semibold mb-4">
                <span>{portfolio.managerName}</span>
                <span className="text-lg">{getInvestmentStyleIcon(portfolio.style)}</span>
              </div>
            </div>

            {/* Manager Story */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Manager Profile
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {getManagerStory(portfolio)}
              </p>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(portfolio.totalAUM)}
                </div>
                <div className="text-sm text-gray-600">Assets Under Management</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">
                  {portfolio.holdingsCount}
                </div>
                <div className="text-sm text-gray-600">Portfolio Holdings</div>
              </div>
            </div>

            {/* New Educational Button */}
            <button
              onClick={() => handleLearnMore(portfolio.managerName)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Learn {portfolio.managerName.split(' ')[1]}'s Strategy</span>
            </button>
          </div>

          {/* Right Side - Portfolio Preview */}
          <div className="space-y-6">
            
            {/* Portfolio Value */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Current Portfolio Value
              </h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(portfolio.totalValue)}
              </div>
              <div className="text-sm text-gray-600">
                Latest filing: {portfolio.quarter}
              </div>
            </div>

            {/* Top Holdings Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Largest Positions
              </h3>
              <div className="space-y-3">
                {portfolio.topHoldings?.slice(0, 4).map((holding, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{holding.symbol}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">
                          {holding.companyName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">
                        {holding.weight?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(holding.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleViewDetails(portfolio)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-5 h-5" />
                <span>View Complete Portfolio ({portfolio.holdingsCount} holdings)</span>
                <ArrowUpRight className="w-5 h-5" />
              </button>
              
              {userPortfolio && userPortfolio.holdings && userPortfolio.holdings.length > 0 && (
                <button
                  onClick={() => handleComparePortfolio(portfolio)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>Compare with Your Portfolio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DetailedView = ({ portfolio }) => {
    if (!portfolio) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Building2 className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {portfolio.institutionName}
                </h2>
                <p className="text-lg text-blue-600 font-medium">{portfolio.managerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatCurrency(portfolio.totalAUM)} AUM
              </span>
              <span>•</span>
              <span>{portfolio.holdingsCount} Holdings</span>
              <span>•</span>
              <span>{portfolio.style}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">
              {getManagerStory(portfolio)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleLearnMore(portfolio.managerName)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-lg"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Learn Strategy</span>
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Stories</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(portfolio.totalValue)}
            </p>
            <p className="text-sm text-blue-700">Portfolio Value</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-900">
              {portfolio.metrics?.topHoldingWeight?.toFixed(1)}%
            </p>
            <p className="text-sm text-green-700">Largest Position</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-900">
              {portfolio.metrics?.sectors || 0}
            </p>
            <p className="text-sm text-purple-700">Sectors</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-900">
              {portfolio.quarter}
            </p>
            <p className="text-sm text-orange-700">Latest Filing</p>
          </div>
        </div>

        {/* Compare Button if User Has Portfolio */}
        {userPortfolio && userPortfolio.holdings && userPortfolio.holdings.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => handleComparePortfolio(portfolio)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <BarChart2 className="w-5 h-5" />
              <span>Compare with Your Portfolio</span>
            </button>
          </div>
        )}

        {/* Complete Holdings Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-3" />
              Complete Portfolio Holdings ({portfolio.holdingsCount})
            </h3>
          </div>
          
          <div className="overflow-x-auto bg-gray-50 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Value
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.allHoldings?.map((holding, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-blue-600 text-lg">{holding.symbol}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={holding.companyName}>
                        {holding.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-mono">
                      {formatShares(holding.shares)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(holding.weight || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-600 min-w-[3rem]">
                          {holding.weight?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {holding.sector}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 text-lg">Loading manager stories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
        <div className="text-center">
          <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Manager Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInstitutionalPortfolios}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Manager Data Available</h3>
          <p className="text-gray-600">Please try again later or check your connection.</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'detailed' && selectedPortfolio) {
    return <DetailedView portfolio={selectedPortfolio} />;
  }

  const currentPortfolio = portfolios[currentIndex];

  return (
    <div className="space-y-6">
      {/* Smart Money Alerts */}
      <SmartMoneyAlerts />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-3 text-blue-600" />
              Smart Money Stories
              <span className="ml-3 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                13F FILINGS
              </span>
              <span className="ml-2 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {portfolios.length} MANAGERS
              </span>
            </h3>
            <p className="text-gray-600 mt-1">
              Discover the stories behind legendary investors and their portfolios • Live 13F data
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={prevSlide}
              disabled={portfolios.length <= 1}
              className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              disabled={portfolios.length <= 1}
              className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Single Story Card */}
      {currentPortfolio && (
        <StoryCard 
          portfolio={currentPortfolio} 
          rank={currentIndex + 1}
        />
      )}

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {portfolios.length} Famous Managers & Institutions
            </span>
            <span className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Ranked by Portfolio Value
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Updated Quarterly
            </span>
          </div>
          <div className="text-xs">
            Data from FMP Ultimate API • Real 13F Filings
          </div>
        </div>
      </div>

      {/* Modals */}
      <PortfolioComparison
        userPortfolio={userPortfolio}
        smartMoneyPortfolio={selectedPortfolio}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />
      
      <SmartMoneyEducation
        manager={selectedManager}
        isOpen={showEducation}
        onClose={() => setShowEducation(false)}
      />
    </div>
  );
};

export default InstitutionalPortfoliosCarousel;