import axios from 'axios';
import { redis } from '../config/database.js';

class FinancialModelingPrepService {
  constructor() {
    this.baseURL = 'https://financialmodelingprep.com/api';
    this.apiKey = process.env.FMP_API_KEY;
    this.rateLimitDelay = 200; // 200ms between requests for free tier
    this.lastRequestTime = 0;
    
    if (!this.apiKey) {
      console.warn('⚠️  FMP_API_KEY not found in environment variables');
    }
  }

  // Rate limiting helper
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Generic API request with caching
  async makeRequest(endpoint, params = {}, cacheMinutes = 5) {
    const cacheKey = `fmp:${endpoint}:${JSON.stringify(params)}`;
    
    try {
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Rate limiting
      await this.rateLimit();

      // Make request
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          ...params,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      // Cache the result
      if (response.data && cacheMinutes > 0) {
        await redis.setex(cacheKey, cacheMinutes * 60, JSON.stringify(response.data));
      }

      return response.data;
    } catch (error) {
      console.error(`FMP API Error for ${endpoint}:`, error.message);
      throw new Error(`FMP API request failed: ${error.message}`);
    }
  }

  // 1. REAL-TIME QUOTES & MARKET DATA
  async getQuote(symbol) {
    return this.makeRequest(`/v3/quote/${symbol}`, {}, 1); // 1 minute cache
  }

  async getQuoteBatch(symbols) {
    const symbolString = symbols.join(',');
    return this.makeRequest(`/v3/quote/${symbolString}`, {}, 1);
  }

  async getMarketHours() {
    return this.makeRequest('/v3/market-hours', {}, 60); // 1 hour cache
  }

  async getExtendedHours(symbol) {
    return this.makeRequest(`/v3/quote/${symbol}`, { extended: true }, 1);
  }

  // 2. HISTORICAL PRICE DATA
  async getHistoricalPrices(symbol, period = '1year') {
    return this.makeRequest(`/v3/historical-price-full/${symbol}`, { 
      from: this.getPeriodStartDate(period),
      to: new Date().toISOString().split('T')[0]
    }, 30); // 30 minute cache
  }

  async getIntradayPrices(symbol, interval = '5min') {
    return this.makeRequest(`/v3/historical-chart/${interval}/${symbol}`, {}, 5);
  }

  async getDividendHistory(symbol) {
    return this.makeRequest(`/v3/historical-price-full/stock_dividend/${symbol}`, {}, 1440); // 24 hour cache
  }

  async getStockSplits(symbol) {
    return this.makeRequest(`/v3/historical-price-full/stock_split/${symbol}`, {}, 1440);
  }

  // 3. COMPANY FINANCIALS
  async getIncomeStatement(symbol, period = 'annual') {
    return this.makeRequest(`/v3/income-statement/${symbol}`, { period }, 1440);
  }

  async getBalanceSheet(symbol, period = 'annual') {
    return this.makeRequest(`/v3/balance-sheet-statement/${symbol}`, { period }, 1440);
  }

  async getCashFlow(symbol, period = 'annual') {
    return this.makeRequest(`/v3/cash-flow-statement/${symbol}`, { period }, 1440);
  }

  async getFinancialRatios(symbol) {
    return this.makeRequest(`/v3/ratios/${symbol}`, {}, 1440);
  }

  async getKeyMetrics(symbol) {
    return this.makeRequest(`/v3/key-metrics/${symbol}`, {}, 1440);
  }

  async getEnterpriseValue(symbol) {
    return this.makeRequest(`/v3/enterprise-values/${symbol}`, {}, 1440);
  }

  async getFinancialGrowth(symbol) {
    return this.makeRequest(`/v3/financial-growth/${symbol}`, {}, 1440);
  }

  // 4. ANALYST ESTIMATES & TARGETS
  async getAnalystEstimates(symbol) {
    return this.makeRequest(`/v3/analyst-estimates/${symbol}`, {}, 60);
  }

  async getPriceTarget(symbol) {
    return this.makeRequest(`/v3/price-target/${symbol}`, {}, 60);
  }

  async getAnalystRecommendations(symbol) {
    return this.makeRequest(`/v3/analyst-stock-recommendations/${symbol}`, {}, 60);
  }

  async getUpgradesDowngrades(symbol) {
    return this.makeRequest(`/v3/upgrades-downgrades/${symbol}`, {}, 60);
  }

  // 5. COMPANY INFORMATION
  async getCompanyProfile(symbol) {
    return this.makeRequest(`/v3/profile/${symbol}`, {}, 1440);
  }

  async getCompanyExecutives(symbol) {
    return this.makeRequest(`/v3/key-executives/${symbol}`, {}, 1440);
  }

  async getInsiderTrading(symbol) {
    return this.makeRequest(`/v3/insider-trading/${symbol}`, {}, 60);
  }

  async getInstitutionalHolders(symbol) {
    return this.makeRequest(`/v3/institutional-holder/${symbol}`, {}, 1440);
  }

  async getMutualFundHolders(symbol) {
    return this.makeRequest(`/v3/mutual-fund-holder/${symbol}`, {}, 1440);
  }

