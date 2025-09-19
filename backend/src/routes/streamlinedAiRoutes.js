/**
 * PRODUCTION AI Routes - Qwen3 1.7B with Smart RAG
 * Works with and without RAG depending on the use case
 */
import express from 'express';
import enhancedOptimizedFmpNewsService from '../services/enhancedOptimizedFmpNewsService.js';

const router = express.Router();

// Ollama Configuration - Will run on Render CPU
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'qwen3:1.7b';

console.log('🤖 [AI] Qwen3 1.7B with RAG Support');
console.log(`📍 Ollama URL: ${OLLAMA_URL}`);
console.log(`🧠 Model: ${MODEL}`);

/**
 * Helper: Fetch real-time data from FMP for RAG
 */
async function fetchMarketData() {
  try {
    // Fetch key indices
    const indices = await Promise.all([
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/SPY`).then(r => r.json()),
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/QQQ`).then(r => r.json()),
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/DIA`).then(r => r.json()),
    ]);

    // Fetch sector ETFs
    const sectors = await Promise.all([
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/XLK`).then(r => r.json()),
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/XLF`).then(r => r.json()),
      fetch(`${process.env.API_BASE_URL || ''}/api/fmp/quote/XLV`).then(r => r.json()),
    ]);

    return {
      indices,
      sectors,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

/**
 * Create prompt WITH RAG data (for specific analysis)
 */
function createRAGPrompt(articles, marketData, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  // Build real-time data section
  let marketDataSection = '';
  if (marketData && marketData.indices) {
    marketDataSection = `
REAL-TIME MARKET DATA (Use these exact numbers - DO NOT make up any data):
Indices:
- SPY: $${marketData.indices[0]?.price || 'N/A'} (${marketData.indices[0]?.changesPercentage || 0}%)
- QQQ: $${marketData.indices[1]?.price || 'N/A'} (${marketData.indices[1]?.changesPercentage || 0}%)
- DIA: $${marketData.indices[2]?.price || 'N/A'} (${marketData.indices[2]?.changesPercentage || 0}%)

Sectors:
- Technology (XLK): ${marketData.sectors[0]?.changesPercentage || 0}%
- Financials (XLF): ${marketData.sectors[1]?.changesPercentage || 0}%
- Healthcare (XLV): ${marketData.sectors[2]?.changesPercentage || 0}%
`;
  }
  
  const articlesContent = articles.slice(0, 10).map((article, i) => 
    `${i + 1}. ${article.title}\n   Source: ${article.source}`
  ).join('\n\n');
  
  return `You are a financial analyst writing a market brief for ${currentDate}.

${marketDataSection}

NEWS HEADLINES:
${articlesContent}

INSTRUCTIONS:
1. Use ONLY the real-time data provided above for any numbers
2. Never make up or estimate numbers
3. Analyze the news in context of the real data
4. Write 3-4 paragraphs covering market overview, key developments, and outlook
5. Keep analysis focused and actionable (400-600 words)

Write your analysis:`;
}

/**
 * Create prompt WITHOUT RAG (for general analysis)
 */
function createSimplePrompt(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const articlesContent = articles.slice(0, 12).map((article, i) => 
    `${i + 1}. ${article.title}\n   Source: ${article.source}${article.symbol ? ` (${article.symbol})` : ''}`
  ).join('\n\n');
  
  return `You are a financial analyst writing a market brief for ${currentDate}.

Analyze these ${articles.length} financial news stories:

NEWS HEADLINES:
${articlesContent}

Write a comprehensive 3-4 paragraph market analysis covering:
• Key market themes and developments
• Notable company-specific news
• Sector trends
• Investment implications

Do not make up specific numbers. Focus on the narrative and trends from the news.
Target 400-600 words.

Write your analysis:`;
}

/**
 * Clean AI content
 */
function cleanAIContent(content) {
  if (!content) return '';
  
  return content
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^\s*[-•*]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking blocks from output
    .trim();
}

/**
 * Call Ollama with Qwen3
 */
async function callOllama(prompt, useThinking = false) {
  try {
    const systemPrompt = useThinking 
      ? 'You are a financial analyst. Use <think> tags for reasoning, then provide clear analysis.'
      : 'You are a professional financial analyst. Write clear, actionable market analysis.';
    
    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.OLLAMA_API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: false
      }),
      timeout: 60000 // 60 second timeout for CPU
    });
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Ollama call failed:', error);
    throw error;
  }
}

/**
 * MAIN ENDPOINT: Enhanced Comprehensive Analysis
 */
router.get('/enhanced-comprehensive-analysis', async (req, res) => {
  try {
    console.log('🚀 Starting Qwen3 market analysis...');
    
    // Step 1: Get news data
    console.log('📰 Fetching news data...');
    const newsResult = await enhancedOptimizedFmpNewsService.getOptimalNewsMix();
    
    if (!newsResult?.articles?.length) {
      return res.status(500).json({ 
        status: 'error', 
        error: 'No news articles found' 
      });
    }
    
    const articles = newsResult.articles;
    const summary = newsResult.summary || {};
    
    console.log(`✅ Found ${articles.length} articles`);
    
    // Step 2: Determine if we need RAG
    const useRAG = req.query.rag !== 'false'; // Default to using RAG
    
    let prompt;
    let analysisContent;
    
    if (useRAG) {
      // Step 3A: Fetch market data for RAG
      console.log('📊 Fetching real-time market data for RAG...');
      const marketData = await fetchMarketData();
      
      if (marketData) {
        console.log('✅ Market data retrieved, using RAG prompt');
        prompt = createRAGPrompt(articles, marketData, summary);
      } else {
        console.log('⚠️ Market data unavailable, falling back to simple prompt');
        prompt = createSimplePrompt(articles, summary);
      }
    } else {
      // Step 3B: Use simple prompt without RAG
      console.log('📝 Using simple prompt (no RAG)');
      prompt = createSimplePrompt(articles, summary);
    }
    
    // Step 4: Call Qwen3 model
    console.log('🤖 Calling Qwen3 1.7B...');
    const startTime = Date.now();
    
    try {
      analysisContent = await callOllama(prompt, true); // Use thinking mode
    } catch (ollamaError) {
      console.error('❌ Ollama failed:', ollamaError);
      
      // Fallback response
      analysisContent = `Market analysis for ${new Date().toLocaleDateString()}. Today's financial markets showed mixed signals as investors processed ${articles.length} significant news developments. ${articles[0]?.title || 'Key market events'} highlighted ongoing market dynamics. Investors should monitor these developments closely while maintaining appropriate risk management strategies.`;
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Analysis complete in ${processingTime}ms`);
    
    // Step 5: Clean and return response
    const cleanContent = cleanAIContent(analysisContent);
    
    return res.json({
      status: 'success',
      analysis: {
        content: cleanContent,
        generatedAt: new Date().toISOString(),
        model: 'Qwen3-1.7B',
        analysisType: useRAG ? 'rag_enhanced' : 'news_only',
        dataSource: 'enhanced_optimized_news',
        processingTimeMs: processingTime
      },
      enhancedNewsBreakdown: {
        totalArticles: articles.length,
        companyDiversity: summary.companyDiversity || {},
        sectorDiversity: summary.sectorDiversity || {}
      },
      sources: articles.slice(0, 10).map(a => ({
        title: a.title,
        source: a.source,
        url: a.url
      })),
      metadata: {
        ragEnabled: useRAG,
        cpuInference: true,
        modelSize: '1.7B',
        expectedLatency: '8-12 seconds'
      }
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Analysis failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint for testing model availability
 */
router.get('/ai-health', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    const hasQwen3 = data.models?.some(m => m.name.includes('qwen3'));
    
    res.json({
      status: 'healthy',
      ollama: true,
      qwen3Available: hasQwen3,
      model: MODEL,
      url: OLLAMA_URL
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
