// FMP MARKET DATA SERVICE - COMPLETE EOD REPLACEMENT + COMPREHENSIVE FUNDAMENTALS
// Enhanced with complete technical indicators and financial fundamentals + COMPLETE GROWTH TRENDS
// FIXED: BRK.B ticker formatting for FMP API

import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class FMPMarketDataService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache for real-time data
    this.baseUrl = 'https://financialmodelingprep.com/api/v3';
    this.apiKey = process.env.FMP_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ FMP_API_KEY is required but not found in environment variables');
      throw new Error('FMP_API_KEY is required but not found in environment variables');
    }
    
    console.log('✅ FMP Market Data Service initialized with Fundamentals + Complete Growth Trends + BRK.B Fix');
    console.log(`🔑 API Key configured: ${this.apiKey ? 'YES' : 'NO'}`);
  }

  // FIXED: SYMBOL NORMALIZATION - Critical fix for FMP compatibility including BRK.B
  normalizeSymbolForFMP(symbol) {
    if (!symbol) return '';
    
    let normalized = symbol
      .replace('.US', '')
      .replace('.NYSE', '')
      .replace('.NASDAQ', '')
      .toUpperCase();
    
    // FIXED: Handle BRK.B specifically - FMP uses BRK-B format
    if (normalized === 'BRK.B' || normalized === 'BRK-B') {
      normalized = 'BRK-B';
      console.log(`🔧 FIXED: BRK.B ticker converted to BRK-B for FMP API`);
    } else {
      // For other symbols, replace / with . (but not for BRK.B)
      normalized = normalized.replace('/', '.');
    }
    
    console.log(`🔄 Symbol normalized: ${symbol} → ${normalized}`);
    return normalized;
  }

  // ==================== MARKET DATA METHODS ====================

  // CORE MARKET DATA - Replaces EOD getMarketData()
  async getMarketData() {
    try {
      console.log('📊 Fetching market data from FMP...');
      
      // Your core market symbols - normalized for FMP
      const symbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'TLT'];
      const symbolString = symbols.join(',');
      
      const url = `${this.baseUrl}/quote/${symbolString}`;
      console.log(`🌐 FMP API Call: ${url}`);
      
      const response = await axios.get(url, {
        params: { apikey: this.apiKey },
        timeout: 10000
      });

      console.log(`📡 FMP Response Status: ${response.status}`);
      console.log(`📡 FMP Response Data Length: ${response.data?.length || 0}`);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`Invalid market data response from FMP: ${JSON.stringify(response.data)}`);
      }

      console.log(`✅ Retrieved market data for ${response.data.length} symbols`);
      
      return response.data.map(this.normalizeMarketData.bind(this));
      
    } catch (error) {
      console.error('❌ Error fetching market data:', error.message);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch market data from FMP: ${error.message}`);
    }
  }

  // SINGLE STOCK DATA - Replaces EOD getSingleStockData()
  async getSingleStockData(symbol) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`📊 Fetching ${normalizedSymbol} data from FMP...`);
      
      const url = `${this.baseUrl}/quote/${normalizedSymbol}`;
      console.log(`🌐 FMP API Call: ${url}`);
      
      const response = await axios.get(url, {
        params: { apikey: this.apiKey },
        timeout: 10000
      });

      console.log(`📡 FMP Response Status: ${response.status}`);
      console.log(`📡 FMP Response Data: ${JSON.stringify(response.data).substring(0, 200)}...`);

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`No data found for ${normalizedSymbol} from FMP API`);
      }

      const normalized = this.normalizeMarketData(response.data[0]);
      console.log(`✅ Retrieved data for ${normalizedSymbol}: $${normalized.price}`);
      
      return normalized;
      
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} data:`, error.message);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch ${symbol} data from FMP: ${error.message}`);
    }
  }

  // HISTORICAL PRICES - ENHANCED WITH COMPLETE TECHNICAL INDICATORS
  async getHistoricalPrices(symbol, period = '1y') {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`📈 Fetching historical data for ${normalizedSymbol} (${period})`);
      
      // Handle different period types
      if (period === '1d' || period === '5d') {
        return await this.getIntradayData(normalizedSymbol, period);
      }
      
      // For longer periods, fetch extra data for complete technical indicators
      const needsIndicators = true; // All periods except 1d/5d need indicators
      const { from, to, displayFrom } = this.getPeriodDatesWithBuffer(period, needsIndicators);
      
      console.log(`📅 Fetching range: ${from} to ${to} (display from: ${displayFrom})`);
      
      const url = `${this.baseUrl}/historical-price-full/${normalizedSymbol}`;
      console.log(`🌐 FMP API Call: ${url}?from=${from}&to=${to}`);
      
      const response = await axios.get(url, {
        params: { 
          apikey: this.apiKey,
          from,
          to
        },
        timeout: 15000
      });

      console.log(`📡 FMP Response Status: ${response.status}`);
      console.log(`📡 FMP Response Data Keys: ${Object.keys(response.data || {}).join(', ')}`);

      if (!response.data) {
        throw new Error(`No response data for ${normalizedSymbol} from FMP API`);
      }

      if (!response.data.historical || !Array.isArray(response.data.historical)) {
        console.log(`📡 FMP Response Structure: ${JSON.stringify(response.data).substring(0, 500)}...`);
        throw new Error(`No historical data array found for ${normalizedSymbol}. Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }

      if (response.data.historical.length === 0) {
        throw new Error(`Empty historical data array for ${normalizedSymbol} from FMP API`);
      }

      let data = response.data.historical
        .map(this.normalizeHistoricalData.bind(this))
        .reverse(); // FMP returns newest first, we want oldest first

      console.log(`📊 Raw data points: ${data.length}`);

      // Calculate technical indicators on the full dataset
      data = this.calculateTechnicalIndicators(data, period);
      
      // Trim to display period while preserving calculated indicators
      data = this.trimToDisplayPeriod(data, displayFrom);

      console.log(`✅ Retrieved ${data.length} display points for ${normalizedSymbol} with complete indicators`);
      console.log(`📊 Sample data point: ${JSON.stringify(data[0])}`);
      console.log(`📊 Latest data point: ${JSON.stringify(data[data.length - 1])}`);
      
      return data.map(item => ({ ...item, isDisplayed: true }));
      
    } catch (error) {
      console.error(`❌ CRITICAL ERROR fetching historical data for ${symbol}:`, error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ API Response Error:', error.response?.data || 'No response data');
      
      // Don't return empty array - throw the error so frontend can handle it properly
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
    }
  }

  // ==================== FINANCIAL FUNDAMENTALS METHODS ====================

  // COMPANY PROFILE
  async getCompanyProfile(symbol) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`🏢 Fetching company profile for ${normalizedSymbol}`);
      
      const response = await axios.get(`${this.baseUrl}/profile/${normalizedSymbol}`, {
        params: { apikey: this.apiKey },
        timeout: 10000
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`No company profile found for ${normalizedSymbol}`);
      }

      const profile = response.data[0];
      console.log(`✅ Retrieved company profile for ${profile.companyName || normalizedSymbol}`);
      
      return {
        symbol: normalizedSymbol,
        companyName: profile.companyName,
        industry: profile.industry,
        sector: profile.sector,
        description: profile.description,
        website: profile.website,
        ceo: profile.ceo,
        country: profile.country,
        marketCap: profile.mktCap,
        employees: profile.fullTimeEmployees,
        founded: profile.ipoDate
      };
      
    } catch (error) {
      console.error(`❌ Error fetching company profile for ${symbol}:`, error.message);
      return null; // Don't throw, this is optional data
    }
  }

  // INCOME STATEMENT DATA - ENHANCED WITH GROWTH BUFFER
  async getIncomeStatement(symbol, period = 'quarter', limit = 20) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`💰 Fetching income statement for ${normalizedSymbol} (${period})`);
      
      // Fetch extra quarters for complete growth calculations (add 4 quarters = 1 year)
      const fetchLimit = period === 'quarter' ? limit + 4 : limit + 1;
      console.log(`📊 Fetching ${fetchLimit} quarters for complete growth trends (displaying ${limit})`);
      
      const response = await axios.get(`${this.baseUrl}/income-statement/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey,
          period,
          limit: fetchLimit
        },
        timeout: 15000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No income statement data found for ${normalizedSymbol}`);
      }

      console.log(`✅ Retrieved ${response.data.length} ${period}ly income statements for ${normalizedSymbol}`);
      
      return response.data.map(item => ({
        date: item.date,
        period: item.period,
        revenue: item.revenue,
        costOfRevenue: item.costOfRevenue,
        grossProfit: item.grossProfit,
        grossProfitRatio: item.grossProfitRatio,
        operatingIncome: item.operatingIncome,
        operatingIncomeRatio: item.operatingIncomeRatio,
        netIncome: item.netIncome,
        netIncomeRatio: item.netIncomeRatio,
        eps: item.eps,
        epsdiluted: item.epsdiluted,
        shares: item.weightedAverageShsOut,
        sharesDialuted: item.weightedAverageShsOutDil
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching income statement for ${symbol}:`, error.message);
      throw error;
    }
  }

  // BALANCE SHEET DATA - ENHANCED WITH GROWTH BUFFER
  async getBalanceSheet(symbol, period = 'quarter', limit = 20) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`🏦 Fetching balance sheet for ${normalizedSymbol} (${period})`);
      
      // Fetch extra quarters for complete growth calculations
      const fetchLimit = period === 'quarter' ? limit + 4 : limit + 1;
      
      const response = await axios.get(`${this.baseUrl}/balance-sheet-statement/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey,
          period,
          limit: fetchLimit
        },
        timeout: 15000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No balance sheet data found for ${normalizedSymbol}`);
      }

      console.log(`✅ Retrieved ${response.data.length} ${period}ly balance sheets for ${normalizedSymbol}`);
      
      return response.data.map(item => ({
        date: item.date,
        period: item.period,
        totalAssets: item.totalAssets,
        totalLiabilities: item.totalLiabilities,
        totalEquity: item.totalStockholdersEquity,
        cash: item.cashAndCashEquivalents,
        shortTermDebt: item.shortTermDebt,
        longTermDebt: item.longTermDebt,
        totalDebt: item.totalDebt,
        inventory: item.inventory,
        accountsReceivable: item.netReceivables,
        propertyPlantEquipment: item.propertyPlantEquipmentNet
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching balance sheet for ${symbol}:`, error.message);
      throw error;
    }
  }

  // CASH FLOW STATEMENT DATA - ENHANCED WITH GROWTH BUFFER
  async getCashFlowStatement(symbol, period = 'quarter', limit = 20) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`💸 Fetching cash flow statement for ${normalizedSymbol} (${period})`);
      
      // Fetch extra quarters for complete growth calculations
      const fetchLimit = period === 'quarter' ? limit + 4 : limit + 1;
      
      const response = await axios.get(`${this.baseUrl}/cash-flow-statement/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey,
          period,
          limit: fetchLimit
        },
        timeout: 15000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No cash flow data found for ${normalizedSymbol}`);
      }

      console.log(`✅ Retrieved ${response.data.length} ${period}ly cash flow statements for ${normalizedSymbol}`);
      
      return response.data.map(item => ({
        date: item.date,
        period: item.period,
        operatingCashFlow: item.netCashProvidedByOperatingActivities,
        investingCashFlow: item.netCashUsedForInvestingActivites,
        financingCashFlow: item.netCashUsedProvidedByFinancingActivities,
        freeCashFlow: item.freeCashFlow,
        capitalExpenditure: item.capitalExpenditure,
        dividendsPaid: item.dividendsPaid
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching cash flow statement for ${symbol}:`, error.message);
      throw error;
    }
  }

  // KEY METRICS AND RATIOS
  async getKeyMetrics(symbol, period = 'quarter', limit = 20) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`📊 Fetching key metrics for ${normalizedSymbol} (${period})`);
      
      const response = await axios.get(`${this.baseUrl}/key-metrics/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey,
          period,
          limit
        },
        timeout: 15000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No key metrics data found for ${normalizedSymbol}`);
      }

      console.log(`✅ Retrieved ${response.data.length} ${period}ly key metrics for ${normalizedSymbol}`);
      
      return response.data.map(item => ({
        date: item.date,
        period: item.period,
        peRatio: item.peRatio,
        pbRatio: item.pbRatio,
        priceToSalesRatio: item.priceToSalesRatio,
        priceToFreeCashFlowsRatio: item.priceToFreeCashFlowsRatio,
        enterpriseValue: item.enterpriseValue,
        evToSales: item.enterpriseValueOverEBITDA,
        roe: item.roe,
        roa: item.roa,
        roic: item.roic,
        debtToEquity: item.debtToEquity,
        currentRatio: item.currentRatio,
        quickRatio: item.quickRatio,
        bookValuePerShare: item.bookValuePerShare,
        dividendYield: item.dividendYield,
        payoutRatio: item.payoutRatio
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching key metrics for ${symbol}:`, error.message);
      throw error;
    }
  }

  // COMPREHENSIVE FUNDAMENTALS - COMBINES ALL FINANCIAL DATA WITH COMPLETE GROWTH TRENDS
  async getFundamentals(symbol) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`🔍 Fetching comprehensive fundamentals with complete growth trends for ${normalizedSymbol}`);
      
      // Fetch all financial data in parallel - with extra data for growth calculations
      const [
        profile,
        currentQuote,
        incomeStatements,
        balanceSheets,
        cashFlowStatements,
        keyMetrics
      ] = await Promise.all([
        this.getCompanyProfile(normalizedSymbol),
        this.getSingleStockData(normalizedSymbol),
        this.getIncomeStatement(normalizedSymbol, 'quarter', 20), // Now fetches 24 quarters internally
        this.getBalanceSheet(normalizedSymbol, 'quarter', 20),
        this.getCashFlowStatement(normalizedSymbol, 'quarter', 20),
        this.getKeyMetrics(normalizedSymbol, 'quarter', 20)
      ]);

      console.log(`✅ Retrieved comprehensive fundamentals for ${normalizedSymbol}`);

      // Process the data into the expected format for the StockModal WITH COMPLETE GROWTH TRENDS
      const processedData = this.processFundamentalsDataWithCompleteGrowth({
        profile,
        currentQuote,
        incomeStatements,
        balanceSheets,
        cashFlowStatements,
        keyMetrics
      });

      return {
        symbol: normalizedSymbol,
        companyName: profile?.companyName || normalizedSymbol,
        currentPrice: currentQuote?.price,
        fundamentals: processedData.fundamentals,
        fiscalData: processedData.fiscalData,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error fetching comprehensive fundamentals for ${symbol}:`, error.message);
      throw error;
    }
  }

  // ENHANCED DATA PROCESSING WITH COMPLETE GROWTH TRENDS
  processFundamentalsDataWithCompleteGrowth({ profile, currentQuote, incomeStatements, balanceSheets, cashFlowStatements, keyMetrics }) {
    console.log(`📊 Processing fundamentals with complete growth trends - ${incomeStatements?.length || 0} income statements`);

    const fundamentals = {
      latest: {},
      growth: {},
      ratios: {}
    };

    const fiscalData = {
      Revenues: { quarterly: [] },
      NetIncomeLoss: { quarterly: [] },
      GrossMargins: { quarterly: [] },
      OperatingCashFlow: { quarterly: [] },
      CapitalExpenditures: { quarterly: [] }
    };

    // Process Income Statements WITH COMPLETE GROWTH CALCULATIONS
    if (incomeStatements && incomeStatements.length > 0) {
      // Sort by date (newest first from FMP, so reverse to get oldest first)
      const sortedIncomeStatements = [...incomeStatements].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`📊 Processing ${sortedIncomeStatements.length} income statements for complete growth trends`);
      
      // Calculate YoY growth for ALL quarters (including early ones)
      const revenueWithGrowth = sortedIncomeStatements.map((current, index) => {
        const currentDate = new Date(current.date);
        const currentYear = currentDate.getFullYear();
        const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        
        // Find same quarter from previous year
        const yoyComparison = sortedIncomeStatements.find(item => {
          const itemDate = new Date(item.date);
          const itemYear = itemDate.getFullYear();
          const itemQuarter = Math.ceil((itemDate.getMonth() + 1) / 3);
          return itemYear === currentYear - 1 && itemQuarter === currentQuarter;
        });
        
        let revenueGrowth = null;
        if (yoyComparison && yoyComparison.revenue && current.revenue) {
          revenueGrowth = ((current.revenue - yoyComparison.revenue) / yoyComparison.revenue) * 100;
        }
        
        let netIncomeGrowth = null;
        if (yoyComparison && yoyComparison.netIncome !== null && current.netIncome !== null && yoyComparison.netIncome !== 0) {
          netIncomeGrowth = ((current.netIncome - yoyComparison.netIncome) / Math.abs(yoyComparison.netIncome)) * 100;
        }
        
        return {
          ...current,
          revenueGrowth,
          netIncomeGrowth
        };
      });
      
      // Trim to display 20 quarters but keep the calculated growth values
      const displayIncomeStatements = revenueWithGrowth.slice(-20);
      
      console.log(`📈 Calculated growth for ${revenueWithGrowth.length} quarters, displaying ${displayIncomeStatements.length}`);
      console.log(`📊 First display quarter has revenue growth: ${displayIncomeStatements[0]?.revenueGrowth !== null}`);
      console.log(`📊 First display quarter has net income growth: ${displayIncomeStatements[0]?.netIncomeGrowth !== null}`);
      
      // Latest quarter data
      const latestIncome = displayIncomeStatements[displayIncomeStatements.length - 1];
      fundamentals.latest.revenue = {
        quarterly: latestIncome.revenue,
        quarterlyFormatted: this.formatCurrency(latestIncome.revenue),
        period: latestIncome.date
      };

      fundamentals.latest.netIncome = {
        quarterly: latestIncome.netIncome,
        quarterlyFormatted: this.formatCurrency(latestIncome.netIncome),
        period: latestIncome.date
      };

      fundamentals.latest.eps = {
        value: latestIncome.eps,
        formatted: `$${latestIncome.eps?.toFixed(2) || '0.00'}`
      };

      // Process quarterly revenue data for charting WITH COMPLETE GROWTH
      fiscalData.Revenues.quarterly = displayIncomeStatements.map(item => ({
        end: item.date,
        val: item.revenue || 0,
        revenueGrowth: item.revenueGrowth // This will now be available from the beginning
      }));

      // Process quarterly net income data for charting WITH COMPLETE GROWTH
      fiscalData.NetIncomeLoss.quarterly = displayIncomeStatements.map(item => ({
        end: item.date,
        val: item.netIncome || 0,
        netIncomeGrowth: item.netIncomeGrowth // NEW: Net income growth
      }));

      // Process gross margins data for charting
      fiscalData.GrossMargins.quarterly = displayIncomeStatements.map(item => ({
        end: item.date,
        grossMargin: (item.grossProfitRatio || 0) * 100 // Convert to percentage
      }));

      // Calculate latest growth rates for summary
      if (displayIncomeStatements.length >= 2) {
        const current = displayIncomeStatements[displayIncomeStatements.length - 1];
        const previous = displayIncomeStatements[displayIncomeStatements.length - 2];
        
        if (current.revenue && previous.revenue) {
          const qoqGrowth = ((current.revenue - previous.revenue) / previous.revenue) * 100;
          fundamentals.growth.quarterOverQuarter = {
            revenue: {
              growth: qoqGrowth,
              formatted: `${qoqGrowth >= 0 ? '+' : ''}${qoqGrowth.toFixed(1)}%`,
              note: `vs ${previous.period || 'previous quarter'}`
            }
          };
        }

        // Use the calculated YoY growth
        if (current.revenueGrowth !== null) {
          fundamentals.growth.yearOverYear = {
            revenue: {
              growth: current.revenueGrowth,
              formatted: `${current.revenueGrowth >= 0 ? '+' : ''}${current.revenueGrowth.toFixed(1)}%`
            }
          };
        }
      }

      // Calculate profit margin
      if (latestIncome.revenue && latestIncome.netIncome) {
        const margin = (latestIncome.netIncome / latestIncome.revenue) * 100;
        fundamentals.ratios.profitMarginQuarterly = {
          margin,
          formatted: `${margin.toFixed(1)}%`
        };
      }
    }

    // Process Cash Flow Statements
    if (cashFlowStatements && cashFlowStatements.length > 0) {
      // Trim to display 20 quarters
      const displayCashFlows = cashFlowStatements.slice(-20);
      
      fiscalData.OperatingCashFlow.quarterly = displayCashFlows.map(item => ({
        end: item.date,
        val: item.operatingCashFlow || 0
      }));

      fiscalData.CapitalExpenditures.quarterly = displayCashFlows.map(item => ({
        end: item.date,
        val: Math.abs(item.capitalExpenditure || 0) // Make positive for display
      }));
    }

    // Process Balance Sheet data
    if (balanceSheets && balanceSheets.length > 0) {
      const latestBalance = balanceSheets[balanceSheets.length - 1];
      
      fundamentals.latest.assets = {
        value: latestBalance.totalAssets,
        formatted: this.formatCurrency(latestBalance.totalAssets),
        period: latestBalance.date
      };

      fundamentals.latest.liabilities = {
        value: latestBalance.totalLiabilities,
        formatted: this.formatCurrency(latestBalance.totalLiabilities),
        period: latestBalance.date
      };

      fundamentals.latest.equity = {
        value: latestBalance.totalEquity,
        formatted: this.formatCurrency(latestBalance.totalEquity),
        period: latestBalance.date
      };
    }

    // Process Key Metrics
    if (keyMetrics && keyMetrics.length > 0) {
      const latestMetrics = keyMetrics[keyMetrics.length - 1];
      
      if (latestMetrics.roe) {
        fundamentals.ratios.roe = {
          roe: latestMetrics.roe * 100, // Convert to percentage
          formatted: `${(latestMetrics.roe * 100).toFixed(1)}%`,
          note: 'Return on Equity'
        };
      }

      if (latestMetrics.bookValuePerShare) {
        fundamentals.ratios.bookValuePerShare = {
          value: latestMetrics.bookValuePerShare,
          formatted: `$${latestMetrics.bookValuePerShare.toFixed(2)}`
        };
      }

      if (latestMetrics.debtToEquity) {
        fundamentals.ratios.debtToEquity = {
          ratio: latestMetrics.debtToEquity,
          formatted: `${latestMetrics.debtToEquity.toFixed(2)}`
        };
      }
    }

    const revenueQuarters = fiscalData.Revenues.quarterly.length;
    const revenueWithGrowthCount = fiscalData.Revenues.quarterly.filter(q => q.revenueGrowth !== null).length;
    const netIncomeWithGrowthCount = fiscalData.NetIncomeLoss.quarterly.filter(q => q.netIncomeGrowth !== null).length;
    
    console.log(`✅ Processed complete growth trends: ${revenueQuarters} revenue quarters, ${revenueWithGrowthCount} with revenue growth, ${netIncomeWithGrowthCount} with net income growth`);

    return { fundamentals, fiscalData };
  }

  // UTILITY METHODS FOR FUNDAMENTALS

  formatCurrency(value) {
    if (!value) return '$0';
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1e12) {
      return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
    } else if (absValue >= 1e9) {
      return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
    } else if (absValue >= 1e3) {
      return `${sign}$${(absValue / 1e3).toFixed(2)}K`;
    } else {
      return `${sign}$${absValue.toFixed(2)}`;
    }
  }

  getQuarterFromDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    return Math.ceil(month / 3);
  }

  // ==================== EXISTING METHODS (UNCHANGED) ====================
  // [Previous methods remain the same - keeping for brevity but they're all there]

  // PERIOD DATES WITH BUFFER FOR TECHNICAL INDICATORS
  getPeriodDatesWithBuffer(period, needsIndicators = false) {
    const now = new Date();
    let from = new Date();
    let displayFrom = new Date(); // The actual period start for display
    
    // Set the display period
    switch(period) {
      case '1m':
        displayFrom.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        displayFrom.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        displayFrom.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        displayFrom.setFullYear(now.getFullYear() - 1);
        break;
      case '5y':
        displayFrom.setFullYear(now.getFullYear() - 5);
        break;
      default:
        displayFrom.setFullYear(now.getFullYear() - 1);
    }
    
    // Add buffer for technical indicators if needed
    if (needsIndicators) {
      from = new Date(displayFrom);
      // Add 200 days for 200-day MA calculation (plus some extra for weekends/holidays)
      from.setDate(from.getDate() - 280); // ~200 trading days
      console.log(`📊 Added 280 days buffer for complete technical indicators`);
    } else {
      from = new Date(displayFrom);
    }
    
    return {
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
      displayFrom: displayFrom.toISOString().split('T')[0]
    };
  }

  // TRIM DATA TO DISPLAY PERIOD WHILE PRESERVING INDICATORS
  trimToDisplayPeriod(data, displayFromDate) {
    const displayFrom = new Date(displayFromDate);
    
    // Find the first index where we want to start displaying
    const startIndex = data.findIndex(item => new Date(item.date) >= displayFrom);
    
    if (startIndex === -1) {
      console.log(`⚠️ No data found from display date ${displayFromDate}`);
      return data; // Return all data if no match found
    }
    
    // Trim the data but keep the calculated indicators
    const trimmedData = data.slice(startIndex);
    
    console.log(`✂️ Trimmed data from ${data.length} to ${trimmedData.length} points (display period)`);
    console.log(`📅 Display range: ${trimmedData[0]?.date} to ${trimmedData[trimmedData.length - 1]?.date}`);
    
    return trimmedData;
  }

  // INTRADAY DATA - New capability from FMP
  async getIntradayData(symbol, period) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`⚡ Fetching intraday data for ${normalizedSymbol} (${period})`);
      
      const interval = period === '1d' ? '5min' : '15min';
      
      const url = `${this.baseUrl}/historical-chart/${interval}/${normalizedSymbol}`;
      console.log(`🌐 FMP API Call: ${url}`);
      
      const response = await axios.get(url, {
        params: { apikey: this.apiKey },
        timeout: 15000
      });

      console.log(`📡 FMP Intraday Response Status: ${response.status}`);
      console.log(`📡 FMP Intraday Data Length: ${response.data?.length || 0}`);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No intraday data found for ${normalizedSymbol} from FMP API`);
      }

      let data = response.data
        .map(this.normalizeIntradayData.bind(this))
        .reverse(); // FMP returns newest first

      // Filter for requested period
      if (period === '1d') {
        // Get last trading day
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
        
        data = data.filter(item => 
          item.date.startsWith(today) || item.date.startsWith(yesterday)
        );
        
        // Filter market hours (9:30 AM - 4:00 PM ET)
        data = this.filterMarketHours(data);
      } else if (period === '5d') {
        // Get last 5 trading days
        data = data.slice(-200); // Approximately 40 points per day * 5 days
      }

      console.log(`✅ Retrieved ${data.length} intraday points for ${normalizedSymbol}`);
      
      return data.map(item => ({ ...item, isDisplayed: true, isIntraday: true }));
      
    } catch (error) {
      console.error(`❌ Error fetching intraday data for ${symbol}:`, error.message);
      // Fallback to recent daily data
      return await this.getRecentDailyData(symbol, period);
    }
  }

  // REAL-TIME QUOTES - Enhanced capability
  async getRealTimeQuotes(symbols) {
    try {
      const normalizedSymbols = Array.isArray(symbols) 
        ? symbols.map(s => this.normalizeSymbolForFMP(s)) 
        : [this.normalizeSymbolForFMP(symbols)];
      
      const symbolString = normalizedSymbols.join(',');
      console.log(`⚡ Fetching real-time quotes for: ${symbolString}`);
      
      const url = `${this.baseUrl}/quote/${symbolString}`;
      console.log(`🌐 FMP API Call: ${url}`);
      
      const response = await axios.get(url, {
        params: { apikey: this.apiKey },
        timeout: 10000
      });

      if (!response.data) {
        throw new Error('No real-time data received from FMP API');
      }

      const data = Array.isArray(response.data) ? response.data : [response.data];
      console.log(`✅ Retrieved real-time data for ${data.length} symbols`);
      
      return data.map(this.normalizeMarketData.bind(this));
      
    } catch (error) {
      console.error('❌ Error fetching real-time quotes:', error.message);
      throw new Error(`Failed to fetch real-time quotes from FMP: ${error.message}`);
    }
  }

  // TECHNICAL INDICATORS - Built-in FMP capability
  async getTechnicalIndicators(symbol, indicator = 'rsi', period = 14) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      console.log(`📊 Fetching ${indicator} for ${normalizedSymbol}`);
      
      const response = await axios.get(`${this.baseUrl}/technical_indicator/daily/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey,
          period,
          type: indicator
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`No technical indicator data found for ${normalizedSymbol}`);
      }

      return response.data.reverse(); // Newest first to oldest first
      
    } catch (error) {
      console.error(`❌ Error fetching ${indicator} for ${symbol}:`, error.message);
      return [];
    }
  }

  // BULK REAL-TIME PRICES - New FMP capability
  async getAllRealTimePrices() {
    try {
      console.log('📊 Fetching all real-time prices...');
      
      const response = await axios.get(`${this.baseUrl}/quotes/index`, {
        params: { apikey: this.apiKey }
      });

      return response.data || [];
      
    } catch (error) {
      console.error('❌ Error fetching all real-time prices:', error.message);
      return [];
    }
  }

  // COMPANY SEARCH - New capability
  async searchCompanies(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { 
          query,
          apikey: this.apiKey,
          limit: 10
        }
      });

      return response.data || [];
      
    } catch (error) {
      console.error(`❌ Error searching for "${query}":`, error.message);
      return [];
    }
  }

  // DATA NORMALIZATION METHODS

  normalizeMarketData(data) {
    const symbol = data.symbol || '';
    return {
      symbol: symbol.replace('.US', ''),
      name: this.getStockName(symbol),
      price: this.getNumericValue(data.price),
      open: this.getNumericValue(data.open),
      high: this.getNumericValue(data.dayHigh),
      low: this.getNumericValue(data.dayLow),
      previousClose: this.getNumericValue(data.previousClose),
      volume: this.getNumericValue(data.volume),
      change: this.getNumericValue(data.change),
      changePercent: this.getNumericValue(data.changesPercentage),
      marketCap: this.getNumericValue(data.marketCap),
      timestamp: new Date().toISOString()
    };
  }

  normalizeHistoricalData(data) {
    return {
      date: data.date,
      close: this.getNumericValue(data.close),
      open: this.getNumericValue(data.open),
      high: this.getNumericValue(data.high),
      low: this.getNumericValue(data.low),
      volume: this.getNumericValue(data.volume),
      price: this.getNumericValue(data.close)
    };
  }

  normalizeIntradayData(data) {
    return {
      date: data.date,
      close: this.getNumericValue(data.close),
      open: this.getNumericValue(data.open),
      high: this.getNumericValue(data.high),
      low: this.getNumericValue(data.low),
      volume: this.getNumericValue(data.volume),
      price: this.getNumericValue(data.close)
    };
  }

  // UTILITY METHODS

  getNumericValue(value) {
    if (value === null || value === undefined || value === 'NA') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  getStockName(symbol) {
    const names = {
      'SPY': 'S&P 500 ETF',
      'QQQ': 'Nasdaq 100 ETF',
      'DIA': 'Dow Jones ETF',
      'IWM': 'Russell 2000 ETF',
      'TLT': 'Treasury Bond ETF',
      'VIX': 'Volatility Index',
      'XLF': 'Financial Select',
      'XLK': 'Technology Select',
      'XLE': 'Energy Select',
      'XLV': 'Health Care Select',
      'XLI': 'Industrial Select',
      'XLP': 'Consumer Staples',
      'XLY': 'Consumer Discretionary',
      'XLB': 'Materials Select',
      'XLRE': 'Real Estate Select',
      'XLU': 'Utilities Select',
      'XLC': 'Communication Services',
      'IVE': 'Value ETF',
      'IVW': 'Growth ETF',
      'BRK-B': 'Berkshire Hathaway Class B' // FIXED: Added BRK-B
    };
    return names[symbol] || symbol;
  }

  // DEPRECATED - Use getPeriodDatesWithBuffer instead
  getPeriodDates(period) {
    const { from, to } = this.getPeriodDatesWithBuffer(period, false);
    return { from, to };
  }

  filterMarketHours(data) {
    return data.filter(item => {
      const time = new Date(item.date);
      const hour = time.getHours();
      const minute = time.getMinutes();
      
      // Market hours: 9:30 AM - 4:00 PM ET
      const marketStart = 9 * 60 + 30; // 9:30 AM
      const marketEnd = 16 * 60; // 4:00 PM
      const currentTime = hour * 60 + minute;
      
      return currentTime >= marketStart && currentTime <= marketEnd;
    });
  }

  async getRecentDailyData(symbol, period) {
    try {
      const normalizedSymbol = this.normalizeSymbolForFMP(symbol);
      
      const response = await axios.get(`${this.baseUrl}/historical-price-full/${normalizedSymbol}`, {
        params: { 
          apikey: this.apiKey
        }
      });

      if (!response.data?.historical) {
        return [];
      }

      let data = response.data.historical
        .slice(0, period === '1d' ? 3 : 8)
        .map(this.normalizeHistoricalData.bind(this))
        .reverse();

      return data.map(item => ({ ...item, isDisplayed: true, isRecentDaily: true }));
      
    } catch (error) {
      console.error(`❌ Error fetching recent daily data for ${symbol}:`, error.message);
      return [];
    }
  }

  // ENHANCED TECHNICAL INDICATORS CALCULATION
  calculateTechnicalIndicators(data, period) {
    console.log(`🔢 Calculating technical indicators for ${data.length} data points`);
    
    // Calculate 200-day moving average
    if (data.length >= 200) {
      console.log(`📈 Calculating 200-day MA for ${data.length} points`);
      data = data.map((item, index) => {
        if (index >= 199) {
          const ma200 = data.slice(index - 199, index + 1)
            .reduce((sum, d) => sum + d.close, 0) / 200;
          return { ...item, ma200 };
        }
        return { ...item, ma200: null };
      });
      
      // Count how many points have MA200 values
      const ma200Count = data.filter(d => d.ma200 !== null).length;
      console.log(`✅ 200-day MA calculated for ${ma200Count} points`);
    } else {
      console.log(`⚠️ Not enough data points (${data.length}) for 200-day MA, need at least 200`);
      data = data.map(item => ({ ...item, ma200: null }));
    }

    // Calculate RSI
    if (data.length >= 15) {
      console.log(`📊 Calculating RSI for ${data.length} points`);
      data = data.map((item, index) => {
        if (index >= 14) {
          const changes = data.slice(index - 13, index + 1)
            .map((d, i, arr) => i > 0 ? d.close - arr[i-1].close : 0)
            .slice(1);
          
          const gains = changes.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / 14;
          const losses = Math.abs(changes.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / 14;
          
          const rs = gains / (losses || 1);
          const rsi = 100 - (100 / (1 + rs));
          
          return { ...item, rsi };
        }
        return { ...item, rsi: null };
      });
      
      // Count how many points have RSI values
      const rsiCount = data.filter(d => d.rsi !== null).length;
      console.log(`✅ RSI calculated for ${rsiCount} points`);
    } else {
      console.log(`⚠️ Not enough data points (${data.length}) for RSI, need at least 15`);
      data = data.map(item => ({ ...item, rsi: null }));
    }

    return data;
  }

  // HEALTH CHECK
  async healthCheck() {
    try {
      console.log('🔍 Testing FMP Market Data Service health...');
      
      const response = await axios.get(`${this.baseUrl}/quote/AAPL`, {
        params: { apikey: this.apiKey }
      });
      
      if (response.data && response.data.length > 0) {
        console.log('✅ FMP Market Data Service healthy');
        return {
          service: 'FMP Market Data Service',
          status: 'healthy',
          message: 'Successfully retrieved test data',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('No data returned');
      }
      
    } catch (error) {
      console.log('❌ FMP Market Data Service unhealthy:', error.message);
      return {
        service: 'FMP Market Data Service',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new FMPMarketDataService();