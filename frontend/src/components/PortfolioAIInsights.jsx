import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  RefreshCw,
  Zap,
  BarChart3,
  PieChart,
  Lightbulb,
  Shield,
  Sparkles
} from 'lucide-react';

const PortfolioAIInsights = ({ portfolioId, onError }) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loadingStep, setLoadingStep] = useState(0);

  const abortControllerRef = useRef(null);

  const loadingSteps = [
    'Gathering portfolio holdings and market data...',
    'Running ML ensemble models for predictions...',
    'Detecting market regime (Bull/Bear/Volatile/Stable)...',
    'Analyzing multi-source sentiment signals...',
    'Calculating dynamic allocation recommendations...',
    'Generating AI-powered investment insights...'
  ];

  const tabs = [
    { id: 'overview', label: 'AI Overview', icon: Brain },
    { id: 'predictions', label: 'ML Predictions', icon: TrendingUp },
    { id: 'regime', label: 'Market Regime', icon: Activity },
    { id: 'sentiment', label: 'Sentiment', icon: BarChart3 },
    { id: 'allocation', label: 'Dynamic Allocation', icon: PieChart },
    { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb }
  ];

  useEffect(() => {
    if (portfolioId) {
      fetchAIIntelligence();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [portfolioId]);

  const fetchAIIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStep(0);

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Simulate loading steps for better UX
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => {
          const next = prev + 1;
          if (next >= loadingSteps.length) {
            clearInterval(stepInterval);
          }
          return Math.min(next, loadingSteps.length - 1);
        });
      }, 800);

      console.log(`🧠 Fetching AI intelligence for portfolio ${portfolioId}...`);

      // Fetch comprehensive AI intelligence
      const response = await fetch(`/api/portfolio/${portfolioId}/ai-intelligence`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.aiIntelligence?.error) {
        throw new Error(data.aiIntelligence.error);
      }

      setAiData(data);
      setLastUpdated(new Date());
      clearInterval(stepInterval);
      setLoadingStep(loadingSteps.length);

      console.log('✅ AI intelligence loaded successfully');

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('AI intelligence request aborted');
        return;
      }

      console.error('❌ Error fetching AI intelligence:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAIIntelligence();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Investment Intelligence</h2>
            <p className="text-sm text-gray-600">ML predictions • Market regime • Sentiment analysis • Dynamic allocation</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            {loadingSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index < loadingStep 
                    ? 'bg-green-100 text-green-600' 
                    : index === loadingStep 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {index < loadingStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : index === loadingStep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-current" />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  index <= loadingStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Running ensemble ML models and analyzing market conditions for personalized investment insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 rounded-2xl shadow-xl border border-red-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Analysis Error</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry AI Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!aiData?.aiIntelligence) {
    return (
      <div className="bg-gray-50 rounded-2xl shadow border border-gray-200 p-8 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Intelligence Available</h3>
        <p className="text-gray-600 mb-4">Add holdings to your portfolio to enable AI-powered investment insights.</p>
      </div>
    );
  }

  const ai = aiData.aiIntelligence;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Market Regime</h4>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {ai.marketRegime?.currentRegime || 'Analyzing...'}
          </div>
          <div className="text-sm text-gray-600">
            {ai.marketRegime?.confidence && `${(ai.marketRegime.confidence * 100).toFixed(1)}% confidence`}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Sentiment Score</h4>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {ai.sentimentAnalysis?.overallSentiment ? 
              (ai.sentimentAnalysis.overallSentiment * 100).toFixed(0) : 
              '...'
            }
          </div>
          <div className="text-sm text-gray-600">
            {ai.sentimentAnalysis?.trend || 'Overall market sentiment'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">AI Confidence</h4>
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {ai.metadata?.confidenceScore ? 
              (ai.metadata.confidenceScore * 100).toFixed(0) + '%' : 
              '...'
            }
          </div>
          <div className="text-sm text-gray-600">
            Overall analysis confidence
          </div>
        </div>
      </div>

      {/* AI Recommendations Summary */}
      {ai.aiRecommendations && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Key AI Recommendations
          </h4>
          
          <div className="space-y-4">
            {ai.aiRecommendations.immediateActions?.slice(0, 3).map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{action.signal || action}</p>
                  {action.strength && (
                    <p className="text-xs text-gray-600 mt-1">
                      Strength: {(action.strength * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-6">
      {ai.mlPredictions?.predictions && Object.keys(ai.mlPredictions.predictions).length > 0 ? (
        Object.entries(ai.mlPredictions.predictions).map(([horizon, predictions]) => (
          <div key={horizon} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              {horizon} Predictions
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(predictions).map(([symbol, prediction]) => (
                <div key={symbol} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{symbol}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      prediction.direction === 'bullish' 
                        ? 'bg-green-100 text-green-800'
                        : prediction.direction === 'bearish'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prediction.direction}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {prediction.expected_return_percent?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No ML predictions available</p>
        </div>
      )}
    </div>
  );

  const renderRegime = () => (
    <div className="space-y-6">
      {ai.marketRegime ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Current Market Regime
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {ai.marketRegime.currentRegime}
                </div>
                <div className="text-lg text-gray-600 mb-4">
                  {(ai.marketRegime.confidence * 100).toFixed(1)}% confidence
                </div>
                <p className="text-gray-700">
                  {ai.marketRegime.interpretation}
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Regime Probabilities</h5>
                <div className="space-y-2">
                  {ai.marketRegime.regimeProbabilities && Object.entries(ai.marketRegime.regimeProbabilities).map(([regime, prob]) => (
                    <div key={regime} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{regime}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {(prob * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {ai.marketRegime.expectedDuration && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h5 className="font-medium text-gray-900 mb-3">Expected Duration</h5>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {ai.marketRegime.expectedDuration.toFixed(0)} days
              </p>
              <p className="text-sm text-gray-600">
                Expected time remaining in current regime
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Market regime analysis not available</p>
        </div>
      )}
    </div>
  );

  const renderSentiment = () => (
    <div className="space-y-6">
      {ai.sentimentAnalysis ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Market Sentiment Analysis
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(ai.sentimentAnalysis.overallSentiment * 100).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 mb-2">Overall Score</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ai.sentimentAnalysis.overallSentiment > 0.6 
                    ? 'bg-green-100 text-green-800'
                    : ai.sentimentAnalysis.overallSentiment < 0.4
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {ai.sentimentAnalysis.trend}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-2">
                  {ai.sentimentAnalysis.confidence ? (ai.sentimentAnalysis.confidence * 100).toFixed(0) + '%' : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-2">
                  {ai.sentimentAnalysis.sentimentSignals ? 
                    Object.values(ai.sentimentAnalysis.sentimentSignals).flat().length : 0}
                </div>
                <div className="text-sm text-gray-600">Active Signals</div>
              </div>
            </div>
          </div>

          {ai.sentimentAnalysis.sentimentSignals && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h5 className="font-medium text-gray-900 mb-4">Sentiment Signals</h5>
              
              <div className="space-y-4">
                {['buy', 'sell', 'neutral'].map(signalType => {
                  const signals = ai.sentimentAnalysis.sentimentSignals[signalType] || [];
                  if (signals.length === 0) return null;
                  
                  return (
                    <div key={signalType}>
                      <h6 className={`text-sm font-medium mb-2 ${
                        signalType === 'buy' ? 'text-green-700' :
                        signalType === 'sell' ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {signalType.toUpperCase()} Signals ({signals.length})
                      </h6>
                      <div className="space-y-2">
                        {signals.map((signal, index) => (
                          <div key={index} className={`p-3 rounded-lg text-sm ${
                            signalType === 'buy' ? 'bg-green-50 text-green-800' :
                            signalType === 'sell' ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-800'
                          }`}>
                            {signal.signal || signal}
                            {signal.strength && (
                              <span className="ml-2 text-xs">
                                ({(signal.strength * 100).toFixed(0)}% strength)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sentiment analysis not available</p>
        </div>
      )}
    </div>
  );

  const renderAllocation = () => (
    <div className="space-y-6">
      {ai.dynamicAllocation ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Dynamic Allocation Recommendations
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Current Allocation</h5>
                <div className="space-y-2">
                  {ai.dynamicAllocation.currentAllocation && Object.entries(ai.dynamicAllocation.currentAllocation).map(([symbol, weight]) => (
                    <div key={symbol} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{symbol}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Recommended Allocation</h5>
                <div className="space-y-2">
                  {ai.dynamicAllocation.recommendedAllocation && Object.entries(ai.dynamicAllocation.recommendedAllocation).map(([symbol, weight]) => (
                    <div key={symbol} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{symbol}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {ai.dynamicAllocation.tradeRecommendations && ai.dynamicAllocation.tradeRecommendations.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h5 className="font-medium text-gray-900 mb-4">Trade Recommendations</h5>
              
              <div className="space-y-3">
                {ai.dynamicAllocation.tradeRecommendations.map((trade, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    trade.action === 'BUY' 
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{trade.symbol}</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        trade.action === 'BUY' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.action}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{trade.reasoning}</p>
                    {trade.percentChange && (
                      <p className="text-xs text-gray-500 mt-1">
                        Allocation change: {trade.percentChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Dynamic allocation analysis not available</p>
        </div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {ai.aiRecommendations ? (
        <>
          {/* Immediate Actions */}
          {ai.aiRecommendations.immediateActions && ai.aiRecommendations.immediateActions.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Immediate Actions
              </h4>
              
              <div className="space-y-3">
                {ai.aiRecommendations.immediateActions.map((action, index) => (
                  <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="font-medium text-gray-900 mb-1">
                      {action.signal || action}
                    </p>
                    {action.strength && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full transition-all duration-300"
                            style={{ width: `${action.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {(action.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Management */}
          {ai.aiRecommendations.riskManagement && ai.aiRecommendations.riskManagement.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Risk Management
              </h4>
              
              <div className="space-y-3">
                {ai.aiRecommendations.riskManagement.map((risk, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-gray-900">
                      {risk.signal || risk}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Insights */}
          {ai.aiRecommendations.performanceInsights && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Performance Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {ai.aiRecommendations.performanceInsights.expectedReturn}
                  </div>
                  <div className="text-sm text-gray-600">Expected Return</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {ai.aiRecommendations.performanceInsights.riskLevel}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {ai.aiRecommendations.performanceInsights.diversificationScore}/10
                  </div>
                  <div className="text-sm text-gray-600">Diversification</div>
                </div>
              </div>
            </div>
          )}

          {/* Short Term Outlook */}
          {ai.aiRecommendations.shortTermOutlook && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Short Term Outlook
              </h4>
              
              <p className="text-gray-700 leading-relaxed">
                {ai.aiRecommendations.shortTermOutlook}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">AI recommendations not available</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverview();
      case 'predictions': return renderPredictions();
      case 'regime': return renderRegime();
      case 'sentiment': return renderSentiment();
      case 'allocation': return renderAllocation();
      case 'recommendations': return renderRecommendations();
      default: return renderOverview();
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-700 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Investment Intelligence</h2>
              <p className="text-blue-100">
                ML predictions • Market regime • Sentiment • Dynamic allocation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            )}
            
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Refresh AI Analysis"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PortfolioAIInsights;