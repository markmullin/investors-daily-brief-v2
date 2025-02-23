import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MarketInsightsDisplay = ({ insights }) => {
  if (!insights) return null;

  const renderAlert = (level, message) => {
    const alertStyles = {
      low: 'bg-green-50 text-green-700 border-green-200',
      moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      elevated: 'bg-orange-50 text-orange-700 border-orange-200',
      high: 'bg-red-50 text-red-700 border-red-200'
    };

    return (
      <Alert className={`${alertStyles[level]} mb-4`}>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  };

  const renderInsightCard = (title, content, score) => {
    const scoreColor = 
      score >= 70 ? 'text-green-600' :
      score >= 50 ? 'text-yellow-600' :
      'text-red-600';

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <span className={`font-bold ${scoreColor}`}>{score.toFixed(1)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {content.implications && (
              <p className="text-gray-700">{content.implications}</p>
            )}
            {content.actionItems && (
              <ul className="list-disc pl-4 space-y-1">
                {content.actionItems.map((item, index) => (
                  <li key={index} className="text-gray-600">{item}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIndustryInsights = () => (
    <div>
      {renderAlert(insights.industry.alert_level, insights.industry.summary)}
      {Object.entries(insights.industry.insights).map(([key, data]) => (
        renderInsightCard(
          `${key.charAt(0).toUpperCase() + key.slice(1)} Relationship`,
          data,
          data.score
        )
      ))}
    </div>
  );

  const renderMacroInsights = () => (
    <div>
      {renderAlert(insights.macro.alert_level, insights.macro.summary)}
      {Object.entries(insights.macro.insights).map(([key, data]) => (
        renderInsightCard(
          `${key.charAt(0).toUpperCase() + key.slice(1)} Dynamics`,
          data,
          data.score
        )
      ))}
    </div>
  );

  const renderEnvironmentInsights = () => (
    <Card>
      <CardHeader>
        <CardTitle>Market Environment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Current Phase</p>
              <p className="text-gray-600">{insights.environment.current_phase}</p>
            </div>
            <div>
              <p className="font-semibold">Risk Level</p>
              <p className="text-gray-600">{insights.environment.risk_level}</p>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Implications</p>
            <p className="text-gray-700">{insights.environment.implications}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="industry">
        <TabsList>
          <TabsTrigger value="industry">Industry</TabsTrigger>
          <TabsTrigger value="macro">Macro</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="industry" className="space-y-4">
          {renderIndustryInsights()}
        </TabsContent>

        <TabsContent value="macro" className="space-y-4">
          {renderMacroInsights()}
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          {renderEnvironmentInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketInsightsDisplay;