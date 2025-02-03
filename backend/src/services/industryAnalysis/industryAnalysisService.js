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
                description: 'Semiconductors vs Software'
            },
            consumer: {
                pair: ['XLP.US', 'XLY.US'],
                description: 'Consumer Staples vs Consumer Discretionary'
            },
            realestate: {
                pair: ['XLF.US', 'XLRE.US'],
                description: 'Financials vs Real Estate'
            },
            industrial: {
                pair: ['XLE.US', 'XLI.US'],
                description: 'Energy vs Industrials'
            },
            momentum: {
                pair: ['MTUM.US', 'RSP.US'],
                description: 'Momentum vs Equal Weight'
            },
            style: {
                pair: ['IVE.US', 'IVW.US'],
                description: 'Value vs Growth'
            }
        };
    }

    async fetchETFData(symbol, period = '1y') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);

            const url = `${BASE_URL}/${symbol}`;
            console.log('Fetching from URL:', url);
            
            const response = await axios.get(url, {
                params: {
                    api_token: EOD_API_KEY,
                    fmt: 'json',
                    from: startDate.toISOString().split('T')[0],
                    to: endDate.toISOString().split('T')[0],
                    period: 'd'  // daily data
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

    // ... rest of the code remains the same ...
}