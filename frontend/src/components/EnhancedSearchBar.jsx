import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, Users, Clock, AlertCircle, RefreshCw, ArrowUpRight, Sparkles } from 'lucide-react';
import { marketApi } from '../services/api';

/**
 * Premium Enhanced SearchBar - Absolute Highest Quality UI/UX
 * 
 * Design Principles:
 * - Sophisticated typography with perfect spacing
 * - Black/white/gray palette with subtle accent colors
 * - Smooth micro-interactions and animations
 * - Premium visual hierarchy
 * - Consistent with dashboard aesthetic
 */
const EnhancedSearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [previewData, setPreviewData] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [connectionError, setConnectionError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // Premium trending suggestions with enhanced data
  const trendingSuggestions = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', reason: 'AI Infrastructure Leader', trend: 'hot', sector: 'Technology', marketCap: 1800000000000, badge: '🔥 Hot' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', reason: 'Electric Vehicle Pioneer', trend: 'hot', sector: 'Consumer Cyclical', marketCap: 800000000000, badge: '⚡ EV' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', reason: 'Cloud Computing Giant', trend: 'stable', sector: 'Technology', marketCap: 2800000000000, badge: '☁️ Cloud' },
    { symbol: 'AAPL', name: 'Apple Inc.', reason: 'Consumer Electronics Leader', trend: 'stable', sector: 'Technology', marketCap: 3000000000000, badge: '🍎 Tech' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', reason: 'Social Media & VR', trend: 'recovering', sector: 'Communication Services', marketCap: 750000000000, badge: '🥽 Meta' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', reason: 'Search & AI Innovation', trend: 'stable', sector: 'Communication Services', marketCap: 1600000000000, badge: '🔍 Search' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', reason: 'E-commerce & AWS', trend: 'stable', sector: 'Consumer Cyclical', marketCap: 1500000000000, badge: '📦 Commerce' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', reason: 'Semiconductor Innovation', trend: 'hot', sector: 'Technology', marketCap: 220000000000, badge: '🔬 Chips' }
  ];

  // Test API connection on component mount
  useEffect(() => {
    testAPIConnection();
  }, []);

  const testAPIConnection = async () => {
    try {
      const healthResponse = await fetch('/api/market/search?query=test', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (healthResponse.ok) {
        setApiStatus('working');
        setConnectionError(null);
      } else {
        setApiStatus('error');
        setConnectionError(`API returned status ${healthResponse.status}`);
      }
    } catch (error) {
      setApiStatus('error');
      setConnectionError(error.message);
    }
  };

  // Enhanced fetch suggestions with better error handling
  const fetchSuggestions = async (term) => {
    if (term.length < 2) {
      setSuggestions(trendingSuggestions);
      return;
    }
    
    try {
      setLoadingSuggestions(true);
      
      const response = await fetch(`/api/market/search?query=${encodeURIComponent(term)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        const formattedSuggestions = data.results.slice(0, 8).map(company => ({
          symbol: company.symbol,
          name: company.name,
          sector: company.sector || 'Unknown',
          marketCap: company.marketCap || 0,
          exchange: company.exchange || 'NASDAQ',
          reason: 'Search Result',
          trend: 'neutral',
          badge: '🔍 Result'
        }));
        
        setSuggestions(formattedSuggestions);
        setApiStatus('working');
        setConnectionError(null);
      } else {
        const fallbackSuggestions = getIntelligentFallback(term);
        setSuggestions(fallbackSuggestions);
      }
      
    } catch (error) {
      setApiStatus('error');
      setConnectionError(error.message);
      const fallbackSuggestions = getIntelligentFallback(term);
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Intelligent fallback suggestions
  const getIntelligentFallback = (term) => {
    const searchLower = term.toLowerCase();
    
    const filtered = trendingSuggestions.filter(suggestion => 
      suggestion.symbol.toLowerCase().includes(searchLower) ||
      suggestion.name.toLowerCase().includes(searchLower) ||
      suggestion.reason.toLowerCase().includes(searchLower) ||
      suggestion.sector.toLowerCase().includes(searchLower)
    );
    
    if (filtered.length > 0) {
      return filtered;
    }
    
    return trendingSuggestions.map(s => ({
      ...s,
      reason: 'Popular Stock',
      fallback: true
    }));
  };

  // Enhanced preview data
  const fetchPreviewData = async (symbol) => {
    try {
      const [quoteData, fundamentalsData] = await Promise.all([
        marketApi.getQuote(symbol).catch(() => null),
        fetch(`/api/research/fundamentals/${symbol}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      ]);
      
      if (!quoteData && !fundamentalsData) {
        const trendingInfo = trendingSuggestions.find(s => s.symbol === symbol);
        if (trendingInfo) {
          setPreviewData({
            symbol,
            name: trendingInfo.name,
            price: null,
            change: null,
            changePercent: null,
            marketCap: trendingInfo.marketCap,
            pe: null,
            sentiment: 'neutral',
            insiderActivity: 'unknown',
            fallback: true
          });
          return;
        }
      }
      
      setPreviewData({
        symbol,
        name: quoteData?.name || fundamentalsData?.name || '',
        price: quoteData?.price,
        change: quoteData?.change,
        changePercent: quoteData?.changePercent,
        marketCap: quoteData?.marketCap || fundamentalsData?.marketCap,
        pe: fundamentalsData?.pe || quoteData?.pe,
        sentiment: getMarketSentiment(quoteData?.changePercent),
        insiderActivity: fundamentalsData?.insiderSignal || 'neutral',
        fallback: !quoteData && !fundamentalsData
      });
      
    } catch (error) {
      setPreviewData(null);
    }
  };

  // Get market sentiment indicator
  const getMarketSentiment = (changePercent) => {
    if (!changePercent) return 'neutral';
    if (changePercent > 2) return 'bullish';
    if (changePercent < -2) return 'bearish';
    return 'neutral';
  };

  // Format market cap with premium styling
  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === 0) return 'N/A';
    
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(0)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(0)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedSuggestion(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setSearchTerm(suggestion.symbol);
    setShowSuggestions(false);
    setPreviewData(null);
    
    if (onSearch) {
      setIsSearching(true);
      onSearch(suggestion.symbol)
        .finally(() => setIsSearching(false));
    }
  };

  // Handle suggestion hover
  const handleSuggestionHover = (suggestion) => {
    fetchPreviewData(suggestion.symbol);
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        setIsSearching(true);
        onSearch(searchTerm.toUpperCase())
          .finally(() => setIsSearching(false));
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestion]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (searchTerm.length < 2) {
      setShowSuggestions(true);
      setSuggestions(trendingSuggestions);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setPreviewData(null);
    }, 200);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setPreviewData(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get trend indicator with premium styling
  const getTrendIndicator = (trend) => {
    switch (trend) {
      case 'hot':
        return <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>;
      case 'recovering':
        return <div className="w-2 h-2 rounded-full bg-blue-400"></div>;
      case 'stable':
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-300"></div>;
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Main Search Container */}
      <div className={`relative transition-all duration-300 ${isFocused ? 'transform -translate-y-1' : ''}`}>
        <form onSubmit={handleSubmit} className="relative">
          {/* Search Input */}
          <div className={`relative overflow-hidden transition-all duration-300 ${
            isFocused 
              ? 'bg-white border-2 border-gray-900 shadow-2xl rounded-2xl' 
              : 'bg-white border border-gray-200 shadow-md rounded-xl hover:shadow-lg'
          }`}>
            <div className="flex items-center">
              {/* Search Icon */}
              <div className="flex items-center justify-center w-14 h-14">
                <Search className={`transition-all duration-300 ${
                  isFocused ? 'w-5 h-5 text-gray-900' : 'w-4 h-4 text-gray-500'
                }`} />
              </div>
              
              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Search any stock symbol or company name..."
                className={`flex-1 py-4 pr-4 text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none transition-all duration-300 ${
                  isFocused ? 'text-lg font-medium' : 'text-base'
                }`}
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              />
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-3 pr-4">
                {apiStatus === 'error' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-xs text-amber-600 font-medium">Offline</span>
                  </div>
                )}
                
                {loadingSuggestions && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className={`m-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                  isSearching 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : isFocused 
                      ? 'bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:shadow-xl' 
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                }`}
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              >
                {isSearching ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Analyze</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Premium Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={`absolute top-full left-0 right-0 z-50 transition-all duration-300 ${
          isFocused ? 'mt-3' : 'mt-2'
        }`}>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900" style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    {searchTerm.length < 2 ? 'Trending Stocks' : 'Smart Suggestions'}
                  </span>
                </div>
                {apiStatus === 'error' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-xs text-amber-600 font-medium">Offline Mode</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Loading State */}
            {loadingSuggestions ? (
              <div className="px-6 py-8 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                  <span className="text-gray-600 font-medium">Finding suggestions...</span>
                </div>
              </div>
            ) : (
              /* Suggestion Items */
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.symbol}-${index}`}
                    ref={el => suggestionRefs.current[index] = el}
                    className={`group px-6 py-4 cursor-pointer transition-all duration-200 ${
                      selectedSuggestion === index 
                        ? 'bg-gray-50 border-l-4 border-gray-900' 
                        : 'border-l-4 border-transparent hover:bg-gray-25'
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => handleSuggestionHover(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Content */}
                      <div className="flex items-center space-x-4">
                        {/* Trend Indicator */}
                        <div className="flex items-center justify-center w-8 h-8">
                          {getTrendIndicator(suggestion.trend)}
                        </div>
                        
                        {/* Symbol & Name */}
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900" style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              letterSpacing: '-0.02em'
                            }}>
                              {suggestion.symbol}
                            </span>
                            {suggestion.badge && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                {suggestion.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 font-medium" style={{ 
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}>
                            {suggestion.name || suggestion.reason}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Content */}
                      <div className="flex items-center space-x-4">
                        {/* Sector */}
                        {suggestion.sector && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                              {suggestion.sector}
                            </div>
                          </div>
                        )}
                        
                        {/* Market Cap */}
                        {suggestion.marketCap && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                              Market Cap
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                              {formatMarketCap(suggestion.marketCap)}
                            </div>
                          </div>
                        )}
                        
                        {/* Arrow */}
                        <ArrowUpRight className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                          selectedSuggestion === index ? 'text-gray-900 transform translate-x-1 -translate-y-1' : 'group-hover:text-gray-600'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Preview Card */}
      {previewData && showSuggestions && (
        <div className="absolute top-full right-0 z-50 mt-3 w-96">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-900" style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.02em'
                  }}>
                    {previewData.symbol}
                  </h4>
                  {previewData.name && (
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      {previewData.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${previewData.fallback ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                  <span className="text-xs text-gray-500 font-medium">
                    {previewData.fallback ? 'Limited Data' : 'Live Data'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Price */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Current Price
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {previewData.price ? `$${previewData.price.toFixed(2)}` : 'N/A'}
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${
                    previewData.changePercent > 0 ? 'text-green-600' : 
                    previewData.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {previewData.changePercent ? 
                      `${previewData.changePercent > 0 ? '+' : ''}${previewData.changePercent.toFixed(2)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
                
                {/* Market Cap */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Market Cap
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMarketCap(previewData.marketCap)}
                  </div>
                </div>
                
                {/* P/E Ratio */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    P/E Ratio
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {previewData.pe ? previewData.pe.toFixed(1) : 'N/A'}
                  </div>
                </div>
                
                {/* Sentiment */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Sentiment
                  </div>
                  <div className={`flex items-center space-x-2 ${
                    previewData.sentiment === 'bullish' ? 'text-green-600' :
                    previewData.sentiment === 'bearish' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {previewData.sentiment === 'bullish' && <TrendingUp className="w-4 h-4" />}
                    {previewData.sentiment === 'bearish' && <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold capitalize">{previewData.sentiment}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleSuggestionSelect({ symbol: previewData.symbol })}
                className="w-full mt-6 px-4 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 flex items-center justify-center space-x-2"
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              >
                <span>Analyze {previewData.symbol}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;