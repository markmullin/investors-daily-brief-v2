import React, { useState, useEffect } from 'react';
import InfoTooltip from './InfoTooltip';
import { marketApi } from '../services/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ThemeCard = ({ theme, stocks }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold mb-3">{theme.title}</h3>
    <p className="text-gray-600 mb-4">{theme.description}</p>
    
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700 mb-2">Key Players:</h4>
      <div className="grid grid-cols-2 gap-2">
        {stocks.map((stock) => (
          <div 
            key={stock.symbol}
            className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{stock.symbol}</span>
              <InfoTooltip
                content={
                  <div>
                    <p className="font-semibold mb-1">{stock.name}</p>
                    <p className="mb-2">{stock.themeContext}</p>
                    <p className="text-sm">
                      Performance: 
                      <span className={stock.change_p >= 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                        {stock.change_p?.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                }
              />
            </div>
            {typeof stock.change_p === 'number' && (
              <div className="flex items-center text-sm">
                {stock.change_p >= 0 ? (
                  <ArrowUp className="text-green-500" size={12} />
                ) : (
                  <ArrowDown className="text-red-500" size={12} />
                )}
                <span className={stock.change_p >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(stock.change_p).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MarketThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const data = await marketApi.getThemes();
        setThemes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching themes:', err);
        setError('Failed to load market themes');
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
    const interval = setInterval(fetchThemes, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center">Loading themes...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {themes.map((theme) => (
        <ThemeCard 
          key={theme.id} 
          theme={theme} 
          stocks={theme.stocks}
        />
      ))}
    </div>
  );
};

export default MarketThemes;