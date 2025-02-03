import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { marketEnvironmentApi } from '../services/marketEnvironment';
import { useViewMode } from '../context/ViewModeContext';

const MarketEnvironment = () => {
  const [environmentData, setEnvironmentData] = useState(null);
  const { viewMode } = useViewMode();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching market environment data');
        const data = await marketEnvironmentApi.getScore();
        console.log('Received environment data:', data);
        setEnvironmentData(data);
      } catch (error) {
        console.error('Error fetching market environment:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (!environmentData) {
    console.log('No environment data available');
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';  // Green
    if (score >= 60) return '#84cc16';  // Light green
    if (score >= 40) return '#eab308';  // Yellow
    if (score >= 20) return '#f97316';  // Orange
    return '#ef4444';  // Red
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg">
      <div className="md:col-span-1 space-y-6">
        <div className="w-48 h-48 mx-auto">
          <CircularProgressbar
            value={environmentData.overallScore}
            text={`${environmentData.overallScore}%`}
            styles={buildStyles({
              pathColor: getScoreColor(environmentData.overallScore),
              textColor: getScoreColor(environmentData.overallScore),
              trailColor: '#e5e7eb'
            })}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Technical Analysis</span>
            <span className="font-bold text-lg">
              {environmentData.components.technicalGrade}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Market Breadth</span>
            <span className="font-bold text-lg">
              {environmentData.components.breadthGrade}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Market Sentiment</span>
            <span className="font-bold text-lg">
              {environmentData.components.sentimentGrade}
            </span>
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <h3 className="text-xl font-semibold mb-4">Current Analysis</h3>
        <div className="prose">
          {viewMode === 'basic' ? (
            <p className="text-gray-700">{environmentData.analysis.basic}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">{environmentData.analysis.advanced}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketEnvironment;