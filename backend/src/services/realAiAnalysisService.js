// realAiAnalysisService.js - UPDATED for real current events analysis
import mistralService from './mistralService.js';
import premiumNewsService from './premiumNewsService.js';

class RealAiAnalysisService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the AI analysis service
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🤖 Initializing real AI analysis service...');
      
      // Initialize Mistral AI service
      const mistralReady = await mistralService.initialize();
      if (!mistralReady) {
        throw new Error('Failed to initialize Mistral AI service');
      }

      // Initialize premium news service
      await premiumNewsService.initialize();

      this.isInitialized = true;
      console.log('✅ Real AI analysis service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI analysis service:', error);
      throw new Error(`AI Analysis initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive AI market analysis from TODAY'S breaking news
   */
  async generateMarketAnalysis() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📊 Generating REAL AI analysis from today\'s breaking news...');

      // Step 1: Gather TODAY'S breaking financial news - current events
      const currentEventsQueries = [
        'Federal Reserve interest rate decision today',
        'Iran Israel conflict market impact',
        'breaking economic news today',
        'stock market news today',
        'earnings report today',
        'geopolitical events market reaction',
        'inflation data today',
        'cryptocurrency market news',
        'oil prices today news'
      ];

      const premiumArticles = await premiumNewsService.gatherPremiumNews(currentEventsQueries);

      if (!premiumArticles || premiumArticles.length === 0) {
        throw new Error('No current events articles gathered - news service may be down');
      }

      console.log(`📰 Analyzing ${premiumArticles.length} breaking news articles...`);

      // Step 2: Create comprehensive prompt for financial advisor analysis of TODAY'S events
      const newsContext = premiumArticles.map(article => 
        `**${article.source} - ${article.title}**\n${article.content || article.description}\nPublished: ${article.publishedTime}\nPriority: ${article.priority}\n`
      ).join('\n---\n');

      const financialAdvisorPrompt = `You are a senior financial advisor providing today's market briefing to high-net-worth clients based on REAL breaking news from ${new Date().toLocaleDateString()}.

Analyze these TODAY'S premium financial news stories and current events for their investment implications:

${newsContext}

Provide a comprehensive daily brief in this format:

**Today's Market Environment:**
[Analyze today's specific developments - Fed decisions, geopolitical events, earnings, economic data]

**Breaking News Impact Analysis:**
[How today's specific events (Iran-Israel, Fed policy, earnings surprises, etc.) affect markets]

**Investment Implications:**
[Specific actionable insights based on TODAY'S developments]

**Sector & Asset Positioning:**
[How today's news affects different sectors - technology, energy, defense, financials, etc.]

**Risk Factors & Opportunities:**
[Key risks and opportunities emerging from today's events]

**Strategic Recommendations:**
[3-4 specific recommendations based on today's breaking developments]

Focus exclusively on TODAY'S events and their market implications. Reference specific news stories and current developments. Write as if briefing sophisticated investors on today's market-moving events.

This is a DAILY brief - analyze current events, not generic market commentary.`;

      // Step 3: Generate AI analysis using Mistral AI
      console.log('🤖 Generating Mistral AI analysis of today\'s events...');
      const aiAnalysis = await mistralService.generateText(financialAdvisorPrompt, {
        temperature: 0.2,
        maxTokens: 2500
      });

      if (!aiAnalysis || aiAnalysis.includes('temporarily unavailable')) {
        throw new Error('Failed to generate AI analysis from Mistral - no fallback data available');
      }

      // Step 4: Structure the response with real sources
      const analysisResult = {
        analysis: aiAnalysis,
        sources: premiumArticles.map(article => ({
          title: article.title,
          source: article.source,
          url: article.url,
          publishedTime: article.publishedTime,
          priority: article.priority
        })),
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'mistral-ai-financial-advisor',
          articlesAnalyzed: premiumArticles.length,
          premiumSources: [...new Set(premiumArticles.map(a => a.source))],
          analysisType: 'daily-market-brief',
          currentEvents: true,
          date: new Date().toLocaleDateString()
        }
      };

      console.log('✅ Real current events AI analysis generated successfully');
      return analysisResult;

    } catch (error) {
      console.error('❌ Error generating current events AI analysis:', error);
      throw new Error(`Daily AI brief failed: ${error.message}`);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      mistralStatus: mistralService.getStatus(),
      newsServiceStatus: premiumNewsService.getStatus(),
      lastAnalysis: new Date().toISOString(),
      analysisType: 'daily-current-events-brief'
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      await premiumNewsService.cleanup();
      this.isInitialized = false;
      console.log('🧹 AI analysis service cleaned up');
    } catch (error) {
      console.error('Error cleaning up AI analysis service:', error);
    }
  }
}

export default new RealAiAnalysisService();
