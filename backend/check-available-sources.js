/**
 * CHECK AVAILABLE SOURCES IN FMP API
 * Look for StreetInsider, Reuters, Bloomberg, AP, Dow Jones
 */
import 'dotenv/config';
import axios from 'axios';

async function checkAvailableSources() {
  console.log('🔍 CHECKING AVAILABLE SOURCES IN FMP API');
  console.log('🎯 Looking for: StreetInsider, Reuters, Bloomberg, AP, Dow Jones');
  console.log('=' .repeat(70));
  
  const fmpApiKey = process.env.FMP_API_KEY;
  const baseUrl = 'https://financialmodelingprep.com/api';
  
  try {
    // Check multiple endpoints
    const endpoints = [
      `${baseUrl}/v4/general_news`,
      `${baseUrl}/v3/stock_news`,
      `${baseUrl}/v3/stock_market_news`,
      `${baseUrl}/v4/press-releases`
    ];
    
    const allSources = new Set();
    const targetSources = [
      'streetinsider', 'reuters', 'bloomberg', 'ap', 'associated press', 
      'dow jones', 'dowjones', 'wsj', 'wall street journal'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n📊 Checking ${endpoint}...`);
        
        const response = await axios.get(endpoint, {
          params: { 
            page: 0, 
            size: 100,
            apikey: fmpApiKey 
          },
          timeout: 10000
        });
        
        if (Array.isArray(response.data)) {
          console.log(`✅ Retrieved ${response.data.length} articles from ${endpoint}`);
          
          // Collect all unique sources
          response.data.forEach(article => {
            const source = article.site || article.source;
            if (source) {
              allSources.add(source.toLowerCase());
            }
          });
          
          // Look for target sources
          const foundTargets = [];
          response.data.forEach(article => {
            const source = (article.site || article.source || '').toLowerCase();
            targetSources.forEach(target => {
              if (source.includes(target)) {
                foundTargets.push({
                  source: article.site || article.source,
                  title: article.title,
                  target: target
                });
              }
            });
          });
          
          if (foundTargets.length > 0) {
            console.log(`🎯 TARGET SOURCES FOUND:`);
            foundTargets.forEach(item => {
              console.log(`   ✅ ${item.source} (${item.target}): ${item.title.substring(0, 50)}...`);
            });
          } else {
            console.log(`❌ No target sources found in this endpoint`);
          }
          
        }
        
      } catch (endpointError) {
        console.warn(`⚠️ ${endpoint} failed: ${endpointError.message}`);
      }
    }
    
    console.log('\n📊 ALL UNIQUE SOURCES FOUND:');
    const sortedSources = Array.from(allSources).sort();
    
    // Group sources for better readability
    const premiumSources = [];
    const financialSources = [];
    const otherSources = [];
    
    sortedSources.forEach(source => {
      if (source.includes('reuters') || source.includes('bloomberg') || 
          source.includes('streetinsider') || source.includes('ap') || 
          source.includes('dow') || source.includes('wsj')) {
        premiumSources.push(source);
      } else if (source.includes('financial') || source.includes('market') || 
                 source.includes('invest') || source.includes('trade')) {
        financialSources.push(source);
      } else {
        otherSources.push(source);
      }
    });
    
    console.log('\n🎯 PREMIUM/TARGET SOURCES:');
    if (premiumSources.length > 0) {
      premiumSources.forEach(source => console.log(`   ✅ ${source}`));
    } else {
      console.log('   ❌ No premium target sources found');
    }
    
    console.log('\n💼 FINANCIAL SOURCES:');
    financialSources.slice(0, 10).forEach(source => console.log(`   📰 ${source}`));
    if (financialSources.length > 10) {
      console.log(`   ... and ${financialSources.length - 10} more financial sources`);
    }
    
    console.log('\n📄 OTHER SOURCES (sample):');
    otherSources.slice(0, 15).forEach(source => console.log(`   📄 ${source}`));
    if (otherSources.length > 15) {
      console.log(`   ... and ${otherSources.length - 15} more sources`);
    }
    
    console.log('\n🔍 RECOMMENDATIONS:');
    
    if (premiumSources.length > 0) {
      console.log('✅ Found premium sources! Update service to use:');
      premiumSources.forEach(source => console.log(`   - ${source}`));
    } else {
      console.log('❌ No premium target sources found. Consider alternatives:');
      // Look for close matches
      const alternatives = sortedSources.filter(source => 
        source.includes('cnbc') || source.includes('marketwatch') || 
        source.includes('yahoo') || source.includes('seeking') ||
        source.includes('motley') || source.includes('barron')
      );
      alternatives.slice(0, 5).forEach(source => console.log(`   📰 ${source}`));
    }
    
    console.log(`\n📊 TOTAL SOURCES FOUND: ${allSources.size}`);
    console.log(`🎯 PREMIUM SOURCES: ${premiumSources.length}`);
    console.log(`💼 FINANCIAL SOURCES: ${financialSources.length}`);
    console.log(`📄 OTHER SOURCES: ${otherSources.length}`);
    
  } catch (error) {
    console.error('❌ SOURCE CHECK FAILED:', error.message);
  }
}

checkAvailableSources().catch(console.error);