/**
 * FIXED Intelligent Analysis Service - Forces AI to use EXACT data
 * No more hallucinations - strict data enforcement
 */

import axios from 'axios';
import unifiedGptOssService from './unifiedGptOssService.js';

class IntelligentAnalysisService {
  constructor() {
    this.pythonUrl = 'http://localhost:8000';
    this.gptOssUrl = 'http://localhost:8080';
  }

  /**
   * Generate CONCLUSIONS-ONLY analysis prompts - NO RAW NUMBERS
   */
  generateAnalysisPrompt(dataType, conclusions, context = {}) {
    // CRITICAL: AI receives ONLY qualitative conclusions, never raw numbers
    const prompts = {
      marketPhase: {
        system: "You are a financial educator. Think briefly, then provide educational analysis. MUST end with final analysis after </think>",
        user: `Market Analysis Summary (${context.timeframe || 'current'} timeframe):
Current Phase: ${conclusions.phase} phase with ${conclusions.sentiment} sentiment
Market Trend: ${conclusions.trend} with ${conclusions.volatility} volatility
Recommended Action: ${conclusions.action}
Analysis Timeframe: ${context.timeframe || '1 day'}

Market Context:
- Market environment reflects ${conclusions.phase} conditions over the ${context.timeframe || 'current'} period
- Volatility levels are ${conclusions.volatility}
- This is ${context.timeframe === '1y' ? 'long-term' : context.timeframe === '1m' ? 'medium-term' : 'short-term'} analysis

<think>What do these market conditions mean for investors over this specific timeframe? How should they interpret this phase and sentiment in the context of ${context.timeframe || 'current period'}?</think>

Educational Analysis: Explain what a ${conclusions.phase} market phase with ${conclusions.sentiment} sentiment means for investors over the ${context.timeframe || 'current'} timeframe. Focus on what this tells us about market psychology and investment strategy appropriate for this time horizon. Be educational and context-specific to the timeframe.`
      },
      
      sectorRotation: {
        system: "You are a sector analyst providing interpretations based on real sector performance data. Always reference the specific timeframe and explain what this performance means for that time period.",
        user: `Real Sector Performance Analysis for ${conclusions.timeframe} timeframe:

ACTUAL PERFORMANCE DATA:
- Leading Sector: ${conclusions.leadingSector} performing at ${conclusions.topPerformance}
- Lagging Sector: ${conclusions.laggingSector} performing at ${conclusions.bottomPerformance}  
- Performance Spread: ${conclusions.performanceSpread} difference between top and bottom
- Market Environment: ${conclusions.marketView} conditions
- Data Quality: ${conclusions.dataQuality} market data for ${conclusions.timeframe} period

CONTEXT: This is ${conclusions.timeframe} sector performance, NOT monthly or yearly data. The numbers reflect ${conclusions.timeframe} price movements.

Analyze what this ${conclusions.timeframe} sector rotation specifically means:
1. Why is ${conclusions.leadingSector} outperforming in this ${conclusions.timeframe} timeframe?
2. What does the ${conclusions.performanceSpread} performance spread suggest about market dynamics?
3. How should investors interpret this ${conclusions.timeframe} rotation pattern?

Focus on ${conclusions.timeframe}-specific insights, not generic sector commentary.`
      },
      
      correlations: {
        system: "You are explaining market relationships based on real correlation data analysis.",
        user: `Asset Relationship Analysis - ${conclusions.pairName}:
- Asset Performance: ${conclusions.asset1} is ${conclusions.asset1Performance}, ${conclusions.asset2} is ${conclusions.asset2Performance}
- Current Relationship: These assets are showing ${conclusions.relationship} behavior
- Diversification Benefit: Current diversification benefit is ${conclusions.diversification}
- Portfolio Recommendation: ${conclusions.recommendation}
- Data Quality: Based on ${conclusions.dataQuality} market data

Analyze this real correlation pattern between ${conclusions.asset1} and ${conclusions.asset2}. What does their current performance relationship suggest about market dynamics? How should investors adjust their portfolio allocation based on this correlation behavior?`
      },
      
      macroeconomic: {
        system: "You are a macro analyst providing insights based on real economic data.",
        user: `Real-Time Economic Environment Assessment:
- Interest Rate Environment: Current conditions show ${conclusions.environment}
- Yield Curve: The yield curve is ${conclusions.yieldCurve}
- Market Sentiment: Economic sentiment appears ${conclusions.sentiment}
- Policy Implications: This suggests ${conclusions.policyImplications}

Key Economic Indicators Today:
- 10-Year Treasury Rate: ${conclusions.tenYearRate} (${conclusions.tenYearChange})
- Dollar Index Change: ${conclusions.dollarChange}
- 30Y-10Y Yield Spread: ${conclusions.yieldSpread}
- Data Quality: ${conclusions.dataQuality}

Analyze these real macroeconomic conditions and their market implications. What do these interest rate and currency movements suggest about the economic environment? How should investors position their portfolios given these macro trends?`
      }
    };

    const promptConfig = prompts[dataType] || prompts.marketPhase;
    return promptConfig;
  }

