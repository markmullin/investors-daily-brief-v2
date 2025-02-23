import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Info } from 'lucide-react';

const RelationshipInsights = ({ data, type, onInsightHover }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!data) return;
      
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/ollama/analyze', {
          data,
          type
        });

        setInsights(response.data);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [data, type]);

  if (loading) return <div className="animate-pulse">Analyzing relationships...</div>;
  if (error) return null; // Silently fail to maintain dashboard experience

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Key Relationships
        </h3>
      </div>
      
      <div className="space-y-3">
        {insights?.relationships?.map((relationship, idx) => (
          <div 
            key={idx}
            className="relative group"
            onMouseEnter={() => onInsightHover?.(relationship)}
          >
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 mt-1 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {relationship.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelationshipInsights;