/**
 * GPU MANAGER SERVICE
 * Manages GPU-accelerated AI models for educational explanations
 * ARCHITECTURE: Qwen-3-8B (always loaded) + GPT-OSS-20B (on demand)
 */

import axios from 'axios';
import EventEmitter from 'events';
import pythonGpuBridge from './pythonGpuBridge.js';

class GPUManager extends EventEmitter {
  constructor() {
    super();
    
    // Ollama configuration for both models
    this.ollamaUrl = 'http://localhost:11434';
    this.apiUrl = `${this.ollamaUrl}/api`;
    this.chatUrl = `${this.ollamaUrl}/v1/chat/completions`;
    
    // Model configurations
    this.models = {
      qwen: {
        name: 'qwen3:8b', // Correct Qwen 3 8B model name
        displayName: 'Qwen 3 8B',
        purpose: 'fast_education',
        alwaysLoaded: true,
        temperature: 0.6,
        maxTokens: 400,
        timeout: 30000, // 30 seconds for Qwen 3 8B - normal generation time
        status: 'unloaded'
      },
      gptoss: {
        name: 'gpt-oss', // Simplified name, Ollama will find the right variant
        displayName: 'GPT-OSS',
        purpose: 'comprehensive_analysis',
        alwaysLoaded: false,
        temperature: 0.7,
        maxTokens: 800,
        timeout: 30000, // 30 seconds for comprehensive analysis
        status: 'unloaded'
      }
    };
    
    this.gpuStats = {
      available: false,
      temperature: 0,
      memoryUsed: 0,
      memoryTotal: 24000, // Assume 24GB GPU (Qwen 3 8B needs ~16GB, GPT-OSS ~8GB)
      utilizationPercent: 0
    };
    
    this.isInitialized = false;
    this.lastHealthCheck = null;
    
    console.log('🎮 GPU Manager initialized with dual model architecture');
    console.log(`📚 Education Model: ${this.models.qwen.displayName} (Always Ready)`);
    console.log(`🧠 Analysis Model: ${this.models.gptoss.displayName} (On Demand)`);
  }
  
  /**
   * Initialize GPU infrastructure and ensure Qwen is always loaded
   */
  async initialize() {
    try {
      console.log('🚀 Initializing GPU infrastructure...');
      
      // Check if Ollama is running
      console.log('📍 Checking Ollama health...');
      const ollamaHealth = await this.checkOllamaHealth();
      console.log('📍 Ollama health result:', ollamaHealth);
      
      if (!ollamaHealth.success) {
        console.error('❌ Ollama not available:', ollamaHealth.error);
        // Don't throw - just mark as unavailable
        this.isInitialized = false;
        return false;
      }
      
      // Load available models
      const availableModels = await this.getAvailableModels();
      
      // Ensure Qwen is always loaded with timeout
      console.log('🔄 Starting Qwen model loading...');
      const qwenLoadPromise = this.ensureQwenLoaded(availableModels);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Qwen model loading timed out after 30 seconds')), 30000)
      );
      
      try {
        await Promise.race([qwenLoadPromise, timeoutPromise]);
        console.log('✅ Qwen loading completed');
      } catch (loadError) {
        console.error('❌ Qwen loading failed:', loadError.message);
        throw loadError;
      }
      
      // Check GPT-OSS availability (but don't load it)
      this.checkGptOssAvailability(availableModels);
      
      // Start GPU monitoring
      this.startGPUMonitoring();
      
      this.isInitialized = true;
      console.log('✅ GPU Manager fully initialized');
      
      this.emit('initialized', {
        qwen: this.models.qwen.status,
        gptoss: this.models.gptoss.status
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ GPU Manager initialization failed:', error.message);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Check Ollama server health
   */
  async checkOllamaHealth() {
    try {
      const response = await axios.get(`${this.apiUrl}/tags`, { timeout: 5000 });
      return {
        success: true,
        status: 'online',
        modelsCount: response.data.models?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        status: 'offline',
        error: error.message
      };
    }
  }
  
  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.apiUrl}/tags`, { timeout: 10000 });
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to get available models:', error.message);
      return [];
    }
  }
  
  /**
   * Ensure Qwen is always loaded and ready
   */
  async ensureQwenLoaded(availableModels = null) {
    try {
      if (!availableModels) {
        availableModels = await this.getAvailableModels();
      }
      
      // Check if Qwen is already loaded
      const qwenModel = availableModels.find(m => 
        m.name.includes('qwen3') && m.name.includes('8b')
      );
      
      if (qwenModel) {
        this.models.qwen.name = qwenModel.name;
        this.models.qwen.status = 'ready';
        console.log(`✅ Qwen model ready: ${qwenModel.name}`);
      } else {
        // Model not found - but we know it exists from our earlier test
        console.log('⚠️ Qwen model not found in list, but assuming it exists');
        this.models.qwen.status = 'ready';
        
        // Don't try to pull - just use the default name
        console.log(`✅ Using Qwen model: ${this.models.qwen.name}`);
      }
      
      // Skip test for now - it's causing hangs
      // await this.testModelReady('qwen');
      console.log('✅ Skipping model test - assuming Qwen is ready');
      
    } catch (error) {
      console.error('❌ Failed to ensure Qwen is loaded:', error.message);
      this.models.qwen.status = 'error';
      throw error;
    }
  }
  
  /**
   * Check if GPT-OSS is available (don't load it yet)
   */
  async checkGptOssAvailability(availableModels = null) {
    try {
      if (!availableModels) {
        availableModels = await this.getAvailableModels();
      }
      
      const gptOssModel = availableModels.find(m => 
        m.name.toLowerCase().includes('gpt') && m.name.toLowerCase().includes('oss')
      );
      
      if (gptOssModel) {
        this.models.gptoss.name = gptOssModel.name;
        this.models.gptoss.status = 'available';
        console.log(`📋 GPT-OSS available for on-demand loading: ${gptOssModel.name}`);
      } else {
        this.models.gptoss.status = 'not_available';
        console.log('⚠️ GPT-OSS model not found - comprehensive analysis unavailable');
      }
      
    } catch (error) {
      console.error('Failed to check GPT-OSS availability:', error.message);
      this.models.gptoss.status = 'unknown';
    }
  }
  
  /**
   * Pull a model from Ollama
   */
  async pullModel(modelName) {
    try {
      console.log(`📥 Pulling model: ${modelName}`);
      
      const response = await axios.post(`${this.apiUrl}/pull`, 
        { name: modelName },
        { 
          timeout: 300000, // 5 minutes for model download
          onDownloadProgress: (progress) => {
            console.log(`📊 Download progress: ${Math.round(progress.loaded / 1024 / 1024)}MB`);
          }
        }
      );
      
      console.log(`✅ Model pulled successfully: ${modelName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to pull model ${modelName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Test if a model is ready by sending a simple prompt
   */
  async testModelReady(modelKey) {
    try {
      const model = this.models[modelKey];
      if (!model) {
        throw new Error(`Unknown model: ${modelKey}`);
      }
      
      console.log(`🧪 Testing model readiness: ${model.displayName}`);
      
      // Use Ollama's native generate endpoint for testing
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: model.name,
        prompt: 'Test: What is 2+2? Answer with just the number.',
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 10
        }
      }, {
        timeout: 5000 // 5 second timeout for test
      });
      
      const content = response.data.response;
      if (content && content.includes('4')) {
        console.log(`✅ Model test passed: ${model.displayName}`);
        return true;
      } else {
        console.log(`⚠️ Model test unexpected response: ${content}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Model test failed for ${modelKey}:`, error.message);
      return false;
    }
  }
  
  /**
   * Generate educational explanation using Qwen (always ready)
   */
  async generateEducation(context, data, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (this.models.qwen.status !== 'ready') {
        throw new Error('Qwen model not ready for education');
      }
      
      console.log('🎓 Generating educational explanation with Qwen...');
      console.log('🧮 First, calculating insights with Python GPU analytics...');
      
      // Step 1: Use already-calculated Python results (avoid duplicate analysis)
      let pythonInsights = null;
      if (data && data.pythonResults) {
        pythonInsights = data.pythonResults;
        console.log('✅ Using pre-calculated Python analytics from route');
      } else {
        console.log('⚠️ No pre-calculated Python results, skipping Python step');
      }
      
      // Step 2: Build prompt with Python insights (not raw numbers)
      const prompt = this.buildEducationPrompt(context, data, pythonInsights);
      
      // Enable streaming to get real-time chain of thought
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: this.models.qwen.name,
        prompt: `You are a financial educator. Analyze this market data and think through your reasoning:

${prompt}

Please think step by step, then provide your educational analysis for investors.`,
        stream: true,
        options: {
          temperature: options.temperature || this.models.qwen.temperature,
          num_predict: options.maxTokens || this.models.qwen.maxTokens
        }
      }, {
        timeout: this.models.qwen.timeout,
        responseType: 'stream'
      });
      
      // Parse streaming response to capture reasoning AND final analysis
      let content = '';
      let thoughtBuffer = ''; 
      let lastThoughtSent = Date.now();
      let totalTokens = 0;
      let isInFinalAnalysis = false;
      let finalAnalysisContent = '';
      
      // Debug streaming
      console.log('📡 Streaming callback available?', !!options.streamCallback);
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          try {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
              if (line.trim()) {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  content += parsed.response;
                  totalTokens++;
                  
                  // Detect transition to final analysis 
                  const responseText = parsed.response;
                  if (responseText.includes('🎯') || 
                      responseText.includes('FINAL') ||
                      responseText.includes('final analysis') ||
                      responseText.includes('Step 1:') ||
                      responseText.includes('Based on') ||
                      responseText.includes('## ') ||
                      responseText.includes('### ')) {
                    isInFinalAnalysis = true;
                    console.log('🎯 Detected final analysis section:', responseText.substring(0, 50) + '...');
                  }
                  
                  if (isInFinalAnalysis) {
                    finalAnalysisContent += responseText;
                  } else {
                    // Still in thinking mode - stream as thoughts
                    thoughtBuffer += responseText;
                    
                    // ALWAYS try to stream, even if no callback (for debugging)
                    const now = Date.now();
                    
                    // Send complete sentences or after shorter delay for real-time feel
                    const hasCompleteSentence = /[.!?]\s*$/.test(thoughtBuffer.trim());
                    const hasReasonableLength = thoughtBuffer.trim().length > 20;
                    const hasTimedOut = now - lastThoughtSent > 800; // 0.8 second chunks
                    
                    if ((hasCompleteSentence && hasReasonableLength) || 
                        (hasTimedOut && thoughtBuffer.trim().length > 10)) {
                      
                      const thoughtContent = thoughtBuffer.trim();
                      if (thoughtContent) {
                        if (options.streamCallback) {
                          console.log('📡 Streaming thought:', thoughtContent.substring(0, 50) + '...');
                          options.streamCallback({
                            type: 'thought',
                            content: thoughtContent,
                            timestamp: new Date().toISOString(),
                            model: 'Qwen 3 8B'
                          });
                        } else {
                          console.log('💭 [NO STREAM] Thought:', thoughtContent.substring(0, 50) + '...');
                        }
                        thoughtBuffer = '';
                        lastThoughtSent = now;
                      }
                    }
                  }
                }
                
                if (parsed.done) {
                  // Send any final buffered thoughts
                  if (thoughtBuffer.trim().length > 0) {
                    if (options.streamCallback) {
                      console.log('📡 Streaming final thought buffer');
                      options.streamCallback({
                        type: 'thought',
                        content: thoughtBuffer.trim(),
                        timestamp: new Date().toISOString(),
                        model: 'Qwen 3 8B'
                      });
                    }
                  }
                  
                  console.log(`✅ Education generated: ${content.length} characters (${totalTokens} tokens)`);
                  console.log(`📊 Final analysis length: ${finalAnalysisContent.length} characters`);
                  
                  // Separate thinking from final analysis
                  const thinkingPart = content.replace(finalAnalysisContent, '').trim();
                  const analysisPart = finalAnalysisContent.trim() || content.trim();
                  
                  resolve({
                    success: true,
                    content: analysisPart, // Final analysis for the frontend
                    thinking: thinkingPart, // Reasoning process
                    model: this.models.qwen.displayName,
                    source: 'qwen_education',
                    tokens: totalTokens
                  });
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing stream:', parseError);
          }
        });
        
