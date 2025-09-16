import express from 'express';
import axios from 'axios';

const router = express.Router();
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper function for FMP requests with error handling
async function fetchFromFMP(endpoint) {
  try {
    const url = `${FMP_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${FMP_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`FMP API Error for ${endpoint}:`, error.message);
    throw error;
  }
}

// GET /api/fundamentals/metrics/:symbol
router.get('/metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 Fetching metrics for ${symbol}`);
    
    // Fetch key metrics and company profile
    const [keyMetrics, profile, quote] = await Promise.all([
      fetchFromFMP(`/key-metrics/${symbol}`),
      fetchFromFMP(`/profile/${symbol}`),
      fetchFromFMP(`/quote/${symbol}`)
    ]);
    
    // Combine the data
    const metrics = {
      symbol,
      profile: profile[0] || {},
      quote: quote[0] || {},
      metrics: keyMetrics[0] || {},
      // Add calculated metrics
      marketCap: quote[0]?.marketCap || profile[0]?.mktCap || 0,
      peRatio: keyMetrics[0]?.peRatio || quote[0]?.pe || 0,
      eps: quote[0]?.eps || 0,
      dividendYield: keyMetrics[0]?.dividendYield || 0,
      pbRatio: keyMetrics[0]?.pbRatio || 0,
      priceToSalesRatio: keyMetrics[0]?.priceToSalesRatioTTM || 0,
      enterpriseValue: keyMetrics[0]?.enterpriseValue || 0,
      evToRevenue: keyMetrics[0]?.evToRevenue || 0,
      evToEbitda: keyMetrics[0]?.evToOperatingCashFlow || 0
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
  }
});

// GET /api/fundamentals/balance-sheet/:symbol
router.get('/balance-sheet/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'annual', limit = 5 } = req.query;
    
    console.log(`📊 Fetching balance sheet for ${symbol}`);
    
    const data = await fetchFromFMP(`/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}`);
    
    // Transform data for frontend consumption
    const formattedData = data.map(statement => ({
      date: statement.date,
      period: statement.period,
      // Assets
      totalAssets: statement.totalAssets,
      totalCurrentAssets: statement.totalCurrentAssets,
      cashAndCashEquivalents: statement.cashAndCashEquivalents,
      shortTermInvestments: statement.shortTermInvestments,
      netReceivables: statement.netReceivables,
      inventory: statement.inventory,
      propertyPlantEquipmentNet: statement.propertyPlantEquipmentNet,
      goodwill: statement.goodwill,
      intangibleAssets: statement.intangibleAssets,
      // Liabilities
      totalLiabilities: statement.totalLiabilities,
      totalCurrentLiabilities: statement.totalCurrentLiabilities,
      shortTermDebt: statement.shortTermDebt,
      longTermDebt: statement.longTermDebt,
      // Equity
      totalStockholdersEquity: statement.totalStockholdersEquity,
      retainedEarnings: statement.retainedEarnings,
      commonStock: statement.commonStock,
      // Calculated metrics
      workingCapital: statement.totalCurrentAssets - statement.totalCurrentLiabilities,
      debtToEquity: statement.totalLiabilities / statement.totalStockholdersEquity,
      currentRatio: statement.totalCurrentAssets / statement.totalCurrentLiabilities
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({ error: 'Failed to fetch balance sheet data', message: error.message });
  }
});

// GET /api/fundamentals/income-statement/:symbol
router.get('/income-statement/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'annual', limit = 5 } = req.query;
    
    console.log(`📊 Fetching income statement for ${symbol}`);
    
    const data = await fetchFromFMP(`/income-statement/${symbol}?period=${period}&limit=${limit}`);
    
    // Transform data for frontend consumption
    const formattedData = data.map(statement => ({
      date: statement.date,
      period: statement.period,
      revenue: statement.revenue,
      costOfRevenue: statement.costOfRevenue,
      grossProfit: statement.grossProfit,
      grossProfitRatio: statement.grossProfitRatio,
      researchAndDevelopmentExpenses: statement.researchAndDevelopmentExpenses,
      generalAndAdministrativeExpenses: statement.generalAndAdministrativeExpenses,
      sellingAndMarketingExpenses: statement.sellingAndMarketingExpenses,
      sellingGeneralAndAdministrativeExpenses: statement.sellingGeneralAndAdministrativeExpenses,
      operatingExpenses: statement.operatingExpenses,
      operatingIncome: statement.operatingIncome,
      operatingIncomeRatio: statement.operatingIncomeRatio,
      interestIncome: statement.interestIncome,
      interestExpense: statement.interestExpense,
      ebitda: statement.ebitda,
      ebitdaratio: statement.ebitdaratio,
      totalOtherIncomeExpensesNet: statement.totalOtherIncomeExpensesNet,
      incomeBeforeTax: statement.incomeBeforeTax,
      incomeTaxExpense: statement.incomeTaxExpense,
      netIncome: statement.netIncome,
      netIncomeRatio: statement.netIncomeRatio,
      eps: statement.eps,
      epsdiluted: statement.epsdiluted,
      weightedAverageShsOut: statement.weightedAverageShsOut,
      weightedAverageShsOutDil: statement.weightedAverageShsOutDil,
      // Growth metrics
      revenueGrowth: 0, // Calculate if previous period available
      netIncomeGrowth: 0, // Calculate if previous period available
      epsGrowth: 0 // Calculate if previous period available
    }));
    
    // Calculate growth rates if we have multiple periods
    for (let i = 0; i < formattedData.length - 1; i++) {
      const current = formattedData[i];
      const previous = formattedData[i + 1];
      
      if (previous.revenue && previous.revenue !== 0) {
        current.revenueGrowth = ((current.revenue - previous.revenue) / previous.revenue) * 100;
      }
      
      if (previous.netIncome && previous.netIncome !== 0) {
        current.netIncomeGrowth = ((current.netIncome - previous.netIncome) / Math.abs(previous.netIncome)) * 100;
      }
      
      if (previous.eps && previous.eps !== 0) {
        current.epsGrowth = ((current.eps - previous.eps) / Math.abs(previous.eps)) * 100;
      }
    }
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching income statement:', error);
    res.status(500).json({ error: 'Failed to fetch income statement data', message: error.message });
  }
});

