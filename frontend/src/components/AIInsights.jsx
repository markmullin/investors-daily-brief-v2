import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, TrendingUp, Clock, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { aiAnalysisApi } from '../services/api'; // Use our fixed API service

const TypewriterText = ({ text, speed = 30, onComplete }) => {
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
    <div className="whitespace-pre-wrap leading-relaxed">
      {displayedText}
      <span className="animate-pulse text-blue-500">|</span>
    </div>
  );
};

const SourceCitation = ({ source, index }) => (
  <div className="group flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
      {index + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{source.source}</p>
      <p className="text-xs text-gray-500 truncate">{source.title}</p>
    </div>
    {source.url !== '#' && (
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    )}
  </div>
);

const LoadingSteps = ({ currentStep, steps }) => (
  <div className="space-y-3">
    {steps.map((step, index) => (
      <div key={index} className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
          index < currentStep 
            ? 'bg-green-100 text-green-600' 
            : index === currentStep 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-400'
        }`}>
          {index < currentStep ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : index === currentStep ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-current" />
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

const AIInsights = () => {
  const [analysis, setAnalysis] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  
  // **FIXED**: Use useRef for stepInterval to prevent scope issues
  const stepIntervalRef = useRef(null);

  const loadingSteps = [
    'Connecting to Bloomberg, CNBC, Barron\'s...',
    'Analyzing Fed decisions & geopolitical events...',
    'Processing earnings reports & market movers...',
    'Generating professional investment insights...'
  ];

  useEffect(() => {
    fetchAIInsights();
    
    // **FIXED**: Cleanup on unmount
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

      // **FIXED**: Clear any existing interval before starting new one
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }

      // Simulate loading steps for better UX showing real progress
      stepIntervalRef.current = setInterval(() => {
        setLoadingStep(prev => {
          const next = prev + 1;
          if (next >= loadingSteps.length) {
            // **FIXED**: Clear interval when steps complete
            if (stepIntervalRef.current) {
              clearInterval(stepIntervalRef.current);
              stepIntervalRef.current = null;
            }
          }
          return next;
        });
      }, 1200);

      console.log('🚀 Fetching REAL current events from premium financial sources...');
      
      // FIXED: Use our enhanced API service instead of direct fetch
      const data = await aiAnalysisApi.getCurrentEventsAnalysis();
      
      console.log('✅ REAL premium source analysis received:', data);

      if (data.status === 'success' && data.analysis) {
        setAnalysis(data.analysis.content);
        setSources(data.sources || []);
        setGeneratedAt(data.analysis.generatedAt);
        
        // **FIXED**: Clear interval on success
        if (stepIntervalRef.current) {
          clearInterval(stepIntervalRef.current);
          stepIntervalRef.current = null;
        }
        setLoadingStep(loadingSteps.length); // Complete all steps
      } else {
        throw new Error(data.message || 'Failed to generate real current events analysis from premium sources');
      }

    } catch (err) {
      console.error('❌ Error fetching REAL premium source analysis:', err);
      
      // **FIXED**: Clear interval on error
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      
      setError(`Failed to connect to premium news sources: ${err.message}`);
      setAnalysis('');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Market Brief</h2>
            <p className="text-sm text-gray-600">Real news from Bloomberg • CNBC • Barron's • WSJ</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <LoadingSteps currentStep={loadingStep} steps={loadingSteps} />
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Gathering breaking news from premium financial sources: Fed decisions, earnings reports, geopolitical events, market movers...
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
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Premium News Analysis Failed</h2>
            <p className="text-sm text-gray-600">Error: {error}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <button
            onClick={fetchAIInsights}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Retry Premium Source Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Daily Market Brief</h2>
              <p className="text-blue-100">Current events analysis • Financial advisor perspective</p>
            </div>
          </div>
          
          {generatedAt && (
            <div className="flex items-center gap-2 text-blue-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {new Date(generatedAt).toLocaleTimeString()} PM
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8">
        {/* Main Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="prose prose-gray max-w-none">
            <TypewriterText 
              text={analysis} 
              speed={20}
              onComplete={() => setIsTypewriterComplete(true)}
            />
          </div>
        </div>

        {/* Premium Sources Section */}
        {isTypewriterComplete && sources.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Premium Financial Sources</h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {sources.length} Sources
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.slice(0, 8).map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={source.url !== '#' ? 'cursor-pointer' : 'cursor-default'}
                >
                  <SourceCitation source={source} index={index} />
                </a>
              ))}
            </div>
            
            {sources.length > 8 && (
              <p className="text-sm text-gray-500 text-center mt-4">
                and {sources.length - 8} more premium financial news sources...
              </p>
            )}
          </div>
        )}

        {/* Footer with Quality Indicators */}
        {isTypewriterComplete && (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-500 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live from Bloomberg, CNBC, Barron's</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Premium sources only</span>
              </div>
            </div>
            <button
              onClick={fetchAIInsights}
              className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-medium"
            >
              Refresh Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
