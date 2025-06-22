/**
 * MISTRAL API DEBUG TEST - CommonJS Version
 */

require('dotenv').config({ path: './backend/.env' });

async function debugMistralAPI() {
  console.log('🔍 MISTRAL API DEBUG TEST');
  console.log('Testing direct Mistral API integration...');
  console.log('=' .repeat(50));
  
  const apiKey = process.env.MISTRAL_API_KEY;
  console.log(`✅ API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT FOUND'}`);
  
  if (!apiKey) {
    console.error('❌ MISTRAL_API_KEY not found in environment');
    console.log('Expected key: cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E');
    return;
  }
  
  if (apiKey !== 'cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E') {
    console.log('⚠️ API key mismatch detected');
    console.log('Expected: cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E');
    console.log(`Found: ${apiKey}`);
  }
  
  // Test 1: Try to import the SDK
  console.log('\n📍 TEST 1: SDK Import Test');
  try {
    const mistralModule = await import('@mistralai/mistralai');
    console.log('✅ Mistral SDK imported successfully');
    console.log('Available exports:', Object.keys(mistralModule));
    
    // Test different possible class names
    const possibleClasses = ['Mistral', 'MistralApi', 'Client', 'default'];
    let ClientClass = null;
    
    for (const className of possibleClasses) {
      if (mistralModule[className] && typeof mistralModule[className] === 'function') {
        console.log(`✅ Found client class: ${className}`);
        ClientClass = mistralModule[className];
        break;
      }
    }
    
    if (!ClientClass) {
      console.error('❌ No valid client class found');
      console.log('Available classes:', possibleClasses.map(c => `${c}: ${typeof mistralModule[c]}`));
      return;
    }
    
    // Test 2: Create client instance
    console.log('\n📍 TEST 2: Client Creation Test');
    let client;
    
    try {
      // Try different initialization patterns
      const patterns = [
        () => new ClientClass({ apiKey }),
        () => new ClientClass(apiKey),
        () => new ClientClass({ token: apiKey }),
        () => new ClientClass({ api_key: apiKey })
      ];
      
      for (let i = 0; i < patterns.length; i++) {
        try {
          client = patterns[i]();
          console.log(`✅ Client created with pattern ${i + 1}`);
          break;
        } catch (err) {
          console.log(`⚠️ Pattern ${i + 1} failed: ${err.message}`);
        }
      }
      
      if (!client) {
        throw new Error('All client creation patterns failed');
      }
      
    } catch (error) {
      console.error('❌ Client creation failed:', error.message);
      return;
    }
    
    // Test 3: Check available methods
    console.log('\n📍 TEST 3: Client Methods Test');
    const proto = Object.getPrototypeOf(client);
    const methods = Object.getOwnPropertyNames(proto).filter(name => typeof client[name] === 'function');
    console.log('Available methods:', methods);
    
    // Look for chat-related methods
    const chatMethods = methods.filter(m => m.toLowerCase().includes('chat'));
    console.log('Chat methods:', chatMethods);
    
    // Check for nested objects
    const nestedObjects = Object.keys(client).filter(key => typeof client[key] === 'object' && client[key] !== null);
    console.log('Nested objects:', nestedObjects);
    
    nestedObjects.forEach(obj => {
      if (client[obj] && typeof client[obj] === 'object') {
        const nestedMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client[obj]))
          .filter(name => typeof client[obj][name] === 'function');
        console.log(`${obj} methods:`, nestedMethods);
      }
    });
    
    // Test 4: Try API call
    console.log('\n📍 TEST 4: API Call Test');
    
    const testPrompt = "Say 'Hello from Mistral AI' in exactly 5 words.";
    
    // Try different API call patterns
    const apiPatterns = [
      // Pattern 1: client.chat.complete
      async () => {
        if (client.chat && typeof client.chat.complete === 'function') {
          return await client.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 20
          });
        }
        throw new Error('client.chat.complete not available');
      },
      
      // Pattern 2: client.chat.completions.create
      async () => {
        if (client.chat && client.chat.completions && typeof client.chat.completions.create === 'function') {
          return await client.chat.completions.create({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 20
          });
        }
        throw new Error('client.chat.completions.create not available');
      },
      
      // Pattern 3: client.completions.create
      async () => {
        if (client.completions && typeof client.completions.create === 'function') {
          return await client.completions.create({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 20
          });
        }
        throw new Error('client.completions.create not available');
      },
      
      // Pattern 4: direct client.chat method
      async () => {
        if (typeof client.chat === 'function') {
          return await client.chat({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 20
          });
        }
        throw new Error('client.chat not available');
      }
    ];
    
    let response = null;
    let workingPattern = -1;
    
    for (let i = 0; i < apiPatterns.length; i++) {
      try {
        console.log(`Trying API pattern ${i + 1}...`);
        response = await Promise.race([
          apiPatterns[i](),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        workingPattern = i + 1;
        console.log(`✅ API pattern ${i + 1} succeeded!`);
        break;
        
      } catch (error) {
        console.log(`⚠️ API pattern ${i + 1} failed: ${error.message}`);
      }
    }
    
    if (response) {
      console.log('\n✅ MISTRAL API CALL SUCCESSFUL!');
      console.log('Response structure:', Object.keys(response));
      console.log('Working pattern:', workingPattern);
      
      if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log('Generated text:', response.choices[0].message.content);
      } else {
        console.log('Full response:', response);
      }
      
      console.log('\n🎉 MISTRAL INTEGRATION READY!');
      console.log(`✅ Use API pattern ${workingPattern} in production code`);
      
      // Provide specific fix for production code
      console.log('\n🔧 PRODUCTION CODE FIX:');
      if (workingPattern === 1) {
        console.log('Use: mistralClient.chat.complete(requestData)');
      } else if (workingPattern === 2) {
        console.log('Use: mistralClient.chat.completions.create(requestData)');
      } else if (workingPattern === 3) {
        console.log('Use: mistralClient.completions.create(requestData)');
      } else if (workingPattern === 4) {
        console.log('Use: mistralClient.chat(requestData)');
      }
      
    } else {
      console.log('\n❌ ALL API PATTERNS FAILED');
      console.log('Mistral API integration not working');
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('1. Verify API key is correct: cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E');
      console.log('2. Check network connectivity');
      console.log('3. Try updating Mistral SDK: npm install @mistralai/mistralai@latest');
      console.log('4. Check Mistral API status at https://status.mistral.ai/');
    }
    
  } catch (error) {
    console.error('❌ SDK Import failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Install Mistral SDK: npm install @mistralai/mistralai --save');
    console.log('2. Check package.json for correct version');
    console.log('3. Clear node_modules and reinstall: rm -rf node_modules && npm install');
    console.log('4. Make sure you\'re in the backend directory with "type": "module"');
  }
  
  console.log('\n🏁 MISTRAL DEBUG TEST COMPLETE');
}

debugMistralAPI().catch(console.error);