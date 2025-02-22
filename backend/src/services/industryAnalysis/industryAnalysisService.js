import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const EOD_API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api/eod';

class IndustryAnalysisService {
    constructor() {
        this.etfPairs = {
            tech: {
              pair: ['SMH.US', 'XSW.US'],
              description: 'Semiconductors vs Software Performance',
              tooltipContent: {
                basic: "Compare the performance of semiconductor companies (SMH) versus software companies (XSW). Semiconductors are the 'hardware' foundation of tech, while software represents digital services and applications. Their relative performance shows where money is flowing in tech and can indicate broader economic trends - semiconductors often lead in early cycle growth, while software may be more defensive.",
                advanced: "Track this spread for tech cycle positioning. Semiconductor strength often precedes broader tech rallies due to their position in the supply chain. A shift to software outperformance can signal late-cycle behavior or defensive positioning. Monitor SMH's relative strength vs XSW for early warnings of tech sector rotation. Key semiconductor demand metrics (capex, inventory) often predict broader tech trends 3-6 months ahead."
              },
              tooltips: {
                'SMH.US': 'VanEck Semiconductor ETF - Tracks the largest US semiconductor companies including NVIDIA, AMD, and Intel',
                'XSW.US': 'SPDR S&P Software & Services ETF - Tracks US software and IT service companies across all market caps'
              }
            },
            consumer: {
              pair: ['XLP.US', 'XLY.US'],
              description: 'Consumer Staples vs Discretionary',
              tooltipContent: {
                basic: "Compare essential consumer goods (XLP: food, beverages, household items) versus discretionary purchases (XLY: retail, cars, leisure). This relationship is a key indicator of consumer health and confidence. When discretionary outperforms, it typically signals strong consumer spending and economic optimism. Staples outperformance often indicates defensive positioning and economic concerns.",
                advanced: "This is a crucial economic cycle indicator. Watch for: 1) Early cycle: Discretionary leads as consumers increase spending 2) Mid-cycle: Balanced performance 3) Late cycle: Staples begin to outperform as consumers get cautious. The XLY/XLP ratio is a key risk appetite metric - ratio breakdown often precedes market stress. High inflation periods typically favor staples due to pricing power and inelastic demand."
              },
              tooltips: {
                'XLP.US': 'Consumer Staples Select Sector SPDR - Tracks consumer staples like Procter & Gamble, Coca-Cola, and Walmart',
                'XLY.US': 'Consumer Discretionary Select Sector SPDR - Tracks retail, automotive, and leisure companies like Amazon and Tesla'
              }
            },
            financial: {
              pair: ['XLF.US', 'XLRE.US'],
              description: 'Financials vs Real Estate',
              tooltipContent: {
                basic: "Track the relationship between traditional financial firms (XLF: banks, insurance) and real estate companies (XLRE: REITs, property managers). This comparison shows how interest rates and credit conditions are impacting financial assets. Both sectors are highly sensitive to interest rates but often react differently based on rate movement causes.",
                advanced: "Key factors to monitor: 1) Yield curve impact - steepening typically benefits banks while hurting REITs 2) Credit spread trends affect both sectors but in opposite ways 3) Real estate acts as both an inflation hedge and rate-sensitive sector. The XLF/XLRE ratio often leads shifts in monetary policy expectations. Watch for divergences from historic correlations with yields - they often signal underlying market stress."
              },
              tooltips: {
                'XLF.US': 'Financial Select Sector SPDR - Tracks major banks, insurance companies, and financial services firms',
                'XLRE.US': 'Real Estate Select Sector SPDR - Tracks REITs and real estate management companies'
              }
            },
            industrial: {
              pair: ['XLE.US', 'XLI.US'],
              description: 'Energy vs Industrial Performance',
              tooltipContent: {
                basic: "Compare energy companies (XLE: oil, gas) versus industrial firms (XLI: manufacturing, transportation). This relationship reflects global economic activity and inflation expectations. Energy strength often indicates supply constraints or strong global demand, while industrial leadership typically signals broader economic expansion.",
                advanced: "Monitor for macro regime shifts: 1) Rising energy vs industrials often signals inflationary pressures 2) Industrial outperformance suggests healthy economic growth without commodity constraints 3) Both weakening can warn of demand concerns. The XLE/XLI ratio correlates strongly with real rates and inflation expectations. Watch for divergences between energy stocks and commodity prices - they often precede major trend changes."
              },
              tooltips: {
                'XLE.US': 'Energy Select Sector SPDR - Tracks large-cap US energy companies, mainly oil & gas',
                'XLI.US': 'Industrial Select Sector SPDR - Tracks aerospace, defense, machinery, and transportation companies'
              }
            },
            momentum: {
              pair: ['MTUM.US', 'RSP.US'],
              description: 'Momentum vs Equal Weight',
              tooltipContent: {
                basic: "Compare momentum stocks (MTUM: companies with strong recent performance) versus equal-weight S&P 500 (RSP). This shows whether market gains are broad-based or concentrated in specific trending stocks. Healthy markets typically show broad participation, while narrow leadership can signal late-cycle behavior.",
                advanced: "Market breadth indicator with regime implications: 1) Strong momentum vs equal-weight suggests trend-following strategies are working but may indicate concentration risk 2) Equal-weight leadership shows healthy market breadth and often occurs early in bull cycles 3) Monitor for momentum crashes - sudden reversals when crowded trades unwind. MTUM/RSP relative strength trends often identify market regime shifts 3-6 months before they become obvious."
              },
              tooltips: {
                'MTUM.US': 'iShares MSCI USA Momentum Factor ETF - Tracks large and mid-cap US stocks showing momentum',
                'RSP.US': 'Invesco S&P 500 Equal Weight ETF - Tracks S&P 500 with equal weighting rather than market cap'
              }
            },
            style: {
              pair: ['IVE.US', 'IVW.US'],
              description: 'Value vs Growth',
              tooltipContent: {
                basic: "Compare value stocks (IVE: lower-priced, established companies) versus growth stocks (IVW: higher-priced, faster-growing firms). This fundamental relationship shifts based on economic conditions, interest rates, and market sentiment. Value typically leads during rising rate and inflationary periods, while growth outperforms when rates are low and stable.",
                advanced: "Critical style rotation indicator: 1) Value leadership often emerges with rising rates and inflation expectations 2) Growth dominates in low-rate, low-growth environments 3) Watch for regime shifts when correlations with rates break down. The IVE/IVW ratio has strong relationship with real yields and economic growth expectations. Factor crowding in either style can lead to sharp reversals - monitor factor volatility and valuation spreads."
              },
              tooltips: {
                'IVE.US': 'iShares S&P 500 Value ETF - Tracks large-cap US value stocks with lower P/E ratios',
                'IVW.US': 'iShares S&P 500 Growth ETF - Tracks large-cap US growth stocks with higher P/E ratios'
              }
            }
          };
    }

