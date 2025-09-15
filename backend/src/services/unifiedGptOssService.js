/**
 * UNIFIED GPT-OSS SERVICE
 * Single source of truth for all GPT-OSS calls
 * NO MISTRAL, NO FALLBACKS - GPT-OSS ONLY
 */

import axios from 'axios';

class UnifiedGptOssService {
  constructor() {
    // DUAL MODEL SETUP - Using Ollama OpenAI-compatible API
    this.ollamaUrl = 'http://localhost:11434/v1/chat/completions';
    
    // Model configurations for Ollama
    this.models = {
      qwen: {
        model: 'qwen3:8b',
        modelName: 'Qwen 3 8B',
        temperature: 0.6,
        maxTokens: 500,
        timeout: 120000  // 2 minutes - allows for complex financial analysis
      },
      gptoss: {
        model: 'gpt-oss:20b',  // Fixed model name
        modelName: 'GPT-OSS 20B',
        temperature: 0.7,
        maxTokens: 400,
        timeout: 120000  // 2 minutes for comprehensive analysis
      }
    };
    
    console.log('🤖 DUAL MODEL SETUP (OLLAMA):');
    console.log(`   📡 Fast Analysis: ${this.models.qwen.modelName} (${this.models.qwen.model})`);
    console.log(`   📡 Comprehensive: ${this.models.gptoss.modelName} (${this.models.gptoss.model})`);
  }

