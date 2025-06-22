#!/usr/bin/env node

// Diagnostic script to test the news integration pipeline
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 DIAGNOSING NEWS INTEGRATION PIPELINE');
console.log('==================================================');

async function testNewsIntegration() {
  try {
    console.log('\n1. Testing Environment Variables...');
    console.log('BRAVE_API_KEY:', process.env.BRAVE_API_KEY ? 'Present' : 'Missing');
    console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Present' : 'Missing');
    
    console.log('\n2. Testing Brave Search Service...');
    const braveSearchService = await import('./src/services/braveSearchService.js');
    const braveService = braveSearchService.default;
    
    console.log('✅ Brave Search Service imported successfully');
    
    // Test basic search
    console.log('\n3. Testing Basic News Search...');
    const testQuery = 'stock market news today';
    console.log(`Searching for: "${testQuery}"`);
    
    const searchResults = await braveService.search(testQuery, {
      count: 3,
      freshness: 'pd',
      searchType: 'web'
    });
    
    console.log('Search Results Structure:');
    console.log('- Has web results:', !!(searchResults.web && searchResults.web.results));
    console.log('- Results count:', searchResults.web?.results?.length || 0);
    
    if (searchResults.web?.results?.length > 0) {
      console.log('\n📰 Sample News Results:');
      searchResults.web.results.slice(0, 2).forEach((result, i) => {
        console.log(`${i + 1}. Title: ${result.title}`);
        console.log(`   Description: ${result.description?.substring(0, 100)}...`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Source: ${result.meta?.url?.hostname || 'Unknown'}`);
      });
    } else {
      console.log('❌ No search results returned');
    }
    
    console.log('\n4. Testing fetchRealMarketEvents Function...');
    
    // Import and test the function from aiRoutes
    const fetchRealMarketEvents = async () => {
      console.log('📰 Fetching real market events...');
      
      const marketQueries = [
        'stock market news today',
        'Federal Reserve interest rates',
        'earnings reports today'
      ];
      
      const allEvents = [];
      
      for (const query of marketQueries) {
        try {
          console.log(`   Searching: "${query}"`);
          const searchResults = await braveService.search(query, {
            count: 2,
            freshness: 'pd',
            searchType: 'web'
          });
          
          if (searchResults && searchResults.web && searchResults.web.results) {
            const events = searchResults.web.results.map(result => ({
              title: result.title,
              snippet: result.description,
              url: result.url,
              source: result.meta?.url?.hostname || 'News Source',
              publishedDate: result.age || new Date().toISOString()
            }));
            
            allEvents.push(...events);
            console.log(`   ✅ Found ${events.length} events`);
          } else {
            console.log(`   ❌ No results for "${query}"`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (queryError) {
          console.log(`   ❌ Error for "${query}": ${queryError.message}`);
        }
      }
      
      // Remove duplicates
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.title === event.title)
      ).slice(0, 10);
      
      console.log(`✅ Total unique events: ${uniqueEvents.length}`);
      return uniqueEvents;
    };
    
    const currentEvents = await fetchRealMarketEvents();
    
    console.log('\n5. Testing Prompt Generation...');
    
    if (currentEvents.length > 0) {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      
      const newsSection = currentEvents.map(event => `• ${event.title}: ${event.snippet}`).join('\n');
      
      console.log('📝 Generated News Section for AI:');
      console.log(newsSection);
      console.log(`\n📊 News Section Stats:`);
      console.log(`- Character count: ${newsSection.length}`);
      console.log(`- Has substantial content: ${newsSection.length > 200 ? 'Yes' : 'No'}`);
      console.log(`- Contains companies: ${/AAPL|MSFT|GOOGL|AMZN|TSLA|Apple|Microsoft|Google|Amazon|Tesla/i.test(newsSection) ? 'Yes' : 'No'}`);
      
    } else {
      console.log('❌ No events to generate prompt with');
    }
    
    console.log('\n6. Testing Mistral Service...');
    const mistralService = await import('./src/services/mistralService.js');
    const mistral = mistralService.default;
    
    console.log('Mistral Service Status:');
    const status = mistral.getStatus();
    console.log('- Initialized:', status.initialized);
    console.log('- Client Created:', status.clientCreated);
    console.log('- API Key Configured:', status.apiKeyConfigured);
    console.log('- Ready:', mistral.isReady());
    
    if (status.lastError) {
      console.log('- Last Error:', status.lastError);
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('==================================================');
    
    return {
      braveWorking: searchResults.web?.results?.length > 0,
      eventsFound: currentEvents.length,
      mistralReady: mistral.isReady(),
      newsContentQuality: currentEvents.length > 0 ? 'Good' : 'Poor'
    };
    
  } catch (error) {
    console.error('❌ Diagnostic Error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Run diagnostic
testNewsIntegration().then(result => {
  if (result) {
    console.log('\n📋 SUMMARY:');
    console.log('- Brave API Working:', result.braveWorking ? '✅' : '❌');
    console.log('- Events Found:', result.eventsFound);
    console.log('- Mistral Ready:', result.mistralReady ? '✅' : '❌');
    console.log('- News Quality:', result.newsContentQuality);
    
    if (!result.braveWorking) {
      console.log('\n🔧 RECOMMENDED FIX: Check Brave API configuration and rate limits');
    }
    if (result.eventsFound === 0) {
      console.log('\n🔧 RECOMMENDED FIX: Improve news fetching or add fallback news sources');
    }
    if (!result.mistralReady) {
      console.log('\n🔧 RECOMMENDED FIX: Check Mistral API configuration');
    }
  }
  
  console.log('\nDiagnostic complete. Check results above.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal diagnostic error:', error);
  process.exit(1);
});
