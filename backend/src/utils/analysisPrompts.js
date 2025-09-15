/**
 * Helper: Create structured analysis prompt for Mistral
 * Generates content with clear topic structure for frontend formatting
 */
function createUltraCleanAnalysisPrompt(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const articlesContent = articles.slice(0, 15).map((article, i) => 
    `${i + 1}. ${article.title}\n   Source: ${article.source}\n   ${(article.description || '').substring(0, 200)}...`
  ).join('\n\n');
  
  return `You are a senior financial analyst writing a Daily Market Brief for ${currentDate}.

I'm providing you with ${articles.length} carefully curated financial news articles from premium financial sources.

NEWS ARTICLES:

${articlesContent}

YOUR TASK:
Write a comprehensive market analysis in clean, readable format with clear topic structure.

CRITICAL FORMATTING REQUIREMENTS:

1. STRUCTURE: Write 4-5 clear topics, each starting with a topic sentence
2. PLAIN TEXT ONLY: No *, #, _, \`, <, >, [, ], | symbols anywhere
3. TOPIC FORMAT: Start each topic with a clear topic sentence, then 2-3 supporting sentences
4. PARAGRAPH BREAKS: Separate each topic with a double line break

SUGGESTED TOPICS TO COVER:
- Market Performance: Overall market movements and key indices
- Company Developments: Significant corporate news and earnings
- Economic Factors: Policy changes, economic indicators, Fed decisions  
- Sector Analysis: Which industries are outperforming or underperforming
- Investment Outlook: Forward-looking perspective and key risks/opportunities

EXAMPLE STRUCTURE:
Markets showed strong performance today with major indices reaching new highs. The S&P 500 gained 1.2 percent while the Nasdaq rose 1.8 percent, driven by strong earnings from technology companies.

Corporate earnings continue to exceed expectations across multiple sectors. Apple reported quarterly revenue of 85 billion dollars, beating analyst estimates by 3 percent. Microsoft also posted strong results with cloud revenue growing 25 percent year over year.

Federal Reserve policy remains a key focus for investors as inflation data shows signs of cooling. The latest CPI reading came in at 3.1 percent, down from 3.4 percent last month, giving the Fed more flexibility in future rate decisions.

Write 500-700 words following this exact structure. No special formatting symbols.

Begin your market analysis:`;
}

/**
 * Helper: Create structured fallback analysis 
 */
function createUltraCleanFallbackAnalysis(articles, summary) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const companyDiversity = summary.companyDiversity || { uniqueCompanies: 0 };
  const sectorDiversity = summary.sectorDiversity || { sectorsRepresented: 0 };
  const breakdown = summary.breakdown || {};
  
  const topArticles = articles.slice(0, 3);
  const companies = articles.filter(a => a.symbol).map(a => a.symbol).slice(0, 3);
  
  const fallbackContent = `Market Performance Summary for ${currentDate}

Global financial markets displayed mixed trading patterns today as investors processed a combination of corporate earnings announcements, economic policy updates, and sector-specific developments. Major indices showed varied performance with technology and healthcare sectors leading gains while energy and financial services faced headwinds.

Corporate Earnings and Company Developments

${topArticles.map(article => article.title.replace(/[#*_`<>\[\]|]/g, '')).slice(0, 2).join('. ')}. Companies across ${sectorDiversity.sectorsRepresented} different sectors reported quarterly results, with ${companyDiversity.uniqueCompanies} unique companies making significant announcements that could impact broader market sentiment.

Economic Environment and Policy Factors

Federal Reserve monetary policy continues to influence market dynamics as investors monitor inflation trends and employment data. Recent economic indicators suggest a balanced approach to growth management, with particular attention to international trade relationships and domestic spending patterns affecting various industry sectors.

Sector Analysis and Investment Themes

${companies.length > 0 ? `Key companies including ${companies.join(', ')} are navigating challenges specific to their industries while pursuing growth opportunities in emerging markets and technological innovation.` : 'Multiple companies across various sectors are reporting developments that reflect broader economic trends and competitive positioning.'} This diversification provides insights into consumer behavior, business investment patterns, and regulatory changes.

Investment Outlook and Market Considerations

Looking forward, market participants should monitor corporate guidance revisions, regulatory policy announcements, and international economic developments that could influence trading volumes and sector rotation patterns. The current environment presents both growth opportunities and risk factors that require careful analysis of individual company fundamentals alongside broader economic indicators.

${breakdown.socialSentiment > 0 ? 'Market sentiment indicators suggest evolving investor perspectives on specific sectors and asset classes, providing additional context for understanding price movements and trading patterns.' : 'Investor sentiment continues to be shaped by earnings quality, management guidance, and macroeconomic data releases that provide insights into future market direction.'}`;

  return ultraAggressiveCleanAIContent(fallbackContent);
}
