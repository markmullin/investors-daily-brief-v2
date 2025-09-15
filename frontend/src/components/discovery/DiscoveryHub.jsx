import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, TrendingDown, ExternalLink, Calendar, Flame, Heart } from 'lucide-react';

// Import individual discovery cards
import MarketPulseCard from './MarketPulseCard';
import EnhancedMarketPulseCard from './EnhancedMarketPulseCard'; // Enhanced version with analyst ratings
import EarningsSpotlightCard from './EarningsSpotlightCard';
import EnhancedEarningsSpotlightCard from './EnhancedEarningsSpotlightCard'; // Enhanced version with estimates
import MarketThemesCard from './MarketThemesCard';
import EnhancedMarketThemesCard from './EnhancedMarketThemesCard'; // Enhanced version with real sector data
import ForYouCard from './ForYouCard';
import EnhancedForYouCard from './EnhancedForYouCard'; // Enhanced version with portfolio-based recommendations

/**
 * 🎯 AI-POWERED STOCK DISCOVERY HUB - WITH CLICKABLE NAVIGATION
 * 
 * MISSION: Clean discovery experience that leads to full stock research
 * PURPOSE: Discover stocks → Click → Full-page research analysis
 * 
 * 🔗 NAVIGATION FLOW:
 * Discovery Cards → Click Stock → /research/stock/{symbol} → Full Research Page
 */

const DiscoveryHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [discoveryData, setDiscoveryData] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState('market_pulse');

  // Discovery categories configuration - Using Enhanced Components
  const discoveryCategories = [
    {
      id: 'market_pulse',
      title: 'Market Pulse',
      subtitle: "Stocks moving today with analyst ratings",
      description: 'Gainers, losers with real-time analyst consensus',
      component: EnhancedMarketPulseCard, // Using enhanced version
      icon: TrendingUp
    },
    {
      id: 'earnings_spotlight', 
      title: 'Earnings Spotlight',
      subtitle: 'Reports with estimates & surprises',
      description: 'Upcoming earnings with analyst consensus',
      component: EnhancedEarningsSpotlightCard, // Using enhanced version
      icon: Calendar
    },
    {
      id: 'market_themes',
      title: 'Market Themes',
      subtitle: 'Real-time sector rotation',
      description: 'Live sector performance and market themes',
      component: EnhancedMarketThemesCard, // Using enhanced version
      icon: Flame
    },
    {
      id: 'for_you',
      title: 'For You',
      subtitle: 'Portfolio-based recommendations',
      description: 'Stocks matching your holdings and investment style',
      component: EnhancedForYouCard, // Using enhanced version
      icon: Heart
    }
  ];

  // Load discovery data
  const loadDiscoveryData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 [DISCOVERY HUB] Loading stock discovery data...');
      
      // Fetch from our simple discovery API
      const response = await fetch('/api/simple/discovery');
      
      if (!response.ok) {
        throw new Error(`Discovery API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDiscoveryData(result.data);
        console.log('✅ [DISCOVERY HUB] Stock discovery data loaded successfully');
        console.log('📊 Total stocks found:', result.summary?.totalStocks || 0);
      } else {
        throw new Error(result.error || 'Failed to load stock discovery');
      }

    } catch (err) {
      console.error('❌ [DISCOVERY HUB] Error loading data:', err);
      setError(err.message);
      
    } finally {
      setLoading(false);
    }
  };

  // Initialize discovery data
  React.useEffect(() => {
    loadDiscoveryData();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDiscoveryData, 300000);
    return () => clearInterval(interval);
  }, []);

  // 🔗 NAVIGATE TO STOCK RESEARCH PAGE
  const handleStockClick = (symbol) => {
    console.log(`🔍 Navigating to research page for: ${symbol}`);
    navigate(`/research/stock/${symbol}`);
  };

  // Render detailed stock list view with clickable stocks
  const renderDetailedView = () => {
    const category = discoveryCategories.find(cat => cat.id === selectedCategory);
    const data = discoveryData?.[selectedCategory];

    if (!category || !data || !data.stocks) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Stocks Found</h3>
          <p className="text-gray-600">
            Unable to load stock discovery data for this category.
          </p>
        </div>
      );
    }

    const Icon = category.icon;

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with category-specific styling */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
                <p className="opacity-90">{category.description}</p>
              </div>
            </div>
            <button
              onClick={loadDiscoveryData}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Refresh stocks"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stock List Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {data.stocks.length} Stocks Discovered
            </h3>
            <div className="text-sm text-gray-500">
              Updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          {/* 🔗 CLICKABLE STOCK GRID - Each stock navigates to research page */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.stocks.map((stock, index) => (
              <div
                key={stock.symbol}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-md group"
                onClick={() => handleStockClick(stock.symbol)}
                title={`Click to research ${stock.symbol} - ${stock.name}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {stock.symbol}
                    </span>
                    {stock.changePercent && (
                      <span className={`text-sm font-medium ${
                        stock.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                
                <div className="text-sm text-gray-600 mb-2 truncate">
                  {stock.name}
                </div>
                
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded group-hover:bg-blue-100 transition-colors">
                  {stock.reason}
                </div>

                {/* Category-specific additional info */}
                {selectedCategory === 'earnings_spotlight' && stock.earningsDate && (
                  <div className="text-xs text-purple-600 mt-1">
                    📅 {new Date(stock.earningsDate).toLocaleDateString()}
                    {stock.marketCapFormatted && ` • ${stock.marketCapFormatted}`}
                  </div>
                )}
                
                {selectedCategory === 'market_themes' && stock.theme && (
                  <div className="text-xs text-green-600 mt-1">
                    🔥 {stock.theme}
                  </div>
                )}
                
                {selectedCategory === 'for_you' && stock.score && (
                  <div className="text-xs text-pink-600 mt-1">
                    ⭐ {stock.score}/100 • {stock.risk} risk
                  </div>
                )}

                {stock.price && (
                  <div className="text-xs text-gray-500 mt-1">
                    💰 ${stock.price.toFixed(2)}
                  </div>
                )}

                {/* Click hint */}
                <div className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to research →
                </div>
              </div>
            ))}
          </div>

          {/* Summary Information */}
          {data.summary && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Discovery Summary</h4>
              <div className="text-sm text-blue-800">
                {selectedCategory === 'market_pulse' && (
                  <p>
                    📈 Market activity: {data.summary.gainersFound || 0} gainers, {data.summary.losersFound || 0} losers, 
                    {data.summary.activesFound || 0} high-volume stocks
                  </p>
                )}
                {selectedCategory === 'earnings_spotlight' && (
                  <p>
                    📊 {data.summary.totalStocks} companies with upcoming earnings • 
                    Prioritized by {data.summary.sortedBy?.replace('_', ' ') || 'relevance'}
                  </p>
                )}
                {selectedCategory === 'market_themes' && data.themes && (
                  <p>
                    🔥 {Object.keys(data.themes).length} themes: {Object.keys(data.themes).join(', ')}
                  </p>
                )}
                {selectedCategory === 'for_you' && (
                  <p>
                    ❤️ Personalized recommendations based on market trends and popular stocks
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Loading Stock Discovery</h3>
          <p className="text-gray-600 text-center">
            Finding the best stocks for you to research...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Stock Discovery Unavailable</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadDiscoveryData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Stock Discovery</h2>
        </div>
        <p className="text-gray-600">
          Discover stocks to research • Click any stock for full analysis • {discoveryData ? 
            Object.values(discoveryData).reduce((sum, cat) => sum + (cat.stocks?.length || 0), 0) 
            : 0} stocks found
        </p>
      </div>

      {/* 🔗 4 Discovery Cards - Pass navigation handler to each card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {discoveryCategories.map((category) => {
          const CardComponent = category.component;
          return (
            <div key={category.id} className="h-48">
              <CardComponent
                data={discoveryData?.[category.id]}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                onStockClick={handleStockClick} // Pass navigation handler
              />
            </div>
          );
        })}
      </div>

      {/* Detailed Stock View with Clickable Stocks */}
      {renderDetailedView()}

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-500">
        <p>🔗 Click any stock to access full Bloomberg Terminal-grade analysis</p>
        <p className="mt-1">
          ✅ Real-time data • ✅ Instant navigation • ✅ Complete research workflow
        </p>
      </div>
    </div>
  );
};

export default DiscoveryHub;