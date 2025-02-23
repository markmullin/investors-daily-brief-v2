import express from 'express';
import axios from 'axios';

const router = express.Router();

// EOD API configuration
const EOD_API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api';  // Updated base URL

router.get('/eod-test', async (req, res) => {
    try {
        console.log('Testing EOD API connectivity...');
        
        // Test historical data for SPY
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        
        const historicalUrl = `${BASE_URL}/eod/SPY.US?api_token=${EOD_API_KEY}&fmt=json&from=${lastWeek.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
        console.log('Testing URL:', historicalUrl);
        
        const historicalResponse = await axios.get(historicalUrl);
        console.log('EOD Response:', historicalResponse.data);

        res.json({
            status: 'success',
            data: historicalResponse.data
        });
    } catch (error) {
        console.error('EOD API Test Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: {
                statusCode: error.response?.status,
                data: error.response?.data
            }
        });
    }
});

// Add a test endpoint for a specific ticker
router.get('/eod-test/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`Testing EOD API for symbol: ${symbol}`);
        
        const url = `${BASE_URL}/eod/${symbol}?api_token=${EOD_API_KEY}&fmt=json&limit=5`;
        console.log('Testing URL:', url);
        
        const response = await axios.get(url);
        console.log('EOD Response:', response.data);

        res.json({
            status: 'success',
            data: response.data
        });
    } catch (error) {
        console.error('EOD API Test Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: {
                statusCode: error.response?.status,
                data: error.response?.data
            }
        });
    }
});

export default router;