import axios from 'axios';

class BraveNewsService {
    constructor() {
        this.apiKey = process.env.BRAVE_API_KEY;
        this.baseUrl = 'https://api.search.brave.com/news/search';
    }

    // In backend/src/services/braveNewsService.js
async getStockNews(symbol, companyName) {
    try {
        const response = await axios.get(`https://api.search.brave.com/news/search`, {
            params: {
                q: `${symbol} ${companyName || ''} stock`,
                fresh: 1,
                count: 5
            },
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': process.env.BRAVE_API_KEY
            }
        });

        return response.data?.items || [];
    } catch (error) {
        if (error.response?.status === 403) {
            console.warn('Brave API authentication failed - returning empty news array');
            return [];
        }
        if (error.response?.status === 429) {
            console.warn('Brave API rate limit reached - returning empty news array');
            return [];
        }
        console.error('Error fetching news:', error);
        return [];
    }
}
}

export default new BraveNewsService();