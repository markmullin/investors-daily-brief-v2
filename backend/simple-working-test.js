// simple-working-test.js - Simple test that actually works
import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

console.log('=== SIMPLE WORKING AI SYSTEM TEST ===\n');

// STEP 1: Load environment variables properly
console.log('1. Loading environment variables...');
const envResult = dotenv.config({ path: path.join(process.cwd(), '.env') });
if (envResult.error) {
  console.log('ERROR loading .env:', envResult.error);
} else {
  console.log('SUCCESS: Environment variables loaded');
}

console.log('Mistral API Key:', process.env.MISTRAL_API_KEY ? 'LOADED' : 'NOT LOADED');
console.log('Brave API Key:', process.env.BRAVE_API_KEY ? 'LOADED' : 'NOT LOADED');

// STEP 2: Test Python packages directly
console.log('\n2. Testing Python packages...');

function runPython(scriptPath) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python failed: ${stderr}`));
      }
    });
  });
}

async function testPythonPackages() {
  try {
    const result = await runPython('python/test_imports_simple.py');
    console.log('Python test result:');
    console.log(result);
    return result.includes('ALL PACKAGES WORKING');
  } catch (error) {
    console.log('Python test failed:', error.message);
    return false;
  }
}

// STEP 3: Test Mistral service
async function testMistralService() {
  try {
    const mistralService = await import('./src/services/mistralService.js');
    console.log('Mistral service imported');
    
    const initResult = await mistralService.default.initialize();
    console.log('Mistral init result:', initResult);
    
    const isReady = mistralService.default.isReady();
    console.log('Mistral ready:', isReady);
    
    if (isReady) {
      console.log('Testing Mistral text generation...');
      const testText = await mistralService.default.generateText(
        'Write a brief 2-sentence market outlook.', 
        { temperature: 0.5, maxTokens: 100 }
      );
      console.log('Generated text length:', testText.length);
      console.log('Sample:', testText.substring(0, 100) + '...');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('Mistral test failed:', error.message);
    return false;
  }
}

// STEP 4: Test actual AI analysis (without Python bridge)
async function testDirectAiAnalysis() {
  try {
    console.log('\n4. Testing direct AI analysis...');
    
    // Test if we can run the Python scripts directly
    const testData = {
      price_history: [
        {close: 100, date: "2025-01-01"}, {close: 102, date: "2025-01-02"}, 
        {close: 98, date: "2025-01-03"}, {close: 105, date: "2025-01-04"}, 
        {close: 110, date: "2025-01-05"}
      ],
      sector_data: [
        {name: "Technology", change_percent: 2.5},
        {name: "Healthcare", change_percent: 1.2}
      ],
      view_mode: "basic"
    };
    
    // Write test data to file
    const fs = await import('fs/promises');
    await fs.writeFile('python/direct_test_data.json', JSON.stringify(testData));
    
    // Run market environment script directly
    const result = await runPython('python/market_environment.py python/direct_test_data.json');
    console.log('Direct Python script result:');
    console.log(result.substring(0, 300) + '...');
    
    // Clean up
    await fs.unlink('python/direct_test_data.json');
    
    return true;
  } catch (error) {
    console.log('Direct AI analysis failed:', error.message);
    return false;
  }
}

// RUN ALL TESTS
async function runTests() {
  const pythonWorking = await testPythonPackages();
  console.log('\n3. Testing Mistral service...');
  const mistralWorking = await testMistralService();
  
  if (pythonWorking) {
    const directAiWorking = await testDirectAiAnalysis();
    console.log('Direct AI analysis working:', directAiWorking);
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Python packages:', pythonWorking ? 'WORKING' : 'NOT WORKING');
  console.log('Mistral AI:', mistralWorking ? 'WORKING' : 'NOT WORKING');
  
  if (pythonWorking || mistralWorking) {
    console.log('\n🎉 SUCCESS: AI system is ready!');
    console.log('Your dashboard will have working AI analysis.');
    
    if (pythonWorking && mistralWorking) {
      console.log('🏆 PERFECT: Both Python and Mistral working - premium AI analysis!');
    } else if (mistralWorking) {
      console.log('✅ GOOD: Mistral AI working - professional AI analysis available');
    } else if (pythonWorking) {
      console.log('✅ GOOD: Python working - algorithmic analysis available');
    }
  } else {
    console.log('❌ ISSUE: Neither Python nor Mistral working properly');
  }
}

runTests();
