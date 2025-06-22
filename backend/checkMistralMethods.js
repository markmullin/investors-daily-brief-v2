// checkMistralMethods.js - Check what methods are available on Mistral client
console.log('🔍 CHECKING MISTRAL CLIENT METHODS');
console.log('='.repeat(50));

try {
  console.log('\n1️⃣ Creating Mistral client...');
  const mistralModule = await import('@mistralai/mistralai');
  const MistralClass = mistralModule.Mistral;
  
  const client = new MistralClass(process.env.MISTRAL_API_KEY || 'test-key');
  console.log('✅ Client created successfully');
  
  console.log('\n2️⃣ Checking client methods...');
  console.log('Client type:', typeof client);
  console.log('Client constructor:', client.constructor.name);
  
  console.log('\n3️⃣ Available methods:');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
  console.log('Prototype methods:', methods);
  
  console.log('\n4️⃣ Direct properties:');
  const properties = Object.getOwnPropertyNames(client);
  console.log('Instance properties:', properties);
  
  console.log('\n5️⃣ Checking for common method names:');
  const commonMethods = ['listModels', 'models', 'chat', 'completions', 'complete', 'generate'];
  for (const method of commonMethods) {
    if (typeof client[method] === 'function') {
      console.log(`✅ ${method}(): function`);
    } else if (client[method]) {
      console.log(`📦 ${method}: ${typeof client[method]} (might have sub-methods)`);
      if (typeof client[method] === 'object') {
        console.log(`   Sub-methods:`, Object.getOwnPropertyNames(client[method]));
      }
    } else {
      console.log(`❌ ${method}: not found`);
    }
  }
  
  console.log('\n6️⃣ Testing chat method (most important)...');
  if (typeof client.chat === 'function') {
    console.log('✅ chat() method is available');
  } else if (client.chat && typeof client.chat.complete === 'function') {
    console.log('✅ chat.complete() method is available');
  } else if (client.completions && typeof client.completions.create === 'function') {
    console.log('✅ completions.create() method is available');
  } else {
    console.log('❌ No chat method found');
  }
  
} catch (error) {
  console.error('❌ Error checking Mistral methods:', error);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 METHOD CHECK COMPLETE');
