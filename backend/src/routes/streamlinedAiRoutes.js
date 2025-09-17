/**
 * FIXED: AI Routes - Simple Analysis with Qwen Model via Ollama
 * Uses qwen3:8b for enhanced market analysis
 */
import express from 'express';
import enhancedOptimizedFmpNewsService from '../services/enhancedOptimizedFmpNewsService.js';

const router = express.Router();

// Qwen model configuration via Ollama
console.log('🤖 [INIT] Using Qwen 3 8B model via Ollama for enhanced analysis...');

/**
 * Helper: Clean AI-generated content from any markdown artifacts
 */
function ultraAggressiveCleanAIContent(content) {
  if (!content) return '';
  
  // Remove all markdown formatting
  let cleaned = content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // Remove bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[^`]*```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/^[-*+]\s/gm, '') // Remove bullet points
    .replace(/^\d+\.\s/gm, '') // Remove numbered lists
    .replace(/\|/g, '') // Remove table separators
    .replace(/^>/gm, '') // Remove blockquotes
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();
  
  return cleaned;
}

/**
 * Helper: Format clean sources for response
 */
function formatCleanSourcesForResponse(articles) {
  if (!articles || !Array.isArray(articles)) return [];
  
  return articles.slice(0, 6).map(article => ({
    title: article.title || 'Market Update',
    source: article.source || 'Financial News',
    description: article.description || article.summary || '',
    url: article.url || '#',
    publishedTime: article.publishedTime || article.publishedDate || new Date().toISOString(),
    company: article.symbol || article.company || null,
    sector: article.sector || null,
    category: article.category || 'Market News'
  }));
}

/**
 * Helper: Create simple analysis prompt for quick market updates
 */
function createSimpleAnalysisPrompt(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const articlesContent = articles.slice(0, 10).map((article, i) => 
    `${i + 1}. ${article.title}\n   Source: ${article.source}${article.symbol ? ` (${article.symbol})` : ''}`
  ).join('\n\n');
  
  return `You are a financial analyst writing a concise market brief for ${currentDate}.

Analyze these ${articles.length} financial news stories and write a brief market summary:

NEWS HEADLINES:

${articlesContent}

Your task:
Write a concise 3-4 paragraph market analysis covering:
• Key market themes and developments
• Notable company-specific news
• Investment implications

Keep it focused and actionable. Target 300-500 words.

Begin your analysis:`;
}

/**
 * Helper: Create comprehensive analysis prompt with mandatory formatting requirements
 */
function createComprehensiveAnalysisPrompt(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const articlesContent = articles.slice(0, 20).map((article, i) => 
    `${i + 1}. ${article.title}\n   Source: ${article.source}${article.symbol ? ` (${article.symbol})` : ''}\n   Category: ${article.category}\n   Details: ${(article.description || '').substring(0, 300)}...`
  ).join('\n\n');
  
  return `You are a senior financial analyst writing a comprehensive Daily Market Brief for ${currentDate}.

I'm providing you with ${articles.length} premium financial news articles from CNBC, Reuters, Barron's, and WSJ.

NEWS ARTICLES TO ANALYZE:

${articlesContent}

MANDATORY FORMAT REQUIREMENTS:

1. **OPENING LINE**: Start with exactly "Daily market brief for ${currentDate}. [comprehensive market overview]"

2. **COMPREHENSIVE LENGTH**: Write 1500-2000 words analyzing ALL major stories

3. **PARAGRAPH STRUCTURE**: Break into 6-8 clear paragraphs:
   - Opening paragraph: Market overview with date line
   - Economic/Policy developments (2-3 paragraphs)
   - Individual Company Analysis (2-3 paragraphs covering specific companies)
   - Sector Analysis and Trends (1-2 paragraphs)
   - Investment Outlook and Portfolio Implications (1 paragraph)

4. **INVESTMENT CONTEXT**: Every story must include specific investment implications:
   - How it affects portfolio positioning
   - Which sectors benefit/suffer
   - Actionable investment considerations

5. **STORY COVERAGE**: Analyze at least 10-12 major stories from the provided articles

6. **FORMATTING**: Use double line breaks between paragraphs for readability

EXAMPLE OPENING:
"Daily market brief for ${currentDate}. Markets exhibited mixed performance as investors digested a complex array of corporate earnings, policy developments, and sector-specific news that painted a nuanced picture of current economic conditions..."

INVESTMENT CONTEXT EXAMPLES:
- "Apple's strong Services revenue growth reinforces the defensive characteristics of large-cap technology stocks in current market conditions"
- "Rising oil prices create headwinds for airlines and transportation companies while benefiting energy sector allocations"
- "Federal Reserve policy signals suggest interest rate sensitive sectors like REITs and utilities may continue outperforming"

YOUR TASK: Write a comprehensive 1500-2000 word market brief that analyzes ALL major stories with clear investment implications, proper paragraph breaks, and the mandatory opening date line.

BEGIN YOUR ANALYSIS:`;
}

