import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, EyeOff, TrendingUp, TrendingDown, AlertCircle, Settings, Download,
  Plus, X, RefreshCw, ChevronUp, ChevronDown, BarChart2, Users, Calendar,
  DollarSign, Activity, Info, Star, StarOff, Filter, Search
} from 'lucide-react';

/**
 * PROFESSIONAL WATCHLIST COMPONENT
 * Clean white/chrome theme matching dashboard design
 * Bloomberg Terminal-quality watchlist with real-time data
 */

const ProfessionalWatchlist = ({ 
  initialSymbols = [],
  onSymbolClick,
  maxSymbols = 50 
}) => {
  // Core state
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // UI state
  const [view, setView] = useState('table'); // table, grid, heatmap
  const [sortBy, setSortBy] = useState('changePercent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedColumns, setSelectedColumns] = useState([
    'symbol', 'name', 'price', 'change', 'changePercent', 'volume',
    'pe', 'marketCap', 'dividendYield', 'rsi'
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  
  // Groups for organizing watchlist
  const [groups, setGroups] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('watchlistGroups');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      default: initialSymbols,
      favorites: [],
      earnings: [],
      alerts: []
    };
  });
  const [activeGroup, setActiveGroup] = useState('default');
  const [addSymbolInput, setAddSymbolInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  
  // Additional data
  const [analystPulse, setAnalystPulse] = useState({});
  const [insiderActivity, setInsiderActivity] = useState({});
  const [upcomingEarnings, setUpcomingEarnings] = useState({});
  const [sectorPerformance, setSectorPerformance] = useState([]);

  // Available columns configuration
  const availableColumns = [
    { key: 'symbol', label: 'Symbol', width: 80, required: true },
    { key: 'name', label: 'Company', width: 200 },
    { key: 'price', label: 'Price', width: 80, format: 'currency' },
    { key: 'change', label: 'Change', width: 80, format: 'change' },
    { key: 'changePercent', label: 'Change %', width: 100, format: 'percent' },
    { key: 'volume', label: 'Volume', width: 100, format: 'volume' },
    { key: 'avgVolume', label: 'Avg Vol', width: 100, format: 'volume' },
    { key: 'marketCap', label: 'Market Cap', width: 120, format: 'marketCap' },
    { key: 'pe', label: 'P/E', width: 60, format: 'number' },
    { key: 'eps', label: 'EPS', width: 60, format: 'currency' },
    { key: 'beta', label: 'Beta', width: 60, format: 'number' },
    { key: 'dividendYield', label: 'Div Yield', width: 80, format: 'percent' },
    { key: 'priceToBook', label: 'P/B', width: 60, format: 'number' },
    { key: 'priceToSales', label: 'P/S', width: 60, format: 'number' },
    { key: 'evToEbitda', label: 'EV/EBITDA', width: 80, format: 'number' },
    { key: 'rsi', label: 'RSI', width: 60, format: 'rsi' },
    { key: 'fiftyDayMA', label: '50 MA', width: 80, format: 'currency' },
    { key: 'twoHundredDayMA', label: '200 MA', width: 80, format: 'currency' },
    { key: 'yearHigh', label: '52W High', width: 80, format: 'currency' },
    { key: 'yearLow', label: '52W Low', width: 80, format: 'currency' },
    { key: 'sector', label: 'Sector', width: 120 },
    { key: 'exchange', label: 'Exchange', width: 80 }
  ];

  // Load watchlist data
  const loadWatchlistData = useCallback(async () => {
    const symbols = groups[activeGroup];
    if (!symbols || symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch comprehensive data
      const response = await fetch('/api/watchlist/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });

      if (!response.ok) throw new Error('Failed to fetch watchlist data');
      
      const result = await response.json();
      if (result.success) {
        setWatchlist(result.data);
        setLastUpdate(new Date());
      }

      // Fetch additional insights in parallel
      const [analystRes, insiderRes, earningsRes, sectorRes] = await Promise.allSettled([
        fetch('/api/watchlist/analyst-pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        }),
        fetch('/api/watchlist/insider-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        }),
        fetch('/api/watchlist/earnings-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        }),
        fetch('/api/watchlist/sector-performance')
      ]);

      // Process additional data
      if (analystRes.status === 'fulfilled') {
        const data = await analystRes.value.json();
        if (data.success) {
          const pulseMap = {};
          data.data.forEach(item => {
            pulseMap[item.symbol] = item;
          });
          setAnalystPulse(pulseMap);
        }
      }

      if (insiderRes.status === 'fulfilled') {
        const data = await insiderRes.value.json();
        if (data.success) {
          const activityMap = {};
          data.data.forEach(item => {
            activityMap[item.symbol] = item;
          });
          setInsiderActivity(activityMap);
        }
      }

      if (earningsRes.status === 'fulfilled') {
        const data = await earningsRes.value.json();
        if (data.success) {
          const earningsMap = {};
          data.data.forEach(item => {
            earningsMap[item.symbol] = item;
          });
          setUpcomingEarnings(earningsMap);
        }
      }

      if (sectorRes.status === 'fulfilled') {
        const data = await sectorRes.value.json();
        if (data.success) {
          setSectorPerformance(data.data);
        }
      }

    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groups, activeGroup]);

  // Initial load and refresh interval
  useEffect(() => {
    loadWatchlistData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadWatchlistData, 30000);
    return () => clearInterval(interval);
  }, [loadWatchlistData]);

  // Format value based on type
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'change':
        return (
          <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}
          </span>
        );
      case 'percent':
        return (
          <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </span>
        );
      case 'volume':
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toLocaleString();
      case 'marketCap':
        if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${value.toLocaleString()}`;
      case 'number':
        return value.toFixed(2);
      case 'rsi':
        const rsiValue = parseFloat(value);
        let rsiColor = 'text-gray-900';
        if (rsiValue > 70) rsiColor = 'text-red-600';
        else if (rsiValue < 30) rsiColor = 'text-green-600';
        return <span className={rsiColor}>{rsiValue.toFixed(1)}</span>;
      default:
        return value;
    }
  };

  // Sort watchlist
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Filter watchlist
  const filteredWatchlist = sortedWatchlist.filter(stock => {
    const matchesSearch = !searchTerm || 
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = filterSector === 'all' || stock.sector === filterSector;
    
    return matchesSearch && matchesSector;
  });

  // Get unique sectors
  const sectors = [...new Set(watchlist.map(s => s.sector))].filter(Boolean);

  // Handle column sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Add symbol to watchlist
  const addSymbol = async (symbol) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol || groups[activeGroup].includes(upperSymbol)) return;
    
    const newGroups = { ...groups };
    newGroups[activeGroup] = [...newGroups[activeGroup], upperSymbol];
    setGroups(newGroups);
    
    // Save to localStorage
    localStorage.setItem('watchlistGroups', JSON.stringify(newGroups));
    
    // Clear input and reload data
    setAddSymbolInput('');
    setShowAddInput(false);
    
    // Trigger data reload after a brief delay
    setTimeout(loadWatchlistData, 100);
  };

  // Remove symbol from watchlist
  const removeSymbol = (symbol) => {
    const newGroups = { ...groups };
    newGroups[activeGroup] = newGroups[activeGroup].filter(s => s !== symbol);
    setGroups(newGroups);
    
    // Save to localStorage
    localStorage.setItem('watchlistGroups', JSON.stringify(newGroups));
  };

  // Export watchlist to CSV
  const exportToCSV = () => {
    const headers = selectedColumns.join(',');
    const rows = filteredWatchlist.map(stock => 
      selectedColumns.map(col => stock[col] || '').join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-${activeGroup}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header - Clean white/chrome design matching dashboard */}
      <div className="bg-white p-4 border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Professional Watchlist</h2>
            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
              {filteredWatchlist.length} stocks
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Add Symbol Button/Input */}
            {showAddInput ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={addSymbolInput}
                  onChange={(e) => setAddSymbolInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSymbol(addSymbolInput);
                    }
                  }}
                  placeholder="Symbol..."
                  className="px-2 py-1 rounded bg-white text-gray-900 placeholder-gray-400 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
                <button
                  onClick={() => addSymbol(addSymbolInput)}
                  className="p-1 bg-green-500 rounded hover:bg-green-600 transition-colors"
                  title="Add"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false);
                    setAddSymbolInput('');
                  }}
                  className="p-1 bg-red-500 rounded hover:bg-red-600 transition-colors"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1 text-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add</span>
              </button>
            )}
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setView('heatmap')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'heatmap' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Heatmap
              </button>
            </div>
            
            {/* Actions */}
            <button
              onClick={loadWatchlistData}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Group Tabs */}
        <div className="flex items-center space-x-2 mt-4">
          {Object.keys(groups).map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-4 py-1 rounded-lg capitalize text-sm font-medium transition-colors ${
                activeGroup === group 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group} ({groups[group].length})
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search symbols or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Sectors</option>
          {sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>

        {/* Market Context */}
        {sectorPerformance.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Best Sector:</span>
            <span className={`font-medium ${
              sectorPerformance[0]?.changePercent > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {sectorPerformance[0]?.sector} {sectorPerformance[0]?.changePercent > 0 ? '+' : ''}{sectorPerformance[0]?.changePercent?.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectedColumns.map(col => {
                  const column = availableColumns.find(c => c.key === col);
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column?.label || col}</span>
                        {sortBy === col && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Signals</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredWatchlist.map((stock) => (
                <tr
                  key={stock.symbol}
                  className="hover:bg-gray-50 cursor-pointer group transition-colors"
                  onClick={() => onSymbolClick?.(stock.symbol)}
                >
                  {selectedColumns.map(col => {
                    const column = availableColumns.find(c => c.key === col);
                    return (
                      <td key={col} className="px-4 py-3 text-sm">
                        {col === 'symbol' ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">{stock[col]}</span>
                            {groups.favorites.includes(stock.symbol) && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSymbol(stock.symbol);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                              title="Remove from watchlist"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          formatValue(stock[col], column?.format)
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Analyst Activity */}
                      {analystPulse[stock.symbol]?.hasActivity && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Analyst activity" />
                      )}
                      
                      {/* Insider Activity */}
                      {insiderActivity[stock.symbol]?.netBuySell === 'buying' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Insider buying" />
                      )}
                      {insiderActivity[stock.symbol]?.netBuySell === 'selling' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" title="Insider selling" />
                      )}
                      
                      {/* Upcoming Earnings */}
                      {upcomingEarnings[stock.symbol] && (
                        <Calendar className="w-3 h-3 text-purple-500" title={`Earnings: ${upcomingEarnings[stock.symbol].date}`} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWatchlist.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all"
              onClick={() => onSymbolClick?.(stock.symbol)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{stock.symbol}</span>
                <span className={`text-sm font-medium ${
                  stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2 truncate">{stock.name}</div>
              <div className="text-2xl font-bold mb-2">${stock.price?.toFixed(2)}</div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Vol: {formatValue(stock.volume, 'volume')}</span>
                <span>P/E: {stock.pe?.toFixed(1) || '-'}</span>
              </div>
              
              {/* Signals */}
              <div className="flex items-center space-x-1 mt-2">
                {analystPulse[stock.symbol]?.hasActivity && (
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Analyst</div>
                )}
                {insiderActivity[stock.symbol]?.netBuySell === 'buying' && (
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Insider Buy</div>
                )}
                {upcomingEarnings[stock.symbol] && (
                  <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Earnings</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap View */}
      {view === 'heatmap' && (
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {filteredWatchlist.map((stock) => {
              const change = stock.changePercent || 0;
              const intensity = Math.min(Math.abs(change) / 5, 1);
              const bgColor = change >= 0 
                ? `rgba(16, 185, 129, ${intensity})`
                : `rgba(239, 68, 68, ${intensity})`;
              
              return (
                <div
                  key={stock.symbol}
                  className="relative p-4 rounded-lg cursor-pointer transition-transform hover:scale-105 text-white"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => onSymbolClick?.(stock.symbol)}
                >
                  <div className="font-bold">{stock.symbol}</div>
                  <div className="text-sm">
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </div>
                  <div className="text-xs opacity-90">
                    ${stock.price?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-t">
          <h3 className="font-semibold mb-3">Customize Columns</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableColumns.map(col => (
              <label key={col.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedColumns([...selectedColumns, col.key]);
                    } else if (!col.required) {
                      setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                    }
                  }}
                  disabled={col.required}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between rounded-b-xl">
        <span>
          Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
        </span>
        <span>
          Auto-refresh every 30 seconds
        </span>
      </div>
    </div>
  );
};

export default ProfessionalWatchlist;
