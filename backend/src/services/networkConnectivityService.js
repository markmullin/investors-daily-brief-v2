import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

/**
 * *** NETWORK CONNECTIVITY SERVICE ***
 * 
 * Comprehensive Windows network connectivity diagnosis and resolution
 * for Financial Modeling Prep API access issues.
 * 
 * Addresses:
 * - Windows Firewall blocking Node.js external requests
 * - DNS resolution failures for financialmodelingprep.com
 * - Corporate proxy/firewall interference
 * - Network timeout and retry configuration
 */

class NetworkConnectivityService {
  constructor() {
    this.testEndpoint = 'https://financialmodelingprep.com/api/v3/quote/AAPL';
    this.apiKey = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    this.resolve4 = promisify(dns.resolve4);
    this.resolve = promisify(dns.resolve);
    
    console.log('🔧 [NETWORK SERVICE] Initialized with comprehensive Windows connectivity diagnostics');
  }

  /**
   * *** COMPREHENSIVE NETWORK DIAGNOSTICS ***
   */
  async runComprehensiveDiagnostics() {
    console.log('🔍 [NETWORK DIAGNOSTICS] Starting comprehensive connectivity analysis...');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      tests: {},
      overall: 'unknown',
      recommendations: []
    };

    try {
      // Test 1: DNS Resolution
      console.log('📡 [DNS TEST] Testing DNS resolution for financialmodelingprep.com...');
      diagnostics.tests.dns = await this.testDNSResolution();
      
      // Test 2: Basic Connectivity
      console.log('🌐 [CONNECTIVITY TEST] Testing basic HTTPS connectivity...');
      diagnostics.tests.connectivity = await this.testBasicConnectivity();
      
      // Test 3: FMP API Specific
      console.log('💰 [FMP API TEST] Testing Financial Modeling Prep API access...');
      diagnostics.tests.fmpApi = await this.testFMPApiAccess();
      
      // Test 4: Windows Firewall Detection
      console.log('🛡️ [FIREWALL TEST] Analyzing Windows Firewall configuration...');
      diagnostics.tests.firewall = await this.detectFirewallIssues();
      
      // Test 5: Network Environment
      console.log('🏢 [ENVIRONMENT TEST] Analyzing network environment...');
      diagnostics.tests.environment = await this.analyzeNetworkEnvironment();
      
      // Overall Assessment
      diagnostics.overall = this.assessOverallConnectivity(diagnostics.tests);
      diagnostics.recommendations = this.generateRecommendations(diagnostics.tests);
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`🎯 [OVERALL ASSESSMENT] ${diagnostics.overall.toUpperCase()}`);
      
      if (diagnostics.recommendations.length > 0) {
        console.log('📋 [RECOMMENDATIONS]');
        diagnostics.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }
      
