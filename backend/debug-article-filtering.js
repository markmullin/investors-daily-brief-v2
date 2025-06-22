/**
 * DEBUG TEST - Find out exactly why we're only getting 2 articles
 */
import 'dotenv/config';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';

async function debugArticleFiltering() {
  console.log('🔍 DEBUG TEST: Article Filtering Analysis');
  console.log('Finding out exactly why MarketWatch articles disappear...');
  console.log('=' .repeat(70));
  
  try {
    const newsResult = await premiumFmpNewsService.getPremiumFinancialNews();
    
    console.log('\n🔍 DEBUG SUMMARY:');
    console.log(`Final articles: ${newsResult.articles.length}`);
    console.log(`Target: 5 articles`);
    console.log(`Sources found: ${[...new Set(newsResult.articles.map(a => a.source))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

debugArticleFiltering().catch(console.error);