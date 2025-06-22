/**
 * Enhanced Market Sentiment Analysis Service
 * Incorporates news sentiment, fund flows, put/call ratios, and current events
 */

import axios from 'axios';
import { redis } from '../config/database.js';
import fmpService from '../fmpService.js';
import logger, { marketDataLogger } from '../utils/logger.js';

class SentimentAnalysisService {
  constructor() {
    this.braveApiKey = process.env.BRAVE_API_KEY;
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.cacheTimeout = 15 * 60; // 15 minutes cache
    
    // Sentiment keywords for analysis
    this.positiveKeywords = [
      'bull', 'bullish', 'rally', 'surge', 'soar', 'gains', 'optimistic', 'confident',
      'strong', 'robust', 'growth', 'expansion', 'breakthrough', 'positive', 'upbeat',
      'recovery', 'rebound', 'beat estimates', 'outperform', 'upgrade'
    ];
    
    this.negativeKeywords = [
      'bear', 'bearish', 'crash', 'plunge', 'decline', 'losses', 'pessimistic', 'worried',
      'weak', 'fragile', 'recession', 'contraction', 'crisis', 'negative', 'downbeat',
      'sell-off', 'correction', 'miss estimates', 'underperform', 'downgrade'
    ];

    this.fearKeywords = [
      'uncertainty', 'volatility', 'risk', 'concern', 'fear', 'panic', 'anxiety',
      'stress', 'tension', 'instability', 'turbulence', 'chaos'
    ];

    this.confidenceKeywords = [
      'stability', 'certainty', 'confidence', 'optimism', 'strength', 'resilience',
      'solid', 'steady', 'reliable', 'consistent', 'momentum'
    ];
  }

  /**
   * Get comprehensive market sentiment metrics
   */
  async getMarketSentiment() {
    try {
      const cacheKey = 'market_sentiment:comprehensive';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Gather sentiment data from multiple sources
      const [
        newsData,
        putCallData,
        fundFlowData,
        vixData,
        socialSentiment,
        currentEvents
      ] = await Promise.all([
        this.getNewsSentiment(),
        this.getPutCallRatio(),
        this.getFundFlowData(),
        this.getVIXAnalysis(),
        this.getSocialMediaSentiment(),
        this.getCurrentEventsImpact()
      ]);

      // Calculate composite sentiment score
      const sentimentMetrics = {
        newsSentiment: newsData,
        putCallRatio: putCallData,
        fundFlows: fundFlowData,
        vixAnalysis: vixData,
        socialSentiment: socialSentiment,
        currentEvents: currentEvents,
        timestamp: new Date().toISOString()
      };

      // Calculate overall sentiment score (0-100)
      const overallScore = this.calculateCompositeSentiment(sentimentMetrics);
      sentimentMetrics.overallScore = overallScore;
      sentimentMetrics.interpretation = this.interpretSentimentScore(overallScore);

      // Cache the results
      await redis.setex(cacheKey, this.cacheTimeout, JSON.stringify(sentimentMetrics));

      return sentimentMetrics;

    } catch (error) {
      logger.error('Market sentiment analysis failed:', error);
      return this.getFallbackSentimentData();
    }
  }

  /**
   * Analyze news sentiment using Brave API
   */
  async getNewsSentiment() {
    try {
      if (!this.braveApiKey) {
        return this.getFallbackNewsData();
      }

      // Search for recent market news
      const newsQueries = [
        'stock market news today',
        'Federal Reserve interest rates',
        'economic indicators today',
        'S&P 500 earnings',
        'market outlook 2024'
      ];

      let allArticles = [];
      
      for (const query of newsQueries) {
        try {
          const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
            headers: {
              'X-Subscription-Token': this.braveApiKey,
              'Accept': 'application/json'
            },
            params: {
              q: query,
              count: 10,
              freshness: 'pd', // Past day
              text_decorations: false
            },
            timeout: 5000
          });

          if (response.data?.web?.results) {
            allArticles = allArticles.concat(response.data.web.results);
          }
        } catch (error) {
          logger.warn(`News search failed for query "${query}":`, error.message);
        }
      }

      // Analyze sentiment of collected articles
      const sentimentAnalysis = this.analyzeTextSentiment(allArticles);
      
