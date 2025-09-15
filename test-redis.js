/**
 * Test Redis Connection
 */

import redisService from './backend/src/services/redisService.js';

async function testRedis() {
  console.log('🔴 Testing Redis Connection...');
  
  try {
    // Test basic operations
    await redisService.set('test:key', 'test-value');
    const value = await redisService.get('test:key');
    
    if (value === 'test-value') {
      console.log('✅ Redis is working correctly!');
      
      // Test with JSON
      const testData = { phase: 'BULL', confidence: 75 };
      await redisService.setex('test:json', 60, JSON.stringify(testData));
      const jsonValue = await redisService.get('test:json');
      const parsed = JSON.parse(jsonValue);
      
      console.log('✅ JSON storage working:', parsed);
      
      // Clean up
      await redisService.del('test:key');
      await redisService.del('test:json');
      
      console.log('✅ All Redis tests passed!');
    } else {
      console.log('❌ Redis read/write mismatch');
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('\n📌 To fix Redis:');
    console.log('1. Make sure Redis is installed');
    console.log('2. Start Redis service:');
    console.log('   - Windows: redis-server (in WSL or Docker)');
    console.log('   - Or use: docker run -p 6379:6379 redis');
  }
  
  process.exit(0);
}

testRedis();
