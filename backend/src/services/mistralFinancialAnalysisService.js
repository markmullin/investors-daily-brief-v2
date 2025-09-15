import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes cache for AI analysis

class MistralFinancialAnalysisService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || 'mistral-8NPkpT6Z9SWnQAKVJk3j7NnJMDJlEbZC';
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.model = 'mistral-large-latest'; // Use the most capable model for financial analysis
  }

  async analyzeMarketNews(newsArticles) {
    try {
      const cacheKey = `mistral_analysis_${this.hashNewsArticles(newsArticles)}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('🔄 Returning cached Mistral analysis');
        return cached;
      }

      console.log('🤖 Generating financial advisor analysis with Mistral AI...');

      if (!newsArticles || newsArticles.length === 0) {
        return this.getFallbackAnalysis();
      }

      // Prepare news summary for analysis
      const newsSummary = this.prepareNewsForAnalysis(newsArticles);
      
      const prompt = this.buildFinancialAdvisorPrompt(newsSummary);

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior financial advisor and portfolio manager with 20+ years of experience. You provide clear, actionable market insights for individual investors and institutional clients. Your analysis is professional, data-driven, and focuses on practical investment implications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Mistral AI');
      }

      const analysis = {
        content: response.data.choices[0].message.content,
        sources: newsArticles.map(article => ({
          title: article.title,
          source: article.sourceName,
          url: article.url,
          priority: article.priority
        })),
        generatedAt: new Date().toISOString(),
        model: this.model,
        newsCount: newsArticles.length
      };

      console.log('✅ Generated financial analysis:', {
        contentLength: analysis.content.length,
        sourcesCount: analysis.sources.length,
        model: analysis.model
      });

      cache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Error generating Mistral analysis:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  prepareNewsForAnalysis(articles) {
    return articles.slice(0, 6).map((article, index) => {
      return `${index + 1}. **${article.sourceName}**: "${article.title}"
         Summary: ${article.description}
         Priority: ${article.priority.toUpperCase()}`;
    }).join('\n\n');
  }

  buildFinancialAdvisorPrompt(newsSummary) {
    return `As a senior financial advisor, analyze today's key market developments and provide investment insights for clients.

**TODAY'S MARKET NEWS:**
${newsSummary}

**ANALYSIS REQUIREMENTS:**
Please provide a comprehensive market analysis in the following format:

**Market Overview:**
Summarize the current market environment and key themes from today's news.

**Investment Implications:**
- What sectors or asset classes are most affected?
- How should investors position their portfolios?
- Are there specific risks or opportunities to highlight?

**Key Takeaways:**
- 3-4 bullet points with actionable insights
- Focus on practical implications for investors
- Include any important economic indicators or events to watch

**Risk Assessment:**
Brief assessment of current market risks and potential volatility drivers.

Keep the analysis professional, clear, and focused on practical investment guidance. Avoid jargon and make it accessible to both individual and institutional investors. Target length: 800-1000 words.`;
  }

  hashNewsArticles(articles) {
    // Simple hash of article titles for caching
    const titles = articles.map(a => a.title).join('|');
    return Buffer.from(titles).toString('base64').substring(0, 16);
  }

  getFallbackAnalysis() {
    return {
      content: `**Market Overview:**
Financial markets are currently navigating a complex environment with multiple factors influencing investor sentiment. Key themes include ongoing monetary policy developments, corporate earnings results, and evolving economic indicators.

**Investment Implications:**
- **Diversification Remains Key**: Maintaining balanced portfolio allocation across asset classes continues to be essential in the current environment.
- **Quality Focus**: Emphasis on companies with strong fundamentals, solid balance sheets, and sustainable business models.
- **Risk Management**: Active monitoring of position sizing and implementing appropriate hedging strategies where necessary.

**Key Takeaways:**
• Stay disciplined with long-term investment strategy while remaining responsive to changing market conditions
• Monitor Federal Reserve policy communications and economic data releases for portfolio positioning guidance
• Consider dollar-cost averaging for new investments to mitigate timing risk
• Maintain adequate cash reserves for potential opportunities and unexpected volatility

**Risk Assessment:**
Current market environment presents moderate volatility potential driven by monetary policy uncertainty, geopolitical developments, and evolving economic data. Investors should remain vigilant while avoiding reactive decision-making based on short-term market movements.

*This analysis is for informational purposes and should not be considered personalized investment advice.*`,
      sources: [
        {
          title: 'Market Analysis Framework',
          source: 'Financial Advisory Standards',
          url: '#',
          priority: 'medium'
        }
      ],
      generatedAt: new Date().toISOString(),
      model: 'fallback-analysis',
      newsCount: 0
    };
  }

  // Method to generate streaming analysis for typewriter effect
  async generateStreamingAnalysis(newsArticles) {
    try {
      console.log('🔄 Generating streaming analysis for typewriter effect...');
      
      const newsSummary = this.prepareNewsForAnalysis(newsArticles);
      const prompt = this.buildFinancialAdvisorPrompt(newsSummary);

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior financial advisor and portfolio manager with 20+ years of experience. You provide clear, actionable market insights for individual investors and institutional clients. Your analysis is professional, data-driven, and focuses on practical investment implications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        stream: true // Enable streaming for typewriter effect
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      });

      return response.data; // Return stream for frontend consumption

    } catch (error) {
      console.error('❌ Error generating streaming analysis:', error.message);
      throw error;
    }
  }
}

export default new MistralFinancialAnalysisService();
