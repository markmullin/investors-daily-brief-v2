import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertCircle, DollarSign, Target } from 'lucide-react';

/**
 * 📅 ENHANCED EARNINGS SPOTLIGHT CARD
 * 
 * Phase 1 Enhancement: Shows earnings estimates, surprises, and whisper numbers
 * Uses FMP Ultimate API for comprehensive earnings data
 */
const EnhancedEarningsSpotlightCard = ({ data, isSelected, onClick, onStockClick }) => {
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const cardGradient = 'from-orange-500 to-yellow-400';
  
  // Fetch enhanced earnings data
  useEffect(() => {
    if (data?.stocks && data.stocks.length > 0) {
      fetchEnhancedEarningsData();
    }
  }, [data]);
  
  const fetchEnhancedEarningsData = async () => {
    try {
      setLoading(true);
      const symbols = data.stocks.slice(0, 8).map(s => s.symbol);
      
      // Fetch earnings calendar and estimates
      const [calendarRes, estimatesRes] = await Promise.allSettled([
        fetch('/api/watchlist/earnings-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        }),
        fetch('/api/enhanced-discovery/earnings-estimates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        })
      ]);
      
      const calendarData = calendarRes.status === 'fulfilled' ? await calendarRes.value.json() : null;
      const estimatesData = estimatesRes.status === 'fulfilled' ? await estimatesRes.value.json() : null;
      
      // Merge data
      const merged = symbols.map(symbol => {
        const stock = data.stocks.find(s => s.symbol === symbol) || {};
        const calendar = calendarData?.data?.[symbol] || {};
        const estimates = estimatesData?.data?.[symbol] || {};
        
        return {
          ...stock,
          earningsDate: calendar.date || stock.earningsDate,
          earningsTime: calendar.time || 'AMC',
          estimatedEPS: estimates.consensusEPS || calendar.estimatedEPS,
          previousEPS: estimates.previousEPS,
          surpriseHistory: estimates.surpriseHistory || [],
          analystCount: estimates.analystCount || 0,
          epsRevisions: estimates.revisions || { up: 0, down: 0, unchanged: 0 }
        };
      });
      
      setEarningsData(merged);
    } catch (error) {
      console.error('Failed to fetch enhanced earnings data:', error);
      // Fallback to original data
      setEarningsData(data?.stocks || []);
    } finally {
      setLoading(false);
    }
  };
  
  // Format earnings date
  const formatEarningsDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const today = new Date();
    const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days`;
    if (daysUntil <= 14) return `${Math.floor(daysUntil / 7)} week`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Get earnings time badge color
  const getTimeColor = (time) => {
    switch (time) {
      case 'BMO': return 'bg-blue-500/30 text-blue-200';
      case 'AMC': return 'bg-purple-500/30 text-purple-200';
      default: return 'bg-gray-500/30 text-gray-200';
    }
  };
  
  // Get surprise indicator
  const getSurpriseIndicator = (surpriseHistory) => {
    if (!surpriseHistory || surpriseHistory.length === 0) return null;
    
    const recentBeats = surpriseHistory.slice(0, 4).filter(s => s.surprise > 0).length;
    const recentMisses = surpriseHistory.slice(0, 4).filter(s => s.surprise < 0).length;
    
    if (recentBeats >= 3) return { text: 'Beat Streak', color: 'text-green-200' };
    if (recentMisses >= 2) return { text: 'Miss Risk', color: 'text-red-200' };
    return { text: 'Mixed', color: 'text-yellow-200' };
  };
  
  // Get revision trend
  const getRevisionTrend = (revisions) => {
    if (!revisions) return null;
    
    if (revisions.up > revisions.down * 2) return '↑';
    if (revisions.down > revisions.up * 2) return '↓';
    return '→';
  };
  
  // Handle stock click
  const handleStockClick = (symbol, event) => {
    event.stopPropagation();
    console.log(`🔍 Earnings Spotlight: User clicked to research ${symbol}`);
    if (onStockClick) {
      onStockClick(symbol);
    }
  };
  
  // Get display stocks
  const displayStocks = earningsData.length > 0 ? earningsData : (data?.stocks || []);
  const upcomingEarnings = displayStocks
    .filter(s => s.earningsDate)
    .sort((a, b) => new Date(a.earningsDate) - new Date(b.earningsDate))
    .slice(0, 5);
  
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
            <Calendar className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full flex items-center gap-1">
              {loading ? 'Loading...' : `${upcomingEarnings.length} This Week`}
            </span>
          </div>
          
          {/* Title and subtitle */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">Earnings Spotlight</h3>
            <p className="text-sm opacity-90 leading-tight">
              Upcoming reports with estimates
            </p>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs opacity-75">Loading earnings...</div>
                  </div>
                </div>
              </div>
            ) : upcomingEarnings.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="text-xs opacity-75 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Consensus estimates shown
                </div>
                
                {/* Enhanced earnings list */}
                <div className="flex-1 space-y-2 overflow-hidden">
                  {upcomingEarnings.map((stock, index) => (
                    <div 
                      key={index} 
                      className="text-xs cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-2 py-1.5 transition-colors group"
                      onClick={(e) => handleStockClick(stock.symbol, e)}
                      title={`Click to research ${stock.symbol}`}
                    >
                      {/* Row 1: Symbol, Date, Time */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="font-semibold group-hover:text-orange-200 transition-colors">
                            {stock.symbol}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getTimeColor(stock.earningsTime)}`}>
                            {stock.earningsTime}
                          </span>
                        </div>
                        <span className="font-medium text-white/90">
                          {formatEarningsDate(stock.earningsDate)}
                        </span>
                      </div>
                      
                      {/* Row 2: EPS Estimates and Surprise History */}
                      <div className="flex items-center justify-between text-xs opacity-90">
                        <div className="flex items-center gap-2">
                          {/* EPS Estimate */}
                          {stock.estimatedEPS && (
                            <span className="flex items-center gap-0.5">
                              <Target className="w-3 h-3" />
                              EPS: ${stock.estimatedEPS?.toFixed(2)}
                            </span>
                          )}
                          
                          {/* Previous EPS for comparison */}
                          {stock.previousEPS && (
                            <span className="opacity-75">
                              (Prev: ${stock.previousEPS?.toFixed(2)})
                            </span>
                          )}
                          
                          {/* Revision Trend */}
                          {stock.epsRevisions && (
                            <span className="font-bold">
                              {getRevisionTrend(stock.epsRevisions)}
                            </span>
                          )}
                        </div>
                        
                        {/* Surprise History Indicator */}
                        {stock.surpriseHistory && getSurpriseIndicator(stock.surpriseHistory) && (
                          <span className={getSurpriseIndicator(stock.surpriseHistory).color}>
                            {getSurpriseIndicator(stock.surpriseHistory).text}
                          </span>
                        )}
                      </div>
                      
                      {/* Row 3: Company name and analyst count */}
                      <div className="flex items-center justify-between text-xs opacity-75 mt-0.5">
                        <span className="truncate">{stock.name}</span>
                        {stock.analystCount > 0 && (
                          <span>{stock.analystCount} analysts</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs opacity-75 mb-1">No earnings this week</div>
                  <div className="text-xs opacity-60">Check back later</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom section */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate">
                {upcomingEarnings.length > 0 
                  ? `${upcomingEarnings.length} reports with estimates`
                  : 'Earnings calendar with consensus'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEarningsSpotlightCard;
