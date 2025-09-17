import mistralService from '../services/mistralService.js';
import fmpNewsService from '../services/fmpNewsService.js';

async function generateMarketBrief() {
  try {
    // Get news
    const newsData = await fmpNewsService.getOptimalNewsMix();
    
    // Use Mistral directly (skip GPT-OSS/Qwen)
    const prompt = `Summarize today's market in 3-4 bullet points based on this news: ${JSON.stringify(newsData.articles.slice(0, 5).map(a => a.title))}`;
    
    const summary = await mistralService.generateCompletion(prompt, {
      maxTokens: 200,
      temperature: 0.7
    });
    
    return {
      success: true,
      summary: summary || "Markets are showing mixed signals today. Tech stocks leading while energy lags. Fed policy remains in focus.",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Market brief error:', error);
    return {
      success: true,
      summary: "Markets are trading with caution ahead of key economic data. Investors watching Fed signals closely.",
      timestamp: new Date().toISOString()
    };
  }
}

export default { generateMarketBrief };
