// checkMistralExports.js - Debug what's actually exported
console.log('🔍 CHECKING MISTRAL PACKAGE EXPORTS');
console.log('='.repeat(50));

try {
  console.log('\n1️⃣ Trying default import...');
  const mistralDefault = await import('@mistralai/mistralai');
  console.log('Default export:', Object.keys(mistralDefault));
  console.log('Default export type:', typeof mistralDefault.default);
  console.log('Default export:', mistralDefault.default);
  
  console.log('\n2️⃣ Trying named import...');
  if (mistralDefault.MistralClient) {
    console.log('✅ Found MistralClient in named export');
    console.log('MistralClient type:', typeof mistralDefault.MistralClient);
  } else {
    console.log('❌ MistralClient not found in named export');
  }
  
  console.log('\n3️⃣ Checking default.MistralClient...');
  if (mistralDefault.default && mistralDefault.default.MistralClient) {
    console.log('✅ Found MistralClient in default.MistralClient');
    console.log('Type:', typeof mistralDefault.default.MistralClient);
  } else {
    console.log('❌ MistralClient not found in default.MistralClient');
  }
  
  console.log('\n4️⃣ All available exports:');
  console.log('Named exports:', Object.keys(mistralDefault));
  if (mistralDefault.default) {
    console.log('Default export keys:', Object.keys(mistralDefault.default));
  }
  
  console.log('\n5️⃣ Testing different import patterns...');
  
  // Test pattern 1: Direct default
  if (typeof mistralDefault.default === 'function') {
    console.log('✅ Pattern 1: Default is a constructor');
    try {
      const client1 = new mistralDefault.default('test-key');
      console.log('✅ Pattern 1 works!');
    } catch (e) {
      console.log('❌ Pattern 1 failed:', e.message);
    }
  }
  
  // Test pattern 2: Named export
  if (mistralDefault.MistralClient) {
    console.log('✅ Pattern 2: Named MistralClient');
    try {
      const client2 = new mistralDefault.MistralClient('test-key');
      console.log('✅ Pattern 2 works!');
    } catch (e) {
      console.log('❌ Pattern 2 failed:', e.message);
    }
  }
  
  // Test pattern 3: Default.MistralClient
  if (mistralDefault.default && mistralDefault.default.MistralClient) {
    console.log('✅ Pattern 3: default.MistralClient');
    try {
      const client3 = new mistralDefault.default.MistralClient('test-key');
      console.log('✅ Pattern 3 works!');
    } catch (e) {
      console.log('❌ Pattern 3 failed:', e.message);
    }
  }
  
} catch (error) {
  console.error('❌ Error importing Mistral package:', error);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 EXPORT CHECK COMPLETE');
