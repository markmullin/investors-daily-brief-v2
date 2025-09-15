import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { getMarketEnvironment } from '../services/marketEnvironmentService';

/**
 * Market Environment Component V2 - Uses new backend endpoints
 * Shows real market data with fallback handling
 */
const MarketEnvironment = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketEnvironment();
    const interval = setInterval(fetchMarketEnvironment, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchMarketEnvironment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new Market Environment V2 service
      const response = await getMarketEnvironment();
      
      if (response && response.data) {
        setData(response.data);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Failed to fetch market environment:', err);
      setError('Unable to load market data');
      
      // Use fallback data structure
      setData({
        phase: { 
          phase: 'UNKNOWN', 
          confidence: 0,
          characteristics: {}
        },
        trend: { trend: 'NEUTRAL' },
        breadth: { percentAbove50MA: 50 },
        sentiment: { vix: 20, vixZone: 'NEUTRAL' },
        fundamentals: { marketPE: 21.5, earningsGrowth: 5.0 },
        synthesis: { 
          primaryInsight: 'Market data is being updated. Please check back shortly.',
          confidence: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase) => {
    if (!phase) return <Minus className="w-5 h-5" />;
    
    const phaseName = phase.phase || phase;
    switch(phaseName) {
      case 'BULL':
      case 'STRONG_BULL':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'BEAR':
      case 'STRONG_BEAR':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'CORRECTION':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'DATA_UNAVAILABLE':
      case 'UNKNOWN':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPhaseColor = (phase) => {
    if (!phase) return 'bg-gray-100 text-gray-700';
    
    const phaseName = phase.phase || phase;
    switch(phaseName) {
      case 'BULL':
      case 'STRONG_BULL':
        return 'bg-green-100 text-green-700';
      case 'BEAR':
      case 'STRONG_BEAR':
        return 'bg-red-100 text-red-700';
      case 'CORRECTION':
        return 'bg-yellow-100 text-yellow-700';
      case 'DATA_UNAVAILABLE':
      case 'UNKNOWN':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatPhaseText = (phase) => {
    if (!phase) return 'Unknown';
    
    const phaseName = phase.phase || phase;
    switch(phaseName) {
      case 'DATA_UNAVAILABLE':
        return 'Updating...';
      case 'UNKNOWN':
        return 'Analyzing...';
      case 'BULL':
        return 'Bull Market';
      case 'BEAR':
        return 'Bear Market';
      case 'CORRECTION':
        return 'Correction';
      case 'CONSOLIDATION':
        return 'Consolidation';
      default:
        return phaseName.replace(/_/g, ' ');
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Market Environment</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const phase = data?.phase || {};
  const sentiment = data?.sentiment || {};
  const breadth = data?.breadth || {};
  const synthesis = data?.synthesis || {};
  const fundamentals = data?.fundamentals || {};

  const confidence = phase.confidence || synthesis.confidence || 0;
  const isDataAvailable = phase.phase !== 'DATA_UNAVAILABLE' && phase.phase !== 'UNKNOWN';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Market Environment</h3>
        </div>
        <button 
          onClick={fetchMarketEnvironment}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Market Phase Badge */}
      <div className="mb-4">
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${getPhaseColor(phase)}`}>
          {getPhaseIcon(phase)}
          <span className="font-medium">{formatPhaseText(phase)}</span>
          {isDataAvailable && (
            <span className="text-sm opacity-75">
              ({Math.round(confidence)}% confidence)
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      {isDataAvailable && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">VIX Level</div>
            <div className="text-lg font-semibold">
              {sentiment.vix?.toFixed(1) || '—'}
            </div>
            <div className="text-xs text-gray-600">
              {sentiment.vixZone || 'Neutral'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Market Breadth</div>
            <div className="text-lg font-semibold">
              {breadth.percentAbove50MA?.toFixed(0) || 50}%
            </div>
            <div className="text-xs text-gray-600">Above 50-day MA</div>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">S&P 500 P/E</div>
            <div className="text-lg font-semibold">
              {fundamentals.marketPE?.toFixed(1) || '—'}
            </div>
            <div className="text-xs text-gray-600">
              {fundamentals.earningsGrowth ? `${fundamentals.earningsGrowth.toFixed(1)}% growth` : '—'}
            </div>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Trend</div>
            <div className="text-lg font-semibold">
              {data.trend?.trend || 'Neutral'}
            </div>
            <div className="text-xs text-gray-600">
              {data.trend?.momentum > 0 ? 'Positive' : 'Mixed'} momentum
            </div>
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div className="border-t pt-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {synthesis.primaryInsight || synthesis.summary || 
           (isDataAvailable ? 
            'Market conditions are being analyzed. Real-time insights will appear here.' :
            'Market data is being collected. The S&P 500 aggregation may take 30-45 minutes to complete for full fundamental data.'
           )}
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-3 text-xs text-orange-600 bg-orange-50 rounded p-2">
          {error}. Showing cached data.
        </div>
      )}
      
      {!isDataAvailable && !error && (
        <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded p-2">
          💡 Tip: Run S&P 500 aggregation to populate fundamental data. 
          POST to /api/market-env/aggregate with admin key.
        </div>
      )}
    </div>
  );
};

export default MarketEnvironment;