      return {
        totalArticles: allArticles.length,
        sentiment: sentimentAnalysis,
        keyTopics: this.extractKeyTopics(allArticles),
        marketMentions: this.countMarketMentions(allArticles),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('News sentiment analysis failed:', error.message);
      return this.getFallbackNewsData();
    }
  }

  /**
   * Get Put/Call ratio data from Financial Modeling Prep
   */
  async getPutCallRatio() {
    try {
      // Try to get put/call ratio from FMP or other sources
      // Note: Put/call ratio might need to be sourced from CBOE or specialized providers
      
      // For now, we'll calculate based on VIX and market conditions
      const vixData = await fmpService.getQuote('VIX');
      const spyData = await fmpService.getQuote('SPY');
      
      if (vixData && spyData) {
        const vixLevel = vixData[0]?.price || 20;
        const spyChange = spyData[0]?.changesPercentage || 0;
        
        // Estimate put/call ratio based on VIX and market movement
        let estimatedRatio = 1.0; // Neutral
        
        if (vixLevel > 30) {
          estimatedRatio += 0.3; // Higher fear = more puts
        } else if (vixLevel < 15) {
          estimatedRatio -= 0.2; // Lower fear = fewer puts
        }
        
        if (spyChange < -2) {
          estimatedRatio += 0.2; // Market down = more puts
        } else if (spyChange > 2) {
          estimatedRatio -= 0.1; // Market up = fewer puts
        }

        return {
          ratio: Math.max(0.5, Math.min(2.0, estimatedRatio)),
          vixLevel: vixLevel,
          marketChange: spyChange,
          interpretation: this.interpretPutCallRatio(estimatedRatio),
          source: 'estimated_from_vix_spy',
          lastUpdated: new Date().toISOString()
        };
      }

      return this.getFallbackPutCallData();

    } catch (error) {
      logger.warn('Put/Call ratio calculation failed:', error.message);
      return this.getFallbackPutCallData();
    }
  }

  /**
   * Get fund flow data (ETF and mutual fund flows)
   */
  async getFundFlowData() {
    try {
      // Get data for major ETFs that indicate fund flows
      const etfSymbols = ['SPY', 'QQQ', 'IWM', 'VTI', 'VTEB', 'BND', 'GLD'];
      const flowData = {};
      
      for (const symbol of etfSymbols) {
        try {
          const data = await fmpService.getQuote(symbol);
          if (data && data[0]) {
            flowData[symbol] = {
              volume: data[0].volume,
              change: data[0].changesPercentage,
              price: data[0].price
            };
          }
        } catch (error) {
          logger.warn(`Failed to get flow data for ${symbol}`);
        }
      }

      // Calculate flow sentiment based on volume and price changes
      const flowAnalysis = this.analyzeFundFlows(flowData);

      return {
        etfFlows: flowData,
        analysis: flowAnalysis,
        interpretation: this.interpretFundFlows(flowAnalysis),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('Fund flow analysis failed:', error.message);
      return this.getFallbackFundFlowData();
    }
  }

  /**
   * Enhanced VIX analysis
   */
  async getVIXAnalysis() {
    try {
      const vixData = await fmpService.getQuote('VIX');
      const vixHistory = await fmpService.getHistoricalPrices('VIX', '1month');
      
      if (vixData && vixData[0]) {
        const currentVIX = vixData[0].price;
        const vixChange = vixData[0].change;
        
        // Calculate VIX percentile over past month
        let vixPercentile = 50; // Default
        if (vixHistory && vixHistory.historical) {
          const historicalVIX = vixHistory.historical.map(d => d.close);
          const sortedVIX = historicalVIX.sort((a, b) => a - b);
          const position = sortedVIX.findIndex(v => v >= currentVIX);
          vixPercentile = (position / sortedVIX.length) * 100;
        }

        return {
          currentLevel: currentVIX,
          change: vixChange,
          changePercent: vixData[0].changesPercentage,
          percentile: vixPercentile,
          fearLevel: this.classifyFearLevel(currentVIX),
          interpretation: this.interpretVIX(currentVIX, vixPercentile),
          lastUpdated: new Date().toISOString()
        };
      }

      return this.getFallbackVIXData();

    } catch (error) {
      logger.warn('VIX analysis failed:', error.message);
      return this.getFallbackVIXData();
    }
  }

  /**
   * Social media sentiment (placeholder for future implementation)
   */
  async getSocialMediaSentiment() {
    // Placeholder for social media sentiment analysis
    // Could integrate with Twitter API, Reddit API, etc.
    return {
      source: 'placeholder',
      sentiment: 'neutral',
      confidence: 0.5,
      mentions: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Current events impact analysis
   */
  async getCurrentEventsImpact() {
    try {
      // Get recent economic calendar events and Fed announcements
      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Check for major economic events
      const economicEvents = await this.getEconomicEvents(oneWeekAgo, today);
      
      return {
        recentEvents: economicEvents,
        fedMeetings: this.checkFedMeetings(),
        earningsSeason: this.checkEarningsSeason(),
        geopoliticalEvents: this.assessGeopoliticalRisk(),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('Current events analysis failed:', error.message);
      return {
        recentEvents: [],
        fedMeetings: 'none_scheduled',
        earningsSeason: 'unknown',
        geopoliticalEvents: 'moderate',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze text sentiment using keyword matching
   */
  analyzeTextSentiment(articles) {
    let totalSentiment = 0;
    let articleCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let fearCount = 0;
    let confidenceCount = 0;

    articles.forEach(article => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      let sentimentScore = 0;

      // Count positive keywords
      this.positiveKeywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        sentimentScore += matches * 1;
        positiveCount += matches;
      });

      // Count negative keywords
      this.negativeKeywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        sentimentScore -= matches * 1;
        negativeCount += matches;
      });

      // Count fear keywords
      this.fearKeywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        sentimentScore -= matches * 0.5;
        fearCount += matches;
      });

      // Count confidence keywords
      this.confidenceKeywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        sentimentScore += matches * 0.5;
        confidenceCount += matches;
      });

      totalSentiment += sentimentScore;
      articleCount++;
    });

    const averageSentiment = articleCount > 0 ? totalSentiment / articleCount : 0;
    
    return {
      averageSentiment: averageSentiment,
      positiveKeywords: positiveCount,
      negativeKeywords: negativeCount,
      fearKeywords: fearCount,
      confidenceKeywords: confidenceCount,
      totalArticles: articleCount,
      sentimentCategory: this.categorizeSentiment(averageSentiment)
    };
  }

  /**
   * Calculate composite sentiment score from all sources
   */
  calculateCompositeSentiment(metrics) {
    let score = 50; // Start neutral

    // News sentiment (30% weight)
    if (metrics.newsSentiment && metrics.newsSentiment.sentiment) {
      const newsWeight = 30;
      const newsScore = this.normalizeSentimentToScore(metrics.newsSentiment.sentiment.averageSentiment);
      score += (newsScore - 50) * (newsWeight / 100);
    }

    // Put/Call ratio (25% weight) - Contrarian indicator
    if (metrics.putCallRatio && metrics.putCallRatio.ratio) {
      const putCallWeight = 25;
      const ratio = metrics.putCallRatio.ratio;
      let putCallScore = 50;
      
      if (ratio > 1.2) {
        putCallScore = 70; // High fear = contrarian bullish
      } else if (ratio < 0.8) {
        putCallScore = 30; // Low fear = potential top
      }
      
      score += (putCallScore - 50) * (putCallWeight / 100);
    }

    // VIX analysis (25% weight)
    if (metrics.vixAnalysis && metrics.vixAnalysis.currentLevel) {
      const vixWeight = 25;
      const vixLevel = metrics.vixAnalysis.currentLevel;
      let vixScore = 50;
      
      if (vixLevel > 30) {
        vixScore = 75; // High VIX = contrarian opportunity
      } else if (vixLevel < 15) {
        vixScore = 25; // Low VIX = complacency risk
      } else {
        vixScore = 50 + ((25 - vixLevel) * 2); // Scale between 15-25
      }
      
      score += (vixScore - 50) * (vixWeight / 100);
    }

    // Fund flows (20% weight)
    if (metrics.fundFlows && metrics.fundFlows.analysis) {
      const flowWeight = 20;
      const flowScore = metrics.fundFlows.analysis.sentimentScore || 50;
      score += (flowScore - 50) * (flowWeight / 100);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Helper methods for data analysis and interpretation

  interpretSentimentScore(score) {
    if (score >= 80) return 'Very Bullish - Extreme optimism may signal caution';
    if (score >= 70) return 'Bullish - Generally positive sentiment';
    if (score >= 60) return 'Moderately Bullish - Cautious optimism';
    if (score >= 40) return 'Neutral - Mixed sentiment signals';
    if (score >= 30) return 'Moderately Bearish - Increasing pessimism';
    if (score >= 20) return 'Bearish - Widespread pessimism';
    return 'Very Bearish - Extreme fear may signal opportunity';
  }

  interpretPutCallRatio(ratio) {
    if (ratio > 1.3) return 'Extremely bearish - potential contrarian signal';
    if (ratio > 1.1) return 'Bearish sentiment - defensive positioning';
    if (ratio > 0.9) return 'Neutral sentiment';
    if (ratio > 0.7) return 'Bullish sentiment - potential complacency';
    return 'Extremely bullish - potential warning signal';
  }

  analyzeFundFlows(flowData) {
    let totalVolume = 0;
    let positiveFlows = 0;
    let negativeFlows = 0;

    Object.values(flowData).forEach(data => {
      totalVolume += data.volume || 0;
      if (data.change > 0) {
        positiveFlows += data.volume || 0;
      } else {
        negativeFlows += data.volume || 0;
      }
    });

    const flowRatio = totalVolume > 0 ? positiveFlows / totalVolume : 0.5;
    const sentimentScore = 50 + (flowRatio - 0.5) * 100;

    return {
      totalVolume,
      positiveFlows,
      negativeFlows,
      flowRatio,
      sentimentScore: Math.max(0, Math.min(100, sentimentScore))
    };
  }

  classifyFearLevel(vixLevel) {
    if (vixLevel > 40) return 'Extreme Fear';
    if (vixLevel > 30) return 'High Fear';
    if (vixLevel > 20) return 'Moderate Fear';
    if (vixLevel > 15) return 'Low Fear';
    return 'Complacency';
  }

  // Fallback data methods
  getFallbackSentimentData() {
    return {
      newsSentiment: { sentiment: { averageSentiment: 0, sentimentCategory: 'neutral' } },
      putCallRatio: { ratio: 1.0, interpretation: 'neutral' },
      fundFlows: { analysis: { sentimentScore: 50 } },
      vixAnalysis: { currentLevel: 20, fearLevel: 'Moderate Fear' },
      socialSentiment: { sentiment: 'neutral' },
      currentEvents: { recentEvents: [] },
      overallScore: 50,
      interpretation: 'Neutral - Mixed sentiment signals',
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }

  getFallbackNewsData() {
    return {
      totalArticles: 0,
      sentiment: { averageSentiment: 0, sentimentCategory: 'neutral' },
      keyTopics: [],
      marketMentions: 0,
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }

  getFallbackPutCallData() {
    return {
      ratio: 1.0,
      interpretation: 'neutral',
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }

  getFallbackFundFlowData() {
    return {
      etfFlows: {},
      analysis: { sentimentScore: 50 },
      interpretation: 'neutral',
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }

  getFallbackVIXData() {
    return {
      currentLevel: 20,
      change: 0,
      percentile: 50,
      fearLevel: 'Moderate Fear',
      interpretation: 'neutral',
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }

  // Additional helper methods
  extractKeyTopics(articles) {
    const topics = new Map();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    articles.forEach(article => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      const words = text.split(/\s+/).filter(word => 
        word.length > 3 && !commonWords.includes(word)
      );
      
      words.forEach(word => {
        topics.set(word, (topics.get(word) || 0) + 1);
      });
    });

    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
  }

  countMarketMentions(articles) {
    const marketTerms = ['stock', 'market', 'trading', 'investor', 'bull', 'bear', 'S&P', 'Dow', 'Nasdaq'];
    let totalMentions = 0;

    articles.forEach(article => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      marketTerms.forEach(term => {
        const matches = (text.match(new RegExp(term, 'g')) || []).length;
        totalMentions += matches;
      });
    });

    return totalMentions;
  }

  normalizeSentimentToScore(sentiment) {
    // Convert sentiment (-5 to +5) to score (0 to 100)
    return Math.max(0, Math.min(100, 50 + (sentiment * 10)));
  }

  categorizeSentiment(score) {
    if (score > 2) return 'bullish';
    if (score > 0.5) return 'moderately_bullish';
    if (score > -0.5) return 'neutral';
    if (score > -2) return 'moderately_bearish';
    return 'bearish';
  }

  async getEconomicEvents(startDate, endDate) {
    try {
      const events = await fmpService.getEconomicCalendar(startDate, endDate);
      return events || [];
    } catch (error) {
      return [];
    }
  }

  checkFedMeetings() {
    // Simplified - in production, would check actual Fed meeting calendar
    return 'none_scheduled';
  }

  checkEarningsSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Earnings seasons typically: Jan, Apr, Jul, Oct
    if ([1, 4, 7, 10].includes(month)) {
      return 'active';
    }
    return 'quiet';
  }

  assessGeopoliticalRisk() {
    // Simplified assessment - in production would analyze news for geopolitical events
    return 'moderate';
  }

  interpretFundFlows(analysis) {
    if (analysis.sentimentScore > 70) return 'Strong inflows suggest bullish sentiment';
    if (analysis.sentimentScore > 55) return 'Moderate inflows indicate cautious optimism';
    if (analysis.sentimentScore > 45) return 'Balanced flows suggest neutral sentiment';
    if (analysis.sentimentScore > 30) return 'Moderate outflows indicate growing caution';
    return 'Strong outflows suggest bearish sentiment';
  }

  interpretVIX(currentLevel, percentile) {
    if (currentLevel > 30 && percentile > 80) {
      return 'Extreme fear - historically a contrarian buying opportunity';
    } else if (currentLevel < 15 && percentile < 20) {
      return 'Complacency levels - potential market top warning';
    } else if (currentLevel > 25) {
      return 'Elevated fear - market stress evident';
    } else if (currentLevel < 18) {
      return 'Low fear - calm market conditions';
    }
    return 'Normal volatility levels - balanced market sentiment';
  }
}

export default new SentimentAnalysisService();