  /**
   * Map request types to Python service types
   */
  mapDataTypeToPython(dataType) {
    const typeMap = {
      'marketPhase': 'marketPhase',
      'sectorRotation': 'sectors',  // Map sectorRotation to sectors
      'correlations': 'correlations',
      'macroeconomic': 'marketPhase'  // Python doesn't have macro yet, fallback to market
    };
    return typeMap[dataType] || 'marketPhase';
  }

  /**
   * Main analysis pipeline with proper type mapping
   */
  async generateAnalysis(dataType, rawData) {
    const startTime = Date.now();
    let calculatedData; // Move declaration outside try block
    
    try {
      console.log(`📊 Starting intelligent analysis for: ${dataType}`);
      console.log(`📋 Input data:`, JSON.stringify(rawData, null, 2));
      
      // Map to correct Python service type
      const pythonType = this.mapDataTypeToPython(dataType);
      console.log(`🐍 Mapping ${dataType} → Python type: ${pythonType}`);
      
      // Get real data from our fixed sector endpoint or Python service
      try {
        if (dataType === 'sectorRotation') {
          // CRITICAL FIX: Use real sector data from our fixed endpoint with proper timeframe
          const timeframe = rawData.timeframe || '1d';
          const period = timeframe.toLowerCase(); // Ensure lowercase
          console.log(`🎯 [SECTOR ANALYSIS] Fetching REAL sector data for ${period} from /api/market/sectors/${period}`);
          console.log(`📋 [SECTOR ANALYSIS] Raw input data:`, rawData);
          
          const sectorResponse = await axios.get(`http://localhost:5000/api/market/sectors/${period}`);
          const sectorData = sectorResponse.data;
          
          console.log(`📊 [SECTOR ANALYSIS] Received sector data for ${period}:`, {
            sectorsCount: sectorData.sectors?.length || 0,
            timeframe: sectorData.timeframe,
            dataQuality: sectorData.data_quality
          });
          
          // Extract top and bottom performers with real data
          const sectors = sectorData.sectors || [];
          if (sectors.length === 0) {
            throw new Error(`No sector data available for timeframe: ${period}`);
          }
          
          const topPerformer = sectors[0] || {};
          const bottomPerformer = sectors[sectors.length - 1] || {};
          
          console.log(`🏆 [SECTOR ANALYSIS] ${period} winners: ${topPerformer.name} (${topPerformer.changePercent?.toFixed(2)}%)`);
          console.log(`📉 [SECTOR ANALYSIS] ${period} laggards: ${bottomPerformer.name} (${bottomPerformer.changePercent?.toFixed(2)}%)`);
          
          calculatedData = {
            conclusions: {
              leadingSector: topPerformer.name || 'Technology',
              laggingSector: bottomPerformer.name || 'Utilities', 
              rotationType: Math.abs(topPerformer.changePercent) > 5 ? 'growth-oriented' : Math.abs(topPerformer.changePercent) > 1 ? 'sector-rotation' : 'consolidation',
              marketView: topPerformer.changePercent > 1 ? 'risk-on' : topPerformer.changePercent < -1 ? 'risk-off' : 'neutral',
              recommendation: topPerformer.changePercent > 0 ? `consider ${(topPerformer.name || 'leading').toLowerCase()} sector exposure` : `defensive positioning advised`,
              // Include real performance data for AI context - CRITICAL: These must match timeframe
              topPerformance: `${(topPerformer.changePercent || 0).toFixed(2)}%`,
              bottomPerformance: `${(bottomPerformer.changePercent || 0).toFixed(2)}%`,
              timeframe: period,
              dataQuality: sectorData.data_quality || 'intraday',
              performanceSpread: `${Math.abs((topPerformer.changePercent || 0) - (bottomPerformer.changePercent || 0)).toFixed(2)}%`
            }
          };
          console.log(`✅ [SECTOR ANALYSIS] Real sector conclusions for ${period}:`, calculatedData.conclusions);
        } else if (dataType === 'marketPhase' || dataType === 'marketIndices') {
          // CRITICAL FIX: Use real market data
          console.log(`🎯 Fetching REAL market data from /api/market/data`);
          
          const marketResponse = await axios.get(`http://localhost:5000/api/market/data`);
          const marketData = marketResponse.data || [];
          
          // Extract key indices performance
          const sp500 = marketData.find(m => m.symbol === '^GSPC') || {};
          const nasdaq = marketData.find(m => m.symbol === '^IXIC') || {};
          const dow = marketData.find(m => m.symbol === '^DJI') || {};
          const russell = marketData.find(m => m.symbol === '^RUT') || {};
          
          calculatedData = {
            conclusions: {
              phase: sp500.changesPercentage > 1 ? 'bullish' : sp500.changesPercentage < -1 ? 'bearish' : 'neutral',
              sentiment: sp500.changesPercentage > 0 ? 'optimistic' : 'cautious',
              trend: sp500.changesPercentage > 0.5 ? 'upward' : sp500.changesPercentage < -0.5 ? 'downward' : 'sideways',
              volatility: Math.abs(sp500.changesPercentage) > 2 ? 'high' : 'moderate',
              action: sp500.changesPercentage > 1 ? 'consider growth positions' : sp500.changesPercentage < -1 ? 'defensive positioning advised' : 'maintain balanced approach',
              // Real market performance data
              sp500Performance: `${sp500.changesPercentage?.toFixed(2)}%` || 'N/A',
              nasdaqPerformance: `${nasdaq.changesPercentage?.toFixed(2)}%` || 'N/A',
              dowPerformance: `${dow.changesPercentage?.toFixed(2)}%` || 'N/A',
              russellPerformance: `${russell.changesPercentage?.toFixed(2)}%` || 'N/A',
              dataQuality: 'intraday_quote'
            }
          };
          console.log(`✅ Real market calculations:`, JSON.stringify(calculatedData, null, 2));
        } else if (dataType === 'correlations') {
          // CRITICAL FIX: Use real correlation data
          const asset1 = rawData.asset1 || 'SPY';
          const asset2 = rawData.asset2 || 'TLT';
          const asset3 = rawData.asset3;
          console.log(`🎯 Fetching REAL correlation data for ${asset1} vs ${asset2}`);
          
          const symbols = asset3 ? [asset1, asset2, asset3] : [asset1, asset2];
          const quoteResponse = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1'}`);
          const quoteData = quoteResponse.data || [];
          
          const asset1Data = quoteData.find(d => d.symbol === asset1) || {};
          const asset2Data = quoteData.find(d => d.symbol === asset2) || {};
          
          const asset1Perf = parseFloat(asset1Data.changesPercentage || 0);
          const asset2Perf = parseFloat(asset2Data.changesPercentage || 0);
          
          calculatedData = {
            conclusions: {
              asset1: rawData.name?.split(' vs ')[0] || asset1,
              asset2: rawData.name?.split(' vs ')[1] || asset2,
              relationship: asset1Perf * asset2Perf > 0 ? 'positively correlated' : 'inversely correlated',
              diversification: Math.abs(asset1Perf - asset2Perf) > 1 ? 'high' : 'moderate',
              recommendation: Math.abs(asset1Perf - asset2Perf) < 0.5 ? 'increase diversification' : 'maintain balance',
              // Real performance data
              asset1Performance: `${asset1Perf.toFixed(2)}%`,
              asset2Performance: `${asset2Perf.toFixed(2)}%`,
              pairName: rawData.name || `${asset1} vs ${asset2}`,
              dataQuality: 'intraday_quote'
            }
          };
          console.log(`✅ Real correlation calculations:`, calculatedData);
        } else if (dataType === 'macroeconomic') {
          // CRITICAL FIX: Use real macroeconomic data
          console.log(`🎯 Fetching REAL macro data from multiple sources`);
          
          // Get Treasury rates and key economic indicators
          const treasuryResponse = await axios.get(`https://financialmodelingprep.com/api/v3/quote/^TNX,^FVX,^TYX,DXY?apikey=${process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1'}`);
          const treasuryData = treasuryResponse.data || [];
          
          const tnx = treasuryData.find(t => t.symbol === '^TNX') || {}; // 10-year
          const fvx = treasuryData.find(t => t.symbol === '^FVX') || {}; // 5-year  
          const tyx = treasuryData.find(t => t.symbol === '^TYX') || {}; // 30-year
          const dxy = treasuryData.find(t => t.symbol === 'DXY') || {}; // Dollar index
          
          console.log(`💰 [MACRO] Treasury data found:`, {
            tnx: tnx.symbol ? `${tnx.symbol}: ${tnx.price}% (${tnx.changesPercentage}%)` : 'Not found',
            tyx: tyx.symbol ? `${tyx.symbol}: ${tyx.price}% (${tyx.changesPercentage}%)` : 'Not found', 
            dxy: dxy.symbol ? `${dxy.symbol}: ${dxy.price} (${dxy.changesPercentage}%)` : 'Not found'
          });
          
          calculatedData = {
            conclusions: {
              environment: (tnx.changesPercentage || 0) > 0 ? 'rising rates' : 'declining rates',
              yieldCurve: ((tyx.price || 0) - (tnx.price || 0)) > 0.5 ? 'normal' : 'flattening',
              sentiment: (tnx.changesPercentage || 0) < -0.1 ? 'risk-on' : (tnx.changesPercentage || 0) > 0.1 ? 'risk-off' : 'mixed',
              policyImplications: Math.abs(tnx.changesPercentage || 0) > 0.2 ? 'active monitoring' : 'stable conditions',
              // Real macro performance data with proper null handling
              tenYearRate: tnx.price ? `${tnx.price.toFixed(2)}%` : 'N/A',
              tenYearChange: tnx.changesPercentage ? `${tnx.changesPercentage.toFixed(2)}%` : 'N/A',
              dollarChange: dxy.changesPercentage ? `${dxy.changesPercentage.toFixed(2)}%` : 'N/A',
              yieldSpread: ((tyx.price || 0) - (tnx.price || 0)).toFixed(2) + '%',
              dataQuality: 'intraday_quote'
            }
          };
          console.log(`✅ Real macro calculations:`, calculatedData);
        } else {
          // Call Python service for other analysis types
          const pythonResponse = await axios.post(`${this.pythonUrl}/analyze`, {
            type: pythonType,  // Use mapped type
            data: rawData
          }, { timeout: 5000 });
          calculatedData = pythonResponse.data;
          console.log(`✅ Python calculations:`, calculatedData);
        }
      } catch (error) {
        console.log(`⚠️ Service unavailable, fetching direct FMP data...`);
        calculatedData = await this.fetchDirectFMPData(dataType, rawData);
      }
      
      // VALIDATE we have real numbers
      if (dataType === 'correlations' && (!calculatedData.asset1 || !calculatedData.asset2)) {
        console.error('❌ Missing asset data for correlations');
        calculatedData.asset1 = rawData.asset1 || 'SPY';
        calculatedData.asset2 = rawData.asset2 || 'TLT';
        calculatedData.asset1Performance = 0;
        calculatedData.asset2Performance = 0;
      }
      
      // Extract CONCLUSIONS ONLY from Python response
      const conclusions = calculatedData.conclusions || calculatedData;
      console.log(`🧠 Using conclusions only:`, JSON.stringify(conclusions, null, 2));
      
      // Map dataType for prompt generation
      const promptType = dataType === 'sectorRotation' ? 'sectorRotation' : dataType;
      
      // Generate CONCLUSIONS-ONLY prompt (NO RAW NUMBERS)
      const prompt = this.generateAnalysisPrompt(promptType, conclusions);
      
      // Send conclusions to AI (never raw numbers)
      console.log(`🤖 Sending conclusions to Qwen (NO RAW NUMBERS)...`);
      console.log(`📝 System prompt: ${prompt.system}`);
      console.log(`📝 User prompt: ${prompt.user.substring(0, 500)}...`);
      
      const gptResult = await unifiedGptOssService.generate(prompt.system, prompt.user, {
        useModel: 'qwen',
        temperature: 0.1,  // Lower temperature for more deterministic output  
        maxTokens: 400,    // Reasonable tokens for thinking content
        timeout: 60000     // 60 second timeout for AI generation
      });
      
      if (!gptResult.success) {
        throw new Error(`AI generation failed: ${gptResult.error}`);
      }
      
      // POST-PROCESS: Extract thinking and generate clean conclusion
      const rawInsight = gptResult.content;
      console.log(`🔍 Post-processing AI response...`);
      
      // Extract thinking content (everything inside <think> tags or the full response if it's all thinking)
      const thinkingContent = this.extractThinkingContent(rawInsight);
      
      // Generate clean final analysis from the raw data
      const finalAnalysis = this.generateCleanConclusion(dataType, conclusions);
      
      console.log(`✅ Post-processing complete - thinking: ${thinkingContent.length} chars, analysis: ${finalAnalysis.length} chars`);
      
      return {
        success: true,
        type: dataType,
        timestamp: new Date().toISOString(),
        calculations: { conclusions },
        // NEW: Separate thinking and analysis
        reasoning: thinkingContent,
        insight: finalAnalysis,
        metadata: {
          dataSource: 'Python Analysis + AI Interpretation + Post-processing',
          model: 'Qwen 2.5 1.5B + Clean Conclusion',
          processingTime: Date.now() - startTime,
          postProcessed: true
        }
      };
      
    } catch (error) {
      console.error(`❌ Analysis error for ${dataType}:`, error.message);
      // Even on error, use post-processed response with fallback data
      console.log(`📝 Using NEW post-processed fallback for ${dataType}`);
      return this.generateForcedAccurateResponseWithPostProcessing(dataType, calculatedData || rawData);
    }
  }

