/**
 * PRODUCTION PREMIUM QUALITY TEST
 * End-to-end verification of premium FMP sources + Mistral AI
 * NO FALLBACKS OR MOCK DATA - Real API testing only
 */
import 'dotenv/config';
import axios from 'axios';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';
import mistralService from './src/services/mistralService.js';

const BACKEND_PORT = process.env.PORT || 5000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

async function testProductionPremium() {
  console.log('🏭 PRODUCTION PREMIUM QUALITY TEST');
  console.log('🎯 Focus: Real APIs only, NO fallbacks, Quality 8+ sources');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  let allTestsPassed = true;
  
  // TEST 1: API Keys Configuration
  console.log('\n📍 STEP 1: API Keys Configuration Check');
  const fmpKey = process.env.FMP_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  
  if (!fmpKey || fmpKey === 'DEPRECATED_MOVED_TO_FMP') {
    console.error('❌ FMP_API_KEY not configured or deprecated');
    allTestsPassed = false;
  } else {
    console.log(`✅ FMP API Key: ${fmpKey.substring(0, 8)}...`);
  }
  
  if (!mistralKey) {
    console.error('❌ MISTRAL_API_KEY not configured');
    allTestsPassed = false;
  } else {
    console.log(`✅ Mistral API Key: ${mistralKey.substring(0, 8)}...`);
  }
  
  // TEST 2: Premium FMP News Service Direct Test
  console.log('\n📍 STEP 2: Premium FMP News Service (Direct)');
  let newsResult = null;
  
  try {
    newsResult = await Promise.race([
      premiumFmpNewsService.getPremiumFinancialNews(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News service timeout')), 12000)
      )
    ]);
    
    console.log(`✅ Premium news articles: ${newsResult.articles.length}`);
    console.log(`✅ Quality score: ${newsResult.qualityScore}/10`);
    console.log(`✅ Source types: ${newsResult.sourceTypes.join(', ')}`);
    
    // Validate quality
    const hasRealContent = newsResult.articles.every(a => 
      a.description && a.description.length > 50 && 
      !a.description.includes('mock') && 
      !a.description.includes('fallback')
    );
    
    const hasHighQuality = newsResult.articles.every(a => a.qualityScore >= 20);
    const hasPremiumSources = newsResult.articles.some(a => 
      a.source.includes('MarketWatch') || 
      a.source.includes('Seeking Alpha') || 
      a.source.includes('Official')
    );
    
    if (!hasRealContent) {
      console.error('❌ Articles contain mock/fallback content');
      allTestsPassed = false;
    } else {
      console.log('✅ All articles have real content');
    }
    
    if (!hasHighQuality) {
      console.error('❌ Some articles below quality threshold');
      allTestsPassed = false;
    } else {
      console.log('✅ All articles meet quality 8+ threshold');
    }
    
    if (!hasPremiumSources) {
      console.error('❌ No premium sources found');
      allTestsPassed = false;
    } else {
      console.log('✅ Premium sources verified');
    }
    
    // Show top 3 articles
    console.log('\n📰 TOP 3 PREMIUM ARTICLES:');
    newsResult.articles.slice(0, 3).forEach((article, i) => {
      console.log(`${i + 1}. ${article.source} (${article.sourceType})`);
      console.log(`   ${article.title}`);
      console.log(`   Quality: ${article.qualityScore} | Rating: ${article.qualityRating}/10`);
      console.log(`   Content: ${article.description.substring(0, 100)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Premium news service failed:', error.message);
    allTestsPassed = false;
  }
  
  // TEST 3: Mistral AI Service Direct Test
  console.log('\n📍 STEP 3: Mistral AI Service (Direct)');
  
  try {
    // Initialize Mistral
    const initialized = await mistralService.initialize();
    if (!initialized) {
      console.error('❌ Mistral service initialization failed');
      allTestsPassed = false;
    } else {
      console.log('✅ Mistral service initialized');
    }
    
    // Test AI generation with premium news
    if (newsResult && newsResult.articles.length > 0) {
      const testPrompt = `Create a brief market analysis based on these premium sources:
      
${newsResult.articles.slice(0, 2).map(a => 
  `• ${a.source}: ${a.title}\\n  ${a.description.substring(0, 100)}...`
).join('\\n\\n')}

Provide a professional 2-paragraph analysis focusing on investment implications.`;
      
      const aiResponse = await Promise.race([
        mistralService.generateText(testPrompt, {
          temperature: 0.3,
          maxTokens: 500
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Mistral AI timeout')), 20000)
        )
      ]);
      
      if (aiResponse && aiResponse.length > 100) {
        console.log('✅ Mistral AI generated analysis successfully');
        console.log(`✅ Response length: ${aiResponse.length} characters`);
        
        // Check for professional content
        const hasFinancialTerms = /market|investment|financial|revenue|earnings|investor/i.test(aiResponse);
        const hasAnalysis = aiResponse.includes('.') && aiResponse.split('.').length > 3;
        const noGenericContent = !aiResponse.includes('mixed market conditions') && 
                                 !aiResponse.includes('As an AI');
        
        if (hasFinancialTerms && hasAnalysis && noGenericContent) {
          console.log('✅ AI content quality verified');
        } else {
          console.error('❌ AI content quality issues detected');
          allTestsPassed = false;
        }
        
        console.log(`\\n📋 AI ANALYSIS SAMPLE (first 200 chars):`);
        console.log(`"${aiResponse.substring(0, 200)}..."`);
        
      } else {
        console.error('❌ Mistral AI response too short or invalid');
        allTestsPassed = false;
      }
    }
    
  } catch (error) {
    console.error('❌ Mistral AI service failed:', error.message);
    allTestsPassed = false;
  }
  
  // TEST 4: End-to-End API Route Test
  console.log('\n📍 STEP 4: End-to-End API Route Test (/api/ai/ai-analysis)');
  
  try {
    const apiResponse = await Promise.race([
      axios.get(`${BACKEND_URL}/api/ai/ai-analysis`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API endpoint timeout')), 25000)
      )
    ]);
    
    if (apiResponse.status === 200 && apiResponse.data) {
      console.log('✅ API endpoint responded successfully');
      
      const data = apiResponse.data;
      
      // Validate response structure
      if (data.status === 'success' && data.analysis && data.sources) {
        console.log('✅ Response structure valid');
        console.log(`✅ Analysis source: ${data.analysis.analysisSource}`);
        console.log(`✅ Quality score: ${data.analysis.qualityScore}/10`);
        console.log(`✅ Sources used: ${data.sources.length}`);
        console.log(`✅ Processing time: ${data.analysis.processingTime}ms`);
        
        // Check for real content
        if (data.analysis.content && data.analysis.content.length > 200) {
          console.log('✅ Analysis content substantial');
          
          // Verify premium sources
          const hasPremiumSources = data.sources.some(s => 
            s.source.includes('MarketWatch') || 
            s.source.includes('Seeking Alpha') || 
            s.source.includes('Official')
          );
          
          if (hasPremiumSources) {
            console.log('✅ Premium sources verified in API response');
          } else {
            console.error('❌ No premium sources in API response');
            allTestsPassed = false;
          }
          
          // Check quality threshold
          const meetsQualityThreshold = data.premiumMetadata?.qualityThreshold === 8;
          if (meetsQualityThreshold) {
            console.log('✅ Quality threshold 8+ verified');
          } else {
            console.error('❌ Quality threshold not set to 8+');
            allTestsPassed = false;
          }
          
        } else {
          console.error('❌ Analysis content too short');
          allTestsPassed = false;
        }
        
      } else {
        console.error('❌ Invalid response structure');
        allTestsPassed = false;
      }
      
    } else {
      console.error('❌ API endpoint failed');
      allTestsPassed = false;
    }
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ Backend server not running on port', BACKEND_PORT);
      console.log('💡 To start backend: cd backend && npm start');
    } else {
      console.error('❌ API endpoint test failed:', error.message);
    }
    allTestsPassed = false;
  }
  
  // FINAL RESULTS
  const totalTime = Date.now() - startTime;
  
  console.log('\n' + '=' .repeat(70));
  console.log('🏁 PRODUCTION PREMIUM QUALITY TEST RESULTS');
  console.log('=' .repeat(70));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Production ready with premium quality sources');
    console.log('✅ Real FMP API integration (Quality 8+ only)');
    console.log('✅ Real Mistral AI integration'); 
    console.log('✅ End-to-end API functionality');
    console.log('✅ No fallback or mock data detected');
    console.log('✅ Premium sources verified (MarketWatch, Seeking Alpha, Official reports)');
  } else {
    console.log('❌ SOME TESTS FAILED - Review issues above');
    console.log('💡 Check API keys, service configuration, and backend status');
  }
  
  console.log(`\\n⏱️  Total test time: ${totalTime}ms`);
  console.log(`🎯 Quality focus: Official reports, MarketWatch, Seeking Alpha`);
  console.log(`📊 Minimum quality threshold: 8/10`);
  
  if (allTestsPassed) {
    console.log('\\n🚀 READY FOR PRODUCTION USE!');
  } else {
    console.log('\\n🔧 FIXES NEEDED BEFORE PRODUCTION');
  }
  
  return allTestsPassed;
}

// Run the test
testProductionPremium()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\\n💥 Test execution failed:', error.message);
    process.exit(1);
  });