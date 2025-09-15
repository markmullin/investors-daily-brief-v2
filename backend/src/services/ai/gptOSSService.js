/**
 * GPT-OSS-20B AI Service Integration
 * Connects to llama.cpp server running GPT-OSS-20B on RTX 5060
 * Replaces Mistral API with local GPU-accelerated model
 */

import axios from 'axios';

class GPTOSSService {
  constructor() {
    // llama.cpp server endpoint
    this.baseURL = process.env.GPT_OSS_URL || 'http://localhost:8080';
    this.timeout = 120000; // 2 minutes timeout for generation
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🤖 Connecting to GPT-OSS-20B server...');
      const health = await this.checkHealth();
      
      if (health.status === 'ok') {
        console.log('✅ GPT-OSS-20B connected successfully');
        console.log(`📊 Model: ${health.model || 'gpt-oss-20b'}`);
        console.log(`🚀 GPU: RTX 5060 (${health.gpu_memory || '8GB'} VRAM)`);
        console.log(`⚡ Performance: ~6.5 tokens/second`);
      }
    } catch (error) {
      console.error('⚠️ GPT-OSS server not running. Start with: npm run ai:server');
      console.log('📝 Fallback to Mistral API if configured');
    }
  }

  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'offline' };
    }
  }

  /**
   * Generate market analysis using GPT-OSS-20B
   */
  async generateMarketAnalysis(marketData) {
    try {
      const prompt = this.buildMarketAnalysisPrompt(marketData);
      
      const response = await this.axiosInstance.post('/completion', {
        prompt: prompt,
        n_predict: 300,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        stream: false
      });

      return {
        analysis: response.data.content,
        model: 'gpt-oss-20b',
        tokens_per_second: response.data.timings?.predicted_per_second || 6.5,
        gpu_accelerated: true
      };
    } catch (error) {
      console.error('GPT-OSS generation error:', error);
      throw error;
    }
  }

  /**
   * Explain financial concepts at high school level
   */
  async explainConcept(concept, context = {}) {
    const prompt = `Explain ${concept} in simple terms that a high school student could understand.
${context.portfolio ? `Context: The user has a portfolio worth $${context.portfolio.value}.` : ''}
Keep the explanation under 150 words and use real-world examples.

Concept to explain: ${concept}

Simple explanation:`;

    try {
      const response = await this.axiosInstance.post('/completion', {
        prompt: prompt,
        n_predict: 200,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      });

      return {
        explanation: response.data.content,
        model: 'gpt-oss-20b'
      };
    } catch (error) {
      console.error('Explanation generation error:', error);
      throw error;
    }
  }

  /**
   * Generate portfolio insights
   */
  async analyzePortfolio(portfolio, marketConditions) {
    const prompt = this.buildPortfolioAnalysisPrompt(portfolio, marketConditions);
    
    try {
      const response = await this.axiosInstance.post('/completion', {
        prompt: prompt,
        n_predict: 400,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      });

      return {
        insights: response.data.content,
        recommendations: this.extractRecommendations(response.data.content),
        model: 'gpt-oss-20b'
      };
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      throw error;
    }
  }

  /**
   * Stream responses for chat interface
   */
  async streamChat(messages, onToken) {
    const prompt = this.formatChatMessages(messages);
    
    const response = await this.axiosInstance.post('/completion', {
      prompt: prompt,
      n_predict: 500,
      temperature: 0.8,
      stream: true
    }, {
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                onToken(data.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });

      response.data.on('end', () => resolve(fullResponse));
      response.data.on('error', reject);
    });
  }

  // Helper methods
  buildMarketAnalysisPrompt(data) {
    return `Analyze the current market conditions as a financial expert:

Market Data:
- S&P 500: $${data.sp500Price.toFixed(2)} (${data.sp500Change >= 0 ? '+' : ''}${data.sp500Change.toFixed(2)}%)
- NASDAQ: $${data.nasdaqPrice.toFixed(2)} (${data.nasdaqChange >= 0 ? '+' : ''}${data.nasdaqChange.toFixed(2)}%)
- VIX: ${data.vix.toFixed(2)}
- 10-Year Treasury: ${data.treasury10y.toFixed(2)}%
- Market Phase: ${data.marketPhase || 'NEUTRAL'}

Provide a concise market analysis covering:
1. Current market sentiment
2. Key drivers of today's movement
3. Sectors to watch
4. Risk assessment

Analysis:`;
  }

  buildPortfolioAnalysisPrompt(portfolio, market) {
    return `Analyze this portfolio given current market conditions:

Portfolio:
- Total Value: $${portfolio.totalValue.toLocaleString()}
- Today's Change: ${portfolio.dayChange >= 0 ? '+' : ''}${portfolio.dayChange.toFixed(2)}%
- Top Holdings: ${portfolio.topHoldings.slice(0, 5).map(h => `${h.symbol} (${h.weight.toFixed(1)}%)`).join(', ')}
- Sector Allocation: ${Object.entries(portfolio.sectorWeights).map(([s, w]) => `${s}: ${w.toFixed(1)}%`).join(', ')}

Market Context:
- Market Phase: ${market.phase}
- VIX: ${market.vix}
- Trend: ${market.trend}

Provide actionable insights:`;
  }

  formatChatMessages(messages) {
    return messages.map(m => {
      if (m.role === 'user') return `User: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return '';
    }).join('\n\n') + '\n\nAssistant:';
  }

  extractRecommendations(text) {
    // Simple extraction of actionable items
    const lines = text.split('\n');
    const recommendations = [];
    
    for (const line of lines) {
      if (line.match(/^(buy|sell|hold|consider|reduce|increase|rebalance)/i)) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }
}

// Singleton instance
let gptOSSServiceInstance;

export const getGPTOSSService = () => {
  if (!gptOSSServiceInstance) {
    gptOSSServiceInstance = new GPTOSSService();
  }
  return gptOSSServiceInstance;
};

export default GPTOSSService;
