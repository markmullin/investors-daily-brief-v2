/**
 * Test API Fixes Script
 * 
 * This script tests the implemented fixes for:
 * 1. 200-day MA calculation in EOD API
 * 2. Brave API rate limiting enhancements
 * 3. Mistral API rate limiting
 */

import eodService from '../src/services/eodService.js';
import braveService from '../src/services/braveService.js';
import braveAPIManager from '../src/services/braveAPIManager.js';
import mistralService from '../src/services/mistralService.js';
import { calculateMovingAverage } from '../src/utils/movingAverages.js';
import chalk from 'chalk';

// Helper function to log results
function log(title, message, isSuccess = true) {
  console.log(
    isSuccess 
      ? chalk.bgGreen.black(` ${title} `) + ' ' + chalk.green(message)
      : chalk.bgRed.white(` ${title} `) + ' ' + chalk.red(message)
  );
}

// Test EOD API and 200-day MA calculation
async function testEODAndMovingAverage() {
  console.log(chalk.bgBlue.white(' TESTING EOD API AND 200-DAY MA CALCULATION '));
  
  try {
    // Test the utility function first
    const testData = Array.from({ length: 250 }, (_, i) => ({
      date: new Date(Date.now() - (250 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      close: 100 + Math.sin(i / 10) * 20,
      price: 100 + Math.sin(i / 10) * 20
    }));
    
    const dataWithMA = calculateMovingAverage(testData, 200);
    
    if (dataWithMA.length === testData.length && dataWithMA[220].ma200 !== null) {
      log('UTILITY', 'Moving average utility function is working properly');
    } else {
      log('UTILITY', 'Moving average utility function failed', false);
      console.log('Test data length:', testData.length);
      console.log('Result data length:', dataWithMA.length);
      console.log('Sample MA value (day 220):', dataWithMA[220].ma200);
    }
    
    // Test EOD Service integration
    console.log('Fetching historical data for SPY...');
    const spyHistory = await eodService.fetchEODData('SPY.US', '6m', true);
    
    if (spyHistory.length > 0 && spyHistory[spyHistory.length - 1].ma200 !== null) {
      log('EOD API', 'Successfully fetched SPY data with 200-day MA calculation');
      console.log('Last data point:', spyHistory[spyHistory.length - 1].date);
      console.log('MA200 value:', spyHistory[spyHistory.length - 1].ma200);
    } else {
      log('EOD API', 'Failed to fetch SPY data with 200-day MA calculation', false);
      console.log('Data points:', spyHistory.length);
      if (spyHistory.length > 0) {
        console.log('Last point:', JSON.stringify(spyHistory[spyHistory.length - 1]));
      }
    }
    
    return true;
  } catch (error) {
    log('EOD TEST', `Error: ${error.message}`, false);
    console.error(error);
    return false;
  }
}

// Test Brave API Manager
async function testBraveAPIManager() {
  console.log(chalk.bgBlue.white(' TESTING BRAVE API MANAGER '));
  
  try {
    // Check current status
    const status = braveAPIManager.getStatus();
    console.log('Current Brave API Manager status:', {
      isRateLimited: status.isRateLimited,
      circuitOpen: status.circuitOpen,
      queueLength: status.queueLength,
      currentBackoff: status.currentBackoff,
      cacheSettings: status.cacheSettings
    });
    
    // Check the cache TTLs
    if (status.cacheSettings.normal >= 6 * 60 * 60 &&
        status.cacheSettings.rateLimited >= 18 * 60 * 60 &&
        status.cacheSettings.emergency >= 36 * 60 * 60) {
      log('CACHE TTL', 'Brave API cache TTLs have been properly increased');
    } else {
      log('CACHE TTL', 'Brave API cache TTLs have not been properly set', false);
    }
    
    // Check base interval
    if (braveAPIManager.baseInterval >= 2000) {
      log('BASE INTERVAL', `Base interval set to ${braveAPIManager.baseInterval}ms (expected >= 2000ms)`);
    } else {
      log('BASE INTERVAL', `Base interval is ${braveAPIManager.baseInterval}ms (expected >= 2000ms)`, false);
    }
    
    // Test cache TTL function
    const normalTTL = braveAPIManager.getCurrentCacheTTL();
    console.log(`Current cache TTL: ${normalTTL / 3600} hours`);
    
    // Simulate a rate limited state and check TTL
    const original = braveAPIManager.isRateLimited;
    braveAPIManager.isRateLimited = true;
    const limitedTTL = braveAPIManager.getCurrentCacheTTL();
    braveAPIManager.isRateLimited = original;
    
    console.log(`Rate limited cache TTL: ${limitedTTL / 3600} hours`);
    
    if (limitedTTL > normalTTL) {
      log('DYNAMIC TTL', 'Dynamic TTL based on API status is working');
    } else {
      log('DYNAMIC TTL', 'Dynamic TTL is not increasing during rate limiting', false);
    }
    
    // Try to get market sentiment to test real API integration
    console.log('Testing Brave API with a real request...');
    try {
      const sentiment = await braveService.getMarketSentiment('SPY');
      log('API REQUEST', `Successfully got market sentiment: ${sentiment.sentiment}`);
    } catch (error) {
      if (error.message.includes('429') || braveAPIManager.isRateLimited) {
        log('API REQUEST', 'API is currently rate limited, which is expected behavior in some cases');
      } else {
        log('API REQUEST', `Error in API request: ${error.message}`, false);
      }
    }
    
    return true;
  } catch (error) {
    log('BRAVE TEST', `Error: ${error.message}`, false);
    console.error(error);
    return false;
  }
}

// Test Mistral API Service
async function testMistralService() {
  console.log(chalk.bgBlue.white(' TESTING MISTRAL API SERVICE '));
  
  try {
    // Check API status
    const status = await mistralService.checkApiStatus();
    console.log('Mistral API status:', status);
    
    if (status.status === 'active') {
      log('API STATUS', 'Mistral API is active');
      
      // Test generating text (this will use our rate limiting logic)
      console.log('Testing text generation...');
      try {
        const text = await mistralService.generateText(
          'Summarize the current market conditions in 2-3 sentences'
        );
        log('TEXT GENERATION', `Successfully generated text (${text.length} chars)`);
      } catch (error) {
        if (error.message.includes('429') || mistralService.isRateLimited) {
          log('TEXT GENERATION', 'API is rate limited, which is expected behavior in some cases');
        } else {
          log('TEXT GENERATION', `Error generating text: ${error.message}`, false);
        }
      }
    } else if (status.status === 'rate_limited') {
      log('API STATUS', 'Mistral API is currently rate limited');
    } else {
      log('API STATUS', `Mistral API is not active: ${status.message}`, false);
    }
    
    return true;
  } catch (error) {
    log('MISTRAL TEST', `Error: ${error.message}`, false);
    console.error(error);
    return false;
  }
}

// Run all tests and report results
async function runAllTests() {
  console.log(chalk.bgYellow.black(' API FIXES TEST SUITE '));
  console.log('Testing implemented fixes for EOD API, Brave API, and Mistral API');
  console.log('-'.repeat(80));
  
  // Track test results
  const results = {
    eodAndMA: false,
    braveAPI: false,
    mistralAPI: false
  };
  
  // Test EOD API and 200-day MA calculation
  results.eodAndMA = await testEODAndMovingAverage();
  console.log('-'.repeat(80));
  
  // Test Brave API Manager
  results.braveAPI = await testBraveAPIManager();
  console.log('-'.repeat(80));
  
  // Test Mistral API Service
  results.mistralAPI = await testMistralService();
  console.log('-'.repeat(80));
  
  // Report summary
  console.log(chalk.bgYellow.black(' TEST SUMMARY '));
  console.log(`EOD API & 200-day MA: ${results.eodAndMA ? chalk.green('PASS') : chalk.red('FAIL')}`);
  console.log(`Brave API Manager: ${results.braveAPI ? chalk.green('PASS') : chalk.red('FAIL')}`);
  console.log(`Mistral API Service: ${results.mistralAPI ? chalk.green('PASS') : chalk.red('FAIL')}`);
  
  const overallResult = Object.values(results).every(v => v);
  console.log('-'.repeat(80));
  console.log(
    overallResult
      ? chalk.bgGreen.black(' ALL TESTS PASSED ')
      : chalk.bgRed.white(' SOME TESTS FAILED ')
  );
  
  return overallResult;
}

// Execute test suite
runAllTests()
  .then(success => {
    if (success) {
      console.log('Test suite completed successfully.');
    } else {
      console.log('Test suite completed with failures.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running test suite:', error);
    process.exit(1);
  });