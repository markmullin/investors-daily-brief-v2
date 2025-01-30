import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MarketSentiment = ({ symbol }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/market/sentiment/${symbol}`);
        const data = await response.json();
        setSentiment(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
    const interval = setInterval(fetchSentiment, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) return <div className="animate-pulse">Loading sentiment...</div>;
  if (error) return null;

  const getSentimentIcon = () => {
    if (sentiment.score > 0) return <TrendingUp className="text-green-500" />;
    if (sentiment.score < 0) return <TrendingDown className="text-red-500" />;
    return <Minus className="text-gray-500" />;
  };

  const getSentimentText = () => {
    if (sentiment.score > 2) return 'Very Bullish';
    if (sentiment.score > 0) return 'Bullish';
    if (sentiment.score < -2) return 'Very Bearish';
    if (sentiment.score < 0) return 'Bearish';
    return 'Neutral';
  };

  const getSentimentColor = () => {
    if (sentiment.score > 0) return 'text-green-600';
    if (sentiment.score < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Market Sentiment</h3>
        {getSentimentIcon()}
      </div>
      <div className={`text-xl font-bold ${getSentimentColor()}`}>
        {getSentimentText()}
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Recent News</h4>
        <ul className="space-y-2">
          {sentiment.articles?.map((article, index) => (
            <li key={index} className="text-sm">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {article.title}
              </a>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(article.publishedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MarketSentiment;