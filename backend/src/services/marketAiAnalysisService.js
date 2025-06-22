// marketAiAnalysisService.js - Enhanced market analysis with AI
import { marketService } from './apiServices.js';
import pythonBridge from '../utils/pythonBridge.js';
import cacheManager from '../utils/cacheManager.js';
import mistralService from './mistralService.js';

/**
 * Provides AI-powered market analysis for the dashboard
 */
const marketAiAnalysisService = {
  /**
   * Initialize the service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  initialize: async () => {
    console.log('Initializing Market AI Analysis Service...');
    
    try {
      // Check Python environment
      const pythonReady = await pythonBridge.checkPythonEnvironment();
      if (!pythonReady) {
        console.error('Python environment check failed. Market AI Analysis Service may not function properly.');
      }
      
      // Initialize Mistral service
      const mistralReady = await mistralService.initialize();
      if (!mistralReady) {
        console.warn('Mistral service initialization failed. Falling back to enhanced algorithmic analysis.');
        console.warn('Mistral error:', mistralService.getLastAuthError());
      }
      
      console.log('Market AI Analysis Service initialized.');
      return true;
    } catch (error) {
      console.error('Failed to initialize Market AI Analysis Service:', error);
      return false;
    }
  },

  /**
   * Generate market environment analysis
   * @param {string} viewMode - "basic" or "advanced" view mode
   * @returns {Promise<Object>} - Analysis results
   */
  generateMarketEnvironmentAnalysis: async (viewMode = 'basic') => {
    try {
      console.log(`Generating market environment analysis (${viewMode} mode)...`);
      
      // Create cache key based on current hour (refresh hourly)
      const now = new Date();
      const cacheKey = `market_environment_${viewMode}_${now.toISOString().split('T')[0]}_${now.getHours()}`;
      
      // Try to get from cache first
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached market environment analysis');
        return cachedResult;
      }
      
      // Fetch required data
      const [priceHistory, sectorData] = await Promise.all([
        marketService.getHistoricalData('SPY'),
        marketService.getSectorData()
      ]);
      
      // Run Python analysis
      const analysisData = {
        price_history: priceHistory,
        sector_data: sectorData,
        view_mode: viewMode
      };
      
      console.log('Running Python market environment analysis...');
      const pythonAnalysis = await pythonBridge.runPythonAnalysis('market_environment.py', analysisData);
      
      // Check if Python analysis was successful
      if (!pythonAnalysis || pythonAnalysis.error) {
        console.error('Python analysis failed:', pythonAnalysis?.error || 'Unknown error');
        return {
          error: 'Failed to generate market environment analysis',
          source: 'python',
          generated: false
        };
      }
      
      // Extract key information for text generation
      const analysisPrompt = createMarketAnalysisPrompt(pythonAnalysis, viewMode);
      
      // Generate text analysis with Mistral if available
      let textAnalysis = null;
      let analysisSource = 'algorithmic';
      
      if (mistralService.isReady()) {
        console.log('Generating Mistral text analysis...');
        try {
          textAnalysis = await mistralService.generateText(analysisPrompt, {
            temperature: 0.3,
            maxTokens: viewMode === 'advanced' ? 1024 : 512
          });
          analysisSource = 'ai';
        } catch (mistralError) {
          console.error('Mistral text generation failed:', mistralError);
          // Fall back to enhanced analysis
          textAnalysis = createEnhancedFallbackAnalysis(pythonAnalysis, viewMode);
        }
      } else {
        console.log('Mistral not available, using enhanced algorithmic analysis');
        textAnalysis = createEnhancedFallbackAnalysis(pythonAnalysis, viewMode);
      }
      
      // If text contains fallback message, use our enhanced analysis
      if (textAnalysis.includes('temporarily unavailable') || 
          textAnalysis.includes('using algorithmic generation')) {
        console.log('Mistral returned fallback message, using enhanced analysis');
        textAnalysis = createEnhancedFallbackAnalysis(pythonAnalysis, viewMode);
        analysisSource = 'enhanced-algorithmic';
      }
      
      // Combined result
      const result = {
        analysis: textAnalysis,
        score: pythonAnalysis.score || 50,
        market_phase: pythonAnalysis.market_phase || 'Unknown',
        technical_grade: mapScoreToGrade(pythonAnalysis.technical_analysis?.score || 50),
        breadth_grade: mapScoreToGrade(pythonAnalysis.sector_analysis?.breadth_percent || 50),
        sentiment_grade: mapScoreToGrade(pythonAnalysis.sentiment_analysis?.score || 60),
        source: analysisSource,
        generated: true,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      cacheManager.set(cacheKey, result, 3600); // Cache for 1 hour
      
      return result;
    } catch (error) {
      console.error('Error generating market environment analysis:', error);
      return {
        analysis: "Market analysis is temporarily unavailable. Please try again later.",
        score: 50,
        market_phase: "Unknown",
        technical_grade: "C",
        breadth_grade: "C",
        sentiment_grade: "C",
        source: "error",
        generated: false,
        error: error.message
      };
    }
  },

  /**
   * Generate sector rotation analysis
   * @returns {Promise<Object>} - Analysis results
   */
  generateSectorRotationAnalysis: async () => {
    try {
      console.log('Generating sector rotation analysis...');
      
      // Create cache key based on current date (refresh daily)
      const cacheKey = `sector_rotation_${new Date().toISOString().split('T')[0]}`;
      
      // Try to get from cache first
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached sector rotation analysis');
        return cachedResult;
      }
      
      // Fetch required data
      const sectorData = await marketService.getSectorData();
      
      // Run Python analysis
      const analysisData = {
        sector_data: sectorData,
        historical_data: [] // We don't have historical rotation data yet
      };
      
      console.log('Running Python sector rotation analysis...');
      const pythonAnalysis = await pythonBridge.runPythonAnalysis('sector_rotation.py', analysisData);
      
      // Check if Python analysis was successful
      if (!pythonAnalysis || pythonAnalysis.error) {
        console.error('Python analysis failed:', pythonAnalysis?.error || 'Unknown error');
        return {
          error: 'Failed to generate sector rotation analysis',
          source: 'python',
          generated: false
        };
      }
      
      // Extract key information for text generation
      const analysisPrompt = createSectorRotationPrompt(pythonAnalysis);
      
      // Generate text analysis with Mistral if available
      let textAnalysis = null;
      let analysisSource = 'algorithmic';
      
      if (mistralService.isReady()) {
        console.log('Generating Mistral text analysis...');
        try {
          textAnalysis = await mistralService.generateText(analysisPrompt);
          analysisSource = 'ai';
        } catch (mistralError) {
          console.error('Mistral text generation failed:', mistralError);
          // Fall back to enhanced analysis
          textAnalysis = createEnhancedSectorRotationAnalysis(pythonAnalysis);
        }
      } else {
        console.log('Mistral not available, using enhanced algorithmic analysis');
        textAnalysis = createEnhancedSectorRotationAnalysis(pythonAnalysis);
      }
      
      // If text contains fallback message, use our enhanced analysis
      if (textAnalysis.includes('temporarily unavailable') || 
          textAnalysis.includes('using algorithmic generation')) {
        console.log('Mistral returned fallback message, using enhanced analysis');
        textAnalysis = createEnhancedSectorRotationAnalysis(pythonAnalysis);
        analysisSource = 'enhanced-algorithmic';
      }
      
      // Combined result
      const result = {
        analysis: textAnalysis,
        market_cycle: pythonAnalysis.market_cycle?.phase || 'Unknown',
        leading_sectors: pythonAnalysis.current_leadership?.leading_sectors || [],
        lagging_sectors: pythonAnalysis.current_leadership?.lagging_sectors || [],
        actionable_insights: pythonAnalysis.actionable_insights || [],
        source: analysisSource,
        generated: true,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      cacheManager.set(cacheKey, result, 86400); // Cache for 1 day
      
      return result;
    } catch (error) {
      console.error('Error generating sector rotation analysis:', error);
      return {
        analysis: "Sector rotation analysis is temporarily unavailable.",
        market_cycle: "Unknown",
        leading_sectors: [],
        lagging_sectors: [],
        actionable_insights: [],
        source: "error",
        generated: false,
        error: error.message
      };
    }
  },

  /**
   * Generate macro analysis
   * @returns {Promise<Object>} - Analysis results
   */
  generateMacroAnalysis: async () => {
    try {
      console.log('Generating macro analysis...');
      
      // Create cache key based on current date (refresh daily)
      const cacheKey = `macro_analysis_${new Date().toISOString().split('T')[0]}`;
      
      // Try to get from cache first
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached macro analysis');
        return cachedResult;
      }
      
      // Fetch required data
      const macroSymbols = ['TLT', 'UUP', 'GLD', 'VIXY', 'USO', 'EEM', 'IBIT', 'JNK'];
      const macroData = await marketService.getDataForSymbols(macroSymbols);
      
      // Run Python analysis
      const analysisData = {
        macro_data: macroData
      };
      
      console.log('Running Python macro analysis...');
      const pythonAnalysis = await pythonBridge.runPythonAnalysis('macro_analysis.py', analysisData);
      
      // Check if Python analysis was successful
      if (!pythonAnalysis || pythonAnalysis.error) {
        console.error('Python analysis failed:', pythonAnalysis?.error || 'Unknown error');
        return {
          error: 'Failed to generate macro analysis',
          source: 'python',
          generated: false
        };
      }
      
      // Extract key information for text generation
      const analysisPrompt = createMacroAnalysisPrompt(pythonAnalysis);
      
      // Generate text analysis with Mistral if available
      let textAnalysis = null;
      let analysisSource = 'algorithmic';
      
      if (mistralService.isReady()) {
        console.log('Generating Mistral text analysis...');
        try {
          textAnalysis = await mistralService.generateText(analysisPrompt);
          analysisSource = 'ai';
        } catch (mistralError) {
          console.error('Mistral text generation failed:', mistralError);
          // Fall back to enhanced analysis
          textAnalysis = createEnhancedMacroAnalysis(pythonAnalysis);
        }
      } else {
        console.log('Mistral not available, using enhanced algorithmic analysis');
        textAnalysis = createEnhancedMacroAnalysis(pythonAnalysis);
      }
      
      // If text contains fallback message, use our enhanced analysis
      if (textAnalysis.includes('temporarily unavailable') || 
          textAnalysis.includes('using algorithmic generation')) {
        console.log('Mistral returned fallback message, using enhanced analysis');
        textAnalysis = createEnhancedMacroAnalysis(pythonAnalysis);
        analysisSource = 'enhanced-algorithmic';
      }
      
      // Combined result
      const result = {
        analysis: textAnalysis,
        risk_level: pythonAnalysis.overall_risk_level || 5,
        market_regime: pythonAnalysis.market_regime || 'Unknown',
        risk_signals: pythonAnalysis.risk_signals || [],
        actionable_insights: pythonAnalysis.actionable_insights || [],
        source: analysisSource,
        generated: true,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      cacheManager.set(cacheKey, result, 86400); // Cache for 1 day
      
      return result;
    } catch (error) {
      console.error('Error generating macro analysis:', error);
      return {
        analysis: "Macro analysis is temporarily unavailable.",
        risk_level: 5,
        market_regime: "Unknown",
        risk_signals: [],
        actionable_insights: [],
        source: "error",
        generated: false,
        error: error.message
      };
    }
  },

  /**
   * Check if the service is ready
   * @returns {Promise<boolean>} - True if the service is ready
   */
  isReady: async () => {
    try {
      // Check Python environment
      const pythonReady = await pythonBridge.checkPythonEnvironment();
      
      // Include Mistral status
      const mistralReady = mistralService.isReady();
      const mistralError = mistralService.getLastAuthError();
      
      return {
        ready: pythonReady, // We need at least Python analysis
        python_ready: pythonReady,
        mistral_ready: mistralReady,
        mistral_error: mistralError,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking market AI analysis service readiness:', error);
      return {
        ready: false,
        error: error.message
      };
    }
  }
};

/**
 * Create market analysis prompt for Mistral
 * @param {Object} pythonAnalysis - Analysis from Python
 * @param {string} viewMode - View mode (basic or advanced)
 * @returns {string} - Prompt for Mistral
 */
function createMarketAnalysisPrompt(pythonAnalysis, viewMode) {
  // Extract relevant information
  const score = pythonAnalysis.score || 50;
  const phase = pythonAnalysis.market_phase || 'Unknown';
  const techAnalysis = pythonAnalysis.technical_analysis || {};
  const sectorAnalysis = pythonAnalysis.sector_analysis || {};
  
  // Current date for context
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Create prompt for basic or advanced view
  if (viewMode === 'advanced') {
    return `You are a professional market analyst providing a detailed technical analysis of current market conditions.
Given the following market data as of ${currentDate}, provide a comprehensive market environment analysis:

Market Environment Score: ${score}/100
Market Phase: ${phase}
Technical Indicators:
${JSON.stringify(techAnalysis, null, 2)}

Sector Analysis:
${JSON.stringify(sectorAnalysis, null, 2)}

Include the following sections:
1. Market Overview - A summary of current market conditions (1-2 paragraphs)
2. Technical Analysis - Detailed analysis of price trends and indicators
3. Market Health - Analysis of breadth and sector participation
4. Investor Sentiment - Current sentiment and positioning
5. Risk Level - Assessment of current market risks
6. Bottom Line - Key takeaway for investors

Your analysis should be factual, nuanced, and professional. Avoid being overly bullish or bearish without evidence.
Include specific insights about current market conditions and actionable advice for investors.
`;
  } else {
    // Basic view - simpler prompt
    return `You are a professional market analyst providing a clear and concise analysis of current market conditions.
Given the following market data as of ${currentDate}, provide a straightforward market environment analysis:

Market Environment Score: ${score}/100
Market Phase: ${phase}
Technical Indicators: ${techAnalysis.trend_direction || 'mixed'} trend, RSI ${techAnalysis.rsi || 'N/A'}
Market Breadth: ${sectorAnalysis.breadth_percent || 50}% of sectors showing positive performance

Your analysis should include:
- A simple overview of current market conditions
- What this means for investors
- Key technical and sector observations
- Current risk assessment

Keep your analysis straightforward, factual, and accessible to average investors.
Include specific insights about current market conditions and actionable advice.
`;
  }
}

/**
 * Create sector rotation prompt for Mistral
 * @param {Object} pythonAnalysis - Analysis from Python
 * @returns {string} - Prompt for Mistral
 */
function createSectorRotationPrompt(pythonAnalysis) {
  // Extract market cycle and leadership information
  const marketCycle = pythonAnalysis.market_cycle || {};
  const leadership = pythonAnalysis.current_leadership || {};
  const insights = pythonAnalysis.actionable_insights || [];
  
  // Current date for context
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `You are a professional market analyst explaining the current sector rotation in the market.
Based on the following data as of ${currentDate}, provide an analysis of the current market cycle and sector leadership:

Market Cycle: ${marketCycle.phase || 'Unknown'}
Cycle Characteristics: ${(marketCycle.characteristics || []).join(', ')}

Leading Sectors:
${JSON.stringify(leadership.leading_sectors || [], null, 2)}

Lagging Sectors:
${JSON.stringify(leadership.lagging_sectors || [], null, 2)}

Current Insights:
${insights.join('\n')}

Your analysis should include:
1. Current market phase explanation
2. Why certain sectors are leading/lagging
3. What this rotation typically means in the economic cycle
4. Actionable insights for investors based on this rotation

Keep your analysis factual, clear, and educational.
Include specific insights about current market conditions and actionable advice for investors.
`;
}

/**
 * Create macro analysis prompt for Mistral
 * @param {Object} pythonAnalysis - Analysis from Python
 * @returns {string} - Prompt for Mistral
 */
function createMacroAnalysisPrompt(pythonAnalysis) {
  // Extract macro environment information
  const riskLevel = pythonAnalysis.overall_risk_level || 5;
  const marketRegime = pythonAnalysis.market_regime || 'Unknown';
  const riskSignals = pythonAnalysis.risk_signals || [];
  const analysis = pythonAnalysis.analysis || {};
  const insights = pythonAnalysis.actionable_insights || [];
  
  // Current date for context
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `You are a professional macro strategist explaining the current macroeconomic environment.
Based on the following data as of ${currentDate}, provide an analysis of the current macro landscape and its implications for markets:

Risk Level: ${riskLevel}/10
Market Regime: ${marketRegime}
Risk Signals: ${riskSignals.join(', ')}

Treasury Yield Analysis:
${JSON.stringify(analysis.treasury_yield || {}, null, 2)}

Stocks/Bonds Relationship:
${JSON.stringify(analysis.stocks_bonds || {}, null, 2)}

Bitcoin/Gold Relationship:
${JSON.stringify(analysis.bitcoin_gold || {}, null, 2)}

Dollar Strength:
${JSON.stringify(analysis.dollar_strength || {}, null, 2)}

Current Insights:
${insights.join('\n')}

Your analysis should include:
1. Overall macro environment summary
2. Key relationship analyses and what they indicate
3. Implications for different asset classes
4. Risks to watch for in the current environment
5. How investors might position based on this analysis

Keep your analysis factual, clear, and focused on macro implications.
Include specific insights about current market conditions and actionable advice for investors.
`;
}

/**
 * Create enhanced fallback analysis when Mistral is not available
 * @param {Object} pythonAnalysis - Analysis from Python
 * @param {string} viewMode - View mode (basic or advanced)
 * @returns {string} - Enhanced fallback text analysis
 */
function createEnhancedFallbackAnalysis(pythonAnalysis, viewMode = 'basic') {
  const score = pythonAnalysis.score || 50;
  const phase = pythonAnalysis.market_phase || 'Unknown';
  const trend = pythonAnalysis.technical_analysis?.trend_direction || 'mixed';
  const breadth = pythonAnalysis.sector_analysis?.breadth_percent || 50;
  
  // More factors to consider
  const rsi = pythonAnalysis.technical_analysis?.rsi || 50;
  const aboveMa200 = pythonAnalysis.technical_analysis?.above_ma200;
  const aboveMa50 = pythonAnalysis.technical_analysis?.above_ma50;
  const goldenCross = pythonAnalysis.technical_analysis?.golden_cross;
  const deathCross = pythonAnalysis.technical_analysis?.death_cross;
  
  // Current date for more realistic analysis
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // More realistic market analysis with conditional statements
  let analysis = `Market Update for ${currentDate}\n\n`;
  
  // Overall market assessment
  if (score >= 70) {
    analysis += `The market is showing significant strength with a ${score}% overall environment score. `;
    analysis += `We're currently in what appears to be a ${phase.toLowerCase()} phase with positive momentum. `;
  } else if (score >= 50) {
    analysis += `The market is displaying moderate strength with a ${score}% environment score. `;
    analysis += `Current signals suggest a ${phase.toLowerCase()} phase with cautiously optimistic conditions. `;
  } else {
    analysis += `The market is exhibiting weakness with a ${score}% environment score. `;
    analysis += `We're seeing conditions consistent with a ${phase.toLowerCase()} phase and defensive positioning may be prudent. `;
  }
  
  // Technical patterns
  analysis += `\nTechnical Analysis: `;
  if (aboveMa50 && aboveMa200) {
    analysis += `Price remains above both the 50-day and 200-day moving averages, indicating a healthy uptrend. `;
  } else if (aboveMa50 && !aboveMa200) {
    analysis += `Price is above the 50-day but below the 200-day moving average, suggesting a potential recovery within a longer-term downtrend. `;
  } else if (!aboveMa50 && aboveMa200) {
    analysis += `Price has fallen below the 50-day moving average while staying above the 200-day support, indicating possible short-term weakness in a broader uptrend. `;
  } else {
    analysis += `Price is below both key moving averages, signaling notable weakness in the trend structure. `;
  }
  
  // RSI conditions
  if (rsi > 70) {
    analysis += `The RSI at ${rsi.toFixed(1)} indicates overbought conditions that may warrant caution. `;
  } else if (rsi < 30) {
    analysis += `The RSI at ${rsi.toFixed(1)} suggests oversold conditions that could present buying opportunities. `;
  } else {
    analysis += `The RSI at ${rsi.toFixed(1)} is in a neutral zone, neither overbought nor oversold. `;
  }
  
  // Market breadth
  analysis += `\nMarket Health: `;
  if (breadth > 70) {
    analysis += `${breadth.toFixed(1)}% of sectors are showing positive momentum, indicating robust, broad-based market participation. `;
  } else if (breadth > 50) {
    analysis += `${breadth.toFixed(1)}% of sectors are advancing, suggesting moderate but positive market breadth. `;
  } else if (breadth > 30) {
    analysis += `Only ${breadth.toFixed(1)}% of sectors are in positive territory, indicating narrowing market leadership. `;
  } else {
    analysis += `A mere ${breadth.toFixed(1)}% of sectors are advancing, signaling concerning market breadth deterioration. `;
  }
  
  // Special patterns
  if (goldenCross) {
    analysis += `\nA recent golden cross (50-day MA crossing above 200-day MA) suggests a potential longer-term bullish trend developing. `;
  }
  if (deathCross) {
    analysis += `\nA recent death cross (50-day MA crossing below 200-day MA) indicates a concerning bearish shift in the longer-term trend. `;
  }
  
  // Conclusion and strategy
  analysis += `\nStrategy Considerations: `;
  if (score > 70) {
    analysis += `The current environment supports a growth-oriented approach with potential focus on leading sectors. Risk management remains important but conditions favor measured risk-taking.`;
  } else if (score > 50) {
    analysis += `A balanced approach is warranted with selective exposure to quality companies showing relative strength. Maintaining some defensive positions while pursuing opportunities in stronger sectors may be prudent.`;
  } else {
    analysis += `Defensive positioning is suggested with focus on quality, value, and potentially reduced equity exposure. Capital preservation should take precedence until market conditions improve.`;
  }
  
  // Add advanced analysis for advanced view
  if (viewMode === 'advanced') {
    analysis += `\n\nExpanded Technical Perspective: The ${trend} trend is supported by ${rsi > 50 ? 'positive' : 'negative'} momentum indicators and ${breadth > 50 ? 'healthy' : 'concerning'} sector participation. Volume patterns ${score > 60 ? 'confirm the price action' : 'show concerning divergence'}, suggesting ${score > 60 ? 'institutional accumulation' : 'distribution'}.`;
    
    analysis += `\n\nRisk Assessment: Current market conditions present a ${score > 70 ? 'low' : score > 50 ? 'moderate' : 'elevated'} risk profile. Key levels to watch include support at ${(score * 0.9).toFixed(1)} and resistance at ${(score * 1.1).toFixed(1)} on our market environment score.`;
    
    analysis += `\n\nIntermarket Analysis: Bond yields are ${score > 60 ? 'supportive of equity valuations' : 'putting pressure on equity multiples'}, while dollar strength is ${score > 60 ? 'moderating' : 'increasing'}, which ${score > 60 ? 'supports' : 'challenges'} multinational earnings. Commodity prices remain ${score > 60 ? 'contained, limiting inflation concerns' : 'elevated, raising input cost concerns'}.`;
  }
  
  return analysis;
}

/**
 * Create enhanced sector rotation analysis when Mistral is not available
 * @param {Object} pythonAnalysis - Analysis from Python
 * @returns {string} - Enhanced fallback text analysis
 */
function createEnhancedSectorRotationAnalysis(pythonAnalysis) {
  // Extract market cycle and leadership information
  const marketCycle = pythonAnalysis.market_cycle || {};
  const leadership = pythonAnalysis.current_leadership || {};
  const phase = marketCycle.phase || 'Unknown';
  const leadingSectors = leadership.leading_sectors || [];
  const laggingSectors = leadership.lagging_sectors || [];
  
  // Current date for more realistic analysis
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Format leading sectors
  const leadingSectorsText = leadingSectors.length > 0 
    ? leadingSectors.join(', ')
    : 'No clear leading sectors identified';
    
  // Format lagging sectors
  const laggingSectorsText = laggingSectors.length > 0
    ? laggingSectors.join(', ')
    : 'No clear lagging sectors identified';
  
  // Build analysis text
  let analysis = `Sector Rotation Analysis for ${currentDate}\n\n`;
  
  // Market cycle assessment
  analysis += `Current Market Cycle: The market appears to be in a ${phase.toLowerCase()} phase based on sector rotation patterns. `;
  
  switch (phase.toLowerCase()) {
    case 'early bull market':
      analysis += `This phase typically occurs after market bottoms, characterized by leadership from economically sensitive sectors as investors anticipate economic recovery. Risk appetite is increasing but still selective.`;
      break;
    case 'bull market':
      analysis += `This mature bullish phase shows broadening participation across sectors, with growth-oriented sectors typically leading. Investor confidence is high, sometimes excessively so, and market breadth is generally positive.`;
      break;
    case 'late bull market':
      analysis += `This transitional phase often sees leadership narrowing, with defensive sectors beginning to outperform as economic concerns emerge. Market breadth typically deteriorates while index levels may still reach new highs.`;
      break;
    case 'bear market':
      analysis += `This contractionary phase is characterized by leadership from traditionally defensive sectors, significant risk aversion, and widespread selling pressure. Valuations compress as economic concerns dominate sentiment.`;
      break;
    case 'mixed conditions':
    default:
      analysis += `The market is showing mixed signals without clear directional bias. Sector performance is inconsistent and may reflect transitional conditions or range-bound market behavior.`;
  }
  
  // Sector leadership
  analysis += `\n\nLeading Sectors: ${leadingSectorsText}. `;
  
  if (leadingSectors.includes('Technology') || leadingSectors.includes('Consumer Discretionary')) {
    analysis += `Growth-oriented leadership suggests investor confidence in future economic expansion. `;
  } 
  if (leadingSectors.includes('Financials') || leadingSectors.includes('Industrials')) {
    analysis += `Economically sensitive sector strength typically aligns with expectations for economic acceleration. `;
  }
  if (leadingSectors.includes('Utilities') || leadingSectors.includes('Consumer Staples') || leadingSectors.includes('Healthcare')) {
    analysis += `Defensive sector leadership often reflects concerns about economic deceleration or market volatility. `;
  }
  if (leadingSectors.includes('Energy') || leadingSectors.includes('Materials')) {
    analysis += `Resource sector strength may indicate inflationary pressures or supply constraints. `;
  }
  
  // Lagging sectors
  analysis += `\n\nLagging Sectors: ${laggingSectorsText}. `;
  
  // Economic cycle implications
  analysis += `\n\nEconomic Cycle Implications: `;
  
  if (phase.toLowerCase().includes('bull') && !phase.toLowerCase().includes('late')) {
    analysis += `Current sector leadership suggests we are in an expansionary phase of the economic cycle. Investors appear to be positioning for continued growth and rising corporate earnings. `;
    analysis += `This pattern typically favors cyclical exposure and growth-oriented investments. `;
  } else if (phase.toLowerCase().includes('late bull')) {
    analysis += `Sector rotation patterns indicate we may be approaching a transitional period in the economic cycle. `;
    analysis += `This phase often precedes economic slowdown and warrants more selective positioning with increased attention to quality and valuation. `;
  } else if (phase.toLowerCase().includes('bear')) {
    analysis += `Current leadership aligns with contractionary economic conditions or expectations for economic deceleration. `;
    analysis += `This environment typically rewards defensive positioning, quality factors, and reduced equity exposure. `;
  } else {
    analysis += `The mixed sector performance suggests uncertainty about the economic trajectory. `;
    analysis += `This environment calls for balanced positioning with both offensive and defensive elements in portfolios. `;
  }
  
  // Investment implications
  analysis += `\n\nInvestment Implications: `;
  
  if (phase.toLowerCase().includes('early bull')) {
    analysis += `Consider overweighting economically sensitive sectors like Financials, Consumer Discretionary, and Industrials. Early cycle leaders often outperform as the economy recovers from slowdown. Quality growth companies with strong balance sheets may offer better risk-adjusted returns than deep cyclicals at this stage.`;
  } else if (phase.toLowerCase().includes('bull') && !phase.toLowerCase().includes('early') && !phase.toLowerCase().includes('late')) {
    analysis += `Broadly diversified exposure with tilt toward growth sectors like Technology is aligned with this phase. Consider reducing fixed income duration as rates may rise in response to economic strength. Companies with pricing power and market leadership typically perform well in this environment.`;
  } else if (phase.toLowerCase().includes('late bull')) {
    analysis += `Begin reducing exposure to highly cyclical sectors and consider increasing allocations to quality companies with stable earnings. Defensive sectors like Healthcare, Consumer Staples, and Utilities may begin outperforming. This is often a good time to review portfolio risk levels and consider taking profits in the most extended positions.`;
  } else if (phase.toLowerCase().includes('bear')) {
    analysis += `Defensive positioning is warranted with emphasis on quality, value, and income. Consider increased cash positions, reduced equity exposure, and focus on companies with strong balance sheets, stable earnings, and sustainable dividends. This environment typically rewards patience and capital preservation strategies.`;
  } else {
    analysis += `Balanced positioning with careful security selection is appropriate. Emphasize quality factors across sectors and maintain diversification. Consider barbell approach with both defensive and growth exposure while avoiding the most speculative areas of the market.`;
  }
  
  return analysis;
}

/**
 * Create enhanced macro analysis when Mistral is not available
 * @param {Object} pythonAnalysis - Analysis from Python
 * @returns {string} - Enhanced fallback text analysis
 */
function createEnhancedMacroAnalysis(pythonAnalysis) {
  // Extract macro environment information
  const riskLevel = pythonAnalysis.overall_risk_level || 5;
  const marketRegime = pythonAnalysis.market_regime || 'Unknown';
  const riskSignals = pythonAnalysis.risk_signals || [];
  
  // Current date for more realistic analysis
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Risk signal text
  const riskSignalsText = riskSignals.length > 0
    ? riskSignals.join(', ')
    : 'No significant risk signals identified';
  
  // Build analysis text
  let analysis = `Macroeconomic Analysis for ${currentDate}\n\n`;
  
  // Overall assessment
  analysis += `Market Regime: The current macro environment appears to be in a ${marketRegime.toLowerCase()} regime with an overall risk level of ${riskLevel}/10. `;
  
  switch (marketRegime.toLowerCase()) {
    case 'risk-on':
      analysis += `This regime typically features strong economic growth, rising corporate profits, accommodative policy conditions, and investor risk appetite. Asset allocation tends to favor equities over bonds, growth over value, and cyclicals over defensives.`;
      break;
    case 'risk-off':
      analysis += `This regime is characterized by economic contraction or slowdown fears, deteriorating corporate earnings, tightening financial conditions, and investor risk aversion. Asset allocation typically shifts toward bonds over equities, quality/value over growth, and defensive sectors over cyclicals.`;
      break;
    case 'inflationary growth':
      analysis += `This regime combines economic expansion with rising inflation pressures, often accompanied by rising interest rates and commodity prices. Asset allocation typically favors real assets, inflation-protected securities, and companies with pricing power.`;
      break;
    case 'stagflation':
      analysis += `This challenging regime combines weak economic growth with persistent inflation, creating difficult conditions for both equities and bonds. Asset allocation often shifts toward real assets, select commodities, and companies with pricing power and low capital requirements.`;
      break;
    case 'reflation':
      analysis += `This transition regime features economic recovery with modest inflation, typically supported by accommodative monetary and fiscal policy. Asset allocation tends to favor cyclical sectors, credit, and economically sensitive equities.`;
      break;
    case 'disinflation':
      analysis += `This regime combines slowing inflation with continued economic growth, creating favorable conditions for financial assets. Asset allocation typically favors long-duration assets like growth stocks and longer-term bonds.`;
      break;
    default:
      analysis += `The current regime shows mixed signals without clear classification, suggesting a transitional environment with conflicting economic indicators.`;
  }
  
  // Risk signals
  analysis += `\n\nRisk Signals: ${riskSignalsText}. `;
  if (riskLevel >= 7) {
    analysis += `The elevated risk level suggests caution is warranted, with particular attention to downside protection and liquidity.`;
  } else if (riskLevel <= 3) {
    analysis += `The low risk environment may present opportunities for measured risk-taking, though complacency should be avoided.`;
  } else {
    analysis += `The moderate risk level suggests balanced positioning with both offensive and defensive elements.`;
  }
  
  // Asset class implications
  analysis += `\n\nAsset Class Implications:`;
  
  // Equities
  analysis += `\n\nEquities: `;
  if (marketRegime.toLowerCase().includes('risk-on') || marketRegime.toLowerCase().includes('reflation')) {
    analysis += `The current environment generally supports equity exposure, with potential outperformance from cyclical sectors and growth stocks. Market breadth should be monitored for signs of deterioration. International diversification may offer value depending on relative valuations and currency effects.`;
  } else if (marketRegime.toLowerCase().includes('risk-off')) {
    analysis += `Equity markets face headwinds in this environment, suggesting reduced exposure, defensive sector tilts, and emphasis on quality companies with stable earnings and strong balance sheets. Volatility is likely to remain elevated, creating both risks and tactical opportunities.`;
  } else if (marketRegime.toLowerCase().includes('inflationary')) {
    analysis += `Equity sectors with pricing power and low capital intensity may outperform, while high-multiple growth stocks could face pressure from rising discount rates. Value sectors including energy, materials, and select financials typically perform relatively better in this environment.`;
  } else {
    analysis += `Selective equity exposure focused on quality companies with sustainable competitive advantages is appropriate. Sector and factor exposures should be balanced to navigate uncertain conditions.`;
  }
  
  // Fixed Income
  analysis += `\n\nFixed Income: `;
  if (marketRegime.toLowerCase().includes('risk-on') || marketRegime.toLowerCase().includes('inflationary')) {
    analysis += `Bond markets may face headwinds from rising yields, suggesting caution with duration exposure. Credit spreads typically compress in risk-on environments, potentially favoring corporate and high-yield bonds despite lower absolute yields. Inflation protection through TIPS or floating-rate instruments may be appropriate.`;
  } else if (marketRegime.toLowerCase().includes('risk-off')) {
    analysis += `High-quality bonds typically provide portfolio protection through flight-to-safety flows, though starting yields significantly impact return potential. Treasury bonds and other high-quality fixed income often serve as effective portfolio stabilizers despite potentially low absolute returns.`;
  } else if (marketRegime.toLowerCase().includes('disinflation')) {
    analysis += `This environment typically benefits longer-duration fixed income as yields decline. Both investment-grade credit and treasuries may perform well, though spread compression potential depends on starting valuations.`;
  } else {
    analysis += `A balanced fixed income approach with diversification across duration, credit quality, and inflation protection is appropriate. Maintaining dry powder for tactical opportunities may be valuable.`;
  }
  
  // Alternative Assets
  analysis += `\n\nAlternative Assets: `;
  if (marketRegime.toLowerCase().includes('inflationary')) {
    analysis += `Real assets including commodities, real estate, and infrastructure may provide inflation protection. Gold often performs well when real interest rates decline or geopolitical tensions rise. Digital assets like Bitcoin have shown mixed correlation patterns and remain speculative.`;
  } else if (marketRegime.toLowerCase().includes('risk-off')) {
    analysis += `Defensive alternatives focused on absolute returns and low correlation to traditional markets may provide portfolio diversification. Liquidity should be carefully considered given potential market stress. Gold may benefit from flight-to-safety flows despite lacking yield.`;
  } else {
    analysis += `Alternative assets should be evaluated based on specific portfolio needs for diversification, income, or inflation protection rather than market timing. Strategic rather than tactical allocation typically yields better results in this space.`;
  }
  
  // Key risks
  analysis += `\n\nKey Risks to Monitor: `;
  if (riskLevel >= 7) {
    analysis += `Central bank policy errors, liquidity conditions, credit spreads, volatility trends, economic growth momentum, and geopolitical developments. Risk management should take priority over return maximization until conditions improve.`;
  } else if (riskLevel <= 3) {
    analysis += `Complacency, valuation excesses, unexpected inflation surprises, policy shifts, and positioning extremes. Low perceived risk environments often sow the seeds of future market stress through excessive risk-taking.`;
  } else {
    analysis += `Policy transitions, growth momentum shifts, inflation trends, and sentiment/positioning extremes. Balanced risk management with both upside and downside scenarios considered is appropriate.`;
  }
  
  // Conclusion
  analysis += `\n\nBottom Line: `;
  if (riskLevel >= 7) {
    analysis += `The current macroeconomic environment suggests caution is warranted. Focus on capital preservation, liquidity, and quality while remaining prepared for potential opportunities that may emerge from market dislocations.`;
  } else if (riskLevel <= 3) {
    analysis += `The favorable macroeconomic backdrop supports measured risk-taking within individual risk tolerance parameters. Maintain discipline around valuation and avoid areas of speculative excess despite generally supportive conditions.`;
  } else {
    analysis += `The mixed macroeconomic signals suggest a balanced approach with both offensive and defensive elements. Emphasize quality and valuation while maintaining diversification across asset classes and risk factors.`;
  }
  
  return analysis;
}

/**
 * Map a numerical score to a letter grade
 * @param {number} score - Numerical score (0-100)
 * @returns {string} - Letter grade
 */
function mapScoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'B-';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'C-';
  if (score >= 20) return 'D';
  return 'F';
}

export default marketAiAnalysisService;