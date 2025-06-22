// aiRoutes.fallback.js - Simple fallback AI routes that don't depend on Mistral
import express from 'express';

const router = express.Router();

// Get AI-powered market insights without using mistralService
router.get('/market-insights', async (req, res) => {
  try {
    // Return static fallback data
    return res.json({
      insights: [
        {
          title: 'Market Sentiment',
          description: 'Market sentiment remains positive with major indices showing resilience despite economic uncertainties.'
        },
        {
          title: 'Sector Rotation',
          description: 'Technology and Consumer Discretionary are leading while Utilities and Real Estate lag, indicating a risk-on environment.'
        },
        {
          title: 'Volatility Trends',
          description: 'VIX levels have decreased, suggesting investor confidence is improving and market stability is enhanced.'
        },
        {
          title: 'Earnings Growth',
          description: 'Recent earnings reports have exceeded expectations, providing support for current market valuations.'
        },
        {
          title: 'Economic Indicators',
          description: 'Leading economic indicators remain positive, supporting continued market strength in the near term.'
        }
      ],
      generatedAt: Date.now(),
      source: 'fallback'
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate market insights',
      details: error.message
    });
  }
});

// Get AI-powered market analysis without using mistralService
router.get('/market-analysis', async (req, res) => {
  try {
    // Return static fallback data
    return res.json({
      analysis: `Market conditions currently favor a cautiously optimistic approach. Technical indicators suggest a continuation of the bullish trend, with major indices maintaining positions above key moving averages. Breadth indicators are showing healthy participation across sectors, with particularly strong momentum in Technology and Financial stocks.

From a fundamental perspective, corporate earnings have outpaced analyst expectations this quarter, providing valuation support. The recent economic data points to moderate growth without significant inflation concerns, creating a favorable environment for equities. Consumer sentiment remains resilient despite higher interest rates.

Sector leadership is currently favoring growth-oriented segments, but value stocks are showing signs of relative strength as investors seek balanced exposure. The rotation pattern suggests institutional investors are maintaining core positions while gradually adjusting allocations toward quality companies with strong cash flows.

Risk factors to monitor include geopolitical tensions, potential shifts in monetary policy, and signs of consumer spending weakness. However, market resilience in the face of recent challenges suggests a strong underlying bid. Investors should maintain diversified exposure while focusing on companies with pricing power and operational efficiency.`,
      generatedAt: Date.now(),
      source: 'fallback'
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate market analysis',
      details: error.message
    });
  }
});

export default router;