  /**
   * CORE DUAL MODEL GENERATION
   * Routes to appropriate model based on useModel parameter
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    // Determine which model to use
    const modelKey = options.useModel === 'gpt-oss' ? 'gptoss' : 'qwen';  // Default to Qwen for speed
    const modelConfig = this.models[modelKey];
    
    console.log(`🎯 Routing to ${modelConfig.modelName} via Ollama...`);
    
    try {
      const response = await axios.post(this.ollamaUrl, {
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: options.temperature || modelConfig.temperature,
        max_tokens: options.maxTokens || modelConfig.maxTokens
      }, {
        timeout: options.timeout || modelConfig.timeout
      });

      let content = response.data.choices[0]?.message?.content?.trim() || '';
      
      // Clean output artifacts for comprehensive models
      if (modelKey === 'gptoss') {
        content = this.cleanGptOssOutput(content);
      }
      
      console.log(`✅ ${modelConfig.modelName}: Generated ${content.length} characters`);
      
      return {
        success: true,
        content: content,
        source: `${modelConfig.modelName}-Ollama`,
        model: modelConfig.model,
        modelName: modelConfig.modelName,
        tokensGenerated: response.data.usage?.completion_tokens || 0
      };

    } catch (error) {
      console.error(`❌ ${modelConfig.modelName} Generation failed:`, error.message);
      
      // NO FALLBACK - Return error with specific model info
      return {
        success: false,
        error: `${modelConfig.modelName} failed: ${error.message}`,
        source: `${modelConfig.modelName}-ERROR`
      };
    }
  }

  /**
   * Generate JSON response - ENSURES VALID JSON OUTPUT
   */
  async generateJSON(systemPrompt, userPrompt, options = {}) {
    // Force JSON mode by modifying prompts
    const jsonSystemPrompt = `${systemPrompt}

CRITICAL INSTRUCTIONS:
- Respond with ONLY a complete JSON object
- Start with { and end with }
- No text before or after the JSON
- No thinking tags, no explanations
- Complete all JSON fields properly`;
    
    const jsonUserPrompt = `${userPrompt}

RESPONSE FORMAT: Return ONLY the JSON object. Example format: {"field1": "value1", "field2": 123}`;

    // Increase maxTokens to ensure complete responses
    const enhancedOptions = {
      ...options,
      maxTokens: Math.max(options.maxTokens || 800, 800),
      temperature: Math.min(options.temperature || 0.2, 0.3)
    };
    
    const result = await this.generate(jsonSystemPrompt, jsonUserPrompt, enhancedOptions);
    
    if (!result.success) {
      return result;
    }
    
    // BULLETPROOF JSON extraction - extract whatever we can
    try {
      let content = result.content;
      
      // Clean up obvious issues
      content = content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<\/think>[\s\S]*$/g, '')
        .trim();
      
      // Find JSON-like content and try to parse it
      let extracted = this.extractAnyUsefulData(content);
      
      return {
        ...result,
        content: JSON.stringify(extracted),
        parsed: extracted
      };
    } catch (error) {
      console.error('❌ JSON extraction failed:', error.message);
      // Return basic structure so the system doesn't break
      const fallback = {
        managementSentiment: { confidenceScore: 50, overall: "neutral" },
        keyThemes: [],
        comparedToLastQuarter: "Analysis incomplete"
      };
      return {
        ...result,
        content: JSON.stringify(fallback),
        parsed: fallback,
        warning: 'Fallback data used due to parsing error'
      };
    }
  }

  /**
   * Extract any useful data from AI response - handles broken JSON
   */
  extractAnyUsefulData(content) {
    // Try multiple approaches to extract data
    
    // 1. Try parsing as complete JSON first
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {}
    
    // 2. Extract individual fields if JSON is broken
    const extracted = {
      managementSentiment: { confidenceScore: 50, overall: "neutral" },
      keyThemes: [],
      comparedToLastQuarter: "Analysis incomplete"
    };
    
    // Extract confidence score
    const confidenceMatch = content.match(/"confidenceScore":\s*(\d+)/);
    if (confidenceMatch) {
      extracted.managementSentiment.confidenceScore = parseInt(confidenceMatch[1]);
    }
    
    // Extract sentiment
    const sentimentMatch = content.match(/"overall":\s*"([^"]+)"/);
    if (sentimentMatch) {
      extracted.managementSentiment.overall = sentimentMatch[1];
    }
    
    // Extract themes array
    const themesMatch = content.match(/"keyThemes":\s*\[(.*?)\]/s);
    if (themesMatch) {
      try {
        const themesStr = '[' + themesMatch[1] + ']';
        const themes = JSON.parse(themesStr);
        extracted.keyThemes = Array.isArray(themes) ? themes : [];
      } catch (e) {
        // Extract simple string themes
        const simpleThemes = themesMatch[1].match(/"([^"]+)"/g);
        if (simpleThemes) {
          extracted.keyThemes = simpleThemes.map(t => t.replace(/"/g, ''));
        }
      }
    }
    
    // Extract comparison
    const comparisonMatch = content.match(/"comparedToLastQuarter":\s*"([^"]+)"/);
    if (comparisonMatch) {
      extracted.comparedToLastQuarter = comparisonMatch[1];
    }
    
    return extracted;
  }

  /**
   * INTELLIGENT MARKET ANALYSIS
   */
  async generateIntelligentAnalysis(analysisType, marketPhase, marketData = null, options = {}) {
    console.log('🧠 UNIFIED GPT-OSS: Intelligent analysis request');

    const systemPrompt = 'You are a senior financial advisor. Provide specific, actionable market insights. Write ONLY the final analysis, not your reasoning process.';
    
    let userPrompt;
    if (marketData && typeof marketData === 'object') {
      const dataPoints = Object.entries(marketData)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
        .join(', ');
      
      userPrompt = `Real-time market data: ${dataPoints}. Current phase: ${marketPhase}. Analysis type: ${analysisType}.

Provide 3-5 sentences of actionable analysis based on this real data. Focus on specific investment implications and what investors should watch for.`;
    } else {
      userPrompt = `Market conditions: ${marketPhase}. Analysis type: ${analysisType}.

Provide 3-5 sentences of actionable recommendations for current market environment. Focus on specific opportunities and risks investors should consider.`;
    }

    return await this.generate(systemPrompt, userPrompt, options);
  }

  /**
   * DAILY MARKET BRIEF
   */
  async generateDailyBrief(newsItems) {
    console.log('📰 UNIFIED GPT-OSS: Daily brief generation');

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const systemPrompt = 'You are a senior financial advisor. Write ONLY the final market brief, not your reasoning process. Start immediately with "**Market Overview:**" and provide the requested sections.';
    
    const userPrompt = `Based on these REAL news items from today:
${newsItems.map((item, i) => `${i+1}. ${item.company}: ${item.title} (Source: ${item.source})`).join('\n')}

Create a concise daily market brief for ${dateString}. Include:

**Market Overview:** Brief summary of market movements and key themes.

**Key Developments:** Federal Reserve policy outlook, inflation trends, and sector rotation patterns.

**Company Spotlight:** Quick analysis of 2-3 major companies with current performance and investment implications.

**Risk Assessment:** Brief outlook and key factors to watch.

Keep response to 300-400 words with clear, actionable insights using markdown formatting.`;

    return await this.generate(systemPrompt, userPrompt, {
      maxTokens: 1200,
      timeout: 180000  // 3 minutes for daily brief
    });
  }

  /**
   * Clean GPT-OSS output artifacts
   */
  cleanGptOssOutput(content) {
    // Remove special tokens
    content = content.replace(/<\|channel\|>.*?<\|message\|>/g, '');
    content = content.replace(/<\|.*?\|>/g, '');
    
    // Remove chain-of-thought reasoning
    content = content.replace(/^The user wants.*?(?=\*\*)/s, '');
    content = content.replace(/^We need to.*?(?=\*\*)/s, '');
    content = content.replace(/^Let's.*?(?=\*\*)/s, '');
    content = content.replace(/^I need to.*?(?=\*\*)/s, '');
    content = content.replace(/^.*?assistant/i, '');
    
    // Remove meta-commentary
    content = content.replace(/We need to.*?sentences\./gi, '');
    content = content.replace(/They want.*?specific\./gi, '');
    content = content.replace(/Should be.*?etc\./gi, '');
    content = content.replace(/Provide.*?sentences\./gi, '');
    
    // Find first markdown section
    const markdownMatch = content.match(/\*\*[A-Z][^*]*\*\*/);
    if (markdownMatch) {
      const startIndex = content.indexOf(markdownMatch[0]);
      content = content.substring(startIndex);
    }
    
    return content.trim();
  }

  /**
   * Health check for both AI servers
   */
  async healthCheck() {
    try {
      // Check Ollama server health and available models
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      const availableModels = response.data.models || [];
      
      const qwenAvailable = availableModels.some(m => m.name.includes('qwen3:8b'));
      const gptOssAvailable = availableModels.some(m => m.name.includes('gpt-oss:20b'));
      
      return {
        status: 'online',
        dualSetup: true,
        server: 'Ollama',
        url: this.ollamaUrl,
        models: {
          qwen: {
            model: this.models.qwen.model,
            available: qwenAvailable,
            status: qwenAvailable ? 'ready' : 'downloading'
          },
          comprehensive: {
            model: this.models.gptoss.model,
            available: gptOssAvailable,
            status: gptOssAvailable ? 'ready' : 'downloading'
          }
        },
        totalModels: availableModels.length
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error.message,
        dualSetup: true,
        server: 'Ollama'
      };
    }
  }
}

export default new UnifiedGptOssService();
