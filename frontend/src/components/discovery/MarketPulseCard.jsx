import React from 'react';
import { TrendingUp, TrendingDown, Volume2, ExternalLink } from 'lucide-react';

/**
 * 📈 MARKET PULSE CARD - WITH CLICKABLE STOCKS
 * 
 * PURPOSE: Show moving stocks with click navigation to research page
 * NAVIGATION: Click individual stocks → /research/stock/{symbol}
 */
const MarketPulseCard = ({ data, isSelected, onClick, onStockClick }) => {
  const cardGradient = 'from-blue-500 to-cyan-400';
  
  // Handle individual stock clicks
  const handleStockClick = (symbol, event) => {
    event.stopPropagation(); // Prevent card click
    console.log(`🔍 Market Pulse: User clicked to research ${symbol}`);
    if (onStockClick) {
      onStockClick(symbol);
    }
  };
  
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

  // Show first 4 stocks in card preview
  const previewStocks = data.stocks.slice(0, 4);

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
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          
          {/* Title and subtitle - Fixed height */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">Market Pulse</h3>
            <p className="text-sm opacity-90 leading-tight">Stocks moving today</p>
          </div>
          
          {/* 🔗 CLICKABLE STOCK PREVIEW - Individual stocks clickable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {previewStocks.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="text-xs opacity-75 mb-2 flex-shrink-0">
                  📈 {data.stocks.length} moving stocks
                </div>
                
                {/* Stock list with individual click handlers */}
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {previewStocks.map((stock, index) => (
                    <div 
                      key={index} 
                      className="text-xs cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-1 py-0.5 transition-colors group"
                      onClick={(e) => handleStockClick(stock.symbol, e)}
                      title={`Click to research ${stock.symbol} - ${stock.name}`}
                    >
                      <div className="flex items-center justify-between">
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
          
          {/* Bottom section - Fixed height, no overlap */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate">
                {data.stocks.length > 0 
                  ? `Click stocks to research • See all ${data.stocks.length}`
                  : 'Market pulse data from FMP API'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPulseCard;