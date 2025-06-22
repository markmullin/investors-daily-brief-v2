/**
 * DEEP DIVE FMP NEWS SOURCES FINDER
 * Tests ALL FMP endpoints to find highest quality news sources
 * Focuses on best 5 sources for investors/stock market
 */
import 'dotenv/config';
import axios from 'axios';

async function findBestFmpNewsSources() {
  console.log('🔍 DEEP DIVE: FINDING BEST FMP NEWS SOURCES');
  console.log('Testing ALL FMP news endpoints for highest quality sources');
  console.log('=' .repeat(70));
  
  const fmpApiKey = process.env.FMP_API_KEY;
  const baseUrl = 'https://financialmodelingprep.com/api';
  
  if (!fmpApiKey) {
    console.error('❌ FMP API key not found');
    return;
  }
  
  console.log('✅ FMP API Key configured');
  console.log('🎯 Goal: Find best 5 news sources most relevant to investors');
  
  const allArticles = [];
  const sourceQuality = new Map();
  
  // Test 1: General News API (v4) - might have better sources
  console.log('\n📍 TEST 1: FMP General News API (v4)');
  try {
    const response = await axios.get(`${baseUrl}/v4/general_news`, {
      params: {
        page: 0,
        size: 50,
        apikey: fmpApiKey
      },
      timeout: 8000
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ General News: ${response.data.length} articles`);
      response.data.forEach(article => {
        const source = article.site || article.source || 'Unknown';
        allArticles.push({ ...article, endpoint: 'general_news_v4', source });
        
        if (!sourceQuality.has(source)) {
          sourceQuality.set(source, { count: 0, quality: 0, endpoint: 'general_news_v4' });
        }
        sourceQuality.get(source).count++;
      });
    }
  } catch (error) {
    console.log(`❌ General News v4 failed: ${error.message}`);
  }
  
  // Test 2: Stock News with Major Companies Focus
  console.log('\n📍 TEST 2: Stock News for Major Companies');
  const majorTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B'];
  
  try {
    const response = await axios.get(`${baseUrl}/v3/stock_news`, {
      params: {
        tickers: majorTickers.join(','),
        limit: 50,
        apikey: fmpApiKey
      },
      timeout: 8000
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Major Stock News: ${response.data.length} articles`);
      response.data.forEach(article => {
        const source = article.site || 'Unknown';
        allArticles.push({ ...article, endpoint: 'stock_news_major', source });
        
        if (!sourceQuality.has(source)) {
          sourceQuality.set(source, { count: 0, quality: 0, endpoint: 'stock_news_major' });
        }
        sourceQuality.get(source).count++;
        sourceQuality.get(source).quality += 2; // Bonus for major company news
      });
    }
  } catch (error) {
    console.log(`❌ Major Stock News failed: ${error.message}`);
  }
  
  // Test 3: FMP Articles (their own content)
  console.log('\n📍 TEST 3: FMP Articles (Professional Analysis)');
  try {
    const response = await axios.get(`${baseUrl}/v4/articles`, {
      params: {
        page: 0,
        size: 20,
        apikey: fmpApiKey
      },
      timeout: 8000
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ FMP Articles: ${response.data.length} articles`);
      response.data.forEach(article => {
        const source = 'Financial Modeling Prep';
        allArticles.push({ ...article, endpoint: 'fmp_articles', source });
        
        if (!sourceQuality.has(source)) {
          sourceQuality.set(source, { count: 0, quality: 0, endpoint: 'fmp_articles' });
        }
        sourceQuality.get(source).count++;
        sourceQuality.get(source).quality += 5; // High bonus for professional content
      });
    }
  } catch (error) {
    console.log(`❌ FMP Articles failed: ${error.message}`);
  }
  
  // Test 4: Company Press Releases (Official sources)
  console.log('\n📍 TEST 4: Company Press Releases');
  for (const ticker of ['AAPL', 'MSFT', 'GOOGL']) {
    try {
      const response = await axios.get(`${baseUrl}/v3/press-releases/${ticker}`, {
        params: {
          limit: 10,
          apikey: fmpApiKey
        },
        timeout: 5000
      });
      
      if (Array.isArray(response.data)) {
        console.log(`✅ ${ticker} Press Releases: ${response.data.length} articles`);
        response.data.forEach(article => {
          const source = `${ticker} Official`;
          allArticles.push({ ...article, endpoint: 'press_releases', source });
          
          if (!sourceQuality.has(source)) {
            sourceQuality.set(source, { count: 0, quality: 0, endpoint: 'press_releases' });
          }
          sourceQuality.get(source).count++;
          sourceQuality.get(source).quality += 3; // Bonus for official sources
        });
      }
    } catch (error) {
      console.log(`⚠️ ${ticker} press releases failed: ${error.message}`);
    }
  }
  
  // Test 5: Recent Stock News (last 3 days)
  console.log('\n📍 TEST 5: Recent Stock News (Last 3 Days)');
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 3);
  const toDate = new Date();
  
  try {
    const response = await axios.get(`${baseUrl}/v3/stock_news`, {
      params: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        limit: 50,
        apikey: fmpApiKey
      },
      timeout: 8000
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Recent Stock News: ${response.data.length} articles`);
      response.data.forEach(article => {
        const source = article.site || 'Unknown';
        if (!sourceQuality.has(source)) {
          sourceQuality.set(source, { count: 0, quality: 0, endpoint: 'recent_stock_news' });
        }
        sourceQuality.get(source).count++;
        sourceQuality.get(source).quality += 1; // Bonus for recent news
      });
    }
  } catch (error) {
    console.log(`❌ Recent Stock News failed: ${error.message}`);
  }
  
  // Analyze Source Quality
  console.log('\n📊 SOURCE QUALITY ANALYSIS');
  console.log('=' .repeat(50));
  
  // Rate sources based on investment relevance
  const investorQualityRatings = {
    'marketwatch.com': 9,
    'finance.yahoo.com': 8,
    'fool.com': 7,
    'benzinga.com': 8,
    'seekingalpha.com': 8,
    'morningstar.com': 9,
    'zacks.com': 8,
    'thestreet.com': 7,
    'financialnews.com': 8,
    'investopedia.com': 7,
    'Financial Modeling Prep': 8,
    'businesswire.com': 6,
    'globenewswire.com': 4,
    'prnewswire.com': 5,
    'accesswire.com': 4,
    'youtube.com': 2,
    'reddit.com': 3
  };
  
  // Calculate quality scores
  const sourceScores = [];
  sourceQuality.forEach((data, source) => {
    const baseRating = investorQualityRatings[source] || 
      (source.includes('Official') ? 9 : 
       source.toLowerCase().includes('financial') ? 6 : 
       source.toLowerCase().includes('news') ? 5 : 3);
    
    const totalScore = (baseRating * 2) + data.quality + Math.min(data.count, 10);
    
    sourceScores.push({
      source,
      score: totalScore,
      count: data.count,
      qualityBonus: data.quality,
      baseRating,
      endpoint: data.endpoint
    });
  });
  
  // Sort by quality score
  sourceScores.sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 TOP 10 BEST SOURCES FOUND:');
  sourceScores.slice(0, 10).forEach((item, i) => {
    console.log(`${i + 1}. ${item.source}`);
    console.log(`   Score: ${item.score} | Articles: ${item.count} | Base Rating: ${item.baseRating}/10`);
    console.log(`   Best Endpoint: ${item.endpoint}`);
    console.log('');
  });
  
  // Best 5 for investors
  console.log('\n🎯 TOP 5 RECOMMENDED FOR INVESTORS:');
  const top5 = sourceScores.slice(0, 5);
  top5.forEach((item, i) => {
    console.log(`${i + 1}. ${item.source} (Score: ${item.score})`);
  });
  
  // Provide specific API recommendations
  console.log('\n🔧 PRODUCTION API RECOMMENDATIONS:');
  
  if (top5.some(s => s.endpoint === 'fmp_articles')) {
    console.log('✅ USE: /v4/articles - FMP professional analysis (highest quality)');
  }
  
  if (top5.some(s => s.endpoint === 'stock_news_major')) {
    console.log('✅ USE: /v3/stock_news?tickers=AAPL,MSFT,GOOGL,AMZN,TSLA - Major company focus');
  }
  
  if (top5.some(s => s.endpoint === 'general_news_v4')) {
    console.log('✅ USE: /v4/general_news - Broader financial news coverage');
  }
  
  if (top5.some(s => s.endpoint === 'press_releases')) {
    console.log('✅ USE: /v3/press-releases/{symbol} - Official company announcements');
  }
  
  // Sample the best content
  console.log('\n📋 SAMPLE FROM BEST SOURCES:');
  const bestArticles = allArticles.filter(article => 
    top5.some(top => top.source === article.source)
  ).slice(0, 3);
  
  bestArticles.forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.source}: ${article.title?.substring(0, 60)}...`);
    console.log(`   Content: ${(article.text || article.content || '').substring(0, 100)}...`);
    console.log(`   Endpoint: ${article.endpoint}`);
  });
  
  console.log('\n🏁 DEEP DIVE COMPLETE');
  console.log('\n💡 CONCLUSION:');
  console.log('While FMP doesn\'t have Bloomberg/CNBC/Reuters directly,');
  console.log('the best available sources focus on:');
  console.log('1. FMP\'s own professional articles');
  console.log('2. Major company-specific news');
  console.log('3. Official press releases');
  console.log('4. Financial-focused websites like MarketWatch');
  
  return top5;
}

findBestFmpNewsSources().catch(console.error);