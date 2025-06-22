import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Building } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ComposedChart, Bar 
} from 'recharts';

/**
 * Custom tooltip for fundamentals charts - FIXED null checking
 */
const FundamentalsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{data.period ? new Date(data.period).toLocaleDateString() : ''}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          {data.revenue && (
            <>
              <p className="text-gray-600">Revenue:</p>
              <p className="font-semibold">${data.revenueFormatted}</p>
            </>
          )}
          {data.netIncome !== undefined && data.netIncome !== null && (
            <>
              <p className="text-gray-600">Net Income:</p>
              <p className={`font-semibold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${data.netIncomeFormatted}
              </p>
            </>
          )}
          {data.revenueGrowth !== undefined && data.revenueGrowth !== null && (
            <>
              <p className="text-gray-600">Growth YoY:</p>
              <p className={`font-semibold ${data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.revenueGrowth.toFixed(1)}%
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Revenue Growth Chart Component - FIXED: Growth line starts from beginning
 */
const RevenueGrowthChart = ({ fundamentalsData, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue Data Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Revenue growth data could not be loaded from SEC filings.
        </p>
      </div>
    );
  }

  const revenueData = fundamentalsData.fiscalData?.Revenues?.quarterly || [];
  
  if (revenueData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Revenue Data</h3>
        <p className="text-gray-600 text-center max-w-md">
          No quarterly revenue data available for this company.
        </p>
      </div>
    );
  }

  const processedData = revenueData
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .map((item, index, arr) => {
      const revenue = item.val / 1e9;
      const period = new Date(item.end).toISOString().split('T')[0];
      
      let revenueGrowth = null;
      const currentDate = new Date(item.end);
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      // FIXED: Try YoY first, then QoQ if YoY not available
      const yoyCompare = arr.find(prev => {
        const prevDate = new Date(prev.end);
        const prevYear = prevDate.getFullYear();
        const prevQuarter = Math.floor((prevDate.getMonth() + 3) / 3);
        return prevYear === currentYear - 1 && prevQuarter === currentQuarter;
      });
      
      if (yoyCompare && yoyCompare.val > 0) {
        revenueGrowth = ((item.val - yoyCompare.val) / yoyCompare.val) * 100;
      } else if (index > 0) {
        // Use quarter-over-quarter growth when YoY isn't available
        const prevQuarter = arr[index - 1];
        if (prevQuarter && prevQuarter.val > 0) {
          revenueGrowth = ((item.val - prevQuarter.val) / prevQuarter.val) * 100;
        }
      }
      
      return {
        period,
        revenue,
        revenueFormatted: revenue.toFixed(2) + 'B',
        revenueGrowth,
        quarter: `Q${currentQuarter} ${currentYear}`
      };
    });

  const maxRevenue = Math.max(...processedData.map(d => d.revenue));
  const minRevenue = Math.min(...processedData.map(d => d.revenue));
  const revenuePadding = (maxRevenue - minRevenue) * 0.1;

  return (
    <div className="mt-6">
      <div className="mb-3 text-lg font-semibold text-gray-700 px-3 flex items-center gap-2">
        <TrendingUp className="text-green-600" size={20} />
        Quarterly Revenue Growth ({processedData.length} quarters)
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(Math.max(1, processedData.length / 8))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              domain={[Math.max(0, minRevenue - revenuePadding), maxRevenue + revenuePadding]}
              tickFormatter={(val) => `$${val.toFixed(1)}B`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={70}
            />
            <YAxis
              yAxisId="growth"
              orientation="right"
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={50}
            />
            <Tooltip content={<FundamentalsTooltip />} />
            
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="#3b82f6"
              opacity={0.7}
              name="Revenue"
            />
            
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="revenueGrowth"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
              name="YoY Growth %"
            />
            
            <ReferenceLine yAxisId="growth" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              content={(props) => (
                <div className="flex justify-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 opacity-70"></div>
                    <span>Revenue ($B)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>YoY Growth (%)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Net Income Chart Component - FIXED: Added growth line with dual Y-axes + starts from beginning
 */
const NetIncomeChart = ({ fundamentalsData, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Net Income Data Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Net income data could not be loaded from SEC filings.
        </p>
      </div>
    );
  }

  const netIncomeData = fundamentalsData.fiscalData?.NetIncomeLoss?.quarterly || [];
  
  if (netIncomeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Net Income Data</h3>
        <p className="text-gray-600 text-center max-w-md">
          No quarterly net income data available for this company.
        </p>
      </div>
    );
  }

  const processedData = netIncomeData
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .map((item, index, arr) => {
      const netIncome = item.val / 1e9;
      const period = new Date(item.end).toISOString().split('T')[0];
      const currentDate = new Date(item.end);
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      // FIXED: Calculate year-over-year growth for net income + QoQ fallback
      let netIncomeGrowth = null;
      const yoyCompare = arr.find(prev => {
        const prevDate = new Date(prev.end);
        const prevYear = prevDate.getFullYear();
        const prevQuarter = Math.floor((prevDate.getMonth() + 3) / 3);
        return prevYear === currentYear - 1 && prevQuarter === currentQuarter;
      });
      
      if (yoyCompare && yoyCompare.val !== 0) {
        if (yoyCompare.val < 0 && item.val > 0) {
          netIncomeGrowth = 200;
        } else if (yoyCompare.val > 0 && item.val < 0) {
          netIncomeGrowth = -200;
        } else if (yoyCompare.val > 0) {
          netIncomeGrowth = ((item.val - yoyCompare.val) / yoyCompare.val) * 100;
        } else if (yoyCompare.val < 0) {
          netIncomeGrowth = ((yoyCompare.val - item.val) / Math.abs(yoyCompare.val)) * 100;
        }
        
        if (netIncomeGrowth > 500) netIncomeGrowth = 500;
        if (netIncomeGrowth < -500) netIncomeGrowth = -500;
      } else if (index > 0) {
        // FIXED: Use quarter-over-quarter growth when YoY isn't available
        const prevQuarter = arr[index - 1];
        if (prevQuarter && prevQuarter.val !== 0) {
          if (prevQuarter.val < 0 && item.val > 0) {
            netIncomeGrowth = 200;
          } else if (prevQuarter.val > 0 && item.val < 0) {
            netIncomeGrowth = -200;
          } else if (prevQuarter.val > 0) {
            netIncomeGrowth = ((item.val - prevQuarter.val) / prevQuarter.val) * 100;
          } else if (prevQuarter.val < 0) {
            netIncomeGrowth = ((prevQuarter.val - item.val) / Math.abs(prevQuarter.val)) * 100;
          }
          
          if (netIncomeGrowth > 500) netIncomeGrowth = 500;
          if (netIncomeGrowth < -500) netIncomeGrowth = -500;
        }
      }
      
      return {
        period,
        netIncome,
        netIncomeFormatted: Math.abs(netIncome).toFixed(2) + 'B',
        netIncomeGrowth,
        quarter: `Q${currentQuarter} ${currentYear}`,
        isPositive: netIncome >= 0
      };
    });

  const values = processedData.map(d => d.netIncome);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1;

  return (
    <div className="mt-6">
      <div className="mb-3 text-lg font-semibold text-gray-700 px-3 flex items-center gap-2">
        <DollarSign className="text-blue-600" size={20} />
        Quarterly Net Income ({processedData.length} quarters)
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(Math.max(1, processedData.length / 8))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="netincome"
              orientation="left"
              domain={[minValue - padding, maxValue + padding]}
              tickFormatter={(val) => `$${val.toFixed(1)}B`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={70}
            />
            <YAxis
              yAxisId="growth"
              orientation="right"
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={50}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-bold text-gray-800">{data.quarter}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p className="text-gray-600">Net Income:</p>
                        <p className={`font-semibold ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          ${data.netIncomeFormatted}
                        </p>
                        {data.netIncomeGrowth !== null && data.netIncomeGrowth !== undefined && (
                          <>
                            <p className="text-gray-600">YoY Growth:</p>
                            <p className={`font-semibold ${data.netIncomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.netIncomeGrowth.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar
              yAxisId="netincome"
              dataKey="netIncome"
              name="Net Income"
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.isPositive ? '#10b981' : '#ef4444';
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    opacity={0.8}
                  />
                );
              }}
            />
            
            {/* FIXED: Added growth line */}
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="netIncomeGrowth"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
              name="YoY Growth %"
            />
            
            <ReferenceLine yAxisId="netincome" y={0} stroke="#374151" strokeWidth={2} />
            <ReferenceLine yAxisId="growth" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              content={(props) => (
                <div className="flex justify-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500"></div>
                    <span>Profit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <span>Loss</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-purple-500"></div>
                    <span>YoY Growth (%)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Gross Margins Chart Component with YoY Growth - FIXED: Starts from beginning
 */
const GrossMarginsChart = ({ fundamentalsData, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Gross Margin Data Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Gross margin data could not be calculated from SEC filings.
        </p>
      </div>
    );
  }

  const grossMarginData = fundamentalsData.fiscalData?.GrossMargins?.quarterly || [];
  
  if (grossMarginData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Gross Margin Data</h3>
        <p className="text-gray-600 text-center max-w-md">
          No gross margin data available for this company. This requires both revenue and cost of revenue data.
        </p>
      </div>
    );
  }

  const processedData = grossMarginData
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .map((item, index, arr) => {
      const grossMargin = item.grossMargin;
      const period = new Date(item.end).toISOString().split('T')[0];
      
      let marginGrowth = null;
      const currentDate = new Date(item.end);
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      const yoyCompare = arr.find(prev => {
        const prevDate = new Date(prev.end);
        const prevYear = prevDate.getFullYear();
        const prevQuarter = Math.floor((prevDate.getMonth() + 3) / 3);
        return prevYear === currentYear - 1 && prevQuarter === currentQuarter;
      });
      
      if (yoyCompare && yoyCompare.grossMargin !== undefined) {
        marginGrowth = grossMargin - yoyCompare.grossMargin;
      } else if (index > 0) {
        // FIXED: Use quarter-over-quarter change when YoY isn't available
        const prevQuarter = arr[index - 1];
        if (prevQuarter && prevQuarter.grossMargin !== undefined) {
          marginGrowth = grossMargin - prevQuarter.grossMargin;
        }
      }
      
      return {
        period,
        grossMargin,
        marginGrowth,
        quarter: `Q${currentQuarter} ${currentYear}`,
        grossMarginFormatted: `${grossMargin.toFixed(1)}%`
      };
    });

  const maxMargin = Math.max(...processedData.map(d => d.grossMargin));
  const minMargin = Math.min(...processedData.map(d => d.grossMargin));
  const marginPadding = (maxMargin - minMargin) * 0.1;

  return (
    <div className="mt-6">
      <div className="mb-3 text-lg font-semibold text-gray-700 px-3 flex items-center gap-2">
        <TrendingUp className="text-purple-600" size={20} />
        Quarterly Gross Margins ({processedData.length} quarters)
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(Math.max(1, processedData.length / 8))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="margin"
              orientation="left"
              domain={[Math.max(0, minMargin - marginPadding), maxMargin + marginPadding]}
              tickFormatter={(val) => `${val.toFixed(1)}%`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={70}
            />
            <YAxis
              yAxisId="growth"
              orientation="right"
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(val) => `${val.toFixed(1)}pp`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={60}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-bold text-gray-800">{data.quarter}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p className="text-gray-600">Gross Margin:</p>
                        <p className="font-semibold text-purple-600">{data.grossMarginFormatted}</p>
                        {data.marginGrowth !== null && (
                          <>
                            <p className="text-gray-600">YoY Change:</p>
                            <p className={`font-semibold ${data.marginGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.marginGrowth >= 0 ? '+' : ''}{data.marginGrowth.toFixed(1)}pp
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar
              yAxisId="margin"
              dataKey="grossMargin"
              fill="#8b5cf6"
              opacity={0.7}
              name="Gross Margin %"
            />
            
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="marginGrowth"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
              name="YoY Change (pp)"
            />
            
            <ReferenceLine yAxisId="growth" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              content={(props) => (
                <div className="flex justify-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 opacity-70"></div>
                    <span>Gross Margin (%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>YoY Change (pp)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Operating Cash Flow Chart Component with YoY Growth - FIXED: Starts from beginning
 */
const OperatingCashFlowChart = ({ fundamentalsData, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Operating Cash Flow Data Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Operating cash flow data could not be loaded from SEC filings.
        </p>
      </div>
    );
  }

  const cashFlowData = fundamentalsData.fiscalData?.OperatingCashFlow?.quarterly || [];
  
  if (cashFlowData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Operating Cash Flow Data</h3>
        <p className="text-gray-600 text-center max-w-md">
          No quarterly operating cash flow data available for this company.
        </p>
      </div>
    );
  }

  const processedData = cashFlowData
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .map((item, index, arr) => {
      const cashFlow = item.val / 1e9;
      const period = new Date(item.end).toISOString().split('T')[0];
      
      let cashFlowGrowth = null;
      const currentDate = new Date(item.end);
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      const yoyCompare = arr.find(prev => {
        const prevDate = new Date(prev.end);
        const prevYear = prevDate.getFullYear();
        const prevQuarter = Math.floor((prevDate.getMonth() + 3) / 3);
        return prevYear === currentYear - 1 && prevQuarter === currentQuarter;
      });
      
      if (yoyCompare && yoyCompare.val !== 0) {
        cashFlowGrowth = ((item.val - yoyCompare.val) / Math.abs(yoyCompare.val)) * 100;
      } else if (index > 0) {
        // FIXED: Use quarter-over-quarter growth when YoY isn't available
        const prevQuarter = arr[index - 1];
        if (prevQuarter && prevQuarter.val !== 0) {
          cashFlowGrowth = ((item.val - prevQuarter.val) / Math.abs(prevQuarter.val)) * 100;
        }
      }
      
      return {
        period,
        cashFlow,
        cashFlowGrowth,
        quarter: `Q${currentQuarter} ${currentYear}`,
        cashFlowFormatted: `${cashFlow >= 0 ? '$' : '-$'}${Math.abs(cashFlow).toFixed(2)}B`,
        isPositive: cashFlow >= 0
      };
    });

  const values = processedData.map(d => d.cashFlow);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1;

  return (
    <div className="mt-6">
      <div className="mb-3 text-lg font-semibold text-gray-700 px-3 flex items-center gap-2">
        <TrendingUp className="text-cyan-600" size={20} />
        Quarterly Operating Cash Flow ({processedData.length} quarters)
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(Math.max(1, processedData.length / 8))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="cashflow"
              orientation="left"
              domain={[minValue - padding, maxValue + padding]}
              tickFormatter={(val) => `$${val.toFixed(1)}B`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={70}
            />
            <YAxis
              yAxisId="growth"
              orientation="right"
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={50}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-bold text-gray-800">{data.quarter}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p className="text-gray-600">Operating Cash Flow:</p>
                        <p className={`font-semibold ${data.isPositive ? 'text-cyan-600' : 'text-red-600'}`}>
                          {data.cashFlowFormatted}
                        </p>
                        {data.cashFlowGrowth !== null && (
                          <>
                            <p className="text-gray-600">YoY Growth:</p>
                            <p className={`font-semibold ${data.cashFlowGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.cashFlowGrowth.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar
              yAxisId="cashflow"
              dataKey="cashFlow"
              name="Operating Cash Flow"
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.isPositive ? '#06b6d4' : '#ef4444';
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    opacity={0.8}
                  />
                );
              }}
            />
            
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="cashFlowGrowth"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
              name="YoY Growth %"
            />
            
            <ReferenceLine yAxisId="cashflow" y={0} stroke="#374151" strokeWidth={2} />
            <ReferenceLine yAxisId="growth" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              content={(props) => (
                <div className="flex justify-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-cyan-500"></div>
                    <span>Positive Cash Flow</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <span>Negative Cash Flow</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>YoY Growth (%)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Capital Expenditures (CAPEX) Chart Component with YoY Growth - FIXED: Starts from beginning
 */
const CapexChart = ({ fundamentalsData, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Capital Expenditures Data Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Capital expenditures data could not be loaded from SEC filings.
        </p>
      </div>
    );
  }

  const capexData = fundamentalsData.fiscalData?.CapitalExpenditures?.quarterly || [];
  
  if (capexData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <TrendingDown className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Capital Expenditures Data</h3>
        <p className="text-gray-600 text-center max-w-md">
          No quarterly capital expenditures data available for this company.
        </p>
      </div>
    );
  }

  const processedData = capexData
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .map((item, index, arr) => {
      const capex = Math.abs(item.val) / 1e9;
      const period = new Date(item.end).toISOString().split('T')[0];
      
      let capexGrowth = null;
      const currentDate = new Date(item.end);
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      const yoyCompare = arr.find(prev => {
        const prevDate = new Date(prev.end);
        const prevYear = prevDate.getFullYear();
        const prevQuarter = Math.floor((prevDate.getMonth() + 3) / 3);
        return prevYear === currentYear - 1 && prevQuarter === currentQuarter;
      });
      
      if (yoyCompare && Math.abs(yoyCompare.val) > 0) {
        const prevCapex = Math.abs(yoyCompare.val);
        capexGrowth = ((Math.abs(item.val) - prevCapex) / prevCapex) * 100;
      } else if (index > 0) {
        // FIXED: Use quarter-over-quarter growth when YoY isn't available
        const prevQuarter = arr[index - 1];
        if (prevQuarter && Math.abs(prevQuarter.val) > 0) {
          const prevCapex = Math.abs(prevQuarter.val);
          capexGrowth = ((Math.abs(item.val) - prevCapex) / prevCapex) * 100;
        }
      }
      
      return {
        period,
        capex,
        capexGrowth,
        quarter: `Q${currentQuarter} ${currentYear}`,
        capexFormatted: `$${capex.toFixed(2)}B`
      };
    });

  const maxCapex = Math.max(...processedData.map(d => d.capex));
  const minCapex = Math.min(...processedData.map(d => d.capex));
  const capexPadding = (maxCapex - minCapex) * 0.1;

  return (
    <div className="mt-6">
      <div className="mb-3 text-lg font-semibold text-gray-700 px-3 flex items-center gap-2">
        <Building className="text-orange-600" size={20} />
        Quarterly Capital Expenditures ({processedData.length} quarters)
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="quarter"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(Math.max(1, processedData.length / 8))}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="capex"
              orientation="left"
              domain={[Math.max(0, minCapex - capexPadding), maxCapex + capexPadding]}
              tickFormatter={(val) => `$${val.toFixed(1)}B`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={70}
            />
            <YAxis
              yAxisId="growth"
              orientation="right"
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              tick={{ fill: '#666666', fontSize: 11 }}
              width={50}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-bold text-gray-800">{data.quarter}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p className="text-gray-600">CAPEX:</p>
                        <p className="font-semibold text-orange-600">{data.capexFormatted}</p>
                        {data.capexGrowth !== null && (
                          <>
                            <p className="text-gray-600">YoY Growth:</p>
                            <p className={`font-semibold ${data.capexGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.capexGrowth.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar
              yAxisId="capex"
              dataKey="capex"
              fill="#f97316"
              opacity={0.7}
              name="Capital Expenditures"
            />
            
            <Line
              yAxisId="growth"
              type="monotone"
              dataKey="capexGrowth"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
              name="YoY Growth %"
            />
            
            <ReferenceLine yAxisId="growth" y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              content={(props) => (
                <div className="flex justify-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 opacity-70"></div>
                    <span>CAPEX ($B)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>YoY Growth (%)</span>
                  </div>
                </div>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Main FundamentalsCharts component that renders all financial charts
 */
const FundamentalsCharts = ({ fundamentalsData, loading, error }) => {
  return (
    <>
      <RevenueGrowthChart 
        fundamentalsData={fundamentalsData}
        loading={loading}
        error={error}
      />
      
      <NetIncomeChart 
        fundamentalsData={fundamentalsData}
        loading={loading}
        error={error}
      />

      <GrossMarginsChart 
        fundamentalsData={fundamentalsData}
        loading={loading}
        error={error}
      />

      <OperatingCashFlowChart 
        fundamentalsData={fundamentalsData}
        loading={loading}
        error={error}
      />

      <CapexChart 
        fundamentalsData={fundamentalsData}
        loading={loading}
        error={error}
      />
    </>
  );
};

export default FundamentalsCharts;