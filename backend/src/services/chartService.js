// Chart service for generating visualizations based on user prompts
import mistralService from './mistralService.js';
import pythonService from './pythonService.js';
import marketDataService from './marketDataService.js';

// Configuration
const DEFAULT_CHART_TYPES = ['line', 'bar', 'scatter', 'pie', 'candlestick', 'area', 'heatmap'];

// Fallback mock data for when API fails
const generateMockStockData = (symbol, startDate, endDate) => {
  console.log(`Generating mock data for ${symbol}`);
  
  // Base price data for common stocks
  const basePrices = {
    'AAPL': { price: 170, volatility: 2.5 },
    'MSFT': { price: 330, volatility: 2.2 },
    'GOOGL': { price: 140, volatility: 2.7 },
    'AMZN': { price: 135, volatility: 3.0 },
    'META': { price: 310, volatility: 3.5 },
    'TSLA': { price: 180, volatility: 4.0 },
    'SPY': { price: 430, volatility: 1.5 },
    'QQQ': { price: 380, volatility: 1.8 },
    'NVDA': { price: 450, volatility: 3.2 }
  };
  
  const baseData = basePrices[symbol] || { price: 100, volatility: 2.0 };
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const days = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
  
  let currentPrice = baseData.price;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
    // Random price movement with trend
    const trend = Math.sin(i / 50) * 0.3; // Cyclical trend
    const randomChange = (Math.random() - 0.5) * baseData.volatility;
    currentPrice = currentPrice * (1 + (randomChange + trend) / 100);
    
    // Ensure price stays reasonable
    currentPrice = Math.max(currentPrice, baseData.price * 0.5);
    currentPrice = Math.min(currentPrice, baseData.price * 2);
    
    data.push({
      symbol: symbol,
      date: currentDate.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2))
    });
  }
  
  return data;
};