    async fetchETFData(symbol, period = '1y') {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);

            const url = `${BASE_URL}/${symbol}`;
            
            const response = await axios.get(url, {
                params: {
                    api_token: EOD_API_KEY,
                    fmt: 'json',
                    from: startDate.toISOString().split('T')[0],
                    to: endDate.toISOString().split('T')[0],
                    period: 'd'
                }
            });

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid data received');
            }

            return response.data;
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error.message);
            throw error;
        }
    }

    async getAllPairs(period = '1y') {
      try {
          const result = {};
          for (const [key, config] of Object.entries(this.etfPairs)) {
              const [etf1Symbol, etf2Symbol] = config.pair;
              const [etf1Data, etf2Data] = await Promise.all([
                  this.fetchETFData(etf1Symbol, period),
                  this.fetchETFData(etf2Symbol, period)
              ]);
  
              const performance = this.alignETFData(etf1Data, etf2Data);
              
              // Calculate analysis data
              const analysis = this.analyzeIndustryPair(key, performance);
  
              result[key] = {
                  description: config.description,
                  symbols: config.pair,
                  tooltips: config.tooltips,
                  tooltipContent: config.tooltipContent,
                  performance,
                  analysis  // Add this
              };
          }
          return result;
      } catch (error) {
          console.error('Error fetching all pairs:', error);
          throw error;
      }
  }
  
  // Add this new method
  analyzeIndustryPair(type, performance) {
      if (!performance || !performance.length) {
          return {
              interpretation: "Insufficient data for analysis",
              scoreImpact: 0
          };
      }
  
      // Get the latest data point
      const latest = performance[performance.length - 1];
      const spreadValue = latest.etf1Price - latest.etf2Price;
  
      // Define analysis patterns
      const patterns = {
          tech: {
              strong: "Semiconductor strength leading software indicates healthy tech demand and early-cycle growth",
              weak: "Software outperformance over semiconductors suggests defensive positioning and late-cycle behavior",
              neutral: "Balanced tech sector performance between semiconductors and software"
          },
          consumer: {
              strong: "Discretionary outperformance indicates strong consumer spending and economic confidence",
              weak: "Staples outperformance suggests defensive consumer positioning and economic concerns",
              neutral: "Balanced consumer sector dynamics between staples and discretionary"
          },
          financial: {
              strong: "Financial sector leading real estate suggests healthy credit conditions and rising rate environment",
              weak: "Real estate outperformance over financials indicates yield-seeking behavior and growth concerns",
              neutral: "Balanced financial and real estate sector performance"
          },
          industrial: {
              strong: "Energy outperformance over industrials signals strong global demand and potential inflationary pressures",
              weak: "Industrial outperformance over energy suggests healthy economic growth without commodity constraints",
              neutral: "Balanced industrial and energy sector dynamics"
          },
          momentum: {
              strong: "Equal-weight leadership shows healthy market breadth and early-cycle characteristics",
              weak: "Momentum outperformance indicates narrow market leadership and potential late-cycle behavior",
              neutral: "Balanced market leadership between momentum and equal-weight stocks"
          },
          style: {
              strong: "Value leadership suggests rising rates environment and inflation expectations",
              weak: "Growth outperformance indicates low-rate environment and growth scarcity premium",
              neutral: "Balanced performance between value and growth styles"
          }
      };
  
      const pattern = patterns[type] || {
          strong: "Strong relative performance",
          weak: "Weak relative performance",
          neutral: "Neutral performance"
      };
  
      // Determine interpretation based on spread
      let interpretation, scoreImpact;
      if (spreadValue > 5) {
          interpretation = pattern.strong;
          scoreImpact = 5;
      } else if (spreadValue < -5) {
          interpretation = pattern.weak;
          scoreImpact = -5;
      } else {
          interpretation = pattern.neutral;
          scoreImpact = 0;
      }
  
      return {
          interpretation,
          scoreImpact,
          spreadValue
      };
  }

    alignETFData(etf1Data, etf2Data) {
        if (!etf1Data.length || !etf2Data.length) return [];
        
        // Sort data by date first
        etf1Data.sort((a, b) => new Date(a.date) - new Date(b.date));
        etf2Data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get starting values
        const etf1Start = etf1Data[0].close;
        const etf2Start = etf2Data[0].close;
        
        // Create a map for quick date lookup
        const dateMap = new Map();
        
        // Calculate percentage changes for ETF1
        etf1Data.forEach(item => {
            const pctChange = ((item.close - etf1Start) / etf1Start) * 100;
            dateMap.set(item.date, {
                date: item.date,
                etf1Price: pctChange
            });
        });
        
        // Merge ETF2 data where dates match
        const alignedData = [];
        etf2Data.forEach(item => {
            if (dateMap.has(item.date)) {
                const pctChange = ((item.close - etf2Start) / etf2Start) * 100;
                const dayData = dateMap.get(item.date);
                alignedData.push({
                    date: item.date,
                    etf1Price: dayData.etf1Price,
                    etf2Price: pctChange
                });
            }
        });
        
        return alignedData;
    }
}

// Create the instance
const service = new IndustryAnalysisService();

// Export both the class and the instance
export { IndustryAnalysisService };
export const industryAnalysisService = service;