import React, { useState, useEffect, useRef } from 'react';
import ReasoningStream from './ReasoningStream';
import './AnalysisDropdown.css';

// All analysis now handled by real backend pipeline: FMP → Python GPU → Qwen 3

const AnalysisDropdown = ({ 
  isOpen, 
  onClose, 
  context, 
  data, 
  position = { top: 0, left: 0 } 
}) => {
  const [analysisState, setAnalysisState] = useState('idle'); // idle, analyzing, completed, error
  const [streamingThoughts, setStreamingThoughts] = useState([]);
  const [finalInsight, setFinalInsight] = useState('');
  const [error, setError] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const [realTimeReasoning, setRealTimeReasoning] = useState([]);
  
  const dropdownRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-focus and keyboard handling
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [isOpen]);

  // Start analysis when dropdown opens
  useEffect(() => {
    if (isOpen && analysisState === 'idle') {
      startAnalysis();
    }
    
    // Cleanup on close
    if (!isOpen) {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setAnalysisState('idle');
    setStreamingThoughts([]);
    setFinalInsight('');
    setError('');
  };

  const startAnalysis = async () => {
    try {
      setAnalysisState('analyzing');
      setError('');
      setStreamingThoughts([]);
      setFinalInsight('');
      setStreamingContent('🚀 Starting fast intelligent analysis...\n');
      
      // Show progressive reasoning steps as streaming thoughts for user engagement
      setStreamingThoughts([{
        id: Date.now(),
        content: '🔄 Fetching real-time market data...',
        timestamp: new Date()
      }]);
      
      setTimeout(() => setStreamingThoughts(prev => [...prev, {
        id: Date.now() + 1,
        content: '🧮 Running Python technical analysis calculations...',
        timestamp: new Date()
      }]), 1000);
      
      setTimeout(() => setStreamingThoughts(prev => [...prev, {
        id: Date.now() + 2,
        content: '🤖 Loading Qwen AI model for market interpretation...',
        timestamp: new Date()
      }]), 2000);
      
      setTimeout(() => setStreamingThoughts(prev => [...prev, {
        id: Date.now() + 3,
        content: '🎯 Analyzing market conditions and generating insights...',
        timestamp: new Date()
      }]), 3000);

      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      // Skip SSE for intelligent analysis - we'll use direct fetch instead
      
      // Directly trigger the FAST intelligent analysis (no delay needed)
        // Trigger the FAST intelligent analysis pipeline
        // Determine the appropriate endpoint based on context and data
        let endpoint = '/api/intelligent-analysis/market-phase'; // default
        
        if (context === 'sector_rotation') {
          endpoint = '/api/intelligent-analysis/sectors';
        } else if (context === 'macroeconomic') {
          endpoint = '/api/intelligent-analysis/macro';
        } else if (context === 'market_index' && data?.symbol) {
          // Use the specific symbol endpoint
          endpoint = `/api/intelligent-analysis/index/${data.symbol}`;
        } else if (context === 'relationships' || context === 'correlations') {
          // For relationship analysis, use correlations endpoint
          endpoint = '/api/intelligent-analysis/correlations/stocks-bonds';
        }
        
        // Add timeframe and additional context as query parameters
        const timeframe = data?.period || data?.timeframe || '1d';
        const symbol = data?.symbol || '^GSPC';
        
        const params = new URLSearchParams({
          timeframe: timeframe,
          symbol: symbol
        });
        
        // Add specific data indicators as parameters
        if (data) {
          if (data.price) params.append('currentPrice', data.price);
          if (data.change !== undefined) params.append('currentChange', data.change);
          if (data.hasMa50) params.append('hasMa50', 'true');
          if (data.hasMa200) params.append('hasMa200', 'true');
          if (data.hasRsi) params.append('hasRsi', 'true');
          if (data.dataPoints) params.append('dataPoints', data.dataPoints);
        }
        
        endpoint += `?${params.toString()}`;
        
        console.log(`🎯 Calling intelligent analysis: ${endpoint}`);
        console.log(`📊 Data context:`, { symbol, timeframe, context, hasSpecificData: !!data });
        console.log(`🌐 Full URL: ${backendUrl}${endpoint}`);
        console.log(`🔧 Backend URL: ${backendUrl}`);
        
        fetch(`${backendUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(async response => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Analysis API Error:`, {
              status: response.status,
              statusText: response.statusText,
              url: `${backendUrl}${endpoint}`,
              errorBody: errorText
            });
            throw new Error(`Analysis failed with status: ${response.status} - ${errorText.substring(0, 100)}`);
          }
          return response.json();
        })
        .then(result => {
          console.log('✅ Intelligent Analysis received:', result);
          
          // Handle the intelligent analysis response directly (not through stream)
          if (result.success && result.insight) {
            // Replace loading steps with actual AI reasoning
            setStreamingThoughts([{
              id: Date.now() + 4,
              content: '✅ Data collected and analyzed',
              timestamp: new Date()
            }]);
            
            // Add AI reasoning if available
            if (result.reasoning) {
              setTimeout(() => setStreamingThoughts(prev => [...prev, {
                id: Date.now() + 5,
                content: '🤔 AI Analysis: ' + result.reasoning,
                timestamp: new Date()
              }]), 500);
            }
            
            // Set the educational analysis (should explain conditions, not repeat numbers)
            setTimeout(() => {
              setFinalInsight(result.insight);
              setAnalysisState('completed');
            }, 1000);
          } else {
            throw new Error('Invalid response format from intelligent analysis');
          }
        })
        .catch(error => {
          console.error('Failed to start real analysis:', error);
          setError(`Failed to start real analysis pipeline: ${error.message}`);
          setAnalysisState('error');
        });

    } catch (error) {
      console.error('Analysis startup failed:', error);
      setError('Failed to initialize real analysis');
      setAnalysisState('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getAnalysisTitle = () => {
    const titles = {
      market_index: 'Market Index Analysis',
      sector_rotation: 'Sector Rotation Insights',
      technical_indicators: 'Technical Analysis',
      portfolio_analysis: 'Portfolio Assessment',
      macroeconomic: 'Economic Analysis',
      default: 'AI Analysis'
    };
    
    return titles[context] || titles.default;
  };

  const getExpectedDuration = () => {
    const useComprehensiveModel = [
      'portfolio_analysis',
      'investment_strategy', 
      'portfolio_optimization'
    ].includes(context);
    
    // All analysis now uses Qwen 3 8B which takes 10-15 seconds
    return '10-15 seconds';
  };

  if (!isOpen) return null;

  return (
    <div className="analysis-dropdown-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        ref={dropdownRef}
        className={`analysis-dropdown ${analysisState}`}
        style={{
          top: `${position.top + 35}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-label="AI Analysis"
      >
        {/* Header */}
        <div className="analysis-header">
          <div className="analysis-title">
            <span className="ai-icon">🤖</span>
            <h3>{getAnalysisTitle()}</h3>
            {analysisState === 'analyzing' && (
              <div className="duration-estimate">
                Expected: {getExpectedDuration()}
              </div>
            )}
          </div>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close analysis"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="analysis-content">
          {/* Error State */}
          {analysisState === 'error' && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => {
                  cleanup();
                  setTimeout(startAnalysis, 100);
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Analysis in Progress or Completed */}
          {(analysisState === 'analyzing' || analysisState === 'completed') && (
            <>
              {/* Reasoning Section */}
              {showReasoning && (
                <div className="reasoning-section">
                  <div className="reasoning-header">
                    <span className="thinking-icon">🤔</span>
                    <span>AI Reasoning</span>
                    <button
                      className="collapse-button"
                      onClick={() => setShowReasoning(false)}
                      aria-label="Hide reasoning"
                    >
                      −
                    </button>
                  </div>
                  <ReasoningStream 
                    thoughts={streamingThoughts}
                    isActive={analysisState === 'analyzing'}
                  />
                </div>
              )}

              {/* Show reasoning toggle when collapsed */}
              {!showReasoning && streamingThoughts.length > 0 && (
                <button
                  className="show-reasoning-button"
                  onClick={() => setShowReasoning(true)}
                >
                  <span className="thinking-icon">🤔</span>
                  Show AI Reasoning ({streamingThoughts.length} thoughts)
                </button>
              )}

              {/* Final Insight */}
              {finalInsight && (
                <div className="insight-section">
                  <div className="insight-header">
                    <span className="insight-icon">💡</span>
                    <span>Key Insights</span>
                  </div>
                  <div className="insight-content">
                    {finalInsight.split('\n').map((paragraph, index) => (
                      paragraph.trim() && <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {analysisState === 'analyzing' && !finalInsight && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>AI is analyzing your data...</p>
                  {streamingThoughts.length === 0 && (
                    <p className="loading-subtitle">Connecting to analysis engine...</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {analysisState === 'completed' && (
          <div className="analysis-footer">
            <div className="model-credit">
              <span className="model-icon">⚡</span>
              <span>Powered by {context.includes('portfolio') ? 'GPT-OSS' : 'Qwen 3'}</span>
            </div>
            <button
              className="new-analysis-button"
              onClick={() => {
                cleanup();
                setTimeout(startAnalysis, 100);
              }}
            >
              🔄 New Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDropdown;