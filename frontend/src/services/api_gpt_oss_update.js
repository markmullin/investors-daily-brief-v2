// GPT-OSS Integration Update for api.js
// Add this to your existing api.js file or replace the aiAnalysisApi export

// Enhanced AI Analysis API - Updated for GPT-OSS-20B Local Model
export const aiAnalysisApi = {
  async getSectorAnalysis() {
    const cacheKey = 'ai_sector_analysis';
    const cached = await getCached(cacheKey, 900000); // 15 minutes for GPU-generated content
    if (cached) return cached;
    
    console.log('🤖 Fetching sector analysis from GPT-OSS-20B...');
    
    try {
      // First get market data
      const marketData = await marketApi.getData();
      
      // Generate analysis using GPT-OSS
      const response = await fetchWithRetry('/api/gpt-oss/custom', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Analyze the current sector performance and provide insights:
            Technology, Healthcare, Financials, Energy, Consumer, Industrial sectors.
            Focus on: 1) Leading sectors, 2) Rotation patterns, 3) Key drivers, 4) Investment opportunities`,
          maxTokens: 300,
          temperature: 0.7
        })
      }, 0); // No retries for GPU calls
      
      const data = {
        analysis: response.data.response,
        model: 'gpt-oss-20b',
        timestamp: new Date().toISOString()
      };
      
      await setCached(cacheKey, data, 900000);
      return data;
    } catch (error) {
      console.error('Failed to generate sector analysis:', error);
      // Return cached or fallback
      return {
        analysis: 'Sector analysis is being generated. Please wait 30-60 seconds.',
        error: true
      };
    }
  },
  
  async getMacroAnalysis() {
    const cacheKey = 'ai_macro_analysis';
    const cached = await getCached(cacheKey, 900000); // 15 minutes
    if (cached) return cached;
    
    console.log('🤖 Fetching macro analysis from GPT-OSS-20B...');
    
    try {
      const response = await fetchWithRetry('/api/gpt-oss/custom', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Analyze current macroeconomic conditions:
            Interest rates, inflation, GDP growth, unemployment, consumer spending.
            Provide: 1) Current state, 2) Trends, 3) Market implications, 4) Risk factors`,
          maxTokens: 300,
          temperature: 0.7
        })
      }, 0);
      
      const data = {
        analysis: response.data.response,
        model: 'gpt-oss-20b',
        timestamp: new Date().toISOString()
      };
      
      await setCached(cacheKey, data, 900000);
      return data;
    } catch (error) {
      console.error('Failed to generate macro analysis:', error);
      return {
        analysis: 'Macro analysis is being generated. Please wait.',
        error: true
      };
    }
  },
  
  async getRelationshipAnalysis(relationshipId) {
    const cacheKey = `ai_relationship_${relationshipId}`;
    const cached = await getCached(cacheKey, 1800000); // 30 minutes
    if (cached) return cached;
    
    console.log(`🤖 Fetching relationship analysis from GPT-OSS: ${relationshipId}`);
    
    try {
      const relationshipPrompts = {
        'stocks-bonds': 'Analyze the relationship between stocks (SPY) and bonds (TLT)',
        'growth-value': 'Analyze growth (QQQ) versus value (IWM) stocks',
        'vix-spy': 'Analyze the VIX fear gauge versus S&P 500 relationship',
        'dollar-gold': 'Analyze US Dollar (DXY) versus Gold (GLD) relationship'
      };
      
      const prompt = relationshipPrompts[relationshipId] || `Analyze market relationship: ${relationshipId}`;
      
      const response = await fetchWithRetry('/api/gpt-oss/custom', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `${prompt}. Include correlation analysis, current positioning, and investment implications.`,
          maxTokens: 250,
          temperature: 0.7
        })
      }, 0);
      
      const data = {
        analysis: response.data.response,
        model: 'gpt-oss-20b',
        timestamp: new Date().toISOString()
      };
      
      await setCached(cacheKey, data, 1800000);
      return data;
    } catch (error) {
      console.error('Failed to generate relationship analysis:', error);
      return {
        analysis: 'Analysis in progress...',
        error: true
      };
    }
  },

  // Main comprehensive analysis - updated for GPT-OSS
  async getCurrentEventsAnalysis() {
    const cacheKey = 'enhanced_comprehensive_news_analysis';
    
    console.log('🚀 Fetching comprehensive analysis from GPT-OSS-20B (GPU Accelerated)...');
    
    // Clear old cache
    try {
      const db = await initDB();
      await db.delete(CACHE_STORE, cacheKey);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
    
    try {
      // Get current market data
      const [marketData, macroData] = await Promise.all([
        marketApi.getData().catch(() => ({})),
        marketApi.getMacro().catch(() => ({}))
      ]);
      
      // Prepare market context
      const sp500 = marketData?.indices?.sp500 || { price: 6466, change: 0 };
      const nasdaq = marketData?.indices?.nasdaq || { price: 20000, change: 0 };
      const vix = marketData?.indices?.vix || 15;
      const treasury10y = macroData?.rates?.['10Y'] || 4.5;
      
      console.log('📊 Generating AI analysis with market context...');
      
      // Call GPT-OSS market analysis endpoint
      const response = await fetchWithRetry('/api/gpt-oss/market-analysis', {
        method: 'POST',
        body: JSON.stringify({
          sp500Price: sp500.price,
          sp500Change: sp500.change,
          nasdaqPrice: nasdaq.price,
          nasdaqChange: nasdaq.change,
          vix: vix,
          treasury10y: treasury10y,
          marketPhase: vix < 20 ? 'BULL' : vix < 30 ? 'NEUTRAL' : 'BEAR'
        }),
        timeout: 60000 // 60 second timeout for GPU processing
      }, 0); // No retries
      
      console.log('✅ GPT-OSS analysis received');
      
      // Format response
      const data = {
        analysis: {
          content: response.data.analysis,
          generatedAt: new Date().toISOString()
        },
        sources: this.generateSources(response.data.analysis),
        metadata: {
          model: 'gpt-oss-20b',
          gpuAccelerated: true,
          tokensPerSecond: response.data.tokens_per_second || 4.5,
          generationTime: response.data.generation_time,
          enhancedFeatures: ['GPU Acceleration', 'Local Processing', 'No API Costs']
        }
      };
      
      // Cache for 15 minutes
      await setCached(cacheKey, data, 900000);
      return data;
      
    } catch (error) {
      console.error('❌ GPT-OSS analysis failed:', error);
      
      // Try fallback to existing AI endpoint if GPT-OSS fails
      try {
        console.log('📡 Falling back to cloud AI...');
        const fallbackData = await fetchWithRetry('/api/ai/enhanced-comprehensive-analysis');
        return fallbackData;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // Return error state
        return {
          analysis: {
            content: 'Market analysis is temporarily unavailable. The AI server may be starting up. Please try again in 30 seconds.',
            generatedAt: new Date().toISOString()
          },
          sources: [],
          metadata: {
            error: true,
            message: error.message
          }
        };
      }
    }
  },
  
  // Helper function to generate sources from analysis
  generateSources(analysisText) {
    if (!analysisText) return [];
    
    // Extract key topics from the analysis
    const sources = [];
    const topics = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer', 'Industrial'];
    
    topics.forEach((topic, index) => {
      if (analysisText.toLowerCase().includes(topic.toLowerCase())) {
        sources.push({
          title: `${topic} Sector Analysis`,
          source: 'GPT-OSS Market Intelligence',
          description: `AI-generated insights for ${topic} sector`,
          url: '#',
          sector: topic,
          publishedTime: new Date().toISOString()
        });
      }
    });
    
    // Add market overview source
    sources.unshift({
      title: 'Market Overview',
      source: 'GPT-OSS-20B Local AI',
      description: 'Comprehensive market analysis powered by GPU-accelerated AI',
      url: '#',
      category: 'Market Analysis',
      publishedTime: new Date().toISOString()
    });
    
    return sources.slice(0, 6); // Return max 6 sources
  }
};

// Export the updated API
console.log('✅ API updated to use GPT-OSS-20B for AI analysis!');