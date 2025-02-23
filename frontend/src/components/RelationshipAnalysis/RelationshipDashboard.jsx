import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndustryRelationships from './IndustryRelationships';
import MacroRelationships from './MacroRelationships';
import RelationshipAnalysis from './RelationshipAnalysis';
import MarketInsightsDisplay from './MarketInsightsDisplay';
import { Card } from '@/components/ui/card';

const RelationshipDashboard = () => {
  const [relationshipData, setRelationshipData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [relationshipsResponse, insightsResponse] = await Promise.all([
          fetch('/api/market/relationships'),
          fetch('/api/insights/market-insights')
        ]);

        const [relationships, insightsData] = await Promise.all([
          relationshipsResponse.json(),
          insightsResponse.json()
        ]);

        setRelationshipData(relationships);
        setInsights(insightsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full p-4">
        <div>Loading relationship analysis...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="industry" className="w-full">
        <TabsList>
          <TabsTrigger value="industry">Industry</TabsTrigger>
          <TabsTrigger value="macro">Macro</TabsTrigger>
        </TabsList>

        <TabsContent value="industry">
          <div className="space-y-4">
            <IndustryRelationships data={relationshipData?.industry} />
            {Object.entries(relationshipData?.industry || {}).map(([key, data]) => (
              <RelationshipAnalysis 
                key={key}
                type={key}
                data={data.performance.relative}
                dataKeys={{
                  etf1Percent: 'spread',
                  etf2Percent: 'spread'
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="macro">
          <div className="space-y-4">
            <MacroRelationships data={relationshipData?.macro} />
            {Object.entries(relationshipData?.macro || {}).map(([key, data]) => (
              <RelationshipAnalysis 
                key={key}
                type={key}
                data={data.performance.relative}
                dataKeys={data.performance.trends}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <MarketInsightsDisplay insights={insights} />
      </div>
    </div>
  );
};

export default RelationshipDashboard;