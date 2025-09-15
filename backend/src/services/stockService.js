import fmpService from './fmpService.js';

export const getStockData = async (symbol) => {
    try {
        // Use FMP real-time quotes endpoint
        const data = await fmpService.getQuote(symbol);
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error(`No data returned for ${symbol}`);
        }
        
        // FMP returns array, take first element
        const stockData = Array.isArray(data) ? data[0] : data;
        console.log(`Raw data for ${symbol}:`, stockData); // Debug log

        return {
            symbol: symbol,
            price: {
                current: parseFloat(stockData.price || 0),
                change: parseFloat(stockData.change || 0),
                changePercent: parseFloat(stockData.changesPercentage || 0),
                volume: parseInt(stockData.volume || 0, 10)
            },
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
};
