/**
 * QUICK API ROUTE TEST - Verify Premium Service is Active
 */
import 'dotenv/config';
import axios from 'axios';

async function testApiRoute() {
  console.log('🔍 TESTING ACTUAL API ROUTE');
  console.log('Endpoint: http://localhost:5000/api/ai/ai-analysis');
  console.log('=' .repeat(50));
  
  try {
    console.log('📡 Making request to API endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/ai/ai-analysis', {
      timeout: 30000
    });
    
    if (response.status === 200 && response.data) {
      const data = response.data;
      
      console.log('✅ API Response received');
      console.log(`📊 Status: ${data.status}`);
      console.log(`🔍 Analysis source: ${data.analysis?.analysisSource || 'unknown'}`);
      console.log(`📰 Sources used: ${data.sources?.length || 0}`);
      console.log(`⏱️  Processing time: ${data.analysis?.processingTime || 'unknown'}ms`);
      console.log(`🎯 Quality score: ${data.analysis?.qualityScore || 'unknown'}/10`);
      console.log(`🏷️  News provider: ${data.analysis?.newsProvider || 'unknown'}`);
      
      // Check for premium content
      if (data.sources && Array.isArray(data.sources)) {
        console.log('\\n📰 SOURCES BREAKDOWN:');
        data.sources.forEach((source, i) => {
          console.log(`${i + 1}. ${source.source}: ${source.title?.substring(0, 60)}...`);
        });
        
        const premiumSources = data.sources.filter(s => 
          s.source?.includes('MarketWatch') || 
          s.source?.includes('Seeking Alpha') || 
          s.source?.includes('Morningstar')
        );
        
        console.log(`\\n✅ Premium sources found: ${premiumSources.length}`);
        
        if (premiumSources.length > 0) {
          console.log('🎉 SUCCESS: Premium sources detected in API response!');
        } else {
          console.log('⚠️ WARNING: No premium sources in API response');
        }
      }
      
      // Check if using premium metadata
      if (data.premiumMetadata) {
        console.log('\\n🔍 PREMIUM METADATA:');
        console.log(`Quality threshold: ${data.premiumMetadata.qualityThreshold}`);
        console.log(`Focus: ${data.premiumMetadata.focus}`);
        console.log(`Source types: ${data.premiumMetadata.sourceTypes?.join(', ')}`);
        console.log('✅ Premium metadata present - using premium service!');
      } else {
        console.log('\\n❌ No premium metadata - NOT using premium service');
      }
      
      // Sample analysis content
      if (data.analysis?.content) {
        console.log('\\n📋 ANALYSIS SAMPLE (first 200 chars):');
        console.log(`"${data.analysis.content.substring(0, 200)}..."`);
      }
      
    } else {
      console.error('❌ Invalid API response');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ BACKEND NOT RUNNING!');
      console.log('💡 Please start the backend:');
      console.log('   cd backend');
      console.log('   npm start');
    } else {
      console.error('❌ API test failed:', error.message);
    }
  }
  
  console.log('\\n🏁 API ROUTE TEST COMPLETE');
}

testApiRoute().catch(console.error);