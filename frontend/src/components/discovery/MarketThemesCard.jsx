import React from 'react';
import { Flame, TrendingUp, Zap, DollarSign, Leaf, ExternalLink } from 'lucide-react';

/**
 * 🔥 MARKET THEMES CARD - WITH CLICKABLE NAVIGATION
 * 
 * PURPOSE: Show dynamic market themes with click navigation to research page
 * NAVIGATION: Click individual stocks → /research/stock/{symbol}
 */
const MarketThemesCard = ({ data, isSelected, onClick, onStockClick }) => {
  const cardGradient = 'from-purple-500 to-pink-400';
  
  // Handle individual stock clicks
  const handleStockClick = (symbol, event) => {
    event.stopPropagation(); // Prevent card click
    console.log(`🔍 Market Themes: User clicked to research ${symbol}`);
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
              <Flame className="w-5 h-5" />
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                Loading...
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1 flex-shrink-0">Market Themes</h3>
            <p className="text-sm opacity-90 leading-tight flex-shrink-0">AI boom, rate cycles, macro trends</p>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                <div className="text-xs opacity-75">Loading themes...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group stocks by theme and get theme metadata
  const themes = groupStocksByTheme(data.stocks);
  const topThemes = themes.slice(0, 3); // Show top 3 themes in preview

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
            <Flame className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              Hot
            </span>
          </div>
          
          {/* Title and subtitle - Fixed height */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">Market Themes</h3>
            <p className="text-sm opacity-90 leading-tight">AI boom, rate cycles, macro trends</p>
          </div>
          
          {/* 🔗 CLICKABLE THEMES PREVIEW - Individual stocks clickable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {topThemes.length > 0 && (
              <div className="h-full flex flex-col">
                <div className="text-xs opacity-75 mb-2 flex-shrink-0">
                  🔥 {themes.length} themes • {data.stocks.length} stocks
                </div>
                
                {/* Themes list with individual click handlers */}
                <div className="flex-1 space-y-2 overflow-hidden">
                  {topThemes.map((theme, index) => (
                    <div key={index} className="text-xs">
                      {/* Theme header */}
                      <div className="flex items-center space-x-1 mb-1">
                        <theme.icon className="w-3 h-3 text-purple-200 flex-shrink-0" />
                        <span className="font-semibold text-purple-100">{theme.name}</span>
                        <span className="text-xs opacity-60">({theme.stocks.length})</span>
                      </div>
                      
                      {/* Theme stocks - show first 2 with click handlers */}
                      <div className="ml-4 space-y-0.5">
                        {theme.stocks.slice(0, 2).map((stock, stockIndex) => (
                          <div 
                            key={stockIndex}
                            className="cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-1 py-0.5 transition-colors group"
                            onClick={(e) => handleStockClick(stock.symbol, e)}
                            title={`Click to research ${stock.symbol} - ${stock.name}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <span className="font-medium group-hover:text-blue-200 transition-colors">{stock.symbol}</span>
                                <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className={`text-xs ${
                                stock.changePercent > 0 ? 'text-green-200' : 'text-red-200'
                              }`}>
                                {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                        {theme.stocks.length > 2 && (
                          <div className="text-xs opacity-60 ml-1">
                            +{theme.stocks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom section - Fixed height, no overlap */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate">
                {themes.length > 0 
                  ? `Click stocks to research • Explore all ${themes.length} themes`
                  : 'Market themes from algorithm analysis'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to group stocks by theme and add theme metadata
 */
function groupStocksByTheme(stocks) {
  if (!stocks || stocks.length === 0) return [];
  
  // Define theme metadata with icons and dynamic detection
  const themeConfig = {
    'AI Revolution': { 
      icon: Zap, 
      color: '#8b5cf6',
      keywords: ['AI', 'artificial intelligence', 'chip', 'AI chip', 'cloud', 'technology'],
      priority: 1
    },
    'Interest Rates': { 
      icon: DollarSign, 
      color: '#f59e0b',
      keywords: ['rates', 'banking', 'lending', 'net interest', 'financial'],
      priority: 2
    },
    'Energy Transition': { 
      icon: Leaf, 
      color: '#10b981',
      keywords: ['energy', 'renewable', 'electric', 'solar', 'clean'],
      priority: 3
    },
    'Consumer Trends': { 
      icon: TrendingUp, 
      color: '#ef4444',
      keywords: ['consumer', 'retail', 'spending', 'brands'],
      priority: 4
    }
  };
  
  // Group stocks by their themes
  const themeGroups = {};
  
  stocks.forEach(stock => {
    const stockTheme = stock.theme || 'Other';
    if (!themeGroups[stockTheme]) {
      themeGroups[stockTheme] = [];
    }
    themeGroups[stockTheme].push(stock);
  });
  
  // Convert to array with metadata and sort by priority/performance
  const themes = Object.entries(themeGroups).map(([themeName, themeStocks]) => {
    const config = themeConfig[themeName] || { 
      icon: TrendingUp, 
      color: '#6b7280',
      priority: 99
    };
    
    // Calculate theme performance (average of stock performance)
    const avgPerformance = themeStocks.reduce((sum, stock) => 
      sum + (stock.changePercent || 0), 0) / themeStocks.length;
    
    // Sort stocks within theme by performance
    const sortedStocks = [...themeStocks].sort((a, b) => 
      (b.changePercent || 0) - (a.changePercent || 0)
    );
    
    return {
      name: themeName,
      icon: config.icon,
      color: config.color,
      priority: config.priority,
      stocks: sortedStocks,
      avgPerformance: avgPerformance,
      stockCount: themeStocks.length
    };
  });
  
  // Sort themes by priority first, then by performance
  themes.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.avgPerformance - a.avgPerformance;
  });
  
  return themes;
}

export default MarketThemesCard;