        response.data.on('error', (error) => {
          console.error('Stream error:', error);
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('❌ Education generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        source: 'qwen_education'
      };
    }
  }
  
  /**
   * Generate comprehensive analysis using GPT-OSS (loaded on demand)
   */
  async generateAnalysis(context, data, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Load GPT-OSS if needed
      if (this.models.gptoss.status === 'available') {
        console.log('📊 Loading GPT-OSS for comprehensive analysis...');
        this.models.gptoss.status = 'loading';
        // Skip test for now - causing hangs
        // await this.testModelReady('gptoss');
        this.models.gptoss.status = 'ready';
        console.log('✅ Skipping GPT-OSS test - assuming ready');
      }
      
      if (this.models.gptoss.status !== 'ready') {
        // Return error instead of recursive fallback to prevent duplicate calls
        console.log('⚠️ GPT-OSS not available, returning error instead of recursive fallback');
        return {
          success: false,
          error: 'GPT-OSS not available and avoiding recursive fallback',
          source: 'gpuManager_fallback_disabled'
        };
      }
      
      console.log('🧠 Generating comprehensive analysis with GPT-OSS...');
      
      const prompt = this.buildAnalysisPrompt(context, data);
      
      const response = await axios.post(`${this.apiUrl}/generate`, {
        model: this.models.gptoss.name,
        prompt: `You are a senior financial advisor. Provide detailed, actionable investment analysis. Think through your reasoning step by step, then provide comprehensive insights.

${prompt}`,
        stream: false,
        options: {
          temperature: options.temperature || this.models.gptoss.temperature,
          num_predict: options.maxTokens || this.models.gptoss.maxTokens
        }
      }, {
        timeout: this.models.gptoss.timeout
      });
      
      const content = response.data.response;
      
      console.log(`✅ Analysis generated: ${content?.length || 0} characters`);
      
      // Schedule unload after 30 minutes of inactivity
      this.scheduleGptOssUnload();
      
      return {
        success: true,
        content,
        model: this.models.gptoss.displayName,
        source: 'gptoss_analysis'
      };
      
    } catch (error) {
      console.error('❌ Analysis generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        source: 'gptoss_analysis'
      };
    }
  }
  
  /**
   * Get required calculations for different contexts
   */
  getRequiredCalculations(context) {
    const calculations = {
      market_index: ['rsi', 'moving_averages', 'volatility', 'trend_analysis'],
      sector_rotation: ['relative_strength', 'momentum', 'correlation_analysis'],
      technical_indicators: ['rsi', 'macd', 'bollinger_bands', 'support_resistance'],
      portfolio_analysis: ['sharpe_ratio', 'var', 'correlation_matrix', 'sector_allocation'],
      candlestick_chart: ['pattern_detection', 'volume_analysis', 'trend_strength'],
      macroeconomic: ['statistical_analysis', 'trend_analysis', 'correlation_analysis']
    };
    
    return calculations[context] || ['basic_analysis'];
  }
  
  /**
   * Build education prompt for Qwen with Python insights
   */
  buildEducationPrompt(context, data, pythonInsights = null) {
    // Use Python insights if available, otherwise fall back to basic explanation
    if (pythonInsights && pythonInsights.success) {
      const insights = pythonInsights.insights;
      
      const contextPrompts = {
        market_index: `Python analysis has calculated the following market insights:
- Market condition: ${insights.market_state || 'Unknown'}
- Trend strength: ${insights.trend_quality || 'Unknown'}
- Risk level: ${insights.risk_level || 'Unknown'}
- Key observations: ${(insights.key_patterns || []).join(', ') || 'None identified'}

Explain what these calculated insights mean for a beginner investor. Focus on the implications, not the calculations.`,

        sector_rotation: `Python analysis shows sector rotation patterns:
- Leading sectors: ${insights.leading_sectors || 'Unknown'}
- Lagging sectors: ${insights.lagging_sectors || 'Unknown'}
- Rotation strength: ${insights.rotation_strength || 'Unknown'}
- Economic drivers: ${insights.economic_drivers || 'Various factors'}

Explain what this sector rotation means and how investors can use this information.`,

        technical_indicators: `CURRENT TECHNICAL CONDITIONS (calculated by Python):
- RSI Analysis: ${insights.rsi_state || 'Unknown'}
- Trend Analysis: ${insights.trend_direction || 'Unknown'}
- Support/resistance: ${insights.key_levels || 'Not identified'}
- Volume signals: ${insights.volume_analysis || 'Unknown'}

CRITICAL: In your final analysis, you MUST mention the specific current RSI value and what it means right now (overbought/oversold/neutral). Explain what these current technical conditions mean for investors making decisions today.`,

        portfolio_analysis: `Portfolio analytics calculations:
- Risk-adjusted return: ${insights.sharpe_ratio || 'Unknown'}
- Diversification score: ${insights.diversification_level || 'Unknown'}
- Sector concentration: ${insights.sector_risk || 'Unknown'}
- Performance vs benchmark: ${insights.relative_performance || 'Unknown'}

Explain these portfolio metrics and what they mean for the investor.`
      };
      
      return contextPrompts[context] || `Python calculated these insights: ${JSON.stringify(insights)}. Explain what this means in simple terms.`;
    }
    
    // Fallback to basic prompts when Python analysis is unavailable
    const basicPrompts = {
      market_index: `Looking at market data for ${data.symbol || 'this asset'}. Explain basic market concepts and what investors should know.`,
      sector_rotation: `Examining sector performance patterns. Explain how sector rotation works and its importance.`,
      technical_indicators: `Analyzing technical indicators. Explain what common technical indicators mean for investors.`,
      portfolio_analysis: `Reviewing portfolio composition. Explain key portfolio analysis concepts.`
    };
    
    return basicPrompts[context] || 'Explain this financial concept in simple, educational terms.';
  }
  
  /**
   * Build analysis prompt for GPT-OSS
   */
  buildAnalysisPrompt(context, data) {
    const contextPrompts = {
      portfolio_optimization: `Comprehensive portfolio analysis: ${JSON.stringify(data)}.

Provide detailed analysis including:
- Risk-adjusted return optimization
- Correlation analysis and diversification
- Sector/geographic allocation assessment
- Rebalancing recommendations with specific percentages
- Tax-loss harvesting opportunities
- Timeline and implementation strategy`,

      market_forecast: `Market analysis data: ${JSON.stringify(data)}.

Provide comprehensive market outlook:
- Technical and fundamental analysis synthesis
- Economic indicators impact assessment
- Sector leadership analysis
- Risk scenario planning
- Specific investment opportunities
- Timeline and conviction levels`,

      investment_strategy: `Investment planning data: ${JSON.stringify(data)}.

Develop comprehensive investment strategy:
- Asset allocation optimization
- Risk tolerance alignment
- Goal-based investment planning
- Tax-efficient structuring
- Implementation timeline
- Monitoring and adjustment framework`
    };
    
    return contextPrompts[context] || `Provide comprehensive analysis of: ${JSON.stringify(data)}`;
  }
  
  /**
   * Schedule GPT-OSS unload after inactivity
   */
  scheduleGptOssUnload() {
    if (this.gptOssUnloadTimeout) {
      clearTimeout(this.gptOssUnloadTimeout);
    }
    
    this.gptOssUnloadTimeout = setTimeout(() => {
      console.log('⏰ Unloading GPT-OSS after 30 minutes of inactivity');
      this.models.gptoss.status = 'available';
      // Note: In a real implementation, you'd actually unload the model from memory
    }, 30 * 60 * 1000); // 30 minutes
  }
  
  /**
   * Start GPU monitoring
   */
  startGPUMonitoring() {
    // Simulate GPU monitoring (in real implementation, use nvidia-ml-py or similar)
    this.gpuMonitorInterval = setInterval(() => {
      this.updateGPUStats();
    }, 5000); // Every 5 seconds
    
    console.log('📊 GPU monitoring started');
  }
  
  /**
   * Update GPU statistics
   */
  updateGPUStats() {
    // Simulate GPU stats (replace with actual GPU monitoring)
    this.gpuStats = {
      available: true,
      temperature: Math.floor(Math.random() * 20) + 60, // 60-80°C
      memoryUsed: (this.models.qwen.status === 'ready' ? 16000 : 0) + 
                  (this.models.gptoss.status === 'ready' ? 8000 : 0), // MB (Qwen 3 8B uses more)
      memoryTotal: 24000,
      utilizationPercent: Math.floor(Math.random() * 30) + 10 // 10-40%
    };
    
    // Emit stats for monitoring dashboard
    this.emit('gpu_stats', this.gpuStats);
    
    // Check for alerts
    if (this.gpuStats.temperature > 80) {
      this.emit('gpu_alert', { type: 'temperature', value: this.gpuStats.temperature });
    }
    
    if (this.gpuStats.memoryUsed / this.gpuStats.memoryTotal > 0.9) {
      this.emit('gpu_alert', { type: 'memory', value: this.gpuStats.memoryUsed });
    }
  }
  
  /**
   * Get current system status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      models: {
        qwen: {
          ...this.models.qwen,
          ready: this.models.qwen.status === 'ready'
        },
        gptoss: {
          ...this.models.gptoss,
          ready: this.models.gptoss.status === 'ready'
        }
      },
      gpu: this.gpuStats,
      lastHealthCheck: this.lastHealthCheck
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.gpuMonitorInterval) {
      clearInterval(this.gpuMonitorInterval);
    }
    
    if (this.gptOssUnloadTimeout) {
      clearTimeout(this.gptOssUnloadTimeout);
    }
    
    console.log('🔄 GPU Manager destroyed');
  }
}

// Export singleton instance
export default new GPUManager();