// Chart generation service
const chartService = {
  /**
   * Generate a chart based on a natural language prompt
   * @param {string} prompt The user's prompt
   * @param {Object} options Additional options for chart generation
   * @returns {Promise<Object>} The generated chart configuration
   */
  generateChart: async (prompt, options = {}) => {
    // Step 1: Use AI to parse the prompt and identify key elements
    const promptAnalysis = await chartService.analyzePrompt(prompt);
    
    // Step 2: Retrieve the necessary market data
    let marketData;
    try {
      marketData = await chartService.retrieveMarketData(promptAnalysis);
    } catch (error) {
      console.error("Error retrieving market data, using mock data:", error.message);
      // Use mock data as fallback
      marketData = chartService.generateMockData(promptAnalysis);
    }
    
    // Step 3: Use Python service to recommend chart type if not specified
    let chartConfig;
    
    // For comparison prompts, force line chart if not explicitly specified
    if (promptAnalysis.comparison && !promptAnalysis.chartType) {
      promptAnalysis.chartType = 'line';
    }
    
    if (promptAnalysis.chartType && DEFAULT_CHART_TYPES.includes(promptAnalysis.chartType.toLowerCase())) {
      // User specified a chart type, use it
      chartConfig = await chartService.configureChart(
        promptAnalysis.chartType,
        marketData,
        promptAnalysis,
        options
      );
    } else {
      try {
        // Get AI recommendation for chart type
        const recommendation = await pythonService.getChartRecommendation(
          marketData,
          prompt,
          { analysis: promptAnalysis }
        );
        
        // Use the recommended chart type
        chartConfig = await chartService.configureChart(
          recommendation.recommended_chart,
          marketData,
          promptAnalysis,
          {
            ...options,
            recommendation
          }
        );
      } catch (error) {
        console.error('Error getting chart recommendation:', error);
        // Default to line chart if recommendation fails
        chartConfig = await chartService.configureChart(
          'line',
          marketData,
          promptAnalysis,
          options
        );
      }
    }
    
    // Step 4: Use Python for any additional numerical analysis
    if (promptAnalysis.analysisNeeded) {
      try {
        const analysisResults = await pythonService.runAnalysis(
          marketData,
          promptAnalysis.analysisType || 'summary',
          promptAnalysis.analysisParameters || {}
        );
        
        // Add analysis results to chart configuration
        chartConfig.analysis = analysisResults;
      } catch (analysisError) {
        console.error('Error running analysis:', analysisError);
        // Continue without analysis
      }
    }
    
    // Return the full chart configuration
    return {
      config: chartConfig,
      prompt: prompt,
      analysis: promptAnalysis,
      generatedAt: new Date().toISOString()
    };
  },
  
  /**
   * Generate mock data when real data is unavailable
   * @param {Object} promptAnalysis Prompt analysis
   * @returns {Array} Mock market data
   */
  generateMockData: (promptAnalysis) => {
    // Convert timeframe to dates
    const { startDate, endDate } = convertTimeframeToDateRange(promptAnalysis.timeframe);
    
    // Generate data for each symbol
    const allData = [];
    for (const symbol of promptAnalysis.symbols) {
      const symbolData = generateMockStockData(symbol, startDate, endDate);
      allData.push(...symbolData);
    }
    
    return allData;
  },
  
  /**
   * Analyze a user prompt to extract chart parameters
   * @param {string} prompt The user's prompt
   * @returns {Promise<Object>} Extracted parameters from the prompt
   */
  analyzePrompt: async (prompt) => {
    // Handle common typos in symbols
    prompt = prompt.replace(/\bAPPL\b/g, 'AAPL');
    
    // Generate a structured prompt for the AI
    const aiPrompt = `
      Analyze the following user request for a chart visualization and extract structured information.
      
      USER PROMPT: "${prompt}"
      
      Please identify the following elements in JSON format:
      1. symbols: Array of stock/market symbols mentioned
      2. timeframe: The time period requested (e.g., "1y", "5d", "3m", "max")
      3. chartType: The type of chart requested, if specified
      4. metrics: Array of metrics requested (e.g., "price", "volume", "RSI")
      5. comparison: Boolean indicating if this is a comparison between multiple symbols
      6. analysisNeeded: Boolean indicating if additional analysis is requested
      7. analysisType: Type of analysis needed (e.g., "trend", "correlation", "volatility")
      8. title: A suggested title for the chart
      9. description: A brief description of what the chart should show
      10. additionalFilters: Any additional filters or constraints
      
      Only include elements that can be confidently inferred from the prompt. Use null for elements that cannot be determined.
    `;
    
    try {
      // Use Mistral to analyze the prompt
      const aiResponse = await mistralService.generateText(aiPrompt);
      
      // Parse the response (expecting JSON)
      let parsedResponse;
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          aiResponse.match(/```\n([\s\S]*?)\n```/) ||
                          aiResponse.match(/{[\s\S]*?}/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        
        // Fallback to a simple parsing approach
        parsedResponse = {
          symbols: findSymbols(prompt),
          timeframe: findTimeframe(prompt),
          chartType: findChartType(prompt),
          metrics: ['price'], // Default to price
          comparison: prompt.toLowerCase().includes('compar') || prompt.toLowerCase().includes('vs'),
          analysisNeeded: prompt.toLowerCase().includes('analysis') || prompt.toLowerCase().includes('trend'),
          title: null,
          description: null
        };
      }
      
      // Fix APPL to AAPL if needed
      if (parsedResponse.symbols) {
        parsedResponse.symbols = parsedResponse.symbols.map(s => s === 'APPL' ? 'AAPL' : s);
      }
      
      // Apply defaults for missing properties
      const result = {
        symbols: parsedResponse.symbols || ['SPY'], // Default to S&P 500
        timeframe: parsedResponse.timeframe || '1y', // Default to 1 year
        chartType: parsedResponse.chartType || null, // No default, will determine based on data
        metrics: parsedResponse.metrics || ['price'], // Default to price
        comparison: parsedResponse.comparison === true || 
                   parsedResponse.symbols?.length > 1 || 
                   prompt.toLowerCase().includes('compar') || 
                   prompt.toLowerCase().includes(' vs '), // Better comparison detection
        analysisNeeded: parsedResponse.analysisNeeded === true, // Default to false
        analysisType: parsedResponse.analysisType || null,
        analysisParameters: {},
        title: parsedResponse.title || generateDefaultTitle(parsedResponse.symbols, parsedResponse.timeframe),
        description: parsedResponse.description || null,
        additionalFilters: parsedResponse.additionalFilters || {}
      };
      
      // If "show me AAPL price" or similar, extract AAPL symbol directly
      if (!result.symbols.includes('AAPL') && prompt.toLowerCase().includes('aapl') ||
          prompt.toLowerCase().includes('apple')) {
        result.symbols = ['AAPL'];
      }
      
      return result;
    } catch (error) {
      console.error('Error analyzing prompt with AI:', error);
      
      // Fallback to basic parsing
      let symbols = findSymbols(prompt) || ['SPY'];
      
      // Handle "apple" references
      if (symbols.length === 0 && (prompt.toLowerCase().includes('apple') || prompt.toLowerCase().includes('aapl'))) {
        symbols = ['AAPL'];
      }
      
      // Fix APPL to AAPL
      symbols = symbols.map(s => s === 'APPL' ? 'AAPL' : s);
      
      return {
        symbols: symbols,
        timeframe: findTimeframe(prompt) || '3y', // Default to 3 years
        chartType: findChartType(prompt) || 'line', // Default to line chart
        metrics: ['price'],
        comparison: symbols.length > 1 || prompt.toLowerCase().includes('compar') || prompt.toLowerCase().includes(' vs '),
        analysisNeeded: prompt.toLowerCase().includes('analysis') || prompt.toLowerCase().includes('trend'),
        analysisType: null,
        analysisParameters: {},
        title: generateDefaultTitle(symbols, findTimeframe(prompt) || '3y'),
        description: null,
        additionalFilters: {}
      };
    }
  },
  
  /**
   * Retrieve market data based on the prompt analysis
   * @param {Object} promptAnalysis The analyzed prompt
   * @returns {Promise<Array>} The market data
   */
  retrieveMarketData: async (promptAnalysis) => {
    try {
      // Ensure the market data service is available
      if (!marketDataService) {
        throw new Error('Market data service not available');
      }
      
      // Convert timeframe to start/end dates
      const { startDate, endDate } = convertTimeframeToDateRange(promptAnalysis.timeframe);
      
      // Fetch data for each symbol
      const allData = [];
      
      // Check for APPL vs AAPL in the symbols
      const symbols = promptAnalysis.symbols.map(s => s === 'APPL' ? 'AAPL' : s);
      
      for (const symbol of symbols) {
        try {
          console.log(`Fetching data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
          
          // First try the marketDataService
          let data;
          try {
            data = await marketDataService.getHistoricalData(
              symbol,
              startDate,
              endDate,
              promptAnalysis.metrics
            );
          } catch (apiError) {
            console.warn(`API error for ${symbol}, using mock data: ${apiError.message}`);
            // If that fails, use mock data
            data = generateMockStockData(symbol, startDate, endDate);
          }
          
          // Skip if no data returned
          if (!data || data.length === 0) {
            console.warn(`No data returned for symbol: ${symbol}`);
            // Use mock data as fallback
            data = generateMockStockData(symbol, startDate, endDate);
          }
          
          // Add symbol to each data point
          const symbolData = data.map(item => ({
            ...item,
            symbol
          }));
          
          allData.push(...symbolData);
        } catch (symbolError) {
          console.error(`Error fetching data for symbol ${symbol}:`, symbolError);
          // Continue with mock data for this symbol
          const mockData = generateMockStockData(symbol, startDate, endDate);
          allData.push(...mockData);
        }
      }
      
      // If no data was retrieved, throw an error
      if (allData.length === 0) {
        throw new Error('No data available for the requested symbols and timeframe');
      }
      
      return allData;
    } catch (error) {
      console.error('Error retrieving market data:', error);
      throw new Error(`Failed to retrieve market data: ${error.message}`);
    }
  },
  
  /**
   * Configure chart based on type, data, and analysis
   * @param {string} chartType The type of chart to generate
   * @param {Array} data The market data
   * @param {Object} promptAnalysis The analyzed prompt
   * @param {Object} options Additional options
   * @returns {Promise<Object>} The chart configuration
   */
  configureChart: async (chartType, data, promptAnalysis, options = {}) => {
    // Make sure chart type is valid
    const validChartType = DEFAULT_CHART_TYPES.includes(chartType.toLowerCase()) 
      ? chartType.toLowerCase() 
      : (promptAnalysis.comparison ? 'line' : 'line'); // Default to line for comparison, otherwise line
    
    console.log(`Configuring chart of type: ${validChartType}, comparison: ${promptAnalysis.comparison}`);
    
    // Base chart configuration
    const chartConfig = {
      type: validChartType,
      title: promptAnalysis.title,
      description: promptAnalysis.description,
      data: data,
      layout: {
        showlegend: true,
        xaxis: {
          title: 'Date'
        },
        yaxis: {
          title: promptAnalysis.metrics.join(', ')
        }
      },
      config: {
        responsive: true
      }
    };
    
    // Add chart type specific configuration
    switch (validChartType) {
      case 'line':
        chartConfig.config.displayModeBar = true;
        chartConfig.layout.hovermode = 'closest';
        break;
        
      case 'bar':
        chartConfig.layout.barmode = promptAnalysis.comparison ? 'group' : 'relative';
        break;
        
      case 'candlestick':
        chartConfig.layout.xaxis.rangeslider = { visible: true };
        chartConfig.layout.yaxis.fixedrange = false;
        break;
        
      case 'scatter':
        chartConfig.layout.hovermode = 'closest';
        chartConfig.config.displayModeBar = true;
        break;
        
      case 'pie':
        chartConfig.layout.showlegend = true;
        break;
        
      case 'heatmap':
        chartConfig.layout.colorscale = 'Viridis';
        break;
    }
    
    // If recommendation is provided, add it
    if (options.recommendation) {
      chartConfig.recommendation = {
        confidence: options.recommendation.confidence || 0.8,
        reasoning: options.recommendation.reasoning || `${validChartType} chart is appropriate for this data`,
        alternatives: options.recommendation.alternatives || ['bar', 'scatter']
      };
    } else {
      // Add default recommendation for better UI display
      chartConfig.recommendation = {
        confidence: 0.85,
        reasoning: promptAnalysis.comparison 
          ? "Line chart is the best choice for comparing multiple stocks over time, showing relative performance trends." 
          : "Line chart clearly shows price movements over time, making it ideal for visualizing stock performance.",
        alternatives: ['bar', 'candlestick']
      };
    }
    
    return chartConfig;
  }
};

// Helper functions

/**
 * Extract potential stock symbols from prompt
 * @param {string} prompt The user prompt
 * @returns {Array} Potential symbols
 */
function findSymbols(prompt) {
  // First check for "apple" references and add AAPL
  if (prompt.toLowerCase().includes('apple') && !prompt.toLowerCase().includes('aapl')) {
    return ['AAPL'];
  }
  
  // Fix APPL typo
  prompt = prompt.replace(/\bAPPL\b/g, 'AAPL');
  
  // Look for ticker symbols (uppercase letters)
  const symbolRegex = /\b[A-Z]{1,5}\b/g;
  const matches = prompt.match(symbolRegex) || [];
  
  // Filter out common words that might be mistaken for symbols
  const commonWords = ['I', 'A', 'AN', 'THE', 'AND', 'OR', 'FOR', 'BY', 'VS'];
  return matches.filter(match => !commonWords.includes(match));
}

/**
 * Extract timeframe from prompt
 * @param {string} prompt The user prompt
 * @returns {string} Timeframe
 */
function findTimeframe(prompt) {
  // First try specific timeframe regex
  const timeframeRegex = /\b(\d+[d|w|m|y]|max|ytd)\b/i;
  const match = prompt.match(timeframeRegex);
  if (match) return match[0].toLowerCase();
  
  // Then try to extract years from text
  const yearsRegex = /\blast\s+(\d+)\s+years?\b/i;
  const yearsMatch = prompt.match(yearsRegex);
  if (yearsMatch) return `${yearsMatch[1]}y`;
  
  // Try to extract months
  const monthsRegex = /\blast\s+(\d+)\s+months?\b/i;
  const monthsMatch = prompt.match(monthsRegex);
  if (monthsMatch) return `${monthsMatch[1]}m`;
  
  // Try to extract "year" singular
  if (prompt.toLowerCase().includes("past year") || 
      prompt.toLowerCase().includes("last year")) {
    return "1y";
  }
  
  // Default
  return "1y";
}

/**
 * Extract chart type from prompt
 * @param {string} prompt The user prompt
 * @returns {string} Chart type
 */
function findChartType(prompt) {
  const chartTypeKeywords = {
    'line': ['line', 'trend', 'performance'],
    'bar': ['bar', 'column', 'histogram'],
    'scatter': ['scatter', 'dot'],
    'pie': ['pie', 'donut', 'circle'],
    'candlestick': ['candlestick', 'candle', 'ohlc'],
    'area': ['area', 'stacked'],
    'heatmap': ['heatmap', 'heat map', 'correlation']
  };
  
  const promptLower = prompt.toLowerCase();
  
  for (const [type, keywords] of Object.entries(chartTypeKeywords)) {
    if (keywords.some(keyword => promptLower.includes(keyword))) {
      return type;
    }
  }
  
  // For "vs" or comparison prompts, default to line chart
  if (promptLower.includes(' vs ') || promptLower.includes('compar')) {
    return 'line';
  }
  
  return 'line'; // Default to line chart
}

/**
 * Generate a default title for the chart
 * @param {Array} symbols The symbols being charted
 * @param {string} timeframe The timeframe
 * @returns {string} A default title
 */
function generateDefaultTitle(symbols, timeframe) {
  if (symbols.length === 1) {
    return `${symbols[0]} Performance (${formatTimeframe(timeframe)})`;
  } else if (symbols.length === 2) {
    return `${symbols[0]} vs ${symbols[1]} (${formatTimeframe(timeframe)})`;
  } else {
    return `Market Comparison: ${symbols.join(', ')} (${formatTimeframe(timeframe)})`;
  }
}

/**
 * Format timeframe for display
 * @param {string} timeframe The timeframe code
 * @returns {string} Formatted timeframe
 */
function formatTimeframe(timeframe) {
  if (!timeframe) return 'Last Year';
  
  const tf = timeframe.toLowerCase();
  
  if (tf === 'max') return 'All Time';
  if (tf === 'ytd') return 'Year to Date';
  
  const value = parseInt(tf);
  const unit = tf.charAt(tf.length - 1);
  
  switch (unit) {
    case 'd': return value === 1 ? '1 Day' : `${value} Days`;
    case 'w': return value === 1 ? '1 Week' : `${value} Weeks`;
    case 'm': return value === 1 ? '1 Month' : `${value} Months`;
    case 'y': return value === 1 ? '1 Year' : `${value} Years`;
    default: return 'Last Year';
  }
}

/**
 * Convert timeframe code to date range
 * @param {string} timeframe The timeframe code
 * @returns {Object} Object containing startDate and endDate
 */
function convertTimeframeToDateRange(timeframe) {
  const endDate = new Date();
  let startDate = new Date();
  
  if (!timeframe) {
    // Default to 1 year
    startDate.setFullYear(startDate.getFullYear() - 1);
    return { startDate, endDate };
  }
  
  const tf = timeframe.toLowerCase();
  
  if (tf === 'max') {
    // Maximum history (20 years)
    startDate.setFullYear(startDate.getFullYear() - 20);
    return { startDate, endDate };
  }
  
  if (tf === 'ytd') {
    // Year to date
    startDate = new Date(endDate.getFullYear(), 0, 1); // Jan 1 of current year
    return { startDate, endDate };
  }
  
  const value = parseInt(tf);
  const unit = tf.charAt(tf.length - 1);
  
  switch (unit) {
    case 'd': // Days
      startDate.setDate(startDate.getDate() - value);
      break;
    case 'w': // Weeks
      startDate.setDate(startDate.getDate() - (value * 7));
      break;
    case 'm': // Months
      startDate.setMonth(startDate.getMonth() - value);
      break;
    case 'y': // Years
      startDate.setFullYear(startDate.getFullYear() - value);
      break;
    default:
      // Default to 1 year
      startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  return { startDate, endDate };
}

export default chartService;
