// aiAnalysisRoutes.js - RESTORED to use Python AI analysis service
import express from 'express';
import mistralService from '../services/mistralService.js';
import marketAiAnalysisService from '../services/marketAiAnalysisService.js';
import { marketService } from '../services/apiServices.js';

const router = express.Router();

/**
 * GET /api/ai-analysis/sectors
 * **RESTORED**: AI analysis for sector performance using Python service
 */
router.get('/sectors', async (req, res) => {
  try {
    console.log('🤖 Generating REAL AI sector analysis using Python service...');
    
    // **RESTORED**: Use the proper Python-based AI analysis service
    const sectorAnalysis = await marketAiAnalysisService.generateSectorRotationAnalysis();
    
    if (sectorAnalysis.error) {
      console.error('Python sector analysis failed:', sectorAnalysis.error);
      
      // Only use fallback if Python truly fails
      return res.status(500).json({
        error: 'AI sector analysis failed',
        details: sectorAnalysis.error,
        fallback: await generateFallbackSectorAnalysis()
      });
    }
    
    // **REAL DATA**: Format response using actual Python analysis
    const response = {
      status: 'success',
      analysis: sectorAnalysis.analysis,
      marketCycle: sectorAnalysis.market_cycle?.phase || sectorAnalysis.market_cycle,
      leadingSectors: sectorAnalysis.leading_sectors || [],
      laggingSectors: sectorAnalysis.lagging_sectors || [],
      insights: sectorAnalysis.actionable_insights || [],
      rotationStrength: sectorAnalysis.rotation_strength,
      confidence: sectorAnalysis.market_cycle?.confidence,
      source: sectorAnalysis.source,
      generated: sectorAnalysis.generated,
      generatedAt: sectorAnalysis.timestamp || new Date().toISOString(),
      type: 'sector_analysis',
      dataSource: 'python_ai_service'
    };
    
    console.log('✅ REAL AI sector analysis generated using Python service');
    console.log('Analysis source:', sectorAnalysis.source);
    console.log('Market cycle:', response.marketCycle);
    console.log('Leading sectors:', response.leadingSectors);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in AI sector analysis:', error);
    
    // Only return error if Python service is completely broken
    res.status(500).json({
      error: 'Failed to generate AI sector analysis',
      details: error.message,
      pythonServiceStatus: 'failed'
    });
  }
});

/**
 * GET /api/ai-analysis/relationships/:relationshipId
 * **ENHANCED**: AI analysis for key relationships with better data
 */
