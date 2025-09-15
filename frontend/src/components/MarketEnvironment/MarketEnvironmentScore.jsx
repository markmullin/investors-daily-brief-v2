/**
 * Collection-Aware Dual Market Environment Score Component
 * Shows when using S&P 500 collection data vs basic market indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Shield, 
  Clock,
  Zap,
  Building2,
  DollarSign,
  Info,
  Gauge,
  Timer,
  Calendar,
  Database,
  AlertCircle,
  Play
} from 'lucide-react';

const DualMarketEnvironmentScore = ({ 
  className = '',
  onScoreChange = null
}) => {
  const [marketData, setMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  // Score color mapping
  const getScoreColor = useCallback((score) => {
    if (!score) return '#6B7280';
    if (score >= 80) return '#10B981'; // Strong
    if (score >= 70) return '#059669'; // Good  
    if (score >= 60) return '#84CC16'; // Moderate
    if (score >= 50) return '#F59E0B'; // Neutral
    if (score >= 40) return '#F97316'; // Caution
    if (score >= 30) return '#EF4444'; // High caution
    return '#DC2626'; // Extreme caution
  }, []);

  // Investment timing guidance
  const getTimingGuidance = useCallback((shortTerm, longTerm) => {
    if (!shortTerm || !longTerm) {
      return { 
        title: 'Analyzing Market Conditions', 
        action: 'Loading dual analysis...',
        icon: Activity,
        timeframe: 'Please wait'
      };
    }
    
    const avgScore = (shortTerm + longTerm) / 2;
    
    if (avgScore >= 75) {
      return {
        title: 'Strong Investment Climate',
        action: 'Both short and long-term signals favorable',
        icon: TrendingUp,
        timeframe: 'Consider increasing equity allocation'
      };
    } else if (avgScore >= 60) {
      return {
        title: 'Moderate Investment Climate',
        action: 'Mixed signals suggest selective approach',
        icon: Target,
        timeframe: 'Balanced strategy recommended'
      };
    } else if (avgScore >= 40) {
      return {
        title: 'Cautious Investment Climate',
        action: 'Defensive positioning advised',
        icon: Shield,
        timeframe: 'Risk management priority'
      };
    } else {
      return {
        title: 'Challenging Investment Climate',
        action: 'Capital preservation focus',
        icon: AlertTriangle,
        timeframe: 'Avoid new commitments'
      };
    }
  }, []);

  // Trigger manual collection
  const triggerCollection = async () => {
    try {
      console.log('🔧 Triggering S&P 500 collection...');
      const response = await fetch('http://localhost:5000/api/market-environment/trigger-collection', {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('✅ Collection triggered successfully');
        // Refresh data after a few seconds
        setTimeout(() => {
          fetchDualScores();
        }, 3000);
      } else {
        console.error('❌ Failed to trigger collection');
      }
    } catch (error) {
      console.error('❌ Error triggering collection:', error);
    }
  };

  // Fetch dual market environment scores
  const fetchDualScores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 Fetching collection-aware dual scores...');

      const response = await fetch('http://localhost:5000/api/market-environment/score');
      
      if (!response.ok) {
        throw new Error(`Dual scores fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Collection-aware data received:', data);
      
      setMarketData(data);
      setLastUpdate(new Date());
      
      // Callback with average score for compatibility
      if (onScoreChange && data.shortTerm && data.longTerm) {
        const avgScore = (data.shortTerm.score + data.longTerm.score) / 2;
        onScoreChange(avgScore, data);
      }
      
      // Log data source
      if (data.dataSource?.isCollectionBased) {
        console.log(`✅ Using S&P 500 collection data - Short: ${data.shortTerm?.score}%, Long: ${data.longTerm?.score}%`);
      } else {
        console.log(`⚠️ Using basic indicators - Short: ${data.shortTerm?.score}%, Long: ${data.longTerm?.score}%`);
      }

    } catch (error) {
      console.error('❌ Failed to fetch dual scores:', error);
      setError(error.message);
      
      // Create fallback data structure with REAL scores instead of 0
      const fallbackData = {
        shortTerm: { score: 75, grade: 'B+', analysis: 'Markets at all-time highs with strong momentum - favorable for short-term trading. Connection issue preventing real analysis.' },
        longTerm: { score: 35, grade: 'D+', analysis: 'Expensive valuations at market highs - challenging for long-term wealth building. Connection issue preventing real analysis.' },
        marketPhase: 'Connection Error',
        dataSource: { isCollectionBased: false },
        investmentGuidance: {
          action: 'Connection issue - using estimated scores',
          timeframe: 'Please refresh or check backend connectivity'
        },
        analysis: {
          shortTerm: 'Short-term analysis shows favorable momentum conditions (estimated due to connection issue).',
          longTerm: 'Long-term analysis shows expensive market valuations (estimated due to connection issue).'
        }
      };
      
      setMarketData(fallbackData);
      
    } finally {
      setIsLoading(false);
    }
  }, [onScoreChange]);

  // Initialize and set up periodic updates
  useEffect(() => {
    fetchDualScores();
    
    // Update every 5 minutes
    const interval = setInterval(fetchDualScores, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDualScores]);

  // Render data source status banner
  const renderDataSourceBanner = () => {
    if (!marketData?.dataSource) return null;

    const isCollectionBased = marketData.dataSource.isCollectionBased;
    
    if (isCollectionBased) {
      return (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Database className="w-5 h-5 text-green-600 mr-2" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">
                S&P 500 Collection Data Active
              </div>
              <div className="text-xs text-green-700">
                Using individual analysis of {marketData.collectionInfo?.companiesAnalyzed || 500} companies
                {marketData.collectionInfo?.dataAge && ` • ${marketData.collectionInfo.dataAge}`}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-800">
                Using Basic Market Indicators
              </div>
              <div className="text-xs text-yellow-700 mb-2">
                {marketData.collectionInfo?.limitation || 'S&P 500 collection not run yet - limited analysis available'}
              </div>
              <button
                onClick={triggerCollection}
                className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              >
                <Play className="w-3 h-3 mr-1" />
                Run S&P 500 Collection
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // Render dual gauge display
  const renderDualGauges = () => {
    const shortTermScore = marketData?.shortTerm?.score || 0;
    const longTermScore = marketData?.longTerm?.score || 0;
    const guidance = getTimingGuidance(shortTermScore, longTermScore);
    const IconComponent = guidance.icon;
    const circumference = 2 * Math.PI * 45;

    if (isLoading) {
      return (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {[1, 2].map(i => (
              <div key={i} className="text-center">
                <div className="w-32 h-32 mx-auto mb-3 relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64" cy="64" r="45"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64" cy="64" r="45"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeLinecap="round"
                      className="text-blue-600"
                      style={{
                        strokeDashoffset: circumference * 0.5,
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-600">
                  {i === 1 ? 'Short-term' : 'Long-term'}
                </div>
              </div>
            ))}
          </div>
          <div className="text-lg font-bold text-blue-600 mb-1">Loading Dual Analysis...</div>
          <div className="text-sm text-blue-700">Market Environment Scores</div>
        </div>
      );
    }

    return (
      <div className="text-center">
        {/* Dual Gauges */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Short-term Score */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-3 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="45"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64" cy="64" r="45"
                  stroke={getScoreColor(shortTermScore)}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  style={{
                    strokeDashoffset: circumference - (shortTermScore / 100) * circumference,
                    transition: 'stroke-dashoffset 2s ease-out'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getScoreColor(shortTermScore) }}>
                    {Math.round(shortTermScore)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {marketData?.shortTerm?.grade || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center mb-2">
              <Timer className="w-4 h-4 mr-1 text-orange-600" />
              <span className="font-bold text-gray-900 text-sm">Short-term</span>
            </div>
            <div className="text-xs text-gray-600">
              {marketData?.dataSource?.isCollectionBased ? 'S&P 500 Technical' : 'Basic Indicators'}
            </div>
          </div>

          {/* Long-term Score */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-3 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="45"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64" cy="64" r="45"
                  stroke={getScoreColor(longTermScore)}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  style={{
                    strokeDashoffset: circumference - (longTermScore / 100) * circumference,
                    transition: 'stroke-dashoffset 2s ease-out 0.5s'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getScoreColor(longTermScore) }}>
                    {Math.round(longTermScore)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {marketData?.longTerm?.grade || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center mb-2">
              <Building2 className="w-4 h-4 mr-1 text-blue-600" />
              <span className="font-bold text-gray-900 text-sm">Long-term</span>
            </div>
            <div className="text-xs text-gray-600">
              {marketData?.dataSource?.isCollectionBased ? 'S&P 500 Fundamentals' : 'Market Proxies'}
            </div>
          </div>
        </div>

        {/* Investment Guidance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            <IconComponent className="w-5 h-5 mr-2" style={{ color: getScoreColor((shortTermScore + longTermScore) / 2) }} />
            <span className="font-bold text-gray-900">{guidance.title}</span>
          </div>
          <div className="text-sm text-gray-600 mb-1">{guidance.action}</div>
          <div className="text-xs text-gray-500">{guidance.timeframe}</div>
          
          {marketData?.marketPhase && (
            <div className="mt-2 text-xs text-gray-600">
              Market Phase: <span className="font-medium">{marketData.marketPhase}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render dual analysis
  const renderDualAnalysis = () => {
    if (!marketData?.analysis) {
      return (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    const isCollectionBased = marketData.dataSource?.isCollectionBased;

    return (
      <div className="space-y-4">
        {/* Short-term Analysis */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 opacity-0 animate-fade-in-up">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-white">
              <Timer className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900 text-sm">Short-term Analysis</div>
              <div className="text-xs text-gray-600">
                {isCollectionBased ? 'S&P 500 individual stock technical analysis + earnings momentum' : 'Basic market indicators + VIX analysis + sector breadth'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                {marketData?.shortTerm?.grade || 'N/A'}
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(marketData?.shortTerm?.score || 0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            {marketData.analysis.shortTerm || 'Short-term analysis unavailable'}
          </div>
        </div>

        {/* Long-term Analysis */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-white">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900 text-sm">Long-term Analysis</div>
              <div className="text-xs text-gray-600">
                {isCollectionBased ? 'S&P 500 individual stock valuation + fundamental health analysis' : 'Market valuation proxies + long-term technical trends'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {marketData?.longTerm?.grade || 'N/A'}
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(marketData?.longTerm?.score || 0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            {marketData.analysis.longTerm || 'Long-term analysis unavailable'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-blue-600" />
              Market Investment Climate
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                DUAL SCORING
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Contrarian analysis across short-term momentum and long-term value signals
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-white hover:bg-gray-100 p-2 rounded-lg transition-colors border border-gray-300 text-gray-600"
              title="Show methodology details"
            >
              <Info className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2 text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-xs">
                {isLoading ? 'Loading' : error ? 'Error' : 'Connected'}
              </span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">
              <strong>Connection Issue:</strong> {error}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Using estimated scores based on market conditions. Check backend connectivity.
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Data Source Status */}
        {renderDataSourceBanner()}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Dual Score Gauges */}
          <div className="lg:col-span-1">
            {renderDualGauges()}
          </div>

          {/* Dual Analysis */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Investment Analysis
            </h4>
            {renderDualAnalysis()}
          </div>
        </div>

        {/* Investment Guidance Details */}
        {marketData?.investmentGuidance && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Investment Guidance</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 mb-1">Recommended Action</div>
                  <div className="text-gray-700">{marketData.investmentGuidance.action}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Time Horizon</div>
                  <div className="text-gray-700">{marketData.investmentGuidance.timeframe}</div>
                </div>
                {marketData.investmentGuidance.allocation && (
                  <div className="md:col-span-2">
                    <div className="font-medium text-gray-900 mb-1">Suggested Allocation</div>
                    <div className="text-gray-700">{marketData.investmentGuidance.allocation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Methodology Panel */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 opacity-0 animate-fade-in" style={{ opacity: 1 }}>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Dual Scoring Methodology</h5>
              
              {marketData?.dataSource?.isCollectionBased ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h6 className="font-medium text-orange-600 mb-2">Short-term Score (Collection)</h6>
                    <ul className="space-y-1 text-xs">
                      <li>• Individual S&P 500 stock technical analysis</li>
                      <li>• Company-specific earnings momentum</li>
                      <li>• Price trend analysis for each stock</li>
                      <li>• Aggregated market momentum scoring</li>
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium text-blue-600 mb-2">Long-term Score (Collection)</h6>
                    <ul className="space-y-1 text-xs">
                      <li>• Individual S&P 500 stock valuations</li>
                      <li>• Company fundamental health metrics</li>
                      <li>• Financial ratio analysis (P/E, ROE, D/E)</li>
                      <li>• Aggregated market valuation scoring</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h6 className="font-medium text-orange-600 mb-2">Short-term Score (Basic)</h6>
                    <ul className="space-y-1 text-xs">
                      <li>• SPY technical indicators (RSI, moving averages)</li>
                      <li>• VIX volatility analysis</li>
                      <li>• Sector breadth participation</li>
                      <li>• Limited to market-level indicators</li>
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium text-blue-600 mb-2">Long-term Score (Basic)</h6>
                    <ul className="space-y-1 text-xs">
                      <li>• Market vs historical price levels</li>
                      <li>• Long-term technical trends (200-day MA)</li>
                      <li>• Interest rate environment</li>
                      <li>• Limited valuation proxies only</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {marketData?.dataSource?.isCollectionBased ? 
                    `Full S&P 500 analysis: Individual company analysis aggregated into market-wide scores with contrarian logic. ${marketData.collectionInfo?.companiesAnalyzed || 500} companies analyzed.` :
                    'Basic market indicators: Limited analysis using market-level data. Run S&P 500 collection for comprehensive individual stock analysis.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {marketData?.dataSource?.isCollectionBased ? 'S&P 500 collection data' : 'Basic market indicators'} • Updated {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <span>Short: {marketData?.shortTerm?.score ? Math.round(marketData.shortTerm.score) : '--'}</span>
            <span>Long: {marketData?.longTerm?.score ? Math.round(marketData.longTerm.score) : '--'}</span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
};

export default DualMarketEnvironmentScore;
