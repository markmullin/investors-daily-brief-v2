import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, TrendingUp, Clock, ExternalLink, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { aiAnalysisApi } from '../services/api';

const TypewriterText = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else {
      onComplete && onComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-gray-800 text-base">
      {displayedText}
      <span className="animate-pulse text-blue-500 font-bold">|</span>
    </div>
  );
};

const SourceCitation = ({ source, index }) => (
  <div className="group flex items-center gap-3 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
      {index + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
        {source.source}
      </p>
      <p className="text-xs text-gray-600 truncate mt-1 leading-relaxed">{source.title}</p>
      <div className="flex items-center gap-2 mt-2">
        {source.company && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium">
            {source.company}
          </span>
        )}
        {source.sector && (
          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-md font-medium">
            {source.sector}
          </span>
        )}
        {source.category && (
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">
            {source.category}
          </span>
        )}
      </div>
    </div>
    {source.url && source.url !== '#' && (
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
    )}
  </div>
);

const LoadingSteps = ({ currentStep, steps }) => (
  <div className="space-y-4">
    {steps.map((step, index) => (
      <div key={index} className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          index < currentStep 
            ? 'bg-green-100 text-green-600' 
            : index === currentStep 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-400'
        }`}>
          {index < currentStep ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : index === currentStep ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-current" />
          )}
        </div>
        <span className={`text-sm font-medium transition-colors ${
          index <= currentStep ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {step}
        </span>
      </div>
    ))}
  </div>
);

/**
 * ✅ RESTORED: AI Market Analysis with Typewriter Effect and Comprehensive Coverage
 * Enhanced with expanded S&P 500 coverage, sector diversification, and investment context
 */
const AIInsights = () => {
  const [analysis, setAnalysis] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const [metadata, setMetadata] = useState(null);
  
  const stepIntervalRef = useRef(null);

  const loadingSteps = [
    'Connecting to premium financial sources...',
    'Fetching expanded S&P 500 coverage with sector diversification...',
    'Processing comprehensive market analysis with investment context...',
    'Preparing expanded source list and insights for display...'
  ];

  useEffect(() => {
    fetchAIInsights();
    
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStep(0);
      setIsTypewriterComplete(false);
      setSources([]);

      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }

      // Simulate loading steps with more time for comprehensive analysis
      stepIntervalRef.current = setInterval(() => {
        setLoadingStep(prev => {
          const next = prev + 1;
          if (next >= loadingSteps.length) {
            if (stepIntervalRef.current) {
              clearInterval(stepIntervalRef.current);
              stepIntervalRef.current = null;
            }
          }
          return next;
        });
      }, 1200); // Slightly longer for comprehensive analysis

      console.log('🤖 Fetching comprehensive AI market analysis...');
      
      const data = await aiAnalysisApi.getCurrentEventsAnalysis();
      
      console.log('✅ Comprehensive AI analysis received:', data);
      console.log('📰 Sources received:', data.sources?.length || 0);

      if (data.status === 'success' && data.analysis) {
        // Set analysis and sources
        setAnalysis(data.analysis.content || '');
        
        // Set sources
        const sourcesArray = data.sources || [];
        console.log('📊 Setting sources array:', sourcesArray.length);
        setSources(sourcesArray);
        
        setGeneratedAt(data.analysis.generatedAt);
        setMetadata(data.metadata || {});
        
        if (stepIntervalRef.current) {
          clearInterval(stepIntervalRef.current);
          stepIntervalRef.current = null;
        }
        setLoadingStep(loadingSteps.length);
        
      } else {
        throw new Error(data.message || 'Failed to generate comprehensive market analysis');
      }

    } catch (err) {
      console.error('❌ Error fetching AI analysis:', err);
      
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      
      setError(`Market analysis failed: ${err.message}`);
      setAnalysis('');
      setSources([]);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Market Analysis</h2>
              <p className="text-blue-100">Comprehensive S&P 500 coverage • Sector diversification • Investment context</p>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="p-6">
          <LoadingSteps currentStep={loadingStep} steps={loadingSteps} />
          
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyzing expanded S&P 500 coverage with comprehensive investment insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Error Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Market Analysis Unavailable</h2>
              <p className="text-red-100">Error: {error}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <button
            onClick={fetchAIInsights}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // Get enhanced metadata for display
  const enhancedFeatures = metadata?.enhancedFeatures || [];
  const newsBreakdown = metadata?.enhancedNewsBreakdown || {};
  const companyCount = newsBreakdown.companyDiversity?.uniqueCompanies || 0;
  const sectorCount = newsBreakdown.sectorDiversity?.sectorsRepresented || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Premium Header with Gradient - Enhanced with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Market Analysis</h2>
              <p className="text-blue-100">
                Comprehensive coverage • {sources.length} sources • 
                {companyCount > 0 && ` ${companyCount} companies`}
                {sectorCount > 0 && ` • ${sectorCount} sectors`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {generatedAt && (
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(generatedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={fetchAIInsights}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 🎯 RESTORED: Full Analysis with Typewriter Effect */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
          {analysis ? (
            <div className="prose prose-gray max-w-none">
              <TypewriterText 
                text={analysis} 
                speed={15}
                onComplete={() => setIsTypewriterComplete(true)}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-500">Loading comprehensive market analysis...</p>
            </div>
          )}
        </div>

        {/* Enhanced Sources Section - Only show after typewriter completes or immediately if no animation */}
        {sources.length > 0 && isTypewriterComplete && (
          <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Premium Sources</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                {sources.length} Sources
              </span>
              {companyCount > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                  {companyCount} Companies
                </span>
              )}
              {sectorCount > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                  {sectorCount} Sectors
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={source.url && source.url !== '#' ? 'cursor-pointer' : 'cursor-default'}
                >
                  <SourceCitation source={source} index={index} />
                </a>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-100 rounded-xl border border-blue-300">
              <p className="text-sm text-blue-800 font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <strong>Comprehensive Coverage:</strong> 
                {enhancedFeatures.length > 0 ? 
                  ` ${enhancedFeatures.slice(0, 3).join(', ')}.` : 
                  ' Premium sources only with sector diversification and investment context.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Footer with Feature Display */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Comprehensive analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Investment context</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              <span>Sector diversified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Premium sources</span>
            </div>
          </div>
          <button
            onClick={fetchAIInsights}
            className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-medium"
          >
            Refresh Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;