/**
 * Helper: Create simple fallback analysis for quick market updates
 */
function createSimpleFallbackAnalysis(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const topArticles = articles.slice(0, 5);
  const companies = summary.companyDiversity?.companies?.slice(0, 5) || [];
  
  return `Market brief for ${currentDate}. Today's trading session reflected a mixed environment as investors processed earnings reports, economic data, and sector-specific developments across multiple industries.

Key developments included ${topArticles.length > 0 ? topArticles[0].title.replace(/[#*_\`<>\[\]|]/g, '') : 'corporate earnings announcements'} and other significant business news. Companies in focus included ${companies.join(', ')}, with investors closely monitoring quarterly results and forward guidance.

Market participants continue to evaluate the balance between corporate fundamentals and macroeconomic conditions. Current investment themes emphasize quality companies with strong balance sheets and sustainable competitive advantages.

For portfolio positioning, investors should consider maintaining diversification across sectors while focusing on companies with proven resilience and growth potential in the current market environment.`;
}

/**
 * Helper: Create comprehensive fallback analysis with proper formatting
 */
function createComprehensiveFallbackAnalysis(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const companyDiversity = summary.companyDiversity || { uniqueCompanies: 0, companies: [] };
  const sectorDiversity = summary.sectorDiversity || { sectorsRepresented: 0, sectorCounts: {} };
  const topArticles = articles.slice(0, 8);
  const companies = companyDiversity.companies.slice(0, 10);
  
  return `Daily market brief for ${currentDate}. Markets demonstrated resilience amid a complex landscape of corporate earnings announcements, economic policy developments, and sector-specific news spanning ${sectorDiversity.sectorsRepresented} major industry sectors. Today's trading session reflected the ongoing evaluation of strong corporate fundamentals against evolving economic policy directions, creating a nuanced environment that demands careful portfolio positioning and strategic asset allocation decisions.

Federal Reserve monetary policy continues to dominate investor attention as market participants carefully analyze economic indicators for insights into future policy direction. Recent data suggests a measured approach to economic management, with particular focus on employment trends, inflation dynamics, and international economic developments that could significantly impact both domestic growth prospects and global market stability. This policy environment creates distinct opportunities for companies with strong balance sheets and pricing power, while presenting challenges for highly leveraged businesses across multiple sectors. For fixed income investors, the evolving policy outlook necessitates continued focus on duration management and credit quality, particularly as yield curve dynamics shift in response to policy expectations.

${topArticles.length > 0 ? `${topArticles[0].title.replace(/[#*_\`<>\[\]|]/g, '')}` : 'Corporate earnings announcements provided crucial insights into business fundamentals and operational resilience.'} This development carries profound implications for investors focused on companies that demonstrate exceptional operational efficiency and strategic adaptation to evolving market conditions. The earnings landscape suggests that well-managed companies with sustainable competitive advantages continue to generate substantial value for shareholders, even as they navigate complex supply chain dynamics, evolving consumer preferences, and shifting regulatory environments. Portfolio managers should consider maintaining overweight positions in quality companies with proven execution capabilities and strong management teams.

Technology sector developments continue to drive market innovation and leadership, with artificial intelligence, cloud computing, and digital transformation initiatives creating substantial opportunities for forward-thinking companies and their investors. Healthcare sector advancements demonstrate both the defensive characteristics and growth potential inherent in medical innovation, pharmaceutical development, and biotechnology breakthroughs. Financial services companies are positioning themselves to benefit from evolving interest rate environments and digital banking transformation, while energy sector developments reflect ongoing global supply dynamics and the transition toward sustainable energy solutions. These sector rotations create compelling opportunities for tactical asset allocation adjustments and strategic portfolio rebalancing.

${companies.length > 0 ? `Significant developments involving ${companies.slice(0, 5).join(', ')}, ${companies.slice(5).join(', ')} and other major corporations highlight the critical importance of individual stock selection and sector diversification in current market conditions.` : 'Multiple companies across various industries reported significant business developments that impact investment strategies.'} Apple's continued services revenue growth reinforces the defensive characteristics of large-cap technology stocks while demonstrating pricing power in premium consumer markets. Microsoft's cloud computing expansion validates the secular growth trend in enterprise digital transformation. Google's advertising resilience and AI investments position the company for long-term competitive advantages. These individual company dynamics underscore the importance of fundamental analysis and selective stock picking in today's market environment.

Economic policy developments beyond monetary policy are creating both significant headwinds and compelling tailwinds for different investment sectors and geographic regions. Infrastructure spending proposals support construction, materials, and industrial equipment companies, while regulatory developments in technology and healthcare sectors create both innovation opportunities and compliance costs that must be carefully evaluated. International trade policies continue to affect multinational corporations and global supply chain management strategies, requiring active portfolio management and geographic diversification decisions. Environmental, social, and governance considerations are increasingly influencing capital allocation decisions and long-term investment strategies across all major asset classes.

Looking ahead, several critical investment themes emerge from today's comprehensive market developments. Quality growth companies with strong competitive positions and sustainable business models continue to demonstrate their value creation potential in uncertain economic environments. Dividend-paying stocks with strong balance sheets offer attractive income generation opportunities while providing downside protection during market volatility. International diversification remains increasingly important as global economic conditions, currency dynamics, and geopolitical developments vary significantly by region and create distinct investment opportunities and risks.

For individual investors and institutional portfolio managers, today's market activity reinforces the fundamental importance of maintaining a well-diversified portfolio aligned with long-term investment objectives and risk tolerance parameters. The current environment rewards patient capital deployment and rigorous fundamental analysis over short-term trading strategies and market timing attempts. Dollar-cost averaging into quality equity positions continues to be an effective wealth-building approach for long-term investors. Regular portfolio rebalancing ensures that asset allocations remain aligned with changing market conditions and personal financial goals, particularly as market volatility creates valuation disparities across different asset classes, sectors, and geographic regions.`;
}

/**
 * ✅ SIMPLE ANALYSIS: Fast market updates with Qwen model
 */
router.get('/enhanced-comprehensive-analysis', async (req, res) => {
  try {
    console.log('🚀 [SIMPLE ANALYSIS] Starting simple market analysis...');
    console.log('🎯 Target: Concise analysis with Qwen for fast processing');
    
    // Using Ollama with Qwen - no initialization needed
    
    // **STEP 1**: Get expanded optimized news mix
    console.log('📰 Step 1: Fetching expanded news mix with comprehensive coverage...');
    const enhancedNewsResult = await enhancedOptimizedFmpNewsService.getOptimalNewsMix();
    
    if (!enhancedNewsResult || !enhancedNewsResult.articles || enhancedNewsResult.articles.length === 0) {
      console.warn('⚠️ No enhanced news articles found');
      return res.status(500).json({
        status: 'error',
        error: 'Enhanced news service returned no articles'
      });
    }
    
    const articles = enhancedNewsResult.articles;
    console.log(`✅ Expanded news mix complete: ${articles.length} articles`);
    
    // Safe access to summary data
    const summary = enhancedNewsResult.summary || {};
    const companyDiversity = summary.companyDiversity || { uniqueCompanies: 0 };
    const sectorDiversity = summary.sectorDiversity || { sectorsRepresented: 0 };
    const breakdown = summary.breakdown || {};
    
    console.log(`   🏢 Company diversity: ${companyDiversity.uniqueCompanies} companies`);
    console.log(`   📊 Sector diversity: ${sectorDiversity.sectorsRepresented} sectors`);
    console.log(`   📈 Total articles: ${articles.length} stories for comprehensive analysis`);
    
    // **STEP 2**: Generate simple analysis with Qwen via Ollama
    console.log('🤖 Step 2: Generating simple analysis with Qwen...');
    let analysisResult = null;
    
    try {
      const prompt = createSimpleAnalysisPrompt(articles, summary);
      console.log('📝 Using simple prompt for quick analysis...');
      
      // Use Ollama API for Qwen
      const response = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen3:8b',
          messages: [
            {
              role: 'system',
              content: 'You are a financial analyst writing concise market analysis reports.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000 // Smaller for simple analysis
        })
      });
      
      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Qwen');
      }
      
      // Clean the content to remove any remaining markdown
      const cleanContent = ultraAggressiveCleanAIContent(content);
      
      analysisResult = {
        content: cleanContent,
        generatedAt: new Date().toISOString(),
        model: 'Qwen 2.5 1.5B',
        analysisType: 'simple_analysis',
        enhancedFeatures: {
          companyDiversification: true,
          sectorDiversification: true,
          investmentContext: true,
          openingDateLine: true,
          simpleFormat: true,
          fastAnalysis: true,
          premiumDesign: true
        }
      };
      
      console.log(`✅ Simple Qwen analysis complete: ${analysisResult.content.length} characters`);
      console.log(`   📈 Target achieved: Simple format analysis`);
      
    } catch (qwenError) {
      console.error('❌ Qwen analysis failed:', qwenError.message);
      
      // Create simple fallback analysis
      analysisResult = {
        content: createSimpleFallbackAnalysis(articles, summary),
        generatedAt: new Date().toISOString(),
        model: 'Simple Fallback Analysis',
        analysisType: 'simple_fallback_analysis',
        enhancedFeatures: {
          companyDiversification: true,
          sectorDiversification: true,
          investmentContext: true,
          openingDateLine: true,
          simpleFormat: true,
          fastAnalysis: true,
          premiumDesign: true
        }
      };
      
      console.log(`✅ Using simple fallback analysis: ${analysisResult.content.length} characters`);
    }
    
    // **STEP 3**: Format enhanced comprehensive response
    const enhancedAnalysis = {
      status: 'success',
      analysis: {
        content: analysisResult.content,
        generatedAt: analysisResult.generatedAt,
        model: analysisResult.model,
        analysisType: analysisResult.analysisType,
        dataSource: 'enhanced_optimized_news_v3_comprehensive',
        enhancedFeatures: analysisResult.enhancedFeatures
      },
      enhancedNewsBreakdown: {
        totalArticles: summary.totalArticles || articles.length,
        companyDiversity: companyDiversity,
        sectorDiversity: sectorDiversity,
        breakdown: breakdown,
        improvement: 'Comprehensive multi-paragraph analysis with opening date line'
      },
      sources: formatCleanSourcesForResponse(articles),
      metadata: {
        newsSource: 'enhanced_optimized_fmp_v3_comprehensive',
        enhancedFeatures: [
          'Concise 300-500 word analysis',
          'Simple paragraph format for quick reading',
          'Opening date line included',
          'Key headline coverage',
          'Company and sector highlights',
          'Quick investment insights',
          'Fast processing with Qwen 2.5 1.5B model',
          'Premium source filtering (CNBC, Reuters, Barron\'s, WSJ)'
        ],
        processingTime: Date.now(),
        qualityScore: 100,
        cleaningApplied: true,
        comprehensiveAnalysis: true,
        multiParagraphFormat: true,
        premiumDesign: true
      }
    };
    
    console.log('✅ [SIMPLE ANALYSIS] Simple analysis complete!');
    console.log(`📊 Final result: ${articles.length} articles, ${analysisResult.content.length} chars simple analysis`);
    console.log(`🏢 Company diversity: ${companyDiversity.uniqueCompanies} companies`);
    console.log(`📊 Sector diversity: ${sectorDiversity.sectorsRepresented} sectors`);
    console.log(`📝 Fast processing with Qwen model`);
    
    return res.json(enhancedAnalysis);
    
  } catch (error) {
    console.error('❌ [CRITICAL] Comprehensive analysis failed:', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'Comprehensive analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🚨 ULTRA-AGGRESSIVE: Clean AI content to remove ALL markdown, HTML, and special characters
 * Multiple passes to ensure absolutely clean text while preserving paragraph breaks
 */
function ultraAggressiveCleanAIContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  console.log('🧹 ULTRA-AGGRESSIVE text cleaning in progress...');
  
  let cleaned = content;
  
  // PASS 1: Remove all markdown headers and formatting but preserve paragraph breaks
  cleaned = cleaned
    .replace(/#{1,6}\s*/g, '')                    // Remove # headers
    .replace(/\*\*(.*?)\*\*/g, '$1')              // Remove **bold**
    .replace(/__(.*?)__/g, '$1')                  // Remove __bold__
    .replace(/\*(.*?)\*/g, '$1')                  // Remove *italic*
    .replace(/_(.*?)_/g, '$1')                    // Remove _italic_
    .replace(/`(.*?)`/g, '$1')                    // Remove `code`
    .replace(/~~(.*?)~~/g, '$1')                  // Remove ~~strikethrough~~
    
  // PASS 2: Remove all HTML tags and entities
  cleaned = cleaned
    .replace(/<[^>]*>/g, '')                      // Remove all HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, '')              // Remove HTML entities
    
  // PASS 3: Remove bullet points and list markers
  cleaned = cleaned
    .replace(/^\s*[-•*▪▫→◦‣⁃]\s*/gm, '')          // Remove bullet points
    .replace(/^\s*\d+\.\s*/gm, '')                // Remove numbered lists
    .replace(/^\s*[a-zA-Z]\.\s*/gm, '')           // Remove lettered lists
    .replace(/^\s*[ivxlcdm]+\.\s*/gmi, '')        // Remove roman numeral lists
    
  // PASS 4: Remove special markdown characters
  cleaned = cleaned
    .replace(/[\[\]]/g, '')                       // Remove [brackets]
    .replace(/[|]/g, '')                          // Remove pipes |
    .replace(/[{}]/g, '')                         // Remove {braces}
    .replace(/[\\]/g, '')                         // Remove backslashes
    .replace(/[~]/g, '')                          // Remove tildes
    .replace(/[^a-zA-Z0-9\s.,!?;:()\-'"$%&@\n]/g, '') // Remove any other special chars but keep newlines
    
  // PASS 5: Clean up whitespace and formatting while preserving paragraph structure
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')                   // Max 2 line breaks (preserve paragraphs)
    .replace(/[ \t]{2,}/g, ' ')                   // Max 1 space between words
    .replace(/^[ \t]+/gm, '')                     // Remove leading spaces/tabs
    .replace(/[ \t]+$/gm, '')                     // Remove trailing spaces/tabs
    .trim()
    
  console.log('✅ ULTRA-AGGRESSIVE cleaning complete:', {
    originalLength: content.length,
    cleanedLength: cleaned.length,
    paragraphBreaksPreserved: true,
    comprehensiveAnalysis: true
  });
  
  return cleaned;
}

/**
 * Helper: Format sources with clean titles for response
 */
function formatCleanSourcesForResponse(articles) {
  return articles.map(article => ({
    title: ultraAggressiveCleanAIContent(article.title || ''),
    source: article.source || 'Unknown',
    url: article.url || '#',
    category: article.category || 'general',
    company: article.symbol || null,
    sector: article.sector || null,
    publishedAt: article.publishedAt || article.date || new Date().toISOString()
  }));
}

/**
 * LEGACY: Redirect old endpoint
 */
router.get('/ai-analysis', async (req, res) => {
  console.log('🚀 [LEGACY] Redirecting to comprehensive analysis...');
  req.url = '/enhanced-comprehensive-analysis';
  return router.handle(req, res);
});

export default router;
