import express from 'express';
import earningsThemeExtractionService from '../services/earningsThemeExtractionService.js';
import earningsAnalysisService from '../services/earningsAnalysisService.js';

const router = express.Router();

/**
 * Theme Discovery API Routes
 * Enable users to discover stocks based on investment themes
 */

// Discover stocks by theme
router.get('/discover/:theme', async (req, res) => {
  try {
    const { theme } = req.params;
    const { category, sentiment, importance, limit = 20 } = req.query;
    
    console.log(`🔍 [THEME API] Discovering stocks for theme: ${theme}`);
    
    const stocks = await earningsThemeExtractionService.discoverStocksByTheme(theme, {
      category,
      sentiment,
      importance,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      theme,
      stockCount: stocks.length,
      stocks
    });
  } catch (error) {
    console.error('❌ [THEME API] Discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover stocks by theme'
    });
  }
});

// Get trending themes
router.get('/trending', async (req, res) => {
  try {
    const { days = 90, limit = 20 } = req.query;
    
    console.log('📈 [THEME API] Getting trending themes');
    
    const themes = await earningsThemeExtractionService.getTrendingThemes({
      days: parseInt(days),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      themes
    });
  } catch (error) {
    console.error('❌ [THEME API] Trending themes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending themes'
    });
  }
});

// Extract themes for a specific company
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 12 } = req.query;
    
    console.log(`🏢 [THEME API] Extracting themes for ${symbol}`);
    
    const themes = await earningsThemeExtractionService.extractCompanyThemes(
      symbol.toUpperCase(),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      ...themes
    });
  } catch (error) {
    console.error('❌ [THEME API] Company themes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract company themes'
    });
  }
});

// Get theme suggestions based on keywords
router.get('/suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword parameter required'
      });
    }
    
    console.log(`💡 [THEME API] Getting suggestions for: ${keyword}`);
    
    // Get trending themes that match the keyword
    const allThemes = await earningsThemeExtractionService.getTrendingThemes({
      days: 180,
      limit: 100
    });
    
    const suggestions = allThemes
      .filter(t => t.theme.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, 10);
    
    res.json({
      success: true,
      keyword,
      suggestions
    });
  } catch (error) {
    console.error('❌ [THEME API] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get theme suggestions'
    });
  }
});

// Analyze earnings with theme extraction
router.get('/earnings/:symbol/analyze', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 [THEME API] Analyzing earnings for ${symbol}`);
    
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(
      symbol.toUpperCase()
    );
    
    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('❌ [THEME API] Earnings analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze earnings'
    });
  }
});

// Analyze specific transcript on demand
router.post('/earnings/:symbol/analyze-transcript', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { quarter, date } = req.body;
    
    if (!quarter && !date) {
      return res.status(400).json({
        success: false,
        error: 'Quarter or date required'
      });
    }
    
    console.log(`🎯 [THEME API] On-demand analysis for ${symbol} ${quarter || date}`);
    
    const analysis = await earningsAnalysisService.analyzeTranscriptOnDemand(
      symbol.toUpperCase(),
      quarter,
      date
    );
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ [THEME API] On-demand analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze transcript'
    });
  }
});

export default router;
