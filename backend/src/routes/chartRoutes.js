// Chart routes for generating interactive visualizations
import express from 'express';
import chartService from '../services/chartService.js';
import pythonService from '../services/pythonService.js';
import mistralService from '../services/mistralService.js';

const router = express.Router();

/**
 * Generate a chart based on a natural language prompt
 * POST /api/chart/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required parameter: prompt',
        status: 'error'
      });
    }
    
    // Log the user prompt
    console.log(`Chart generation prompt: "${prompt}"`);
    
    // Generate the chart
    const result = await chartService.generateChart(prompt, options || {});
    
    return res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error generating chart:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to generate chart',
      status: 'error'
    });
  }
});

/**
 * Get detailed explanation for a generated chart
 * POST /api/chart/explain
 */
router.post('/explain', async (req, res) => {
  try {
    const { chartConfig, level = 'basic' } = req.body;
    
    if (!chartConfig) {
      return res.status(400).json({
        error: 'Missing required parameter: chartConfig',
        status: 'error'
      });
    }
    
    // Generate prompt for explanation
    const prompt = `
      Explain this ${chartConfig.type} chart about ${chartConfig.title || 'market data'} in a ${level} level of detail.
      
      Chart information:
      - Type: ${chartConfig.type}
      - Title: ${chartConfig.title || 'Untitled'}
      - Description: ${chartConfig.description || 'No description provided'}
      ${chartConfig.recommendation ? `- This chart type was selected because: ${chartConfig.recommendation.reasoning}` : ''}
      ${chartConfig.analysis ? `- Analysis performed: ${JSON.stringify(chartConfig.analysis)}` : ''}
      
      ${level === 'technical' ? 'Include technical details about the analysis and visualization choices.' : ''}
      ${level === 'educational' ? 'Explain how to interpret this type of chart and what specific patterns to look for.' : ''}
    `;
    
    // Get explanation from AI
    const explanation = await mistralService.generateText(prompt);
    
    return res.json({
      status: 'success',
      explanation,
      level
    });
  } catch (error) {
    console.error('Error explaining chart:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to explain chart',
      status: 'error'
    });
  }
});

/**
 * Get chart type recommendations for data
 * POST /api/chart/recommend
 */
router.post('/recommend', async (req, res) => {
  try {
    const { data, userPrompt } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Missing required parameter: data (must be an array)',
        status: 'error'
      });
    }
    
    // Get recommendation from Python service
    const recommendation = await pythonService.getChartRecommendation(
      data,
      userPrompt || '',
      req.body.additionalContext || {}
    );
    
    return res.json({
      status: 'success',
      recommendation
    });
  } catch (error) {
    console.error('Error getting chart recommendation:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to get chart recommendation',
      status: 'error'
    });
  }
});

/**
 * Analyze data with Python
 * POST /api/chart/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { data, analysisType, parameters } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Missing required parameter: data (must be an array)',
        status: 'error'
      });
    }
    
    if (!analysisType) {
      return res.status(400).json({
        error: 'Missing required parameter: analysisType',
        status: 'error'
      });
    }
    
    // Run analysis with Python service
    const analysisResults = await pythonService.runAnalysis(
      data,
      analysisType,
      parameters || {}
    );
    
    return res.json({
      status: 'success',
      analysis: analysisResults
    });
  } catch (error) {
    console.error('Error analyzing data:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to analyze data',
      status: 'error'
    });
  }
});

/**
 * Check service status
 * GET /api/chart/status
 */
router.get('/status', async (req, res) => {
  try {
    const pythonStatus = pythonService.getStatus();
    const mistralStatus = mistralService.getStatus();
    
    return res.json({
      status: 'success',
      services: {
        python: pythonStatus,
        mistral: mistralStatus
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error checking service status:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to check service status',
      status: 'error'
    });
  }
});

export default router;
