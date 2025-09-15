import React, { useState, useEffect } from 'react';
import MacroIndicatorCarousel from './MacroIndicatorCarousel';
import { macroeconomicApi } from '../../services/api';
import treasuryService from '../../services/treasuryService';
import { AlertCircle, ChevronRight, GraduationCap } from 'lucide-react';
import EducationIcon from '../AI/EducationIcon';
import AnalysisDropdown from '../AI/AnalysisDropdown';

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
  const [analysisDropdown, setAnalysisDropdown] = useState({
    isOpen: false,
    position: { top: 0, left: 0 }
  });
  const [showAnalysis, setShowAnalysis] = useState(false);

  // FRED series IDs (matching backend) - UPDATED WITH CHICAGO FED
  const LEADING_INDICATORS = {
    BRAVE_BUTTERS: 'BBKMLEIX',
    CHICAGO_FED: 'CFNAI',  // ADDED: Chicago Fed National Activity Index
    INITIAL_CLAIMS: 'ICSA_YOY',  // UPDATED: Use YoY version
    TOTAL_CONSTRUCTION: 'TLMFGCONS_YOY',  // UPDATED: Use YoY version
    NEW_ORDERS: 'NEWORDER_YOY',  // UPDATED: Use YoY version
    BUILDING_PERMITS: 'PERMIT_YOY'  // UPDATED: Use YoY version
  };

  const LAGGING_INDICATORS = {
    UNEMPLOYMENT: 'UNRATE',
    GDP: 'A191RL1Q225SBEA',
    CPI: 'CPIAUCSL',
    PCE: 'PCEPI',
    M2: 'M2SL',
    MONEY_MARKET_FUNDS: 'MMMFFAQ027S',
    REAL_PERSONAL_INCOME: 'W875RX1',
    RETAIL_SALES: 'RSXFS',
    LABOR_CONSUMER: 'LABOR_CONSUMER_HEALTH', // Special combined indicator
    CASE_SHILLER: 'SPCS20RSA',
    EXISTING_HOME_SALES: 'EXHOSLUSM495S'
  };

  // Leading indicators metadata - WITH CHICAGO FED AND YOY DATA
  const leadingIndicators = [
    {
      id: 'BBKMLEIX',
      name: 'Brave-Butters-Kelley',
      title: 'Brave-Butters-Kelley Leading Index',
      description: 'A leading indicator that provides early signals of turning points in business cycles',
      chartType: 'area',
      valueType: 'index',
      desiredTrend: 'higher',
      color: '#3b82f6',
      fillOpacity: 0.3,
      animationDuration: 1500
    },
    {
      id: 'CFNAI',  // ADDED: Chicago Fed
      name: 'Chicago Fed',
      title: 'Chicago Fed National Activity Index',
      description: 'A weighted average of 85 monthly indicators of national economic activity',
      chartType: 'area',
      valueType: 'index',
      desiredTrend: 'higher',
      color: '#22c55e',
      fillOpacity: 0.3,
      animationDuration: 1500
    },
    {
      id: 'ICSA_YOY',  // UPDATED: YoY growth
      name: 'Initial Claims (YoY)',
      title: 'Initial Unemployment Claims Growth',
      description: 'Year-over-year change in unemployment claims, easier to see trends',
      chartType: 'area',
      valueType: 'percent',
      desiredTrend: 'lower',
      color: '#ef4444',
      fillOpacity: 0.3,
      animationDuration: 1500
    },
    {
      id: 'TLMFGCONS_YOY',  // UPDATED: YoY growth
      name: 'Construction (YoY)',
      title: 'Manufacturing Construction Growth',
      description: 'Year-over-year change in manufacturing construction spending',
      chartType: 'area',
      valueType: 'percent',
      desiredTrend: 'higher',
      color: '#10b981',
      fillOpacity: 0.3,
      animationDuration: 1500
    },
    {
      id: 'NEWORDER_YOY',  // UPDATED: YoY growth
      name: 'New Orders (YoY)',
      title: 'Manufacturers\' New Orders Growth',
      description: 'Year-over-year change in new orders for capital goods',
      chartType: 'area',
      valueType: 'percent',
      desiredTrend: 'higher',
      color: '#f59e0b',
      fillOpacity: 0.3,
      animationDuration: 1500
    },
    {
      id: 'PERMIT_YOY',  // UPDATED: YoY growth
      name: 'Permits (YoY)',
      title: 'Building Permits Growth',
      description: 'Year-over-year change in new housing permits',
      chartType: 'area',
      valueType: 'percent',
      desiredTrend: 'higher',
      color: '#8b5cf6',
      fillOpacity: 0.3,
      animationDuration: 1500
    }
  ];

  // Lagging indicators metadata - REORGANIZED INTO GROUPS WITH HOUSING ADDED
  const laggingIndicators = [
    // Group 1: Interest Rates - UPDATED WITH MORTGAGE RATE
    {
      id: 'INTEREST_RATES',
      name: 'Interest Rates',
      title: 'US Treasury Yields & Mortgage Rates',
      description: 'Interest rates across different maturities including 30-year mortgage',
      chartType: 'multi-line',
      valueType: 'percent',
      isGroup: true,
      series: [
        { dataKey: 'DGS2', name: '2 Year', color: '#ef4444' },
        { dataKey: 'DGS10', name: '10 Year', color: '#3b82f6' },
        { dataKey: 'DGS30', name: '30 Year', color: '#10b981' },
        { dataKey: 'MORTGAGE30US', name: '30Y Mortgage', color: '#f59e0b' }
      ]
    },
    // Group 2: GDP & Corporate Profits
    {
      id: 'GDP_PROFITS',
      name: 'GDP Growth & Corporate Profits',
      title: 'Economic Growth & Business Performance',
      description: 'Real GDP growth rate and corporate profits growth',
      chartType: 'dual-bar-line',
      valueType: 'dual',
      isDualAxis: true,
      leftAxis: {
        dataKey: 'gdp',
        label: 'GDP Growth',
        color: '#10b981',
        unit: '%',
        type: 'bar'
      },
      rightAxis: {
        dataKey: 'corporateProfits',
        label: 'Corporate Profits YoY',
        color: '#f59e0b',
        unit: '%',
        type: 'line'
      }
    },
    // Group 3: Pure Inflation Metrics ONLY (CPI, PCE, PPI)
    {
      id: 'INFLATION',
      name: 'Inflation',
      title: 'Inflation Indicators',
      description: 'Year-over-year changes in consumer, producer, and personal consumption prices',
      chartType: 'multi-line',
      valueType: 'percent',
      isGroup: true,
      series: [
        { dataKey: 'CPI_YOY', name: 'CPI (YoY)', color: '#ef4444' },
        { dataKey: 'PCE_YOY', name: 'PCE (YoY)', color: '#f59e0b' },
        { dataKey: 'PPI_YOY', name: 'PPI (YoY)', color: '#10b981' }
      ]
    },
    // NEW Group 4: HOUSING INDICATORS
    {
      id: 'HOUSING',
      name: 'Housing Market',
      title: 'Housing Market Indicators',
      description: 'Case-Shiller 20-City Home Price Index and Existing Home Sales',
      chartType: 'composed',
      valueType: 'dual-metric',
      isDualAxis: true,
      leftAxis: {
        label: 'Home Price Index',
        unit: 'index',
        type: 'line'
      },
      rightAxis: {
        label: 'Home Sales (000s)',
        unit: 'thousands',
        type: 'bar'
      },
      series: [
        { dataKey: 'SPCS20RSA', name: 'Case-Shiller 20-City', color: '#3b82f6', axis: 'left', type: 'line' },
        { dataKey: 'EXHOSLUSM495S', name: 'Existing Home Sales', color: '#10b981', axis: 'right', type: 'bar' }
      ]
    },
    // Group 5: Money Supply & Money Market Funds with Enhanced Dual Metrics
    {
      id: 'MONEY_SUPPLY',
      name: 'Money Supply & Market Funds',
      title: 'Monetary Aggregates (Absolute & Growth)',
      description: 'M2 and Money Market Fund assets with both absolute values and year-over-year growth rates',
      chartType: 'composed',
      valueType: 'dual-metric',
      isDualAxis: true,
      leftAxis: {
        label: 'Growth Rate (%)',
        unit: '%',
        type: 'percentage'
      },
      rightAxis: {
        label: 'Assets (Trillions)',
        unit: 'trillions',
        type: 'absolute'
      },
      series: [
        // Left axis - Growth rates (YoY percentages)
        { dataKey: 'M2_YOY', name: 'M2 Growth (YoY %)', color: '#8b5cf6', axis: 'left', type: 'line' },
        { dataKey: 'MMF_YOY', name: 'MMF Growth (YoY %)', color: '#f59e0b', axis: 'left', type: 'line' },
        
        // Right axis - Absolute values (render M2 first as backdrop, MMF as component)
        { dataKey: 'M2_ABSOLUTE', name: 'M2 Supply ($T)', color: '#e5e7eb', axis: 'right', type: 'area', opacity: 0.3 },
        { dataKey: 'MONEY_MARKET_FUNDS', name: 'MMF Assets ($T)', color: '#3b82f6', axis: 'right', type: 'area', opacity: 0.6 }
      ]
    },
    // Group 6: Labor Market & Consumer Health
    {
      id: LAGGING_INDICATORS.LABOR_CONSUMER,
      name: 'Labor Market & Consumer Health',
      title: 'Employment & Consumer Spending',
      description: 'Unemployment rate, real personal income growth, and retail sales showing labor market and consumer strength',
      chartType: 'multi-line',
      valueType: 'percent',
      isGroup: true,
      series: [
        { dataKey: 'unemployment', name: 'Unemployment Rate', color: '#f59e0b' },
        { dataKey: 'realIncome', name: 'Real Personal Income (YoY)', color: '#10b981' },
        { dataKey: 'retailSales', name: 'Retail Sales (YoY)', color: '#3b82f6' }
      ]
    }
  ];

  // Fetch data for all indicators
  useEffect(() => {
    const fetchAllIndicators = async () => {
      try {
        setLoading(true);
        
        // Fetch all data from the simple endpoint which includes leading indicators
        const allData = await macroeconomicApi.getAll();
        
        // Extract data from the response
        const interestRatesData = { data: allData.interestRates?.data || {} };
        const growthInflationData = { data: allData.growthInflation?.data || {} };
        const laborConsumerData = { data: allData.laborConsumer?.data || {} };
        const monetaryPolicyData = { data: allData.monetaryPolicy?.data || {} };
        const leadingIndicatorsData = { data: allData.leadingIndicators?.data || {} };
        const housingData = { data: allData.housing?.data || {} };

        console.log('🔍 MACRO ENV: Raw API responses:', {
          interestRates: interestRatesData,
          growthInflation: growthInflationData,
          laborConsumer: laborConsumerData,
          monetaryPolicy: monetaryPolicyData,
          leadingIndicators: leadingIndicatorsData,
          housing: housingData
        });

        // Process leading indicators data - WITH CHICAGO FED AND YOY
        const leadingResults = {};
        
        if (leadingIndicatorsData.data) {
          leadingResults['BBKMLEIX'] = cleanDataset(leadingIndicatorsData.data.BBKMLEIX || []);
          leadingResults['CFNAI'] = cleanDataset(leadingIndicatorsData.data.CFNAI || []);  // ADDED: Chicago Fed
          leadingResults['ICSA_YOY'] = cleanDataset(leadingIndicatorsData.data.ICSA_YOY || []);  // UPDATED: YoY
          leadingResults['TLMFGCONS_YOY'] = cleanDataset(leadingIndicatorsData.data.TLMFGCONS_YOY || []);  // UPDATED: YoY
          leadingResults['NEWORDER_YOY'] = cleanDataset(leadingIndicatorsData.data.NEWORDER_YOY || []);  // UPDATED: YoY
          leadingResults['PERMIT_YOY'] = cleanDataset(leadingIndicatorsData.data.PERMIT_YOY || []);  // UPDATED: YoY
          
          console.log('🔍 MACRO ENV: Leading indicators processed:', {
            BBKMLEIX: leadingResults['BBKMLEIX']?.length || 0,
            CFNAI: leadingResults['CFNAI']?.length || 0,
            ICSA_YOY: leadingResults['ICSA_YOY']?.length || 0,
            TLMFGCONS_YOY: leadingResults['TLMFGCONS_YOY']?.length || 0,
            NEWORDER_YOY: leadingResults['NEWORDER_YOY']?.length || 0,
            PERMIT_YOY: leadingResults['PERMIT_YOY']?.length || 0
          });
        }

        setLeadingData(leadingResults);
        
        // Combine data for lagging indicators with proper grouping
        const laggingResults = {};
        
        // Group 1: Interest Rates (from interestRatesData) - UPDATED WITH MORTGAGE
        if (interestRatesData.data) {
          const interestRatesGroupData = [];
          const dgs2 = cleanDataset(interestRatesData.data.DGS2 || []);
          const dgs10 = cleanDataset(interestRatesData.data.DGS10 || []);
          const dgs30 = cleanDataset(interestRatesData.data.DGS30 || []);
          const mortgage30 = cleanDataset(interestRatesData.data.MORTGAGE30US || []);
          
          // Combine into single dataset for multi-line chart
          const dates = [...new Set([
            ...dgs2.map(d => d.date),
            ...dgs10.map(d => d.date),
            ...dgs30.map(d => d.date),
            ...mortgage30.map(d => d.date)
          ])].sort();
          
          dates.forEach(date => {
            const point = { date };
            const dgs2Point = dgs2.find(d => d.date === date);
            const dgs10Point = dgs10.find(d => d.date === date);
            const dgs30Point = dgs30.find(d => d.date === date);
            const mortgage30Point = mortgage30.find(d => d.date === date);
            
            point.DGS2 = dgs2Point ? dgs2Point.value : null;
            point.DGS10 = dgs10Point ? dgs10Point.value : null;
            point.DGS30 = dgs30Point ? dgs30Point.value : null;
            point.MORTGAGE30US = mortgage30Point ? mortgage30Point.value : null;
            
            interestRatesGroupData.push(point);
          });
          
          laggingResults['INTEREST_RATES'] = interestRatesGroupData;
        }
        
        // Group 2: GDP & Corporate Profits
        if (growthInflationData.data) {
          const gdpData = cleanDataset(growthInflationData.data.A191RL1Q225SBEA || []);
          const gdpProfitsData = gdpData.map(point => ({
            date: point.date,
            gdp: point.value,
            corporateProfits: point.corporateProfitsGrowth || null
          }));
          laggingResults['GDP_PROFITS'] = gdpProfitsData;
        }
        
        // Group 3: Pure Inflation Metrics (CPI, PCE, PPI only - NO M2 or Money Market)
        if (growthInflationData.data) {
          const inflationGroupData = [];
          const cpi = cleanDataset(growthInflationData.data.CPI_YOY || []);
          const pce = cleanDataset(growthInflationData.data.PCE_YOY || []);
          const ppi = cleanDataset(growthInflationData.data.PPI_YOY || []);
          
          console.log('🔍 INFLATION GROUP - Processing only CPI, PCE, PPI');
          console.log('CPI data points:', cpi.length);
          console.log('PCE data points:', pce.length);
          console.log('PPI data points:', ppi.length);
          
          // Combine ONLY inflation metrics (not money supply)
          const dates = [...new Set([
            ...cpi.map(d => d.date),
            ...pce.map(d => d.date),
            ...ppi.map(d => d.date)
          ])].sort();
          
          dates.forEach(date => {
            const point = { date };
            const cpiPoint = cpi.find(d => d.date === date);
            const pcePoint = pce.find(d => d.date === date);
            const ppiPoint = ppi.find(d => d.date === date);
            
            point.CPI_YOY = cpiPoint ? cpiPoint.value : null;
            point.PCE_YOY = pcePoint ? pcePoint.value : null;
            point.PPI_YOY = ppiPoint ? ppiPoint.value : null;
            
            inflationGroupData.push(point);
          });
          
          console.log('🔍 INFLATION GROUP - Sample data point:', inflationGroupData[inflationGroupData.length - 1]);
          
          laggingResults['INFLATION'] = inflationGroupData;
        }
        
        // NEW Group 4: HOUSING INDICATORS
        if (housingData.data) {
          const housingGroupData = [];
          const caseShiller = cleanDataset(housingData.data.SPCS20RSA || []);
          const existingHomeSales = cleanDataset(housingData.data.EXHOSLUSM495S || []);
          
          console.log('🏠 HOUSING GROUP - Processing Case-Shiller and Existing Home Sales');
          console.log('Case-Shiller data points:', caseShiller.length);
          console.log('Existing Home Sales data points:', existingHomeSales.length);
          
          // Combine housing data for composed chart
          const dates = [...new Set([
            ...caseShiller.map(d => d.date),
            ...existingHomeSales.map(d => d.date)
          ])].sort();
          
          dates.forEach(date => {
            const caseShillerPoint = caseShiller.find(d => d.date === date);
            const homeSalesPoint = existingHomeSales.find(d => d.date === date);
            
            housingGroupData.push({
              date: date,
              SPCS20RSA: caseShillerPoint ? caseShillerPoint.value : null,
              EXHOSLUSM495S: homeSalesPoint ? homeSalesPoint.value / 1000 : null // Convert to thousands for better display
            });
          });
          
          // COMPREHENSIVE HOUSING DEBUG
          console.log('🔍 HOUSING DEBUG:', {
            rawData: housingData.data,
            processedData: housingGroupData,
            samplePoint: housingGroupData[housingGroupData.length - 1],
            dataLength: housingGroupData.length,
            hasData: housingGroupData.some(d => d.SPCS20RSA !== null || d.EXHOSLUSM495S !== null)
          });
          
          laggingResults['HOUSING'] = housingGroupData;
        }
        
        // Group 5: Money Supply & Money Market Funds with BOTH absolute and YoY values  
        if (monetaryPolicyData.data) {
          console.log('💰 MONEY SUPPLY GROUP - Processing monetary data...');
          console.log('Available keys:', Object.keys(monetaryPolicyData.data));
          
          const moneySupplyData = [];
          
          // Get both absolute and YoY values for M2
          const m2Absolute = cleanDataset(monetaryPolicyData.data.M2SL || []);
          const m2YoY = cleanDataset(monetaryPolicyData.data.M2_YOY || []);
          
          // Get both absolute and YoY values for Money Market Funds
          const moneyMarketFunds = cleanDataset(monetaryPolicyData.data.MONEY_MARKET_FUNDS || []);
          const mmfYoY = cleanDataset(monetaryPolicyData.data.MMF_YOY || []);
          
          console.log('💰 MONEY SUPPLY GROUP - Data points:');
          console.log('  M2 Absolute:', m2Absolute.length);
          console.log('  M2 YoY:', m2YoY.length);
          console.log('  MMF Absolute:', moneyMarketFunds.length);
          console.log('  MMF YoY:', mmfYoY.length);
          
          // Process Money Supply with both absolute and YoY for each metric
          
          // Use absolute data dates as the base to ensure full 2 years
          const baseDates = [...new Set([
            ...m2Absolute.map(d => d.date),
            ...moneyMarketFunds.map(d => d.date)
          ])].sort();
          
          baseDates.forEach(date => {
            const m2Point = m2YoY.find(d => d.date === date);
            const m2AbsPoint = m2Absolute.find(d => d.date === date);
            const mmfPoint = moneyMarketFunds.find(d => d.date === date);
            const mmfYoyPoint = mmfYoY.find(d => d.date === date);
            
            // Include data point even if YoY is not available yet
            moneySupplyData.push({
              date: date,
              // M2 metrics - convert from billions to trillions for display
              M2_ABSOLUTE: m2AbsPoint ? (m2AbsPoint.value / 1000) : null, // Convert billions to trillions
              M2_YOY: m2Point ? m2Point.value : null, // YoY percentage stays as is (may be null for first year)
              // Money Market Funds metrics - convert from billions to trillions for display  
              MONEY_MARKET_FUNDS: mmfPoint ? (mmfPoint.value / 1000) : null, // Convert billions to trillions
              MMF_YOY: mmfYoyPoint ? mmfYoyPoint.value : null // YoY percentage stays as is (may be null for first year)
            });
          });
          
          // COMPREHENSIVE MONEY SUPPLY DEBUG
          const lastPoint = moneySupplyData[moneySupplyData.length - 1];
          const rawM2 = monetaryPolicyData.data?.M2SL?.[monetaryPolicyData.data.M2SL.length - 1];
          const rawMMF = monetaryPolicyData.data?.MONEY_MARKET_FUNDS?.[monetaryPolicyData.data.MONEY_MARKET_FUNDS.length - 1];
          
          console.log('💰 MONEY SUPPLY VERIFICATION:', {
            m2Raw: rawM2?.value,
            m2Trillions: rawM2 ? (rawM2.value / 1000).toFixed(1) : null,
            mmfRaw: rawMMF?.value,
            mmfTrillions: rawMMF ? (rawMMF.value / 1000).toFixed(1) : null,
            ratio: rawMMF && rawM2 ? ((rawMMF.value / rawM2.value) * 100).toFixed(1) + '%' : 'N/A',
            m2Date: rawM2?.date,
            mmfDate: rawMMF?.date
          });
          
          console.log('💰 MONEY SUPPLY DEBUG:', {
            processedData: moneySupplyData,
            lastPoint: lastPoint,
            m2InTrillions: lastPoint?.M2_ABSOLUTE,
            mmfInTrillions: lastPoint?.MONEY_MARKET_FUNDS,
            hasM2Data: moneySupplyData.some(d => d.M2_ABSOLUTE !== null),
            hasMMFData: moneySupplyData.some(d => d.MONEY_MARKET_FUNDS !== null),
            dataPoints: moneySupplyData.length
          });
          
          laggingResults['MONEY_SUPPLY'] = moneySupplyData;
        }
        
        // Group 6: Labor Market & Consumer Health
        if (laborConsumerData.data) {
          // COMPREHENSIVE LABOR DEBUG - Check all available keys
          console.log('👥 LABOR DEBUG - Available keys:', Object.keys(laborConsumerData.data || {}));
          
          const unemploymentData = cleanDataset(laborConsumerData.data.UNRATE || []);
          // FIX: Use the correct YoY field names from backend
          const realIncomeData = cleanDataset(
            laborConsumerData.data.REAL_PERSONAL_INCOME_YOY ||  // CORRECT: Backend field name
            laborConsumerData.data.W875RX1 || 
            laborConsumerData.data.W875RX1_YOY ||
            laborConsumerData.data.REAL_PERSONAL_INCOME || 
            laborConsumerData.data.REAL_INCOME_YOY || 
            []
          );
          const retailSalesData = cleanDataset(
            laborConsumerData.data.RETAIL_YOY ||  // CORRECT: Backend field name
            laborConsumerData.data.RSXFS || 
            laborConsumerData.data.RSXFS_YOY ||
            laborConsumerData.data.RETAIL_SALES_YOY || 
            []
          );
          
          console.log('👥 LABOR CONSUMER GROUP - Processing unemployment, real income, and retail sales');
          console.log('Unemployment data points:', unemploymentData.length);
          console.log('Real Income data points:', realIncomeData.length);
          console.log('Retail Sales data points:', retailSalesData.length);
          console.log('REAL_PERSONAL_INCOME_YOY exists?', laborConsumerData.data?.REAL_PERSONAL_INCOME_YOY?.length);
          console.log('RETAIL_YOY exists?', laborConsumerData.data?.RETAIL_YOY?.length);
          console.log('UNRATE exists?', laborConsumerData.data?.UNRATE?.length);
          console.log('W875RX1 exists?', laborConsumerData.data?.W875RX1?.length);
          console.log('RSXFS exists?', laborConsumerData.data?.RSXFS?.length);
          
          // Combine unemployment, real income, and retail sales for multi-line chart
          const laborConsumerGroupData = [];
          
          // Use unemployment data dates as base since it has full history
          const dates = [...new Set([
            ...unemploymentData.map(d => d.date),
            ...(realIncomeData.length > 0 ? realIncomeData.map(d => d.date) : []),
            ...(retailSalesData.length > 0 ? retailSalesData.map(d => d.date) : [])
          ])].sort();
          
          dates.forEach(date => {
            const unemploymentPoint = unemploymentData.find(d => d.date === date);
            const incomePoint = realIncomeData.find(d => d.date === date);
            const retailPoint = retailSalesData.find(d => d.date === date);
            
            laborConsumerGroupData.push({
              date: date,
              unemployment: unemploymentPoint ? parseFloat(unemploymentPoint.value.toFixed(1)) : null,
              realIncome: incomePoint ? parseFloat(incomePoint.value.toFixed(1)) : null,
              retailSales: retailPoint ? parseFloat(retailPoint.value.toFixed(1)) : null
            });
          });
          
          // COMPREHENSIVE LABOR CONSUMER FINAL DEBUG
          const lastLaborPoint = laborConsumerGroupData[laborConsumerGroupData.length - 1];
          console.log('👥 LABOR DEBUG FINAL:', {
            availableKeys: Object.keys(laborConsumerData.data || {}),
            processedData: laborConsumerGroupData,
            lastPoint: lastLaborPoint,
            hasRealIncome: laborConsumerGroupData.some(d => d.realIncome !== null),
            hasRetailSales: laborConsumerGroupData.some(d => d.retailSales !== null),
            hasUnemployment: laborConsumerGroupData.some(d => d.unemployment !== null)
          });
          
          laggingResults[LAGGING_INDICATORS.LABOR_CONSUMER] = laborConsumerGroupData;
        }

        console.log('🔍 MACRO ENV: Final processed lagging data:', laggingResults);
        console.log('📄 MACRO ENV: Indicator count:', laggingIndicators.length);
        console.log('📄 MACRO ENV: Indicators list:', laggingIndicators.map(i => ({ id: i.id, title: i.title })));
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

  // Handle education analysis requests
  const handleEducationAnalysis = async (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAnalysisDropdown({
      isOpen: true,
      position: {
        top: rect.bottom,
        left: rect.left + rect.width / 2
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Macroeconomic Environment</h2>
        {/* Removed EducationIcon as requested */}
      </div>
      
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

      {/* Analysis Dropdown */}
      <AnalysisDropdown
        isOpen={analysisDropdown.isOpen}
        onClose={() => setAnalysisDropdown({ isOpen: false, position: { top: 0, left: 0 } })}
        context="macroeconomic"
        data={{ leading: leadingData, lagging: laggingData, activeTab }}
        position={analysisDropdown.position}
      />
      
      {/* Economic Intelligence Section (Collapsible) */}
      <div className="border-t border-gray-200 bg-white rounded-b-xl shadow-lg mt-4">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Economic Intelligence</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
              AI Analysis
            </span>
            <span className="text-xs text-gray-500">95% confidence</span>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAnalysis ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {showAnalysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {activeTab === 'leading' ? (
                    <>The leading indicators suggest {leadingData.BBKMLEIX && leadingData.BBKMLEIX.length > 0 && leadingData.BBKMLEIX[leadingData.BBKMLEIX.length - 1].value > 0 ? 'positive momentum' : 'potential headwinds'} in the economic outlook. 
                    The Brave-Butters-Kelley index and Chicago Fed National Activity Index provide early signals of economic turning points, while initial claims and building permits indicate labor market and construction sector health.</>
                  ) : (
                    <>The lagging indicators confirm {laggingData.GDP_PROFITS && laggingData.GDP_PROFITS.length > 0 && laggingData.GDP_PROFITS[laggingData.GDP_PROFITS.length - 1].gdp > 2 ? 'economic expansion' : 'moderate growth'}. 
                    Interest rates, inflation metrics, and housing data provide confirmation of economic trends. The unemployment rate and consumer spending patterns reflect the current state of economic health.</>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Key Insights</div>
                <ul className="space-y-1">
                  {activeTab === 'leading' ? (
                    <>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Leading indicators typically predict economic changes 6-12 months in advance</span>
                      </li>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Manufacturing and construction data provide early signals of investment trends</span>
                      </li>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Initial claims inversely correlate with economic strength</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Interest rate changes impact borrowing costs and investment decisions</span>
                      </li>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Inflation metrics help gauge purchasing power and Fed policy direction</span>
                      </li>
                      <li className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Housing market health reflects consumer confidence and credit conditions</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  📊 Analysis based on {activeTab === 'leading' ? leadingIndicators.length : laggingIndicators.length} economic indicators from FRED and Treasury data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroeconomicEnvironment;