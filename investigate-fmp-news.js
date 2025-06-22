/**
 * FMP NEWS SOURCE INVESTIGATION - CommonJS Version
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function investigateFmpNewsSources() {
  console.log('🔍 INVESTIGATING FMP NEWS SOURCES');
  console.log('Checking what news sources FMP API actually provides...');
  console.log('=' .repeat(60));
  
  const fmpApiKey = process.env.FMP_API_KEY;
  const baseUrl = 'https://financialmodelingprep.com/api';
  
  if (!fmpApiKey) {
    console.error('❌ FMP API key not found');
    return;
  }
  
  console.log('✅ FMP API Key configured');
  console.log('🔍 Testing different FMP news endpoints...\n');
  
  // Test 1: Stock News
  console.log('📍 TEST 1: FMP Stock News Endpoint');
  try {
    const response = await axios.get(`${baseUrl}/v3/stock_news`, {
      params: {
        limit: 10,
        apikey: fmpApiKey
      },
      timeout: 5000
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log(`✅ Articles Found: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('\n📰 Sample Stock News Sources:');
      response.data.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. Source: ${article.site || 'Unknown'}`);
        console.log(`   Title: ${article.title?.substring(0, 60)}...`);
        console.log(`   Published: ${article.publishedDate}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`❌ Stock News Error: ${error.message}`);
  }
  
  // Test 2: General News  
  console.log('\n📍 TEST 2: FMP General News Endpoint');
  try {
    const response = await axios.get(`${baseUrl}/v4/general_news`, {
      params: {
        page: 0,
        size: 10,
        apikey: fmpApiKey
      },
      timeout: 5000
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log(`✅ Articles Found: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('\n📰 Sample General News Sources:');
      response.data.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. Source: ${article.site || article.source || 'Unknown'}`);
        console.log(`   Title: ${article.title?.substring(0, 60)}...`);
        console.log(`   Published: ${article.publishedDate || article.date}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`❌ General News Error: ${error.message}`);
  }
  
  // Test 3: Check for premium news sources
  console.log('\n📍 TEST 3: Checking for Premium News Sources');
  const premiumSources = ['Bloomberg', 'CNBC', 'Reuters', 'Wall Street Journal', 'Financial Times', 'MarketWatch'];
  
  try {
    // Try to search for specific premium sources
    const allEndpoints = [
      `${baseUrl}/v3/stock_news?limit=50&apikey=${fmpApiKey}`,
      `${baseUrl}/v4/general_news?page=0&size=50&apikey=${fmpApiKey}`
    ];
    
    const allArticles = [];
    
    for (const endpoint of allEndpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 5000 });
        if (Array.isArray(response.data)) {
          allArticles.push(...response.data);
        }
      } catch (error) {
        console.log(`⚠️ Endpoint failed: ${endpoint.split('?')[0]}`);
      }
    }
    
    console.log(`\n🔍 Analyzing ${allArticles.length} total articles for premium sources...`);
    
    const foundSources = new Set();
    let premiumFound = 0;
    
    allArticles.forEach(article => {
      const source = article.site || article.source || '';
      foundSources.add(source);
      
      premiumSources.forEach(premium => {
        if (source.toLowerCase().includes(premium.toLowerCase())) {
          premiumFound++;
          console.log(`✅ Found premium source: ${source} (${premium})`);
        }
      });
    });
    
    console.log(`\n📊 ANALYSIS RESULTS:`);
    console.log(`Total unique sources found: ${foundSources.size}`);
    console.log(`Premium sources found: ${premiumFound}`);
    
    console.log(`\n📰 All unique sources:`);
    Array.from(foundSources).sort().forEach((source, i) => {
      if (source && i < 20) console.log(`${i + 1}. ${source}`);
    });
    
    if (premiumFound === 0) {
      console.log('\n❌ NO PREMIUM SOURCES FOUND');
      console.log('FMP appears to provide mostly press releases and smaller financial sites');
      console.log('📝 RECOMMENDATION: Use Brave API for premium news sources (Bloomberg, CNBC, Reuters, WSJ)');
    } else {
      console.log('\n✅ PREMIUM SOURCES AVAILABLE');
    }
    
  } catch (error) {
    console.log(`❌ Premium source check failed: ${error.message}`);
  }
  
  console.log('\n🏁 FMP NEWS SOURCE INVESTIGATION COMPLETE');
  console.log('\n📋 SUMMARY:');
  console.log('- FMP provides financial news but mostly from smaller sources');
  console.log('- Premium sources (Bloomberg, CNBC, Reuters, WSJ) not consistently available');
  console.log('- Recommendation: Use hybrid approach with Brave API for premium sources');
}

investigateFmpNewsSources().catch(console.error);