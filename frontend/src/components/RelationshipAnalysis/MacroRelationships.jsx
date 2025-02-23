import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MacroRelationships = ({ data }) => {
  if (!data) return null;

  const renderMacroChart = (relationship, key) => {
    const { performance, symbols } = relationship;
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
    
    return (
      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold capitalize">
              {key.replace(/_/g, ' ')} Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance.relative}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#666' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tick={{ fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #ccc'
                    }}
                    formatter={(value) => [`${value.toFixed(2)}%`, 'Performance']}
                  />
                  <Legend />
                  {symbols.map((symbol, index) => (
                    <Line
                      key={symbol}
                      type="monotone"
                      dataKey={`values[${index}]`}
                      stroke={colors[index % colors.length]}
                      name={symbol}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Analysis:</h4>
              <p className="text-gray-600">{performance.trends.interpretation}</p>
              
              {Array.isArray(performance.trends.strength) && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium mb-1">Component Strengths:</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {symbols.map((symbol, index) => (
                      <div key={symbol} className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">{symbol}:</span>
                        <span className={`text-sm ${
                          Math.abs(performance.trends.strength[index]) > 1.5 
                            ? 'text-blue-600' 
                            : 'text-gray-600'
                        }`}>
                          {Math.abs(performance.trends.strength[index]).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(data).map(([key, relationship]) => (
        <div key={key}>
          {renderMacroChart(relationship, key)}
        </div>
      ))}
    </div>
  );
};

export default MacroRelationships;