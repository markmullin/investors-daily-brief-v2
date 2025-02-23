import express from 'express';
import NodeCache from 'node-cache';
import eodService from '../services/eodService.js';
import errorTracker from '../utils/errorTracker.js';
import { featureFlags } from '../config/featureFlags.js';
import { relationshipAnalysis } from '../services/enhancedAnalysis/relationshipAnalysis.js';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const MACRO_GROUPS = {
  yields: {
    description: 'Treasury Yield Curve Analysis',
    symbols: ['SHY.US', 'IEF.US', 'TLT.US'],
    tooltipContent: {
      basic: "The Treasury yield curve compares rates across different bond maturities (short-term SHY, medium-term IEF, long-term TLT). This relationship is crucial for understanding economic expectations - a normal curve slopes upward, while an inverted curve (short-term rates higher than long-term) often predicts recessions.",
      advanced: "Monitor curve dynamics for regime shifts: 1) Curve steepening (long rates rising faster) often signals growth/inflation expectations 2) Flattening suggests Fed tightening impact 3) Inversion (2s10s, 3m10y) historically predicts recessions with 12-18 month lead time. Focus on real yields and curve shape changes rather than absolute levels for market implications."
    },
    tooltips: {
      'SHY.US': 'Short-term Treasury Bond ETF - Tracks short-term U.S. government bonds',
      'IEF.US': '7-10 Year Treasury Bond ETF - Tracks medium-term U.S. government bonds',
      'TLT.US': '20+ Year Treasury Bond ETF - Tracks long-term U.S. government bonds'
    }
  },
  stocksBonds: {
    description: 'Stocks vs Bonds Relationship',
    symbols: ['SPY.US', 'BND.US', 'JNK.US'],
    tooltipContent: {
      basic: "Compare stocks (SPY) with investment-grade bonds (BND) and high-yield 'junk' bonds (JNK). Traditional bonds often move opposite to stocks, providing portfolio protection. High-yield bonds tend to follow stocks more closely as they're more sensitive to economic conditions and corporate health.",
      advanced: "Key signals: 1) SPY/BND ratio shows risk appetite - rising ratio indicates 'risk-on' 2) JNK relative performance indicates credit stress - underperformance vs BND warns of market stress 3) Correlation breakdowns between SPY/JNK often precede volatility. Watch credit spreads and rate sensitivity (duration) impact. Bond market often leads stock market in identifying risks."
    },
    tooltips: {
      'SPY.US': 'S&P 500 ETF - Tracks the broad U.S. stock market',
      'BND.US': 'Total Bond Market ETF - Tracks the broad U.S. bond market',
      'JNK.US': 'High Yield Corporate Bond ETF - Tracks riskier corporate bonds'
    }
  },
  crypto: {
    description: 'Bitcoin vs Gold Performance',
    symbols: ['IBIT.US', 'GLD.US'],
    tooltipContent: {
      basic: "Compare traditional gold (GLD) with Bitcoin ETF (IBIT) performance. Both are often viewed as 'alternative currencies' and inflation hedges, but they can behave very differently. Gold typically performs well during market stress and inflation, while Bitcoin often shows higher correlation with risk assets.",
      advanced: "Monitor for regime shifts: 1) Gold outperformance often signals inflation/geopolitical concerns 2) Bitcoin strength can indicate risk appetite/tech sector health 3) Correlation patterns evolve as crypto market matures. Focus on institutional flows, regulatory developments, and macro factors like real rates. Digital vs physical safe-haven dynamics reveal changing market structure."
    },
    tooltips: {
      'IBIT.US': 'BlackRock iShares Bitcoin ETF - Tracks bitcoin price',
      'GLD.US': 'SPDR Gold Shares - Tracks gold bullion price'
    }
  },
  inflation: {
    description: 'Inflation Protection Analysis',
    symbols: ['TIPS.US', 'TLT.US'],
    tooltipContent: {
      basic: "Compare inflation-protected bonds (TIPS) with nominal Treasuries (TLT) to understand inflation expectations. When TIPS outperform, it suggests rising inflation concerns. TLT outperformance often indicates deflation fears or flight to safety during market stress.",
      advanced: "Key metrics: 1) TIPS/TLT spread indicates market-based inflation expectations 2) Real yield trends impact all asset classes 3) Duration risk affects both, but TIPS offer inflation protection. Watch breakeven inflation rates, Fed policy expectations, and commodity price trends. Relative performance often leads CPI prints by 3-6 months."
    },
    tooltips: {
      'TIPS.US': 'Treasury Inflation Protected Securities ETF',
      'TLT.US': '20+ Year Treasury Bond ETF'
    }
  },
  commodities: {
    description: 'Oil vs Dollar Relationship',
    symbols: ['USO.US', 'UUP.US'],
    tooltipContent: {
      basic: "Track the relationship between oil prices (USO) and the U.S. Dollar (UUP). Traditionally, they move inversely as a stronger dollar makes oil more expensive globally. This relationship affects global trade, inflation, and emerging markets performance.",
      advanced: "Monitor: 1) Correlation breakdowns often signal supply/demand shifts 2) Dollar strength impacts global financial conditions 3) Oil/Dollar dynamics affect global liquidity and carry trades. Focus on real rates, terms of trade, and petrodollar flows. Relationship crucial for understanding global macro regimes and cross-asset correlations."
    },
    tooltips: {
      'USO.US': 'United States Oil Fund - Tracks crude oil prices',
      'UUP.US': 'Invesco DB US Dollar Index Bullish Fund'
    }
  },
  global: {
    description: 'Global Market Relationships',
    symbols: ['EEM.US', 'EFA.US', 'UUP.US'],
    tooltipContent: {
      basic: "Compare emerging markets (EEM), developed markets (EFA), and U.S. Dollar (UUP) relationships. Dollar strength typically pressures emerging markets more than developed markets due to dollar-denominated debt. This relationship reveals global growth dynamics and risk appetite.",
      advanced: "Watch for: 1) EM/DM relative strength as global cycle indicator 2) Dollar impact varying by region/country 3) Decoupling suggesting regional/structural shifts. Focus on capital flows, current account positions, and carry trade dynamics. Local vs hard currency performance spread indicates stress. Monitor China impact on EM vs DM correlation."
    },
    tooltips: {
      'EEM.US': 'iShares MSCI Emerging Markets ETF',
      'EFA.US': 'iShares MSCI EAFE ETF - Developed Markets ex-US',
      'UUP.US': 'Invesco DB US Dollar Index Bullish Fund'
    }
  }
};

