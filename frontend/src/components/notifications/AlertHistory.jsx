import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Filter, 
  Search, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Brain,
  DollarSign,
  BarChart3,
  Shield,
  Info,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';

const AlertHistory = ({ portfolioId, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, severity, type
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    loadAlertHistory();
  }, [portfolioId]);

  useEffect(() => {
    applyFilters();
  }, [alerts, searchTerm, severityFilter, typeFilter, dateFilter, sortBy, sortOrder]);

  const loadAlertHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/portfolio/${portfolioId}?limit=200`);
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        console.error('Failed to load alert history');
      }
    } catch (error) {
      console.error('Error loading alert history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // Text search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title?.toLowerCase().includes(search) ||
        alert.message?.toLowerCase().includes(search) ||
        alert.symbol?.toLowerCase().includes(search) ||
        alert.type?.toLowerCase().includes(search)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'portfolio') {
        filtered = filtered.filter(alert => alert.type.startsWith('portfolio_'));
      } else if (typeFilter === 'holding') {
        filtered = filtered.filter(alert => alert.type.startsWith('holding_'));
      } else if (typeFilter === 'ai') {
        filtered = filtered.filter(alert => alert.type.startsWith('ai_'));
      } else if (typeFilter === 'risk') {
        filtered = filtered.filter(alert => 
          alert.type.includes('risk') || alert.type.includes('concentration')
        );
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filters = {
        today: () => {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return alert => new Date(alert.timestamp) >= today;
        },
        week: () => {
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return alert => new Date(alert.timestamp) >= weekAgo;
        },
        month: () => {
          const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
          return alert => new Date(alert.timestamp) >= monthAgo;
        }
      };

      if (filters[dateFilter]) {
        filtered = filtered.filter(filters[dateFilter]());
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'timestamp':
        default:
          aValue = a.timestamp || 0;
          bValue = b.timestamp || 0;
          break;
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    setFilteredAlerts(filtered);
  };

  const getAlertIcon = (type) => {
    const iconMap = {
      portfolio_daily_gain: TrendingUp,
      portfolio_daily_loss: TrendingDown,
      portfolio_milestone_gain: CheckCircle,
      portfolio_value_change: DollarSign,
      holding_price_change: BarChart3,
      holding_portfolio_impact: TrendingUp,
      concentration_risk: Shield,
      ai_regime_change: Brain,
      ai_prediction_alert: Brain,
      ai_sentiment_shift: Brain,
      ai_rebalancing_alert: Brain,
      test: Info,
      default: AlertTriangle
    };

    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    return badges[severity] || badges.medium;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(timestamp)
    };
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'Severity', 'Title', 'Message', 'Symbol', 'Data'];
    const rows = filteredAlerts.map(alert => [
      new Date(alert.timestamp).toISOString(),
      alert.type,
      alert.severity,
      alert.title,
      alert.message,
      alert.symbol || '',
      alert.data ? JSON.stringify(alert.data) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-alerts-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = filteredAlerts.length;
    const high = filteredAlerts.filter(a => a.severity === 'high').length;
    const medium = filteredAlerts.filter(a => a.severity === 'medium').length;
    const low = filteredAlerts.filter(a => a.severity === 'low').length;

    return { total, high, medium, low };
  };

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Alert History</h2>
                <p className="text-sm text-gray-600">Portfolio: {portfolioId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-red-600">{stats.high}</div>
              <div className="text-sm text-red-600">High</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-yellow-600">{stats.medium}</div>
              <div className="text-sm text-yellow-600">Medium</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-green-600">{stats.low}</div>
              <div className="text-sm text-green-600">Low</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="portfolio">Portfolio</option>
              <option value="holding">Holdings</option>
              <option value="ai">AI Insights</option>
              <option value="risk">Risk</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="timestamp">Date</option>
              <option value="severity">Severity</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading alerts...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No alerts have been generated yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const formatted = formatDate(alert.timestamp);
                return (
                  <div
                    key={alert.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-gray-500 mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSeverityBadge(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            {alert.symbol && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded font-mono">
                                {alert.symbol}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{alert.message}</p>
                          
                          {/* Alert Data */}
                          {alert.data && Object.keys(alert.data).length > 0 && (
                            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                              {Object.entries(alert.data).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {typeof value === 'number' && key.includes('Percent') 
                                      ? `${value.toFixed(2)}%`
                                      : typeof value === 'number' && key.includes('Value')
                                      ? `$${value.toLocaleString()}`
                                      : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatted.relative}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatted.date} {formatted.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertHistory;