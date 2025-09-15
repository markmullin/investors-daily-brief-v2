/**
 * Intelligent Analysis Display Component with request queuing
 * Staggers requests to avoid rate limiting
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Brain, Zap } from 'lucide-react';

// Request queue to stagger API calls
const requestQueue = {
  queue: [],
  processing: false,
  delay: 2000, // 2 seconds between requests
  
  add(fn) {
    this.queue.push(fn);
    if (!this.processing) {
      this.process();
    }
  },
  
  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const fn = this.queue.shift();
    await fn();
    
    // Wait before next request
    setTimeout(() => this.process(), this.delay);
  }
};

const IntelligentAnalysis = ({ 
  analysisType, 
  data = {},
  title = "AI Analysis",
  className = "" 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, [analysisType]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    // Queue the request instead of firing immediately
    requestQueue.add(async () => {
      try {
        // Use the ACTUAL working GPT-OSS endpoint
        const endpoint = '/api/gpt-oss/market-analysis';
        
        // Get market context based on analysis type
        let requestData = {
          sp500Price: 6481.41,
          sp500Change: 1.5,
          nasdaqPrice: 20000,
          nasdaqChange: 2.0,
          vix: 15,
          treasury10y: 4.0,
          marketPhase: 'NEUTRAL',
          analysisType: analysisType // Include type for context
        };

        console.log(`🔄 Queued analysis request for: ${analysisType}`);
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ ${analysisType} analysis received`);
        
        // GPT-OSS returns data in a different format
        if (result.success && result.data && result.data.analysis) {
          setAnalysis({
            insight: result.data.analysis,
            timestamp: result.timestamp || new Date().toISOString(),
            metadata: {
              gptModel: 'gpt-oss-20b-gpu',
              gpu: 'RTX 5060'
            }
          });
        } else {
          // Fallback format
          setAnalysis(result);
        }
        
      } catch (err) {
        console.error(`Analysis fetch error for ${analysisType}:`, err);
        setError(err.message);
        // Set fallback analysis
        setAnalysis({
          insight: getDefaultAnalysis(analysisType),
          fallback: true,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const getDefaultAnalysis = (type) => {
    const defaults = {
      marketPhase: "Market indicators suggest balanced positioning with careful attention to sector rotation and volatility management.",
      marketIndex: "Index performance reflects current market sentiment and sector rotation patterns. Monitor volume patterns for confirmation.",
      sectors: "Sector rotation patterns indicate risk appetite levels. Technology and consumer discretionary showing relative strength.",
      correlations: "Asset correlations remain within historical ranges, supporting traditional portfolio diversification strategies.",
      macro: "Macroeconomic indicators suggest measured Fed policy approach. Monitor yield curve dynamics for directional signals."
    };
    return defaults[type] || defaults.marketPhase;
  };

  const getAnalysisIcon = () => {
    switch (analysisType) {
      case 'marketPhase':
        return <TrendingUp className="w-4 h-4" />;
      case 'marketIndex':
      case 'sectors':
        return <Brain className="w-4 h-4" />;
      case 'correlations':
        return <Zap className="w-4 h-4" />;
      case 'macro':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getAnalysisColor = () => {
    if (error) return 'text-red-500';
    if (loading) return 'text-gray-500';
    if (analysis?.fallback) return 'text-yellow-500';
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
    color: '#f97316', // Orange to match dashboard headers
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
        {loading && <span style={{fontSize: '10px', marginLeft: 'auto'}}>Queued...</span>}
      </div>
      
      <div style={loading ? loadingContentStyle : contentStyle}>
        {loading ? (
          <div>
            <div style={skeletonStyle}></div>
            <div style={{...skeletonStyle, width: '85%'}}></div>
            <div style={{...skeletonStyle, width: '70%'}}></div>
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