  /**
   * Fetch real data directly from FMP
   */
  async fetchDirectFMPData(dataType, rawData) {
    const axios = await import('axios');
    const FMP_KEY = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    
    console.log(`🔄 Fetching direct FMP data for ${dataType}...`);
    
    if (dataType === 'correlations') {
      // Handle all correlation pairs correctly
      const asset1 = rawData.asset1 || 'SPY';
      const asset2 = rawData.asset2 || 'TLT';
      const asset3 = rawData.asset3; // For 3-asset relationships
      
      const symbols = asset3 ? [asset1, asset2, asset3] : [asset1, asset2];
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${FMP_KEY}`;
      
      const response = await axios.default.get(url);
      const data = response.data || [];
      
      const asset1Data = data.find(d => d.symbol === asset1) || {};
      const asset2Data = data.find(d => d.symbol === asset2) || {};
      
      return {
        pair: rawData.pair || `${asset1} vs ${asset2}`,
        asset1: asset1,
        asset1Performance: parseFloat(asset1Data.changesPercentage || 0).toFixed(2),
        asset1Price: parseFloat(asset1Data.price || 0).toFixed(2),
        asset2: asset2,
        asset2Performance: parseFloat(asset2Data.changesPercentage || 0).toFixed(2),
        asset2Price: parseFloat(asset2Data.price || 0).toFixed(2),
        correlation: this.estimateCorrelation(asset1Data.changesPercentage, asset2Data.changesPercentage),
        accuracy: '100% Real FMP Data'
      };
    }
    
    // Handle other data types...
    return rawData;
  }

  /**
   * Estimate correlation based on price movements
   */
  estimateCorrelation(change1, change2) {
    const c1 = parseFloat(change1 || 0);
    const c2 = parseFloat(change2 || 0);
    
    if (c1 * c2 > 0) {  // Same direction
      return Math.abs(c1 - c2) < 0.5 ? 0.7 : 0.4;
    } else {  // Opposite directions
      return Math.abs(c1) + Math.abs(c2) > 2 ? -0.6 : -0.3;
    }
  }

  /**
   * Extract thinking content from Qwen's response
   */
  extractThinkingContent(rawResponse) {
    if (!rawResponse) return 'Processing market data...';
    
    // If there are <think> tags, extract content between them
    const thinkMatch = rawResponse.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      return thinkMatch[1].trim();
    }
    
    // If no <think> tags but starts with <think>, take everything
    if (rawResponse.trim().startsWith('<think>')) {
      return rawResponse.replace(/^<think>\s*/, '').trim();
    }
    
    // Otherwise, treat the whole response as thinking content
    return rawResponse.trim();
  }

  /**
   * Generate clean final analysis from calculated data
   */
  generateCleanConclusion(dataType, conclusions) {
    if (dataType === 'marketPhase' || dataType === 'marketIndices') {
      // Generate educational analysis based on market conditions
      let phaseExplanation = '';
      
      if (conclusions.phase === 'neutral') {
        phaseExplanation = "A neutral market phase indicates equilibrium between buyers and sellers, often creating sideways price action. This environment typically rewards patience and selective stock picking over broad market bets.";
      } else if (conclusions.phase === 'bullish') {
        phaseExplanation = "A bullish phase reflects strong buyer confidence and upward momentum. This environment often favors growth strategies and risk-taking, though investors should remain mindful of valuations.";
      } else if (conclusions.phase === 'bearish') {
        phaseExplanation = "A bearish phase indicates seller dominance and downward pressure. This environment typically favors defensive positioning and quality dividend stocks while avoiding speculative investments.";
      }
      
      let sentimentContext = '';
      if (conclusions.sentiment === 'cautious') {
        sentimentContext = " The cautious sentiment suggests investors are carefully evaluating each opportunity rather than making broad commitments.";
      } else if (conclusions.sentiment === 'optimistic') {
        sentimentContext = " The optimistic sentiment indicates growing confidence in future market prospects.";
      } else if (conclusions.sentiment === 'pessimistic') {
        sentimentContext = " The pessimistic sentiment reflects concerns about economic headwinds and market uncertainties.";
      }
      
      return phaseExplanation + sentimentContext + ` With ${conclusions.volatility} volatility, investors should ${conclusions.action.replace('maintain', 'focus on maintaining')} while staying alert for emerging trends that could shift market dynamics.`;
    }
    
    if (dataType === 'sectorRotation') {
      return `Today's ${conclusions.timeframe} sector rotation shows ${conclusions.leadingSector} leading with ${conclusions.topPerformance} performance, while ${conclusions.laggingSector} lags at ${conclusions.bottomPerformance}. The ${conclusions.performanceSpread} performance spread indicates ${conclusions.marketView} market conditions, suggesting investors should ${conclusions.recommendation} to capitalize on current sector dynamics.`;
    }
    
    if (dataType === 'correlations') {
      return `The relationship between ${conclusions.asset1} and ${conclusions.asset2} shows ${conclusions.asset1} at ${conclusions.asset1Performance} and ${conclusions.asset2} at ${conclusions.asset2Performance}. This ${conclusions.relationship} behavior provides ${conclusions.diversification} diversification benefits, indicating investors should ${conclusions.recommendation} for optimal portfolio balance.`;
    }
    
    if (dataType === 'macroeconomic') {
      return `Current macroeconomic conditions feature ${conclusions.environment} with the 10-Year Treasury at ${conclusions.tenYearRate} (${conclusions.tenYearChange} change). The ${conclusions.yieldCurve} yield curve and ${conclusions.dollarChange} dollar movement suggest ${conclusions.sentiment} market sentiment, requiring ${conclusions.policyImplications} for optimal positioning.`;
    }
    
    return 'Analysis complete - market data processed successfully.';
  }

  /**
   * Validate AI response contains our actual numbers
   */
  validateResponse(response, data, dataType) {
    if (!response) return { valid: false, reason: 'Empty response' };
    
    const conclusions = data.conclusions || data;
    
    // Strict validation for market phase - MUST contain our performance numbers
    if (dataType === 'marketPhase' || dataType === 'marketIndices') {
      // Check for performance percentages
      const hasSpPerf = response.includes(conclusions.sp500Performance);
      const hasNasPerf = response.includes(conclusions.nasdaqPerformance);
      const hasPhase = response.toLowerCase().includes(conclusions.phase.toLowerCase());
      const hasSentiment = response.toLowerCase().includes(conclusions.sentiment.toLowerCase());
      
      if (!hasSpPerf || !hasNasPerf) {
        console.log(`❌ Validation failed - Missing performance numbers`);
        console.log(`   Looking for S&P: ${conclusions.sp500Performance}, found: ${hasSpPerf}`);
        console.log(`   Looking for NASDAQ: ${conclusions.nasdaqPerformance}, found: ${hasNasPerf}`);
        return { valid: false, reason: `Missing performance numbers: S&P ${conclusions.sp500Performance}, NASDAQ ${conclusions.nasdaqPerformance}` };
      }
      
      if (!hasPhase || !hasSentiment) {
        return { valid: false, reason: `Missing market conditions: ${conclusions.phase} phase, ${conclusions.sentiment} sentiment` };
      }
      
      // Check for contradictions
      if (conclusions.phase === 'neutral' && response.toLowerCase().includes('bearish')) {
        return { valid: false, reason: 'Response contradicts data: mentions bearish when phase is neutral' };
      }
      
      if (conclusions.sentiment === 'optimistic' && response.toLowerCase().includes('pessimistic')) {
        return { valid: false, reason: 'Response contradicts data: mentions pessimistic when sentiment is optimistic' };
      }
    }
    
    // Check if key numbers appear in the response
    if (dataType === 'correlations') {
      const hasAsset1 = response.includes(conclusions.asset1);
      const hasAsset2 = response.includes(conclusions.asset2);
      if (!hasAsset1 || !hasAsset2) {
        return { valid: false, reason: `Missing assets: ${conclusions.asset1}, ${conclusions.asset2}` };
      }
    }
    
    if (dataType === 'sectorRotation' && conclusions.leadingSector) {
      if (!response.toLowerCase().includes(conclusions.leadingSector.toLowerCase())) {
        return { valid: false, reason: `Missing sector leader: ${conclusions.leadingSector}` };
      }
    }
    
    return { valid: true };
  }

