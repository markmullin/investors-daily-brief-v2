import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { industryAnalysisApi, enhancedIndustryAnalysisApi } from '../../services/api';
import InfoTooltip from '../InfoTooltip';
import { useViewMode } from '../../context/ViewModeContext';

const RelationshipCard = ({ title, description, symbols, tooltips, data, analysis, tooltipContent }) => {
  const { viewMode } = useViewMode();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <InfoTooltip
          basicContent={tooltipContent?.basic}
          advancedContent={tooltipContent?.advanced}
        />
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="text-xs text-gray-500 mb-4">
        {symbols && symbols.map((symbol) => (
          <div key={symbol} className="mb-1">
            <span className="font-medium">{symbol.replace('.US', '')}: </span>
            {tooltips && tooltips[symbol]}
          </div>
        ))}
      </div>
      <div className="h-64">
        {Array.isArray(data) && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  if (!date) return '';
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval={Math.floor(data.length / 10)}
                fontSize={12}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value, name) => [
                  `${value.toFixed(2)}%`,
                  name.replace('etf1Price', symbols && symbols[0] ? symbols[0].replace('.US', '') : '')
                    .replace('etf2Price', symbols && symbols[1] ? symbols[1].replace('.US', '') : '')
                ]}
              />
              <Legend
                formatter={(value) => value.replace('etf1Price', symbols && symbols[0] ? symbols[0].replace('.US', '') : '')
                  .replace('etf2Price', symbols && symbols[1] ? symbols[1].replace('.US', '') : '')}
              />
              <Line
                type="monotone"
                dataKey="etf1Price"
                stroke="#8884d8"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="etf2Price"
                stroke="#82ca9d"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        )}
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h4 className="text-sm font-semibold mb-2">Relationship Insight:</h4>
        <p className="text-sm text-gray-600">
          {analysis?.interpretation ||
            "Market analysis is temporarily unavailable. Please refer to the metrics and charts for current market conditions."}
          {analysis && analysis.scoreImpact !== undefined && analysis.scoreImpact !== 0 && viewMode === 'advanced' && (
            <span className={`ml-2 font-semibold ${analysis.scoreImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({analysis.scoreImpact > 0 ? '+' : ''}{analysis.scoreImpact} points)
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const IndustryAnalysis = () => {
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching industry analysis data...');
        const response = await enhancedIndustryAnalysisApi.getAllPairs('1y');
        setAnalysisData(response || {});
        setLoading(false);
      } catch (err) {
        console.error('Error fetching enhanced data:', err);
        try {
          const basicResponse = await industryAnalysisApi.getAllPairs('1y');
          setAnalysisData(basicResponse || {});
          setLoading(false);
        } catch (basicErr) {
          console.error('Error fetching basic data:', basicErr);
          setError('Failed to fetch industry analysis data');
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-4">Loading industry analysis...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  // Safely handle the case where analysisData is null or undefined
  const entries = analysisData && typeof analysisData === 'object' 
    ? Object.entries(analysisData) 
    : [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Industry Analysis</h2>
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map(([key, data]) => (
            <RelationshipCard
              key={key}
              title={data?.description || 'Industry Relationship'}
              description={data?.description || 'Analysis unavailable'}
              symbols={data?.symbols || []}
              tooltips={data?.tooltips || {}}
              data={data?.performance || []}
              analysis={data?.analysis || {}}
              tooltipContent={data?.tooltipContent || {}}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No industry analysis data available at this time.</p>
        </div>
      )}
    </div>
  );
};

export default IndustryAnalysis;