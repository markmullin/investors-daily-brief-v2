/**
 * RESEARCH ROUTES PATCH
 * Adds network-resilient fallbacks for research functionality
 */
import 'dotenv/config';

console.log('🔧 PATCHING RESEARCH ROUTES FOR NETWORK RESILIENCE...\n');

async function patchResearchRoutes() {
  try {
    // Read the original research.js file
    const fs = await import('fs/promises');
    const originalContent = await fs.readFile('./src/routes/research.js', 'utf8');
    
    // Check if already patched
    if (originalContent.includes('NETWORK_RESILIENT_PATCH')) {
      console.log('✅ Research routes already patched for network resilience');
      return;
    }
    
    console.log('📝 Adding network resilience patches...');
    
    // Create patched content with better error handling
    const patchedContent = originalContent.replace(
      `/**
 * Get comprehensive fundamental data for DCF analysis
 */
router.get('/fundamentals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;`,
      `/**
 * Get comprehensive fundamental data for DCF analysis
 * NETWORK_RESILIENT_PATCH: Added fallback for network issues
 */
router.get('/fundamentals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Quick validation
    if (!symbol || symbol.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol parameter'
      });
    }`
    ).replace(
      `} catch (error) {
    console.error(\`❌ [FUNDAMENTALS] Error for \${req.params.symbol}:\`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load fundamental data'
    });
  }`,
      `} catch (error) {
    console.error(\`❌ [FUNDAMENTALS] Error for \${req.params.symbol}:\`, error);
    
    // NETWORK_RESILIENT_PATCH: Provide meaningful fallback
    if (error.message?.includes('fetch failed') || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Network connectivity issue - external financial data temporarily unavailable',
        suggestion: 'Please check your internet connection and try again',
        networkIssue: true
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to load fundamental data',
      details: error.message
    });
  }`
    ).replace(
      `} catch (error) {
    console.error(\`❌ [COMPARABLE] Error for \${req.params.symbol}:\`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load comparable analysis'
    });
  }`,
      `} catch (error) {
    console.error(\`❌ [COMPARABLE] Error for \${req.params.symbol}:\`, error);
    
    // NETWORK_RESILIENT_PATCH: Provide meaningful fallback
    if (error.message?.includes('fetch failed') || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Network connectivity issue - comparable analysis temporarily unavailable',
        suggestion: 'Please check your internet connection and try again',
        networkIssue: true
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to load comparable analysis',
      details: error.message
    });
  }`
    );
    
    // Write the patched file
    await fs.writeFile('./src/routes/research.js', patchedContent);
    console.log('✅ Research routes patched successfully');
    
    // Create a simple test endpoint patch
    const testEndpointPatch = `

/**
 * NETWORK_RESILIENT_PATCH: Test endpoint for debugging
 */
router.get('/test-connectivity', async (req, res) => {
  try {
    const fmpApiKey = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    
    // Test FMP API connectivity
    const testResponse = await fetch(\`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=\${fmpApiKey}\`);
    const testData = await testResponse.json();
    
    res.json({
      success: true,
      message: 'External API connectivity working',
      fmpStatus: testResponse.ok ? 'Connected' : 'Failed',
      sampleData: testData[0]?.symbol || 'No data'
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Network connectivity issue detected',
      details: error.message,
      suggestion: 'Check firewall, antivirus, or network settings'
    });
  }
});

export default router;`;
    
    // Add test endpoint if not already present
    if (!patchedContent.includes('test-connectivity')) {
      const finalContent = patchedContent.replace('export default router;', testEndpointPatch);
      await fs.writeFile('./src/routes/research.js', finalContent);
      console.log('✅ Added connectivity test endpoint: /api/research/test-connectivity');
    }
    
    console.log('\n🎯 RESEARCH ROUTES PATCH COMPLETE!');
    console.log('✅ Added network resilience to fundamentals and comparable analysis routes');
    console.log('✅ Added helpful error messages for network issues');
    console.log('✅ Added connectivity test endpoint');
    console.log('\nRestart your backend server to apply the patches.');
    
  } catch (error) {
    console.error('❌ Failed to patch research routes:', error.message);
  }
}

patchResearchRoutes();