  // 6. EARNINGS & EVENTS
  async getEarnings(symbol) {
    return this.makeRequest(`/v3/earnings/${symbol}`, {}, 1440);
  }

  async getEarningsCalendar(from, to) {
    return this.makeRequest('/v3/earning_calendar', { from, to }, 60);
  }

  async getIPOCalendar(from, to) {
    return this.makeRequest('/v3/ipo_calendar', { from, to }, 1440);
  }

  async getDividendCalendar(from, to) {
    return this.makeRequest('/v3/stock_dividend_calendar', { from, to }, 1440);
  }

  async getEconomicCalendar(from, to) {
    return this.makeRequest('/v3/economic_calendar', { from, to }, 1440);
  }

  // 7. SECTOR & INDUSTRY ANALYSIS
  async getSectorPerformance() {
    return this.makeRequest('/v3/sectors-performance', {}, 30);
  }

  async getIndustryPE() {
    return this.makeRequest('/v3/industry_price_earning_ratio', {}, 1440);
  }

  async getMarketCapitalization(symbol) {
    return this.makeRequest(`/v3/market-capitalization/${symbol}`, {}, 60);
  }

  // 8. SCREENING & DISCOVERY
  async getStockScreener(criteria) {
    return this.makeRequest('/v3/stock-screener', criteria, 60);
  }

  async getDelisted() {
    return this.makeRequest('/v3/delisted-companies', {}, 1440);
  }

  async getActives() {
    return this.makeRequest('/v3/actives', {}, 5);
  }

  async getGainers() {
    return this.makeRequest('/v3/gainers', {}, 5);
  }

  async getLosers() {
    return this.makeRequest('/v3/losers', {}, 5);
  }

  // 9. MACRO ECONOMIC DATA
  async getTreasuryRates() {
    return this.makeRequest('/v4/treasury', {}, 60);
  }

  async getEconomicIndicators() {
    return this.makeRequest('/v4/economic', {}, 1440);
  }

  async getCommodityPrices() {
    return this.makeRequest('/v3/quotes/commodity', {}, 30);
  }

  async getForexRates() {
    return this.makeRequest('/v3/quotes/forex', {}, 30);
  }

  async getCryptoPrices() {
    return this.makeRequest('/v3/quotes/crypto', {}, 5);
  }

  // 10. ETF & MUTUAL FUND DATA
  async getETFHoldings(symbol) {
    return this.makeRequest(`/v3/etf-holder/${symbol}`, {}, 1440);
  }

  async getETFSectorWeightings(symbol) {
    return this.makeRequest(`/v3/etf-sector-weightings/${symbol}`, {}, 1440);
  }

  async getETFCountryWeightings(symbol) {
    return this.makeRequest(`/v3/etf-country-weightings/${symbol}`, {}, 1440);
  }

  async getMutualFundHoldings(symbol) {
    return this.makeRequest(`/v3/mutual-fund-holdings/${symbol}`, {}, 1440);
  }

  // 11. ADVANCED DCF & VALUATION
  async getDCF(symbol) {
    return this.makeRequest(`/v3/discounted-cash-flow/${symbol}`, {}, 1440);
  }

  async getAdvancedDCF(symbol) {
    return this.makeRequest(`/v4/advanced_discounted_cash_flow`, { symbol }, 1440);
  }

  async getLeveredDCF(symbol) {
    return this.makeRequest(`/v4/advanced_levered_discounted_cash_flow`, { symbol }, 1440);
  }

  // 12. NEWS & SENTIMENT
  async getStockNews(symbol, limit = 20) {
    return this.makeRequest('/v3/stock_news', { tickers: symbol, limit }, 30);
  }

  async getGeneralNews(limit = 20) {
    return this.makeRequest('/v3/fmp/articles', { limit }, 30);
  }

  async getPress_releases(symbol, limit = 20) {
    return this.makeRequest('/v3/press-releases', { symbol, limit }, 60);
  }

  // HELPER FUNCTIONS
  getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case '1week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      case '1month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
      case '3months':
        return new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
      case '5years':
        return new Date(now.setFullYear(now.getFullYear() - 5)).toISOString().split('T')[0];
      default:
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
    }
  }

  // Comprehensive Company Analysis (combines multiple endpoints)
  async getComprehensiveAnalysis(symbol) {
    try {
      const [
        profile,
        quote,
        keyMetrics,
        ratios,
        growth,
        dcf,
        analystEstimates,
        priceTarget
      ] = await Promise.all([
        this.getCompanyProfile(symbol),
        this.getQuote(symbol),
        this.getKeyMetrics(symbol),
        this.getFinancialRatios(symbol),
        this.getFinancialGrowth(symbol),
        this.getDCF(symbol),
        this.getAnalystEstimates(symbol),
        this.getPriceTarget(symbol)
      ]);

      return {
        profile: profile[0],
        quote: quote[0],
        keyMetrics: keyMetrics[0],
        ratios: ratios[0],
        growth: growth[0],
        dcf: dcf[0],
        analystEstimates: analystEstimates[0],
        priceTarget: priceTarget[0],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting comprehensive analysis for ${symbol}:`, error);
      throw error;
    }
  }
}

export default new FinancialModelingPrepService();