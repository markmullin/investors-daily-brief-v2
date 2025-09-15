#!/usr/bin/env node

/**
 * Test Script for GPT-OSS-20B Integration
 * Run this after starting both the AI server and backend server
 */

import axios from 'axios';
import chalk from 'chalk';

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVER_URL = 'http://localhost:8080';

const tests = {
  async checkAIServer() {
    console.log(chalk.blue('\n🔍 Testing llama.cpp AI Server...'));
    try {
      const response = await axios.get(`${AI_SERVER_URL}/health`);
      console.log(chalk.green('✅ AI Server is running'));
      console.log(chalk.gray(`   Model: ${response.data.model || 'GPT-OSS-20B'}`));
      console.log(chalk.gray(`   Status: ${response.data.status}`));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ AI Server is not running'));
      console.log(chalk.yellow('   Run: npm run ai:server'));
      return false;
    }
  },

  async checkBackendIntegration() {
    console.log(chalk.blue('\n🔍 Testing Backend GPT-OSS Integration...'));
    try {
      const response = await axios.get(`${BACKEND_URL}/api/gpt-oss/health`);
      console.log(chalk.green('✅ Backend GPT-OSS route is working'));
      console.log(chalk.gray(`   GPU: ${response.data.gpu}`));
      console.log(chalk.gray(`   Performance: ${response.data.performance}`));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Backend GPT-OSS route not found'));
      console.log(chalk.yellow('   Add route to server.js: app.use("/api/gpt-oss", gptOSSRoutes)'));
      return false;
    }
  },

  async testMarketAnalysis() {
    console.log(chalk.blue('\n🔍 Testing Market Analysis Generation...'));
    try {
      const marketData = {
        sp500Price: 6466.92,
        sp500Change: 1.5,
        nasdaqPrice: 20000,
        nasdaqChange: 2.1,
        vix: 15,
        treasury10y: 4.5,
        marketPhase: 'BULL'
      };

      console.log(chalk.gray('   Sending market data...'));
      const start = Date.now();
      
      const response = await axios.post(
        `${BACKEND_URL}/api/gpt-oss/market-analysis`,
        marketData,
        { timeout: 60000 }
      );
      
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      
      console.log(chalk.green('✅ Market analysis generated successfully'));
      console.log(chalk.gray(`   Time: ${elapsed} seconds`));
      console.log(chalk.gray(`   Model: ${response.data.data.model}`));
      console.log(chalk.gray(`   Speed: ${response.data.data.tokens_per_second} tokens/sec`));
      console.log(chalk.cyan('\n   Analysis Preview:'));
      console.log(chalk.white('   ' + response.data.data.analysis.substring(0, 200) + '...'));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Market analysis generation failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      return false;
    }
  },

  async testExplanation() {
    console.log(chalk.blue('\n🔍 Testing Concept Explanation...'));
    try {
      const request = {
        concept: 'P/E ratio',
        context: {
          portfolio: { value: 50000 }
        }
      };

      console.log(chalk.gray('   Explaining P/E ratio...'));
      const start = Date.now();
      
      const response = await axios.post(
        `${BACKEND_URL}/api/gpt-oss/explain`,
        request,
        { timeout: 30000 }
      );
      
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      
      console.log(chalk.green('✅ Explanation generated successfully'));
      console.log(chalk.gray(`   Time: ${elapsed} seconds`));
      console.log(chalk.cyan('\n   Explanation:'));
      console.log(chalk.white('   ' + response.data.data.explanation));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Explanation generation failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      return false;
    }
  },

  async testGPUUsage() {
    console.log(chalk.blue('\n🔍 Checking GPU Usage...'));
    try {
      const response = await axios.get(`${BACKEND_URL}/api/gpt-oss/health`);
      
      if (response.data.gpu === 'RTX 5060') {
        console.log(chalk.green('✅ RTX 5060 GPU detected'));
        console.log(chalk.gray('   Run nvidia-smi to verify VRAM usage (~7GB expected)'));
        console.log(chalk.cyan('\n   Command: nvidia-smi'));
        return true;
      } else {
        console.log(chalk.yellow('⚠️ GPU not detected or different GPU in use'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('❌ Could not check GPU status'));
      return false;
    }
  }
};

async function runAllTests() {
  console.log(chalk.bold.magenta('\n===================================='));
  console.log(chalk.bold.magenta(' GPT-OSS-20B Integration Test Suite'));
  console.log(chalk.bold.magenta('===================================='));
  
  let passed = 0;
  let failed = 0;
  
  // Run tests in sequence
  const testFunctions = [
    tests.checkAIServer,
    tests.checkBackendIntegration,
    tests.testMarketAnalysis,
    tests.testExplanation,
    tests.testGPUUsage
  ];
  
  for (const test of testFunctions) {
    const result = await test();
    if (result) passed++;
    else failed++;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(chalk.bold.magenta('\n===================================='));
  console.log(chalk.bold.magenta(' Test Results'));
  console.log(chalk.bold.magenta('===================================='));
  console.log(chalk.green(`   ✅ Passed: ${passed}`));
  console.log(chalk.red(`   ❌ Failed: ${failed}`));
  
  if (failed === 0) {
    console.log(chalk.bold.green('\n🎉 All tests passed! GPT-OSS-20B is ready for production!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('1. Update frontend to use /api/gpt-oss endpoints'));
    console.log(chalk.gray('2. Remove old Mistral API calls'));
    console.log(chalk.gray('3. Monitor performance with nvidia-smi'));
  } else {
    console.log(chalk.bold.yellow('\n⚠️ Some tests failed. Please check the errors above.'));
    console.log(chalk.gray('\nTroubleshooting:'));
    console.log(chalk.gray('1. Ensure AI server is running: npm run ai:server'));
    console.log(chalk.gray('2. Check backend integration in server.js'));
    console.log(chalk.gray('3. Verify GPT-OSS model is downloaded'));
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Test suite error:'), error);
  process.exit(1);
});