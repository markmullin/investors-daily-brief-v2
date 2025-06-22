import React, { useState, useEffect } from 'react';
import MacroIndicatorCarousel from './MacroIndicatorCarousel';
import { macroeconomicApi } from '../../services/api';
import treasuryService from '../../services/treasuryService';
import { AlertCircle } from 'lucide-react';

/**
 * Helper function to clean decimal values - SAFETY NET for messy API data
 */
const cleanDecimalValue = (value) => {
  if (typeof value !== 'number') return value;
  return parseFloat(value.toFixed(2));
};

/**
 * Helper function to clean entire dataset
 */
const cleanDataset = (dataset) => {
  if (!Array.isArray(dataset)) return dataset;
  return dataset.map(item => ({
    ...item,
    value: cleanDecimalValue(item.value)
  }));
};

/**
 * Macroeconomic Environment component that displays leading and lagging economic indicators
 * from the backend API (which uses FRED and Treasury Data)
 */
const MacroeconomicEnvironment = () => {
  const [activeTab, setActiveTab] = useState('leading');
  const [leadingData, setLeadingData] = useState({});
  const [laggingData, setLaggingData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FRED series IDs (matching backend)
  const LEADING_INDICATORS = {
    OECD_CLI: 'USALOLITONOSTSAM',
    LEADING_INDEX: 'USSLIND',
    CFNAI: 'CFNAI',
    US_DOLLAR: 'DTWEXBGS',
    TREASURY_10Y: 'DGS10'
  };

  const LAGGING_INDICATORS = {
    UNEMPLOYMENT: 'UNRATE',
    GDP: 'A191RL1Q225SBEA',
    CPI: 'CPIAUCSL',
    PCE: 'PCEPI',
    BBK: 'BBKMCOIN',
    BBK_LAGGING: 'BBKMCLA',
    LABOR_CONSUMER: 'LABOR_CONSUMER_HEALTH' // Special combined indicator
  };

  // Leading indicators metadata
  const leadingIndicators = [
    {
      id: LEADING_INDICATORS.OECD_CLI,
      name: 'OECD CLI',
      title: 'OECD Composite Leading Indicator',
      description: 'Designed to provide early signals of turning points in business cycles, showing fluctuations in economic activity',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      isGrowthRate: true
    },
    {
      id: LEADING_INDICATORS.LEADING_INDEX,
      name: 'Leading Index',
      title: 'Leading Index for United States',
      description: 'Predicts the six-month growth rate of the coincident index, forecasting future economic activity',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      isGrowthRate: true
    },
    {
      id: LEADING_INDICATORS.CFNAI,
      name: 'Chicago Fed National Activity Index',
      title: 'Chicago Fed National Activity Index',
      description: 'Designed to gauge overall economic activity and related inflationary pressure',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      threshold: 0,
      isGrowthRate: true
    },
    {
      id: LEADING_INDICATORS.US_DOLLAR,
      name: 'US Dollar Index',
      title: 'US Dollar Index',
      description: 'The value of the US dollar relative to a basket of foreign currencies',
      chartType: 'line',
      valueType: 'dollar_index',
      desiredTrend: 'stable',
      isGrowthRate: false,
      source: 'treasury'
    },
    {
      id: LEADING_INDICATORS.TREASURY_10Y,
      name: '10-Year Treasury Yield',
      title: '10-Year Treasury Constant Maturity Rate',
      description: 'Interest rate on U.S. Treasury debt with a 10-year maturity, considered a key indicator of economic expectations and inflation',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'stable',
      isAlreadyPercent: true,
      source: 'treasury'
    }
  ];

  // Lagging indicators metadata
  const laggingIndicators = [
    {
      id: LAGGING_INDICATORS.UNEMPLOYMENT,
      name: 'Unemployment Rate',
      title: 'Unemployment Rate',
      description: 'Percentage of the labor force that is unemployed and actively seeking employment',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'lower',
      isAlreadyPercent: true
    },
    {
      id: LAGGING_INDICATORS.GDP,
      name: 'GDP Growth Rate',
      title: 'Real GDP Growth Rate',
      description: 'The percentage change in inflation-adjusted value of goods and services produced by the economy',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      yoy: false, // Backend already provides growth rates
      isGrowthRate: true
    },
    {
      id: LAGGING_INDICATORS.CPI,
      name: 'CPI Change',
      title: 'Consumer Price Index (% Change)',
      description: 'Percent change in the price level of a weighted average market basket of consumer goods and services',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'stable',
      yoy: true,
      isGrowthRate: true
    },
    {
      id: LAGGING_INDICATORS.PCE,
      name: 'PCE Change',
      title: 'Personal Consumption Expenditures (% Change)',
      description: 'Percent change in prices for household goods and services; the Federal Reserve\'s preferred inflation gauge',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'stable',
      yoy: true,
      isGrowthRate: true
    },
    {
      id: LAGGING_INDICATORS.BBK,
      name: 'BBK Index',
      title: 'Brave-Butters-Kelley Coincident Index',
      description: 'A model-based measure of economic activity; values are expressed as standard deviations from trend',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      isGrowthRate: true
    },
    {
      id: LAGGING_INDICATORS.BBK_LAGGING,
      name: 'BBK Lagging GDP',
      title: 'Brave-Butters-Kelley Lagging Component (% Change)',
      description: 'The rate of change in the lagging subcomponent of GDP cycle, expressed in annualized real GDP growth equivalent units',
      chartType: 'line',
      valueType: 'percent',
      desiredTrend: 'higher',
      isGrowthRate: true
    },
    // FIXED: Added special Labor Market & Consumer Health dual-axis indicator
    {
      id: LAGGING_INDICATORS.LABOR_CONSUMER,
      name: 'Labor Market & Consumer Health',
      title: 'Labor Market & Consumer Health',
      description: 'Employment & Spending indicators combined to show labor market strength and consumer activity',
      chartType: 'dual-axis',
      valueType: 'dual',
      desiredTrend: 'stable',
      isDualAxis: true,
      leftAxis: {
        dataKey: 'unemployment',
        label: 'Unemployment Rate',
        color: '#f59e0b',
        unit: '%'
      },
      rightAxis: {
        dataKey: 'retailSales',
        label: 'Retail Sales (YoY)',
        color: '#3b82f6',
        unit: '%'
      }
    }
  ];

  // Fetch data for all indicators
  useEffect(() => {
    const fetchAllIndicators = async () => {
      try {
        setLoading(true);
        
        // Fetch data from backend APIs
        const [interestRatesData, growthInflationData, laborConsumerData] = await Promise.all([
          macroeconomicApi.getInterestRates(),
          macroeconomicApi.getGrowthInflation(),
          macroeconomicApi.getLaborConsumer()
        ]);

        console.log('🔍 MACRO ENV: Raw API responses:', {
          interestRates: interestRatesData,
          growthInflation: growthInflationData,
          laborConsumer: laborConsumerData
        });

        // Combine data for leading indicators
        const leadingResults = {};
        
        // From interest rates data
        if (interestRatesData.data) {
          leadingResults[LEADING_INDICATORS.TREASURY_10Y] = cleanDataset(interestRatesData.data.DGS10 || []);
        }

        // Use Treasury service for US Dollar (if needed) - fallback
        try {
          if (!leadingResults[LEADING_INDICATORS.US_DOLLAR]) {
            const dollarData = await treasuryService.fetchDollarIndex(120);
            leadingResults[LEADING_INDICATORS.US_DOLLAR] = cleanDataset(dollarData || []);
          }
        } catch (err) {
          console.error('Error fetching dollar index:', err);
        }

        setLeadingData(leadingResults);
        
        // Combine data for lagging indicators
        const laggingResults = {};
        
        // From growth and inflation data
        if (growthInflationData.data) {
          laggingResults[LAGGING_INDICATORS.GDP] = cleanDataset(growthInflationData.data.A191RL1Q225SBEA || []);
          laggingResults[LAGGING_INDICATORS.CPI] = cleanDataset(growthInflationData.data.CPI_YOY || []);
          laggingResults[LAGGING_INDICATORS.PCE] = cleanDataset(growthInflationData.data.PCE_YOY || []);
        }

        // From labor and consumer data
        if (laborConsumerData.data) {
          // FIXED: Clean unemployment data
          const rawUnemploymentData = laborConsumerData.data.UNRATE || [];
          laggingResults[LAGGING_INDICATORS.UNEMPLOYMENT] = cleanDataset(rawUnemploymentData);
          
          // FIXED: Clean retail sales data and create combined labor market & consumer health data
          const rawRetailSalesData = laborConsumerData.data.RETAIL_YOY || [];
          const cleanRetailSalesData = cleanDataset(rawRetailSalesData);
          
          console.log('🔍 MACRO ENV: Before cleaning retail sales:', rawRetailSalesData.slice(0, 3));
          console.log('🔍 MACRO ENV: After cleaning retail sales:', cleanRetailSalesData.slice(0, 3));
          
          // Combine both datasets for dual-axis chart with EXTRA CLEANING
          laggingResults[LAGGING_INDICATORS.LABOR_CONSUMER] = laggingResults[LAGGING_INDICATORS.UNEMPLOYMENT].map(unemploymentPoint => {
            // Find matching retail sales data point
            const matchingRetailPoint = cleanRetailSalesData.find(retailPoint => 
              retailPoint.date === unemploymentPoint.date
            );
            
            return {
              date: unemploymentPoint.date,
              unemployment: parseFloat(unemploymentPoint.value.toFixed(1)), // EXTRA SAFETY: Force clean formatting
              retailSales: matchingRetailPoint ? parseFloat(matchingRetailPoint.value.toFixed(1)) : null // EXTRA SAFETY: Force clean formatting
            };
          }).filter(point => point.unemployment !== null && point.retailSales !== null);
          
          console.log('🔍 MACRO ENV: Final combined data sample:', laggingResults[LAGGING_INDICATORS.LABOR_CONSUMER].slice(0, 3));
        }

        console.log('🔍 MACRO ENV: Final processed lagging data:', laggingResults);
        setLaggingData(laggingResults);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching economic indicators:', err);
        setError('Failed to load economic indicators');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllIndicators();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Macroeconomic Environment</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      <div className="flex mb-4 border-b">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'leading' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('leading')}
        >
          Leading Indicators
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'lagging' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('lagging')}
        >
          Lagging Indicators
        </button>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : activeTab === 'leading' ? (
          <MacroIndicatorCarousel 
            indicators={leadingIndicators} 
            data={leadingData} 
          />
        ) : (
          <MacroIndicatorCarousel 
            indicators={laggingIndicators} 
            data={laggingData}
          />
        )}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm">
        <h3 className="font-semibold text-gray-700 mb-2">About Economic Indicators</h3>
        <p className="text-gray-600 mb-2">
          Economic indicators help measure the health and direction of the economy. They are categorized as:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
          <li><span className="font-medium">Leading Indicators</span>: Signal future economic events and typically change before the economy changes.</li>
          <li><span className="font-medium">Lagging Indicators</span>: Confirm trends that have already occurred and typically change after the economy changes.</li>
        </ul>
        <p className="text-gray-600 mt-2">
          Most indicators are presented as percentages or percentage changes to facilitate comparison. The US Dollar Index is shown as an absolute value as traders and analysts typically refer to it this way.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Data sources: Federal Reserve Economic Data (FRED), U.S. Treasury FiscalData API, and Federal Reserve Board.
        </p>
      </div>
    </div>
  );
};

export default MacroeconomicEnvironment;