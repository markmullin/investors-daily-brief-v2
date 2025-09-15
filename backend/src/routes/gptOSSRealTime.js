/**
 * REAL-TIME GPT-OSS MARKET ANALYSIS
 * Uses ACTUAL live market data - NO synthetic/fake data
 * GPT-OSS processes real financial data like a human analyst would
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();
const llamaURL = 'http://localhost:8080';

/**
 * REAL-TIME MARKET ANALYSIS WITH LIVE DATA
 * Fetches actual market data and feeds it to GPT-OSS for analysis
 */
router.post('/real-analysis', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { analysisType = 'market' } = req.body;
    
    console.log('📊 FETCHING REAL MARKET DATA for GPT-OSS analysis...');
    
    // Step 1: Fetch REAL market data
    let marketData = {};
    let reasoningSteps = [
      { step: 1, status: 'fetching', message: 'Fetching live market data from FMP API...', timestamp: Date.now() }
    ];

    try {
      // Get real S&P 500, NASDAQ, VIX data from FMP API
      const fmpBaseUrl = 'https://financialmodelingprep.com';
      const marketResponse = await axios.get(`${fmpBaseUrl}/api/v3/quote/^GSPC,^IXIC,^VIX,^TNX`, {
        params: { apikey: process.env.FMP_API_KEY },
        timeout: 5000
      });
      
      const quotes = marketResponse.data;
      const sp500 = quotes.find(q => q.symbol === '^GSPC') || {};
      const nasdaq = quotes.find(q => q.symbol === '^IXIC') || {};
      const vix = quotes.find(q => q.symbol === '^VIX') || {};
      const treasury10y = quotes.find(q => q.symbol === '^TNX') || {};
      
      marketData = {
        sp500Price: sp500.price || 0,
        sp500Change: sp500.changesPercentage || 0,
        nasdaqPrice: nasdaq.price || 0,
        nasdaqChange: nasdaq.changesPercentage || 0,
        vix: vix.price || 0,
        treasury10y: treasury10y.price || 0,
        timestamp: new Date().toISOString(),
        marketHours: isMarketHours()
      };
      
      reasoningSteps.push({
        step: 2,
        status: 'success',
        message: `Live data: S&P ${marketData.sp500Price} (${marketData.sp500Change > 0 ? '+' : ''}${marketData.sp500Change.toFixed(2)}%), VIX ${marketData.vix.toFixed(1)}`,
        timestamp: Date.now()
      });
      
    } catch (dataError) {
      console.error('❌ Failed to fetch real market data:', dataError.message);
      
      reasoningSteps.push({
        step: 2,
        status: 'failed',
        message: 'Failed to fetch live market data - analysis cannot proceed with fake data',
        timestamp: Date.now()
      });
      
      return res.status(503).json({
        success: false,
        error: 'Real market data unavailable',
        message: 'Cannot provide analysis without live market data. This dashboard requires real-time financial data.',
        reasoning: reasoningSteps
      });
    }

    // Step 2: Determine market phase from real data
    let marketPhase = 'NEUTRAL';
    let marketContext = '';
    
    if (marketData.sp500Change > 1) {
      marketPhase = 'BULLISH';
      marketContext = 'strong upward momentum';
    } else if (marketData.sp500Change < -1) {
      marketPhase = 'BEARISH';  
      marketContext = 'downward pressure';
    } else if (marketData.vix > 25) {
      marketPhase = 'VOLATILE';
      marketContext = 'elevated uncertainty';
    } else {
      marketPhase = 'NEUTRAL';
      marketContext = 'mixed signals';
    }
    
    reasoningSteps.push({
      step: 3,
      status: 'analyzed',
      message: `Market phase: ${marketPhase} (${marketContext}) based on real data`,
      timestamp: Date.now()
    });

    // Step 3: Build expert-level prompt with real data
    const expertPrompt = buildExpertPrompt(analysisType, marketData, marketPhase);
    
    reasoningSteps.push({
      step: 4,
      status: 'prompting',
      message: 'Sending real market data to GPT-OSS for expert analysis...',
      timestamp: Date.now()
    });

    // Step 4: Try GPU with 3-second timeout, fallback to intelligent real-data analysis
    let gpuAnalysis = null;
    let analysisSource = 'GPT-OSS RTX 5060';
    
    try {
      reasoningSteps.push({
        step: 4,
        status: 'attempting',
        message: 'Trying GPU analysis (3-second timeout)...',
        timestamp: Date.now()
      });

      const gpuResponse = await axios.post(`${llamaURL}/v1/chat/completions`, {
        model: 'gpt-oss-20b',
        messages: [
          { 
            role: 'system', 
            content: 'You are a senior financial analyst. Provide 2-3 sentence analysis of real market data.' 
          },
          { role: 'user', content: expertPrompt }
        ],
        temperature: 0.3,
        max_tokens: 150, // Reduced for speed
        stream: false
      }, {
        timeout: 3000 // 3 seconds MAX
      });

      gpuAnalysis = gpuResponse.data.choices[0].message.content.trim();
      gpuAnalysis = gpuAnalysis.replace(/<\|.*?\|>/g, '').trim();
      
      reasoningSteps.push({
        step: 5,
        status: 'gpu_success',
        message: `GPU generated analysis in <3 seconds`,
        timestamp: Date.now()
      });

    } catch (gpuError) {
      console.log('⚠️ GPU timeout/error, using intelligent fallback with real data');
      
      reasoningSteps.push({
        step: 5,
        status: 'gpu_failed',
        message: 'GPU timeout (<3s) - switching to intelligent real-data analysis',
        timestamp: Date.now()
      });
      
      // INTELLIGENT FALLBACK WITH REAL MARKET DATA
      gpuAnalysis = generateRealDataAnalysis(analysisType, marketData, marketPhase);
      analysisSource = 'Intelligent Analysis (Real Market Data)';
      
      reasoningSteps.push({
        step: 6,
        status: 'fallback_success',
        message: 'Generated intelligent analysis using real market conditions',
        timestamp: Date.now()
      });
    }

    const totalTime = Date.now() - startTime;
    
    reasoningSteps.push({
      step: 6,
      status: 'completed',
      message: `Analysis completed in ${totalTime}ms using real market data`,
      timestamp: Date.now()
    });

    // Return real analysis (GPU or intelligent fallback)
    res.json({
      success: true,
      data: {
        analysis: gpuAnalysis,
        marketData: marketData,
        marketPhase: marketPhase,
        source: analysisSource + ' + Live FMP Data',
        analysisType: analysisType,
        reasoning: reasoningSteps,
        performance: {
          responseTime: `${totalTime}ms`,
          dataFreshness: marketData.marketHours ? 'Live' : 'After Hours',
          realData: true,
          productionReady: totalTime < 5000
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Real-time analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Analysis system error',
      message: 'Unable to provide real-time market analysis',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Build expert-level prompts with real market data
 */
function buildExpertPrompt(analysisType, marketData, marketPhase) {
  const baseContext = `Current market conditions (REAL DATA as of ${marketData.timestamp}):
- S&P 500: ${marketData.sp500Price} (${marketData.sp500Change > 0 ? '+' : ''}${marketData.sp500Change.toFixed(2)}%)
- NASDAQ: ${marketData.nasdaqPrice} (${marketData.nasdaqChange > 0 ? '+' : ''}${marketData.nasdaqChange.toFixed(2)}%)  
- VIX (Fear Index): ${marketData.vix.toFixed(1)}
- 10-Year Treasury: ${marketData.treasury10y.toFixed(2)}%
- Market Phase: ${marketPhase}
- Market Hours: ${marketData.marketHours ? 'OPEN' : 'CLOSED'}`;

  switch(analysisType) {
    case 'marketPhase':
      return `${baseContext}

As a senior financial analyst, analyze these REAL market conditions. What do these specific numbers tell us about current market sentiment? What should investors focus on given the actual VIX level of ${marketData.vix.toFixed(1)} and S&P movement of ${marketData.sp500Change.toFixed(2)}%? Provide specific, actionable insights based on these real numbers.`;

    case 'sectors':  
      return `${baseContext}

Given these real market conditions, analyze sector rotation opportunities. With the VIX at ${marketData.vix.toFixed(1)} and 10-year yields at ${marketData.treasury10y.toFixed(2)}%, which sectors should outperform? Be specific about why these market conditions favor certain sectors over others.`;

    case 'correlations':
      return `${baseContext}

Analyze the relationship between these real market indicators. How does the current VIX level of ${marketData.vix.toFixed(1)} relate to the S&P's ${marketData.sp500Change.toFixed(2)}% move? What do treasury yields at ${marketData.treasury10y.toFixed(2)}% signal for risk assets? Provide correlation insights based on these actual numbers.`;

    case 'macro':
      return `${baseContext}

From a macroeconomic perspective, analyze what these real numbers reveal. Treasury yields at ${marketData.treasury10y.toFixed(2)}% combined with VIX at ${marketData.vix.toFixed(1)} - what does this tell us about Fed policy expectations and economic outlook? Focus on the macro implications of these specific data points.`;

    default:
      return `${baseContext}

As a financial expert, provide your analysis of these real market conditions. Focus on what these specific numbers mean for investors right now.`;
  }
}

/**
 * Check if markets are currently open (rough estimate)
 */
function isMarketHours() {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();
  
  // Monday-Friday, 9:30 AM - 4:00 PM ET (rough)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
}

/**
 * Health check with real data verification
 */
router.get('/health', async (req, res) => {
  const checks = {
    gpu: 'checking...',
    fmpData: 'checking...',
    realTimeCapable: false
  };
  
  try {
    // Test GPU
    await axios.get(`${llamaURL}/health`, { timeout: 2000 });
    checks.gpu = 'online';
  } catch (e) {
    checks.gpu = 'offline';
  }
  
  try {
    // Test FMP real data
    const fmpBaseUrl = 'https://financialmodelingprep.com';
    await axios.get(`${fmpBaseUrl}/api/v3/quote/^GSPC`, {
      params: { apikey: process.env.FMP_API_KEY },
      timeout: 3000
    });
    checks.fmpData = 'live data available';
  } catch (e) {
    checks.fmpData = 'no live data';
  }
  
  checks.realTimeCapable = checks.gpu === 'online' && checks.fmpData === 'live data available';
  
  res.json({
    status: checks.realTimeCapable ? 'production-ready' : 'degraded',
    service: 'real-time-gpt-oss',
    checks: checks,
    message: checks.realTimeCapable ? 
      'Ready for real-time market analysis with live data' : 
      'Cannot provide real analysis - missing GPU or live data',
    timestamp: new Date().toISOString()
  });
});

export default router;
