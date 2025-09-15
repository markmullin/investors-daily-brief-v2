import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, BarChart3, Percent, DollarSign, Calculator, Award, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';

const StockComparison = () => {
  // State for the 3 stock slots
  const [stocks, setStocks] = useState([
    { id: 1, symbol: '', data: null, loading: false, error: null },
    { id: 2, symbol: '', data: null, loading: false, error: null },
    { id: 3, symbol: '', data: null, loading: false, error: null }
  ]);

  // State for comparison data and analysis
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('revenue_growth');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'charts'

  // Search suggestions state
  const [searchSuggestions, setSearchSuggestions] = useState({});
  const [activeSearchSlot, setActiveSearchSlot] = useState(null);

  // Key ratios we'll compare
  const keyRatios = {
    revenue_growth: { label: 'Revenue Growth', format: 'percentage', color: '#10B981' },
    earnings_growth: { label: 'Earnings Growth', format: 'percentage', color: '#3B82F6' },
    profit_margin: { label: 'Profit Margin', format: 'percentage', color: '#8B5CF6' },
    roe: { label: 'Return on Equity', format: 'percentage', color: '#F59E0B' },
    pe_ratio: { label: 'P/E Ratio', format: 'ratio', color: '#EF4444' },
    debt_to_equity: { label: 'Debt-to-Equity', format: 'ratio', color: '#6B7280' },
    current_ratio: { label: 'Current Ratio', format: 'ratio', color: '#EC4899' },
    dividend_yield: { label: 'Dividend Yield', format: 'percentage', color: '#06B6D4' },
    market_cap: { label: 'Market Cap', format: 'currency', color: '#84CC16' },
    beta: { label: 'Beta', format: 'ratio', color: '#F97316' }
  };

  // Search for stock suggestions
  const searchStockSuggestions = async (query, slotId) => {
    if (query.length < 1) {
      setSearchSuggestions(prev => ({ ...prev, [slotId]: [] }));
      return;
    }

    try {
      const response = await fetch(`/api/research/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchSuggestions(prev => ({ ...prev, [slotId]: data.suggestions || [] }));
      }
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSearchSuggestions(prev => ({ ...prev, [slotId]: [] }));
    }
  };

  // Handle stock selection
  const handleStockSelect = async (slotId, symbol) => {
    // Clear suggestions
    setSearchSuggestions(prev => ({ ...prev, [slotId]: [] }));
    setActiveSearchSlot(null);

    // Update the stock in the slot
    setStocks(prev => prev.map(stock => 
      stock.id === slotId 
        ? { ...stock, symbol: symbol.toUpperCase(), loading: true, error: null }
        : stock
    ));

    try {
      // Fetch comprehensive stock data
      const response = await fetch(`/api/research/stock-comparison/${symbol.toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        setStocks(prev => prev.map(stock => 
          stock.id === slotId 
            ? { ...stock, data: data.stockData, loading: false }
            : stock
        ));
      } else {
        setStocks(prev => prev.map(stock => 
          stock.id === slotId 
            ? { ...stock, loading: false, error: data.error || 'Failed to fetch data' }
            : stock
        ));
      }
    } catch (error) {
      console.error('Stock fetch error:', error);
      setStocks(prev => prev.map(stock => 
        stock.id === slotId 
          ? { ...stock, loading: false, error: 'Network error' }
          : stock
      ));
    }
  };

  // Remove stock from slot
  const removeStock = (slotId) => {
    setStocks(prev => prev.map(stock => 
      stock.id === slotId 
        ? { ...stock, symbol: '', data: null, loading: false, error: null }
        : stock
    ));
  };

  // Generate comparison data when stocks are loaded
  useEffect(() => {
    const validStocks = stocks.filter(s => s.data);
    if (validStocks.length >= 2) {
      generateComparisonData(validStocks);
    } else {
      setComparisonData(null);
    }
  }, [stocks]);

  // Generate comprehensive comparison analysis
  const generateComparisonData = (validStocks) => {
    const comparison = {};
    
    Object.keys(keyRatios).forEach(metric => {
      const values = validStocks.map(stock => ({
        symbol: stock.symbol,
        value: getMetricValue(stock.data, metric),
        data: stock.data
      })).filter(item => item.value !== null && !isNaN(item.value));

      if (values.length > 0) {
        // Sort for ranking (ascending for ratios, descending for growth)
        const isAscending = ['pe_ratio', 'debt_to_equity'].includes(metric);
        values.sort((a, b) => isAscending ? a.value - b.value : b.value - a.value);

        // Add rankings and percentile scores
        comparison[metric] = values.map((item, index) => ({
          ...item,
          rank: index + 1,
          percentileScore: calculatePercentileScore(item.value, metric),
          sectorRank: calculateSectorRank(item.data, metric)
        }));
      }
    });

    setComparisonData(comparison);
  };

  // Extract metric value from stock data
  const getMetricValue = (stockData, metric) => {
    if (!stockData) return null;
    
    switch (metric) {
      case 'revenue_growth':
        return stockData.revenueGrowth || stockData.revenue_growth || 0;
      case 'earnings_growth':
        return stockData.earningsGrowth || stockData.earnings_growth || 0;
      case 'profit_margin':
        return stockData.profitMargin || stockData.profit_margin || 0;
      case 'roe':
        return stockData.roe || stockData.returnOnEquity || 0;
      case 'pe_ratio':
        return stockData.peRatio || stockData.pe || 0;
      case 'debt_to_equity':
        return stockData.debtToEquity || stockData.debt_to_equity || 0;
      case 'current_ratio':
        return stockData.currentRatio || stockData.current_ratio || 0;
      case 'dividend_yield':
        return stockData.dividendYield || stockData.dividend_yield || 0;
      case 'market_cap':
        return stockData.marketCap || stockData.market_cap || 0;
      case 'beta':
        return stockData.beta || 1.0;
      default:
        return 0;
    }
  };

  // Calculate percentile score vs S&P 500 (simulated)
  const calculatePercentileScore = (value, metric) => {
    // These are approximated benchmarks for S&P 500 percentiles
    const benchmarks = {
      revenue_growth: { p25: 0.02, p50: 0.05, p75: 0.12 },
      earnings_growth: { p25: 0.03, p50: 0.08, p75: 0.15 },
      profit_margin: { p25: 0.05, p50: 0.08, p75: 0.15 },
      roe: { p25: 0.08, p50: 0.12, p75: 0.18 },
      pe_ratio: { p25: 12, p50: 18, p75: 25 },
      debt_to_equity: { p25: 0.2, p50: 0.4, p75: 0.8 },
      current_ratio: { p25: 1.0, p50: 1.5, p75: 2.2 },
      dividend_yield: { p25: 0.01, p50: 0.02, p75: 0.04 },
      beta: { p25: 0.8, p50: 1.0, p75: 1.3 }
    };

    const benchmark = benchmarks[metric];
    if (!benchmark) return 50;

    // For inverse metrics (lower is better)
    if (['pe_ratio', 'debt_to_equity'].includes(metric)) {
      if (value <= benchmark.p25) return 90;
      if (value <= benchmark.p50) return 70;
      if (value <= benchmark.p75) return 40;
      return 20;
    }

    // For normal metrics (higher is better)
    if (value >= benchmark.p75) return 90;
    if (value >= benchmark.p50) return 70;
    if (value >= benchmark.p25) return 40;
    return 20;
  };

  // Calculate sector ranking (simulated)
  const calculateSectorRank = (stockData, metric) => {
    // Simulate sector ranking based on sector
    const sector = stockData?.sector || 'Unknown';
    return Math.floor(Math.random() * 100) + 1; // Random for demo
  };

  // Format value for display
  const formatValue = (value, format) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'ratio':
        return value.toFixed(2);
      case 'currency':
        if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${value.toFixed(0)}`;
      default:
        return value.toFixed(2);
    }
  };

  // Get color for ranking
  const getRankingColor = (rank, total) => {
    if (rank === 1) return 'text-green-600 font-bold';
    if (rank === total) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Get percentile color
  const getPercentileColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Generate chart data for a metric
  const generateChartData = (metric) => {
    if (!comparisonData || !comparisonData[metric]) return [];
    
    return comparisonData[metric].map(item => ({
      symbol: item.symbol,
      value: item.value,
      color: keyRatios[metric].color
    }));
  };

  const validStocksCount = stocks.filter(s => s.data).length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Comparison Tool</h2>
            <p className="text-gray-600">Compare up to 3 stocks side-by-side with key financial ratios and performance metrics</p>
          </div>
          {validStocksCount >= 2 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'charts' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Chart View
              </button>
            </div>
          )}
        </div>

        {/* Stock Search Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stocks.map((stock, index) => (
            <div key={stock.id} className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Stock {index + 1}</span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter symbol (e.g., AAPL)"
                  value={stock.symbol}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setStocks(prev => prev.map(s => 
                      s.id === stock.id ? { ...s, symbol: value } : s
                    ));
                    setActiveSearchSlot(stock.id);
                    searchStockSuggestions(value, stock.id);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && stock.symbol) {
                      handleStockSelect(stock.id, stock.symbol);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {stock.loading && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {stock.symbol && stock.data && (
                  <button
                    onClick={() => removeStock(stock.id)}
                    className="absolute right-3 top-2 text-gray-400 hover:text-red-600"
                  >
                    ×
                  </button>
                )}

                {/* Search Suggestions */}
                {activeSearchSlot === stock.id && searchSuggestions[stock.id]?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {searchSuggestions[stock.id].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStockSelect(stock.id, suggestion.symbol)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span className="font-medium">{suggestion.symbol}</span>
                        <span className="text-sm text-gray-600 truncate ml-2">{suggestion.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Info */}
              {stock.data && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600 truncate">{stock.data.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${stock.data.price?.toFixed(2) || 'N/A'}</div>
                      <div className={`text-sm ${stock.data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.data.changePercent >= 0 ? '+' : ''}{stock.data.changePercent?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stock.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {stock.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Results */}
      {validStocksCount >= 2 && comparisonData && (
        <div className="p-6">
          {viewMode === 'table' ? (
            // Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                    {stocks.filter(s => s.data).map(stock => (
                      <th key={stock.id} className="text-center py-3 px-4 font-semibold text-gray-900">
                        <div className="flex flex-col items-center">
                          <span>{stock.symbol}</span>
                          <span className="text-xs font-normal text-gray-600">{stock.data?.sector}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(keyRatios).map(([metric, config]) => {
                    const metricData = comparisonData[metric];
                    if (!metricData || metricData.length === 0) return null;

                    return (
                      <tr key={metric} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: config.color }}
                            ></div>
                            <span className="font-medium text-gray-900">{config.label}</span>
                          </div>
                        </td>
                        {stocks.filter(s => s.data).map(stock => {
                          const stockMetric = metricData.find(m => m.symbol === stock.symbol);
                          if (!stockMetric) return <td key={stock.id} className="py-4 px-4 text-center text-gray-400">N/A</td>;

                          return (
                            <td key={stock.id} className="py-4 px-4 text-center">
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">
                                  {formatValue(stockMetric.value, config.format)}
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${getRankingColor(stockMetric.rank, metricData.length)}`}>
                                    #{stockMetric.rank}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${getPercentileColor(stockMetric.percentileScore)}`}>
                                    {stockMetric.percentileScore}th %ile
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Chart View
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(keyRatios).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    {keyRatios[selectedMetric].label} Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={generateChartData(selectedMetric)}>
                      <XAxis dataKey="symbol" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatValue(value, keyRatios[selectedMetric].format)} />
                      <Bar dataKey="value">
                        {generateChartData(selectedMetric).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Summary</h3>
                  <div className="space-y-3">
                    {comparisonData[selectedMetric]?.map((item, index) => (
                      <div key={item.symbol} className="flex items-center justify-between p-2 bg-white rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                               style={{ backgroundColor: keyRatios[selectedMetric].color }}>
                            {item.rank}
                          </div>
                          <span className="font-medium">{item.symbol}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatValue(item.value, keyRatios[selectedMetric].format)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.percentileScore}th percentile
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Comparison Summary</span>
            </div>
            <div className="text-sm text-blue-800">
              Comparing {validStocksCount} stocks across {Object.keys(comparisonData).length} key financial metrics. 
              Rankings show relative performance, while percentile scores compare against S&P 500 benchmarks.
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {validStocksCount < 2 && (
        <div className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Add Stocks to Compare</h3>
          <p className="text-gray-500">
            Enter at least 2 stock symbols above to begin comprehensive side-by-side analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default StockComparison;