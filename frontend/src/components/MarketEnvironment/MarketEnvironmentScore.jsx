import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const MarketEnvironmentScore = ({ data }) => {
  if (!data) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderScoreComponent = (title, score, analysis) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className={`font-bold text-2xl ${getScoreColor(score)}`}>
            {score.toFixed(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress 
          value={score} 
          className="mb-4"
          indicatorClassName={getProgressColor(score)}
        />
        <p className="text-gray-700">{analysis}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderScoreComponent(
        'Market Environment Score',
        data.score,
        data.analysis.summary
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.components && Object.entries(data.components).map(([key, component]) => (
          <Card key={key} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg capitalize">
                {key.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <Progress 
                  value={component.score} 
                  className="flex-1 mr-4"
                  indicatorClassName={getProgressColor(component.score)}
                />
                <span className={`font-bold ${getScoreColor(component.score)}`}>
                  {component.score.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{component.interpretation}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.analysis.implications && (
        <Card>
          <CardHeader>
            <CardTitle>Key Implications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <h4 className="font-medium mb-1">Positioning:</h4>
                <p className="text-gray-600">{data.analysis.implications.positioning}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Risk Management:</h4>
                <p className="text-gray-600">{data.analysis.implications.riskManagement}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketEnvironmentScore;