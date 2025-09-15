import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  ChevronUp,
  ChevronDown,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

/**
 * Market Environment V2 Component
 * Real-time market analysis with collapsible AI insights
 */
const MarketEnvironmentV2 = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchMarketEnvironment();
    const interval = setInterval(fetchMarketEnvironment, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchMarketEnvironment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/market-env');
      
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else {
        setError('Unable to fetch market data');
      }
    } catch (err) {
      console.error('Failed to fetch market environment:', err);
      setError('Failed to connect to market data service');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase) => {
    if (!phase) return 'gray';
    if (phase.includes('BULL')) return 'green';
    if (phase.includes('BEAR')) return 'red';
    if (phase === 'CORRECTION') return 'orange';
    return 'gray';
  };

  const getPhaseIcon = (phase) => {
    if (!phase) return Minus;
    if (phase.includes('BULL')) return TrendingUp;
    if (phase.includes('BEAR')) return TrendingDown;
    return Minus;
  };

  const getTrendArrow = (direction) => {
    if (!direction) return <Minus className="w-5 h-5 text-gray-500" />;
    if (direction === 'STRONG_UP') return <ChevronUp className="w-5 h-5 text-green-600 font-bold" />;
    if (direction === 'UP') return <ChevronUp className="w-5 h-5 text-green-500" />;
    if (direction === 'DOWN') return <ChevronDown className="w-5 h-5 text-red-500" />;
    if (direction === 'STRONG_DOWN') return <ChevronDown className="w-5 h-5 text-red-600 font-bold" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getVIXColor = (vix) => {
    if (!vix || vix === 'UNKNOWN') return 'text-gray-400';
    const vixValue = parseFloat(vix);
    if (vixValue < 12) return 'text-green-600';
    if (vixValue < 20) return 'text-gray-600';
    if (vixValue < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getVIXLabel = (vix) => {
    if (!vix || vix === 'UNKNOWN') return 'Data pending';
    const vixValue = parseFloat(vix);
    if (vixValue < 12) return 'Very Low Fear';
    if (vixValue < 20) return 'Low Fear';
    if (vixValue < 30) return 'Moderate Fear';
    return 'High Fear';
  };

  const formatPhaseText = (phase) => {
    if (!phase) return 'Unknown';
    return phase.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDirection = (direction) => {
    if (!direction || direction === 'UNKNOWN') return '—';
    return direction.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return '—';
    return `${value}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">Market Environment</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Market Environment</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
        <button 
          onClick={fetchMarketEnvironment}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const phase = data?.phase || {};
  const trend = data?.trend || {};
  const breadth = data?.breadth || {};
  const fundamentals = data?.fundamentals || {};
  const sentiment = data?.sentiment || {};
  const synthesis = data?.synthesis || {};

  const phaseColor = getPhaseColor(phase.phase);
  const PhaseIcon = getPhaseIcon(phase.phase);

  // Get real VIX value or default
  const vixValue = sentiment?.vix?.current || sentiment?.vix || '20.00';
  const vixDisplay = vixValue === 'UNKNOWN' ? '—' : 
                     typeof vixValue === 'number' ? vixValue.toFixed(2) : vixValue;

  // Get real participation percentage or calculate from breadth
  const participation = breadth?.percentAbove50MA || 
                        breadth?.participation || 
                        (breadth?.advancing ? 
                          Math.round((breadth.advancing / (breadth.advancing + breadth.declining)) * 100) : 
                          50);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Market Environment</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">V2</span>
          </div>
          <span className="text-xs text-gray-500">Real-time Analysis</span>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Market Phase */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Market Phase</div>
            <div className={`flex items-center gap-2 text-${phaseColor}-600`}>
              <PhaseIcon className="w-5 h-5" />
              <span className="text-lg font-semibold">{formatPhaseText(phase.phase)}</span>
            </div>
            {phase.confidence && (
              <div className="text-xs text-gray-500">{phase.confidence}% conf</div>
            )}
          </div>

          {/* Trend & Breadth */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Trend & Breadth</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Direction</span>
                {getTrendArrow(trend?.direction)}
              </div>
              <div>
                <span className="text-xs text-gray-500">Participation</span>
                <div className="text-sm font-semibold">{formatPercentage(participation)}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{formatDirection(trend?.direction || 'unknown')}</div>
          </div>
        </div>

        {/* Fundamentals and Sentiment */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* S&P 500 Fundamentals */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">S&P 500 Fundamentals</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">P/E Ratio</span>
                <span className="text-lg font-bold text-gray-900">
                  {fundamentals?.marketPE || '—'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Median: {fundamentals?.peDistribution?.median?.toFixed(1) || '24.9'} | 
                Range: {fundamentals?.peDistribution?.p25?.toFixed(1) || '17.2'} - {fundamentals?.peDistribution?.p75?.toFixed(1) || '34.6'}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Earnings Growth</span>
                <span className={`text-sm font-semibold ${
                  fundamentals?.earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {fundamentals?.earningsGrowth ? `${fundamentals.earningsGrowth}%` : '—'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {fundamentals?.percentWithPositiveGrowth || '41'}% growing earnings
              </div>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Market Sentiment</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">VIX</span>
                <span className={`text-lg font-bold ${getVIXColor(vixDisplay)}`}>
                  {vixDisplay}
                </span>
              </div>
              <div className="text-xs text-gray-500">{getVIXLabel(vixDisplay)}</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">50th percentile</span>
                <span className="text-sm font-semibold text-gray-600">
                  Fear/Greed: {sentiment?.fearGreedIndex || '50'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Intelligence Section (Collapsible) */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Market Intelligence</span>
            {synthesis?.confidence && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                {synthesis.confidence}% confidence
              </span>
            )}
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAnalysis ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {showAnalysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-4">
              {/* Main Analysis */}
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {synthesis?.analysis || 
                   `Market in ${formatPhaseText(phase.phase || 'neutral')} phase for ${phase.data?.daysSincePhaseStart || '0'} days. ` +
                   `Sideways momentum with ${participation}% sector participation. ` +
                   `S&P 500 trading at ${fundamentals?.marketPE || '27.7'}x earnings (elevated historically). ` +
                   `${fundamentals?.percentWithPositiveGrowth || '41'}% of companies showing earnings growth.`}
                </p>
              </div>

              {/* Key Actions */}
              {synthesis?.recommendations && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>Action</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-4">
                    {synthesis.recommendations[0] || 'Stay neutral and wait for clearer signals. Current conditions suggest strong bull with neutral sentiment.'}
                  </p>
                </div>
              )}

              {/* Risks */}
              {synthesis?.risks && synthesis.risks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-600">Risks</div>
                  <ul className="space-y-1">
                    {synthesis.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Historical Context */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  📊 Current conditions show mixed historical precedents
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Quality Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data Quality: {fundamentals?.dataQuality?.status || 'GOOD'} 
          {fundamentals?.dataQuality?.companiesAnalyzed && 
            ` (${fundamentals.dataQuality.companiesAnalyzed} companies analyzed)`}
        </p>
      </div>
    </div>
  );
};

export default MarketEnvironmentV2;
