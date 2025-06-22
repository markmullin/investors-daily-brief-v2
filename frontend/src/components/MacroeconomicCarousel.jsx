import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Info } from 'lucide-react';
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
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4">
              <span className="text-gray-600 text-sm">{entry.name}:</span>
              <span className="font-semibold text-sm" style={{ color: entry.color }}>
                {entry.value !== null && entry.value !== undefined ? `${entry.value.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Macroeconomic Analysis Carousel Component
 */
const MacroeconomicCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { viewMode } = useViewMode();

  // Enhanced chart configuration with reorganized data
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
      id: 'inflation-monetary',
      title: 'Inflation & Money Supply',
      subtitle: 'Price Pressures & Monetary Policy',
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

  // Fetch macroeconomic data
  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await macroeconomicApi.getAll();
        console.log('📊 Macro data received (BEA + FRED with release dates):', data);
        
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

  // Process data for charts
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

  // NEW: Process GDP + Corporate Profits data with release dates
  const processGrowthCorporateData = () => {
    if (!macroData?.growthInflation?.data) return [];
    
    console.log('🏛️ Processing GDP + Corporate Profits with RELEASE DATES...');
    
    const growthData = macroData.growthInflation?.data || {};
    const gdp = growthData.A191RL1Q225SBEA || [];
    
    console.log(`📊 GDP data points: ${gdp.length}`);
    
    // Filter to recent data and map with release dates
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const processedData = gdp
      .filter(point => {
        // Use release date for filtering, not quarter start date
        const releaseDate = point.releaseDate || point.date;
        return new Date(releaseDate) >= oneYearAgo;
      })
      .map(point => {
        const result = {
          date: point.releaseDate || point.date,  // Use release date as chart date
          gdpGrowth: point.value,
          corporateProfits: point.corporateProfits || null,
          corporateProfitsGrowth: point.corporateProfitsGrowth || null,
          beaQuarter: point.quarter,
          releaseDate: point.releaseDate
        };
        
        console.log(`✅ Chart Point: ${point.quarter} released ${point.releaseDate} - GDP: ${point.value}%, Profits: ${point.corporateProfits || 'N/A'}`);
        
        return result;
      });
    
    console.log(`📈 Final chart data: ${processedData.length} points`);
    return processedData;
  };

  // NEW: Process inflation + M2 data separately
  const processInflationMonetaryData = () => {
    if (!macroData?.growthInflation?.data && !macroData?.monetaryPolicy?.data) return [];
    
    const growthData = macroData.growthInflation?.data || {};
    const monetaryData = macroData.monetaryPolicy?.data || {};
    
    const cpi = growthData.CPI_YOY || [];
    const pce = growthData.PCE_YOY || [];
    const m2YoY = monetaryData.M2_YOY || [];
    
    const allDates = new Set([
      ...cpi.map(d => d.date),
      ...pce.map(d => d.date),
      ...m2YoY.map(d => d.date)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filteredDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    
    return filteredDates.map(date => {
      const cpiPoint = cpi.find(d => d.date === date);
      const pcePoint = pce.find(d => d.date === date);
      const m2Point = m2YoY.find(d => d.date === date);
      
      return {
        date,
        cpi: cpiPoint?.value || null,
        pce: pcePoint?.value || null,
        m2Supply: m2Point?.value || null
      };
    }).filter(d => d.cpi !== null || d.pce !== null || d.m2Supply !== null);
  };

  const processLaborConsumerData = () => {
    if (!macroData?.laborConsumer?.data) return [];
    
    const { data } = macroData.laborConsumer;
    const unemployment = data.UNRATE || [];
    const retail = data.RETAIL_YOY || [];
    
    const allDates = new Set([
      ...unemployment.map(d => d.date),
      ...retail.map(d => d.date)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filteredDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    
    return filteredDates.map(date => {
      const unemploymentPoint = unemployment.find(d => d.date === date);
      const retailPoint = retail.find(d => d.date === date);
      
      return {
        date,
        unemployment: unemploymentPoint?.value || null,
        retailSales: retailPoint?.value || null
      };
    }).filter(d => d.unemployment !== null || d.retailSales !== null);
  };

  // Get processed data
  const interestRateData = processInterestRateData();
  const growthCorporateData = processGrowthCorporateData();
  const inflationMonetaryData = processInflationMonetaryData();
  const laborConsumerData = processLaborConsumerData();

  // Updated latest values with corporate profits
  const getLatestValues = () => {
    if (!macroData) return {
      twoYear: { value: 'N/A', date: '' },
      tenYear: { value: 'N/A', date: '' },
      thirtyYear: { value: 'N/A', date: '' },
      gdpGrowth: { value: 'N/A', date: '' },
      corporateProfits: { value: 'N/A', date: '' },
      cpi: { value: 'N/A', date: '' },
      pce: { value: 'N/A', date: '' },
      m2Supply: { value: 'N/A', date: '' },
      unemployment: { value: 'N/A', date: '' },
      retailSales: { value: 'N/A', date: '' }
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
      m2Supply: latestDate(latestMonetary.m2Growth),
      unemployment: latestDate(latestLabor.unemployment),
      retailSales: latestDate(latestLabor.retailSales)
    };
  };

  const latestValues = getLatestValues();

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Enhanced investment descriptions
  const getInvestmentDescription = (chartId) => {
    const safeParseFloat = (value) => {
      if (!value || value === 'N/A') return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const twoYearValue = safeParseFloat(latestValues.twoYear?.value);
    const tenYearValue = safeParseFloat(latestValues.tenYear?.value);
    const gdpValue = safeParseFloat(latestValues.gdpGrowth?.value);
    const profitsValue = safeParseFloat(latestValues.corporateProfits?.value);
    const pceValue = safeParseFloat(latestValues.pce?.value);
    const m2Value = safeParseFloat(latestValues.m2Supply?.value);
    const unemploymentValue = safeParseFloat(latestValues.unemployment?.value);

    const descriptions = {
      'interest-rates': {
        basic: "Higher interest rates make bonds more attractive but can hurt stock prices. When rates rise, growth stocks often underperform value stocks.",
        advanced: `The 2Y-10Y spread is ${(tenYearValue - twoYearValue).toFixed(2)}bp. ${tenYearValue < twoYearValue ? 'Inverted yield curve historically signals recession within 12-18 months. Consider defensive sectors and quality bonds.' : 'Normal yield curve supports financial sector performance and suggests economic expansion ahead.'}`
      },
      'growth-corporate': {
        basic: `GDP growth of ${latestValues.gdpGrowth?.value || 'N/A'}% with corporate profits ${profitsValue > 0 ? 'growing' : profitsValue < 0 ? 'declining' : 'flat'} at ${latestValues.corporateProfits?.value || 'N/A'}% YoY. ${gdpValue > 2 ? 'Strong growth supports cyclical and growth stocks' : gdpValue < 0 ? 'Economic contraction favors defensive sectors and quality bonds' : 'Moderate growth suggests balanced portfolio allocation'}.`,
        advanced: `GDP at ${latestValues.gdpGrowth?.value || 'N/A'}%, corporate profits ${latestValues.corporateProfits?.value || 'N/A'}% YoY. ${profitsValue > 10 ? 'Strong profit growth supports equity valuations - favor quality growth and cyclical sectors. ' : profitsValue < -5 ? 'Declining profits signal earnings pressure - reduce equity exposure, increase defensive allocations. ' : 'Moderate profit growth supports current equity valuations. '}${gdpValue < 0 && profitsValue < 0 ? 'Both GDP and profits declining - consider recession hedges, utilities, and long-duration Treasuries.' : 'Economic fundamentals support balanced equity exposure.'}`
      },
      'inflation-monetary': {
        basic: `Inflation at ${latestValues.pce?.value || 'N/A'}% (PCE) with M2 money supply ${m2Value > 0 ? 'growing' : m2Value < 0 ? 'contracting' : 'stable'} at ${latestValues.m2Supply?.value || 'N/A'}% YoY. ${pceValue > 3 ? 'High inflation pressures favor real assets and inflation-protected securities' : 'Controlled inflation supports balanced portfolios'}.`,
        advanced: `PCE at ${latestValues.pce?.value || 'N/A'}%, M2 growing ${latestValues.m2Supply?.value || 'N/A'}% YoY. ${m2Value < -2 ? 'Contracting money supply signals tight policy - favor long-duration assets if rates peak. ' : m2Value > 8 ? 'Rapid money growth may drive inflation - favor real assets, commodities, REITs. ' : 'Moderate money growth supports balanced allocations. '}${pceValue > 3 ? 'Above-target inflation - consider TIPS, energy, materials, and international exposure.' : pceValue < 2 ? 'Below-target inflation suggests potential rate cuts - favor growth stocks and duration assets.' : 'Inflation near Fed target supports diversified portfolios.'}`
      },
      'labor-consumer': {
        basic: `Unemployment at ${latestValues.unemployment?.value || 'N/A'}% with retail sales ${latestValues.retailSales?.value === 'N/A' ? 'data pending' : `growing ${latestValues.retailSales?.value}% YoY`}. ${unemploymentValue < 4 ? 'Tight labor market supports consumer spending and cyclical stocks' : unemploymentValue > 5 ? 'Weakening employment suggests defensive positioning' : 'Balanced labor conditions support broad market exposure'}.`,
        advanced: `Unemployment at ${latestValues.unemployment?.value || 'N/A'}%, retail sales ${latestValues.retailSales?.value || 'N/A'}% YoY. ${unemploymentValue < 4 ? 'Tight labor market drives wage inflation and consumer strength - favor consumer discretionary, but monitor Fed policy response. ' : unemploymentValue > 5 ? 'Labor market weakness emerging - reduce cyclical exposure, increase utilities, staples, and defensive growth. ' : 'Stable employment supports balanced allocations. '}Monitor for inflection points in employment trends as leading economic indicator.`
      }
    };
    return descriptions[chartId] || { basic: '', advanced: '' };
  };

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
      case 'inflation-monetary':
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">CPI:</span> {latestValues.cpi.value}% <span className="text-xs text-gray-500">({latestValues.cpi.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">PCE:</span> {latestValues.pce.value}% <span className="text-xs text-gray-500">({latestValues.pce.date})</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">M2 Supply:</span> {latestValues.m2Supply.value}% <span className="text-xs text-gray-500">({latestValues.m2Supply.date})</span>
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

  // IMPROVED: Better dual-axis domain calculation with proper ranges
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
      
      // Ensure minimum visual range for readability
      const padding = Math.max(range * 0.15, minRange * 0.25);
      
      // Round to clean decimal places to avoid floating point issues
      const cleanMin = Math.round((min - padding) * 10) / 10;
      const cleanMax = Math.round((max + padding) * 10) / 10;
      
      return [cleanMin, cleanMax];
    };
    
    return {
      left: calculateDomainWithMinRange(leftValues, 1.5),   // Unemployment - ensure at least 1.5% range
      right: calculateDomainWithMinRange(rightValues, 3.0)  // Retail Sales - ensure at least 3% range
    };
  };

  // Tick formatters for clean Y-axis display
  const formatLeftYAxisTick = (value) => {
    // Handle very small numbers and floating point precision issues
    if (Math.abs(value) < 0.01) return '0.0%';
    return `${parseFloat(value.toFixed(1))}%`;
  };

  const formatRightYAxisTick = (value) => {
    // Handle very small numbers and floating point precision issues
    if (Math.abs(value) < 0.01) return '0.0%';
    return `${parseFloat(value.toFixed(1))}%`;
  };

  // Enhanced chart rendering with new layouts
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

      case 'inflation-monetary':
        const inflationDomain = calculateDomain(inflationMonetaryData, ['cpi', 'pce', 'm2Supply']);
        
        return (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={inflationMonetaryData} margin={chartMargin}>
                <defs>
                  <linearGradient id="m2Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.floor(Math.max(1, inflationMonetaryData.length / 8))}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={inflationDomain}
                  label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="cpi" stroke="#ef4444" name="CPI (YoY)" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="pce" stroke="#f59e0b" name="PCE (YoY)" strokeWidth={2} dot={false} connectNulls />
                <Area type="monotone" dataKey="m2Supply" stroke="#8b5cf6" fill="url(#m2Gradient)" name="M2 Money Supply" strokeWidth={3} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'labor-consumer':
        // Use the improved dual-axis domain calculation function
        const domains = calculateDualAxisDomains(
          laborConsumerData, 
          ['unemployment'], 
          ['retailSales']
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
                  label={{ value: 'Retail Sales YoY (%)', angle: 90, position: 'insideRight' }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatRightYAxisTick}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="unemployment" fill="#fef3c7" stroke="#f59e0b" name="Unemployment Rate" strokeWidth={2} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="retailSales" stroke="#3b82f6" name="Retail Sales (YoY)" strokeWidth={2} dot={false} connectNulls />
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
  const description = getInvestmentDescription(currentChart.id);

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
                basicContent={description.basic}
                advancedContent={description.advanced}
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
        
        {/* Investment-Focused Description */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Investment Implications</h4>
          <p className="text-sm text-blue-800">
            {viewMode === 'basic' ? description.basic : description.advanced}
          </p>
          {currentChart.id === 'growth-corporate' && (
            <p className="text-xs text-blue-700 mt-2 italic">
              ✅ RELEASE DATES: GDP and Corporate Profits data shows actual BEA release dates, not quarter periods.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroeconomicCarousel;