/**
 * Market Risk Positioning System - Integration Test
 * Tests the complete end-to-end functionality of the risk gauge system
 */

import chalk from 'chalk';
import axios from 'axios';

class RiskPositioningSystemTest {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.testResults = [];
  }

  async runAllTests() {
    console.log(chalk.blue.bold('🎯 MARKET RISK POSITIONING SYSTEM - INTEGRATION TEST'));
    console.log(chalk.blue('='.repeat(65)));
    console.log();

    try {
      // Test 1: Backend Health Check
      await this.testBackendHealth();

      // Test 2: Risk Score API
      await this.testRiskScoreAPI();

      // Test 3: Mode Switching
      await this.testModeSwitching();

      // Test 4: Score Simulation
      await this.testScoreSimulation();

      // Test 5: Historical Data
      await this.testHistoricalData();

      // Test 6: Educational Content
      await this.testEducationalContent();

      // Test 7: Component Breakdown
      await this.testComponentBreakdown();

      // Test 8: Authentication Integration
      await this.testAuthenticationIntegration();

      // Test 9: Performance Test
      await this.testPerformance();

      this.displayResults();

    } catch (error) {
      console.error(chalk.red.bold('❌ TEST SUITE FAILED:'), error.message);
      process.exit(1);
    }
  }

  async testBackendHealth() {
    console.log(chalk.yellow('📊 Testing Backend Health...'));
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.addResult('Backend Health', 'PASS', 'Backend is healthy and responsive');
        
        if (response.data.features && response.data.features.riskPositioning) {
          this.addResult('Risk Positioning Feature', 'PASS', 'Risk positioning feature is enabled');
        } else {
          this.addResult('Risk Positioning Feature', 'WARN', 'Risk positioning feature not reported in health check');
        }
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      this.addResult('Backend Health', 'FAIL', error.message);
      throw error;
    }
  }

  async testRiskScoreAPI() {
    console.log(chalk.yellow('🎯 Testing Risk Score API...'));
    
    try {
      // Test beginner mode
      const beginnerResponse = await axios.get(`${this.baseURL}/api/risk-positioning/current?mode=beginner`);
      
      if (beginnerResponse.status === 200) {
        const data = beginnerResponse.data;
        
        // Validate response structure
        if (data.success && typeof data.score === 'number' && data.score >= 0 && data.score <= 100) {
          this.addResult('Risk Score API - Beginner', 'PASS', `Score: ${data.score}, Mode: ${data.mode}`);
          
          // Validate required fields
          const requiredFields = ['gauge', 'analysis', 'interactiveFeatures', 'lastUpdate'];
          const missingFields = requiredFields.filter(field => !data[field]);
          
          if (missingFields.length === 0) {
            this.addResult('Response Structure', 'PASS', 'All required fields present');
          } else {
            this.addResult('Response Structure', 'WARN', `Missing fields: ${missingFields.join(', ')}`);
          }
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        throw new Error(`API returned status ${beginnerResponse.status}`);
      }

      // Test advanced mode
      const advancedResponse = await axios.get(`${this.baseURL}/api/risk-positioning/current?mode=advanced`);
      
      if (advancedResponse.status === 200 && advancedResponse.data.mode === 'advanced') {
        this.addResult('Risk Score API - Advanced', 'PASS', 'Advanced mode working correctly');
      } else {
        this.addResult('Risk Score API - Advanced', 'FAIL', 'Advanced mode not working');
      }

    } catch (error) {
      this.addResult('Risk Score API', 'FAIL', error.message);
    }
  }

  async testModeSwitching() {
    console.log(chalk.yellow('🔄 Testing Mode Switching...'));
    
    try {
      const response = await axios.post(`${this.baseURL}/api/risk-positioning/mode`, {
        mode: 'advanced'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 && response.data.mode === 'advanced') {
        this.addResult('Mode Switching', 'PASS', 'Mode switching API working correctly');
      } else {
        throw new Error('Mode switching failed');
      }
    } catch (error) {
      this.addResult('Mode Switching', 'FAIL', error.message);
    }
  }

  async testScoreSimulation() {
    console.log(chalk.yellow('🎮 Testing Score Simulation...'));
    
    try {
      const testScores = [25, 50, 75, 90];
      let passCount = 0;

      for (const score of testScores) {
        const response = await axios.get(`${this.baseURL}/api/risk-positioning/simulate/${score}`);
        
        if (response.status === 200 && response.data.score === score) {
          passCount++;
        }
      }

      if (passCount === testScores.length) {
        this.addResult('Score Simulation', 'PASS', `All ${testScores.length} simulation tests passed`);
      } else {
        this.addResult('Score Simulation', 'WARN', `${passCount}/${testScores.length} simulation tests passed`);
      }
    } catch (error) {
      this.addResult('Score Simulation', 'FAIL', error.message);
    }
  }

  async testHistoricalData() {
    console.log(chalk.yellow('📈 Testing Historical Data...'));
    
    try {
      const response = await axios.get(`${this.baseURL}/api/risk-positioning/historical?period=1month`);
      
      if (response.status === 200 && Array.isArray(response.data.data)) {
        this.addResult('Historical Data', 'PASS', `Retrieved ${response.data.data.length} historical data points`);
      } else {
        throw new Error('Historical data API failed');
      }
    } catch (error) {
      this.addResult('Historical Data', 'FAIL', error.message);
    }
  }

  async testEducationalContent() {
    console.log(chalk.yellow('📚 Testing Educational Content...'));
    
    try {
      const topics = ['risk-scoring', 'cycle-analysis', 'interactive-gauge'];
      let passCount = 0;

      for (const topic of topics) {
        const response = await axios.get(`${this.baseURL}/api/risk-positioning/education/${topic}`);
        
        if (response.status === 200 && response.data.education) {
          passCount++;
        }
      }

      if (passCount === topics.length) {
        this.addResult('Educational Content', 'PASS', `All ${topics.length} educational topics available`);
      } else {
        this.addResult('Educational Content', 'WARN', `${passCount}/${topics.length} educational topics available`);
      }
    } catch (error) {
      this.addResult('Educational Content', 'FAIL', error.message);
    }
  }

  async testComponentBreakdown() {
    console.log(chalk.yellow('📊 Testing Component Breakdown...'));
    
    try {
      const response = await axios.get(`${this.baseURL}/api/risk-positioning/components`);
      
      if (response.status === 200 && response.data.components) {
        const components = response.data.components;
        const expectedComponents = ['fundamental', 'technical', 'sentiment', 'macro'];
        
        const hasAllComponents = expectedComponents.every(comp => components[comp]);
        
        if (hasAllComponents) {
          this.addResult('Component Breakdown', 'PASS', 'All 4 risk components available');
        } else {
          this.addResult('Component Breakdown', 'WARN', 'Some risk components missing');
        }
      } else {
        throw new Error('Component breakdown API failed');
      }
    } catch (error) {
      this.addResult('Component Breakdown', 'FAIL', error.message);
    }
  }

  async testAuthenticationIntegration() {
    console.log(chalk.yellow('🔐 Testing Authentication Integration...'));
    
    try {
      // Test unauthenticated access (should still work)
      const publicResponse = await axios.get(`${this.baseURL}/api/risk-positioning/current`);
      
      if (publicResponse.status === 200) {
        this.addResult('Public Access', 'PASS', 'Risk positioning available without authentication');
      }

      // Test authenticated endpoints
      try {
        const personalizedResponse = await axios.get(`${this.baseURL}/api/risk-positioning/personalized`);
        // Should fail without auth
        this.addResult('Auth Protection', 'FAIL', 'Personalized endpoint accessible without auth');
      } catch (authError) {
        if (authError.response?.status === 401) {
          this.addResult('Auth Protection', 'PASS', 'Personalized endpoints properly protected');
        } else {
          this.addResult('Auth Protection', 'WARN', 'Unexpected auth behavior');
        }
      }
    } catch (error) {
      this.addResult('Authentication Integration', 'FAIL', error.message);
    }
  }

  async testPerformance() {
    console.log(chalk.yellow('⚡ Testing Performance...'));
    
    try {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = Array(5).fill().map(() => 
        axios.get(`${this.baseURL}/api/risk-positioning/current`)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const avgResponseTime = (endTime - startTime) / responses.length;
      
      if (avgResponseTime < 1000) { // Under 1 second
        this.addResult('Performance', 'PASS', `Average response time: ${avgResponseTime.toFixed(0)}ms`);
      } else if (avgResponseTime < 2000) { // Under 2 seconds
        this.addResult('Performance', 'WARN', `Average response time: ${avgResponseTime.toFixed(0)}ms (acceptable)`);
      } else {
        this.addResult('Performance', 'FAIL', `Average response time: ${avgResponseTime.toFixed(0)}ms (too slow)`);
      }
    } catch (error) {
      this.addResult('Performance', 'FAIL', error.message);
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    
    const statusColor = {
      'PASS': chalk.green,
      'WARN': chalk.yellow,
      'FAIL': chalk.red
    }[status];
    
    console.log(`  ${statusColor(status.padEnd(4))} ${test}: ${message}`);
  }

  displayResults() {
    console.log();
    console.log(chalk.blue.bold('📋 TEST RESULTS SUMMARY'));
    console.log(chalk.blue('='.repeat(40)));
    
    const counts = {
      PASS: this.testResults.filter(r => r.status === 'PASS').length,
      WARN: this.testResults.filter(r => r.status === 'WARN').length,
      FAIL: this.testResults.filter(r => r.status === 'FAIL').length
    };
    
    console.log(chalk.green(`✅ PASSED: ${counts.PASS}`));
    console.log(chalk.yellow(`⚠️  WARNINGS: ${counts.WARN}`));
    console.log(chalk.red(`❌ FAILED: ${counts.FAIL}`));
    console.log();
    
    if (counts.FAIL === 0) {
      console.log(chalk.green.bold('🎉 ALL TESTS COMPLETED SUCCESSFULLY!'));
      console.log(chalk.green('The Market Risk Positioning System is ready for production!'));
      console.log();
      console.log(chalk.blue('🎯 NEXT STEPS:'));
      console.log(chalk.white('1. Start the frontend development server:'));
      console.log(chalk.cyan('   npm run dev'));
      console.log();
      console.log(chalk.white('2. Navigate to the dashboard and test the interactive gauge:'));
      console.log(chalk.cyan('   http://localhost:5173'));
      console.log();
      console.log(chalk.white('3. Try the interactive features:'));
      console.log(chalk.white('   • Drag the gauge to explore different risk levels'));
      console.log(chalk.white('   • Switch between beginner and advanced modes'));
      console.log(chalk.white('   • View historical trends and component breakdowns'));
    } else {
      console.log(chalk.red.bold('❌ SOME TESTS FAILED'));
      console.log(chalk.red('Please fix the failing tests before proceeding to production.'));
    }
    
    console.log();
  }
}

// Run the test suite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RiskPositioningSystemTest();
  tester.runAllTests().catch((error) => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
}

export default RiskPositioningSystemTest;