import axios from 'axios';

// Define delay function at the top level
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BraveService {
  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY;
    this.baseUrl = 'https://api.search.brave.com/res/v1';
  }

  async getMarketSentiment(symbol) {
    try {
        await delay(100 + Math.random() * 400);
        
        const response = await axios.get(`${this.baseUrl}/stats/search`, {
            params: {
                q: `${symbol} stock market sentiment`,
                count: 5
            },
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': this.apiKey
            }
        });

        if (response.status === 429) {
            console.warn('Brave API rate limit hit, returning default sentiment');
            return { sentiment: 0.5 };
        }

        const sentimentScore = this.analyzeSentiment(response.data.articles || []);
        return { sentiment: Math.max(0, Math.min(1, (sentimentScore + 5) / 10)) };
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn('Brave API rate limit hit, returning default sentiment');
            return { sentiment: 0.5 };
        }
        if (error.response?.status === 403) {
            console.warn('Brave API authentication failed, returning default sentiment');
            return { sentiment: 0.5 };
        }
        console.error('Error fetching market sentiment:', error);
        return { sentiment: 0.5 };
    }
  }

  analyzeSentiment(articles) {
    const positiveWords = ['surge', 'jump', 'rise', 'gain', 'positive', 'bullish', 'outperform'];
    const negativeWords = ['drop', 'fall', 'decline', 'negative', 'bearish', 'underperform'];
    
    let sentimentScore = 0;
    
    articles.forEach(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      
      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore += 1;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore -= 1;
      });
    });

    return sentimentScore;
  }
}

export default new BraveService();