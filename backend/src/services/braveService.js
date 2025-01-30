import axios from 'axios';

class BraveService {
  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY;
    this.baseUrl = 'https://api.search.brave.com/res/v1';
  }

  async getMarketSentiment(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/news/search`, {
        headers: {
          'X-Subscription-Token': this.apiKey
        },
        params: {
          q: `${symbol} stock market news`,
          count: 10,
          search_lang: 'en'
        }
      });

      const articles = response.data.articles || [];
      const sentimentScore = this.analyzeSentiment(articles);

      return {
        score: sentimentScore,
        articles: articles.slice(0, 5).map(article => ({
          title: article.title,
          url: article.url,
          description: article.description,
          publishedAt: article.published_at
        }))
      };
    } catch (error) {
      console.error('Brave API Error:', error.message);
      throw new Error('Failed to fetch market sentiment');
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