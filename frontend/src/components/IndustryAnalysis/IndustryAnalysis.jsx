import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { industryAnalysisApi } from '../../services/api';

const ETF_DESCRIPTIONS = {
  'SMH.US': 'VanEck Semiconductor ETF - Tracks the largest US semiconductor companies including NVIDIA, AMD, and Intel',
  'XSW.US': 'SPDR S&P Software & Services ETF - Tracks US software and IT service companies across all market caps',
  'XLP.US': 'Consumer Staples Select Sector SPDR - Tracks consumer staples like Procter & Gamble, Coca-Cola, and Walmart',
  'XLY.US': 'Consumer Discretionary Select Sector SPDR - Tracks retail, automotive, and leisure companies like Amazon and Tesla',
  'XLF.US': 'Financial Select Sector SPDR - Tracks major banks, insurance companies, and financial services firms',
  'XLRE.US': 'Real Estate Select Sector SPDR - Tracks REITs and real estate management companies',
  'XLE.US': 'Energy Select Sector SPDR - Tracks large-cap US energy companies, mainly oil & gas',
  'XLI.US': 'Industrial Select Sector SPDR - Tracks aerospace, defense, machinery, and transportation companies',
  'MTUM.US': 'iShares MSCI USA Momentum Factor ETF - Tracks large and mid-cap US stocks showing price momentum',
  'RSP.US': 'Invesco S&P 500 Equal Weight ETF - Tracks S&P 500 with equal weighting rather than market cap weighting',
  'IVE.US': 'iShares S&P 500 Value ETF - Tracks large-cap US value stocks with lower P/E ratios',
  'IVW.US': 'iShares S&P 500 Growth ETF - Tracks large-cap US growth stocks with higher P/E ratios'
};

const RelationshipCard = ({ title, symbols, data, description }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="text-xs text-gray-500 mb-4">
        <div className="mb-1"><span className="font-medium">{symbols[0].replace('.US', '')}:</span> {ETF_DESCRIPTIONS[symbols[0]]}</div>
        <div><span className="font-medium">{symbols[1].replace('.US', '')}:</span> {ETF_DESCRIPTIONS[symbols[1]]}</div>
      </div>
      <div className="h-64">
        {data?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value, name) => [
                  `$${parseFloat(value).toFixed(2)}`,
                  name.replace('.US', '')
                ]}
              />
              <Legend
                formatter={(value) => value.replace('.US', '')}
              />
              <Line
                type="monotone"
                dataKey="etf1Price"
                name={symbols[0]}
                stroke="#8884d8"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="etf2Price"
                name={symbols[1]}
                stroke="#82ca9d"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        )}
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
        const response = await industryAnalysisApi.getAllPairs('1y');
        console.log('Received data:', response);
        setAnalysisData(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch industry analysis data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-4">Loading industry analysis...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Industry Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RelationshipCard
          title="Technology Sector"
          description="Semiconductors vs Software Performance"
          symbols={analysisData.tech?.symbols || ['SMH.US', 'XSW.US']}
          data={analysisData.tech?.performance || []}
        />
        <RelationshipCard
          title="Consumer Sector"
          description="Consumer Staples vs Discretionary"
          symbols={analysisData.consumer?.symbols || ['XLP.US', 'XLY.US']}
          data={analysisData.consumer?.performance || []}
        />
        <RelationshipCard
          title="Financial Sector"
          description="Financials vs Real Estate"
          symbols={analysisData.realestate?.symbols || ['XLF.US', 'XLRE.US']}
          data={analysisData.realestate?.performance || []}
        />
        <RelationshipCard
          title="Industrial & Energy"
          description="Energy vs Industrial Performance"
          symbols={analysisData.industrial?.symbols || ['XLE.US', 'XLI.US']}
          data={analysisData.industrial?.performance || []}
        />
        <RelationshipCard
          title="Market Factors"
          description="Momentum vs Equal Weight"
          symbols={analysisData.momentum?.symbols || ['MTUM.US', 'RSP.US']}
          data={analysisData.momentum?.performance || []}
        />
        <RelationshipCard
          title="Investment Style"
          description="Value vs Growth"
          symbols={analysisData.style?.symbols || ['IVE.US', 'IVW.US']}
          data={analysisData.style?.performance || []}
        />
      </div>
    </div>
  );
};

export default IndustryAnalysis;