      return diagnostics;
      
    } catch (error) {
      console.error('❌ [NETWORK DIAGNOSTICS] Comprehensive diagnostics failed:', error.message);
      diagnostics.overall = 'critical_failure';
      diagnostics.error = error.message;
      return diagnostics;
    }
  }

  /**
   * *** DNS RESOLUTION TEST ***
   */
  async testDNSResolution() {
    try {
      const hostname = 'financialmodelingprep.com';
      
      // Test IPv4 resolution
      const addresses = await this.resolve4(hostname);
      
      // Test general resolution with different record types
      const aRecords = await this.resolve(hostname, 'A');
      
      console.log(`✅ DNS Resolution: ${addresses.join(', ')}`);
      
      return {
        status: 'success',
        ipAddresses: addresses,
        aRecords: aRecords,
        hostname: hostname,
        message: 'DNS resolution working correctly'
      };
      
    } catch (error) {
      console.log(`❌ DNS Resolution Failed: ${error.message}`);
      
      const dnsServers = dns.getServers();
      console.log(`   Current DNS servers: ${dnsServers.join(', ')}`);
      
      return {
        status: 'failed',
        error: error.message,
        currentDnsServers: dnsServers,
        message: 'DNS resolution failing - consider using Google DNS (8.8.8.8, 8.8.4.4)'
      };
    }
  }

  /**
   * *** BASIC CONNECTIVITY TEST ***
   */
  async testBasicConnectivity() {
    try {
      // Test with a simple, reliable endpoint first
      const testUrl = 'https://httpbin.org/get';
      
      const response = await axios.get(testUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Investors-Daily-Brief/1.0 NetworkTest'
        }
      });
      
      console.log(`✅ Basic HTTPS Connectivity: Status ${response.status}`);
      
      return {
        status: 'success',
        httpStatus: response.status,
        message: 'Basic HTTPS connectivity working',
        testUrl: testUrl
      };
      
    } catch (error) {
      console.log(`❌ Basic Connectivity Failed: ${error.message}`);
      
      let errorType = 'unknown';
      let recommendation = 'Check network connection';
      
      if (error.code === 'ENOTFOUND') {
        errorType = 'dns_failure';
        recommendation = 'DNS resolution issue - check DNS settings';
      } else if (error.code === 'ECONNREFUSED') {
        errorType = 'connection_refused';
        recommendation = 'Connection refused - check firewall settings';
      } else if (error.code === 'ETIMEDOUT') {
        errorType = 'timeout';
        recommendation = 'Request timeout - check network speed and firewall';
      }
      
      return {
        status: 'failed',
        error: error.message,
        errorCode: error.code,
        errorType: errorType,
        recommendation: recommendation
      };
    }
  }

  /**
   * *** FMP API ACCESS TEST ***
   */
  async testFMPApiAccess() {
    try {
      const testUrl = `${this.testEndpoint}?apikey=${this.apiKey}`;
      
      const response = await axios.get(testUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300
      });
      
      console.log(`✅ FMP API Access: Status ${response.status}, Data received`);
      
      const data = response.data;
      const hasValidData = Array.isArray(data) && data.length > 0 && data[0].symbol;
      
      return {
        status: 'success',
        httpStatus: response.status,
        dataReceived: hasValidData,
        sampleData: hasValidData ? { symbol: data[0].symbol, price: data[0].price } : null,
        message: 'FMP API access working correctly'
      };
      
    } catch (error) {
      console.log(`❌ FMP API Access Failed: ${error.message}`);
      
      let diagnosis = 'Unknown API error';
      let priority = 'medium';
      
      if (error.code === 'ENOTFOUND') {
        diagnosis = 'Cannot resolve financialmodelingprep.com - DNS or firewall issue';
        priority = 'critical';
      } else if (error.code === 'ECONNREFUSED') {
        diagnosis = 'Connection refused - Windows Firewall likely blocking Node.js';
        priority = 'critical';
      } else if (error.code === 'ETIMEDOUT') {
        diagnosis = 'Request timeout - Firewall or proxy interference';
        priority = 'high';
      } else if (error.response?.status === 401) {
        diagnosis = 'API authentication failed - check API key';
        priority = 'medium';
      } else if (error.response?.status === 429) {
        diagnosis = 'API rate limit exceeded';
        priority = 'low';
      }
      
      return {
        status: 'failed',
        error: error.message,
        errorCode: error.code,
        httpStatus: error.response?.status,
        diagnosis: diagnosis,
        priority: priority
      };
    }
  }

  /**
   * *** WINDOWS FIREWALL DETECTION ***
   */
  async detectFirewallIssues() {
    try {
      // Test multiple endpoints to detect firewall patterns
      const testEndpoints = [
        'https://api.github.com/zen',
        'https://jsonplaceholder.typicode.com/posts/1',
        'https://httpbin.org/json'
      ];
      
      const results = [];
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          results.push({ endpoint, status: 'success', httpStatus: response.status });
        } catch (error) {
          results.push({ 
            endpoint, 
            status: 'failed', 
            error: error.code || error.message 
          });
        }
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      const firewallLikely = successCount === 0 && results.every(r => 
        r.error === 'ENOTFOUND' || r.error === 'ECONNREFUSED'
      );
      
      console.log(`🛡️ Firewall Analysis: ${successCount}/${testEndpoints.length} endpoints accessible`);
      
      return {
        status: firewallLikely ? 'firewall_detected' : 'firewall_unlikely',
        accessibleEndpoints: successCount,
        totalEndpoints: testEndpoints.length,
        firewallLikely: firewallLikely,
        testResults: results,
        message: firewallLikely ? 
          'Windows Firewall likely blocking Node.js external requests' :
          'Firewall does not appear to be blocking requests'
      };
      
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message,
        message: 'Could not determine firewall status'
      };
    }
  }

  /**
   * *** NETWORK ENVIRONMENT ANALYSIS ***
   */
  async analyzeNetworkEnvironment() {
    try {
      const environment = {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        networkInterfaces: Object.keys(require('os').networkInterfaces()),
        dnsServers: dns.getServers(),
        userAgent: 'Investors-Daily-Brief/1.0',
        timestamp: new Date().toISOString()
      };
      
      // Check for corporate/proxy indicators
      const hasProxyEnv = process.env.HTTP_PROXY || 
                         process.env.HTTPS_PROXY || 
                         process.env.http_proxy || 
                         process.env.https_proxy;
      
      environment.proxyDetected = !!hasProxyEnv;
      if (hasProxyEnv) {
        environment.proxyUrls = {
          http: process.env.HTTP_PROXY || process.env.http_proxy,
          https: process.env.HTTPS_PROXY || process.env.https_proxy
        };
      }
      
      console.log(`🏢 Environment: Node.js ${environment.nodeVersion} on ${environment.platform}`);
      if (environment.proxyDetected) {
        console.log(`   🔄 Proxy detected: May affect external API calls`);
      }
      
      return {
        status: 'analyzed',
        environment: environment,
        message: 'Network environment analysis complete'
      };
      
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        message: 'Could not analyze network environment'
      };
    }
  }

  /**
   * *** OVERALL CONNECTIVITY ASSESSMENT ***
   */
  assessOverallConnectivity(tests) {
    if (tests.fmpApi?.status === 'success') {
      return 'excellent';
    }
    
    if (tests.connectivity?.status === 'success' && tests.dns?.status === 'success') {
      return 'good_but_fmp_blocked';
    }
    
    if (tests.connectivity?.status === 'success') {
      return 'partial_connectivity';
    }
    
    if (tests.dns?.status === 'failed') {
      return 'dns_issues';
    }
    
    if (tests.firewall?.firewallLikely) {
      return 'firewall_blocking';
    }
    
    return 'connectivity_issues';
  }

  /**
   * *** GENERATE ACTIONABLE RECOMMENDATIONS ***
   */
  generateRecommendations(tests) {
    const recommendations = [];
    
    // DNS Issues
    if (tests.dns?.status === 'failed') {
      recommendations.push('🔧 DNS Fix: Change DNS servers to Google (8.8.8.8, 8.8.4.4) or Cloudflare (1.1.1.1)');
    }
    
    // Firewall Issues
    if (tests.firewall?.firewallLikely || tests.fmpApi?.priority === 'critical') {
      recommendations.push('🛡️ Firewall Fix: Add Windows Firewall exception for Node.js (C:\\Program Files\\nodejs\\node.exe)');
      recommendations.push('⚡ Quick Test: Temporarily disable Windows Defender Firewall to verify issue');
    }
    
    // FMP API Specific
    if (tests.fmpApi?.status === 'failed' && tests.fmpApi?.errorCode === 'ENOTFOUND') {
      recommendations.push('🌐 Network Fix: Verify internet connection and try mobile hotspot to isolate issue');
    }
    
    // Corporate Environment
    if (tests.environment?.proxyDetected) {
      recommendations.push('🏢 Proxy Config: Configure Node.js to work with corporate proxy settings');
    }
    
    // Alternative Testing
    if (tests.connectivity?.status === 'success' && tests.fmpApi?.status === 'failed') {
      recommendations.push('🔄 Alternative Test: Try different financial data API to isolate FMP-specific issues');
    }
    
    // General Recommendations
    if (recommendations.length === 0 && tests.fmpApi?.status !== 'success') {
      recommendations.push('🔧 General Fix: Restart Node.js application after network configuration changes');
      recommendations.push('📱 Network Test: Try mobile hotspot to bypass local network restrictions');
    }
    
    return recommendations;
  }

  /**
   * *** AUTOMATED WINDOWS FIREWALL FIX ***
   */
  async generateFirewallFix() {
    const batchContent = `@echo off
echo.
echo ====================================================================
echo   WINDOWS FIREWALL FIX FOR NODE.JS FMP API ACCESS
echo   Automated solution for network connectivity issues
echo ====================================================================
echo.

echo [STEP 1] Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ❌ Not running as Administrator
    echo.
    echo Please run this file as Administrator:
    echo 1. Right-click on fix-network-connectivity.bat
    echo 2. Select "Run as administrator" 
    echo 3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo [STEP 2] Adding Windows Firewall exceptions for Node.js...
echo.

REM Add outbound rule for Node.js
netsh advfirewall firewall add rule name="Node.js FMP API Outbound" dir=out action=allow program="C:\\Program Files\\nodejs\\node.exe" enable=yes
if %errorlevel% == 0 (
    echo ✅ Outbound rule added successfully
) else (
    echo ❌ Failed to add outbound rule
)

REM Add inbound rule for Node.js (in case needed)
netsh advfirewall firewall add rule name="Node.js FMP API Inbound" dir=in action=allow program="C:\\Program Files\\nodejs\\node.exe" enable=yes
if %errorlevel% == 0 (
    echo ✅ Inbound rule added successfully
) else (
    echo ❌ Failed to add inbound rule
)

echo.
echo [STEP 3] Testing DNS resolution...
echo.
ping -n 1 financialmodelingprep.com
if %errorlevel% == 0 (
    echo ✅ DNS resolution working
) else (
    echo ❌ DNS resolution failed
    echo.
    echo Configuring Google DNS servers...
    netsh interface ip set dns "Wi-Fi" static 8.8.8.8
    netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2
    echo ✅ DNS servers configured
    echo.
    echo Testing DNS again...
    ping -n 1 financialmodelingprep.com
)

echo.
echo [STEP 4] Testing HTTPS connectivity...
echo.
curl -I "https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1" --max-time 30
if %errorlevel% == 0 (
    echo ✅ HTTPS connectivity working
) else (
    echo ❌ HTTPS connectivity failed
    echo.
    echo Additional troubleshooting needed:
    echo 1. Check corporate firewall settings
    echo 2. Temporarily disable VPN if using one
    echo 3. Try mobile hotspot to isolate network issues
    echo 4. Contact IT department for proxy configuration
)

echo.
echo ====================================================================
echo [NETWORK FIX COMPLETE]
echo ====================================================================
echo.
echo Next steps:
echo 1. Restart your Node.js application (npm start)
echo 2. Test FMP API connectivity in your dashboard
echo 3. If issues persist, run network diagnostics again
echo.
pause`;

    return batchContent;
  }

  /**
   * *** PRODUCTION-READY AXIOS CONFIGURATION ***
   */
  getProductionAxiosConfig() {
    return {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500,
      retry: 3,
      retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000)
    };
  }
}

export default new NetworkConnectivityService();
