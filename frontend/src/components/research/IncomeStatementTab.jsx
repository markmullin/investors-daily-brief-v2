import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, AlertCircle, Percent } from 'lucide-react';
import RevenueSegmentsChart from './RevenueSegmentsChart';

const IncomeStatementTab = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart refs
  const performanceChartRef = useRef(null);
  const marginChartRef = useRef(null);
  const revenueGrowthChartRef = useRef(null);
  const operatingIncomeGrowthChartRef = useRef(null);
  
  // Fetch income statement data
  useEffect(() => {
    if (!symbol) return;
    
    const fetchIncomeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch income statement, revenue segments, and cash flow data
        const [incomeResponse, segmentResponse, cashFlowResponse] = await Promise.all([
          fetch(`/api/fundamentals/income-statement/${symbol}?limit=12`),
          fetch(`/api/research/financial-statements/revenue-segments/${symbol}?limit=12`),
          fetch(`/api/research/financial-statements/cash-flow/${symbol}?limit=12`)
        ]);
        
        if (!incomeResponse.ok) {
          throw new Error(`Failed to fetch income statement data: ${incomeResponse.statusText}`);
        }
        
        const incomeResult = await incomeResponse.json();
        const segmentResult = segmentResponse.ok ? await segmentResponse.json() : null;
        const cashFlowResult = cashFlowResponse.ok ? await cashFlowResponse.json() : null;
        
        console.log('Income statement data:', incomeResult);
        console.log('Revenue segments data:', segmentResult);
        console.log('Cash flow data:', cashFlowResult);
        
        setData({
          income: incomeResult,
          segments: segmentResult,
          cashFlow: cashFlowResult
        });
      } catch (err) {
        console.error('Income statement fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncomeData();
  }, [symbol]);
  
  // Initialize Revenue, Operating Income, and Operating Cash Flow horizontal bar chart
  useEffect(() => {
    if (!data || !data.income || !data.income.data || data.income.data.length === 0) return;
    
    const chartDom = performanceChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data for the last 12 quarters
    const chartData = data.income.data.slice(0, 12).reverse();
    const dates = chartData.map(d => d.date);
    const revenue = chartData.map(d => d.revenue || 0);
    const operatingIncome = chartData.map(d => d.operatingIncome || 0);
    
    // Get operating cash flow from cash flow data if available
    let operatingCashFlow = [];
    if (data.cashFlow && data.cashFlow.data && data.cashFlow.data.length > 0) {
      // Match cash flow data with income statement dates
      const cashFlowMap = {};
      data.cashFlow.data.forEach(cf => {
        cashFlowMap[cf.date] = cf.operatingCashFlow || 0;
      });
      
      operatingCashFlow = dates.map(date => cashFlowMap[date] || 0);
    } else {
      // Fallback to EBITDA if cash flow data not available
      operatingCashFlow = chartData.map(d => d.ebitda || d.operatingIncome || 0);
    }
    
    const option = {
      title: {
        text: 'Financial Performance Overview',
        subtext: 'Revenue, Operating Income & Operating Cash Flow (in millions)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(1)}M<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Total Revenue', 'Operating Income', 'Operating Cash Flow'],
        bottom: 0
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value) {
            return '$' + (value / 1000000000).toFixed(0) + 'B';
          }
        }
      },
      series: [
        {
          name: 'Total Revenue',
          type: 'bar',
          data: revenue,
          itemStyle: { color: '#3b82f6' },
          barGap: '0%'
        },
        {
          name: 'Operating Income',
          type: 'bar',
          data: operatingIncome,
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Operating Cash Flow',
          type: 'bar',
          data: operatingCashFlow,
          itemStyle: { color: '#f59e0b' }
        }
      ]
    };
    
    myChart.setOption(option);
    
    // Handle resize
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data]);
  
  // Initialize Revenue Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.income || !data.income.data || data.income.data.length === 0) return;
    
    const chartDom = revenueGrowthChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.income.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const revenues = displayData.map(d => d.revenue || 0);
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentRevenue = period.revenue || 0;
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearRevenue = allData[lastYearIndex].revenue || 0;
        if (lastYearRevenue > 0) {
          return ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Revenue Growth Analysis',
        subtext: 'Quarterly Revenue with Year-over-Year Growth Rate',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            if (param.seriesName === 'Revenue') {
              result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(1)}M<br/>`;
            } else if (param.seriesName === 'YoY Growth' && param.value !== null) {
              const color = param.value >= 0 ? '#10b981' : '#ef4444';
              result += `<span style="color: ${color}">${param.marker} ${param.seriesName}: ${param.value > 0 ? '+' : ''}${param.value.toFixed(1)}%</span><br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Revenue', 'YoY Growth'],
        bottom: 0
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Revenue',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return '$' + (value / 1000000000).toFixed(1) + 'B';
            }
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#3b82f6'
            }
          }
        },
        {
          type: 'value',
          name: 'YoY Growth %',
          position: 'right',
          axisLabel: {
            formatter: '{value}%'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#10b981'
            }
          }
        }
      ],
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: revenues,
          itemStyle: { color: '#3b82f6' },
          yAxisIndex: 0
        },
        {
          name: 'YoY Growth',
          type: 'line',
          data: yoyGrowth,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#10b981'
          },
          itemStyle: {
            color: function(params) {
              return params.value >= 0 ? '#10b981' : '#ef4444';
            }
          },
          connectNulls: false
        }
      ]
    };
    
    myChart.setOption(option);
    
    // Handle resize
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data]);
  
  // Initialize Operating Income Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.income || !data.income.data || data.income.data.length === 0) return;
    
    const chartDom = operatingIncomeGrowthChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.income.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const operatingIncomes = displayData.map(d => d.operatingIncome || 0);
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentOpIncome = period.operatingIncome || 0;
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearOpIncome = allData[lastYearIndex].operatingIncome || 0;
        if (lastYearOpIncome !== 0) {
          return ((currentOpIncome - lastYearOpIncome) / Math.abs(lastYearOpIncome)) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Operating Income Growth Analysis',
        subtext: 'Quarterly Operating Income with Year-over-Year Growth Rate',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            if (param.seriesName === 'Operating Income') {
              result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(1)}M<br/>`;
            } else if (param.seriesName === 'YoY Growth' && param.value !== null) {
              const color = param.value >= 0 ? '#10b981' : '#ef4444';
              result += `<span style="color: ${color}">${param.marker} ${param.seriesName}: ${param.value > 0 ? '+' : ''}${param.value.toFixed(1)}%</span><br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Operating Income', 'YoY Growth'],
        bottom: 0
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Operating Income',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return '$' + (value / 1000000).toFixed(0) + 'M';
            }
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#6366f1'
            }
          }
        },
        {
          type: 'value',
          name: 'YoY Growth %',
          position: 'right',
          axisLabel: {
            formatter: '{value}%'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#10b981'
            }
          }
        }
      ],
      series: [
        {
          name: 'Operating Income',
          type: 'bar',
          data: operatingIncomes,
          itemStyle: { color: '#6366f1' },
          yAxisIndex: 0
        },
        {
          name: 'YoY Growth',
          type: 'line',
          data: yoyGrowth,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#10b981'
          },
          itemStyle: {
            color: function(params) {
              return params.value >= 0 ? '#10b981' : '#ef4444';
            }
          },
          connectNulls: false
        }
      ]
    };
    
    myChart.setOption(option);
    
    // Handle resize
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data]);
  
  // Initialize margin analysis chart
  useEffect(() => {
    if (!data || !data.income || !data.income.data || data.income.data.length === 0) return;
    
    const chartDom = marginChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Calculate margins for each period
    const marginData = data.income.data.slice().reverse().map(period => {
      const grossMargin = period.revenue ? ((period.grossProfit || 0) / period.revenue) * 100 : 0;
      const operatingMargin = period.revenue ? ((period.operatingIncome || 0) / period.revenue) * 100 : 0;
      const netMargin = period.revenue ? ((period.netIncome || 0) / period.revenue) * 100 : 0;
      
      return {
        date: period.date,
        grossMargin,
        operatingMargin,
        netMargin
      };
    });
    
    const option = {
      title: {
        text: 'Profit Margin Analysis',
        subtext: 'Percentage of revenue',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(1)}%<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Gross Margin', 'Operating Margin', 'Net Margin'],
        bottom: 0
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: marginData.map(d => d.date),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: 'Margin %',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'Gross Margin',
          type: 'line',
          smooth: true,
          data: marginData.map(d => d.grossMargin),
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Operating Margin',
          type: 'line',
          smooth: true,
          data: marginData.map(d => d.operatingMargin),
          itemStyle: { color: '#f59e0b' }
        },
        {
          name: 'Net Margin',
          type: 'line',
          smooth: true,
          data: marginData.map(d => d.netMargin),
          itemStyle: { color: '#6366f1' }
        }
      ]
    };
    
    myChart.setOption(option);
    
    // Handle resize
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading income statement data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading income statement: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!data || !data.income || !data.income.data || data.income.data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <p className="text-yellow-700">No income statement data available for {symbol}</p>
      </div>
    );
  }
  
  const latestData = data.income.data[0];
  const previousData = data.income.data[1] || latestData;
  
  // Calculate changes
  const calculateChange = (current, previous) => {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  
  const metrics = [
    {
      label: 'Revenue',
      value: latestData.revenue,
      change: calculateChange(latestData.revenue, previousData.revenue),
      icon: DollarSign
    },
    {
      label: 'Gross Profit',
      value: latestData.grossProfit,
      change: calculateChange(latestData.grossProfit, previousData.grossProfit),
      icon: BarChart2
    },
    {
      label: 'Operating Income',
      value: latestData.operatingIncome,
      change: calculateChange(latestData.operatingIncome, previousData.operatingIncome),
      icon: TrendingUp
    },
    {
      label: 'Net Income',
      value: latestData.netIncome,
      change: calculateChange(latestData.netIncome, previousData.netIncome),
      icon: DollarSign
    }
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{metric.label}</span>
              <metric.icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold">
                ${metric.value ? (metric.value / 1000000).toFixed(1) + 'M' : 'N/A'}
              </span>
              {metric.change !== null && (
                <span className={`ml-2 text-sm flex items-center ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Revenue, Operating Income & Operating Cash Flow Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={performanceChartRef} style={{ height: '400px' }}></div>
      </div>
      
      {/* Revenue Segments Stacked Bar Chart */}
      {data.segments && <RevenueSegmentsChart data={data.segments} symbol={symbol} />}
      
      {/* New Growth Charts - Two side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={revenueGrowthChartRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* Operating Income Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={operatingIncomeGrowthChartRef} style={{ height: '400px' }}></div>
        </div>
      </div>
      
      {/* Profit Margin Analysis Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={marginChartRef} style={{ height: '400px' }}></div>
      </div>
    </div>
  );
};

export default IncomeStatementTab;
