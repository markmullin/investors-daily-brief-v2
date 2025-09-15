import React from 'react';
import { Heart, TrendingUp, Shield, Target, Star, ExternalLink } from 'lucide-react';

/**
 * ❤️ FOR YOU CARD - WITH CLICKABLE NAVIGATION
 * 
 * PURPOSE: Show personalized stock recommendations with click navigation to research page
 * NAVIGATION: Click individual stocks → /research/stock/{symbol}
 */
const ForYouCard = ({ data, isSelected, onClick, onStockClick }) => {
  const cardGradient = 'from-pink-500 to-rose-400';
  
  // Handle individual stock clicks
  const handleStockClick = (symbol, event) => {
    event.stopPropagation(); // Prevent card click
    console.log(`🔍 For You: User clicked to research ${symbol}`);
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
              <Heart className="w-5 h-5" />
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                Loading...
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1 flex-shrink-0">For You</h3>
            <p className="text-sm opacity-90 leading-tight flex-shrink-0">Personalized stock recommendations</p>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                <div className="text-xs opacity-75">Loading recommendations...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort stocks by score and enhance with recommendation reasoning
  const enhancedStocks = data.stocks
    .map(stock => ({
      ...stock,
      recommendationReason: getRecommendationReason(stock),
      riskIcon: getRiskIcon(stock.risk),
      scoreColor: getScoreColor(stock.score)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Show first 4 stocks in card preview (highest scores)
  const previewStocks = enhancedStocks.slice(0, 4);

  // Determine recommendation basis
  const recommendationBasis = getRecommendationBasis(data);

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
            <Heart className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              AI Picks
            </span>
          </div>
          
          {/* Title and subtitle - Fixed height */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">For You</h3>
            <p className="text-sm opacity-90 leading-tight">Personalized stock recommendations</p>
          </div>
          
          {/* Recommendation basis */}
          <div className="flex-shrink-0 mb-2">
            <div className="text-xs opacity-75 bg-white bg-opacity-15 rounded px-2 py-1">
              📊 Based on: {recommendationBasis}
            </div>
          </div>
          
          {/* 🔗 CLICKABLE STOCK PREVIEW - Individual stocks clickable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {previewStocks.length > 0 && (
              <div className="h-full flex flex-col">
                <div className="text-xs opacity-75 mb-2 flex-shrink-0">
                  ⭐ {data.stocks.length} personalized picks • Avg score: {Math.round(data.summary?.averageScore || 0)}
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
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          <stock.riskIcon className="w-3 h-3 text-pink-200 flex-shrink-0" />
                          <span className="font-semibold truncate group-hover:text-blue-200 transition-colors">{stock.symbol}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${stock.scoreColor}`}></div>
                          <span className="font-bold text-xs">{stock.score}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs opacity-85 truncate mb-0.5">
                        {stock.reason}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>{stock.recommendationReason}</span>
                        <span className={`font-medium ${
                          stock.changePercent > 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(1)}%
                        </span>
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
                {data.stocks.length > 0 
                  ? `Click stocks to research • See all ${data.stocks.length} picks`
                  : 'Personalized recommendations from AI'
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
 * Helper function to get recommendation reasoning
 */
function getRecommendationReason(stock) {
  const score = stock.score || 0;
  const risk = stock.risk || 'moderate';
  
  if (score >= 90) {
    return 'Top pick';
  } else if (score >= 85) {
    return 'Strong buy';
  } else if (score >= 80) {
    return 'Good value';
  } else if (risk === 'low') {
    return 'Safe choice';
  } else if (risk === 'high' || risk === 'moderate-high') {
    return 'Growth play';
  } else {
    return 'Balanced pick';
  }
}

/**
 * Helper function to get risk icon
 */
function getRiskIcon(risk) {
  switch (risk) {
    case 'low':
      return Shield;
    case 'moderate':
      return Target;
    case 'moderate-high':
    case 'high':
      return TrendingUp;
    default:
      return Star;
  }
}

/**
 * Helper function to get score color
 */
function getScoreColor(score) {
  if (score >= 90) return 'bg-green-400';
  if (score >= 80) return 'bg-green-300';
  if (score >= 70) return 'bg-yellow-300';
  if (score >= 60) return 'bg-orange-300';
  return 'bg-red-300';
}

/**
 * Helper function to determine recommendation basis
 */
function getRecommendationBasis(data) {
  if (!data.personalization) {
    // Infer from the data structure
    if (data.summary?.riskDistribution) {
      const { low, moderate, high } = data.summary.riskDistribution;
      const total = low + moderate + high;
      
      if (high > total * 0.5) {
        return 'Growth investor profile, technology focus';
      } else if (low > total * 0.5) {
        return 'Conservative investor profile, dividend focus';
      } else {
        return 'Balanced investor profile, diversified approach';
      }
    }
    
    // Default based on common technology focus
    return 'Technology & growth investor profile';
  }
  
  return data.personalization;
}

export default ForYouCard;