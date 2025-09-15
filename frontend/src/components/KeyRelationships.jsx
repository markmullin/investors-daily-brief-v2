import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Info, AlertCircle, TrendingUp, TrendingDown, Brain, Loader2, BarChart3, GraduationCap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import InfoTooltip from './InfoTooltip';
import TimePeriodSelector from './TimePeriodSelector';
import { useViewMode } from '../context/ViewModeContext';
import { marketApi, aiAnalysisApi } from '../services/api';

/**
 * Symbol name mapping
 */
const symbolNames = {
  'SPY': 'S&P 500',
  'TLT': 'Treasury Bonds',
  'EEM': 'Emerging Markets',
  'EFA': 'Intl Developed',
  'IVE': 'Value Stocks',
  'IVW': 'Growth Stocks',
  'IBIT': 'Bitcoin',
  'GLD': 'Gold',
  'BND': 'Investment Grade Bonds',
  'JNK': 'High Yield Bonds',
  'USO': 'Oil',
  'UUP': 'US Dollar',
  'XLP': 'Consumer Staples',
  'XLY': 'Consumer Discretionary',
  'SMH': 'Semiconductors',
  'XSW': 'Software'
};

/**
 * Custom tooltip component for comparison data
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString();
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800 mb-2">{formattedDate}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4">
            <span className="text-sm" style={{ color: entry.color }}>{symbolNames[entry.name] || entry.name}:</span>
            <span className="font-semibold text-sm">{entry.unit === '%' ? `${Number(entry.value).toFixed(2)}%` : Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


/**
 * Relationship configuration
 */
const relationships = [
  {
    id: 'spy-vs-tlt',
    title: 'Stocks vs Bonds',
    displayTitle: 'S&P 500 vs Treasury Bonds',
    symbols: ['SPY', 'TLT'],
    description: {
      basic: 'Compares stock market (SPY) performance against government bonds (TLT). When stocks rise, bonds often fall and vice versa.',
      advanced: 'SPY/TLT relationship reflects risk-on/risk-off sentiment. Negative correlation typical, but breaks down during crises when both can fall together.'
    },
    colors: ['#3B82F6', '#10B981'],
    showPercentage: true
  },
  {
    id: 'spy-vs-eem-vs-efa',
    title: 'Global Equity Markets',
    displayTitle: 'US vs Emerging vs International',
    symbols: ['SPY', 'EEM', 'EFA'],
    description: {
      basic: 'Compares US stocks (SPY) with emerging markets (EEM) and developed international markets (EFA).',
      advanced: 'Relative performance indicates global risk appetite. EEM outperformance suggests high risk tolerance, while SPY/EFA divergence shows US exceptionalism.'
    },
    colors: ['#3B82F6', '#F59E0B', '#8B5CF6'],
    showPercentage: true
  },
  {
    id: 'ive-vs-ivw',
    title: 'Value vs Growth',
    displayTitle: 'Value vs Growth Stocks',
    symbols: ['IVE', 'IVW'],
    description: {
      basic: 'Compares value stocks (IVE) against growth stocks (IVW). Value stocks are cheaper, growth stocks have higher earnings growth.',
      advanced: 'IVE/IVW ratio indicates market regime. Growth outperformance typical in low-rate environments, value shines during inflation or economic recovery.'
    },
    colors: ['#059669', '#DC2626'],
    showPercentage: true
  },
  {
    id: 'ibit-vs-gld',
    title: 'Bitcoin vs Gold',
    displayTitle: 'Bitcoin vs Gold',
    symbols: ['IBIT', 'GLD'],
    description: {
      basic: 'Compares Bitcoin (IBIT) performance against gold (GLD). Both are seen as stores of value but have different risk profiles.',
      advanced: 'IBIT/GLD shows digital vs traditional store of value preference. Bitcoin more volatile but higher potential returns, gold is established safe haven.'
    },
    colors: ['#F97316', '#FCD34D'],
    showPercentage: true
  },
  {
    id: 'bnd-vs-jnk',
    title: 'Investment Grade vs High Yield',
    displayTitle: 'Investment Grade vs High Yield Bonds',
    symbols: ['BND', 'JNK'],
    description: {
      basic: 'Compares safe government bonds (BND) with risky high-yield bonds (JNK). Shows investor appetite for risk in bond markets.',
      advanced: 'BND/JNK spread indicates credit risk appetite. Narrowing spreads suggest risk-on sentiment, widening shows flight to quality.'
    },
    colors: ['#6366F1', '#EF4444'],
    showPercentage: true
  },
  {
    id: 'uso-vs-uup',
    title: 'Oil vs Dollar',
    displayTitle: 'Oil vs US Dollar',
    symbols: ['USO', 'UUP'],
    description: {
      basic: 'Compares oil prices (USO) against the US dollar (UUP). They typically move in opposite directions.',
      advanced: 'USO/UUP shows commodity-currency dynamics. Strong dollar pressures commodities lower, weak dollar supports commodity prices.'
    },
    colors: ['#047857', '#3730A3'],
    showPercentage: true
  },
  {
    id: 'xlp-vs-xly',
    title: 'Consumer Sectors',
    displayTitle: 'Consumer Staples vs Discretionary',
    symbols: ['XLP', 'XLY'],
    description: {
      basic: 'Compares defensive consumer staples (XLP) with cyclical consumer discretionary (XLY). Shows consumer health and market sentiment.',
      advanced: 'XLP/XLY ratio indicates economic cycle positioning. XLY outperformance suggests economic expansion, XLP strength shows defensive positioning.'
    },
    colors: ['#7C3AED', '#DB2777'],
    showPercentage: true
  },
  {
    id: 'smh-vs-xsw',
    title: 'Tech Sectors',
    displayTitle: 'Semiconductors vs Software',
    symbols: ['SMH', 'XSW'],
    description: {
      basic: 'Compares semiconductor companies (SMH) with software companies (XSW). Both are tech sectors but with different dynamics.',
      advanced: 'SMH represents hardware/cyclical tech, XSW is software/recurring revenue. Relative performance indicates tech sector rotation and cycle positioning.'
    },
    colors: ['#0EA5E9', '#16A34A'],
    showPercentage: true
  }
];

