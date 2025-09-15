import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Award, Building2, DollarSign, AlertCircle, BarChart3, Target, Activity, Info, Shield, Banknote } from 'lucide-react';
import { fundamentalsApi } from '../services/api';
import InfoTooltip from './InfoTooltip';
import { useViewMode } from '../context/ViewModeContext';

/**
 * Fundamentals Carousel Component - Displays S&P 500 Top Performers
 * *** FIXED: Added Cash Position metric and enhanced data accuracy ***
 * *** PRODUCTION: Enhanced with Current Ratio and anomaly filtering ***
 */
const FundamentalsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { viewMode } = useViewMode();

  // *** FIXED: Added cash_position metric - this was missing! ***
  const metrics = [
    {
      id: 'revenue_growth_yoy',
      title: 'Revenue Growth',
      subtitle: 'Top Revenue Growth YoY',
      icon: <TrendingUp className="text-green-500" size={24} />,
      format: 'percentage',
      color: '#10b981',
      description: {
        basic: "Companies growing their sales the fastest. High revenue growth often means the company is winning market share or expanding into new markets.",
        advanced: "Revenue growth leaders indicate market share expansion, pricing power, and operational efficiency. Strong revenue growth at sustainable margins often drives long-term shareholder value."
      }
    },
    {
      id: 'earnings_growth_yoy',
      title: 'Earnings Growth',
      subtitle: 'Top Earnings Growth YoY',
      icon: <DollarSign className="text-blue-500" size={24} />,
      format: 'percentage',
      color: '#3b82f6',
      description: {
        basic: "Companies increasing their profits the most. Earnings growth shows a company is becoming more profitable over time.",
        advanced: "Earnings growth reflects operational leverage, margin expansion, and management execution. Sustainable earnings growth above 15% annually indicates competitive advantages and pricing power."
      }
    },
    {
      id: 'fcf_growth_yoy',
      title: 'Free Cash Flow Growth',
      subtitle: 'Top FCF Growth YoY',
      icon: <Activity className="text-purple-500" size={24} />,
      format: 'percentage',
      color: '#8b5cf6',
      description: {
        basic: "Companies generating the most cash after covering their expenses and investments. Free cash flow is money the company can return to shareholders.",
        advanced: "FCF growth indicates capital efficiency and cash generation ability. Strong FCF growth above 20% suggests robust business models with low capital intensity and high returns on invested capital."
      }
    },
    {
      id: 'profit_margin',
      title: 'Profit Margin',
      subtitle: 'Highest Profit Margins',
      icon: <Target className="text-emerald-500" size={24} />,
      format: 'percentage',
      color: '#059669',
      description: {
        basic: "Companies that keep the most profit from each dollar of sales. High profit margins usually indicate strong competitive advantages.",
        advanced: "High profit margins reflect pricing power, operational efficiency, and competitive moats. Companies with 25%+ net margins typically have sustainable competitive advantages and strong market positions."
      }
    },
    {
      id: 'roe',
      title: 'Return on Equity',
      subtitle: 'Highest ROE',
      icon: <Award className="text-yellow-500" size={24} />,
      format: 'percentage',
      color: '#f59e0b',
      description: {
        basic: "How efficiently companies use shareholder money to generate profits. Higher ROE means better returns for investors.",
        advanced: "ROE above 20% indicates exceptional capital allocation and business quality. Consistently high ROE with reasonable debt levels suggests sustainable competitive advantages and strong management execution."
      }
    },
    {
      id: 'cash_position',  // *** NEW: Added cash position metric ***
      title: 'Cash Position',
      subtitle: 'Highest Cash Holdings',
      icon: <Banknote className="text-teal-500" size={24} />,
      format: 'percentage',
      color: '#14b8a6',
      description: {
        basic: "Companies with the most cash relative to their size. High cash positions provide financial flexibility and protection during tough times.",
        advanced: "Cash position as % of market cap indicates financial strength and strategic flexibility. Companies with 10%+ cash positions can weather downturns, make acquisitions, and invest in growth opportunities."
      }
    },
    {
      id: 'current_ratio',
      title: 'Financial Strength',
      subtitle: 'Highest Current Ratios',
      icon: <Shield className="text-indigo-500" size={24} />,
      format: 'ratio',
      color: '#6366f1',
      description: {
        basic: "Companies with the strongest short-term financial health. Current ratio shows how easily a company can pay its short-term debts with current assets.",
        advanced: "Current ratio above 1.5 indicates strong liquidity and financial stability. Companies with current ratios between 1.5-3.0 typically have excellent short-term financial health and can weather economic downturns."
      }
    }
  ];

  // Navigation functions
  const goNext = () => {
    setCurrentIndex((prev) => (prev === metrics.length - 1 ? 0 : prev + 1));
  };
  
  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? metrics.length - 1 : prev - 1));
  };

  // Fetch fundamentals data
  useEffect(() => {
    const fetchFundamentalsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 [FIXED] Fetching enhanced S&P 500 rankings with cash position and anomaly filtering...');
        const data = await fundamentalsApi.getTopPerformers();
        
        console.log('✅ [FIXED] Enhanced fundamentals data received:', {
          hasData: !!data.data,
          metricsCount: data.data ? Object.keys(data.data).length : 0,
          hasCashPosition: !!(data.data?.cash_position),
          dataSource: data.summary?.dataSource,
          improvements: data.improvements || []
        });
        
        if (data && data.data) {
          setFundamentalsData(data);
          
          // *** DEBUG: Log what metrics we actually received ***
          const receivedMetrics = Object.keys(data.data);
          console.log('📊 [DEBUG] Received metrics:', receivedMetrics);
          console.log('💰 [DEBUG] Cash position available:', !!data.data.cash_position);
          
          if (data.data.cash_position && data.data.cash_position.length > 0) {
            console.log('✅ [SUCCESS] Cash position data found:', data.data.cash_position[0]);
          } else {
            console.error('❌ [ERROR] Cash position missing or empty');
          }
        } else {
          setError('No enhanced fundamental rankings data available');
        }
      } catch (err) {
        console.error('❌ [FIXED] Error fetching fundamentals data:', err);
        setError('Failed to load enhanced fundamental rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchFundamentalsData();
    
    // Refresh every hour (data is cached with enhanced controls)
    const interval = setInterval(fetchFundamentalsData, 3600000);
    return () => clearInterval(interval);
  }, []);

  // *** PRODUCTION: Enhanced formatting with better ratio handling ***
  const formatValue = (value, format) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'ratio':
        return `${value.toFixed(2)}x`;
      case 'currency':
        return `$${(value / 1000000000).toFixed(1)}B`;
      default:
        return value.toFixed(2);
    }
  };

  // Format market cap
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

  // Get sector color
  const getSectorColor = (sector) => {
    const sectorColors = {
      'Technology': '#3b82f6',
      'Healthcare': '#10b981',
      'Financial Services': '#f59e0b',
      'Consumer Cyclical': '#8b5cf6',
      'Consumer Defensive': '#06b6d4',
      'Communication Services': '#ef4444',
      'Industrials': '#6366f1',
      'Energy': '#ea580c',
      'Materials': '#84cc16',
      'Real Estate': '#f97316',
      'Utilities': '#14b8a6'
    };
    return sectorColors[sector] || '#6b7280';
  };

  // *** PRODUCTION: Enhanced render function with anomaly filtering indicators ***
  const renderTopPerformers = () => {
    const currentMetric = metrics[currentIndex];
    const performersData = fundamentalsData?.data?.[currentMetric.id] || [];
    
    if (!performersData || performersData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">No quality data available for {currentMetric.title}</p>
          <p className="text-xs text-gray-400 mt-1">
            {currentMetric.id === 'cash_position' ? 
              'Cash position data may be processing...' : 
              'May be filtered due to data quality issues'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {performersData.map((company, index) => (
          <div
            key={`${company.symbol}-${index}`}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: currentMetric.color }}
                >
                  {index + 1}
                </div>
                
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{company.symbol}</span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getSectorColor(company.sector) }}
                    >
                      {company.sector}
                    </span>
                    {/* *** PRODUCTION: Quality indicators *** */}
                    {company.preserved_high_growth && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Preserved
                      </span>
                    )}
                    {company.anomaly_filtered === false && company.quality_score >= 90 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        High Quality
                      </span>
                    )}
                    {company.is_known_growth_company && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Growth Stock
                      </span>
                    )}
                    {/* *** NEW: Cash position specific indicators *** */}
                    {currentMetric.id === 'cash_position' && company.metric_value >= 15 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        Cash Rich
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{company.company_name}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatMarketCap(company.market_cap)}</span>
                    {/* *** PRODUCTION: Quality score display *** */}
                    {company.quality_score && (
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        company.quality_score >= 90 ? 'bg-green-100 text-green-700' : 
                        company.quality_score >= 80 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        Q: {company.quality_score}
                      </span>
                    )}
                    {company.data_age && (
                      <span>📅 {new Date(company.data_age).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Metric Value */}
              <div className="text-right">
                <div 
                  className="text-xl font-bold"
                  style={{ color: currentMetric.color }}
                >
                  {formatValue(company.metric_value, currentMetric.format)}
                </div>
                <div className="text-xs text-gray-500">
                  #{company.rank} of 500
                </div>
                {/* *** ENHANCED: Cash position interpretation *** */}
                {currentMetric.id === 'cash_position' && company.metric_value !== null && (
                  <div className="text-xs mt-1">
                    {company.metric_value >= 20 ? (
                      <span className="text-green-600">Fortress Balance Sheet</span>
                    ) : company.metric_value >= 15 ? (
                      <span className="text-green-600">Very Strong</span>
                    ) : company.metric_value >= 10 ? (
                      <span className="text-blue-600">Strong Cash</span>
                    ) : company.metric_value >= 5 ? (
                      <span className="text-yellow-600">Adequate</span>
                    ) : (
                      <span className="text-gray-600">Low Cash</span>
                    )}
                  </div>
                )}
                {/* *** PRODUCTION: Enhanced interpretation for current ratio *** */}
                {currentMetric.id === 'current_ratio' && company.metric_value !== null && (
                  <div className="text-xs mt-1">
                    {company.metric_value >= 2.5 ? (
                      <span className="text-green-600">Excellent</span>
                    ) : company.metric_value >= 2.0 ? (
                      <span className="text-green-600">Very Strong</span>
                    ) : company.metric_value >= 1.5 ? (
                      <span className="text-blue-600">Strong</span>
                    ) : company.metric_value >= 1.2 ? (
                      <span className="text-yellow-600">Adequate</span>
                    ) : (
                      <span className="text-red-600">Weak</span>
                    )}
                  </div>
                )}
                {/* Growth metrics capping indicator */}
                {(currentMetric.id.includes('growth') || currentMetric.id === 'roe') && company.metric_value >= 300 && (
                  <div className="text-xs mt-1 text-orange-600">
                    Capped
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get investment implications
  const getInvestmentImplications = () => {
    const currentMetric = metrics[currentIndex];
    const performersData = fundamentalsData?.data?.[currentMetric.id] || [];
    
    if (performersData.length === 0) return currentMetric.description;
    
    const topPerformer = performersData[0];
    const avgValue = performersData.reduce((sum, p) => sum + (p.metric_value || 0), 0) / performersData.length;
    
    // Enhanced descriptions with current data
    const enhancedDescription = {
      basic: `${currentMetric.description.basic} Current leader: ${topPerformer.symbol} with ${formatValue(topPerformer.metric_value, currentMetric.format)}.`,
      advanced: `${currentMetric.description.advanced} Top 5 average: ${formatValue(avgValue, currentMetric.format)}. Sectors represented: ${[...new Set(performersData.map(p => p.sector))].join(', ')}.`
    };
    
    return enhancedDescription;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading enhanced S&P 500 rankings...</p>
          <p className="text-xs text-gray-500 mt-2">Applying anomaly filtering and quality controls</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Unable to Load Enhanced Rankings</h3>
          <p className="text-gray-600 text-center">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentMetric = metrics[currentIndex];
  const implications = getInvestmentImplications();

  return (
    <div className="bg-white rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
      {/* Navigation arrows */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goPrev}
        aria-label="Previous fundamental metric"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goNext}
        aria-label="Next fundamental metric"
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {currentMetric.icon}
              <h3 className="text-xl font-semibold text-gray-800">
                {currentMetric.title}
              </h3>
              <InfoTooltip
                basicContent={implications.basic}
                advancedContent={implications.advanced}
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">{currentMetric.subtitle}</p>
            
            {/* *** FIXED: Enhanced summary with cash position *** */}
            <div className="bg-blue-50 rounded-lg p-3 flex flex-wrap items-center gap-4">
              <div className="text-sm">
                <span className="font-semibold text-blue-900">Data Source:</span>
                <span className="text-blue-700 ml-1">{fundamentalsData?.summary?.dataSource || 'Enhanced S&P 500'}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-blue-900">Companies:</span>
                <span className="text-blue-700 ml-1">{fundamentalsData?.summary?.totalCompanies || 500}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-blue-900">Metrics:</span>
                <span className="text-blue-700 ml-1">7 (including Cash Position)</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-blue-900">Updated:</span>
                <span className="text-blue-700 ml-1">
                  {fundamentalsData?.timestamp ? new Date(fundamentalsData.timestamp).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              {/* *** PRODUCTION: Enhancement indicators *** */}
              {fundamentalsData?.improvements && (
                <div className="text-sm">
                  <span className="font-semibold text-green-900">🚀 Enhanced:</span>
                  <span className="text-green-700 ml-1">Statistical Analysis</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Carousel indicators */}
          <div className="flex gap-1 ml-4">
            {metrics.map((_, idx) => (
              <button 
                key={`indicator-${idx}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-4' : ''
                }`}
                style={{ 
                  backgroundColor: idx === currentIndex ? currentMetric.color : '#d1d5db'
                }}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to ${metrics[idx].title}`}
              />
            ))}
          </div>
        </div>

        {/* Top Performers List */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            Top 5 S&P 500 Performers
            {/* *** PRODUCTION: Enhanced quality badge *** */}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Statistical Filtering
            </span>
          </h4>
          {renderTopPerformers()}
        </div>
        
        {/* *** PRODUCTION: Enhanced Investment Implications *** */}
        <div className="p-4 rounded-lg border-l-4" style={{ 
          backgroundColor: `${currentMetric.color}10`, 
          borderColor: currentMetric.color 
        }}>
          <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: currentMetric.color }}>
            <Info size={16} />
            Investment Implications
          </h4>
          <p className="text-sm text-gray-700 mb-2">
            {viewMode === 'basic' ? implications.basic : implications.advanced}
          </p>
          {/* *** PRODUCTION: Enhancement details *** */}
          {fundamentalsData?.improvements && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
              <strong>Statistical Enhancements:</strong> {fundamentalsData.improvements.slice(0, 2).join(' • ')}
              {fundamentalsData.improvements.length > 2 && ` • ${fundamentalsData.improvements.length - 2} more...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundamentalsCarousel;