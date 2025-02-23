import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { marketEnvironmentApi } from '../services/marketEnvironment';
import { useViewMode } from '../context/ViewModeContext';

const MarketEnvironment = () => {
  const [environmentData, setEnvironmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { viewMode } = useViewMode();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching market environment data');
        setLoading(true);
        const data = await marketEnvironmentApi.getScore();
        console.log('Received environment data:', data);
        
        // Create a safe default structure if data is missing fields
        const safeData = {
          overallScore: data?.overallScore || 50,
          components: {
            technical: data?.components?.technical || 50,
            technicalGrade: data?.components?.technicalGrade || 'C',
            breadth: data?.components?.breadth || 50,
            breadthGrade: data?.components?.breadthGrade || 'C',
            sentiment: data?.components?.sentiment || 50,
            sentimentGrade: data?.components?.sentimentGrade || 'C',
          },
          analysis: {
            basic: data?.analysis?.basic || 'Market environment data is still loading or unavailable.',
            advanced: data?.analysis?.advanced || 'Detailed market environment analysis is still loading or unavailable.'
          }
        };
        
        setEnvironmentData(safeData);
        setError(null);
      } catch (error) {
        console.error('Error fetching market environment:', error);
        setError('Failed to load market environment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Show loading state
  if (loading && !environmentData) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-48 w-48 mx-auto rounded-full bg-gray-200 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl shadow-lg border border-red-200">
        <h3 className="text-red-700 font-medium mb-2">Error Loading Market Environment</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Handle cases where data might still be null
  if (!environmentData) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <p className="text-gray-500">No market environment data available.</p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    const safeScore = Number(score) || 0;
    if (safeScore >= 80) return '#22c55e';  // Green
    if (safeScore >= 60) return '#84cc16';  // Light green
    if (safeScore >= 40) return '#eab308';  // Yellow
    if (safeScore >= 20) return '#f97316';  // Orange
    return '#ef4444';  // Red
  };

  const ComponentScore = ({ label, score, grade, weight }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{grade || 'N/A'}</span>
          {viewMode === 'advanced' && (
            <span className="text-sm text-gray-500">({score || 0}%)</span>
          )}
        </div>
      </div>
      {viewMode === 'advanced' && (
        <div className="text-xs text-gray-500 text-right">
          Weight: {((weight || 0) * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );

  // Ensure overallScore is a number
  const overallScore = Number(environmentData.overallScore) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg">
      <div className="md:col-span-1 space-y-6">
        <div className="w-48 h-48 mx-auto">
          <CircularProgressbar
            value={overallScore}
            text={`${overallScore.toFixed(0)}%`}
            styles={buildStyles({
              pathColor: getScoreColor(overallScore),
              textColor: getScoreColor(overallScore),
              trailColor: '#e5e7eb'
            })}
          />
          {viewMode === 'advanced' && (
            <div className="text-center mt-2 text-gray-600">
              Score: {overallScore.toFixed(0)}%
            </div>
          )}
        </div>
        <div className="space-y-4">
          <ComponentScore
            label="Technical Analysis"
            score={environmentData.components?.technical}
            grade={environmentData.components?.technicalGrade}
            weight={0.4}
          />
          <ComponentScore
            label="Market Breadth"
            score={environmentData.components?.breadth}
            grade={environmentData.components?.breadthGrade}
            weight={0.3}
          />
          <ComponentScore
            label="Market Sentiment"
            score={environmentData.components?.sentiment}
            grade={environmentData.components?.sentimentGrade}
            weight={0.3}
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <h3 className="text-xl font-semibold mb-4">Market Environment Analysis</h3>
        <div className="prose">
          {viewMode === 'basic' ? (
            <div className="space-y-4">
              <p className="text-gray-700">{environmentData.analysis?.basic || 'Basic analysis not available.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">{environmentData.analysis?.advanced || 'Advanced analysis not available.'}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Component Breakdown:</h4>
                <ul className="list-none space-y-2">
                  {environmentData.components && Object.entries(environmentData.components).map(([key, value]) => {
                    if (typeof value === 'number') {
                      return (
                        <li key={key} className="text-sm text-gray-600">
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {value}%
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketEnvironment;