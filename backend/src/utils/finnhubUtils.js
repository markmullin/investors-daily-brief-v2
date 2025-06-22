// Utility functions for extracting data from Finnhub API responses

/**
 * Extract essential stock details from Finnhub data
 * @param {Object} finnhubData - Raw data from Finnhub API
 * @returns {Object} Standardized stock details
 */
export const getStockDetails = (finnhubData) => {
    try {
        if (!finnhubData) return null;
        
        return {
            symbol: finnhubData.symbol || '',
            name: finnhubData.name || finnhubData.companyName || finnhubData.symbol || '',
            price: finnhubData.price || finnhubData.c || 0,
            change: finnhubData.change || finnhubData.d || 0,
            percentChange: finnhubData.percentChange || finnhubData.dp || 0,
            high: finnhubData.high || finnhubData.h || 0,
            low: finnhubData.low || finnhubData.l || 0,
            open: finnhubData.open || finnhubData.o || 0,
            previousClose: finnhubData.previousClose || finnhubData.pc || 0,
            volume: finnhubData.volume || finnhubData.v || 0
        };
    } catch (error) {
        console.error('Error formatting Finnhub data:', error);
        return null;
    }
};

/**
 * Format Finnhub news items to consistent format
 * @param {Array} newsItems - Array of news items from Finnhub
 * @returns {Array} Standardized news items
 */
export const formatFinnhubNews = (newsItems) => {
    if (!Array.isArray(newsItems)) return [];
    
    return newsItems.map(item => ({
        id: item.id || String(Date.now() + Math.random()),
        title: item.headline || item.title || '',
        description: item.summary || item.description || '',
        source: item.source || 'Finnhub',
        url: item.url || '#',
        published: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString()
    }));
};
