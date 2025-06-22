import express from 'express';
import edgarService from '../services/edgarService.js';
import fmpMarketDataService from '../services/fmpMarketDataService.js'; // NEW: Use FMP for fundamentals
import eodService from '../services/eodService.js';

const router = express.Router();

// Get company fundamental data - NOW POWERED BY FMP
router.get('/fundamentals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔍 Fetching comprehensive fundamentals for ${symbol} via FMP`);
    
    // Use FMP service for comprehensive fundamentals data
    const fundamentalsData = await fmpMarketDataService.getFundamentals(symbol);
    
    console.log(`✅ Successfully retrieved FMP fundamentals for ${symbol}`);
    console.log(`📊 Data includes: ${fundamentalsData.fiscalData?.Revenues?.quarterly?.length || 0} revenue quarters`);
    
    res.json(fundamentalsData);
  } catch (error) {
    console.error('❌ Error fetching FMP fundamentals:', error);
    
    // Fallback to EDGAR if FMP fails
    try {
      console.log(`🔄 Falling back to EDGAR for ${symbol}`);
      
      const [secData, priceData] = await Promise.all([
        edgarService.getCompanyFacts(symbol),
        eodService.getSingleStockData(symbol)
      ]);
      
      // Calculate P/E ratio with current price
      if (secData.fundamentals.eps && priceData.price) {
        secData.fundamentals.pe = priceData.price / secData.fundamentals.eps;
      }
      
      // Calculate P/B ratio
      if (secData.fundamentals.bookValuePerShare && priceData.price) {
        secData.fundamentals.pb = priceData.price / secData.fundamentals.bookValuePerShare;
      }
      
      // Combine SEC data with current market data
      const result = {
        symbol,
        companyName: secData.companyName,
        currentPrice: priceData.price,
        marketCap: priceData.marketCap,
        fundamentals: secData.fundamentals,
        fiscalData: secData.fiscalData,
        lastUpdated: new Date().toISOString(),
        dataSource: 'EDGAR_FALLBACK'
      };
      
      console.log(`✅ EDGAR fallback successful for ${symbol}`);
      res.json(result);
    } catch (fallbackError) {
      console.error('❌ Both FMP and EDGAR failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to fetch fundamental data',
        message: `FMP Error: ${error.message}. EDGAR Fallback Error: ${fallbackError.message}`,
        suggestion: 'Try again later or check if the symbol is valid'
      });
    }
  }
});

// Get company profile - NEW FMP-powered endpoint
router.get('/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🏢 Fetching company profile for ${symbol} via FMP`);
    
    const profile = await fmpMarketDataService.getCompanyProfile(symbol);
    
    if (profile) {
      console.log(`✅ Retrieved company profile for ${profile.companyName}`);
      res.json(profile);
    } else {
      res.status(404).json({ 
        error: 'Company profile not found',
        message: `No profile data available for ${symbol}`
      });
    }
  } catch (error) {
    console.error('❌ Error fetching company profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company profile',
      message: error.message 
    });
  }
});

// Get financial statements - NEW FMP-powered endpoints
router.get('/income-statement/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 20 } = req.query;
    
    console.log(`💰 Fetching income statement for ${symbol} (${period})`);
    
    const data = await fmpMarketDataService.getIncomeStatement(symbol, period, parseInt(limit));
    
    console.log(`✅ Retrieved ${data.length} income statements for ${symbol}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching income statement:', error);
    res.status(500).json({ 
      error: 'Failed to fetch income statement',
      message: error.message 
    });
  }
});

router.get('/balance-sheet/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 20 } = req.query;
    
    console.log(`🏦 Fetching balance sheet for ${symbol} (${period})`);
    
    const data = await fmpMarketDataService.getBalanceSheet(symbol, period, parseInt(limit));
    
    console.log(`✅ Retrieved ${data.length} balance sheets for ${symbol}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching balance sheet:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance sheet',
      message: error.message 
    });
  }
});

router.get('/cash-flow/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 20 } = req.query;
    
    console.log(`💸 Fetching cash flow statement for ${symbol} (${period})`);
    
    const data = await fmpMarketDataService.getCashFlowStatement(symbol, period, parseInt(limit));
    
    console.log(`✅ Retrieved ${data.length} cash flow statements for ${symbol}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching cash flow statement:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cash flow statement',
      message: error.message 
    });
  }
});

router.get('/key-metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 20 } = req.query;
    
    console.log(`📊 Fetching key metrics for ${symbol} (${period})`);
    
    const data = await fmpMarketDataService.getKeyMetrics(symbol, period, parseInt(limit));
    
    console.log(`✅ Retrieved ${data.length} key metrics for ${symbol}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching key metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch key metrics',
      message: error.message 
    });
  }
});

