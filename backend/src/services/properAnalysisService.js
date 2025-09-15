/**
 * Proper Analysis Service - Clean Separation of Concerns
 * Python handles ALL numbers, AI handles ONLY interpretation
 */

import axios from 'axios';

class ProperAnalysisService {
  constructor() {
    this.pythonUrl = 'http://localhost:8000';
  }

  /**
   * Main analysis flow - Python calculates, AI interprets
   */
  async analyze(type, data) {
    try {
      // Step 1: Python does ALL calculations and returns conclusions
      const pythonResponse = await this.getPythonAnalysis(type, data);
      
      // Step 2: AI interprets the conclusions (NO NUMBERS)
      const aiInsight = await this.getAIInterpretation(type, pythonResponse.conclusions);
      
      return {
        success: true,
        calculations: pythonResponse.data,
        conclusions: pythonResponse.conclusions,
        insight: aiInsight,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.getFallback(type);
    }
  }

  /**
   * Python handles ALL numerical analysis
   */
  async getPythonAnalysis(type, data) {
    try {
      const response = await axios.post(`${this.pythonUrl}/analyze`, {
        type,
        data
      });
      
      return response.data;
    } catch (error) {
      // If Python is down, return basic conclusions
      return this.getBasicConclusions(type, data);
    }
  }

  /**
   * AI provides interpretation with NO NUMBERS
   */
  async getAIInterpretation(type, conclusions) {
    // Simple prompts with NO numbers
    const prompts = {
      marketPhase: `The market is currently in a ${conclusions.phase} phase with ${conclusions.sentiment} sentiment. What does this mean for investors? Keep it to 3 sentences.`,
      
      sectors: `${conclusions.leadingSector} is leading while ${conclusions.laggingSector} is lagging. This rotation suggests ${conclusions.rotationType}. What should investors consider? Keep it to 3 sentences.`,
      
      correlations: `The relationship between ${conclusions.asset1} and ${conclusions.asset2} is currently ${conclusions.relationship}. What does this mean for portfolio diversification? Keep it to 3 sentences.`
    };

    const prompt = prompts[type] || prompts.marketPhase;
    
    try {
      // Send to Ollama with simple prompt
      const response = await axios.post('http://localhost:11434/v1/chat/completions', {
        model: 'qwen3:8b',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor. Provide clear, actionable insights without mentioning specific numbers or percentages.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      });
      
      return response.data.choices[0]?.message?.content || this.getFallbackInsight(type);
    } catch (error) {
      return this.getFallbackInsight(type);
    }
  }

  /**
   * Basic conclusions when Python is unavailable
   */
  getBasicConclusions(type, data) {
    // Return structured conclusions, not raw numbers
    return {
      conclusions: {
        phase: 'neutral',
        sentiment: 'mixed',
        leadingSector: 'Technology',
        laggingSector: 'Utilities',
        rotationType: 'growth rotation',
        asset1: 'stocks',
        asset2: 'bonds',
        relationship: 'inversely correlated'
      },
      data: {}
    };
  }

  /**
   * Fallback insights
   */
  getFallbackInsight(type) {
    const insights = {
      marketPhase: 'Market conditions suggest a balanced approach. Consider maintaining diversified positions while monitoring for directional signals. Stay prepared for potential volatility.',
      sectors: 'Sector rotation indicates shifting market preferences. Consider rebalancing toward outperforming sectors while maintaining core positions. Monitor for sustained leadership changes.',
      correlations: 'Asset relationships are displaying expected patterns. Maintain appropriate diversification across asset classes. Review portfolio balance regularly.'
    };
    
    return insights[type] || insights.marketPhase;
  }

  getFallback(type) {
    return {
      success: false,
      calculations: {},
      conclusions: this.getBasicConclusions(type, {}).conclusions,
      insight: this.getFallbackInsight(type),
      timestamp: new Date().toISOString()
    };
  }
}

export default new ProperAnalysisService();