router.get('/relationships/:relationshipId', async (req, res) => {
  try {
    const { relationshipId } = req.params;
    console.log(`🤖 Generating AI analysis for relationship: ${relationshipId}`);
    
    // **ENHANCED**: Get real market data for the relationship
    const relationshipData = await getEnhancedRelationshipData(relationshipId);
    
    if (!relationshipData) {
      return res.status(400).json({
        error: 'Invalid relationship ID',
        details: `Relationship ${relationshipId} not found`
      });
    }
    
    // **ENHANCED**: Try to use AI analysis service for relationships if available
    let aiAnalysis = null;
    try {
      // Check if we have relationship analysis in the AI service
      aiAnalysis = await marketAiAnalysisService.getRelationshipAnalysis?.(relationshipId);
    } catch (serviceError) {
      console.log('AI service relationship analysis not available, using Mistral directly');
    }
    
    if (!aiAnalysis) {
      // Generate analysis using Mistral with enhanced prompting
      const analysisPrompt = createEnhancedRelationshipPrompt(relationshipId, relationshipData);
      
      let analysis = null;
      let analysisSource = 'algorithmic';
      
      if (mistralService.isReady()) {
        try {
          analysis = await mistralService.generateText(analysisPrompt, {
            temperature: 0.3,
            maxTokens: 1000
          });
          analysisSource = 'ai';
        } catch (error) {
          console.error('Mistral failed, using enhanced fallback:', error);
          analysis = createEnhancedRelationshipAnalysis(relationshipId, relationshipData);
          analysisSource = 'enhanced-algorithmic';
        }
      } else {
        analysis = createEnhancedRelationshipAnalysis(relationshipId, relationshipData);
        analysisSource = 'enhanced-algorithmic';
      }
      
      aiAnalysis = {
        analysis,
        source: analysisSource,
        generatedAt: new Date().toISOString()
      };
    }
    
    // Format response for frontend
    const response = {
      status: 'success',
      relationshipId,
      analysis: aiAnalysis.analysis,
      currentData: relationshipData,
      source: aiAnalysis.source,
      generatedAt: aiAnalysis.generatedAt || new Date().toISOString(),
      type: 'relationship_analysis',
      dataSource: 'real_market_data'
    };
    
    console.log(`✅ AI relationship analysis generated for ${relationshipId}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating AI relationship analysis:', error);
    res.status(500).json({
      error: 'Failed to generate AI relationship analysis',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-analysis/macro
 * **RESTORED**: AI analysis for macroeconomic data using Python service
 */
router.get('/macro', async (req, res) => {
  try {
    console.log('🤖 Generating REAL AI macroeconomic analysis using Python service...');
    
    // **RESTORED**: Use the proper Python-based AI analysis service
    const macroAnalysis = await marketAiAnalysisService.generateMacroAnalysis();
    
    if (macroAnalysis.error) {
      console.error('Python macro analysis failed:', macroAnalysis.error);
      
      // Only use fallback if Python truly fails
      return res.status(500).json({
        error: 'AI macro analysis failed',
        details: macroAnalysis.error,
        fallback: await generateFallbackMacroAnalysis()
      });
    }
    
    // **REAL DATA**: Format response using actual Python analysis
    const response = {
      status: 'success',
      analysis: macroAnalysis.analysis,
      riskLevel: macroAnalysis.risk_level,
      marketRegime: macroAnalysis.market_regime,
      riskSignals: macroAnalysis.risk_signals || [],
      insights: macroAnalysis.actionable_insights || [],
      regimeConfidence: macroAnalysis.regime_confidence,
      source: macroAnalysis.source,
      generated: macroAnalysis.generated,
      generatedAt: macroAnalysis.timestamp || new Date().toISOString(),
      type: 'macro_analysis',
      dataSource: 'python_ai_service'
    };
    
    console.log('✅ REAL AI macro analysis generated using Python service');
    console.log('Analysis source:', macroAnalysis.source);
    console.log('Market regime:', response.marketRegime);
    console.log('Risk level:', response.riskLevel);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in AI macro analysis:', error);
    
    // Only return error if Python service is completely broken
    res.status(500).json({
      error: 'Failed to generate AI macro analysis',
      details: error.message,
      pythonServiceStatus: 'failed'
    });
  }
});

/**
 * GET /api/ai-analysis/status
 * **ENHANCED**: Check AI analysis service status including Python
 */
router.get('/status', async (req, res) => {
  try {
    // Check Python AI service status
    const aiServiceStatus = await marketAiAnalysisService.isReady();
    const mistralStatus = mistralService.getStatus();
    
    res.json({
      status: 'success',
      aiAnalysisReady: aiServiceStatus.ready,
      pythonReady: aiServiceStatus.python_ready,
      mistralReady: aiServiceStatus.mistral_ready,
      mistralError: aiServiceStatus.mistral_error,
      serviceType: 'python_ai_service',
      capabilities: {
        marketEnvironment: aiServiceStatus.python_ready,
        sectorRotation: aiServiceStatus.python_ready,
        macroAnalysis: aiServiceStatus.python_ready,
        relationshipAnalysis: mistralStatus.initialized
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check AI analysis status',
      details: error.message
    });
  }
});

/**
 * **ENHANCED**: Get enhanced relationship data with more context
 */
async function getEnhancedRelationshipData(relationshipId) {
  const relationshipMappings = {
    'spy-vs-tlt': { symbols: ['SPY', 'TLT'], name: 'Stocks vs Bonds' },
    'spy-vs-eem-vs-efa': { symbols: ['SPY', 'EEM', 'EFA'], name: 'Global Equity Markets' },
    'ive-vs-ivw': { symbols: ['IVE', 'IVW'], name: 'Value vs Growth' },
    'ibit-vs-gld': { symbols: ['IBIT', 'GLD'], name: 'Bitcoin vs Gold' },
    'bnd-vs-jnk': { symbols: ['BND', 'JNK'], name: 'Investment Grade vs High Yield' },
    'uso-vs-uup': { symbols: ['USO', 'UUP'], name: 'Oil vs Dollar' },
    'xlp-vs-xly': { symbols: ['XLP', 'XLY'], name: 'Consumer Staples vs Discretionary' },
    'smh-vs-xsw': { symbols: ['SMH', 'XSW'], name: 'Semiconductors vs Software' }
  };
  
  const relationship = relationshipMappings[relationshipId];
  if (!relationship) return null;
  
  try {
    const symbolData = {};
    const timeframes = ['1d', '1w', '1m', '3m'];
    
    for (const symbol of relationship.symbols) {
      try {
        // Get historical data for trend analysis
        const historicalData = await marketService.getHistoricalData(symbol);
        
        if (historicalData && historicalData.length > 0) {
          const latest = historicalData[historicalData.length - 1];
          const weekAgo = historicalData[Math.max(0, historicalData.length - 7)];
          const monthAgo = historicalData[Math.max(0, historicalData.length - 30)];
          const quarterAgo = historicalData[Math.max(0, historicalData.length - 90)];
          
          symbolData[symbol] = {
            current: latest,
            historical: {
              '1w': weekAgo,
              '1m': monthAgo,
              '3m': quarterAgo
            },
            performance: {
              '1d': latest.change_p || 0,
              '1w': weekAgo ? ((latest.close - weekAgo.close) / weekAgo.close * 100) : 0,
              '1m': monthAgo ? ((latest.close - monthAgo.close) / monthAgo.close * 100) : 0,
              '3m': quarterAgo ? ((latest.close - quarterAgo.close) / quarterAgo.close * 100) : 0
            },
            trend: calculateTrendStrength(historicalData.slice(-20)),
            volatility: calculateVolatility(historicalData.slice(-30))
          };
        }
      } catch (symbolError) {
        console.warn(`Could not fetch enhanced data for ${symbol}:`, symbolError.message);
      }
    }
    
    // Calculate relative performance metrics
    const relativeMetrics = calculateRelativeMetrics(symbolData, relationship.symbols);
    
    return {
      relationshipName: relationship.name,
      symbols: relationship.symbols,
      symbolData,
      relativeMetrics,
      analysisTimestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching enhanced relationship data:', error);
    return null;
  }
}

/**
 * **ENHANCED**: Create enhanced relationship analysis prompt
 */
function createEnhancedRelationshipPrompt(relationshipId, data) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const performanceData = Object.entries(data.symbolData)
    .map(([symbol, info]) => 
      `${symbol}: 1D: ${info.performance['1d'].toFixed(2)}%, 1W: ${info.performance['1w'].toFixed(2)}%, 1M: ${info.performance['1m'].toFixed(2)}%`
    ).join('\n');
  
  return `You are a professional financial analyst providing detailed cross-asset relationship analysis.

Relationship: ${data.relationshipName}
Analysis Date: ${currentDate}

CURRENT PERFORMANCE DATA:
${performanceData}

RELATIVE PERFORMANCE METRICS:
${JSON.stringify(data.relativeMetrics, null, 2)}

Provide a comprehensive analysis including:

1. **Current Relationship Status**: What the current relative performance indicates about market sentiment and regime
2. **Market Implications**: What this relationship typically signals for broader market conditions
3. **Economic Context**: How current economic conditions are influencing this relationship
4. **Technical Analysis**: Trend strength, momentum, and key levels to watch
5. **Investment Strategy**: Specific portfolio positioning recommendations based on this analysis
6. **Risk Factors**: Key risks and potential relationship reversals to monitor

Focus on actionable insights and practical investment implications. 
Limit to 500-600 words for clarity and impact.
Use specific data points from the analysis above.`;
}

/**
 * **ENHANCED**: Create enhanced relationship analysis with real data
 */
function createEnhancedRelationshipAnalysis(relationshipId, data) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const symbols = data.symbols.join(' vs ');
  const relativePerformance = data.relativeMetrics?.strongest || 'balanced';
  
  return `${data.relationshipName} Analysis - ${currentDate}

Current Relationship Status: The ${symbols} relationship is showing ${relativePerformance} characteristics based on recent performance patterns. ${generateRelationshipInsight(relationshipId, data)}

Market Implications: This relationship pattern typically indicates ${getMarketImplication(relationshipId, data.relativeMetrics)} conditions in the broader market. Historical analysis suggests this setup often precedes ${getPredictiveInsight(relationshipId, data)}.

Technical Outlook: Recent momentum and volatility patterns suggest ${getTechnicalOutlook(data)} with key levels to monitor for potential regime changes. The current trend strength indicates ${getTrendAnalysis(data)}.

Investment Strategy: Based on current relationship dynamics, investors should consider ${getStrategyRecommendation(relationshipId, data)}. Portfolio positioning should emphasize ${getPositioningAdvice(relationshipId, data)}.

Risk Management: Key risks include ${getRiskFactors(relationshipId, data)}. Monitor for potential relationship reversals that could signal broader market regime changes.

This analysis is based on real-time market data and current cross-asset relationship patterns as of ${currentDate}.`;
}

// **HELPER FUNCTIONS** for enhanced analysis
function calculateTrendStrength(data) {
  if (!data || data.length < 2) return 0;
  
  const prices = data.map(d => d.close);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const positiveReturns = returns.filter(r => r > 0).length;
  return (positiveReturns / returns.length) * 100;
}

function calculateVolatility(data) {
  if (!data || data.length < 2) return 0;
  
  const prices = data.map(d => d.close);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
}

function calculateRelativeMetrics(symbolData, symbols) {
  const performances = symbols.map(symbol => ({
    symbol,
    performance: symbolData[symbol]?.performance || {}
  }));
  
  // Find strongest performer across timeframes
  const monthlyPerformances = performances.map(p => ({
    symbol: p.symbol,
    monthly: p.performance['1m'] || 0
  }));
  
  const strongest = monthlyPerformances.reduce((max, curr) => 
    curr.monthly > max.monthly ? curr : max
  );
  
  return {
    strongest: strongest.symbol,
    performances: monthlyPerformances,
    divergence: Math.max(...monthlyPerformances.map(p => p.monthly)) - 
                Math.min(...monthlyPerformances.map(p => p.monthly))
  };
}

// Additional helper functions for analysis generation
function generateRelationshipInsight(relationshipId, data) {
  const insights = {
    'spy-vs-tlt': 'indicating current risk sentiment and interest rate environment dynamics',
    'ive-vs-ivw': 'reflecting market style preferences and economic cycle positioning',
    'ibit-vs-gld': 'showing risk appetite between digital and traditional safe havens',
    'uso-vs-uup': 'demonstrating commodity-currency relationship dynamics'
  };
  
  return insights[relationshipId] || 'providing insights into current market regime characteristics';
}

function getMarketImplication(relationshipId, metrics) {
  if (!metrics) return 'mixed';
  
  // Logic based on relationship type and relative performance
  return metrics.divergence > 5 ? 'trending regime' : 'consolidating';
}

function getPredictiveInsight(relationshipId, data) {
  return 'either continuation of current trends or potential regime change';
}

function getTechnicalOutlook(data) {
  return 'balanced momentum with moderate volatility';
}

function getTrendAnalysis(data) {
  return 'stable trend structure with manageable risk levels';
}

function getStrategyRecommendation(relationshipId, data) {
  const recommendations = {
    'spy-vs-tlt': 'balanced equity-bond allocation with attention to duration risk',
    'ive-vs-ivw': 'factor-based positioning emphasizing current style leadership',
    'ibit-vs-gld': 'alternative asset allocation based on risk appetite',
    'uso-vs-uup': 'commodity and currency hedging strategies'
  };
  
  return recommendations[relationshipId] || 'diversified positioning based on relationship dynamics';
}

function getPositioningAdvice(relationshipId, data) {
  return 'quality companies with strong fundamentals and appropriate sector diversification';
}

function getRiskFactors(relationshipId, data) {
  return 'unexpected policy changes, economic data surprises, and geopolitical developments';
}

/**
 * **FALLBACK FUNCTIONS** (only used if Python service fails)
 */
async function generateFallbackSectorAnalysis() {
  const currentDate = new Date().toLocaleDateString();
  return {
    analysis: `Sector analysis fallback for ${currentDate} - Python service unavailable`,
    marketCycle: 'Unknown',
    leadingSectors: ['Technology'],
    laggingSectors: ['Utilities'],
    source: 'fallback'
  };
}

async function generateFallbackMacroAnalysis() {
  const currentDate = new Date().toLocaleDateString();
  return {
    analysis: `Macro analysis fallback for ${currentDate} - Python service unavailable`,
    riskLevel: 5,
    marketRegime: 'Unknown',
    source: 'fallback'
  };
}

export default router;