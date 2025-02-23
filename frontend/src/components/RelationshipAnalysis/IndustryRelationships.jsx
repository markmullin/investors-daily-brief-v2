import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IndustryRelationships = ({ data }) => {
  if (!data) return null;

  const renderRelationshipChart = (relationship, key) => {
    const { performance, symbols } = relationship;
    
    return (
      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold capitalize">
              {key.replace(/_/g, ' ')} Relationship
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
                    formatter={(value) => [`${value.toFixed(2)}%`, 'Spread']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="spread" 
                    stroke="#8884d8" 
                    name={`${symbols[0]} vs ${symbols[1]}`} 
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Analysis:</h4>
              <p className="text-gray-600">{performance.trend.interpretation}</p>
              {performance.trend.strength && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm font-medium mr-2">Trend Strength:</span>
                  <span className={`text-sm ${
                    Math.abs(performance.trend.strength) > 1.5 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(performance.trend.strength).toFixed(1)}
                  </span>
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
          {renderRelationshipChart(relationship, key)}
        </div>
      ))}
    </div>
  );
};

export default IndustryRelationships;