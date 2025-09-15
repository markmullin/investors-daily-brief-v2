import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Building, Target, ExternalLink, RefreshCw } from 'lucide-react';

const ComparableAnalysis = ({ symbol, onClose }) => {
  const [comparableData, setComparableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetric, setActiveMetric] = useState('valuation');

  useEffect(() => {
    if (symbol) {
      loadComparableAnalysis();
    }
  }, [symbol]);

  const loadComparableAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/research/comparable-analysis/${symbol}`);
      const data = await response.json();
      
      if (data.success) {
        setComparableData(data.data);
      } else {
        setError(data.error || 'Failed to load comparable analysis');
      }
    } catch (error) {
      console.error('Error loading comparable analysis:', error);
      setError('Network error loading comparable analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num, decimals = 1) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const getPercentileColor = (percentile) => {
    if (percentile >= 80) return 'text-green-600 bg-green-100';
    if (percentile >= 60) return 'text-blue-600 bg-blue-100';
    if (percentile >= 40) return 'text-yellow-600 bg-yellow-100';
    if (percentile >= 20) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getMetricRank = (value, peers, isLowerBetter = false) => {
    const validPeers = peers.filter(p => p.value !== null && !isNaN(p.value));
    if (validPeers.length === 0) return 'N/A';
    
    const sorted = [...validPeers].sort((a, b) => isLowerBetter ? a.value - b.value : b.value - a.value);
    const rank = sorted.findIndex(p => p.symbol === symbol) + 1;
    return `${rank}/${sorted.length}`;
  };

  const metricCategories = {
    valuation: {
      name: 'Valuation Metrics',
      icon: Target,
      metrics: [
        { key: 'pe', name: 'P/E Ratio', format: 'number', lowerBetter: true },
        { key: 'priceToBook', name: 'P/B Ratio', format: 'number', lowerBetter: true },
        { key: 'priceToSales', name: 'P/S Ratio', format: 'number', lowerBetter: true },
        { key: 'evToEbitda', name: 'EV/EBITDA', format: 'number', lowerBetter: true },
        { key: 'pegRatio', name: 'PEG Ratio', format: 'number', lowerBetter: true }
      ]
    },
    profitability: {
      name: 'Profitability',
      icon: TrendingUp,
      metrics: [
        { key: 'grossMargin', name: 'Gross Margin', format: 'percent' },
        { key: 'operatingMargin', name: 'Operating Margin', format: 'percent' },
        { key: 'netMargin', name: 'Net Margin', format: 'percent' },
        { key: 'roe', name: 'ROE', format: 'percent' },
        { key: 'roa', name: 'ROA', format: 'percent' }
      ]
    },
    growth: {
      name: 'Growth Metrics',
      icon: BarChart3,
      metrics: [
        { key: 'revenueGrowth', name: 'Revenue Growth', format: 'percent' },
        { key: 'earningsGrowth', name: 'Earnings Growth', format: 'percent' },
        { key: 'fcfGrowth', name: 'FCF Growth', format: 'percent' },
        { key: 'bookValueGrowth', name: 'Book Value Growth', format: 'percent' }
      ]
    },
    financial: {
      name: 'Financial Health',
      icon: Building,
      metrics: [
        { key: 'currentRatio', name: 'Current Ratio', format: 'number' },
        { key: 'quickRatio', name: 'Quick Ratio', format: 'number' },
        { key: 'debtToEquity', name: 'Debt/Equity', format: 'number', lowerBetter: true },
        { key: 'interestCoverage', name: 'Interest Coverage', format: 'number' },
        { key: 'freeCashFlowYield', name: 'FCF Yield', format: 'percent' }
      ]
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Comparable Analysis - {symbol}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading comparable companies...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Comparable Analysis - {symbol}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="text-center text-red-600 py-8">
          <div className="text-lg font-medium mb-2">Error Loading Data</div>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={loadComparableAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Comparable Company Analysis - {symbol}
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Peer Analysis
            </span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>
        
        {comparableData && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Company:</span>
              <div className="font-semibold text-gray-900">{comparableData.company.name}</div>
            </div>
            <div>
              <span className="text-gray-600">Sector:</span>
              <div className="font-semibold text-gray-900">{comparableData.company.sector}</div>
            </div>
            <div>
              <span className="text-gray-600">Market Cap:</span>
              <div className="font-semibold text-gray-900">{formatNumber(comparableData.company.marketCap)}B</div>
            </div>
            <div>
              <span className="text-gray-600">Peers Analyzed:</span>
              <div className="font-semibold text-gray-900">{comparableData.peers.length} companies</div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Category Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          {Object.entries(metricCategories).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeMetric === key
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {comparableData && (
          <div>
            {/* Summary Statistics */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Overall Performance vs Peers</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {comparableData.summary.overallPercentile}th
                  </div>
                  <div className="text-sm text-gray-600">Overall Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {comparableData.summary.valuationPercentile}th
                  </div>
                  <div className="text-sm text-gray-600">Valuation Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {comparableData.summary.profitabilityPercentile}th
                  </div>
                  <div className="text-sm text-gray-600">Profitability Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {comparableData.summary.growthPercentile}th
                  </div>
                  <div className="text-sm text-gray-600">Growth Rank</div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="overflow-x-auto">
              {(() => {
                const IconComponent = metricCategories[activeMetric].icon;
                return (
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <IconComponent className="w-4 h-4 mr-2" />
                    {metricCategories[activeMetric].name}
                  </h4>
                );
              })()}
              
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Metric</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">{symbol}</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Peer Median</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Peer Average</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Percentile</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {metricCategories[activeMetric].metrics.map((metric) => {
                    const data = comparableData.metrics[metric.key];
                    if (!data) return null;
                    
                    const formatValue = (value) => {
                      if (value === null || value === undefined || isNaN(value)) return 'N/A';
                      if (metric.format === 'percent') return `${value.toFixed(1)}%`;
                      return value.toFixed(2);
                    };

                    return (
                      <tr key={metric.key} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{metric.name}</td>
                        <td className="px-4 py-3 text-center font-semibold text-blue-600">
                          {formatValue(data.companyValue)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {formatValue(data.peerMedian)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {formatValue(data.peerAverage)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPercentileColor(data.percentile)}`}>
                            {data.percentile}th
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {getMetricRank(data.companyValue, data.peers, metric.lowerBetter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Peer Companies List */}
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Comparable Companies ({comparableData.peers.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparableData.peers.map((peer) => (
                  <div key={peer.symbol} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{peer.symbol}</h5>
                      <button
                        onClick={() => window.open(`https://finance.yahoo.com/quote/${peer.symbol}`, '_blank')}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{peer.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Market Cap:</span>
                        <div className="font-medium">{formatNumber(peer.marketCap)}B</div>
                      </div>
                      <div>
                        <span className="text-gray-500">P/E:</span>
                        <div className="font-medium">{peer.pe?.toFixed(1) || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue Growth:</span>
                        <div className="font-medium">{peer.revenueGrowth?.toFixed(1) || 'N/A'}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">ROE:</span>
                        <div className="font-medium">{peer.roe?.toFixed(1) || 'N/A'}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {comparableData.insights.map((insight, index) => (
                  <li key={index}>• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparableAnalysis;