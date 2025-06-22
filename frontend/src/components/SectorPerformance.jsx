import React, { useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Loader2 } from 'lucide-react';
import { aiAnalysisApi } from '../services/api';

const API_BASE_URL = 'http://localhost:5000/api/market';

// TypewriterText component for AI analysis
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

const SectorCard = ({ symbol, data }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const changeColor = data.price.changePercent >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{symbol}</h3>
        <div className={changeColor}>
          {data.price.changePercent >= 0 ? '+' : ''}
          {data.price.changePercent.toFixed(2)}%
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Real-time Data</div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Price</span>
          <span className="font-medium">${data.price.current.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Volume</span>
          <span className="font-medium">{data.price.volume.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// AI Analysis Component with TypewriterText
const AIAnalysisSection = () => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    setIsTypewriterComplete(false);
    
    try {
      const analysis = await aiAnalysisApi.getSectorAnalysis();
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('Error fetching AI sector analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, []);

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'ai':
        return 'bg-blue-100 text-blue-800';
      case 'enhanced-algorithmic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Sector Analysis</h3>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Analyzing sector performance patterns...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-lg p-6 border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Analysis Unavailable</h3>
        </div>
        
        <div className="space-y-3">
          <p className="text-red-700">
            AI sector analysis is temporarily unavailable. Please try refreshing the page.
          </p>
          <button 
            onClick={fetchAiAnalysis}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!aiAnalysis) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Sector Analysis</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(aiAnalysis.source)}`}>
            {aiAnalysis.source === 'ai' ? 'AI Generated' : 
             aiAnalysis.source === 'enhanced-algorithmic' ? 'Enhanced Analysis' : 
             'Algorithmic'}
          </span>
        </div>
      </div>

      {/* Market Cycle and Key Info */}
      {aiAnalysis.marketCycle && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Market Cycle</span>
            <div className="flex items-center gap-1">
              {aiAnalysis.marketCycle === 'Bull Market' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="font-semibold text-gray-800">{aiAnalysis.marketCycle}</span>
            </div>
          </div>
          
          {/* Leading and Lagging Sectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {aiAnalysis.leadingSectors && aiAnalysis.leadingSectors.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <h5 className="font-medium text-green-800 mb-2">Leading Sectors</h5>
                <div className="flex flex-wrap gap-1">
                  {aiAnalysis.leadingSectors.map((sector, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {aiAnalysis.laggingSectors && aiAnalysis.laggingSectors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <h5 className="font-medium text-red-800 mb-2">Lagging Sectors</h5>
                <div className="flex flex-wrap gap-1">
                  {aiAnalysis.laggingSectors.map((sector, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Text with TypewriterText */}
      <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
        <div className="prose prose-sm max-w-none text-gray-700">
          {aiAnalysis.analysis ? (
            <TypewriterText 
              text={aiAnalysis.analysis}
              speed={25}
              onComplete={() => setIsTypewriterComplete(true)}
            />
          ) : (
            'AI sector analysis unavailable'
          )}
        </div>
      </div>

      {/* Key Insights - Show after typewriter completes */}
      {isTypewriterComplete && aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-blue-100 animate-fade-in">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Key Actionable Insights
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated timestamp - Show after typewriter completes */}
      {isTypewriterComplete && aiAnalysis.generatedAt && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Generated at {new Date(aiAnalysis.generatedAt).toLocaleString()}</span>
          </div>
          <button
            onClick={fetchAiAnalysis}
            className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};

const SectorPerformance = () => {
  const [sectorsData, setSectorsData] = useState({});
  const [error, setError] = useState(null);

  const sectors = [
    'XLF',  // Financials
    'XLK',  // Technology
    'XLE',  // Energy
    'XLV',  // Healthcare
    'XLI',  // Industrials
    'XLC',  // Communication Services
    'XLY',  // Consumer Discretionary
    'XLP',  // Consumer Staples
    'XLRE', // Real Estate
    'XLU'   // Utilities
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = sectors.map(async (symbol) => {
          const response = await fetch(`${API_BASE_URL}/stock/${symbol}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}`);
          }
          const data = await response.json();
          return [symbol, data];
        });

        const results = await Promise.all(promises);
        const newData = Object.fromEntries(results);
        setSectorsData(newData);
        setError(null);
      } catch (err) {
        console.error('Error fetching sectors:', err);
        setError('Error loading sector data');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sector Performance</h2>
      
      {/* AI Analysis Section with TypewriterText - Now matches KeyRelationships */}
      <AIAnalysisSection />
      
      {/* Traditional Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sectors.map((symbol) => (
          <SectorCard
            key={symbol}
            symbol={symbol}
            data={sectorsData[symbol]}
          />
        ))}
      </div>
      
      {error && (
        <div className="text-red-500 mt-4">{error}</div>
      )}
    </div>
  );
};

export default SectorPerformance;