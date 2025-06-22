/**
 * TEST TOP 5 WEEKLY PREMIUM SOURCES
 * Verify Reuters, Morningstar, MarketWatch from past week
 */
import 'dotenv/config';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';

async function testWeeklyTop5() {
  console.log('🔍 TESTING TOP 5 WEEKLY PREMIUM SOURCES');
  console.log('🎯 Target: 5 best articles from Reuters > Morningstar > MarketWatch');
  console.log('📅 Timeframe: Past 7 days, prioritizing most recent');
  console.log('❌ Exclude: Motley Fool, Seeking Alpha, all others');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    console.log('\n📍 Testing Weekly Premium News Service (5 articles target)');
    
    const newsResult = await premiumFmpNewsService.getPremiumFinancialNews();
    
    console.log(`✅ Premium articles found: ${newsResult.articles.length}`);
    console.log(`🎯 Target articles: ${newsResult.targetArticles || 5}`);
    console.log(`✅ Quality Score: ${newsResult.qualityScore}/10`);
    console.log(`✅ Minimum Quality: ${newsResult.minimumQuality}/10`);
    
    // Validate TOP 3 sources only
    const foundSources = [...new Set(newsResult.articles.map(a => a.source))];
    console.log(`\n🔍 SOURCES FOUND: ${foundSources.join(', ')}`);
    
    const hasReuters = foundSources.some(s => s.includes('Reuters'));
    const hasMorningstar = foundSources.some(s => s.includes('Morningstar'));
    const hasMarketWatch = foundSources.some(s => s.includes('MarketWatch'));
    const hasMotleyFool = foundSources.some(s => s.includes('Motley Fool'));
    const hasSeekingAlpha = foundSources.some(s => s.includes('Seeking Alpha'));
    const hasOtherSources = foundSources.some(s => 
      !s.includes('Reuters') && 
      !s.includes('Morningstar') && 
      !s.includes('MarketWatch')
    );
    
    console.log('\n🔍 SOURCE VALIDATION:');
    console.log(`✅ Has Reuters: ${hasReuters ? 'YES' : 'NO'}`);
    console.log(`✅ Has Morningstar: ${hasMorningstar ? 'YES' : 'NO'}`);
    console.log(`✅ Has MarketWatch: ${hasMarketWatch ? 'YES' : 'NO'}`);
    console.log(`❌ Has Motley Fool (should be NO): ${hasMotleyFool ? 'YES' : 'NO'}`);
    console.log(`❌ Has Seeking Alpha (should be NO): ${hasSeekingAlpha ? 'YES' : 'NO'}`);
    console.log(`❌ Has other sources (should be NO): ${hasOtherSources ? 'YES' : 'NO'}`);
    
    // Check weekly recency
    const avgHoursOld = newsResult.articles.length > 0 ? 
      newsResult.articles.reduce((sum, a) => {
        const hoursOld = (Date.now() - new Date(a.publishedAt)) / (1000 * 60 * 60);
        return sum + hoursOld;
      }, 0) / newsResult.articles.length : 0;
    
    const avgDaysOld = avgHoursOld / 24;
    
    console.log(`\n📅 WEEKLY RECENCY CHECK:`);
    console.log(`⏰ Average article age: ${Math.round(avgHoursOld)} hours (${Math.round(avgDaysOld)} days)`);
    console.log(`✅ Within week (< 7 days): ${avgDaysOld < 7 ? 'YES' : 'NO'}`);
    console.log(`✅ Good mix of recency: ${avgDaysOld < 4 ? 'YES' : 'NO'}`);
    
    // Count articles by age
    const articlesByAge = {
      sameDay: 0,
      day1: 0,
      day2: 0,
      day3to7: 0,
      older: 0
    };
    
    newsResult.articles.forEach(article => {
      const hoursOld = (Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60);
      const daysOld = hoursOld / 24;
      
      if (daysOld <= 0.5) articlesByAge.sameDay++;
      else if (daysOld <= 1) articlesByAge.day1++;
      else if (daysOld <= 2) articlesByAge.day2++;
      else if (daysOld <= 7) articlesByAge.day3to7++;
      else articlesByAge.older++;
    });
    
    console.log(`\n📊 AGE DISTRIBUTION:`);
    console.log(`🕐 Same day (< 12h): ${articlesByAge.sameDay}`);
    console.log(`📅 1 day old: ${articlesByAge.day1}`);
    console.log(`📅 2 days old: ${articlesByAge.day2}`);
    console.log(`📅 3-7 days old: ${articlesByAge.day3to7}`);
    console.log(`⚠️ Older than week: ${articlesByAge.older}`);
    
    // Show detailed breakdown
    if (newsResult.articles.length > 0) {
      console.log('\n📰 DETAILED TOP 5 ARTICLES:');
      newsResult.articles.forEach((article, i) => {
        const hoursOld = (Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60);
        const daysOld = Math.round(hoursOld / 24 * 10) / 10; // 1 decimal place
        console.log(`${i + 1}. ${article.source} (${daysOld} days old)`);
        console.log(`   ${article.title}`);
        console.log(`   Quality: ${article.qualityScore} | Rating: ${article.qualityRating}/10`);
        console.log(`   Content: ${(article.description || '').length} chars`);
        console.log('');
      });
    }
    
    const totalTime = Date.now() - startTime;
    
    // SCORING for weekly 5-article target
    console.log('\n📊 WEEKLY TOP 5 ASSESSMENT');
    console.log('=' .repeat(50));
    
    const score = 
      (newsResult.articles.length >= 3 ? 25 : 0) +                    // At least 3 articles
      (newsResult.articles.length >= 5 ? 15 : 0) +                    // Bonus for 5 articles
      (!hasMotleyFool ? 15 : 0) +                                     // No Motley Fool
      (!hasSeekingAlpha ? 15 : 0) +                                   // No Seeking Alpha
      (!hasOtherSources ? 15 : 0) +                                   // No other sources
      (avgDaysOld < 7 ? 10 : 0) +                                     // Within week
      (articlesByAge.older === 0 ? 5 : 0);                           // No articles older than week
    
    console.log(`🎯 Weekly Performance Score: ${score}/100`);
    console.log(`📊 Articles found: ${newsResult.articles.length}/5 target`);
    console.log(`⏱️ Total time: ${totalTime}ms`);
    
    if (score >= 85 && newsResult.articles.length >= 4) {
      console.log('🎉 EXCELLENT: Weekly top 5 system working great!');
      console.log('✅ Good article count from top sources');
      console.log('✅ Proper weekly timeframe');
      console.log('✅ Unwanted sources excluded');
    } else if (score >= 70) {
      console.log('⚠️ GOOD: Weekly system mostly working, some improvements needed');
      if (newsResult.articles.length < 3) console.log('🔧 Need more articles - expand search');
      if (hasMotleyFool || hasSeekingAlpha) console.log('🔧 Still getting unwanted sources');
      if (avgDaysOld > 7) console.log('🔧 Articles too old');
    } else {
      console.log('❌ NEEDS WORK: Weekly system has issues');
      console.log('🔧 Review weekly filtering and source detection');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (newsResult.articles.length < 5) {
      console.log(`🔧 Only found ${newsResult.articles.length}/5 target articles`);
      console.log('🔧 Consider: expanding search parameters or adjusting quality thresholds');
    }
    
    if (avgDaysOld > 5) {
      console.log('🔧 Articles averaging older than 5 days - may need more recent content');
    }
    
    if (newsResult.articles.length >= 5 && avgDaysOld < 4) {
      console.log('🎉 Perfect! 5 quality articles with good recency mix');
    }
    
    console.log('\n🏁 WEEKLY TOP 5 TEST COMPLETE');
    
    return score >= 70 && newsResult.articles.length >= 3;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testWeeklyTop5()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });