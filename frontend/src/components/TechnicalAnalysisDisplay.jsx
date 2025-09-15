/**
 * TECHNICAL ANALYSIS DISPLAY COMPONENT - Phase 3 Implementation
 * 
 * Main analysis display component that shows intelligent technical analysis below charts
 * Integrates with Python analysis engine and Mistral AI explanations
 * FIXED: Always shows analysis expanded by default, removed "More" button
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, Activity,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Info,
  Target, Shield, BarChart3, Brain
} from 'lucide-react';
import AnalysisSection from './AnalysisSection';
import SignalIndicator from './SignalIndicator';

const TechnicalAnalysisDisplay = ({ 
  symbol, 
  timeframe = '1d', 
  priceData, 
  expandable = false, // CHANGED: Default to false (always expanded)
  educationalLevel = 'high_school',
  className = ''
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // CHANGED: Default to true (always expanded)
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Generate cache key for analysis requests
  const cacheKey = useMemo(() => {
    if (!priceData || priceData.length === 0) return null;
    const firstPrice = priceData[0]?.price || 0;
    const lastPrice = priceData[priceData.length - 1]?.price || 0;
    return `${symbol}_${timeframe}_${firstPrice}_${lastPrice}_${priceData.length}`;
  }, [symbol, timeframe, priceData]);

  // Fetch technical analysis from backend
  const fetchAnalysis = async (analysisType = 'complete') => { // CHANGED: Default to complete analysis
    if (!symbol || !priceData || priceData.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 [TECH_DISPLAY] Fetching ${analysisType} analysis for ${symbol} (${timeframe})`);

      const params = new URLSearchParams({
        timeframe,
        educationalLevel,
        analysisType
      });

      const response = await fetch(`/api/market/technical-analysis/${symbol}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data);
      setLastUpdate(new Date());
      
      console.log(`✅ [TECH_DISPLAY] ${analysisType} analysis loaded for ${symbol}`);

    } catch (err) {
      console.error(`❌ [TECH_DISPLAY] Analysis error for ${symbol}:`, err.message);
      setError(err.message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch complete analysis when component mounts or key data changes
  useEffect(() => {
    if (cacheKey) {
      fetchAnalysis('complete'); // CHANGED: Always fetch complete analysis
    }
  }, [cacheKey]);

  // Extract display data
  const displaySummary = analysis?.display_summary || {};
  const aiExplanation = analysis?.ai_explanation || {};
  const technicalAnalysis = analysis?.technical_analysis || {};

  // Get recommendation styling
  const getRecommendationStyle = (recommendation) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return 'text-green-600 bg-green-50';
      case 'SELL':
        return 'text-red-600 bg-red-50';
      case 'HOLD':
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  // Get confidence indicator
  const getConfidenceIndicator = (confidence) => {
    if (confidence === 'high') return { color: 'text-green-500', bars: 3 };
    if (confidence === 'medium') return { color: 'text-yellow-500', bars: 2 };
    return { color: 'text-red-500', bars: 1 };
  };

  // Loading state
  if (isLoading && !analysis) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Analyzing {symbol}...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className={`bg-red-50 rounded-lg border border-red-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">Analysis unavailable: {error}</span>
        </div>
      </div>
    );
  }

  // No analysis data
  if (!analysis) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Technical analysis will appear here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Compact Summary View (Always Visible) */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Headline */}
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-800">
                Technical Analysis
              </h4>
              <span className="text-xs text-gray-500">
                ({displaySummary.timeframe_label || timeframe})
              </span>
            </div>

            {/* Main insight */}
            <p className="text-sm text-gray-700 mb-3">
              {displaySummary.headline || `Technical analysis for ${symbol}`}
            </p>

            {/* Key metrics row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Recommendation */}
                <SignalIndicator 
                  recommendation={displaySummary.recommendation || 'HOLD'}
                  confidence={displaySummary.confidence || 'medium'}
                  size="small"
                />

                {/* Key insights */}
                {displaySummary.key_insights && displaySummary.key_insights.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {displaySummary.key_insights.slice(0, 2).map((insight, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expand button - ONLY show if explicitly expandable */}
              {expandable && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                  disabled={isLoading}
                >
                  <span>{isExpanded ? 'Less' : 'More'}</span>
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis View - ALWAYS VISIBLE now (or when expanded if expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading detailed analysis...</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* AI Explanation */}
              {aiExplanation.explanation && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <h5 className="text-sm font-semibold text-gray-800">
                      AI Analysis
                    </h5>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {aiExplanation.explanation}
                  </p>
                  
                  {/* Key concepts tags */}
                  {aiExplanation.key_concepts && aiExplanation.key_concepts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aiExplanation.key_concepts.map((concept, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Technical Analysis Sections */}
              {technicalAnalysis && Object.keys(technicalAnalysis).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trend Analysis */}
                  {technicalAnalysis.trend_analysis && (
                    <AnalysisSection
                      title="Trend Analysis"
                      icon={TrendingUp}
                      data={technicalAnalysis.trend_analysis}
                      type="trend"
                    />
                  )}

                  {/* Momentum Analysis */}
                  {technicalAnalysis.momentum_analysis && (
                    <AnalysisSection
                      title="Momentum"
                      icon={Activity}
                      data={technicalAnalysis.momentum_analysis}
                      type="momentum"
                    />
                  )}

                  {/* Signals */}
                  {technicalAnalysis.signals && (
                    <AnalysisSection
                      title="Trading Signals"
                      icon={Target}
                      data={technicalAnalysis.signals}
                      type="signals"
                    />
                  )}

                  {/* Risk Assessment */}
                  {technicalAnalysis.risk_assessment && (
                    <AnalysisSection
                      title="Risk Assessment"
                      icon={Shield}
                      data={technicalAnalysis.risk_assessment}
                      type="risk"
                    />
                  )}
                </div>
              )}

              {/* Analysis Metadata */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span>
                    Analysis updated: {lastUpdate?.toLocaleTimeString() || 'Unknown'}
                  </span>
                  <span>
                    Data points: {priceData?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysisDisplay;