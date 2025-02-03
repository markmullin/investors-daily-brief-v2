import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const EOD_API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api/eod';

class MacroAnalysisService {
    constructor() {
        this.macroGroups = {
            yields: {
                symbols: ['SHY.US', 'IEF.US', 'TLT.US'],
                description: 'Treasury Yield Curve Analysis',
                tooltips: {
                    'SHY.US': '1-3 Year Treasury Bond ETF - Tracks short-term U.S. government bonds',
                    'IEF.US': '7-10 Year Treasury Bond ETF - Tracks medium-term U.S. government bonds',
                    'TLT.US': '20+ Year Treasury Bond ETF - Tracks long-term U.S. government bonds'
                }
            },
            stocksBonds: {
                symbols: ['SPY.US', 'BND.US'],
                description: 'Stocks vs Bonds Performance',
                tooltips: {
                    'SPY.US': 'S&P 500 ETF - Tracks the broad U.S. stock market',
                    'BND.US': 'Total Bond Market ETF - Tracks the broad U.S. bond market'
                }
            },
            alternativeAssets: {
                symbols: ['IBIT.US', 'GLD.US'],
                description: 'Bitcoin vs Gold Performance',
                tooltips: {
                    'IBIT.US': 'BlackRock Bitcoin ETF - Tracks Bitcoin price',
                    'GLD.US': 'SPDR Gold Shares - Tracks gold bullion price'
                }
            },
            inflationHedge: {
                symbols: ['TIPS.US', 'TLT.US'],
                description: 'Inflation Protection Analysis',
                tooltips: {
                    'TIPS.US': 'Treasury Inflation-Protected Securities ETF',
                    'TLT.US': '20+ Year Treasury Bond ETF'
                }
            },
            commodityCurrency: {
                symbols: ['USO.US', 'UUP.US'],
                description: 'Oil vs Dollar Relationship',
                tooltips: {
                    'USO.US': 'United States Oil Fund - Tracks crude oil prices',
                    'UUP.US': 'Invesco DB US Dollar Index Bullish Fund'
                }
            },
            globalMarkets: {
                symbols: ['EEM.US', 'EFA.US', 'UUP.US'],
                description: 'Global Market Relationships',
                tooltips: {
                    'EEM.US': 'iShares MSCI Emerging Markets ETF',
                    'EFA.US': 'iShares MSCI EAFE ETF - Developed Markets ex-US',
                    'UUP.US': 'Invesco DB US Dollar Index Bullish Fund'
                }
            }
        };
    }

    async fetchETFData(symbol) {
        try {
            const endDate = new Date();
            const startDate = new Date();
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

            if (!response.data || response.data.error) {
                throw new Error(response.data?.error || 'Failed to fetch ETF data');
            }

            return response.data;
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error.message);
            throw error;
        }
    }

    async getGroupPerformance(groupSymbols) {
        try {
            const dataPromises = groupSymbols.map(symbol => this.fetchETFData(symbol));
            const results = await Promise.all(dataPromises);

            // Combine the data
            const combinedData = {};
            results[0].forEach(dataPoint => {
                combinedData[dataPoint.date] = {
                    date: dataPoint.date,
                };
            });

            groupSymbols.forEach((symbol, index) => {
                results[index].forEach(dataPoint => {
                    if (combinedData[dataPoint.date]) {
                        combinedData[dataPoint.date][`price_${symbol}`] = dataPoint.close;
                    }
                });
            });

            return Object.values(combinedData);
        } catch (error) {
            console.error('Error in getGroupPerformance:', error.message);
            throw error;
        }
    }

    async getAllMacroAnalysis() {
        const results = {};
        
        for (const [key, value] of Object.entries(this.macroGroups)) {
            try {
                console.log(`Analyzing ${key} group...`);
                const performance = await this.getGroupPerformance(value.symbols);
                results[key] = {
                    description: value.description,
                    symbols: value.symbols,
                    tooltips: value.tooltips,
                    performance
                };
                console.log(`Successfully analyzed ${key} group`);
            } catch (error) {
                console.error(`Error analyzing ${key} group:`, error.message);
                results[key] = {
                    description: value.description,
                    symbols: value.symbols,
                    tooltips: value.tooltips,
                    error: 'Failed to fetch data'
                };
            }
        }

        return results;
    }
}

const macroAnalysisService = new MacroAnalysisService();
export default macroAnalysisService;