// Get recent filings for a company - EDGAR-powered (still useful)
router.get('/filings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { types } = req.query; // Optional: filter by form types
    
    const formTypes = types ? types.split(',') : ['10-K', '10-Q', '8-K'];
    
    console.log(`📄 Fetching EDGAR filings for ${symbol}, types: ${formTypes}`);
    
    const filings = await edgarService.getCompanyFilings(symbol, formTypes);
    
    console.log(`✅ Retrieved ${filings.length} filings for ${symbol}`);
    res.json(filings);
  } catch (error) {
    console.error('❌ Error fetching filings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch filings',
      message: error.message 
    });
  }
});

// Get insider transactions - EDGAR-powered
router.get('/insider/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`👥 Fetching insider transactions for ${symbol}`);
    
    const transactions = await edgarService.getInsiderTransactions(symbol);
    
    console.log(`✅ Retrieved ${transactions.length} insider transactions for ${symbol}`);
    res.json(transactions);
  } catch (error) {
    console.error('❌ Error fetching insider transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch insider transactions',
      message: error.message 
    });
  }
});

// Search companies - Enhanced with FMP
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters' 
      });
    }
    
    console.log(`🔍 Searching companies with query: ${q}`);
    
    try {
      // Try FMP search first (more comprehensive)
      const fmpResults = await fmpMarketDataService.searchCompanies(q);
      
      if (fmpResults && fmpResults.length > 0) {
        console.log(`✅ Found ${fmpResults.length} companies via FMP search`);
        res.json(fmpResults);
        return;
      }
    } catch (fmpError) {
      console.log(`⚠️ FMP search failed, falling back to EDGAR:`, fmpError.message);
    }
    
    // Fallback to EDGAR search
    const results = await edgarService.searchCompanies(q);
    console.log(`✅ Found ${results.length} companies via EDGAR search`);
    res.json(results);
    
  } catch (error) {
    console.error('❌ Error searching companies:', error);
    res.status(500).json({ 
      error: 'Failed to search companies',
      message: error.message 
    });
  }
});

// Get financial comparison data for multiple symbols - Enhanced with FMP
router.post('/compare', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ 
        error: 'Please provide an array of symbols to compare' 
      });
    }
    
    console.log(`📊 Comparing fundamentals for: ${symbols.join(', ')} via FMP`);
    
    // Fetch FMP data for all symbols in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        const fundamentalsData = await fmpMarketDataService.getFundamentals(symbol);
        
        return {
          symbol,
          companyName: fundamentalsData.companyName,
          currentPrice: fundamentalsData.currentPrice,
          fundamentals: fundamentalsData.fundamentals,
          dataSource: 'FMP'
        };
      } catch (error) {
        console.error(`❌ FMP error for ${symbol}:`, error.message);
        
        // Fallback to EDGAR for this symbol
        try {
          const [secData, priceData] = await Promise.all([
            edgarService.getCompanyFacts(symbol),
            eodService.getSingleStockData(symbol)
          ]);
          
          // Calculate ratios
          if (secData.fundamentals.eps && priceData.price) {
            secData.fundamentals.pe = priceData.price / secData.fundamentals.eps;
          }
          if (secData.fundamentals.bookValuePerShare && priceData.price) {
            secData.fundamentals.pb = priceData.price / secData.fundamentals.bookValuePerShare;
          }
          
          return {
            symbol,
            companyName: secData.companyName,
            currentPrice: priceData.price,
            fundamentals: secData.fundamentals,
            dataSource: 'EDGAR_FALLBACK'
          };
        } catch (fallbackError) {
          console.error(`❌ Both FMP and EDGAR failed for ${symbol}:`, fallbackError.message);
          return {
            symbol,
            error: `FMP: ${error.message}, EDGAR: ${fallbackError.message}`,
            dataSource: 'ERROR'
          };
        }
      }
    });
    
    const results = await Promise.all(promises);
    
    const successCount = results.filter(r => !r.error).length;
    console.log(`✅ Successfully compared ${successCount}/${symbols.length} symbols`);
    
    res.json({
      comparison: results,
      timestamp: new Date().toISOString(),
      dataSource: 'FMP_WITH_EDGAR_FALLBACK'
    });
    
  } catch (error) {
    console.error('❌ Error comparing companies:', error);
    res.status(500).json({ 
      error: 'Failed to compare companies',
      message: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    console.log('🔍 Checking EDGAR/FMP service health...');
    
    const healthCheck = await fmpMarketDataService.healthCheck();
    
    res.json({
      status: 'healthy',
      services: {
        fmp: healthCheck,
        edgar: 'available'
      },
      timestamp: new Date().toISOString(),
      message: 'Financial data services are operational'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
