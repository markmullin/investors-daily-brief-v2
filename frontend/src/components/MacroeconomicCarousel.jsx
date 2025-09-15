import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Info, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, ComposedChart, AreaChart, Bar
} from 'recharts';
import InfoTooltip from './InfoTooltip';
import { useViewMode } from '../context/ViewModeContext';
import { macroeconomicApi } from '../services/api';

/**
 * Enhanced tooltip that shows BEA release dates and corporate profits
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    
    // For GDP data with BEA release info
    if (dataPoint.beaQuarter && dataPoint.releaseDate) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 min-w-64">
          <p className="font-bold text-gray-800">{dataPoint.beaQuarter}</p>
          <p className="text-xs text-blue-600 mb-2">Released: {new Date(dataPoint.releaseDate).toLocaleDateString()}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between gap-3">
                <span className="text-gray-600 text-sm">{entry.name}:</span>
                <span className="font-semibold text-sm" style={{ color: entry.color }}>
                  {entry.value !== null && entry.value !== undefined ? 
                    `${entry.value.toFixed(2)}%` : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // For other data, use standard format
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{new Date(label).toLocaleDateString()}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry, index) => {
            // Format based on data type
            let formattedValue = 'N/A';
            if (entry.value !== null && entry.value !== undefined) {
              if (entry.name === 'Money Market Funds') {
                formattedValue = `${entry.value.toFixed(0)}B`;
              } else {
                formattedValue = `${entry.value.toFixed(2)}%`;
              }
            }
            return (
              <div key={index} className="flex justify-between gap-4">
                <span className="text-gray-600 text-sm">{entry.name}:</span>
                <span className="font-semibold text-sm" style={{ color: entry.color }}>
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Enhanced Macroeconomic Analysis Carousel Component with Python + AI Integration
 */
const MacroeconomicCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { viewMode } = useViewMode();

  // Enhanced chart configuration with Python analysis integration
  const charts = [
    {
      id: 'interest-rates',
      title: 'Interest Rates',
      subtitle: 'US Treasury Yields',
      icon: '📊'
    },
    {
      id: 'growth-corporate',
      title: 'GDP Growth & Corporate Profits',
      subtitle: 'Economic Growth & Business Performance',
      icon: '🏛️'
    },
    {
      id: 'inflation',
      title: 'Inflation Indicators',
      subtitle: 'CPI, PCE, and PPI Year-over-Year',
      icon: '📈'
    },
    {
      id: 'money-supply',
      title: 'Money Supply & Market Funds',
      subtitle: 'M2 Growth and Money Market Fund Assets',
      icon: '💰'
    },
    {
      id: 'labor-consumer',
      title: 'Labor Market & Consumer Health',
      subtitle: 'Employment & Spending',
      icon: '👥'
    }
  ];

  // Navigation functions
  const goNext = () => {
    setCurrentIndex((prev) => (prev === charts.length - 1 ? 0 : prev + 1));
  };
  
  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? charts.length - 1 : prev - 1));
  };

  // Fetch enhanced macroeconomic data with Python analysis
  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🏛️ MACRO COMPONENT: Fetching enhanced macro data...');
        const data = await macroeconomicApi.getAll();
        console.log('📊 Enhanced macro data received:', {
          hasPythonAnalysis: !!data.pythonAnalysis,
          hasMistralEducation: !!data.mistralEducation,
          riskLevel: data.enhancedMetadata?.riskLevel,
          marketRegime: data.enhancedMetadata?.marketRegime
        });
        
        if (data) {
          setMacroData(data);
        } else {
          setError('No enhanced macroeconomic data available');
        }
      } catch (err) {
        console.error('❌ MACRO COMPONENT: Enhanced macro data failed:', err);
        setError('Failed to load enhanced macroeconomic data');
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
    
    // Refresh every hour
    const interval = setInterval(fetchMacroData, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Process data for charts (same logic as before)
  const processInterestRateData = () => {
    if (!macroData?.interestRates?.data) return [];
    
    const { data } = macroData.interestRates;
    const twoYear = data.DGS2 || [];
    const tenYear = data.DGS10 || [];
    const thirtyYear = data.DGS30 || [];
    
    const allDates = new Set([
      ...twoYear.map(d => d.date),
      ...tenYear.map(d => d.date),
      ...thirtyYear.map(d => d.date)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filteredDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    
    return filteredDates.map(date => {
      const twoYearPoint = twoYear.find(d => d.date === date);
      const tenYearPoint = tenYear.find(d => d.date === date);
      const thirtyYearPoint = thirtyYear.find(d => d.date === date);
      
      return {
        date,
        twoYear: twoYearPoint?.value || null,
        tenYear: tenYearPoint?.value || null,
        thirtyYear: thirtyYearPoint?.value || null
      };
    }).filter(d => d.twoYear !== null || d.tenYear !== null || d.thirtyYear !== null);
  };

  // Process GDP + Corporate Profits data with release dates
  const processGrowthCorporateData = () => {
    if (!macroData?.growthInflation?.data) return [];
    
    const growthData = macroData.growthInflation?.data || {};
    const gdp = growthData.A191RL1Q225SBEA || [];
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const processedData = gdp
      .filter(point => {
        const releaseDate = point.releaseDate || point.date;
        return new Date(releaseDate) >= oneYearAgo;
      })
      .map(point => ({
        date: point.releaseDate || point.date,
        gdpGrowth: point.value,
        corporateProfits: point.corporateProfits || null,
        corporateProfitsGrowth: point.corporateProfitsGrowth || null,
        beaQuarter: point.quarter,
        releaseDate: point.releaseDate
      }));
    
    return processedData;
  };

  // Process inflation + M2 data + Money Market Funds
  const processInflationMonetaryData = () => {
    if (!macroData?.growthInflation?.data && !macroData?.monetaryPolicy?.data) return [];
    
    const growthData = macroData.growthInflation?.data || {};
    const monetaryData = macroData.monetaryPolicy?.data || {};
    
    const cpi = growthData.CPI_YOY || [];
    const pce = growthData.PCE_YOY || [];
    const ppi = growthData.PPI_YOY || [];
    const m2YoY = monetaryData.M2_YOY || [];
    const moneyMarketFunds = monetaryData.MONEY_MARKET_FUNDS || [];
    
    const allDates = new Set([
      ...cpi.map(d => d.date),
      ...pce.map(d => d.date),
      ...ppi.map(d => d.date),
      ...m2YoY.map(d => d.date),
      ...moneyMarketFunds.map(d => d.date)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filteredDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    
    return filteredDates.map(date => {
      const cpiPoint = cpi.find(d => d.date === date);
      const pcePoint = pce.find(d => d.date === date);
      const ppiPoint = ppi.find(d => d.date === date);
      const m2Point = m2YoY.find(d => d.date === date);
      const mmfPoint = moneyMarketFunds.find(d => d.date === date);
      
      return {
        date,
        cpi: cpiPoint?.value || null,
        pce: pcePoint?.value || null,
        ppi: ppiPoint?.value || null,
        m2Supply: m2Point?.value || null,
        moneyMarketFunds: mmfPoint ? mmfPoint.value : null // Already in billions, don't divide!
      };
    }).filter(d => d.cpi !== null || d.pce !== null || d.ppi !== null || d.m2Supply !== null || d.moneyMarketFunds !== null);
  };

  const processLaborConsumerData = () => {
    if (!macroData?.laborConsumer?.data) return [];
    
    const { data } = macroData.laborConsumer;
    const unemployment = data.UNRATE || [];
    const retail = data.RETAIL_YOY || [];
    const realIncome = data.REAL_PERSONAL_INCOME || [];
    
    const allDates = new Set([
      ...unemployment.map(d => d.date),
      ...retail.map(d => d.date),
      ...realIncome.map(d => d.date)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filteredDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    
    return filteredDates.map(date => {
      const unemploymentPoint = unemployment.find(d => d.date === date);
      const retailPoint = retail.find(d => d.date === date);
      const incomePoint = realIncome.find(d => d.date === date);
      
      return {
        date,
        unemployment: unemploymentPoint?.value || null,
        retailSales: retailPoint?.value || null,
        realPersonalIncome: incomePoint?.value || null
      };
    }).filter(d => d.unemployment !== null || d.retailSales !== null || d.realPersonalIncome !== null);
  };

  // Get processed data
  const interestRateData = processInterestRateData();
  const growthCorporateData = processGrowthCorporateData();
  const inflationMonetaryData = processInflationMonetaryData();
  const laborConsumerData = processLaborConsumerData();

  // Enhanced latest values with Python analysis
  const getLatestValues = () => {
    if (!macroData) return {
      twoYear: { value: 'N/A', date: '' },
      tenYear: { value: 'N/A', date: '' },
      thirtyYear: { value: 'N/A', date: '' },
      gdpGrowth: { value: 'N/A', date: '' },
      corporateProfits: { value: 'N/A', date: '' },
      cpi: { value: 'N/A', date: '' },
      pce: { value: 'N/A', date: '' },
      ppi: { value: 'N/A', date: '' },
      m2Supply: { value: 'N/A', date: '' },
      moneyMarketFunds: { value: 'N/A', date: '' },
      unemployment: { value: 'N/A', date: '' },
      retailSales: { value: 'N/A', date: '' },
      realPersonalIncome: { value: 'N/A', date: '' }
    };
    
    const latest = macroData.interestRates?.latest || {};
    const latestGrowth = macroData.growthInflation?.latest || {};
    const latestMonetary = macroData.monetaryPolicy?.latest || {};
    const latestLabor = macroData.laborConsumer?.latest || {};
    
    const latestDate = (data, showQuarter = false) => {
      if (!data || !data.value) return { value: 'N/A', date: '' };
      
      if (showQuarter && data.quarter) {
        return {
          value: data.value.toFixed(2),
          date: data.quarter.replace('Q', ' Q')
        };
      }
      
      return {
        value: data.value.toFixed(2),
        date: data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
      };
    };
    
    return {
      twoYear: latestDate(latest.twoYear),
      tenYear: latestDate(latest.tenYear),
      thirtyYear: latestDate(latest.thirtyYear),
      gdpGrowth: latestDate(latestGrowth.gdpGrowth, true),
      corporateProfits: latestGrowth.gdpGrowth?.corporateProfitsGrowth ? 
        { value: latestGrowth.gdpGrowth.corporateProfitsGrowth.toFixed(1), date: latestGrowth.gdpGrowth.quarter?.replace('Q', ' Q') || '' } :
        { value: 'N/A', date: '' },
      cpi: latestDate(latestGrowth.cpi),
      pce: latestDate(latestGrowth.pce),
      ppi: latestDate(latestGrowth.ppi),
      m2Supply: latestDate(latestGrowth.m2Growth),
      moneyMarketFunds: latestGrowth.moneyMarketFunds ? 
        { value: (latestGrowth.moneyMarketFunds.value).toFixed(0), date: latestGrowth.moneyMarketFunds.date ? new Date(latestGrowth.moneyMarketFunds.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '' } :
        { value: 'N/A', date: '' },
      unemployment: latestDate(latestLabor.unemployment),
      retailSales: latestDate(latestLabor.retailSales),
      realPersonalIncome: latestDate(latestLabor.realPersonalIncome)
    };
  };

  const latestValues = getLatestValues();

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Enhanced Python analysis display
  const getPythonAnalysisDisplay = () => {
    if (!macroData?.pythonAnalysis) {
      return {
        available: false,
        riskLevel: 5,
        marketRegime: 'Unknown',
        insights: ['Python analysis unavailable']
      };
    }

    const analysis = macroData.pythonAnalysis;
    return {
      available: true,
      riskLevel: analysis.overall_risk_level || 5,
      marketRegime: analysis.market_regime || 'Unknown',
      confidence: analysis.regime_confidence || 0,
      riskSignals: analysis.risk_signals || [],
      insights: analysis.actionable_insights || [],
      crossAssetAnalysis: analysis.analysis || {}
    };
  };

  const pythonAnalysis = getPythonAnalysisDisplay();

  // Enhanced current values display
  const getCurrentValues = () => {
    const chart = charts[currentIndex];
    switch (chart.id) {
      case 'interest-rates':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">2Y:</span> {latestValues.twoYear.value}% <span className="text-xs text-gray-500">({latestValues.twoYear.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">10Y:</span> {latestValues.tenYear.value}% <span className="text-xs text-gray-500">({latestValues.tenYear.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">30Y:</span> {latestValues.thirtyYear.value}% <span className="text-xs text-gray-500">({latestValues.thirtyYear.date})</span>
            </div>
          </div>
        );
      case 'growth-corporate':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">GDP Growth:</span> {latestValues.gdpGrowth.value}% <span className="text-xs text-gray-500">({latestValues.gdpGrowth.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Corporate Profits:</span> {latestValues.corporateProfits.value}% <span className="text-xs text-gray-500">({latestValues.corporateProfits.date})</span>
            </div>
          </div>
        );
      case 'inflation':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">CPI:</span> {latestValues.cpi.value}% <span className="text-xs text-gray-500">({latestValues.cpi.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">PCE:</span> {latestValues.pce.value}% <span className="text-xs text-gray-500">({latestValues.pce.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">PPI:</span> {latestValues.ppi?.value || 'N/A'}% <span className="text-xs text-gray-500">({latestValues.ppi?.date || ''})</span>
            </div>
          </div>
        );
      case 'money-supply':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">M2 Supply:</span> {latestValues.m2Supply.value}% <span className="text-xs text-gray-500">({latestValues.m2Supply.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Money Market Funds:</span> ${latestValues.moneyMarketFunds?.value || 'N/A'}B <span className="text-xs text-gray-500">({latestValues.moneyMarketFunds?.date || ''})</span>
            </div>
          </div>
        );
      case 'labor-consumer':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">Unemployment:</span> {latestValues.unemployment.value}% <span className="text-xs text-gray-500">({latestValues.unemployment.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Retail Sales:</span> {latestValues.retailSales.value}% <span className="text-xs text-gray-500">({latestValues.retailSales.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Real Personal Income:</span> {latestValues.realPersonalIncome?.value || 'N/A'}% <span className="text-xs text-gray-500">({latestValues.realPersonalIncome?.date || ''})</span>
            </div>
          </div>
        );
      default:
        return '';
    }
  };

  // Calculate Y-axis domains
  const calculateDomain = (data, keys) => {
    const values = [];
    data.forEach(d => {
      keys.forEach(key => {
        if (d[key] !== null && d[key] !== undefined) {
          values.push(d[key]);
        }
      });
    });
    
    if (values.length === 0) return [0, 10];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return [
      Math.floor((min - padding) * 10) / 10,
      Math.ceil((max + padding) * 10) / 10
    ];
  };

  // Improved dual-axis domain calculation
  const calculateDualAxisDomains = (data, leftKeys, rightKeys) => {
    const leftValues = [];
    const rightValues = [];
    
    data.forEach(d => {
      leftKeys.forEach(key => {
        if (d[key] !== null && d[key] !== undefined) {
          leftValues.push(d[key]);
        }
      });
      rightKeys.forEach(key => {
        if (d[key] !== null && d[key] !== undefined) {
          rightValues.push(d[key]);
        }
      });
    });
    
    const calculateDomainWithMinRange = (values, minRange = 1.0) => {
      if (values.length === 0) return [0, 10];
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      const padding = Math.max(range * 0.15, minRange * 0.25);
      
      const cleanMin = Math.round((min - padding) * 10) / 10;
      const cleanMax = Math.round((max + padding) * 10) / 10;
      
      return [cleanMin, cleanMax];
    };
    
    return {
      left: calculateDomainWithMinRange(leftValues, 1.5),
      right: calculateDomainWithMinRange(rightValues, 3.0)
    };
  };

  // Tick formatters for clean Y-axis display
  const formatLeftYAxisTick = (value) => {
    if (Math.abs(value) < 0.01) return '0.0%';
    return `${parseFloat(value.toFixed(1))}%`;
  };

  const formatRightYAxisTick = (value) => {
    if (Math.abs(value) < 0.01) return '0.0%';
    return `${parseFloat(value.toFixed(1))}%`;
  };

  // Enhanced chart rendering
  const renderChart = () => {
    const chart = charts[currentIndex];
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg">
          <AlertCircle className="text-red-500 mb-2" size={32} />
          <p className="text-red-700">{error}</p>
        </div>
      );
    }

    const chartMargin = { top: 10, right: 30, left: 10, bottom: 60 };
    const chartHeight = 400;

    switch (chart.id) {
      case 'interest-rates':
        const interestDomain = calculateDomain(interestRateData, ['twoYear', 'tenYear', 'thirtyYear']);
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={interestRateData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, interestRateData.length / 8))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={interestDomain}
                  label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="twoYear" stroke="#ef4444" name="2 Year" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="tenYear" stroke="#3b82f6" name="10 Year" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="thirtyYear" stroke="#10b981" name="30 Year" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'growth-corporate':
        const growthDomain = calculateDomain(growthCorporateData, ['gdpGrowth', 'corporateProfitsGrowth']);
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={growthCorporateData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, growthCorporateData.length / 6))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={growthDomain}
                  label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="gdpGrowth" fill="#10b981" name="GDP Growth" opacity={0.8} />
                <Line type="monotone" dataKey="corporateProfitsGrowth" stroke="#f59e0b" name="Corporate Profits YoY" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'inflation':
        // Pure inflation chart - only CPI, PCE, PPI
        const inflationData = processInflationMonetaryData().map(d => ({
          date: d.date,
          cpi: d.cpi,
          pce: d.pce,
          ppi: d.ppi
          // Explicitly exclude m2Supply and moneyMarketFunds
        }));
        const inflationDomain = calculateDomain(inflationData, ['cpi', 'pce', 'ppi']);
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inflationData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, inflationData.length / 8))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={inflationDomain}
                  label={{ value: 'YoY Change (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="cpi" stroke="#ef4444" name="CPI (YoY)" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="pce" stroke="#f59e0b" name="PCE (YoY)" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="ppi" stroke="#10b981" name="PPI (YoY)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'money-supply':
        // Separate money supply chart - M2 and Money Market Funds
        const moneySupplyData = processInflationMonetaryData().map(d => ({
          date: d.date,
          m2Supply: d.m2Supply,
          moneyMarketFunds: d.moneyMarketFunds
        }));
        const moneyDomains = calculateDualAxisDomains(
          moneySupplyData,
          ['m2Supply'],
          ['moneyMarketFunds']
        );
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={moneySupplyData} margin={chartMargin}>
                <defs>
                  <linearGradient id="m2Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="mmfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, moneySupplyData.length / 8))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="left"
                  domain={moneyDomains.left}
                  label={{ value: 'M2 Growth YoY (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={moneyDomains.right}
                  label={{ value: 'MMF ($B)', angle: 90, position: 'insideRight' }}
                  tick={{ fontSize: 11 }}
                  width={60}
                  tickFormatter={(value) => `${(value).toFixed(0)}B`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="m2Supply" stroke="#8b5cf6" fill="url(#m2Gradient)" name="M2 Supply (YoY)" strokeWidth={2} connectNulls />
                <Area yAxisId="right" type="monotone" dataKey="moneyMarketFunds" stroke="#06b6d4" fill="url(#mmfGradient)" name="Money Market Funds" strokeWidth={2} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'labor-consumer':
        const domains = calculateDualAxisDomains(
          laborConsumerData, 
          ['unemployment'], 
          ['retailSales', 'realPersonalIncome']
        );
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={laborConsumerData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, laborConsumerData.length / 8))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="left"
                  domain={domains.left}
                  label={{ value: 'Unemployment (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatLeftYAxisTick}
                  width={50}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={domains.right}
                  label={{ value: 'Growth YoY (%)', angle: 90, position: 'insideRight' }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatRightYAxisTick}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="unemployment" fill="#fef3c7" stroke="#f59e0b" name="Unemployment Rate" strokeWidth={2} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="retailSales" stroke="#3b82f6" name="Retail Sales (YoY)" strokeWidth={2} dot={false} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="realPersonalIncome" stroke="#10b981" name="Real Personal Income (YoY)" strokeWidth={2} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentChart = charts[currentIndex];

  return (
    <div className="bg-white rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
      {/* Navigation arrows */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goPrev}
        aria-label="Previous macro chart"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goNext}
        aria-label="Next macro chart"
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{currentChart.icon}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {currentChart.title}
              </h3>
              <InfoTooltip
                basicContent="Economic indicators that influence market conditions and investment opportunities."
                advancedContent="Cross-asset macroeconomic analysis using Python algorithms for market regime identification and investment positioning."
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">{currentChart.subtitle}</p>
            <div className="bg-gray-50 rounded-lg p-3">
              {getCurrentValues()}
            </div>
          </div>
          
          {/* Carousel indicators */}
          <div className="flex gap-1 ml-4">
            {charts.map((_, idx) => (
              <button 
                key={`indicator-${idx}`}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to ${charts[idx].title}`}
              />
            ))}
          </div>
        </div>

        {/* Chart */}
        {renderChart()}
        
      </div>
    </div>
  );
};

export default MacroeconomicCarousel;