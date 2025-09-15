import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Advanced Analytics Component for Portfolio Analysis
const AdvancedAnalytics = ({ portfolioId, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('attribution');
  const [parameters, setParameters] = useState({
    lookbackPeriod: '3years',
    monteCarloSimulations: 10000,
    monteCarloHorizon: 252,
    backtestPeriods: 12,
    confidenceLevels: [0.95, 0.99]
  });

  // Fetch advanced analytics data
  const fetchAnalytics = async (customParams = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = customParams || parameters;
      const queryString = new URLSearchParams({
        lookbackPeriod: params.lookbackPeriod,
        monteCarloSimulations: params.monteCarloSimulations.toString(),
        monteCarloHorizon: params.monteCarloHorizon.toString(),
        backtestPeriods: params.backtestPeriods.toString(),
        confidenceLevels: params.confidenceLevels.join(',')
      }).toString();

      const response = await fetch(`/api/portfolio/${portfolioId}/advanced-analytics?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.advancedAnalytics?.error) {
        setError(data.advancedAnalytics.error);
        return;
      }
      
      setAnalyticsData(data);
      console.log('🔬 Advanced analytics data loaded:', data);
      
    } catch (err) {
      console.error('❌ Error fetching advanced analytics:', err);
      setError(`Failed to load advanced analytics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      fetchAnalytics();
    }
  }, [portfolioId]);

  // Custom tooltip formatters
  const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '%' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {`${entry.name}: ${prefix}${entry.value?.toFixed(2)}${suffix}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Performance Attribution Component
  const PerformanceAttribution = ({ attribution }) => {
    if (!attribution) return <div className="p-4 text-gray-500">No attribution data available</div>;

    const attributionData = [
      { name: 'Starting Return', value: 0, cumulative: 0 },
      { name: 'Asset Allocation', value: attribution.assetAllocation?.reduce((sum, item) => sum + (item.attribution || 0), 0) || 0 },
      { name: 'Security Selection', value: attribution.securitySelection?.slice(0, 5).reduce((sum, item) => sum + (item.attribution || 0), 0) || 0 },
      { name: 'Interaction Effect', value: attribution.interaction || 0 },
      { name: 'Total Alpha', value: attribution.totalAlpha || 0 }
    ].map((item, index, arr) => ({
      ...item,
      cumulative: arr.slice(0, index + 1).reduce((sum, prev) => sum + prev.value, 0)
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Attribution Analysis</h3>
          
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Alpha</div>
              <div className={`text-xl font-bold ${(attribution.totalAlpha || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {attribution.totalAlpha?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Beta</div>
              <div className="text-xl font-bold text-gray-800">
                {attribution.summary?.beta?.toFixed(2) || '1.00'}
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Tracking Error</div>
              <div className="text-xl font-bold text-gray-800">
                {attribution.summary?.trackingError?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Information Ratio</div>
              <div className="text-xl font-bold text-gray-800">
                {attribution.summary?.informationRatio?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Attribution Waterfall Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={attributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3B82F6" />
                <Line type="monotone" dataKey="cumulative" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Attribution Table */}
        {attribution.sectorAttribution && attribution.sectorAttribution.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-md font-semibold mb-4 text-gray-800">Sector Attribution</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2">Sector</th>
                    <th className="text-right p-2">Weight (%)</th>
                    <th className="text-right p-2">Attribution (%)</th>
                    <th className="text-right p-2">Symbols</th>
                  </tr>
                </thead>
                <tbody>
                  {attribution.sectorAttribution.map((sector, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-2 font-medium">{sector.sector}</td>
                      <td className="p-2 text-right">{sector.weight?.toFixed(1)}</td>
                      <td className={`p-2 text-right font-semibold ${sector.attribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sector.attribution?.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-gray-600">{sector.symbols}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Monte Carlo Simulation Component
  const MonteCarloAnalysis = ({ monteCarlo }) => {
    if (!monteCarlo) return <div className="p-4 text-gray-500">No Monte Carlo data available</div>;

    const projectionData = [
      { name: '1st Percentile', value: monteCarlo.projections?.percentile_1 || 0, color: '#DC2626' },
      { name: '5th Percentile', value: monteCarlo.projections?.percentile_5 || 0, color: '#EF4444' },
      { name: 'Median', value: monteCarlo.projections?.median || 0, color: '#3B82F6' },
      { name: '95th Percentile', value: monteCarlo.projections?.percentile_95 || 0, color: '#10B981' },
      { name: '99th Percentile', value: monteCarlo.projections?.percentile_99 || 0, color: '#059669' }
    ];

    // Process paths data for cone chart
    const pathsData = useMemo(() => {
      if (!monteCarlo.paths || monteCarlo.paths.length === 0) return [];
      
      const dayGroups = {};
      monteCarlo.paths.forEach(point => {
        if (!dayGroups[point.day]) {
          dayGroups[point.day] = [];
        }
        dayGroups[point.day].push(point.value);
      });

      return Object.entries(dayGroups).map(([day, values]) => {
        values.sort((a, b) => a - b);
        return {
          day: parseInt(day),
          p5: values[Math.floor(values.length * 0.05)] || 0,
          p25: values[Math.floor(values.length * 0.25)] || 0,
          median: values[Math.floor(values.length * 0.5)] || 0,
          p75: values[Math.floor(values.length * 0.75)] || 0,
          p95: values[Math.floor(values.length * 0.95)] || 0
        };
      }).sort((a, b) => a.day - b.day);
    }, [monteCarlo.paths]);

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monte Carlo Simulation Results</h3>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {projectionData.map((projection, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">{projection.name}</div>
                <div className={`text-xl font-bold`} style={{ color: projection.color }}>
                  {projection.value?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {/* Probability Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Probability of Gain</div>
              <div className="text-xl font-bold text-green-600">
                {monteCarlo.projections?.probability_positive?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Probability of 10%+ Loss</div>
              <div className="text-xl font-bold text-red-600">
                {monteCarlo.projections?.probability_loss_10?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Probability of 20%+ Gain</div>
              <div className="text-xl font-bold text-blue-600">
                {monteCarlo.projections?.probability_gain_20?.toFixed(1) || '0.0'}%
              </div>
            </div>
          </div>

          {/* Monte Carlo Cone Chart */}
          {pathsData.length > 0 && (
            <div className="h-96">
              <h4 className="text-md font-semibold mb-2 text-gray-800">Projection Cone ({monteCarlo.simulations?.toLocaleString()} simulations)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pathsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="coneGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="p95" stroke="#10B981" fill="url(#coneGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="p75" stroke="#3B82F6" fill="transparent" strokeWidth={1} />
                  <Line type="monotone" dataKey="median" stroke="#1F2937" strokeWidth={3} dot={false} />
                  <Area type="monotone" dataKey="p25" stroke="#3B82F6" fill="transparent" strokeWidth={1} />
                  <Area type="monotone" dataKey="p5" stroke="#EF4444" fill="transparent" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Factor Analysis Component
  const FactorAnalysis = ({ factorAnalysis }) => {
    if (!factorAnalysis) return <div className="p-4 text-gray-500">No factor analysis data available</div>;

    const radarData = Object.entries(factorAnalysis.exposures || {}).map(([factor, exposure]) => ({
      factor: factor.charAt(0).toUpperCase() + factor.slice(1),
      exposure: Math.abs(exposure || 0) * 100,
      direction: (exposure || 0) >= 0 ? 'Long' : 'Short'
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Factor Analysis</h3>
          
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">R-Squared</div>
              <div className="text-xl font-bold text-blue-600">
                {(factorAnalysis.rSquared * 100)?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Factor Alpha</div>
              <div className={`text-xl font-bold ${(factorAnalysis.alpha || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {factorAnalysis.alpha?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Residual Volatility</div>
              <div className="text-xl font-bold text-orange-600">
                {factorAnalysis.residualVolatility?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Dominant Factor</div>
              <div className="text-xl font-bold text-purple-600">
                {factorAnalysis.summary?.dominantFactor || 'N/A'}
              </div>
            </div>
          </div>

          {/* Factor Exposure Radar Chart */}
          {radarData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <h4 className="text-md font-semibold mb-2 text-gray-800">Factor Exposures</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis domain={[0, 'dataMax']} tickCount={5} />
                    <Radar name="Exposure" dataKey="exposure" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold">{payload[0].payload.factor}</p>
                              <p className="text-blue-600">Exposure: {payload[0].value?.toFixed(2)}%</p>
                              <p className="text-gray-600">Direction: {payload[0].payload.direction}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Factor Contributions Table */}
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-800">Factor Contributions</h4>
                <div className="overflow-y-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-2">Factor</th>
                        <th className="text-right p-2">Exposure</th>
                        <th className="text-right p-2">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factorAnalysis.factorContributions?.map((factor, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-2 font-medium capitalize">{factor.factor}</td>
                          <td className={`p-2 text-right font-semibold ${factor.exposure >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {factor.exposure?.toFixed(2)}
                          </td>
                          <td className="p-2 text-right text-gray-600">
                            {factor.contribution?.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Historical Backtesting Component
  const BacktestingAnalysis = ({ backtesting }) => {
    if (!backtesting) return <div className="p-4 text-gray-500">No backtesting data available</div>;

    const backestingChart = backtesting.periods?.map((period, index) => ({
      period: `Period ${period.period}`,
      return: period.return || 0,
      volatility: period.volatility || 0,
      sharpeRatio: period.sharpeRatio || 0,
      startDate: period.startDate,
      endDate: period.endDate
    })) || [];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Historical Backtesting Results</h3>
          
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Return</div>
              <div className={`text-xl font-bold ${(backtesting.summary?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {backtesting.summary?.totalReturn?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Avg Sharpe Ratio</div>
              <div className="text-xl font-bold text-blue-600">
                {backtesting.summary?.sharpeRatio?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Max Drawdown</div>
              <div className="text-xl font-bold text-red-600">
                -{Math.abs(backtesting.summary?.maxDrawdown || 0).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-xl font-bold text-purple-600">
                {backtesting.summary?.winRate?.toFixed(1) || '0.0'}%
              </div>
            </div>
          </div>

          {/* Backtesting Performance Chart */}
          {backestingChart.length > 0 && (
            <div className="h-96">
              <h4 className="text-md font-semibold mb-2 text-gray-800">Rolling Period Performance</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={backestingChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Sharpe Ratio', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold">{label}</p>
                            <p className="text-blue-600">Return: {data.return?.toFixed(2)}%</p>
                            <p className="text-green-600">Volatility: {data.volatility?.toFixed(2)}%</p>
                            <p className="text-purple-600">Sharpe: {data.sharpeRatio?.toFixed(2)}</p>
                            <p className="text-gray-600 text-xs">{data.startDate} to {data.endDate}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="return" fill="#3B82F6" />
                  <Line yAxisId="right" type="monotone" dataKey="sharpeRatio" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
                  <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Advanced Risk Metrics Component
  const AdvancedRiskMetrics = ({ riskMetrics }) => {
    if (!riskMetrics) return <div className="p-4 text-gray-500">No advanced risk metrics available</div>;

    const riskData = [
      { name: '95% VaR', value: riskMetrics.detailedMetrics?.['95%']?.var || 0 },
      { name: '95% CVaR', value: riskMetrics.cvar?.['95%'] || 0 },
      { name: '99% VaR', value: riskMetrics.detailedMetrics?.['99%']?.var || 0 },
      { name: '99% CVaR', value: riskMetrics.cvar?.['99%'] || 0 }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Advanced Risk Metrics</h3>
          
          {/* Risk Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Portfolio Volatility</div>
              <div className="text-xl font-bold text-red-600">
                {riskMetrics.riskSummary?.volatility?.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Max Drawdown</div>
              <div className="text-xl font-bold text-orange-600">
                -{Math.abs(riskMetrics.riskSummary?.maxDrawdown || 0).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Skewness</div>
              <div className={`text-xl font-bold ${(riskMetrics.riskSummary?.skewness || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {riskMetrics.riskSummary?.skewness?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Kurtosis</div>
              <div className="text-xl font-bold text-purple-600">
                {riskMetrics.riskSummary?.kurtosis?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Risk Metrics Chart */}
          <div className="h-64 mb-6">
            <h4 className="text-md font-semibold mb-2 text-gray-800">Value at Risk vs Conditional Value at Risk</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Risk (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip prefix="-" />} />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Extreme Events */}
          {riskMetrics.extremeEvents && riskMetrics.extremeEvents.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 text-gray-800">Extreme Events (>3σ)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Return (%)</th>
                      <th className="text-right p-2">Magnitude (σ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskMetrics.extremeEvents.slice(0, 5).map((event, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className={`p-2 font-medium ${event.type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {event.type === 'positive' ? 'Gain' : 'Loss'}
                        </td>
                        <td className={`p-2 text-right font-semibold ${event.type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {event.return?.toFixed(2)}
                        </td>
                        <td className="p-2 text-right text-gray-600">
                          {event.magnitude?.toFixed(1)}σ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading advanced analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Advanced Portfolio Analytics</h2>
            <p className="text-gray-600 mt-1">
              {analyticsData?.portfolio?.name || 'Portfolio Analysis'} • {parameters.lookbackPeriod} lookback
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'attribution', name: 'Performance Attribution', icon: '📊' },
              { id: 'monteCarlo', name: 'Monte Carlo', icon: '🎲' },
              { id: 'factors', name: 'Factor Analysis', icon: '📋' },
              { id: 'backtesting', name: 'Backtesting', icon: '⏮️' },
              { id: 'risk', name: 'Advanced Risk', icon: '⚠️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {analyticsData?.advancedAnalytics ? (
            <>
              {activeTab === 'attribution' && <PerformanceAttribution attribution={analyticsData.advancedAnalytics.attributionAnalysis} />}
              {activeTab === 'monteCarlo' && <MonteCarloAnalysis monteCarlo={analyticsData.advancedAnalytics.monteCarloAnalysis} />}
              {activeTab === 'factors' && <FactorAnalysis factorAnalysis={analyticsData.advancedAnalytics.factorAnalysis} />}
              {activeTab === 'backtesting' && <BacktestingAnalysis backtesting={analyticsData.advancedAnalytics.backtestingAnalysis} />}
              {activeTab === 'risk' && <AdvancedRiskMetrics riskMetrics={analyticsData.advancedAnalytics.advancedRiskMetrics} />}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analytics Data</h3>
                <p className="text-gray-500">Add holdings to your portfolio to see advanced analytics.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Parameters */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span>Parameters: {parameters.monteCarloSimulations.toLocaleString()} simulations</span>
              <span>Horizon: {parameters.monteCarloHorizon} days</span>
              <span>Backtest periods: {parameters.backtestPeriods}</span>
            </div>
            <button 
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;