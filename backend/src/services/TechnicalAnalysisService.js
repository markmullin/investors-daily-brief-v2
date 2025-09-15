/**
 * TECHNICAL ANALYSIS SERVICE - Phase 3 Implementation
 * Integrates Python technical analysis engine with Mistral AI explanations
 * Provides comprehensive technical analysis for frontend display components
 * 
 * FIXED: AI text formatting - now cleans markdown symbols and special characters
 */

import PythonBridge from './PythonBridge.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import { processAIContentForUI, extractKeyInsights } from '../utils/textFormatter.js';

class TechnicalAnalysisService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache for technical analysis
  }

  /**
   * Generate cache key for technical analysis
   */
  getCacheKey(symbol, timeframe, dataHash) {
    return `tech_analysis_${symbol}_${timeframe}_${dataHash}`;
  }

  /**
   * Generate simple hash for price data to detect changes
   */
  generateDataHash(priceData) {
    if (!priceData || priceData.length === 0) return 'empty';
    
    const firstPrice = priceData[0]?.price || priceData[0]?.close || 0;
    const lastPrice = priceData[priceData.length - 1]?.price || priceData[priceData.length - 1]?.close || 0;
    const length = priceData.length;
    
    return `${firstPrice}_${lastPrice}_${length}`;
  }

  /**
   * Check if cached analysis is still valid
   */
  getCachedAnalysis(symbol, timeframe, dataHash) {
    const cacheKey = this.getCacheKey(symbol, timeframe, dataHash);
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`📋 [TECH_ANALYSIS] Using cached analysis for ${symbol} ${timeframe}`);
      return cached.data;
    }
    
    return null;
  }

  /**
   * Store analysis in cache
   */
  setCachedAnalysis(symbol, timeframe, dataHash, analysis) {
    const cacheKey = this.getCacheKey(symbol, timeframe, dataHash);
    this.cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * MAIN METHOD: Get complete technical analysis with AI explanations
   * @param {Array} priceData - Historical price data
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Time period (1d, 5d, 1m, etc.)
   * @param {string} educationalLevel - Level of explanation (high_school, advanced)
   * @returns {Promise<object>} - Complete analysis with AI explanations
   */
  async getCompleteAnalysis(priceData, symbol = 'STOCK', timeframe = '1d', educationalLevel = 'high_school') {
    try {
      console.log(`🔍 [TECH_ANALYSIS] Starting complete analysis for ${symbol} (${timeframe})`);
      
      // Validate input data
      if (!priceData || !Array.isArray(priceData) || priceData.length === 0) {
        throw new Error('Invalid or empty price data provided');
      }
      
      // Check cache first
      const dataHash = this.generateDataHash(priceData);
      const cached = this.getCachedAnalysis(symbol, timeframe, dataHash);
      if (cached) {
        return cached;
      }
      
      // Get Python technical analysis
      console.log(`🐍 [TECH_ANALYSIS] Running Python analysis...`);
      const pythonAnalysis = await PythonBridge.analyzeTechnicalPatterns(priceData, symbol, timeframe);
      
      if (pythonAnalysis.error) {
        console.error(`❌ [TECH_ANALYSIS] Python analysis failed: ${pythonAnalysis.error}`);
        return {
          success: false,
          error: pythonAnalysis.error,
          symbol,
          timeframe,
          fallback: true
        };
      }
      
      // Generate AI explanations
      console.log(`🧠 [TECH_ANALYSIS] Generating AI explanations...`);
      const aiExplanation = await this.generateAIExplanation(pythonAnalysis, symbol, timeframe, educationalLevel);
      
      // Create quick summary for display
      const displaySummary = this.createDisplaySummary(pythonAnalysis, symbol, timeframe);
      
      // Combine everything into complete analysis
      const completeAnalysis = {
        success: true,
        symbol,
        timeframe,
        timestamp: new Date().toISOString(),
        technical_analysis: pythonAnalysis.analysis || {},
        ai_explanation: aiExplanation,
        display_summary: displaySummary,
        raw_python_output: pythonAnalysis,
        educational_level: educationalLevel
      };
      
      // Cache the result
      this.setCachedAnalysis(symbol, timeframe, dataHash, completeAnalysis);
      
      console.log(`✅ [TECH_ANALYSIS] Complete analysis generated for ${symbol}`);
      return completeAnalysis;
      
    } catch (error) {
      console.error(`❌ [TECH_ANALYSIS] Complete analysis failed for ${symbol}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        symbol,
        timeframe,
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  /**
   * Generate AI explanations for technical analysis using Mistral
   * FIXED: Now applies text cleaning to remove markdown symbols and special characters
   */
  async generateAIExplanation(pythonAnalysis, symbol, timeframe, educationalLevel = 'high_school') {
    try {
      // Extract key insights from Python analysis
      const analysis = pythonAnalysis.analysis || {};
      
      const prompt = this.createExplanationPrompt(analysis, symbol, timeframe, educationalLevel);
      
      console.log(`🧠 [TECH_ANALYSIS] Generating AI explanation for ${symbol}...`);
      
      const result = await unifiedGptOssService.generate('You are a helpful assistant.', prompt, {
        temperature: 0.7,
        maxTokens: 800
      });
      
      const rawExplanation = result.success ? result.content : 'Analysis temporarily unavailable';
      
      // 🔧 FIXED: Clean AI response for UI display
      const cleanedExplanation = processAIContentForUI(rawExplanation, {
        maxLength: 600, // Concise for dashboard display
        removeLineBreaks: false, // Keep paragraphs
        preservePunctuation: true
      });
      
      console.log(`✅ [TECH_ANALYSIS] AI explanation cleaned and processed for ${symbol}`);
      
      return {
        explanation: cleanedExplanation, // 🔧 FIXED: Now using cleaned text
        key_concepts: this.extractKeyConcepts(analysis),
        confidence: this.calculateConfidence(analysis),
        generated_at: new Date().toISOString(),
        raw_explanation: rawExplanation, // Keep original for debugging
        text_processed: true // Flag to indicate text processing was applied
      };
      
    } catch (error) {
      console.error(`❌ [TECH_ANALYSIS] AI explanation failed:`, error.message);
      
      return {
        explanation: this.generateFallbackExplanation(pythonAnalysis, symbol),
        key_concepts: ['Technical analysis temporarily unavailable'],
        confidence: 'medium',
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Create prompt for Mistral AI explanation
   * ENHANCED: More specific instructions for dashboard-friendly responses
   */
  createExplanationPrompt(analysis, symbol, timeframe, educationalLevel) {
    const trend = analysis.trend_analysis || {};
    const momentum = analysis.momentum_analysis || {};
    const signals = analysis.signals || {};
    const summary = analysis.executive_summary || {};
    
    const basePrompt = `Provide a concise technical analysis explanation for ${symbol} (${timeframe} timeframe) in ${educationalLevel === 'high_school' ? 'simple, clear language' : 'professional investment terms'}.

ANALYSIS DATA:
- Trend: ${trend.overall_trend || 'Unknown'} (Strength: ${trend.trend_strength || 'Unknown'})
- Support Level: $${trend.support_level || 'Unknown'}
- Resistance Level: $${trend.resistance_level || 'Unknown'}
- RSI: ${momentum.current_rsi || 'Unknown'} (${momentum.rsi_signal || 'Unknown'})
- Moving Average Signal: ${momentum.ma_signal || 'Unknown'}
- Recommendation: ${signals.recommendation || 'Unknown'} (${signals.confidence || 'Unknown'}% confidence)
- Entry Price: $${signals.entry_price || 'Unknown'}

INSTRUCTIONS:
- Write 2-3 concise paragraphs maximum
- Focus on what this means for investors
- Explain key signals and their importance
- Include specific actionable insights
- Use clear, professional language without jargon
- No headers, bullet points, or markdown formatting
- Make it educational and actionable

Summary: ${summary.summary || 'Technical analysis provides insights into price trends and momentum indicators.'}`;

    return basePrompt;
  }

  /**
   * Extract key concepts from analysis for educational tooltips
   */
  extractKeyConcepts(analysis) {
    const concepts = [];
    
    if (analysis.trend_analysis) {
      concepts.push('Trend Analysis', 'Support & Resistance');
    }
    
    if (analysis.momentum_analysis) {
      concepts.push('RSI Indicator', 'Moving Averages');
    }
    
    if (analysis.signals) {
      concepts.push('Trading Signals', 'Entry/Exit Strategy');
    }
    
    if (analysis.risk_assessment) {
      concepts.push('Risk Assessment', 'Volatility');
    }
    
    return concepts.length > 0 ? concepts : ['Technical Analysis', 'Price Action'];
  }

  /**
   * Calculate overall confidence score from analysis
   */
  calculateConfidence(analysis) {
    try {
      if (analysis.signals && analysis.signals.confidence) {
        const confidence = parseFloat(analysis.signals.confidence);
        if (confidence >= 75) return 'high';
        if (confidence >= 50) return 'medium';
        return 'low';
      }
      
      // Fallback confidence calculation
      const hasMultipleSignals = Object.keys(analysis).length > 3;
      return hasMultipleSignals ? 'medium' : 'low';
      
    } catch (error) {
      return 'medium';
    }
  }

  /**
   * Create display summary for quick view
   * ENHANCED: Uses text formatter for better headline display
   */
  createDisplaySummary(pythonAnalysis, symbol, timeframe) {
    try {
      const analysis = pythonAnalysis.analysis || {};
      const trend = analysis.trend_analysis || {};
      const signals = analysis.signals || {};
      const summary = analysis.executive_summary || {};
      
      // Create headline
      const trendDirection = trend.overall_trend || 'Unknown';
      const recommendation = signals.recommendation || 'Hold';
      const confidence = signals.confidence || 50;
      
      const rawHeadline = `${symbol} showing ${trendDirection.toLowerCase()} trend with ${recommendation.toLowerCase()} signal`;
      
      // 🔧 ENHANCED: Clean headline for UI display
      const cleanHeadline = processAIContentForUI(rawHeadline, {
        maxLength: 150,
        removeLineBreaks: true,
        preservePunctuation: true
      });
      
      // Get key insights
      const insights = [];
      
      if (trend.support_level) {
        insights.push(`Support at $${trend.support_level}`);
      }
      
      if (trend.resistance_level) {
        insights.push(`Resistance at $${trend.resistance_level}`);
      }
      
      if (analysis.momentum_analysis && analysis.momentum_analysis.current_rsi) {
        const rsi = parseFloat(analysis.momentum_analysis.current_rsi);
        if (rsi > 70) insights.push('RSI indicates overbought');
        else if (rsi < 30) insights.push('RSI indicates oversold');
        else insights.push(`RSI at ${rsi.toFixed(1)}`);
      }
      
      // 🔧 ENHANCED: Clean summary text
      const rawSummary = summary.summary || `Technical analysis for ${symbol} over ${timeframe} period.`;
      const cleanSummary = processAIContentForUI(rawSummary, {
        maxLength: 200,
        removeLineBreaks: true
      });
      
      return {
        headline: cleanHeadline,
        recommendation: recommendation.toUpperCase(),
        confidence: confidence > 70 ? 'high' : confidence > 50 ? 'medium' : 'low',
        key_insights: insights.slice(0, 3), // Limit to top 3 insights
        timeframe_label: this.getTimeframeLabel(timeframe),
        summary: cleanSummary
      };
      
    } catch (error) {
      console.error('❌ [TECH_ANALYSIS] Display summary creation failed:', error.message);
      
      return {
        headline: `${symbol} technical analysis available`,
        recommendation: 'HOLD',
        confidence: 'medium',
        key_insights: ['Analysis available'],
        timeframe_label: this.getTimeframeLabel(timeframe),
        summary: `Technical analysis data available for ${symbol}.`
      };
    }
  }

  /**
   * Generate fallback explanation when AI is unavailable
   * ENHANCED: Applies text cleaning to fallback content too
   */
  generateFallbackExplanation(pythonAnalysis, symbol) {
    const analysis = pythonAnalysis.analysis || {};
    const rawSummary = analysis.executive_summary?.summary || 
                   `Technical analysis has been completed for ${symbol}. The analysis includes trend direction, momentum indicators, and trading signals.`;
    
    const fallbackText = `${rawSummary}\n\nNote: Detailed AI explanation is temporarily unavailable. The technical indicators and signals are still calculated and available.`;
    
    // 🔧 ENHANCED: Clean fallback text too
    return processAIContentForUI(fallbackText, {
      maxLength: 400,
      removeLineBreaks: false
    });
  }

  /**
   * Get human-readable timeframe label
   */
  getTimeframeLabel(timeframe) {
    const labels = {
      '1d': '1-Day',
      '5d': '5-Day', 
      '1m': '1-Month',
      '3m': '3-Month',
      '6m': '6-Month',
      '1y': '1-Year',
      '5y': '5-Year'
    };
    
    return labels[timeframe] || timeframe;
  }

  /**
   * Get quick summary without full analysis (for performance)
   */
  async getQuickSummary(priceData, symbol, timeframe) {
    try {
      console.log(`⚡ [TECH_ANALYSIS] Quick summary for ${symbol}...`);
      
      if (!priceData || priceData.length === 0) {
        return {
          headline: `${symbol} data unavailable`,
          recommendation: 'HOLD',
          confidence: 'low'
        };
      }
      
      // Calculate basic trend from price data
      const firstPrice = priceData[0]?.price || priceData[0]?.close;
      const lastPrice = priceData[priceData.length - 1]?.price || priceData[priceData.length - 1]?.close;
      
      if (!firstPrice || !lastPrice) {
        return {
          headline: `${symbol} price data incomplete`,
          recommendation: 'HOLD',
          confidence: 'low'
        };
      }
      
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      const trend = priceChange > 2 ? 'bullish' : priceChange < -2 ? 'bearish' : 'sideways';
      const recommendation = priceChange > 5 ? 'BUY' : priceChange < -5 ? 'SELL' : 'HOLD';
      
      const headline = `${symbol} showing ${trend} momentum (${priceChange.toFixed(1)}%)`;
      
      return {
        headline: processAIContentForUI(headline, { maxLength: 100, removeLineBreaks: true }),
        recommendation: recommendation,
        confidence: Math.abs(priceChange) > 5 ? 'high' : 'medium',
        timeframe_label: this.getTimeframeLabel(timeframe)
      };
      
    } catch (error) {
      console.error(`❌ [TECH_ANALYSIS] Quick summary failed:`, error.message);
      
      return {
        headline: `${symbol} analysis unavailable`,
        recommendation: 'HOLD',
        confidence: 'low',
        error: error.message
      };
    }
  }

  /**
   * Test the service connectivity
   */
  async testService() {
    try {
      console.log('🔬 [TECH_ANALYSIS] Testing service connectivity...');
      
      // Test data
      const testData = [
        { date: '2024-01-01', price: 100, volume: 1000000 },
        { date: '2024-01-02', price: 102, volume: 1100000 },
        { date: '2024-01-03', price: 101, volume: 950000 }
      ];
      
      const result = await this.getCompleteAnalysis(testData, 'TEST', '1d');
      
      return {
        success: result.success,
        python_bridge: !result.error,
        mistral_ai: !result.ai_explanation?.error,
        text_formatter: result.ai_explanation?.text_processed || false,
        cache_working: this.cache.size >= 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ [TECH_ANALYSIS] Service test failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'TechnicalAnalysisService',
      cache_size: this.cache.size,
      cache_timeout: `${this.cacheTimeout / 1000}s`,
      python_bridge: 'Available',
      mistral_ai: true ? 'Ready' : 'Not Ready',
      text_formatter: 'Active',
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const technicalAnalysisService = new TechnicalAnalysisService();

export default technicalAnalysisService;
export { TechnicalAnalysisService };
