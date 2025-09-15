/**
 * GPT-OSS Direct Integration Service
 * Connects to Python GPT-OSS server running on port 8080
 */

import axios from 'axios';

class GPTOSSDirectService {
  constructor() {
    this.pythonServerUrl = 'http://localhost:8080';
    this.isConnected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.pythonServerUrl}/health`);
      this.isConnected = response.data.model_loaded;
      console.log('✅ GPT-OSS Python server connected:', response.data);
      return true;
    } catch (error) {
      console.log('⚠️ GPT-OSS Python server not running. Start with: uvicorn gpt_oss_server:app --port 8080');
      this.isConnected = false;
      return false;
    }
  }

  async analyzeMarket(marketData) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        // Fallback to unified AI service
        const unifiedService = await import('../unifiedGptOssService.js');
        const result = await unifiedService.default.generate('You are a helpful assistant.', this.buildMarketPrompt(marketData), { temperature: 0.7 });
        return result.success ? result.content : 'Analysis unavailable';
      }
    }

    try {
      const response = await axios.post(`${this.pythonServerUrl}/market-analysis`, {
        sp500_price: marketData.sp500?.price || 6466.92,
        sp500_change: marketData.sp500?.change || 0,
        nasdaq_price: marketData.nasdaq?.price || 20000,
        nasdaq_change: marketData.nasdaq?.change || 0,
        vix: marketData.vix?.value || 15,
        treasury_10y: marketData.treasury10y || 4.5
      });

      return {
        success: true,
        content: response.data.analysis,
        model: 'GPT-OSS-20B'
      };
    } catch (error) {
      console.error('GPT-OSS analysis error:', error.message);
      // Fallback to unified AI service
      const unifiedService = await import('../unifiedGptOssService.js');
      const result = await unifiedService.default.generate('You are a helpful assistant.', this.buildMarketPrompt(marketData), { temperature: 0.7 });
      return result.success ? result.content : 'Analysis unavailable';
    }
  }

  buildMarketPrompt(marketData) {
    return `Analyze market conditions: S&P 500: ${marketData.sp500?.price}, NASDAQ: ${marketData.nasdaq?.price}, VIX: ${marketData.vix?.value}`;
  }

  async generate(prompt, options = {}) {
    if (!this.isConnected) {
      await this.checkConnection();
    }

    try {
      const response = await axios.post(`${this.pythonServerUrl}/generate`, {
        prompt,
        reasoning: options.reasoning || 'medium',
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      });

      return {
        success: true,
        content: response.data.response,
        model: 'GPT-OSS-20B'
      };
    } catch (error) {
      console.error('GPT-OSS generation error:', error.message);
      // Fallback to unified AI service
      const unifiedService = await import('../unifiedGptOssService.js');
      const result = await unifiedService.default.generate('You are a helpful assistant.', prompt, { temperature: options.temperature || 0.7 });
      return result;
    }
  }

  async explainConcept(concept, context = {}) {
    if (!this.isConnected) {
      await this.checkConnection();
    }

    try {
      const response = await axios.post(`${this.pythonServerUrl}/explain`, null, {
        params: {
          concept,
          context: context.relatedTo
        }
      });

      return {
        success: true,
        content: response.data.explanation,
        model: 'GPT-OSS-20B'
      };
    } catch (error) {
      console.error('GPT-OSS explain error:', error.message);
      const unifiedService = await import('../unifiedGptOssService.js');
      const result = await unifiedService.default.generate('You are a helpful assistant.', `Explain ${concept}`, { temperature: 0.7 });
      return result;
    }
  }
}

export default new GPTOSSDirectService();
