/**
 * ENHANCED DISCOVERY ROUTES
 * Adds analyst ratings, price targets, and insider activity to discovery stocks
 * Part of Research Hub Enhancement - Phase 1
 */

import express from 'express';
import fmpService from '../../services/fmpService.js';
import { redis } from '../../config/database.js';

const router = express.Router();

/**
 * GET /api/enhanced-discovery/stocks-with-ratings
 * Get discovery stocks enhanced with analyst ratings and price targets
 */
router.post('/stocks-with-ratings', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No symbols provided'
      });
    }
    
    console.log(`🎯 [ENHANCED DISCOVERY] Fetching ratings for ${symbols.length} stocks`);
    
    // Check cache first
    const cacheKey = `enhanced_discovery:${symbols.join(',')}_${new Date().toISOString().split('T')[0]}`;
    if (redis.isConnected()) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 [ENHANCED DISCOVERY] Using cached enhanced data');
        return res.json(JSON.parse(cached));
      }
    }
    
    // Fetch enhanced data for each symbol
    const enhancedStocks = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Fetch all data in parallel for each stock
          const [quote, ratings, priceTarget, insider, keyMetrics] = await Promise.all([
            fmpService.makeRequest(`/v3/quote/${symbol}`),
            fmpService.makeRequest(`/v3/grade/${symbol}`, { limit: 5 }),
            fmpService.makeRequest(`/v3/price-target-summary/${symbol}`),
            fmpService.makeRequest(`/v4/insider-trading`, { symbol, limit: 5 }),
            fmpService.makeRequest(`/v3/key-metrics/${symbol}`, { limit: 1 })
          ]);
          
          const stockQuote = quote?.[0] || {};
          const latestRating = ratings?.[0] || null;
          const targetData = priceTarget?.[0] || null;
          const metrics = keyMetrics?.[0] || {};
          
          // Calculate consensus from recent ratings
          const ratingConsensus = calculateConsensus(ratings || []);
          
          // Calculate insider sentiment
          const insiderSentiment = calculateInsiderSentiment(insider || []);
          
          // Calculate upside potential
          const upsidePotential = targetData?.targetMean && stockQuote.price
            ? ((targetData.targetMean - stockQuote.price) / stockQuote.price) * 100
            : null;
          
          return {
            symbol: symbol,
            name: stockQuote.name || symbol,
            price: stockQuote.price || 0,
            change: stockQuote.change || 0,
            changePercent: stockQuote.changesPercentage || 0,
            volume: stockQuote.volume || 0,
            marketCap: stockQuote.marketCap || 0,
            
            // Analyst Ratings
            analystRating: {
              consensus: ratingConsensus,
              latestGrade: latestRating?.newGrade || null,
              previousGrade: latestRating?.previousGrade || null,
              gradeDate: latestRating?.gradeDate || null,
              firm: latestRating?.gradingCompany || null,
              totalAnalysts: targetData?.targetConsensus || 0,
              strongBuy: extractRatingCount(ratings, 'Strong Buy'),
              buy: extractRatingCount(ratings, 'Buy'),
              hold: extractRatingCount(ratings, 'Hold'),
              sell: extractRatingCount(ratings, 'Sell'),
              strongSell: extractRatingCount(ratings, 'Strong Sell')
            },
            
            // Price Targets
            priceTargets: {
              average: targetData?.targetMean || null,
              high: targetData?.targetHigh || null,
              low: targetData?.targetLow || null,
              current: stockQuote.price || null,
              upside: upsidePotential,
              numberOfAnalysts: targetData?.targetConsensus || 0
            },
            
            // Insider Activity
            insiderActivity: {
              sentiment: insiderSentiment,
              recentTrades: insider?.length || 0,
              netShares: calculateNetInsiderShares(insider || []),
              lastTradeDate: insider?.[0]?.transactionDate || null
            },
            
            // Key Metrics
            valuation: {
              pe: stockQuote.pe || metrics.peRatio || null,
              peg: metrics.pegRatio || null,
              priceToBook: metrics.priceToBookRatio || null,
              priceToSales: metrics.priceToSalesRatio || null,
              evToEbitda: metrics.enterpriseValueOverEBITDA || null,
              dividendYield: metrics.dividendYield || 0
            },
            
            // Technical
            technical: {
              fiftyDayMA: stockQuote.priceAvg50 || null,
              twoHundredDayMA: stockQuote.priceAvg200 || null,
              yearHigh: stockQuote.yearHigh || null,
              yearLow: stockQuote.yearLow || null,
              rsi: null // Would need separate call
            }
          };
        } catch (error) {
          console.error(`❌ Failed to enhance ${symbol}:`, error.message);
          return {
            symbol: symbol,
            error: true,
            message: 'Failed to fetch enhanced data'
          };
        }
      })
    );
    
    const response = {
      success: true,
      data: enhancedStocks,
      count: enhancedStocks.length,
      timestamp: new Date().toISOString()
    };
    
    // Cache for 15 minutes
    if (redis.isConnected()) {
      await redis.setex(cacheKey, 900, JSON.stringify(response));
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [ENHANCED DISCOVERY] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced discovery data',
      message: error.message
    });
  }
});

/**
 * GET /api/enhanced-discovery/earnings-estimates
 * Get earnings estimates and surprise history for stocks
 */
router.post('/earnings-estimates', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbols array'
      });
    }
    
    console.log(`📊 [EARNINGS ESTIMATES] Fetching estimates for ${symbols.length} stocks`);
    
    const estimatesData = {};
    
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Fetch analyst estimates and earnings surprises
          const [estimates, surprises] = await Promise.all([
            fmpService.makeRequest(`/v3/analyst-estimates/${symbol}`, { limit: 4 }),
            fmpService.makeRequest(`/v3/earnings-surprises/${symbol}`, { limit: 4 })
          ]);
          
          // Get the next quarter estimate
          const nextEstimate = estimates?.[0] || {};
          
          // Process surprise history
          const surpriseHistory = surprises?.map(s => ({
            date: s.date,
            actualEPS: s.actualEarningResult,
            estimatedEPS: s.estimatedEarning,
            surprise: s.actualEarningResult - s.estimatedEarning,
            surprisePercent: ((s.actualEarningResult - s.estimatedEarning) / Math.abs(s.estimatedEarning)) * 100
          })) || [];
          
          estimatesData[symbol] = {
            consensusEPS: nextEstimate.estimatedEpsAvg,
            epsHigh: nextEstimate.estimatedEpsHigh,
            epsLow: nextEstimate.estimatedEpsLow,
            previousEPS: surprises?.[0]?.actualEarningResult || null,
            analystCount: nextEstimate.numberAnalystsEstimatedEps || 0,
            surpriseHistory: surpriseHistory,
            revisions: {
              up: nextEstimate.estimatedEpsRevisionsUp || 0,
              down: nextEstimate.estimatedEpsRevisionsDown || 0,
              unchanged: nextEstimate.estimatedEpsRevisionsUnchanged || 0
            }
          };
        } catch (error) {
          console.error(`Failed to get estimates for ${symbol}:`, error.message);
          estimatesData[symbol] = null;
        }
      })
    );
    
    res.json({
      success: true,
      data: estimatesData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [EARNINGS ESTIMATES] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings estimates',
      message: error.message
    });
  }
});

/**
 * GET /api/enhanced-discovery/sector-performance
 * Real-time sector performance with rotation signals
 */
router.get('/sector-performance', async (req, res) => {
  try {
    console.log('📊 [ENHANCED DISCOVERY] Fetching real-time sector performance');
    
    // Check cache
    const cacheKey = 'enhanced_discovery:sector_performance';
    if (redis.isConnected()) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached sector performance');
        return res.json(JSON.parse(cached));
      }
    }
    
    // Fetch sector ETFs for real performance
    const sectorETFs = [
      { symbol: 'XLF', sector: 'Financials' },
      { symbol: 'XLK', sector: 'Technology' },
      { symbol: 'XLV', sector: 'Healthcare' },
      { symbol: 'XLE', sector: 'Energy' },
      { symbol: 'XLI', sector: 'Industrials' },
      { symbol: 'XLY', sector: 'Consumer Discretionary' },
      { symbol: 'XLP', sector: 'Consumer Staples' },
      { symbol: 'XLU', sector: 'Utilities' },
      { symbol: 'XLB', sector: 'Materials' },
      { symbol: 'XLRE', sector: 'Real Estate' },
      { symbol: 'XLC', sector: 'Communication Services' }
    ];
    
    const symbols = sectorETFs.map(s => s.symbol);
    const quotes = await fmpService.getQuoteBatch(symbols);
    
    const sectorPerformance = sectorETFs.map(sector => {
      const quote = quotes.find(q => q.symbol === sector.symbol) || {};
      
      return {
        sector: sector.sector,
        etf: sector.symbol,
        performance: {
          daily: quote.changesPercentage || 0,
          weekly: calculateWeeklyPerformance(quote),
          monthly: calculateMonthlyPerformance(quote),
          yearly: quote.yearToDate || 0
        },
        price: quote.price || 0,
        volume: quote.volume || 0,
        avgVolume: quote.avgVolume || 0,
        isOutperforming: (quote.changesPercentage || 0) > 0,
        momentum: calculateMomentum(quote)
      };
    });
    
    // Sort by daily performance
    sectorPerformance.sort((a, b) => b.performance.daily - a.performance.daily);
    
    // Identify rotation
    const rotation = {
      leading: sectorPerformance.slice(0, 3).map(s => s.sector),
      lagging: sectorPerformance.slice(-3).map(s => s.sector),
      trend: identifySectorTrend(sectorPerformance)
    };
    
    const response = {
      success: true,
      data: sectorPerformance,
      rotation: rotation,
      marketPhase: determineMarketPhase(sectorPerformance),
      timestamp: new Date().toISOString()
    };
    
    // Cache for 5 minutes
    if (redis.isConnected()) {
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [SECTOR PERFORMANCE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector performance',
      message: error.message
    });
  }
});

/**
 * GET /api/enhanced-discovery/personalized
 * Get personalized recommendations based on user's portfolio
 */
router.post('/personalized', async (req, res) => {
  try {
    const { portfolio } = req.body;
    
    if (!portfolio || !Array.isArray(portfolio)) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio data required'
      });
    }
    
    console.log(`🎯 [PERSONALIZED] Generating recommendations for ${portfolio.length} holdings`);
    
    // Get peers and sector matches for each holding
    const recommendations = await Promise.all(
      portfolio.map(async (holding) => {
        try {
          // Get stock peers
          const peers = await fmpService.makeRequest(`/v4/stock_peers`, { symbol: holding.symbol });
          
          // Get sector/industry data
          const profile = await fmpService.makeRequest(`/v3/profile/${holding.symbol}`);
          const sector = profile?.[0]?.sector;
          const industry = profile?.[0]?.industry;
          
          // Find similar stocks
          const screenerResults = await fmpService.makeRequest('/v3/stock-screener', {
            sector: sector,
            marketCapMoreThan: 1000000000,
            limit: 10
          });
          
          return {
            basedOn: holding.symbol,
            peers: peers?.peersList || [],
            sectorMatches: screenerResults || [],
            reason: `Similar to ${holding.symbol} (${sector})`
          };
        } catch (error) {
          console.error(`Failed to get recommendations for ${holding.symbol}:`, error.message);
          return null;
        }
      })
    );
    
    // Aggregate and deduplicate recommendations
    const allRecommendations = new Set();
    const reasonMap = new Map();
    
    recommendations.forEach(rec => {
      if (rec) {
        rec.peers?.forEach(peer => {
          allRecommendations.add(peer);
          reasonMap.set(peer, `Peer of ${rec.basedOn}`);
        });
        rec.sectorMatches?.forEach(match => {
          allRecommendations.add(match.symbol);
          reasonMap.set(match.symbol, rec.reason);
        });
      }
    });
    
    // Remove stocks already in portfolio
    portfolio.forEach(holding => {
      allRecommendations.delete(holding.symbol);
    });
    
    // Get quotes for recommendations
    const recommendedSymbols = Array.from(allRecommendations).slice(0, 20);
    const quotes = await fmpService.getQuoteBatch(recommendedSymbols);
    
    const personalizedStocks = quotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      changePercent: quote.changesPercentage,
      marketCap: quote.marketCap,
      reason: reasonMap.get(quote.symbol) || 'Recommended based on your portfolio',
      score: calculateRecommendationScore(quote, portfolio)
    }));
    
    // Sort by score
    personalizedStocks.sort((a, b) => b.score - a.score);
    
    res.json({
      success: true,
      data: personalizedStocks.slice(0, 10),
      basedOn: portfolio.map(h => h.symbol),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [PERSONALIZED] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized recommendations',
      message: error.message
    });
  }
});

