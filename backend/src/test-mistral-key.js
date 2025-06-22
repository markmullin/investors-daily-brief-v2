// test-mistral-key.js - Quick test for new Mistral API key
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testMistralKey() {
  console.log('🧪 Testing new Mistral API key...');
  console.log(`📝 Key prefix: ${process.env.MISTRAL_API_KEY?.substring(0, 10)}...`);
  
  try {
    // Import Mistral
    const { Mistral } = await import('@mistralai/mistralai');
    console.log('✅ Mistral module imported successfully');
    
    // Create client
    const client = new Mistral(process.env.MISTRAL_API_KEY);
    console.log('✅ Mistral client created');
    
    // Test with a simple prompt
    console.log('🔄 Testing chat completion...');
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ 
        role: "user", 
        content: "Say 'API key is working!' in exactly 5 words." 
      }],
      temperature: 0.1,
      max_tokens: 20
    });
    
    if (response?.choices?.[0]?.message?.content) {
      console.log('✅ SUCCESS! Response:', response.choices[0].message.content);
      console.log('\n🎉 New Mistral API key is WORKING! 🎉');
      return true;
    } else {
      console.error('❌ Invalid response structure');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message?.includes('401')) {
      console.error('🚨 Authentication failed - API key is invalid');
    }
    return false;
  }
}

// Run test
testMistralKey().then(success => {
  process.exit(success ? 0 : 1);
});