const calculatePercentageChanges = (data) => {
  const symbols = Object.keys(data);
  if (!symbols.length) return [];

  // Get the full date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  // Ensure all data arrays are sorted by date
  symbols.forEach(symbol => {
    data[symbol] = data[symbol]
      .filter(d => new Date(d.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  // Get base prices for each symbol using the first available price
  const basePrices = {};
  symbols.forEach(symbol => {
    if (data[symbol].length > 0) {
      basePrices[symbol] = data[symbol][0].close;
    }
  });

  // Get all unique dates
  const dateSet = new Set();
  symbols.forEach(symbol => {
    data[symbol].forEach(d => dateSet.add(d.date));
  });

  // Convert to array and sort
  const allDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

  // Calculate relative performance for each date
  return allDates.map(date => {
    const entry = { date };
    let hasData = false;

    symbols.forEach(symbol => {
      const point = data[symbol].find(d => d.date === date);
      if (point && basePrices[symbol]) {
        const pctChange = ((point.close - basePrices[symbol]) / basePrices[symbol]) * 100;
        entry[`pct_${symbol}`] = Number(pctChange.toFixed(2));
        hasData = true;
      }
    });

    return hasData ? entry : null;
  }).filter(entry => entry !== null);
};

router.get('/all', async (req, res) => {
  try {
    const period = req.query.period || '1y';
    const cacheKey = `macro-analysis-all-${period}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const result = {};
    for (const [key, group] of Object.entries(MACRO_GROUPS)) {
      const symbolData = {};
      
      // Fetch data for all symbols in parallel
      const promises = group.symbols.map(symbol => 
        eodService.fetchEODData(symbol, period)
          .then(data => { symbolData[symbol] = data; })
          .catch(error => {
            console.error(`Error fetching ${symbol}:`, error);
            symbolData[symbol] = [];
          })
      );
      
      await Promise.all(promises);
      
      result[key] = {
        description: group.description,
        symbols: group.symbols,
        tooltips: group.tooltips,
        tooltipContent: group.tooltipContent,
        performance: calculatePercentageChanges(symbolData)
      };
    }

    // Add enhanced analysis if enabled
    if (featureFlags.useEnhancedAnalysis) {
      try {
        const { relationshipAnalysis } = await import('../services/enhancedAnalysis/relationshipAnalysis.js');
        const enhanced = relationshipAnalysis.enhanceMacroData(result);
        cache.set(cacheKey, enhanced);
        return res.json(enhanced);
      } catch (analysisError) {
        console.warn('Enhanced macro analysis failed:', analysisError);
        cache.set(cacheKey, result);
        return res.json(result);
      }
    }

    // Cache the results
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    errorTracker.track(error, 'Macro Analysis - Get All');
    res.status(500).json({ error: 'Failed to fetch macro analysis data' });
  }
});

router.get('/:group', async (req, res) => {
  try {
    const { group } = req.params;
    const period = req.query.period || '1y';
    
    if (!MACRO_GROUPS[group]) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const cacheKey = `macro-analysis-${group}-${period}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const groupConfig = MACRO_GROUPS[group];
    const symbolData = {};
    
    // Fetch data for all symbols in parallel
    const promises = groupConfig.symbols.map(symbol => 
      eodService.fetchEODData(symbol, period)
        .then(data => { symbolData[symbol] = data; })
        .catch(error => {
          console.error(`Error fetching ${symbol}:`, error);
          symbolData[symbol] = [];
        })
    );
    
    await Promise.all(promises);

    const result = {
      description: groupConfig.description,
      symbols: groupConfig.symbols,
      tooltips: groupConfig.tooltips,
      tooltipContent: groupConfig.tooltipContent,
      performance: calculatePercentageChanges(symbolData)
    };

    // Add enhanced analysis if enabled
    if (featureFlags.useEnhancedAnalysis) {
      try {
        const { relationshipAnalysis } = await import('../services/enhancedAnalysis/relationshipAnalysis.js');
        const enhanced = relationshipAnalysis.enhanceMacroData({ [group]: result });
        cache.set(cacheKey, enhanced[group]);
        return res.json(enhanced[group]);
      } catch (analysisError) {
        console.warn('Enhanced macro analysis failed for group:', analysisError);
        cache.set(cacheKey, result);
        return res.json(result);
      }
    }

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    errorTracker.track(error, 'Macro Analysis - Get Group');
    res.status(500).json({ error: 'Failed to fetch macro analysis data' });
  }
});

export default router;