/**
 * Key Relationships Component
 * FIXED: Added onRelationshipChange callback to notify parent of current relationship
 */
const KeyRelationships = ({ historicalData: initialHistoricalData = {}, sectorData, onRelationshipChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [historicalData, setHistoricalData] = useState(initialHistoricalData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const { viewMode } = useViewMode();

  const currentRelationship = relationships[currentIndex];

  // Navigation functions
  const goNext = () => {
    const nextIndex = currentIndex === relationships.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
  };

  const goPrev = () => {
    const prevIndex = currentIndex === 0 ? relationships.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
  };

  // Fetch AI analysis
  const fetchAiAnalysis = async () => {
    try {
      const response = await fetch('/api/intelligent-analysis/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          relationship: currentRelationship,
          chartData: chartData,
          period: selectedPeriod
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    }
  };

  // Notify parent when relationship changes
  useEffect(() => {
    if (onRelationshipChange && currentRelationship) {
      // Create correlation pair data for intelligent analysis
      const correlationData = {
        pair: currentRelationship.id,
        asset1: currentRelationship.symbols[0],
        asset2: currentRelationship.symbols[1],
        name: currentRelationship.title,
        description: currentRelationship.description
      };
      onRelationshipChange(correlationData);
    }
  }, [currentIndex, currentRelationship, onRelationshipChange]);

  // Fetch data when period or relationship changes
  useEffect(() => {
    const fetchPeriodData = async () => {
      if (!currentRelationship) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const newData = {};
        for (const symbol of currentRelationship.symbols) {
          // 🎯 FIXED: Remove .US suffix - backend expects just the symbol
          console.log(`🔍 Fetching data for ${symbol} with period ${selectedPeriod}`);
          
          const data = await marketApi.getHistory(symbol, selectedPeriod);
          newData[symbol] = { data, period: selectedPeriod };
        }
        
        setHistoricalData(prev => ({
          ...prev,
          ...newData
        }));
      } catch (error) {
        console.error('Error fetching relationship data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [currentRelationship, selectedPeriod]);

  // Get chart data for the current relationship
  const { chartData, dataLimitation } = useMemo(() => {
    if (!currentRelationship || !historicalData) return { chartData: [], dataLimitation: null };

    // Collect all available data for each symbol
    const symbolsData = {};
    let earliestCommonDate = null;
    let latestCommonDate = null;
    const dataAvailability = {};

    // First, get all data for each symbol (removed .US suffix)
    currentRelationship.symbols.forEach(symbol => {
      const data = historicalData[symbol]?.data || [];
      if (data.length > 0) {
        symbolsData[symbol] = data;
        dataAvailability[symbol] = {
          start: new Date(data[0].date),
          end: new Date(data[data.length - 1].date),
          count: data.length
        };
      } else {
        symbolsData[symbol] = [];
        dataAvailability[symbol] = null;
      }
    });

    // Find the common date range where all symbols have data
    const validSymbols = Object.keys(dataAvailability).filter(s => dataAvailability[s] !== null);
    if (validSymbols.length === 0) return { chartData: [], dataLimitation: null };

    // Find the latest start date and earliest end date among all symbols
    earliestCommonDate = new Date(Math.max(...validSymbols.map(s => dataAvailability[s].start.getTime())));
    latestCommonDate = new Date(Math.min(...validSymbols.map(s => dataAvailability[s].end.getTime())));

    // Calculate the cutoff date based on selected period
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(selectedPeriod) {
      case '1d':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '5d':
        cutoffDate.setDate(now.getDate() - 5);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
    }

    // Use the later of cutoffDate or earliestCommonDate
    const effectiveStartDate = new Date(Math.max(cutoffDate.getTime(), earliestCommonDate.getTime()));

    // Check if we have any symbols with insufficient data for the selected period
    let dataLimitation = null;
    currentRelationship.symbols.forEach(symbol => {
      const symbolAvailability = dataAvailability[symbol];
      if (symbolAvailability && symbolAvailability.start > cutoffDate) {
        if (!dataLimitation) dataLimitation = {};
        dataLimitation[symbol] = {
          availableFrom: symbolAvailability.start,
          requestedPeriod: selectedPeriod
        };
      }
    });

    // Get the reference data (first symbol that has data)
    const referenceSymbol = validSymbols[0];
    const referenceData = symbolsData[referenceSymbol].filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= effectiveStartDate && itemDate <= latestCommonDate;
    });

    if (referenceData.length === 0) return { chartData: [], dataLimitation };

    // Create normalized comparison data
    const comparisonData = [];
    
    referenceData.forEach((refItem) => {
      const refDate = new Date(refItem.date);
      const dataPoint = {
        date: refItem.date
      };

      let allSymbolsHaveData = true;

      // For each symbol, find the corresponding data point
      currentRelationship.symbols.forEach(symbol => {
        const symbolData = symbolsData[symbol];
        if (!symbolData || symbolData.length === 0) {
          allSymbolsHaveData = false;
          return;
        }

        // Find the data point for this date
        const symbolPoint = symbolData.find(d => {
          const dDate = new Date(d.date);
          return dDate.getTime() === refDate.getTime();
        });

        if (symbolPoint) {
          // Find the first valid data point for this symbol within our date range
          const symbolStartData = symbolData.find(d => {
            const dDate = new Date(d.date);
            return dDate >= effectiveStartDate;
          });

          if (symbolStartData) {
            const currentPrice = symbolPoint.price || symbolPoint.close || 0;
            const startPrice = symbolStartData.price || symbolStartData.close || 1;
            
            // Calculate percentage change from start of the period
            const percentChange = ((currentPrice - startPrice) / startPrice) * 100;
            
            dataPoint[symbol] = currentRelationship.showPercentage ? percentChange : currentPrice;
          } else {
            allSymbolsHaveData = false;
          }
        } else {
          allSymbolsHaveData = false;
        }
      });

      // Only include data points where all symbols have data
      if (allSymbolsHaveData) {
        comparisonData.push(dataPoint);
      }
    });

    return { chartData: comparisonData, dataLimitation };
  }, [currentRelationship, historicalData, selectedPeriod]);

  // Check if we have data
  const hasData = chartData.length > 0;

  // Format date for x-axis based on period
  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (selectedPeriod === '1d' || selectedPeriod === '5d') {
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      } else if (selectedPeriod === '5y') {
        return `${d.getMonth() + 1}/${d.getFullYear()}`;
      } else {
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
    } catch (e) {
      return '';
    }
  };

  // Calculate Y-axis domain with fixed padding
  const getYDomain = () => {
    if (!chartData || chartData.length === 0) return ['auto', 'auto'];
    
    let minValue = 0;
    let maxValue = 0;
    
    currentRelationship.symbols.forEach(symbol => {
      const values = chartData.map(d => d[symbol]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        minValue = Math.min(minValue, ...values);
        maxValue = Math.max(maxValue, ...values);
      }
    });
    
    // Ensure there's always enough padding to prevent cutoff
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.15, 10); // At least 15% padding or 10 units
    return [minValue - padding, maxValue + padding];
  };

  // Use keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period.value);
  };

  // Show the percentage change from start of period in the label
  const getLatestValues = () => {
    if (!chartData || chartData.length === 0) return {};
    const lastEntry = chartData[chartData.length - 1];
    const formattedValues = {};
    
    currentRelationship.symbols.forEach(symbol => {
      const value = lastEntry[symbol];
      if (value !== undefined && value !== null) {
        formattedValues[symbol] = currentRelationship.showPercentage 
          ? `${Number(value).toFixed(2)}%` 
          : Number(value).toFixed(2);
      }
    });
    
    return formattedValues;
  };

  const latestValues = getLatestValues();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
        {/* Navigation arrows */}
        <button 
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                     text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          onClick={goPrev}
          aria-label="Previous relationship"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                     text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          onClick={goNext}
          aria-label="Next relationship"
        >
          <ChevronRight size={24} />
        </button>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentRelationship.displayTitle || currentRelationship.title}
                </h3>

              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {currentRelationship.symbols.join(' vs ')}
                </span>
                <InfoTooltip
                  basicContent={currentRelationship.description.basic}
                  advancedContent={currentRelationship.description.advanced}
                />
              </div>
            </div>
            
            {/* Carousel indicators */}
            <div className="flex gap-1">
              {relationships.map((_, idx) => (
                <button 
                  key={`indicator-${idx}`}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to ${relationships[idx].title}`}
                />
              ))}
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="mb-4">
            <TimePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </div>

          {/* Chart */}
          {!hasData || isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="text-gray-600 mt-4">Loading {selectedPeriod} data...</p>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="text-red-500 mb-4" size={40} />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Data</h3>
                  <p className="text-gray-600 text-center max-w-md">{error}</p>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-500 mb-4" size={40} />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Historical Data Available</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Historical data for {currentRelationship.symbols.join(', ')} could not be loaded.
                    <br />
                    Please check API connectivity.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {/* Data Limitation Warning */}
              {dataLimitation && (
                <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-amber-600 mt-0.5" size={16} />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Limited Historical Data</p>
                      {Object.entries(dataLimitation).map(([symbol, info]) => (
                        <p key={symbol} className="text-xs">
                          {symbol} data only available from {new Date(info.availableFrom).toLocaleDateString()}
                          {selectedPeriod === '5y' && ' (less than 5 years)'}
                        </p>
                      ))}
                      <p className="text-xs mt-1">Chart shows data from when all assets have available data.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest values display */}
              <div className="mb-3 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">
                    {dataLimitation ? 'Available Period' : selectedPeriod.toUpperCase()} Performance
                  </span>
                  <div className="flex gap-4">
                    {currentRelationship.symbols.map((symbol, index) => (
                      <div key={symbol} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-0.5" 
                          style={{ backgroundColor: currentRelationship.colors[index] }}
                        />
                        <span className="text-sm font-medium" style={{ color: currentRelationship.colors[index] }}>
                          {symbolNames[symbol] || symbol}: {latestValues[symbol] || '0.00%'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 400 }} className="mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={formatDate}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      interval={Math.floor(Math.max(1, chartData.length / 12))}
                    />
                    <YAxis
                      domain={getYDomain()}
                      tickFormatter={(val) => currentRelationship.showPercentage ? `${Number(val).toFixed(0)}%` : Number(val).toFixed(0)}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tick={{ fill: '#666666', fontSize: 11 }}
                      tickLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      formatter={(value) => currentRelationship.showPercentage ? `${Number(value).toFixed(2)}%` : Number(value).toFixed(2)}
                    />
                    <Legend formatter={(value) => symbolNames[value] || value} />
                    
                    {/* Line for each symbol */}
                    {currentRelationship.symbols.map((symbol, index) => (
                      <Line
                        key={symbol}
                        type="monotone"
                        dataKey={symbol}
                        stroke={currentRelationship.colors[index]}
                        strokeWidth={2}
                        dot={false}
                        name={symbol}
                        unit={currentRelationship.showPercentage ? '%' : ''}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Market Intelligence Section (Collapsible) */}
      <div className="bg-white rounded-xl shadow-lg mt-4">
        <button
          onClick={() => {
            setShowAnalysis(!showAnalysis);
            if (!showAnalysis && !aiAnalysis) {
              fetchAiAnalysis();
            }
          }}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Relationship Intelligence</span>
            {aiAnalysis?.confidence && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                {aiAnalysis.confidence}% confidence
              </span>
            )}
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAnalysis ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {showAnalysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-4">
              {/* Main Analysis */}
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {aiAnalysis?.summary || 
                   `${currentRelationship.displayTitle} shows a ${chartData && chartData.length > 1 ? 
                     'dynamic relationship' : 'correlation'} over the ${selectedPeriod} period. ` +
                   `${currentRelationship.description.basic}`}
                </p>
              </div>

              {/* Key Insights */}
              {aiAnalysis?.insights && aiAnalysis.insights.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Key Insights</div>
                  <ul className="space-y-1">
                    {aiAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trading Implications */}
              {(aiAnalysis?.implications || currentRelationship.description.advanced) && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {aiAnalysis?.implications || currentRelationship.description.advanced}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyRelationships;