import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BarChart3, PieChart, TrendingUp, DollarSign, AlertTriangle, Download, Save, RefreshCw } from 'lucide-react';

const CustomIndexBuilder = ({ initialHoldings = [], onSave }) => {
  const [indexName, setIndexName] = useState('My Custom Index');
  const [holdings, setHoldings] = useState(initialHoldings);
  const [metrics, setMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    if (holdings.length > 0) {
      calculateMetrics();
    } else {
      setMetrics(null);
    }
  }, [holdings]);

  const searchStocks = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/research/stocks/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Stock search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addHolding = (stock) => {
    // Check if stock already exists
    if (holdings.find(h => h.symbol === stock.symbol)) {
      alert(`${stock.symbol} is already in your index`);
      return;
    }

    const newHolding = {
      symbol: stock.symbol,
      name: stock.name,
      weight: holdings.length === 0 ? 100 : 10, // First stock gets 100%, others get 10%
      price: 0,
      marketCap: 0,
      sector: 'Unknown',
      beta: 1.0,
      dividendYield: 0,
      change: 0,
      changePercent: 0
    };

    setHoldings(prev => [...prev, newHolding]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeHolding = (symbol) => {
    setHoldings(prev => prev.filter(h => h.symbol !== symbol));
  };

  const updateWeight = (symbol, newWeight) => {
    const weight = Math.max(0, Math.min(100, parseFloat(newWeight) || 0));
    setHoldings(prev => 
      prev.map(h => h.symbol === symbol ? { ...h, weight } : h)
    );
  };

  const normalizeWeights = () => {
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    if (totalWeight === 0) return;

    setHoldings(prev => 
      prev.map(h => ({
        ...h,
        weight: (h.weight / totalWeight) * 100
      }))
    );
  };

  const calculateMetrics = async () => {
    if (holdings.length === 0) return;

    setIsCalculating(true);
    try {
      const response = await fetch('/api/research/index/calculate-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holdings: holdings,
          name: indexName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        // Update holdings with validated data
        if (data.holdings) {
          setHoldings(data.holdings);
        }
      }
    } catch (error) {
      console.error('Metrics calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveIndex = async () => {
    if (holdings.length === 0) {
      alert('Please add at least one stock to your index');
      return;
    }

    try {
      const userId = localStorage.getItem('user_session_id') || 'guest';
      
      const response = await fetch('/api/research/index/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          indexData: {
            name: indexName,
            holdings: holdings,
            description: `Custom index with ${holdings.length} holdings`
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Index saved successfully!');
        if (onSave) onSave(data.index);
      } else {
        alert('Failed to save index: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save index');
    }
  };

  const exportToCSV = () => {
    if (holdings.length === 0) return;

    const headers = ['Symbol', 'Name', 'Weight %', 'Price', 'Market Cap', 'Sector', 'Beta', 'Dividend Yield %'];
    const rows = holdings.map(h => [
      h.symbol,
      h.name,
      h.weight.toFixed(2),
      h.price?.toFixed(2) || '0',
      h.marketCap || '0',
      h.sector || 'Unknown',
      h.beta?.toFixed(2) || '1.00',
      (h.dividendYield * 100)?.toFixed(2) || '0'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${indexName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Custom Index Builder</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showMetrics ? 'Hide' : 'Show'} Metrics
            </button>
            <button
              onClick={calculateMetrics}
              disabled={holdings.length === 0 || isCalculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Index Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Index Name
          </label>
          <input
            type="text"
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter index name..."
          />
        </div>

        {/* Stock Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Stocks to Index
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchStocks(e.target.value);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Search stocks by symbol or company name..."
            />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => addHolding(stock)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-600">{stock.name}</div>
                      </div>
                      <Plus className="w-4 h-4 text-green-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      {holdings.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Index Holdings ({holdings.length} stocks)
              </h3>
              <div className="flex items-center space-x-4">
                <div className={`text-sm font-medium ${
                  isWeightValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  Total Weight: {totalWeight.toFixed(1)}%
                </div>
                {!isWeightValid && (
                  <button
                    onClick={normalizeWeights}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                  >
                    Normalize to 100%
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding, index) => (
                  <tr key={holding.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={holding.weight.toFixed(2)}
                        onChange={(e) => updateWeight(holding.symbol, e.target.value)}
                        className="w-20 p-1 text-center border border-gray-300 rounded"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${holding.price?.toFixed(2) || '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${
                        holding.changePercent > 0 ? 'text-green-600' : 
                        holding.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {holding.changePercent ? 
                          `${holding.changePercent > 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%` : 
                          '--'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {holding.sector || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => removeHolding(holding.symbol)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={saveIndex}
                  disabled={holdings.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Index</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Dashboard */}
      {showMetrics && metrics && holdings.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>Portfolio Metrics</span>
              {isCalculating && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </h3>
          </div>

          <div className="p-6">
            {/* Basic Metrics */}
            {metrics.basic && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Basic Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">
                      {metrics.basic.numberOfHoldings}
                    </div>
                    <div className="text-sm text-blue-700">Holdings</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-900">
                      {metrics.basic.weightedPE?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Weighted P/E</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-900">
                      {metrics.basic.weightedBeta?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-700">Portfolio Beta</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-yellow-900">
                      {metrics.basic.weightedDividendYield?.toFixed(2) || '0.00'}%
                    </div>
                    <div className="text-sm text-yellow-700">Dividend Yield</div>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Metrics */}
            {metrics.risk && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Risk Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">Risk Grade</span>
                    </div>
                    <div className="text-xl font-bold text-red-900">
                      {metrics.risk.riskGrade || 'Medium'}
                    </div>
                    <div className="text-sm text-red-700">
                      Beta: {metrics.risk.portfolioBeta?.toFixed(2) || '1.00'}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="font-medium text-orange-900 mb-2">Concentration Risk</div>
                    <div className="text-lg font-bold text-orange-900">
                      {metrics.risk.concentrationRisk?.maxPosition?.toFixed(1) || '0'}%
                    </div>
                    <div className="text-sm text-orange-700">Max Position</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="font-medium text-indigo-900 mb-2">Diversification</div>
                    <div className="text-lg font-bold text-indigo-900">
                      {metrics.risk.diversificationScore || 'N/A'}
                    </div>
                    <div className="text-sm text-indigo-700">Score (0-100)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Allocation */}
            {metrics.allocation?.sector && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sector Allocation</h4>
                <div className="space-y-2">
                  {metrics.allocation.sector.slice(0, 5).map((sector) => (
                    <div key={sector.sector} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{sector.sector}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(sector.weight, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {sector.weight.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {holdings.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Custom Index</h3>
          <p className="text-gray-600 mb-6">
            Start by searching and adding stocks to create your personalized market index.
            We'll calculate portfolio metrics, risk analysis, and performance analytics in real-time.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Real-time metrics</span>
            </div>
            <div className="flex items-center space-x-1">
              <PieChart className="w-4 h-4" />
              <span>Risk analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>Performance tracking</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomIndexBuilder;