// Helper Functions

function calculateConsensus(ratings) {
  if (!ratings || ratings.length === 0) return 'No Rating';
  
  const recentRatings = ratings.slice(0, 5);
  const scores = {
    'Strong Buy': 5,
    'Buy': 4,
    'Hold': 3,
    'Sell': 2,
    'Strong Sell': 1
  };
  
  let totalScore = 0;
  let count = 0;
  
  recentRatings.forEach(rating => {
    const grade = rating.newGrade;
    if (scores[grade]) {
      totalScore += scores[grade];
      count++;
    }
  });
  
  if (count === 0) return 'No Rating';
  
  const avgScore = totalScore / count;
  
  if (avgScore >= 4.5) return 'Strong Buy';
  if (avgScore >= 3.5) return 'Buy';
  if (avgScore >= 2.5) return 'Hold';
  if (avgScore >= 1.5) return 'Sell';
  return 'Strong Sell';
}

function extractRatingCount(ratings, grade) {
  if (!ratings) return 0;
  return ratings.filter(r => r.newGrade === grade).length;
}

function calculateInsiderSentiment(trades) {
  if (!trades || trades.length === 0) return 'Neutral';
  
  let buys = 0;
  let sells = 0;
  
  trades.forEach(trade => {
    if (trade.acquistionOrDisposition === 'A') buys++;
    else if (trade.acquistionOrDisposition === 'D') sells++;
  });
  
  if (buys > sells * 2) return 'Bullish';
  if (sells > buys * 2) return 'Bearish';
  return 'Neutral';
}

function calculateNetInsiderShares(trades) {
  if (!trades || trades.length === 0) return 0;
  
  let net = 0;
  trades.forEach(trade => {
    const shares = trade.securitiesTransacted || 0;
    if (trade.acquistionOrDisposition === 'A') net += shares;
    else if (trade.acquistionOrDisposition === 'D') net -= shares;
  });
  
  return net;
}

function calculateWeeklyPerformance(quote) {
  // This would need historical data, using a placeholder
  return quote.changesPercentage ? quote.changesPercentage * 5 : 0;
}

function calculateMonthlyPerformance(quote) {
  // This would need historical data, using a placeholder
  return quote.changesPercentage ? quote.changesPercentage * 20 : 0;
}

function calculateMomentum(quote) {
  if (!quote.price || !quote.priceAvg50) return 'Neutral';
  
  const priceVs50MA = ((quote.price - quote.priceAvg50) / quote.priceAvg50) * 100;
  
  if (priceVs50MA > 5) return 'Strong';
  if (priceVs50MA > 0) return 'Positive';
  if (priceVs50MA > -5) return 'Neutral';
  return 'Negative';
}

function identifySectorTrend(sectors) {
  const defensive = ['Utilities', 'Consumer Staples', 'Healthcare'];
  const cyclical = ['Technology', 'Consumer Discretionary', 'Financials'];
  
  const topSectors = sectors.slice(0, 3).map(s => s.sector);
  
  const defensiveCount = topSectors.filter(s => defensive.includes(s)).length;
  const cyclicalCount = topSectors.filter(s => cyclical.includes(s)).length;
  
  if (defensiveCount >= 2) return 'Defensive Rotation';
  if (cyclicalCount >= 2) return 'Risk-On Rotation';
  return 'Mixed';
}

function determineMarketPhase(sectors) {
  const avgPerformance = sectors.reduce((sum, s) => sum + s.performance.daily, 0) / sectors.length;
  
  if (avgPerformance > 1) return 'Strong Rally';
  if (avgPerformance > 0) return 'Bullish';
  if (avgPerformance > -1) return 'Neutral';
  return 'Bearish';
}

function calculateRecommendationScore(quote, portfolio) {
  let score = 50; // Base score
  
  // Momentum bonus
  if (quote.changesPercentage > 0) score += 10;
  if (quote.changesPercentage > 5) score += 10;
  
  // Valuation bonus
  if (quote.pe && quote.pe < 20) score += 10;
  
  // Volume bonus
  if (quote.volume > quote.avgVolume) score += 5;
  
  return Math.min(100, score);
}

export default router;
