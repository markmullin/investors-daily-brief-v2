import axios from 'axios';
import NodeCache from 'node-cache';

// Increase cache duration to reduce API calls
const cache = new NodeCache({ stdTTL: 7200 }); // Cache for 2 hours

class BraveInsightsService {
  constructor() {
    this.baseURL = 'https://api.search.brave.com/res/v1';
    this.headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_API_KEY
    };
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // Minimum 1 second between requests
  }

  async getKeyInsights() {
    const cacheKey = 'key_insights';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached insights');
      return cached;
    }

    try {
      // Define fallback insights in case of API issues
      const fallbackInsights = [
        {
          title: "Markets Analysis Dashboard",
          description: "Track real-time market movements, sector performance, and key economic indicators.",
          url: "#",
          source: "Market Dashboard",
          score: 100,
          publishedTime: new Date().toISOString()
        },
        {
          title: "Economic Data Overview",
          description: "Monitor macroeconomic trends through our comprehensive financial metrics.",
          url: "#",
          source: "Market Dashboard",
          score: 90,
          publishedTime: new Date().toISOString()
        },
        {
          title: "Market Themes & Trends",
          description: "Explore current market themes and track major sector movements.",
          url: "#",
          source: "Market Dashboard",
          score: 80,
          publishedTime: new Date().toISOString()
        }
      ];

      // Use Brave's news search with specific financial terms
      const searchTerms = [
        'stock market impact',
        'market moving news',
        'financial markets significant'
      ];

      // Function to make a single request with delay
      const makeRequest = async (term, retryCount = 0) => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => 
            setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
          );
        }

        try {
          const response = await axios.get(`${this.baseURL}/news/search`, {
            headers: this.headers,
            params: {
              q: term,
              count: 5,
              freshness: 'pd',
              textDecorations: true,
              safeSearch: 'strict'
            }
          });
          this.lastRequestTime = Date.now();
          return response;
        } catch (error) {
          if (error.response?.status === 429 && retryCount < 3) {
            // If rate limited, wait longer and retry
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
            return makeRequest(term, retryCount + 1);
          }
          throw error;
        }
      };

      // Make requests sequentially instead of in parallel
      const responses = [];
      for (const term of searchTerms) {
        try {
          const response = await makeRequest(term);
          responses.push(response);
        } catch (error) {
          console.error(`Error fetching term "${term}":`, error.message);
          // Continue with other terms if one fails
        }
      }

      if (responses.length === 0) {
        console.log('Using fallback insights due to API issues');
        cache.set(cacheKey, fallbackInsights, 300); // Cache fallback for 5 minutes
        return fallbackInsights;
      }

      // Process and score the articles
      const articles = responses.flatMap(response => response.data.results || []);
      
      if (articles.length === 0) {
        console.log('No articles found, using fallback insights');
        cache.set(cacheKey, fallbackInsights, 300);
        return fallbackInsights;
      }

      // Score and rank articles based on relevance
      const scoredArticles = articles.map(article => ({
        ...article,
        score: this.calculateArticleScore(article)
      }));

      // Sort by score and take top 3
      const topInsights = scoredArticles
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          score: article.score,
          publishedTime: article.publishedTime,
          thumbnail: article.meta?.thumbnail || null
        }));

      cache.set(cacheKey, topInsights);
      return topInsights;
    } catch (error) {
      console.error('Error fetching insights:', error);
      // Return fallback content on error
      cache.set(cacheKey, fallbackInsights, 300);
      return fallbackInsights;
    }
  }

  calculateArticleScore(article) {
    let score = 0;
    
    // Score based on source reputation
    const reputableSources = [
      'bloomberg', 'reuters', 'wsj', 'ft.com', 
      'cnbc', 'marketwatch', 'barrons', 'yahoo finance'
    ];
    if (reputableSources.some(source => 
      article.source?.toLowerCase().includes(source))) {
      score += 30;
    }

    // Score based on keyword presence in title
    const impactKeywords = [
      'market', 'stock', 'fed', 'economy', 'rates',
      'inflation', 'gdp', 'earnings', 'forecast'
    ];
    const title = article.title.toLowerCase();
    impactKeywords.forEach(keyword => {
      if (title.includes(keyword)) score += 10;
    });

    // Freshness score (newer is better)
    const ageInHours = (Date.now() - new Date(article.publishedTime).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 24 - ageInHours);

    return score;
  }
}

export default new BraveInsightsService();