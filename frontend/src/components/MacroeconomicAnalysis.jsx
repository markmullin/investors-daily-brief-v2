import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Area, ComposedChart 
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Info, Brain, Loader2 } from 'lucide-react';
import { macroeconomicApi, aiAnalysisApi } from '../services/api';
import { useViewMode } from '../context/ViewModeContext';
import InfoTooltip from './InfoTooltip';

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
      <span className="animate-pulse text-emerald-500">|</span>
    </div>
  );
};

// ENHANCED: AI Macro Analysis Section (REPLACES Investment Implications)
const AIMacroAnalysisSection = () => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    setIsTypewriterComplete(false);
    
    try {
      console.log('🤖 Fetching enhanced macro analysis with TypewriterText...');
      const analysis = await aiAnalysisApi.getMacroAnalysis();
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('Error fetching enhanced macro analysis:', err);
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
        return 'bg-emerald-100 text-emerald-800';
      case 'enhanced-algorithmic':
      case 'enhanced-real-data':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    if (riskLevel <= 3) return 'text-green-600 bg-green-50';
    if (riskLevel <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLevelText = (riskLevel) => {
    if (riskLevel <= 3) return 'Low Risk';
    if (riskLevel <= 6) return 'Moderate Risk';
    return 'High Risk';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg p-6 border border-emerald-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Brain className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Enhanced Macro Analysis & Investment Implications</h3>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-emerald-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Analyzing macroeconomic environment and investment implications...</span>
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
          <h3 className="text-lg font-semibold text-gray-800">Macro Analysis Unavailable</h3>
        </div>
        
        <div className="space-y-3">
          <p className="text-red-700">
            Enhanced macro analysis is temporarily unavailable. Please try refreshing the page.
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
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg p-6 border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Brain className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Enhanced Macro Analysis & Investment Implications</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(aiAnalysis.source)}`}>
            {aiAnalysis.source === 'ai' ? 'AI Generated' : 
             aiAnalysis.source === 'enhanced-real-data' ? 'Enhanced Analysis' : 
             'Algorithmic'}
          </span>
        </div>
      </div>

      {/* Risk Level and Market Regime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Risk Level</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(aiAnalysis.riskLevel)}`}>
              {aiAnalysis.riskLevel}/10 - {getRiskLevelText(aiAnalysis.riskLevel)}
            </div>
          </div>
          
          {/* Risk level bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                aiAnalysis.riskLevel <= 3 ? 'bg-green-500' : 
                aiAnalysis.riskLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(aiAnalysis.riskLevel / 10) * 100}%` }}
            />
          </div>
        </div>
        
        {aiAnalysis.marketRegime && (
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Market Regime</span>
              <div className="flex items-center gap-1">
                {aiAnalysis.marketRegime.toLowerCase().includes('risk-on') ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : aiAnalysis.marketRegime.toLowerCase().includes('risk-off') ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600" />
                )}
                <span className="font-semibold text-gray-800">{aiAnalysis.marketRegime}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Risk Signals */}
      {aiAnalysis.riskSignals && aiAnalysis.riskSignals.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-100">
          <h5 className="font-medium text-gray-800 mb-3">Risk Signals</h5>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.riskSignals.map((signal, index) => (
              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced AI Analysis with TypewriterText (REPLACES static Investment Implications) */}
      <div className="bg-white rounded-lg p-6 border border-emerald-100 mb-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Macroeconomic Analysis & Investment Strategy
        </h4>
        <div className="prose prose-sm max-w-none text-gray-700">
          {aiAnalysis.analysis ? (
            <TypewriterText 
              text={aiAnalysis.analysis}
              speed={20}
              onComplete={() => setIsTypewriterComplete(true)}
            />
          ) : (
            'Enhanced macro analysis unavailable'
          )}
        </div>
      </div>

      {/* Strategic Insights - Show after typewriter completes */}
      {isTypewriterComplete && aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
        <div className="bg-white rounded-lg p-4 mt-4 border border-emerald-100 animate-fade-in">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Strategic Investment Insights
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated timestamp */}
      {isTypewriterComplete && aiAnalysis.generatedAt && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Generated at {new Date(aiAnalysis.generatedAt).toLocaleString()}</span>
          </div>
          <button
            onClick={fetchAiAnalysis}
            className="px-3 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};

const MacroeconomicAnalysis = () => {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2y');
  const { viewMode } = useViewMode();

  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await macroeconomicApi.getAll();
        console.log('Macro data received:', data);
        
        if (data) {
          setMacroData(data);
        } else {
          setError('No macroeconomic data available');
        }
      } catch (err) {
        console.error('Error fetching macro data:', err);
        setError('Failed to load macroeconomic data');
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
    
    // Refresh every hour
    const interval = setInterval(fetchMacroData, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* AI Analysis Loading */}
        <AIMacroAnalysisSection />
        
        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !macroData) {
    return (
      <div className="space-y-6">
        {/* AI Analysis (still works even if charts fail) */}
        <AIMacroAnalysisSection />
        
        {/* Error for charts */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error || 'Failed to load macroeconomic data'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4 mt-1">
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Process data for charts (same as before)
  const processInterestRateData = () => {
    if (!macroData.interestRates || !macroData.interestRates.data) return [];
    
    const { data } = macroData.interestRates;
    const twoYear = data.DGS2 || [];
    const tenYear = data.DGS10 || [];
    const thirtyYear = data.DGS30 || [];
    
    const allDates = new Set([
      ...twoYear.map(d => d.date),
      ...tenYear.map(d => d.date),
      ...thirtyYear.map(d => d.date)
    ]);
    
    return Array.from(allDates).sort().map(date => {
      const twoYearPoint = twoYear.find(d => d.date === date);
      const tenYearPoint = tenYear.find(d => d.date === date);
      const thirtyYearPoint = thirtyYear.find(d => d.date === date);
      
      return {
        date,
        twoYear: twoYearPoint?.value || null,
        tenYear: tenYearPoint?.value || null,
        thirtyYear: thirtyYearPoint?.value || null,
        spread: (tenYearPoint?.value && twoYearPoint?.value) 
          ? tenYearPoint.value - twoYearPoint.value 
          : null
      };
    }).filter(d => d.twoYear !== null || d.tenYear !== null);
  };

  const processGrowthInflationData = () => {
    if (!macroData.growthInflation || !macroData.growthInflation.data) return [];
    
    const { data } = macroData.growthInflation;
    const gdp = data.A191RL1Q225SBEA || [];
    const cpi = data.CPI_YOY || [];
    const pce = data.PCE_YOY || [];
    
    const allDates = new Set([
      ...gdp.map(d => d.date),
      ...cpi.map(d => d.date),
      ...pce.map(d => d.date)
    ]);
    
    return Array.from(allDates).sort().map(date => {
      const gdpPoint = gdp.find(d => d.date === date);
      const cpiPoint = cpi.find(d => d.date === date);
      const pcePoint = pce.find(d => d.date === date);
      
      return {
        date,
        gdpGrowth: gdpPoint?.value || null,
        cpi: cpiPoint?.value || null,
        pce: pcePoint?.value || null
      };
    }).filter(d => d.gdpGrowth !== null || d.cpi !== null || d.pce !== null);
  };

  const processLaborConsumerData = () => {
    if (!macroData.laborConsumer || !macroData.laborConsumer.data) return [];
    
    const { data } = macroData.laborConsumer;
    const unemployment = data.UNRATE || [];
    const retail = data.RETAIL_YOY || [];
    
    const allDates = new Set([
      ...unemployment.map(d => d.date),
      ...retail.map(d => d.date)
    ]);
    
    return Array.from(allDates).sort().map(date => {
      const unemploymentPoint = unemployment.find(d => d.date === date);
      const retailPoint = retail.find(d => d.date === date);
      
      return {
        date,
        unemployment: unemploymentPoint?.value || null,
        retailSales: retailPoint?.value || null
      };
    }).filter(d => d.unemployment !== null || d.retailSales !== null);
  };

  const interestRateData = processInterestRateData();
  const growthInflationData = processGrowthInflationData();
  const laborConsumerData = processLaborConsumerData();

  // Get latest values for display
  const getLatestValues = () => {
    const latest = macroData.interestRates?.latest || {};
    const latestGrowth = macroData.growthInflation?.latest || {};
    const latestLabor = macroData.laborConsumer?.latest || {};
    
    return {
      twoYear: latest.twoYear?.value || 'N/A',
      tenYear: latest.tenYear?.value || 'N/A',
      thirtyYear: latest.thirtyYear?.value || 'N/A',
      gdpGrowth: latestGrowth.gdpGrowth?.value || 'N/A',
      cpi: latestGrowth.cpi?.value || 'N/A',
      pce: latestGrowth.pce?.value || 'N/A',
      unemployment: latestLabor.unemployment?.value || 'N/A',
      retailSales: latestLabor.retailSales?.value || 'N/A'
    };
  };

  const latestValues = getLatestValues();

  return (
    <div className="space-y-6">
      {/* ENHANCED: AI Macro Analysis Section - REPLACES Investment Implications */}
      <AIMacroAnalysisSection />

      {/* Interest Rates Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Interest Rates
              <InfoTooltip
                basicContent="US Treasury yields across different maturities showing the cost of borrowing."
                advancedContent="The yield curve shape indicates economic expectations. An inverted curve (2Y > 10Y) historically predicts recessions."
              />
            </h3>
            <div className="flex gap-4 mt-2 text-sm">
              <span>2Y: <span className="font-semibold">{latestValues.twoYear}%</span></span>
              <span>10Y: <span className="font-semibold">{latestValues.tenYear}%</span></span>
              <span>30Y: <span className="font-semibold">{latestValues.thirtyYear}%</span></span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={interestRateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="twoYear" 
                stroke="#ef4444" 
                name="2 Year"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="tenYear" 
                stroke="#3b82f6" 
                name="10 Year"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="thirtyYear" 
                stroke="#10b981" 
                name="30 Year"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth and Inflation Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Growth and Inflation
              <InfoTooltip
                basicContent="GDP growth shows economic expansion while CPI and PCE measure inflation."
                advancedContent="The Fed targets 2% PCE inflation. GDP above 2% with controlled inflation indicates healthy growth."
              />
            </h3>
            <div className="flex gap-4 mt-2 text-sm">
              <span>GDP: <span className="font-semibold">{latestValues.gdpGrowth}%</span></span>
              <span>CPI: <span className="font-semibold">{latestValues.cpi}%</span></span>
              <span>PCE: <span className="font-semibold">{latestValues.pce}%</span></span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthInflationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="gdpGrowth" 
                stroke="#10b981" 
                name="GDP Growth"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="cpi" 
                stroke="#ef4444" 
                name="CPI (YoY)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="pce" 
                stroke="#f59e0b" 
                name="PCE (YoY)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Labor and Consumer Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Labor Market & Consumer Health
              <InfoTooltip
                basicContent="Unemployment rate and retail sales show job market strength and consumer spending."
                advancedContent="Low unemployment with strong retail sales indicates economic health. Watch for divergence as a warning sign."
              />
            </h3>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Unemployment: <span className="font-semibold">{latestValues.unemployment}%</span></span>
              <span>Retail Sales: <span className="font-semibold">{latestValues.retailSales}% YoY</span></span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={laborConsumerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Unemployment (%)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Retail Sales YoY (%)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="unemployment"
                fill="#fef3c7"
                stroke="#f59e0b"
                name="Unemployment Rate"
                strokeWidth={2}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="retailSales"
                stroke="#3b82f6"
                name="Retail Sales (YoY)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MacroeconomicAnalysis;