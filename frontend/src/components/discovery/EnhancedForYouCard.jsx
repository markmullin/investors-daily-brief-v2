import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Building, DollarSign, Star, Users, Target } from 'lucide-react';

/**
 * 🎯 ENHANCED FOR YOU CARD - PERSONALIZED RECOMMENDATIONS
 * 
 * Phase 3 Enhancement: Actually uses user's portfolio data to recommend stocks
 * Based on sector matches, peers, and similar companies
 */
const EnhancedForYouCard = ({ data, isSelected, onClick, onStockClick }) => {
  const [personalizedStocks, setPersonalizedStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const cardGradient = 'from-pink-500 to-rose-400';
  
  // Load portfolio from localStorage or context
  useEffect(() => {
    loadPortfolioData();
  }, []);
  
  // Load user's portfolio
  const loadPortfolioData = () => {
    try {
      // Try to get portfolio from localStorage (from Portfolio page)
      const savedPortfolio = localStorage.getItem('portfolioData');
      if (savedPortfolio) {
        const portfolio = JSON.parse(savedPortfolio);
        setPortfolioData(portfolio);
        
        // Only fetch personalized if we have portfolio data
        if (portfolio.holdings && portfolio.holdings.length > 0) {
          fetchPersonalizedRecommendations(portfolio.holdings);
        }
      } else {
        // Use default recommendations if no portfolio
        useDefaultRecommendations();
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      useDefaultRecommendations();
    }
  };
  
  // Fetch personalized recommendations based on portfolio
  const fetchPersonalizedRecommendations = async (holdings) => {
    try {
      setLoading(true);
      
      // Send portfolio to backend for personalized recommendations
      const response = await fetch('/api/enhanced-discovery/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          portfolio: holdings.slice(0, 10) // Limit to top 10 holdings
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPersonalizedStocks(result.data);
        } else {
          useDefaultRecommendations();
        }
      } else {
        useDefaultRecommendations();
      }
    } catch (error) {
      console.error('Failed to fetch personalized recommendations:', error);
      useDefaultRecommendations();
    } finally {
      setLoading(false);
    }
  };
  
  // Use default recommendations from discovery data
  const useDefaultRecommendations = () => {
    if (data?.stocks) {
      // Create recommendations from existing discovery data
      const recommendations = data.stocks.map(stock => ({
        ...stock,
        reason: getDefaultReason(stock)
      }));
      setPersonalizedStocks(recommendations.slice(0, 6));
    }
  };
  
  // Generate default recommendation reasons
  const getDefaultReason = (stock) => {
    if (stock.changePercent > 5) return 'Strong momentum today';
    if (stock.volume > stock.avgVolume * 1.5) return 'Unusual volume activity';
    if (stock.pe && stock.pe < 15) return 'Attractive valuation';
    if (stock.dividendYield > 3) return 'High dividend yield';
    return 'Trending in the market';
  };
  
  // Handle stock click
  const handleStockClick = (symbol, event) => {
    event.stopPropagation();
    console.log(`🔍 For You: User clicked to research ${symbol}`);
    if (onStockClick) {
      onStockClick(symbol);
    }
  };
  
  // Get icon for recommendation reason
  const getReasonIcon = (reason) => {
    if (reason.includes('Peer')) return <Users className="w-3 h-3" />;
    if (reason.includes('sector')) return <Building className="w-3 h-3" />;
    if (reason.includes('momentum')) return <TrendingUp className="w-3 h-3" />;
    if (reason.includes('valuation')) return <DollarSign className="w-3 h-3" />;
    if (reason.includes('dividend')) return <DollarSign className="w-3 h-3" />;
    return <Star className="w-3 h-3" />;
  };
  
  // Get display stocks
  const displayStocks = personalizedStocks.length > 0 ? personalizedStocks : (data?.stocks || []);
  const previewStocks = displayStocks.slice(0, 4);
  
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
          {/* Header */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <Heart className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full flex items-center gap-1">
              {portfolioData ? (
                <>
                  <Users className="w-3 h-3" />
                  Based on Portfolio
                </>
              ) : (
                'For You'
              )}
            </span>
          </div>
          
          {/* Title and subtitle */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">For You</h3>
            <p className="text-sm opacity-90 leading-tight">
              {portfolioData 
                ? `Based on your ${portfolioData.holdings?.length || 0} holdings`
                : 'Personalized recommendations'
              }
            </p>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs opacity-75">Personalizing...</div>
                  </div>
                </div>
              </div>
            ) : previewStocks.length > 0 ? (
              <div className="h-full flex flex-col">
                {portfolioData && (
                  <div className="text-xs opacity-75 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Matches your investment style
                  </div>
                )}
                
                {/* Personalized stock list */}
                <div className="flex-1 space-y-2 overflow-hidden">
                  {previewStocks.map((stock, index) => (
                    <div 
                      key={index} 
                      className="text-xs cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-2 py-1.5 transition-colors group"
                      onClick={(e) => handleStockClick(stock.symbol, e)}
                      title={`Click to research ${stock.symbol}`}
                    >
                      {/* Row 1: Symbol and Price */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          <span className="font-semibold truncate group-hover:text-pink-200 transition-colors">
                            {stock.symbol}
                          </span>
                          <span className="text-xs opacity-75 truncate">
                            {stock.name}
                          </span>
                        </div>
                        <div className={`font-bold ml-2 flex-shrink-0 ${
                          (stock.changePercent || 0) >= 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(1)}%
                        </div>
                      </div>
                      
                      {/* Row 2: Recommendation reason */}
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        {getReasonIcon(stock.reason || '')}
                        <span className="truncate italic">
                          {stock.reason || 'Recommended for you'}
                        </span>
                      </div>
                      
                      {/* Row 3: Score or confidence */}
                      {stock.score && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-2.5 h-2.5 ${
                                  i < Math.round(stock.score / 20) 
                                    ? 'text-yellow-300 fill-current' 
                                    : 'text-white/30'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs opacity-75">
                            Match: {stock.score}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs opacity-75 mb-1">No portfolio data</div>
                  <div className="text-xs opacity-60">Add holdings to get personalized picks</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom section */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate">
                {portfolioData 
                  ? `Based on ${portfolioData.holdings?.length || 0} holdings • ${personalizedStocks.length} matches`
                  : 'Add portfolio for personalized picks'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedForYouCard;