// GET /api/fundamentals/cash-flow/:symbol
router.get('/cash-flow/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'annual', limit = 5 } = req.query;
    
    console.log(`📊 Fetching cash flow for ${symbol}`);
    
    const data = await fetchFromFMP(`/cash-flow-statement/${symbol}?period=${period}&limit=${limit}`);
    
    // Transform data for frontend consumption
    const formattedData = data.map(statement => ({
      date: statement.date,
      period: statement.period,
      // Operating Activities
      netIncome: statement.netIncome,
      depreciationAndAmortization: statement.depreciationAndAmortization,
      deferredIncomeTax: statement.deferredIncomeTax,
      stockBasedCompensation: statement.stockBasedCompensation,
      changeInWorkingCapital: statement.changeInWorkingCapital,
      accountsReceivables: statement.accountsReceivables,
      inventory: statement.inventory,
      accountsPayables: statement.accountsPayables,
      otherWorkingCapital: statement.otherWorkingCapital,
      otherNonCashItems: statement.otherNonCashItems,
      netCashProvidedByOperatingActivities: statement.netCashProvidedByOperatingActivities,
      // Investing Activities
      investmentsInPropertyPlantAndEquipment: statement.investmentsInPropertyPlantAndEquipment,
      acquisitionsNet: statement.acquisitionsNet,
      purchasesOfInvestments: statement.purchasesOfInvestments,
      salesMaturitiesOfInvestments: statement.salesMaturitiesOfInvestments,
      otherInvestingActivites: statement.otherInvestingActivites,
      netCashUsedForInvestingActivites: statement.netCashUsedForInvestingActivites,
      // Financing Activities
      debtRepayment: statement.debtRepayment,
      commonStockIssued: statement.commonStockIssued,
      commonStockRepurchased: statement.commonStockRepurchased,
      dividendsPaid: statement.dividendsPaid,
      otherFinancingActivites: statement.otherFinancingActivites,
      netCashUsedProvidedByFinancingActivities: statement.netCashUsedProvidedByFinancingActivities,
      // Summary
      effectOfForexChangesOnCash: statement.effectOfForexChangesOnCash,
      netChangeInCash: statement.netChangeInCash,
      cashAtEndOfPeriod: statement.cashAtEndOfPeriod,
      cashAtBeginningOfPeriod: statement.cashAtBeginningOfPeriod,
      operatingCashFlow: statement.operatingCashFlow,
      capitalExpenditure: statement.capitalExpenditure,
      freeCashFlow: statement.freeCashFlow,
      // Calculated metrics
      fcfMargin: statement.freeCashFlow / statement.netIncome,
      ocfToNetIncome: statement.operatingCashFlow / statement.netIncome
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow data', message: error.message });
  }
});

// GET /api/fundamentals/analyst/:symbol
router.get('/analyst/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Fetching analyst data for ${symbol}`);
    
    // Fetch multiple analyst data points
    const [recommendations, priceTarget, estimates, ratings] = await Promise.all([
      fetchFromFMP(`/analyst-stock-recommendations/${symbol}?limit=10`),
      fetchFromFMP(`/price-target/${symbol}`),
      fetchFromFMP(`/analyst-estimates/${symbol}`),
      fetchFromFMP(`/rating/${symbol}?limit=20`)
    ]);
    
    // Process recommendations summary
    const recentRecommendations = recommendations.slice(0, 10);
    const recommendationSummary = {
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0
    };
    
    recentRecommendations.forEach(rec => {
      const recommendation = rec.recommendationKey?.toLowerCase() || '';
      if (recommendation.includes('strong buy')) recommendationSummary.strongBuy++;
      else if (recommendation.includes('buy')) recommendationSummary.buy++;
      else if (recommendation.includes('hold')) recommendationSummary.hold++;
      else if (recommendation.includes('sell') && recommendation.includes('strong')) recommendationSummary.strongSell++;
      else if (recommendation.includes('sell')) recommendationSummary.sell++;
    });
    
    const analystData = {
      symbol,
      priceTarget: priceTarget[0] || {},
      estimates: estimates[0] || {},
      ratings: ratings.slice(0, 10).map(r => ({
        date: r.date,
        rating: r.rating,
        ratingScore: r.ratingScore,
        ratingRecommendation: r.ratingRecommendation,
        ratingDetailsDCFScore: r.ratingDetailsDCFScore,
        ratingDetailsROEScore: r.ratingDetailsROEScore,
        ratingDetailsROAScore: r.ratingDetailsROAScore,
        ratingDetailsDEScore: r.ratingDetailsDEScore,
        ratingDetailsPEScore: r.ratingDetailsPEScore,
        ratingDetailsPBScore: r.ratingDetailsPBScore
      })),
      recommendations: recentRecommendations,
      recommendationSummary,
      consensus: {
        rating: ratings[0]?.ratingRecommendation || 'N/A',
        score: ratings[0]?.ratingScore || 0,
        targetPrice: priceTarget[0]?.adjPriceTarget || 0,
        numberOfAnalysts: priceTarget[0]?.numberOfAnalysts || 0
      }
    };
    
    res.json(analystData);
  } catch (error) {
    console.error('Error fetching analyst data:', error);
    res.status(500).json({ error: 'Failed to fetch analyst data', message: error.message });
  }
});

