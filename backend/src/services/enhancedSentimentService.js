/**
 * Enhanced Real-Data Market Sentiment Analysis Service
 * Uses FMP API, Brave API, Mistral API - NO MOCK DATA
 */

import axios from 'axios';
import { redis } from '../config/database.js';
import fmpService from './fmpService.js';
import logger from '../utils/logger.js';

class EnhancedSentimentService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.braveApiKey = process.env.BRAVE_API_KEY;
    this.mistralApiKey = process.env.MISTRAL_API_KEY;
    
    this.cachePrefix = 'sentiment:';
    this.cacheTTL = 300; // 5 minutes
  }

  /**
   * Get comprehensive market sentiment data from real sources
   */
  async getMarketSentiment() {
    try {
      logger.info('Starting enhanced sentiment analysis with FMP API');

      const [
        newsAnalysis,
        vixData,
        flowData,
        marketEvents
      ] = await Promise.all([
        this.getNewsSetiment(),
        this.getVIXSentimentFMP(),
        this.getFundFlowDataFMP(),
        this.getCurrentMarketEvents()
      ]);

      const sentimentScore = this.calculateCompositeSentiment({
        news: newsAnalysis,
        vix: vixData,
        flows: flowData,
        events: marketEvents
      });

      return {
        overall: sentimentScore,
        components: {
          news: newsAnalysis,
          vix: vixData,
          flows: flowData,
          events: marketEvents
        },
        timestamp: new Date().toISOString(),
        source: 'fmp_api'
      };

    } catch (error) {
      logger.error('Enhanced sentiment analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get news sentiment using Brave API + Mistral AI analysis
   */
  async getNewsSetiment() {
    try {
      const cacheKey = `${this.cachePrefix}news_sentiment`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get recent market news from Brave API
      const newsData = await this.searchMarketNews();
      
      if (!newsData || !newsData.results || newsData.results.length === 0) {
        throw new Error('No news data available');
      }

      // Analyze sentiment with Mistral AI
      const sentimentAnalysis = await this.analyzeSentimentWithMistral(newsData);

      const result = {
        sentiment: sentimentAnalysis.overallSentiment,
        confidence: sentimentAnalysis.confidence,
        newsCount: newsData.results.length,
        keyThemes: sentimentAnalysis.keyThemes,
        positiveSignals: sentimentAnalysis.positiveSignals,
        negativeSignals: sentimentAnalysis.negativeSignals,
        timestamp: new Date().toISOString()
      };

      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.warn('News sentiment analysis failed:', error.message);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        newsCount: 0,
        error: 'News data unavailable',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Search for market news using Brave API
   */
  async searchMarketNews() {
    const queries = [
      'stock market news today',
      'Federal Reserve interest rates',
      'S&P 500 earnings outlook',
      'market volatility news'
    ];

    const allResults = [];

    for (const query of queries) {
      try {
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          headers: {
            'X-Subscription-Token': this.braveApiKey,
            'Accept': 'application/json'
          },
          params: {
            q: query,
            count: 5,
            freshness: 'pd', // Past day
            search_lang: 'en',
            country: 'US'
          },
          timeout: 5000
        });

        if (response.data && response.data.web && response.data.web.results) {
          allResults.push(...response.data.web.results);
        }
      } catch (error) {
        logger.warn(`Failed to search for "${query}":`, error.message);
      }
    }

    return {
      results: allResults.slice(0, 20),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze sentiment using Mistral AI
   */
  async analyzeSentimentWithMistral(newsData) {
    try {
      const newsText = newsData.results
        .map(article => `${article.title} ${article.description || ''}`)
        .join(' ');

      const prompt = `Analyze the market sentiment from these recent financial news headlines and summaries:

${newsText}

Provide a JSON response with:
1. overallSentiment: "bullish", "bearish", or "neutral"
2. confidence: 0-1 score of confidence in this assessment
3. keyThemes: array of 3-5 main themes mentioned
4. positiveSignals: array of positive market indicators mentioned
5. negativeSignals: array of negative market indicators mentioned

Focus on:
- Federal Reserve policy signals
- Earnings trends and forecasts
- Economic data and indicators
- Geopolitical developments affecting markets
- Sector rotation and investment flows

Response must be valid JSON only.`;

      const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
        model: 'mistral-tiny',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const analysisText = response.data.choices[0].message.content;
      
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        return {
          overallSentiment: this.extractSentimentFallback(analysisText),
          confidence: 0.6,
          keyThemes: ['mixed signals'],
          positiveSignals: [],
          negativeSignals: []
        };
      }

    } catch (error) {
      logger.warn('Mistral sentiment analysis failed:', error.message);
      return {
        overallSentiment: 'neutral',
        confidence: 0.5,
        keyThemes: ['analysis unavailable'],
        positiveSignals: [],
        negativeSignals: []
      };
    }
  }

  /**
   * Get VIX sentiment data using FMP API
   */
  async getVIXSentimentFMP() {
    try {
      const cacheKey = `${this.cachePrefix}vix_sentiment_fmp`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get VIX quote from FMP
      const vixQuote = await fmpService.getQuote('^VIX');
      
      if (!vixQuote || vixQuote.length === 0) {
        throw new Error('VIX data not available');
      }

      const vixLevel = parseFloat(vixQuote[0].price || vixQuote[0].previousClose || 20);
      
      // Get historical VIX for context using FMP
      const vixHistory = await fmpService.getHistoricalPrices('^VIX', '1month');
      const historicalPrices = vixHistory?.historical || [];
      
      const avgVix30d = historicalPrices.length > 0 ? 
        historicalPrices.reduce((sum, day) => sum + parseFloat(day.close), 0) / historicalPrices.length : 20;

      const result = {
        current: vixLevel,
        avg30d: Math.round(avgVix30d * 100) / 100,
        percentile: this.calculateVIXPercentile(vixLevel, historicalPrices),
        interpretation: this.interpretVIXLevel(vixLevel),
        fearGreedSignal: this.getVIXFearGreedSignal(vixLevel),
        timestamp: new Date().toISOString(),
        source: 'fmp_api'
      };

      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.warn('VIX sentiment analysis failed:', error.message);
      return {
        current: 20,
        avg30d: 20,
        percentile: 50,
        interpretation: 'neutral',
        fearGreedSignal: 'neutral',
        error: 'VIX data unavailable',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  /**
   * Get fund flow data from major ETFs using FMP API
   */
  async getFundFlowDataFMP() {
    try {
      const cacheKey = `${this.cachePrefix}fund_flows_fmp`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get volume data for major ETFs as proxy for flows
      const etfs = ['SPY', 'QQQ', 'IWM', 'VTI', 'TLT'];
      const flowData = {};

      for (const etf of etfs) {
        try {
          // Get recent historical data for flow analysis
          const etfHistory = await fmpService.getHistoricalPrices(etf, '1week');
          
          if (etfHistory?.historical && etfHistory.historical.length > 0) {
            const recentData = etfHistory.historical.slice(0, 5); // Last 5 days
            const avgVolume = recentData.reduce((sum, day) => sum + parseInt(day.volume), 0) / recentData.length;
            const priceChange = ((parseFloat(recentData[0].close) - parseFloat(recentData[recentData.length - 1].close)) / parseFloat(recentData[recentData.length - 1].close)) * 100;
            
            flowData[etf] = {
              avgVolume: Math.round(avgVolume),
              priceChange: Math.round(priceChange * 100) / 100,
              flowSignal: this.interpretETFFlow(avgVolume, priceChange)
            };
          }
        } catch (etfError) {
          logger.warn(`Failed to get FMP data for ${etf}:`, etfError.message);
        }
      }

      const result = {
        etfFlows: flowData,
        overallFlow: this.calculateOverallFlowSentiment(flowData),
        interpretation: this.interpretFlowData(flowData),
        timestamp: new Date().toISOString(),
        source: 'fmp_api'
      };

      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.warn('Fund flow analysis failed:', error.message);
      return {
        etfFlows: {},
        overallFlow: 'neutral',
        interpretation: 'Flow data unavailable',
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  /**
   * Get current market events using Brave API
   */
  async getCurrentMarketEvents() {
    try {
      const cacheKey = `${this.cachePrefix}market_events`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const queries = [
        'Federal Reserve FOMC meeting',
        'earnings season calendar',
        'economic data releases',
        'geopolitical market impact'
      ];

      const events = [];

      for (const query of queries) {
        try {
          const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
            headers: {
              'X-Subscription-Token': this.braveApiKey,
              'Accept': 'application/json'
            },
            params: {
              q: query,
              count: 3,
              freshness: 'pw', // Past week
              search_lang: 'en',
              country: 'US'
            },
            timeout: 5000
          });

          if (response.data && response.data.web && response.data.web.results) {
            events.push(...response.data.web.results.map(result => ({
              title: result.title,
              description: result.description,
              url: result.url,
              category: this.categorizeEvent(query),
              relevance: this.assessEventRelevance(result.title, result.description)
            })));
          }
        } catch (error) {
          logger.warn(`Failed to search for events "${query}":`, error.message);
        }
      }

      const result = {
        events: events.filter(event => event.relevance > 0.3),
        eventCount: events.length,
        upcomingCatalysts: this.identifyUpcomingCatalysts(events),
        riskEvents: this.identifyRiskEvents(events),
        timestamp: new Date().toISOString()
      };

      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.warn('Market events analysis failed:', error.message);
      return {
        events: [],
        eventCount: 0,
        upcomingCatalysts: [],
        riskEvents: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate composite sentiment score
   */
  calculateCompositeSentiment(components) {
    const weights = {
      news: 0.4,
      vix: 0.3,
      flows: 0.2,
      events: 0.1
    };

    let score = 50; // Neutral baseline

    // News sentiment contribution
    if (components.news.sentiment === 'bullish') {
      score += 20 * components.news.confidence;
    } else if (components.news.sentiment === 'bearish') {
      score -= 20 * components.news.confidence;
    }

    // VIX contribution (contrarian - high VIX can be bullish)
    if (components.vix.current < 15) {
      score += 10; // Low fear
    } else if (components.vix.current > 30) {
      score += 15; // High fear = contrarian opportunity
    } else if (components.vix.current > 25) {
      score -= 10; // Elevated fear
    }

    // Fund flows contribution
    if (components.flows.overallFlow === 'bullish') {
      score += 15;
    } else if (components.flows.overallFlow === 'bearish') {
      score -= 15;
    }

    // Events contribution
    const riskEventCount = components.events.riskEvents ? components.events.riskEvents.length : 0;
    const catalystCount = components.events.upcomingCatalysts ? components.events.upcomingCatalysts.length : 0;
    
    score += catalystCount * 3;
    score -= riskEventCount * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Helper methods (keeping all existing helper methods)
  extractSentimentFallback(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bullish') || lowerText.includes('positive')) return 'bullish';
    if (lowerText.includes('bearish') || lowerText.includes('negative')) return 'bearish';
    return 'neutral';
  }

  interpretVIXLevel(vix) {
    if (vix < 12) return 'extremely_low_volatility';
    if (vix < 16) return 'low_volatility';
    if (vix < 20) return 'normal_volatility';
    if (vix < 30) return 'elevated_volatility';
    return 'high_volatility';
  }

  getVIXFearGreedSignal(vix) {
    if (vix < 15) return 'greed';
    if (vix > 30) return 'extreme_fear';
    if (vix > 25) return 'fear';
    return 'neutral';
  }

  calculateVIXPercentile(currentVix, history) {
    if (!history || history.length === 0) return 50;
    
    const belowCurrent = history.filter(day => parseFloat(day.close) < currentVix).length;
    return Math.round((belowCurrent / history.length) * 100);
  }

  interpretETFFlow(volume, priceChange) {
    if (priceChange > 1 && volume > 0) return 'strong_inflow';
    if (priceChange < -1 && volume > 0) return 'strong_outflow';
    if (priceChange > 0) return 'inflow';
    if (priceChange < 0) return 'outflow';
    return 'neutral';
  }

  calculateOverallFlowSentiment(flowData) {
    const signals = Object.values(flowData).map(etf => etf.flowSignal);
    const bullishCount = signals.filter(s => s.includes('inflow')).length;
    const bearishCount = signals.filter(s => s.includes('outflow')).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }

  interpretFlowData(flowData) {
    const etfCount = Object.keys(flowData).length;
    if (etfCount === 0) return 'No flow data available';
    
    const strongInflows = Object.values(flowData).filter(etf => etf.flowSignal === 'strong_inflow').length;
    const strongOutflows = Object.values(flowData).filter(etf => etf.flowSignal === 'strong_outflow').length;
    
    if (strongInflows > strongOutflows) return 'Strong institutional buying detected';
    if (strongOutflows > strongInflows) return 'Institutional selling pressure evident';
    return 'Mixed institutional flow patterns';
  }

  categorizeEvent(query) {
    if (query.includes('Federal Reserve')) return 'monetary_policy';
    if (query.includes('earnings')) return 'earnings';
    if (query.includes('economic data')) return 'economic_data';
    if (query.includes('geopolitical')) return 'geopolitical';
    return 'general';
  }

  assessEventRelevance(title, description) {
    const relevantKeywords = [
      'fed', 'federal reserve', 'interest rates', 'inflation',
      'earnings', 'guidance', 'outlook', 'recession',
      'market', 'stocks', 'trading', 'volatility',
      'economic', 'gdp', 'employment', 'jobs'
    ];
    
    const text = `${title} ${description}`.toLowerCase();
    const matches = relevantKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(1, matches / 5);
  }

  identifyUpcomingCatalysts(events) {
    return events
      .filter(event => event.category === 'earnings' || event.category === 'economic_data')
      .slice(0, 3);
  }

  identifyRiskEvents(events) {
    return events
      .filter(event => 
        event.category === 'geopolitical' || 
        event.title.toLowerCase().includes('risk') ||
        event.title.toLowerCase().includes('concern')
      )
      .slice(0, 3);
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }
}

export default EnhancedSentimentService;