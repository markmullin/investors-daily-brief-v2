import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const EOD_API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api/eod';

const TICKERS_TO_VALIDATE = {
    market: ['SPY.US', 'VIXY.US', 'VIX.US'],
    sectors: ['XLK.US', 'XLF.US', 'XLE.US', 'XLB.US', 'XLI.US', 'XLP.US', 'XLY.US', 'XLRE.US', 'XLC.US', 'XLU.US', 'XLV.US'],
    industry: {
        tech: ['SMH.US', 'XSW.US'],
        consumer: ['XLP.US', 'XLY.US'],
        realestate: ['XLF.US', 'XLRE.US'],
        industrial: ['XLE.US', 'XLI.US'],
        momentum: ['MTUM.US', 'RSP.US'],
        style: ['IVE.US', 'IVW.US']
    },
    macro: {
        stocksBonds: ['SPY.US', 'TLT.US', 'JNK.US'],
        goldStocks: ['GLD.US', 'SPY.US'],
        dollarStrength: ['UUP.US'],
        yields: ['SHY.US', 'IEF.US', 'TLT.US']
    }
};

async function validateTicker(symbol) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 5); // Just check last 5 days

        const response = await axios.get(`${BASE_URL}/${symbol}`, {
            params: {
                api_token: EOD_API_KEY,
                fmt: 'json',
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            }
        });

        return {
            symbol,
            status: 'success',
            hasData: Array.isArray(response.data) && response.data.length > 0
        };
    } catch (error) {
        return {
            symbol,
            status: 'error',
            error: error.message
        };
    }
}

async function validateAllTickers() {
    console.log('Starting data validation...');
    const results = {
        market: [],
        sectors: [],
        industry: {},
        macro: {}
    };

    // Validate market tickers
    for (const ticker of TICKERS_TO_VALIDATE.market) {
        results.market.push(await validateTicker(ticker));
    }

    // Validate sector tickers
    for (const ticker of TICKERS_TO_VALIDATE.sectors) {
        results.sectors.push(await validateTicker(ticker));
    }

    // Validate industry tickers
    for (const [key, pairs] of Object.entries(TICKERS_TO_VALIDATE.industry)) {
        results.industry[key] = [];
        for (const ticker of pairs) {
            results.industry[key].push(await validateTicker(ticker));
        }
    }

    // Validate macro tickers
    for (const [key, tickers] of Object.entries(TICKERS_TO_VALIDATE.macro)) {
        results.macro[key] = [];
        for (const ticker of tickers) {
            results.macro[key].push(await validateTicker(ticker));
        }
    }

    return results;
}

export { validateAllTickers, validateTicker };
