import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { marketApi } from '../services/api';

const InsightCard = ({ insight }) => {
  // Format the published time to a relative time string
  const getRelativeTime = (publishedTime) => {
    try {
      if (!publishedTime) return 'Recently';
      
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const now = new Date().getTime();
      const published = new Date(publishedTime).getTime();
      
      if (isNaN(published)) return 'Recently';
      
      const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');
      
      const diffInDays = Math.floor(diffInHours / 24);
      return rtf.format(-diffInDays, 'day');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>{insight.source}</span>
              <span>•</span>
              <span>{getRelativeTime(insight.publishedTime)}</span>
            </div>
            <a 
              href={insight.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-start gap-2"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {insight.title}
              </h3>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
            </a>
            <p className="mt-2 text-gray-600 line-clamp-2">
              {insight.description}
            </p>
          </div>
          {insight.thumbnail && (
            <img 
              src={insight.thumbnail} 
              alt="Article thumbnail" 
              className="ml-4 w-24 h-24 object-cover rounded"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const KeyInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await marketApi.getInsights();
        setInsights(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load market insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    // Refresh insights every hour
    const interval = setInterval(fetchInsights, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
        <AlertCircle className="text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {insights.map((insight, index) => (
        <InsightCard key={index} insight={insight} />
      ))}
    </div>
  );
};

export default KeyInsights;