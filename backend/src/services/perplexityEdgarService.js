// PERPLEXITY-STYLE EDGAR SERVICE - FIXED VERSION
// Direct integration with SEC EDGAR API for accurate financial data

import axios from 'axios';
import NodeCache from 'node-cache';

class PerplexityStyleEdgarService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    
    // SEC API configuration
    this.headers = {
      'User-Agent': 'InvestorsDailyBrief support@investorsdaily.com',
      'Accept': 'application/json'
    };
    
    // Base URLs
    this.tickerUrl = 'https://www.sec.gov/files/company_tickers.json';
    this.submissionsUrl = 'https://data.sec.gov/submissions';
    this.factsUrl = 'https://data.sec.gov/api/xbrl/companyfacts';
  }

  // Get company CIK with better error handling
  async getCompanyCIK(ticker) {
    const cacheKey = `cik_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.tickerUrl, { headers: this.headers });
      const companies = Object.values(response.data);
      
      // Handle special ticker formats
      const searchTicker = ticker.replace('.', '-').toUpperCase();
      const company = companies.find(c => 
        c.ticker.toUpperCase() === searchTicker ||
        c.ticker.toUpperCase() === ticker.toUpperCase()
      );

      if (!company) {
        throw new Error(`Ticker ${ticker} not found in SEC database`);
      }

      const cik = String(company.cik_str).padStart(10, '0');
      this.cache.set(cacheKey, { cik, name: company.title });
      return { cik, name: company.title };
      
    } catch (error) {
      console.error(`Error getting CIK for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Get accurate financial data with proper quarterly extraction
  async getAccurateFinancialData(ticker) {
    const cacheKey = `financial_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📊 Fetching accurate data for ${ticker}...`);
      
      // Get company info
      const { cik, name } = await this.getCompanyCIK(ticker);
      
      // Get company facts
      const factsResponse = await axios.get(
        `${this.factsUrl}/CIK${cik}.json`,
        { headers: this.headers }
      );
      
      const facts = factsResponse.data.facts;
      
      // Get recent filings info
      const submissionsResponse = await axios.get(
        `${this.submissionsUrl}/CIK${cik}.json`,
        { headers: this.headers }
      );
      
      const recentFilings = this.extractRecentFilings(submissionsResponse.data);
      
      // Extract financial metrics with proper quarterly logic
      const metrics = this.extractFinancialMetrics(facts, recentFilings);
      
      // Calculate derived metrics
      const enhanced = this.calculateDerivedMetrics(metrics);
      
      // Build result with citations
      const result = {
        ticker,
        companyName: name,
        lastUpdated: new Date().toISOString(),
        metrics: enhanced,
        sources: this.generateSources(recentFilings),
        dataQuality: this.assessDataQuality(enhanced)
      };
      
      this.cache.set(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Extract recent filings information
  extractRecentFilings(submissionsData) {
    const filings = submissionsData.filings.recent;
    const recent = [];
    
    // Get most recent 10-Q and 10-K
    const forms = ['10-Q', '10-K', '8-K'];
    
    for (let i = 0; i < filings.accessionNumber.length && recent.length < 10; i++) {
      if (forms.includes(filings.form[i])) {
        recent.push({
          form: filings.form[i],
          filingDate: filings.filingDate[i],
          reportDate: filings.reportDate[i],
          accessionNumber: filings.accessionNumber[i],
          primaryDocument: filings.primaryDocument[i],
          url: `https://www.sec.gov/Archives/edgar/data/${submissionsData.cik}/${filings.accessionNumber[i].replace(/-/g, '')}/${filings.primaryDocument[i]}`
        });
      }
    }
    
    return recent;
  }

  // Extract financial metrics with accurate quarterly logic
  extractFinancialMetrics(facts, recentFilings) {
    const metrics = {};
    
    if (!facts['us-gaap']) {
      console.warn('No US-GAAP data found');
      return metrics;
    }
    
    // Get the most recent 10-Q date for quarterly data
    const mostRecent10Q = recentFilings.find(f => f.form === '10-Q');
    const quarterEndDate = mostRecent10Q ? mostRecent10Q.reportDate : null;
    
    // Define metrics to extract
    const metricMappings = {
      revenue: {
        concepts: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'],
        isFlow: true
      },
      costOfRevenue: {
        concepts: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold'],
        isFlow: true
      },
      operatingIncome: {
        concepts: ['OperatingIncomeLoss', 'IncomeLossFromContinuingOperationsBeforeIncomeTaxes'],
        isFlow: true
      },
      netIncome: {
        concepts: ['NetIncomeLoss', 'ProfitLoss', 'NetIncomeLossAttributableToParent'],
        isFlow: true
      },
      eps: {
        concepts: ['EarningsPerShareBasic', 'EarningsPerShareDiluted'],
        isFlow: true
      },
      operatingCashFlow: {
        concepts: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByOperatingActivities'],
        isFlow: true
      },
      capex: {
        concepts: ['PaymentsToAcquirePropertyPlantAndEquipment', 'CapitalExpenditures'],
        isFlow: true
      },
      totalAssets: {
        concepts: ['Assets'],
        isFlow: false
      },
      totalLiabilities: {
        concepts: ['Liabilities'],
        isFlow: false
      },
      shareholdersEquity: {
        concepts: ['StockholdersEquity'],
        isFlow: false
      }
    };
    
    // Extract each metric
    Object.entries(metricMappings).forEach(([metricName, config]) => {
      for (const concept of config.concepts) {
        if (facts['us-gaap'][concept]) {
          const value = this.extractProperQuarterlyValue(
            facts['us-gaap'][concept],
            config.isFlow,
            quarterEndDate
          );
          
          if (value !== null) {
            metrics[metricName] = value;
            break; // Use first available concept
          }
        }
      }
    });
    
    return metrics;
  }

  // Extract proper quarterly value with correct period handling
  extractProperQuarterlyValue(conceptData, isFlowMetric, targetDate) {
    if (!conceptData.units) return null;
    
    // Find USD units
    const usdUnits = conceptData.units.USD || conceptData.units['USD/shares'] || null;
    if (!usdUnits || usdUnits.length === 0) return null;
    
    // For flow metrics (revenue, income), we need true quarterly values
    if (isFlowMetric) {
      // Filter for quarterly periods based on duration
      const quarterlyValues = usdUnits.filter(v => {
        if (!v.start || !v.end || !v.val || !v.form) return false;
        
        // Calculate duration in days
        const startDate = new Date(v.start);
        const endDate = new Date(v.end);
        const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
        
        // Quarterly periods are typically 80-100 days
        // Annual periods are typically 350-380 days
        const isQuarterly = durationDays >= 80 && durationDays <= 100;
        
        // Also check if it's from a 10-Q (quarterly report)
        const isFrom10Q = v.form === '10-Q';
        
        // Check if it has a quarterly frame (e.g., "CY2024Q3")
        const hasQuarterlyFrame = v.frame && /Q[1-4]/.test(v.frame);
        
        return isQuarterly || (isFrom10Q && durationDays < 120) || hasQuarterlyFrame;
      });
      
      // Sort by end date descending to get most recent
      quarterlyValues.sort((a, b) => new Date(b.end) - new Date(a.end));
      
      // Get the most recent quarterly value
      if (quarterlyValues.length > 0) {
        const recent = quarterlyValues[0];
        return {
          value: recent.val,
          period: recent.end,
          form: recent.form,
          frame: recent.frame,
          start: recent.start
        };
      }
      
      // Fallback: try to find any recent value from 10-Q
      const recent10Q = usdUnits
        .filter(v => v.form === '10-Q' && v.val && v.end)
        .sort((a, b) => new Date(b.end) - new Date(a.end))[0];
        
      if (recent10Q) {
        return {
          value: recent10Q.val,
          period: recent10Q.end,
          form: recent10Q.form,
          frame: recent10Q.frame,
          start: recent10Q.start
        };
      }
    } else {
      // For stock metrics (assets, liabilities), use most recent value
      const sortedValues = usdUnits
        .filter(v => v.val !== null && v.form)
        .sort((a, b) => new Date(b.end) - new Date(a.end));
      
      const recent = sortedValues.find(v => v.form === '10-Q') || sortedValues[0];
      return recent ? {
        value: recent.val,
        period: recent.end,
        form: recent.form,
        frame: recent.frame
      } : null;
    }
    
    return null;
  }

  // Calculate derived metrics
  calculateDerivedMetrics(metrics) {
    const enhanced = { ...metrics };
    
    // Gross Profit
    if (metrics.revenue && metrics.costOfRevenue) {
      enhanced.grossProfit = {
        value: metrics.revenue.value - metrics.costOfRevenue.value,
        period: metrics.revenue.period,
        calculated: true
      };
      
      // Gross Margin
      enhanced.grossMargin = {
        value: ((metrics.revenue.value - metrics.costOfRevenue.value) / metrics.revenue.value) * 100,
        period: metrics.revenue.period,
        calculated: true
      };
    }
    
    // Operating Margin
    if (metrics.operatingIncome && metrics.revenue) {
      enhanced.operatingMargin = {
        value: (metrics.operatingIncome.value / metrics.revenue.value) * 100,
        period: metrics.revenue.period,
        calculated: true
      };
    }
    
    // Net Margin
    if (metrics.netIncome && metrics.revenue) {
      enhanced.netMargin = {
        value: (metrics.netIncome.value / metrics.revenue.value) * 100,
        period: metrics.revenue.period,
        calculated: true
      };
    }
    
    // Free Cash Flow
    if (metrics.operatingCashFlow && metrics.capex) {
      enhanced.freeCashFlow = {
        value: metrics.operatingCashFlow.value - Math.abs(metrics.capex.value),
        period: metrics.operatingCashFlow.period,
        calculated: true
      };
    }
    
    // ROE (annualized)
    if (metrics.netIncome && metrics.shareholdersEquity && metrics.shareholdersEquity.value > 0) {
      enhanced.roe = {
        value: ((metrics.netIncome.value * 4) / metrics.shareholdersEquity.value) * 100,
        period: metrics.netIncome.period,
        calculated: true,
        annualized: true
      };
    }
    
    // Debt to Equity
    if (metrics.totalLiabilities && metrics.shareholdersEquity && metrics.shareholdersEquity.value > 0) {
      enhanced.debtToEquity = {
        value: metrics.totalLiabilities.value / metrics.shareholdersEquity.value,
        period: metrics.totalLiabilities.period,
        calculated: true
      };
    }
    
    return enhanced;
  }

  // Generate source citations
  generateSources(filings) {
    return filings.slice(0, 3).map(filing => ({
      type: filing.form,
      date: filing.filingDate,
      url: filing.url,
      description: `${filing.form} filed on ${filing.filingDate}`
    }));
  }

  // Assess data quality
  assessDataQuality(metrics) {
    const requiredMetrics = ['revenue', 'netIncome', 'totalAssets'];
    const presentMetrics = requiredMetrics.filter(m => metrics[m]);
    
    const completeness = presentMetrics.length / requiredMetrics.length;
    const hasMargins = metrics.grossMargin || metrics.netMargin;
    const hasRatios = metrics.roe || metrics.debtToEquity;
    
    // Check for reasonable values
    let qualityScore = completeness * 0.5 + (hasMargins ? 0.25 : 0) + (hasRatios ? 0.25 : 0);
    
    // Penalize obviously wrong data
    if (metrics.netMargin && metrics.netMargin.value > 100) {
      qualityScore *= 0.5; // Likely bad data if net margin > 100%
    }
    if (metrics.grossMargin && metrics.grossMargin.value < 0) {
      qualityScore *= 0.5; // Negative gross margin is suspicious
    }
    
    return {
      completeness,
      hasMargins,
      hasRatios,
      score: qualityScore,
      status: qualityScore >= 0.8 ? 'good' : qualityScore >= 0.5 ? 'limited' : 'poor'
    };
  }

  // Get formatted financial summary (Perplexity-style)
  async getFinancialSummary(ticker) {
    try {
      const data = await this.getAccurateFinancialData(ticker);
      
      return {
        company: {
          ticker: data.ticker,
          name: data.companyName
        },
        keyMetrics: this.formatKeyMetrics(data.metrics),
        insights: this.generateInsights(data.metrics),
        sources: data.sources,
        quality: data.dataQuality,
        lastUpdated: data.lastUpdated
      };
      
    } catch (error) {
      throw new Error(`Failed to get financial summary for ${ticker}: ${error.message}`);
    }
  }

  // Format key metrics for display
  formatKeyMetrics(metrics) {
    const formatted = {};
    
    if (metrics.revenue) {
      formatted.revenue = {
        label: 'Quarterly Revenue',
        value: metrics.revenue.value,
        formatted: this.formatCurrency(metrics.revenue.value),
        period: metrics.revenue.period,
        frame: metrics.revenue.frame
      };
    }
    
    if (metrics.netIncome) {
      formatted.netIncome = {
        label: 'Net Income',
        value: metrics.netIncome.value,
        formatted: this.formatCurrency(metrics.netIncome.value),
        period: metrics.netIncome.period
      };
    }
    
    if (metrics.eps) {
      formatted.eps = {
        label: 'Earnings Per Share',
        value: metrics.eps.value,
        formatted: `$${metrics.eps.value.toFixed(2)}`,
        period: metrics.eps.period
      };
    }
    
    if (metrics.grossMargin) {
      formatted.grossMargin = {
        label: 'Gross Margin',
        value: metrics.grossMargin.value,
        formatted: `${metrics.grossMargin.value.toFixed(1)}%`,
        period: metrics.grossMargin.period
      };
    }
    
    if (metrics.operatingCashFlow) {
      formatted.operatingCashFlow = {
        label: 'Operating Cash Flow',
        value: metrics.operatingCashFlow.value,
        formatted: this.formatCurrency(metrics.operatingCashFlow.value),
        period: metrics.operatingCashFlow.period
      };
    }
    
    if (metrics.freeCashFlow) {
      formatted.freeCashFlow = {
        label: 'Free Cash Flow',
        value: metrics.freeCashFlow.value,
        formatted: this.formatCurrency(metrics.freeCashFlow.value),
        period: metrics.freeCashFlow.period
      };
    }
    
    return formatted;
  }

  // Generate AI-style insights
  generateInsights(metrics) {
    const insights = [];
    
    // Profitability insight
    if (metrics.netMargin) {
      const margin = metrics.netMargin.value;
      if (margin > 20) {
        insights.push({
          type: 'positive',
          text: `Strong profitability with ${margin.toFixed(1)}% net margin`
        });
      } else if (margin > 10) {
        insights.push({
          type: 'neutral',
          text: `Healthy profitability with ${margin.toFixed(1)}% net margin`
        });
      } else if (margin > 0) {
        insights.push({
          type: 'neutral',
          text: `Modest profitability with ${margin.toFixed(1)}% net margin`
        });
      } else {
        insights.push({
          type: 'negative',
          text: `Currently unprofitable with ${margin.toFixed(1)}% net margin`
        });
      }
    }
    
    // Cash flow insight
    if (metrics.freeCashFlow) {
      const fcf = metrics.freeCashFlow.value;
      if (fcf > 0) {
        insights.push({
          type: 'positive',
          text: `Generating ${this.formatCurrency(fcf)} in free cash flow`
        });
      } else {
        insights.push({
          type: 'negative',
          text: `Negative free cash flow of ${this.formatCurrency(Math.abs(fcf))}`
        });
      }
    }
    
    // Efficiency insight
    if (metrics.roe) {
      const roe = metrics.roe.value;
      if (roe > 20) {
        insights.push({
          type: 'positive',
          text: `Excellent return on equity at ${roe.toFixed(1)}%`
        });
      } else if (roe > 10) {
        insights.push({
          type: 'neutral',
          text: `Solid return on equity at ${roe.toFixed(1)}%`
        });
      }
    }
    
    return insights;
  }

  // Format currency values
  formatCurrency(value) {
    const absValue = Math.abs(value);
    const negative = value < 0 ? '-' : '';
    
    if (absValue >= 1e9) {
      return `${negative}$${(absValue / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      return `${negative}$${(absValue / 1e6).toFixed(1)}M`;
    } else if (absValue >= 1e3) {
      return `${negative}$${(absValue / 1e3).toFixed(0)}K`;
    } else {
      return `${negative}$${absValue.toFixed(0)}`;
    }
  }
}

export default new PerplexityStyleEdgarService();
