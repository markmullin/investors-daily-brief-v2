import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { macroAnalysisApi, enhancedMacroAnalysisApi } from '../../services/api';
import InfoTooltip from '../InfoTooltip';
import { useViewMode } from '../../context/ViewModeContext';

const MacroCard = ({ title, description, symbols, tooltips, data, tooltipContent }) => {
  const { viewMode } = useViewMode();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  console.log('MacroCard data:', data);

  const getInsight = () => {
    if (!data?.analysis) return "Market analysis is temporarily unavailable.";

    return data.analysis.interpretation || "Market analysis is temporarily unavailable.";
  };

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
        {symbols.map((symbol) => (
          <div key={symbol} className="mb-1">
            <span className="font-medium">{symbol.replace('.US', '')}: </span>
            {tooltips[symbol]}
          </div>
        ))}
      </div>
      <div className="h-64">
        {data?.performance?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performance}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  if (!date) return '';
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval={Math.floor(data.performance.length / 10)}
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
                  name.replace('pct_', '').replace('.US', '')
                ]}
              />
              <Legend
                formatter={(value) => value.replace('pct_', '').replace('.US', '')}
              />
              {symbols.map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={`pct_${symbol}`}
                  name={symbol}
                  stroke={COLORS[index]}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        )}
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h4 className="text-sm font-semibold mb-2">Market Insight:</h4>
        <p className="text-sm text-gray-600">
          {getInsight()}
          {data?.analysis?.scoreImpact !== 0 && viewMode === 'advanced' && (
            <span className={`ml-2 font-semibold ${data.analysis.scoreImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({data.analysis.scoreImpact > 0 ? '+' : ''}{data.analysis.scoreImpact} points)
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const MacroAnalysis = () => {
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching macro analysis data...');
        const response = await enhancedMacroAnalysisApi.getAllGroups('1y');
        console.log('Received macro data:', response);
        setAnalysisData(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching macro data:', err);
        setError('Failed to fetch macro analysis data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-4">Loading macro analysis...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Macro Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(analysisData).map(([key, data]) => (
          <MacroCard
            key={key}
            title={data.description}
            description={data.description}
            symbols={data.symbols}
            tooltips={data.tooltips}
            data={data}
            tooltipContent={data.tooltipContent}
          />
        ))}
      </div>
    </div>
  );
};

export default MacroAnalysis;