// GET /api/fundamentals/earnings/:symbol
router.get('/earnings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Fetching earnings data for ${symbol}`);
    
    // Fetch earnings data
    const [historical, calendar, surprises] = await Promise.all([
      fetchFromFMP(`/historical-earning-calendar/${symbol}?limit=12`),
      fetchFromFMP(`/earning_calendar?symbol=${symbol}`),
      fetchFromFMP(`/earnings-surprises/${symbol}`)
    ]);
    
    const earningsData = {
      symbol,
      nextEarnings: calendar[0] || {},
      historicalEarnings: historical.map(e => ({
        date: e.date,
        eps: e.eps,
        epsEstimated: e.epsEstimated,
        revenue: e.revenue,
        revenueEstimated: e.revenueEstimated,
        time: e.time,
        updatedFromDate: e.updatedFromDate,
        fiscalDateEnding: e.fiscalDateEnding
      })),
      surprises: surprises.map(s => ({
        date: s.date,
        actualEarningResult: s.actualEarningResult,
        estimatedEarning: s.estimatedEarning,
        epsSurprise: s.actualEarningResult - s.estimatedEarning,
        epsSurprisePercent: ((s.actualEarningResult - s.estimatedEarning) / Math.abs(s.estimatedEarning)) * 100
      })),
      summary: {
        beatCount: surprises.filter(s => s.actualEarningResult > s.estimatedEarning).length,
        missCount: surprises.filter(s => s.actualEarningResult < s.estimatedEarning).length,
        meetCount: surprises.filter(s => s.actualEarningResult === s.estimatedEarning).length,
        averageSurprise: surprises.length > 0 
          ? surprises.reduce((acc, s) => acc + (s.actualEarningResult - s.estimatedEarning), 0) / surprises.length
          : 0
      }
    };
    
    res.json(earningsData);
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data', message: error.message });
  }
});

export default router;