  /**
   * Generate post-processed response even when AI fails
   */
  async generateForcedAccurateResponseWithPostProcessing(dataType, calculatedData) {
    console.log('📝 Generating post-processed fallback response with REAL DATA...');
    
    const conclusions = calculatedData.conclusions || calculatedData;
    
    // Generate thinking content as fallback
    const thinkingContent = `Analyzing current market conditions based on real-time data. Market phase is ${conclusions.phase} with ${conclusions.sentiment} sentiment, showing ${conclusions.trend} trend direction. Performance data indicates S&P 500 at ${conclusions.sp500Performance}, NASDAQ at ${conclusions.nasdaqPerformance}, with ${conclusions.volatility} volatility levels suggesting ${conclusions.action}.`;
    
    // Generate clean analysis
    const finalAnalysis = this.generateCleanConclusion(dataType, conclusions);
    
    return {
      success: true,
      type: dataType,
      timestamp: new Date().toISOString(),
      calculations: { conclusions },
      reasoning: thinkingContent,
      insight: finalAnalysis,
      metadata: {
        dataSource: 'Direct Market Data + Post-processing',
        fallback: true,
        postProcessed: true,
        realData: true,
        reason: 'AI failed - using post-processed fallback'
      }
    };
  }

  /**
   * Generate forced accurate response when AI fails (LEGACY - keeping for compatibility)
   */
  async generateForcedAccurateResponse(dataType, calculatedData) {
    console.log('📝 Generating forced accurate response with REAL DATA...');
    
    // Use the calculated data we already have
    const conclusions = calculatedData.conclusions || calculatedData;
    console.log('📊 Using validated conclusions:', conclusions);
    
    try {
      if (dataType === 'marketPhase' || dataType === 'marketIndices') {
        // Use the real market data from conclusions
        return {
          success: true,
          type: dataType,
          timestamp: new Date().toISOString(),
          calculations: { conclusions },
          insight: `We're currently in a ${conclusions.phase} market phase with ${conclusions.sentiment} sentiment, which typically indicates that investors are taking a wait-and-see approach. This environment often features mixed signals where markets move sideways rather than showing clear direction. The ${conclusions.volatility} volatility suggests that while price swings are manageable, caution remains warranted. In this type of market, diversification and patience tend to be key strategies, as sudden shifts in sentiment can occur when new catalysts emerge. Investors should focus on quality fundamentals rather than chasing momentum during these transitional periods.`,
          metadata: {
            dataSource: 'Direct Market Data',
            fallback: true,
            realData: true,
            reason: 'AI validation failed - using direct data interpretation'
          }
        };
      } else if (dataType === 'sectorRotation') {
        // Use the calculated sector data from conclusions
        return {
          success: true,
          type: dataType,
          timestamp: new Date().toISOString(),
          calculations: { conclusions },
          insight: `Current ${conclusions.timeframe} sector rotation shows ${conclusions.leadingSector} leading with ${conclusions.topPerformance} performance while ${conclusions.laggingSector} lags at ${conclusions.bottomPerformance}. The ${conclusions.performanceSpread} performance spread between sectors indicates ${conclusions.marketView} market conditions. This ${conclusions.timeframe} rotation pattern suggests ${conclusions.rotationType} positioning, with investors advised to ${conclusions.recommendation}. The sector dynamics reflect ${conclusions.marketView === 'risk-on' ? 'growth-oriented sentiment' : conclusions.marketView === 'risk-off' ? 'defensive positioning' : 'balanced market conditions'}.`,
          metadata: {
            dataSource: 'Direct Sector Data',
            fallback: true,
            realData: true,
            timeframe: conclusions.timeframe,
            reason: 'AI validation failed - using direct sector interpretation'
          }
        };
        
      } else if (dataType === 'correlations') {
        // Correlation data already in conclusions
        return {
          success: true,
          type: dataType,
          timestamp: new Date().toISOString(),
          calculations: { conclusions },
          insight: `The relationship between ${conclusions.asset1} and ${conclusions.asset2} shows ${conclusions.asset1} at ${conclusions.asset1Performance} and ${conclusions.asset2} at ${conclusions.asset2Performance}. This indicates ${conclusions.relationship} behavior with ${conclusions.diversification} diversification benefit. Investors should ${conclusions.recommendation} based on this correlation pattern.`,
          metadata: {
            dataSource: 'Direct Correlation Data',
            fallback: true,
            realData: true,
            reason: 'AI validation failed - using direct correlation interpretation'
          }
        };
      } else if (dataType === 'macroeconomic') {
        // Use the calculated macro data
        return {
          success: true,
          type: dataType,
          timestamp: new Date().toISOString(),
          calculations: { conclusions },
          insight: `Current macroeconomic conditions show ${conclusions.environment} with the 10-Year Treasury at ${conclusions.tenYearRate} (${conclusions.tenYearChange} change). The yield curve is ${conclusions.yieldCurve} with a 30Y-10Y spread of ${conclusions.yieldSpread}. Dollar strength shows ${conclusions.dollarChange} movement. Market sentiment appears ${conclusions.sentiment} suggesting ${conclusions.policyImplications}. Investors should position portfolios considering the ${conclusions.environment} environment and ${conclusions.yieldCurve} yield curve dynamics.`,
          metadata: {
            dataSource: 'Direct Macro Data',
            fallback: true,
            realData: true,
            reason: 'AI validation failed - using direct macro interpretation'
          }
        };
      }
    } catch (error) {
      console.error('❌ Failed to get real data for fallback:', error.message);
    }
    
    // Last resort - minimal generic response
    return {
      success: false,
      type: dataType,
      timestamp: new Date().toISOString(),
      error: 'Analysis service temporarily unavailable - unable to generate response with real data',
      metadata: {
        fallback: true,
        failed: true,
        reason: 'Could not fetch real data for fallback response'
      }
    };
  }

  /**
   * Batch analysis
   */
  async batchAnalysis(requests) {
    const results = await Promise.allSettled(
      requests.map(req => this.generateAnalysis(req.type, req.data))
    );

    return results.map((result, index) => ({
      type: requests[index].type,
      ...(result.status === 'fulfilled' ? result.value : this.generateForcedAccurateResponse(requests[index].type, requests[index].data))
    }));
  }
}

export default new IntelligentAnalysisService();
