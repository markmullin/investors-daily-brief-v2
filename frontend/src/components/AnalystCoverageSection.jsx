import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users, Target, Activity, Building, DollarSign, BarChart3 } from 'lucide-react';

/**
 * *** ANALYST COVERAGE SECTION - RESEARCH PAGE ***
 * 
 * ENHANCED WITH REVENUE & EPS GROWTH RANKINGS
 * 
 * Features:
 * - Price target upside analysis (first priority)
 * - Highest projected revenue growth rankings
 * - Highest projected income/EPS growth rankings  
 * - Executive confidence signals (CEO/CFO transactions)
 * - Institutional holdings concentration
 * - Expanded to 10 listings for better visibility
 */

const AnalystCoverageSection = () => {
  const [coverageData, setCoverageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('coverage');
  const [selectedInsight, setSelectedInsight] = useState(0);

  useEffect(() => {
    fetchAnalystCoverage();
  }, []);

  const fetchAnalystCoverage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/research/analyst-coverage/comprehensive');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analyst coverage data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCoverageData(data);
        setError(null);
        console.log('📊 [ANALYST COVERAGE] Loaded data:', {
          hasAnalysis: !!data.analysis,
          hasSummary: !!data.analysis?.summary,
          avgAnalystCount: data.analysis?.summary?.avgAnalystCount,
          avgUpside: data.analysis?.priceTargets?.avgUpside,
          revenueGrowthCount: data.analysis?.growthProjections?.highestRevenueGrowth?.length,
          epsGrowthCount: data.analysis?.growthProjections?.highestEpsGrowth?.length,
          executiveSignals: data.analysis?.executiveActivity?.totalSignals || 0,
          institutionalLength: data.analysis?.institutional?.highestInterest?.length
        });
      } else {
        throw new Error(data.error || 'Failed to load analyst coverage');
      }
      
    } catch (err) {
      console.error('Analyst coverage fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format numeric values
  const safeFormatNumber = (value, type = 'default', fallback = '-') => {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return fallback;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return fallback;
    }
    
    switch (type) {
      case 'integer':
        return Math.round(numValue).toString();
      case 'decimal1':
        return numValue.toFixed(1);
      case 'percent':
        return `${numValue.toFixed(1)}%`;
      case 'price':
        return `$${numValue.toFixed(2)}`;
      case 'marketCap':
        return `$${(numValue / 1e9).toFixed(1)}B`;
      case 'million':
        return `$${(numValue / 1e6).toFixed(1)}M`;
      default:
        return numValue.toString();
    }
  };

  // Helper function to format executive transaction values
  const formatTransactionValue = (value) => {
    if (!value || isNaN(value)) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Helper function to get time ago text
  const getTimeAgo = (daysAgo) => {
    if (!daysAgo || isNaN(daysAgo)) return 'Recently';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 90) return `${Math.floor(daysAgo / 30)} months ago`;
    return 'Recently';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Analyst Coverage & Executive Intelligence</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Analyst Coverage & Executive Intelligence</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">📊 Analyst data temporarily unavailable</div>
          <p className="text-gray-600 text-sm">Building comprehensive S&P 500 analyst coverage analysis...</p>
          <button 
            onClick={fetchAnalystCoverage}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const analysis = coverageData?.analysis;
  const summary = analysis?.summary || {};
  const priceTargets = analysis?.priceTargets || {};
  const growthProjections = analysis?.growthProjections || {};
  const executiveActivity = analysis?.executiveActivity || {};
  const institutional = analysis?.institutional || {};

  // Updated insights array with requested changes
  const insights = [
    {
      title: "Price Target Upside",
      icon: <TrendingUp className="h-5 w-5" />,
      data: priceTargets.highestUpside?.slice(0, 10) || [],
      type: "upside"
    },
    {
      title: "Highest Projected Revenue Growth",
      icon: <BarChart3 className="h-5 w-5" />,
      data: growthProjections.highestRevenueGrowth?.slice(0, 10) || [],
      type: "revenueGrowth"
    },
    {
      title: "Highest Projected Income/EPS Growth",
      icon: <DollarSign className="h-5 w-5" />,
      data: growthProjections.highestEpsGrowth?.slice(0, 10) || [],
      type: "epsGrowth"
    },
    {
      title: "Executive Confidence",
      icon: <Activity className="h-5 w-5" />,
      data: executiveActivity.significantSignals?.slice(0, 10) || [],
      type: "executive"
    },
    {
      title: "Institutional Interest",
      icon: <Building className="h-5 w-5" />,
      data: institutional.highestInterest?.slice(0, 10) || [],
      type: "institutional"
    }
  ];

  const currentInsight = insights[selectedInsight];

  const formatValue = (value, type) => {
    switch (type) {
      case 'upside':
        return safeFormatNumber(value, 'percent', 'N/A');
      case 'price':
        return safeFormatNumber(value, 'price', 'N/A');
      case 'marketCap':
        return safeFormatNumber(value, 'marketCap', 'N/A');
      case 'growth':
        return safeFormatNumber(value, 'percent', 'N/A');
      default:
        return value || 'N/A';
    }
  };

  const renderInsightContent = (insight) => {
    if (!insight.data || insight.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <div className="text-sm">No data available yet</div>
            <div className="text-xs mt-1">Data will be available after collection</div>
          </div>
        </div>
      );
    }

    switch (insight.type) {
      case 'upside':
        return (
          <div className="space-y-3">
            {insight.data.map((company, index) => (
              <div key={company.symbol || index} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900">{company.symbol}</span>
                  <div className="text-xs text-gray-500">
                    Current: {formatValue(company.currentPrice, 'price')} → Target: {formatValue(company.avgTarget, 'price')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">+{formatValue(company.upside, 'upside')}</div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'revenueGrowth':
        return (
          <div className="space-y-3">
            {insight.data.map((company, index) => (
              <div key={company.symbol || index} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900">{company.symbol}</span>
                  <div className="text-xs text-gray-500">
                    {company.analystCount} analysts • {company.consensusRating || 'N/A'} rating
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{formatValue(company.revenueGrowth, 'growth')}</div>
                  <div className="text-xs text-gray-500">projected growth</div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'epsGrowth':
        return (
          <div className="space-y-3">
            {insight.data.map((company, index) => (
              <div key={company.symbol || index} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900">{company.symbol}</span>
                  <div className="text-xs text-gray-500">
                    {company.analystCount} analysts • {company.consensusRating || 'N/A'} rating
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-purple-600">{formatValue(company.epsGrowth, 'growth')}</div>
                  <div className="text-xs text-gray-500">projected growth</div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'executive':
        return (
          <div className="space-y-3">
            {insight.data.map((signal, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{signal.symbol}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        signal.transactionType === 'purchase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.transactionType === 'purchase' ? 'Buy' : 'Sell'}
                      </span>
                      {signal.significance === 'very_large' && (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          Very Large
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {signal.executive} ({signal.title})
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTransactionValue(signal.value)} • {getTimeAgo(signal.daysAgo)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'institutional':
        return (
          <div className="space-y-3">
            {insight.data.map((company, index) => (
              <div key={company.symbol || index} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900">{company.symbol}</span>
                  <div className="text-xs text-gray-500">{company.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-purple-600">{company.institutionCount || 'High'}</div>
                  <div className="text-xs text-gray-500">institutions</div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return <div className="text-gray-500">No data available</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Analyst Coverage & Executive Intelligence</h2>
        </div>
        <div className="text-sm text-gray-500">
          S&P 500 • {coverageData?.coverage || 'Loading...'}
        </div>
      </div>

      {/* Summary Stats - Enhanced with Growth Projections */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Avg Coverage</div>
          <div className="text-2xl font-bold text-blue-700">
            {safeFormatNumber(summary.avgAnalystCount, 'integer')}
          </div>
          <div className="text-xs text-blue-500">analysts per stock</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Avg Upside</div>
          <div className="text-2xl font-bold text-green-700">
            {safeFormatNumber(priceTargets.avgUpside, 'percent')}
          </div>
          <div className="text-xs text-green-500">price target gap</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Avg Revenue Growth</div>
          <div className="text-2xl font-bold text-purple-700">
            {safeFormatNumber(growthProjections.avgRevenueGrowth, 'percent')}
          </div>
          <div className="text-xs text-purple-500">analyst projections</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">Avg EPS Growth</div>
          <div className="text-2xl font-bold text-orange-700">
            {safeFormatNumber(growthProjections.avgEpsGrowth, 'percent')}
          </div>
          <div className="text-xs text-orange-500">analyst projections</div>
        </div>
      </div>

      {/* Insights Carousel */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {currentInsight.icon}
            <h3 className="font-semibold text-gray-900">{currentInsight.title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedInsight((prev) => (prev - 1 + insights.length) % insights.length)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex space-x-1">
              {insights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedInsight(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedInsight ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setSelectedInsight((prev) => (prev + 1) % insights.length)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-[200px]">
          {renderInsightContent(currentInsight)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div>
          Price targets, revenue/EPS growth projections, analyst ratings, and C-suite transaction intelligence
        </div>
        <div>
          Updated: {coverageData?.lastUpdated ? new Date(coverageData.lastUpdated).toLocaleDateString() : 'Loading...'}
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && coverageData?.analysis && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div className="font-semibold mb-1">Debug Info:</div>
          <div>Source: {coverageData.source}</div>
          <div>Coverage: {coverageData.coverage}</div>
          <div>Cache Age: {coverageData.cacheAge}</div>
          <div>Avg Analyst Count: {typeof summary.avgAnalystCount} = {summary.avgAnalystCount}</div>
          <div>Avg Upside: {typeof priceTargets.avgUpside} = {priceTargets.avgUpside}</div>
          <div>Revenue Growth Rankings: {growthProjections.highestRevenueGrowth?.length || 0}</div>
          <div>EPS Growth Rankings: {growthProjections.highestEpsGrowth?.length || 0}</div>
          <div>Executive Signals: {typeof executiveActivity.totalSignals} = {executiveActivity.totalSignals}</div>
        </div>
      )}
    </div>
  );
};

export default AnalystCoverageSection;