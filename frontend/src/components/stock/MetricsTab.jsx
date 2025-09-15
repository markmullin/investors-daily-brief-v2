import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, AlertCircle } from 'lucide-react';

const MetricsTab = ({ symbol }) => {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!symbol) return;
    
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch key metrics from FMP API
        const response = await fetch(`/api/research/metrics/${symbol}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Metrics data received:', data);
        setMetricsData(data);
      } catch (err) {
        console.error('Metrics fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [symbol]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading metrics data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading metrics: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!metricsData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No metrics data available for {symbol}</p>
      </div>
    );
  }
  
  // Extract latest data (FMP returns array, most recent first)
  const latestMetrics = Array.isArray(metricsData) ? metricsData[0] : metricsData;
  
  // Define metric categories with descriptions
  const valuationMetrics = [
    {
      label: 'P/E Ratio',
      value: latestMetrics.peRatio,
      description: 'Price to Earnings - How much investors pay per dollar of earnings',
      format: 'number'
    },
    {
      label: 'Forward P/E',
      value: latestMetrics.forwardPE,
      description: 'Price to Forward Earnings - Based on expected future earnings',
      format: 'number'
    },
    {
      label: 'P/S Ratio',
      value: latestMetrics.priceToSalesRatio,
      description: 'Price to Sales - Market cap divided by revenue',
      format: 'number'
    },
    {
      label: 'P/B Ratio',
      value: latestMetrics.priceToBookRatio,
      description: 'Price to Book - Stock price relative to book value',
      format: 'number'
    },
    {
      label: 'EV/EBITDA',
      value: latestMetrics.evToEbitda,
      description: 'Enterprise Value to EBITDA - Company value vs cash earnings',
      format: 'number'
    },
    {
      label: 'PEG Ratio',
      value: latestMetrics.pegRatio,
      description: 'P/E to Growth - P/E ratio adjusted for growth rate',
      format: 'number'
    }
  ];
  
  const profitabilityMetrics = [
    {
      label: 'ROE',
      value: latestMetrics.roe,
      description: 'Return on Equity - Profit generated from shareholder equity',
      format: 'percent'
    },
    {
      label: 'ROA',
      value: latestMetrics.roa,
      description: 'Return on Assets - How efficiently company uses assets',
      format: 'percent'
    },
    {
      label: 'ROIC',
      value: latestMetrics.roic,
      description: 'Return on Invested Capital - Returns vs capital invested',
      format: 'percent'
    },
    {
      label: 'Gross Margin',
      value: latestMetrics.grossProfitMargin,
      description: 'Gross Profit Margin - Revenue left after direct costs',
      format: 'percent'
    },
    {
      label: 'Operating Margin',
      value: latestMetrics.operatingProfitMargin,
      description: 'Operating Profit Margin - Profit from core operations',
      format: 'percent'
    },
    {
      label: 'Net Margin',
      value: latestMetrics.netProfitMargin,
      description: 'Net Profit Margin - Bottom line profitability',
      format: 'percent'
    }
  ];
  
  const liquidityMetrics = [
    {
      label: 'Current Ratio',
      value: latestMetrics.currentRatio,
      description: 'Current Assets / Current Liabilities - Short-term liquidity',
      format: 'number'
    },
    {
      label: 'Quick Ratio',
      value: latestMetrics.quickRatio,
      description: 'Liquid Assets / Current Liabilities - Immediate liquidity',
      format: 'number'
    },
    {
      label: 'Debt/Equity',
      value: latestMetrics.debtToEquity,
      description: 'Total Debt / Total Equity - Financial leverage',
      format: 'number'
    },
    {
      label: 'Interest Coverage',
      value: latestMetrics.interestCoverage,
      description: 'EBIT / Interest Expense - Ability to pay interest',
      format: 'number'
    },
    {
      label: 'FCF Yield',
      value: latestMetrics.freeCashFlowYield,
      description: 'Free Cash Flow / Market Cap - Cash generation efficiency',
      format: 'percent'
    },
    {
      label: 'Dividend Yield',
      value: latestMetrics.dividendYield,
      description: 'Annual Dividends / Stock Price - Income return',
      format: 'percent'
    }
  ];
  
  // Helper function to format values
  const formatValue = (value, format) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    switch (format) {
      case 'percent':
        return (value * 100).toFixed(2) + '%';
      case 'number':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };
  
  // Helper function to determine if metric is good/bad
  const getMetricColor = (value, metricLabel) => {
    if (value === null || value === undefined) return 'text-gray-500';
    
    // Define thresholds for different metrics
    const thresholds = {
      'ROE': { good: 0.15, warn: 0.10 },
      'ROA': { good: 0.08, warn: 0.05 },
      'ROIC': { good: 0.12, warn: 0.08 },
      'Current Ratio': { good: 1.5, warn: 1.0 },
      'Quick Ratio': { good: 1.0, warn: 0.7 },
      'Debt/Equity': { good: 0.5, warn: 1.0, inverted: true },
      'Interest Coverage': { good: 3.0, warn: 1.5 },
      'Gross Margin': { good: 0.40, warn: 0.25 },
      'Operating Margin': { good: 0.20, warn: 0.10 },
      'Net Margin': { good: 0.15, warn: 0.05 }
    };
    
    const threshold = thresholds[metricLabel];
    if (!threshold) return 'text-gray-700';
    
    if (threshold.inverted) {
      if (value <= threshold.good) return 'text-green-600';
      if (value <= threshold.warn) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= threshold.good) return 'text-green-600';
      if (value >= threshold.warn) return 'text-yellow-600';
      return 'text-red-600';
    }
  };
  
  const MetricCard = ({ metric }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{metric.label}</h4>
        <span className={`text-2xl font-bold ${getMetricColor(metric.value, metric.label)}`}>
          {formatValue(metric.value, metric.format)}
        </span>
      </div>
      <p className="text-xs text-gray-500">{metric.description}</p>
    </div>
  );
  
  return (
    <div className="space-y-8">
      {/* Header with last updated info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-900">Key Financial Metrics</h3>
          {latestMetrics.date && (
            <span className="text-sm text-blue-600">
              Last Updated: {new Date(latestMetrics.date).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Comprehensive valuation, profitability, and liquidity metrics from FMP API
        </p>
      </div>
      
      {/* Valuation Metrics */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <PieChart className="mr-2 h-6 w-6 text-blue-500" />
          Valuation Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuationMetrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>
      </div>
      
      {/* Profitability Metrics */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 h-6 w-6 text-green-500" />
          Profitability Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profitabilityMetrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>
      </div>
      
      {/* Liquidity & Financial Health */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="mr-2 h-6 w-6 text-purple-500" />
          Liquidity & Financial Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liquidityMetrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>
      </div>
      
      {/* Market Data Summary */}
      {(latestMetrics.marketCap || latestMetrics.enterpriseValue) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Data Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestMetrics.marketCap && (
              <div>
                <span className="text-sm text-gray-600">Market Cap</span>
                <p className="text-xl font-bold">${(latestMetrics.marketCap / 1000000000).toFixed(2)}B</p>
              </div>
            )}
            {latestMetrics.enterpriseValue && (
              <div>
                <span className="text-sm text-gray-600">Enterprise Value</span>
                <p className="text-xl font-bold">${(latestMetrics.enterpriseValue / 1000000000).toFixed(2)}B</p>
              </div>
            )}
            {latestMetrics.sharesOutstanding && (
              <div>
                <span className="text-sm text-gray-600">Shares Outstanding</span>
                <p className="text-xl font-bold">{(latestMetrics.sharesOutstanding / 1000000).toFixed(2)}M</p>
              </div>
            )}
            {latestMetrics.beta && (
              <div>
                <span className="text-sm text-gray-600">Beta</span>
                <p className="text-xl font-bold">{latestMetrics.beta.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsTab;
