import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  ExternalLink, 
  Star,
  Target,
  Users,
  AlertCircle
} from 'lucide-react';

/**
 * 📈 ENHANCED MARKET PULSE CARD - WITH ANALYST RATINGS
 * 
 * Phase 1 Enhancement: Shows analyst consensus, price targets, and insider activity
 * Real-time data from FMP Ultimate API
 */
const EnhancedMarketPulseCard = ({ data, isSelected, onClick, onStockClick }) => {
  const [enhancedData, setEnhancedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cardGradient = 'from-blue-500 to-cyan-400';
  
  // Fetch enhanced data with analyst ratings
  useEffect(() => {
    if (data?.stocks && data.stocks.length > 0) {
      fetchEnhancedData();
    }
  }, [data]);
  
  const fetchEnhancedData = async () => {
    try {
      setLoading(true);
      const symbols = data.stocks.slice(0, 6).map(s => s.symbol);
      
      const response = await fetch('/api/enhanced-discovery/stocks-with-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      
      if (response.ok) {
        const result = await response.json();
        setEnhancedData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch enhanced data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get analyst rating color
  const getRatingColor = (consensus) => {
    switch (consensus) {
      case 'Strong Buy': return 'text-green-300 bg-green-900/50';
      case 'Buy': return 'text-green-200 bg-green-800/40';
      case 'Hold': return 'text-yellow-200 bg-yellow-800/40';
      case 'Sell': return 'text-red-200 bg-red-800/40';
      case 'Strong Sell': return 'text-red-300 bg-red-900/50';
      default: return 'text-gray-200 bg-gray-800/40';
    }
  };
  
  // Get insider sentiment icon
  const getInsiderIcon = (sentiment) => {
    switch (sentiment) {
      case 'Bullish': return '🟢';
      case 'Bearish': return '🔴';
      default: return '⚪';
    }
  };
  
  // Handle individual stock clicks
  const handleStockClick = (symbol, event) => {
    event.stopPropagation();
    console.log(`🔍 Enhanced Market Pulse: User clicked to research ${symbol}`);
    if (onStockClick) {
      onStockClick(symbol);
    }
  };
  
  const getStockIcon = (category) => {
    switch (category) {
      case 'gainer':
        return <TrendingUp className="w-3 h-3 text-green-200 flex-shrink-0" />;
      case 'loser':
        return <TrendingDown className="w-3 h-3 text-red-200 flex-shrink-0" />;
      case 'active':
        return <Volume2 className="w-3 h-3 text-blue-200 flex-shrink-0" />;
      default:
        return <TrendingUp className="w-3 h-3 text-gray-200 flex-shrink-0" />;
    }
  };
  
  const getChangeColor = (changePercent) => {
    if (changePercent > 0) return 'text-green-200';
    if (changePercent < 0) return 'text-red-200';
    return 'text-gray-200';
  };
  
  // Merge original data with enhanced data
  const getMergedStockData = () => {
    if (!data?.stocks) return [];
    
    return data.stocks.slice(0, 4).map(stock => {
      const enhanced = enhancedData?.find(e => e.symbol === stock.symbol);
      return {
        ...stock,
        ...enhanced
      };
    });
  };
  
  const previewStocks = getMergedStockData();
  
  // Loading state
  if (!data || !data.stocks) {
    return (
      <div 
        className={`w-full h-full relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
          isSelected ? 'ring-2 ring-white ring-opacity-60 shadow-2xl' : 'shadow-lg hover:shadow-xl'
        }`}
        onClick={onClick}
      >
        <div className={`w-full h-full bg-gradient-to-br ${cardGradient} p-4 text-white relative`}>
          <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                Loading...
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1 flex-shrink-0">Market Pulse</h3>
            <p className="text-sm opacity-90 leading-tight flex-shrink-0">Stocks moving today</p>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                <div className="text-xs opacity-75">Loading stocks...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`w-full h-full relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isSelected ? 'ring-2 ring-white ring-opacity-60 shadow-2xl' : 'shadow-lg hover:shadow-xl'
      }`}
      onClick={onClick}
    >
      <div className={`w-full h-full bg-gradient-to-br ${cardGradient} p-4 text-white relative`}>
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header - Fixed height */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              Enhanced
            </span>
          </div>
          
          {/* Title and subtitle - Fixed height */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">Market Pulse</h3>
            <p className="text-sm opacity-90 leading-tight">Top movers with analyst ratings</p>
          </div>
          
          {/* 🔗 ENHANCED STOCK PREVIEW - With analyst ratings */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {previewStocks.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="text-xs opacity-75 mb-2 flex-shrink-0 flex items-center justify-between">
                  <span>📈 {data.stocks.length} moving stocks</span>
                  {loading && <span className="animate-pulse">Loading ratings...</span>}
                </div>
                
                {/* Enhanced stock list with analyst data */}
                <div className="flex-1 space-y-2 overflow-hidden">
                  {previewStocks.map((stock, index) => (
                    <div 
                      key={index} 
                      className="text-xs cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-2 py-1.5 transition-colors group"
                      onClick={(e) => handleStockClick(stock.symbol, e)}
                      title={`Click to research ${stock.symbol} - ${stock.name}`}
                    >
                      {/* Row 1: Symbol, Price Change, Icon */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          {getStockIcon(stock.category)}
                          <span className="font-semibold truncate group-hover:text-blue-200 transition-colors">
                            {stock.symbol}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className={`font-bold ml-2 flex-shrink-0 ${getChangeColor(stock.changePercent)}`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(1)}%
                        </div>
                      </div>
                      
                      {/* Row 2: Enhanced data - Analyst rating and price target */}
                      {stock.analystRating && (
                        <div className="flex items-center justify-between text-xs opacity-90">
                          <div className="flex items-center gap-2">
                            {/* Analyst Consensus */}
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRatingColor(stock.analystRating?.consensus)}`}>
                              {stock.analystRating?.consensus || 'No Rating'}
                            </span>
                            
                            {/* Price Target Upside */}
                            {stock.priceTargets?.upside && (
                              <span className="flex items-center gap-0.5">
                                <Target className="w-3 h-3" />
                                <span className={stock.priceTargets.upside > 0 ? 'text-green-200' : 'text-red-200'}>
                                  {stock.priceTargets.upside > 0 ? '+' : ''}{stock.priceTargets.upside.toFixed(0)}%
                                </span>
                              </span>
                            )}
                            
                            {/* Insider Activity */}
                            {stock.insiderActivity && (
                              <span className="flex items-center gap-0.5" title={`Insider ${stock.insiderActivity.sentiment}`}>
                                {getInsiderIcon(stock.insiderActivity.sentiment)}
                              </span>
                            )}
                          </div>
                          
                          {/* Number of Analysts */}
                          {stock.analystRating?.totalAnalysts > 0 && (
                            <span className="flex items-center gap-0.5 opacity-75">
                              <Users className="w-3 h-3" />
                              {stock.analystRating.totalAnalysts}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Row 3: Company name */}
                      <div className="text-xs opacity-75 truncate mt-0.5">
                        {stock.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">No market data</div>
                  <div className="text-xs opacity-60">Try refreshing</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom section - Fixed height */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                {enhancedData ? 'Live analyst ratings' : 'Click stocks to research'}
                {data.stocks.length > 0 && ` • ${data.stocks.length} total`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMarketPulseCard;
