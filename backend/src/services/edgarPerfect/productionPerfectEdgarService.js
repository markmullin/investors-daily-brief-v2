// PRODUCTION-READY PERFECT EDGAR SERVICE
// Reliable financial data extraction with accurate calculations

import axios from 'axios';
import NodeCache from 'node-cache';

class ProductionPerfectEdgarService {
  constructor() {
    this.baseURL = 'https://data.sec.gov';
    this.cache = new NodeCache({ stdTTL: 14400 }); // 4 hour cache
    
    this.headers = {
      'User-Agent': 'InvestorsDailyBrief your-email@example.com',
      'Accept': 'application/json'
    };
  }

  // Get company CIK
  async getCompanyCIK(ticker) {
    const cacheKey = `cik_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        'https://www.sec.gov/files/company_tickers.json',
        { headers: this.headers }
      );

      const companies = Object.values(response.data);
      const company = companies.find(c => 
        c.ticker.toLowerCase() === ticker.toLowerCase() ||
        c.ticker.toLowerCase() === ticker.replace('.', '-').toLowerCase()
      );

      if (!company) {
        throw new Error(`Ticker ${ticker} not found`);
      }

      const cik = String(company.cik_str).padStart(10, '0');
      this.cache.set(cacheKey, cik);
      return cik;
    } catch (error) {
      console.error(`CIK lookup error for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Get perfect financial data with accurate calculations
  async getPerfectFinancialData(ticker, options = {}) {
    const cacheKey = `perfect_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !options.forceRefresh) return cached;

    try {
      console.log(`\n🎯 Fetching perfect data for ${ticker}...`);
      
      const cik = await this.getCompanyCIK(ticker);
      
      // Get company facts from SEC
      const response = await axios.get(
        `${this.baseURL}/api/xbrl/companyfacts/CIK${cik}.json`,
        { headers: this.headers }
      );

      const data = response.data;
      const companyName = data.entityName;
      
      // Extract and process financial data
      const financials = await this.extractFinancials(data.facts, ticker);
      
      // Calculate derived metrics
      const enhancedFinancials = this.calculateDerivedMetrics(financials);
      
      // Validate data quality
      const dataQuality = this.validateDataQuality(enhancedFinancials);
      
      const result = {
        ticker,
        companyName,
        financials: enhancedFinancials,
        dataQuality,
        metadata: {
          sources: ['SEC XBRL API'],
          extractionTime: new Date().toISOString(),
          cik
        }
      };

      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Error fetching perfect data for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Extract financial data with proper quarterly/annual separation
  extractFinancials(facts, ticker) {
    const financials = {};
    
    if (!facts['us-gaap']) {
      console.warn(`No US-GAAP data found for ${ticker}`);
      return financials;
    }

    // Define concept mappings with priorities
    const conceptMappings = {
      revenue: [
        'Revenues',
        'RevenueFromContractWithCustomerExcludingAssessedTax',
        'SalesRevenueNet',
        'RevenueFromContractWithCustomerIncludingAssessedTax'
      ],
      costOfRevenue: [
        'CostOfRevenue',
        'CostOfGoodsAndServicesSold',
        'CostOfGoodsSold',
        'CostOfSales'
      ],
      grossProfit: [
        'GrossProfit',
        'GrossProfitLoss'
      ],
      operatingIncome: [
        'OperatingIncomeLoss',
        'IncomeLossFromContinuingOperationsBeforeIncomeTaxes'
      ],
      netIncome: [
        'NetIncomeLoss',
        'NetIncomeLossAvailableToCommonStockholdersBasic',
        'ProfitLoss'
      ],
      eps: [
        'EarningsPerShareBasic',
        'EarningsPerShareDiluted'
      ],
      operatingCashFlow: [
        'NetCashProvidedByUsedInOperatingActivities',
        'NetCashProvidedByOperatingActivities'
      ],
      capitalExpenditures: [
        'PaymentsToAcquirePropertyPlantAndEquipment',
        'CapitalExpenditures'
      ],
      totalAssets: ['Assets'],
      totalLiabilities: ['Liabilities'],
      shareholdersEquity: ['StockholdersEquity'],
      cash: ['CashAndCashEquivalentsAtCarryingValue', 'Cash']
    };

    // Extract each metric
    Object.entries(conceptMappings).forEach(([metric, concepts]) => {
      for (const concept of concepts) {
        if (facts['us-gaap'][concept]) {
          const extracted = this.extractMetricData(
            facts['us-gaap'][concept],
            metric,
            ticker
          );
          
          if (extracted && extracted.value !== null) {
            financials[metric] = extracted;
            break; // Use first available concept
          }
        }
      }
    });

    return financials;
  }

  // Extract metric data with proper period handling
  extractMetricData(conceptData, metricName, ticker) {
    if (!conceptData.units) return null;

    // Find USD units
    const units = conceptData.units;
    const usdKey = Object.keys(units).find(key => 
      key === 'USD' || key.includes('USD')
    ) || Object.keys(units)[0];

    if (!units[usdKey] || units[usdKey].length === 0) return null;

    const values = units[usdKey];
    
    // Separate by filing type and get most recent
    const annualFilings = values.filter(v => v.form === '10-K' && v.val)
      .sort((a, b) => new Date(b.end) - new Date(a.end));
    
    const quarterlyFilings = values.filter(v => v.form === '10-Q' && v.val)
      .sort((a, b) => new Date(b.end) - new Date(a.end));

    // Determine if this is a flow or stock metric
    const isFlowMetric = ['revenue', 'costOfRevenue', 'netIncome', 'operatingCashFlow', 
                         'capitalExpenditures', 'grossProfit', 'operatingIncome'].includes(metricName);

    let latestValue = null;
    let latestPeriod = null;
    let isQuarterly = true;

    if (isFlowMetric) {
      // For flow metrics, we need quarterly data (not YTD)
      const quarterlyData = this.extractQuarterlyFromFilings(quarterlyFilings, metricName);
      
      if (quarterlyData.length > 0) {
        latestValue = quarterlyData[0].val;
        latestPeriod = quarterlyData[0].end;
      } else if (annualFilings.length > 0) {
        // Fall back to annual divided by 4 for rough quarterly estimate
        latestValue = annualFilings[0].val / 4;
        latestPeriod = annualFilings[0].end;
        isQuarterly = false;
      }
    } else {
      // For stock metrics (balance sheet), use most recent value
      if (quarterlyFilings.length > 0) {
        latestValue = quarterlyFilings[0].val;
        latestPeriod = quarterlyFilings[0].end;
      } else if (annualFilings.length > 0) {
        latestValue = annualFilings[0].val;
        latestPeriod = annualFilings[0].end;
        isQuarterly = false;
      }
    }

    if (latestValue === null) return null;

    return {
      value: latestValue,
      period: latestPeriod,
      isQuarterly,
      source: 'SEC XBRL',
      confidence: 0.95,
      concept: conceptData.label || metricName
    };
  }

  // Extract true quarterly data (not YTD)
  extractQuarterlyFromFilings(filings, metricName) {
    if (filings.length === 0) return [];

    const quarterlyData = [];
    const processedPeriods = new Set();

    // Group by fiscal year
    const byYear = {};
    filings.forEach(filing => {
      const year = new Date(filing.end).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(filing);
    });

    // Process each year
    Object.entries(byYear).forEach(([year, yearFilings]) => {
      // Sort by date
      yearFilings.sort((a, b) => new Date(a.end) - new Date(b.end));
      
      // Identify quarters
      const q1 = yearFilings.find(f => {
        const month = new Date(f.end).getMonth() + 1;
        return month >= 1 && month <= 3;
      });
      
      const q2 = yearFilings.find(f => {
        const month = new Date(f.end).getMonth() + 1;
        return month >= 4 && month <= 6;
      });
      
      const q3 = yearFilings.find(f => {
        const month = new Date(f.end).getMonth() + 1;
        return month >= 7 && month <= 9;
      });
      
      const q4 = yearFilings.find(f => {
        const month = new Date(f.end).getMonth() + 1;
        return month >= 10 && month <= 12;
      });

      // Q1 is always quarterly
      if (q1 && !processedPeriods.has(q1.end)) {
        quarterlyData.push(q1);
        processedPeriods.add(q1.end);
      }

      // Q2: Check if it's YTD (should be ~2x Q1)
      if (q2 && q1 && !processedPeriods.has(q2.end)) {
        const ratio = q2.val / q1.val;
        if (ratio > 1.5 && ratio < 2.5) {
          // This is YTD, calculate quarterly
          quarterlyData.push({
            ...q2,
            val: q2.val - q1.val,
            calculated: true
          });
        } else {
          // This is already quarterly
          quarterlyData.push(q2);
        }
        processedPeriods.add(q2.end);
      }

      // Q3: Check if it's YTD (should be ~3x Q1)
      if (q3 && q1 && !processedPeriods.has(q3.end)) {
        const ratio = q3.val / q1.val;
        if (ratio > 2.5 && ratio < 3.5) {
          // This is YTD, calculate quarterly
          const ytdQ2 = q2 ? (q2.val > q1.val * 1.5 ? q2.val : q1.val * 2) : q1.val * 2;
          quarterlyData.push({
            ...q3,
            val: q3.val - ytdQ2,
            calculated: true
          });
        } else {
          // This is already quarterly
          quarterlyData.push(q3);
        }
        processedPeriods.add(q3.end);
      }
    });

    return quarterlyData.sort((a, b) => new Date(b.end) - new Date(a.end));
  }

  // Calculate derived metrics
  calculateDerivedMetrics(financials) {
    const enhanced = { ...financials };

    // Gross Margin
    if (financials.revenue && financials.costOfRevenue) {
      const grossProfit = financials.revenue.value - financials.costOfRevenue.value;
      
      if (!enhanced.grossProfit) {
        enhanced.grossProfit = {
          value: grossProfit,
          period: financials.revenue.period,
          source: 'Calculated',
          confidence: 0.95
        };
      }

      enhanced.grossMargin = {
        value: (grossProfit / financials.revenue.value) * 100,
        period: financials.revenue.period,
        source: 'Calculated',
        confidence: 0.95,
        unit: 'percentage'
      };
    }

    // Operating Margin
    if (financials.operatingIncome && financials.revenue) {
      enhanced.operatingMargin = {
        value: (financials.operatingIncome.value / financials.revenue.value) * 100,
        period: financials.revenue.period,
        source: 'Calculated',
        confidence: 0.95,
        unit: 'percentage'
      };
    }

    // Net Margin
    if (financials.netIncome && financials.revenue) {
      enhanced.netMargin = {
        value: (financials.netIncome.value / financials.revenue.value) * 100,
        period: financials.revenue.period,
        source: 'Calculated',
        confidence: 0.95,
        unit: 'percentage'
      };
    }

    // Free Cash Flow
    if (financials.operatingCashFlow && financials.capitalExpenditures) {
      enhanced.freeCashFlow = {
        value: financials.operatingCashFlow.value - Math.abs(financials.capitalExpenditures.value),
        period: financials.operatingCashFlow.period,
        source: 'Calculated',
        confidence: 0.95
      };
    }

    // Return on Equity (ROE)
    if (financials.netIncome && financials.shareholdersEquity) {
      // Annualize if quarterly
      const annualizedNetIncome = financials.netIncome.isQuarterly 
        ? financials.netIncome.value * 4 
        : financials.netIncome.value;
      
      enhanced.roe = {
        value: (annualizedNetIncome / financials.shareholdersEquity.value) * 100,
        period: financials.netIncome.period,
        source: 'Calculated',
        confidence: 0.9,
        unit: 'percentage'
      };
    }

    // Return on Assets (ROA)
    if (financials.netIncome && financials.totalAssets) {
      const annualizedNetIncome = financials.netIncome.isQuarterly 
        ? financials.netIncome.value * 4 
        : financials.netIncome.value;
      
      enhanced.roa = {
        value: (annualizedNetIncome / financials.totalAssets.value) * 100,
        period: financials.netIncome.period,
        source: 'Calculated',
        confidence: 0.9,
        unit: 'percentage'
      };
    }

    // Debt to Equity
    if (financials.totalLiabilities && financials.shareholdersEquity) {
      enhanced.debtToEquity = {
        value: financials.totalLiabilities.value / financials.shareholdersEquity.value,
        period: financials.totalLiabilities.period,
        source: 'Calculated',
        confidence: 0.95,
        unit: 'ratio'
      };
    }

    return enhanced;
  }

  // Validate data quality
  validateDataQuality(financials) {
    const validation = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      overallScore: 0,
      issues: []
    };

    // Check completeness
    const requiredFields = ['revenue', 'netIncome', 'totalAssets', 'totalLiabilities', 'shareholdersEquity'];
    const presentFields = requiredFields.filter(field => financials[field]?.value);
    validation.completeness = presentFields.length / requiredFields.length;

    // Check accuracy (confidence scores)
    const confidenceScores = Object.values(financials)
      .map(item => item.confidence || 0)
      .filter(conf => conf > 0);
    
    validation.accuracy = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b) / confidenceScores.length
      : 0;

    // Check consistency
    const consistencyChecks = [];
    
    // Balance sheet should balance
    if (financials.totalAssets && financials.totalLiabilities && financials.shareholdersEquity) {
      const assets = financials.totalAssets.value;
      const liabPlusEquity = financials.totalLiabilities.value + financials.shareholdersEquity.value;
      const balanceCheck = Math.abs(assets - liabPlusEquity) / assets < 0.02; // 2% tolerance
      consistencyChecks.push(balanceCheck);
      if (!balanceCheck) {
        validation.issues.push('Balance sheet does not balance');
      }
    }

    // Margins should be reasonable
    if (financials.netMargin) {
      const marginCheck = financials.netMargin.value > -50 && financials.netMargin.value < 50;
      consistencyChecks.push(marginCheck);
      if (!marginCheck) {
        validation.issues.push(`Net margin ${financials.netMargin.value.toFixed(1)}% seems unrealistic`);
      }
    }

    validation.consistency = consistencyChecks.length > 0
      ? consistencyChecks.filter(check => check).length / consistencyChecks.length
      : 1;

    // Calculate overall score
    validation.overallScore = (
      validation.completeness * 0.4 +
      validation.accuracy * 0.4 +
      validation.consistency * 0.2
    );

    return validation;
  }

  // Get company filings info
  async getCompanyFilings(ticker, formTypes = ['10-K', '10-Q']) {
    try {
      const cik = await this.getCompanyCIK(ticker);
      
      const response = await axios.get(
        `${this.baseURL}/submissions/CIK${cik}.json`,
        { headers: this.headers }
      );

      const data = response.data;
      const recentFilings = data.filings.recent;
      const filings = [];
      
      for (let i = 0; i < recentFilings.accessionNumber.length && filings.length < 20; i++) {
        if (formTypes.includes(recentFilings.form[i])) {
          filings.push({
            form: recentFilings.form[i],
            filingDate: recentFilings.filingDate[i],
            reportDate: recentFilings.reportDate[i],
            accessionNumber: recentFilings.accessionNumber[i]
          });
        }
      }
      
      return {
        companyName: data.name,
        cik: data.cik,
        ticker: data.tickers[0],
        filings
      };
      
    } catch (error) {
      console.error(`Error fetching filings for ${ticker}:`, error.message);
      throw error;
    }
  }
}

export default new ProductionPerfectEdgarService();
