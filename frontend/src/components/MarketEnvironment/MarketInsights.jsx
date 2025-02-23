import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MarketEnvironmentScore from './MarketEnvironmentScore';

const MarketInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const [marketRes, relationshipsRes] = await Promise.all([
          fetch('/api/market-environment/score'),
          fetch('/api/insights/market-insights')
        ]);

        const [marketData, insightsData] = await Promise.all([
          marketRes.json(),
          relationshipsRes.json()
        ]);

        setInsights({
          market: marketData,
          relationships: insightsData
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setLoading(false);
      }
    };

    fetchInsights();

    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchInsights, 60000); // Poll every minute

    return () => clearInterval(pollInterval);
  }, []);

  const renderIndustryInsights = () => {
    if (!insights?.relationships?.industry) return null;

    return (
      <div className="space-y-4">
        <Alert className={getAlertStyle(insights.relationships.industry.alert_level)}>
          <AlertDescription>
            {insights.relationships.industry.summary}
          </AlertDescription>
        </Alert>

        {Object.entries(insights.relationships.industry.insights).map(([key, data]) => (
          <Card key={key} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg capitalize">
                {key.replace('_', ' ')} Relationship
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{data.implications}</p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Action Items:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {data.actionItems.map((item, index) => (
                    <li key={index} className="text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderMacroInsights = () => {
    if (!insights?.relationships?.macro) return null;

    return (
      <div className="space-y-4">
        <Alert className={getAlertStyle(insights.relationships.macro.alert_level)}>
          <AlertDescription>
            {insights.relationships.macro.summary}
          </AlertDescription>
        </Alert>

        {Object.entries(insights.relationships.macro.insights).map(([key, data]) => (
          <Card key={key} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg capitalize">
                {key.replace('_', ' ')} Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{data.implications}</p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Key Points:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {data.actionItems.map((item, index) => (
                    <li key={index} className="text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getAlertStyle = (level) => {
    const styles = {
      low: 'bg-green-50 border-green-200',
      moderate: 'bg-yellow-50 border-yellow-200',
      elevated: 'bg-orange-50 border-orange-200',
      high: 'bg-red-50 border-red-200'
    };
    return styles[level] || styles.moderate;
  };

  if (loading) {
    return <div>Loading market insights...</div>;
  }

  return (
    <div className="space-y-6">
      <MarketEnvironmentScore data={insights?.market} />
      
      <Tabs defaultValue="industry" className="mt-6">
        <TabsList>
          <TabsTrigger value="industry">Industry Analysis</TabsTrigger>
          <TabsTrigger value="macro">Macro Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="industry">
          {renderIndustryInsights()}
        </TabsContent>

        <TabsContent value="macro">
          {renderMacroInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketInsights;