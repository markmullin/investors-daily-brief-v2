/**
 * Intelligent Analysis Display Component
 * Consistent, minimalistic analysis boxes across all dashboard sections
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Brain, Zap } from 'lucide-react';

const IntelligentAnalysis = ({ 
  analysisType, 
  data = {},
  title = "AI Analysis",
  className = "",
  autoLoad = false // Only auto-load for news summary
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false, only load on demand
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [realTimeReasoning, setRealTimeReasoning] = useState([]);
  const [showingReasoning, setShowingReasoning] = useState(false);

  useEffect(() => {
    // Only auto-load if explicitly requested (for news summary only)
    if (autoLoad && !hasRequested) {
      handleAnalysisRequest();
    }
  }, [analysisType, autoLoad]);

  const handleAnalysisRequest = async () => {
    // Prevent multiple concurrent requests
    if (isRequesting) {
      console.log('⏳ Request already in progress, skipping...');
      return;
    }
    
    setIsRequesting(true);
    setLoading(true);
    setError(null);
    setHasRequested(true);
    
    await fetchAnalysis();
  };

  const fetchAnalysis = async () => {
    // DEBUG: Log what data we're sending
    console.log('🔍 IntelligentAnalysis Component Debug:');
    console.log('   Analysis Type:', analysisType);
    console.log('   Data being sent:', data);
    console.log('   Data keys:', Object.keys(data));
    
    try {
      // Use proper intelligent analysis endpoints (FMP → Python → Qwen pipeline)
      let endpoint;
      
      // Map analysisType to correct intelligent analysis endpoint
      if (analysisType === 'marketIndex' && data?.symbol) {
        endpoint = `/api/intelligent-analysis/index/${data.symbol}`;
      } else if (analysisType === 'sectors') {
        endpoint = '/api/intelligent-analysis/sectors';
      } else if (analysisType === 'correlations') {
        const pair = data?.pair || 'stocks-bonds';
        endpoint = `/api/intelligent-analysis/correlations/${pair}`;
      } else if (analysisType === 'macro') {
        endpoint = '/api/intelligent-analysis/macro';
      } else {
        // Default to market phase analysis
        endpoint = '/api/intelligent-analysis/market-phase';
      }

      // Use proper API configuration
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction 
        ? `https://investors-daily-brief.onrender.com${endpoint}`
        : `${endpoint}`; // Use relative path in dev (Vite proxy handles it)

      console.log('🧠 Fetching Intelligent Analysis (FMP → Python → Qwen pipeline)...');
      console.log('📊 Analysis type:', analysisType);
      console.log('🎯 Target endpoint:', apiUrl);
      
      // Show initial reasoning steps with progressive updates
      setShowingReasoning(true);
      const initialSteps = [
        { step: 1, status: 'processing', message: 'Fetching FMP real-time data...', timestamp: Date.now() },
        { step: 2, status: 'processing', message: 'Running Python calculations...', timestamp: Date.now() + 500 },
        { step: 3, status: 'processing', message: 'Loading Qwen 2.5 1.5B model...', timestamp: Date.now() + 1000 },
        { step: 4, status: 'processing', message: 'Generating AI insights...', timestamp: Date.now() + 1500 }
      ];
      
      // Show steps progressively for better UX
      setRealTimeReasoning([initialSteps[0]]);
      setTimeout(() => setRealTimeReasoning(prev => [...prev, initialSteps[1]]), 500);
      setTimeout(() => setRealTimeReasoning(prev => [...prev, initialSteps[2]]), 1000);
      setTimeout(() => setRealTimeReasoning(prev => [...prev, initialSteps[3]]), 1500);
      
      // Create AbortController with reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for intelligent analysis (increased for production)
      
      const response = await fetch(apiUrl, {
        method: 'GET', // Intelligent analysis endpoints use GET
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ Intelligent analysis endpoint not found - stopping requests to prevent loop');
          // For 404 errors, use fallback immediately and don't retry
          setAnalysis({
            insight: getDefaultAnalysis(analysisType),
            fallback: true,
            error: 'Intelligent analysis endpoint not available'
          });
          return;
        }
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Intelligent Analysis received:', result);
      
      // Parse intelligent analysis response format
      if (result.success && result.insight) {
        const analysis = result.insight;
        const calculations = result.calculations || {};
        
        // Validate response
        if (!analysis || analysis.length < 30) {
          console.warn('⚠️  Analysis response too short:', analysis?.length || 0, 'characters');
          throw new Error('Analysis failed - response too short or invalid');
        }
        
        // Show success step
        setRealTimeReasoning(prev => [...prev, {
          step: 5, 
          status: 'completed', 
          message: 'Analysis complete! FMP → Python → Qwen pipeline successful', 
          timestamp: Date.now()
        }]);
        
        // Show analysis after brief delay
        setTimeout(() => {
          setShowingReasoning(false);
          setRealTimeReasoning([]);
          setAnalysis({
            insight: analysis,
            timestamp: result.timestamp || new Date().toISOString(),
            calculations: calculations,
            metadata: {
              source: result.metadata?.gptModel || 'Qwen 2.5 1.5B',
              responseTime: result.metadata?.processingTime || 'N/A',
              pythonVersion: result.metadata?.pythonVersion || '1.0',
              fallbackUsed: result.success === false,
              gptModel: result.metadata?.gptModel || 'qwen2.5:1.5b'
            }
          });
        }, 2000); // Show reasoning for 2 seconds
      } else {
        // Handle error case
        throw new Error(result.error || 'Intelligent analysis system unavailable');
      }
      
    } catch (err) {
      console.error('Real-time analysis error:', err);
      console.error('Full error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      setError(err.message);
      setRealTimeReasoning(prev => [...prev,
        { step: 5, status: 'failed', message: `Error: ${err.message}`, timestamp: Date.now() }
      ]);
      
      // Use intelligent fallback on error
      const fallbackResponses = {
        marketIndex: "Market indices are consolidating at current levels with mixed signals. Technical indicators suggest a period of range-bound trading ahead. Focus on individual stock selection rather than broad market exposure until clearer trends emerge.",
        sectors: "Sector rotation indicates a defensive positioning as investors await clarity on economic direction. Technology and consumer discretionary facing headwinds while utilities and staples show relative strength. Monitor for sustained leadership changes as a signal of broader market shifts.",
        correlations: "Traditional asset correlations are breaking down, suggesting increased market uncertainty. The stocks-bonds relationship is less predictable, requiring more dynamic portfolio management. Consider alternative diversification strategies until correlations normalize.",
        macro: "Macroeconomic data presents a mixed picture with resilient labor markets but softening growth indicators. Fed policy remains data-dependent with markets pricing in a pause. Position defensively while monitoring incoming data for directional clarity.",
        marketPhase: "Current market conditions suggest a transitional phase with competing narratives. Bulls point to resilient earnings while bears cite valuation concerns. Maintain balanced exposure with a bias toward quality until trend clarifies."
      };
      
      const fallbackAnalysis = fallbackResponses[analysisType] || fallbackResponses.marketPhase;
      
      setAnalysis({
        insight: fallbackAnalysis,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: err.message,
        metadata: {
          source: 'intelligent-fallback',
          responseTime: 'instant',
          fallbackUsed: true,
          gptModel: 'error-fallback'
        }
      });
      
      // Clear real-time reasoning after showing error
      setTimeout(() => {
        setRealTimeReasoning([]);
      }, 3000);
    } finally {
      setLoading(false);
      setIsRequesting(false); // Always reset requesting state
    }
  };

  const getDefaultAnalysis = (type) => {
    const defaults = {
      marketPhase: "Market indicators are showing mixed signals. Current volatility levels suggest cautious positioning while monitoring key support levels for directional confirmation. Focus on quality names with strong fundamentals during this transitional period.",
      marketIndex: "Index performance reflects current market sentiment and sector rotation. Volume patterns indicate institutional participation at these levels. Watch for continuation signals at key technical resistance points.",
      sectors: "Sector rotation patterns align with current economic conditions. Technology and consumer discretionary leading indicates risk-on sentiment, while defensive sectors lag. Monitor for sustained leadership changes as a signal of regime shift.",
      correlations: "Asset correlations remain within historical ranges, supporting normal portfolio diversification benefits. Any significant divergence from these levels could signal a market regime change requiring portfolio adjustments.",
      macro: "Interest rate environment reflects Federal Reserve's balanced approach to inflation control. Current yield curve dynamics suggest moderate growth expectations. Position portfolios considering duration risk and rate sensitivity."
    };
    
    return defaults[type] || defaults.marketPhase;
  };

  const getAnalysisIcon = () => {
    if (loading) return <Brain className="w-4 h-4 animate-pulse" />;
    if (error || analysis?.fallback) return <AlertCircle className="w-4 h-4" />;
    if (analysis) return <Zap className="w-4 h-4" />;
    return <Brain className="w-4 h-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={handleAnalysisRequest} title="Click to generate AI analysis" />;
  };

  const getAnalysisColor = () => {
    if (error || analysis?.fallback) return 'text-yellow-500';
    if (analysis?.metadata?.gptModel === 'gpt-oss-20b') return 'text-blue-500';
    return 'text-green-500';
  };

  // Inline styles - white/chrome theme to match dashboard
  const containerStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '16px 0',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#1f2937', // Dark gray/black for header text
  };

  const contentStyle = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151', // Dark gray for readability
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const loadingContentStyle = {
    ...contentStyle,
    opacity: '0.5',
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '11px',
    color: '#9ca3af',
  };

  const sourceBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#3b82f6',
  };

  const timestampStyle = {
    fontSize: '10px',
    color: '#9ca3af',
  };

  const skeletonStyle = {
    height: '16px',
    background: 'linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s infinite',
    borderRadius: '4px',
    marginBottom: '8px',
  };

  return (
    <div className={className} style={containerStyle}>
      <style>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        .analysis-container-hover:hover {
          border-color: rgba(59, 130, 246, 0.3) !important;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
        }
        
        .shimmer-line {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.5) 50%, 
            transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* Shimmer effect line */}
      <div className="shimmer-line"></div>
      
      <div className={getAnalysisColor()} style={headerStyle}>
        {getAnalysisIcon()}
        <span>{title}</span>
      </div>
      
      <div style={loading ? loadingContentStyle : contentStyle}>
        {loading ? (
          <div>
            <div style={{...contentStyle, marginBottom: '12px'}}>
              <strong>🧠 AI Analysis in Progress</strong>
            </div>
            
            {/* Enhanced Chain of Thought Reasoning Display */}
            {realTimeReasoning.length > 0 && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                borderLeft: '3px solid #3b82f6',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: '#3b82f6',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Chain of Thought Processing
                </div>
                {realTimeReasoning.map((step, index) => {
              // Special formatting for MODEL REASONING step
              if (step.status === 'thinking' && step.message.includes('MODEL REASONING:')) {
                const reasoningText = step.message.replace('🧠 MODEL REASONING:', '').trim();
                
                return (
                  <div key={index} style={{
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#8b5cf6'
                    }}>
                      <span style={{fontSize: '16px'}}>🧠</span>
                      <span>Chain of Thought Reasoning:</span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#4b5563',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace'
                    }}>
                      {reasoningText.split('.').map((sentence, i) => {
                        const trimmed = sentence.trim();
                        if (!trimmed) return null;
                        return (
                          <div key={i} style={{ marginBottom: '6px' }}>
                            • {trimmed}.
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              // Regular reasoning step display
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    backgroundColor: 
                      step.status === 'completed' || step.status === 'success' ? '#10b981' :
                      step.status === 'failed' || step.status === 'error' ? '#ef4444' :
                      step.status === 'processing' || step.status === 'fetching' ? '#3b82f6' :
                      step.status === 'thinking' ? '#8b5cf6' :
                      '#6b7280',
                    color: 'white'
                  }}>
                    {step.status === 'completed' || step.status === 'success' ? '✓' :
                     step.status === 'failed' || step.status === 'error' ? '✗' :
                     step.status === 'processing' || step.status === 'fetching' ? '⟳' :
                     step.status === 'thinking' ? '🧠' : step.step}
                  </div>
                  <div style={{
                    flex: 1,
                    color: 
                      step.status === 'completed' || step.status === 'success' ? '#10b981' :
                      step.status === 'failed' || step.status === 'error' ? '#ef4444' :
                      step.status === 'processing' || step.status === 'fetching' ? '#3b82f6' :
                      step.status === 'thinking' ? '#8b5cf6' :
                      '#6b7280'
                  }}>
                    {step.message}
                  </div>
                </div>
              );
            })}
              </div>
            )}
            
            {/* Default loading state if no reasoning yet */}
            {(realTimeReasoning.length === 0 && (!analysis?.reasoning || analysis.reasoning.length === 0)) && (
              <div>
                <div style={{...contentStyle, marginBottom: '8px', fontStyle: 'italic'}}>
                  📊 Initializing real-time market analysis...
                  <br />
                  🔥 Connecting to RTX 5060 GPU + FMP API...
                  <br />
                  <small style={{color: '#9ca3af'}}>Chain of thought reasoning will appear here</small>
                </div>
                <div style={skeletonStyle}></div>
                <div style={{...skeletonStyle, width: '85%'}}></div>
                <div style={{...skeletonStyle, width: '70%'}}></div>
              </div>
            )}
          </div>
        ) : !hasRequested ? (
          <div style={{
            ...contentStyle, 
            textAlign: 'center', 
            color: '#9ca3af',
            fontStyle: 'italic',
            padding: '20px 0'
          }}>
            <Brain className="w-8 h-8 mx-auto mb-2 cursor-pointer hover:text-blue-500 transition-colors" 
                   onClick={handleAnalysisRequest} />
            <div>Click the brain icon above to generate AI analysis</div>
            <small>Powered by GPT-OSS-20B running on your RTX 5060</small>
          </div>
        ) : (
          analysis?.insight || getDefaultAnalysis(analysisType)
        )}
      </div>
      
      {!loading && analysis && (
        <div style={footerStyle}>
          <div style={sourceBadgeStyle}>
            {analysis.fallback ? (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>Fallback Mode</span>
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" />
                <span>{analysis.metadata?.gptModel || 'Enhanced AI'}</span>
              </>
            )}
          </div>
          <span style={timestampStyle}>
            Updated: {new Date(analysis.timestamp || Date.now()).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default IntelligentAnalysis;