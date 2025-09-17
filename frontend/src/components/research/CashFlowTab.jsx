import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, ArrowUpDown } from 'lucide-react';

const CashFlowTab = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart refs
  const pairedBarChartRef = useRef(null);
  const operatingCashFlowGrowthRef = useRef(null);
  const capexGrowthRef = useRef(null);
  
  // Helper function to get capital expenditure value (handles both field names)
  const getCapitalExpenditure = (item) => {
    return item.capitalExpenditure || item.capitalExpenditures || 0;
  };
  
  // Fetch cash flow data
  useEffect(() => {
    if (!symbol) return;
    
    const fetchCashFlowData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/fundamentals/cash-flow/${symbol}?limit=12`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cash flow data: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Cash flow fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCashFlowData();
  }, [symbol]);
  
  // Initialize Operating Cash Flow vs Free Cash Flow paired bar chart
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = pairedBarChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data for the last 12 quarters
    const chartData = data.data.slice(0, 12).reverse();
    const dates = chartData.map(d => d.date);
    const operatingCashFlow = chartData.map(d => d.operatingCashFlow || 0);
    const freeCashFlow = chartData.map(d => d.freeCashFlow || 0);
    
    const option = {
      title: {
        text: 'Cash Flow Overview',
        subtext: 'Operating Cash Flow vs Free Cash Flow (in millions)',
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
        data: ['Operating Cash Flow', 'Free Cash Flow'],
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
            return '$' + (value / 1000000).toFixed(0) + 'M';
          }
        }
      },
      series: [
        {
          name: 'Operating Cash Flow',
          type: 'bar',
          data: operatingCashFlow,
          itemStyle: { color: '#3b82f6' },
          barGap: '0%'
        },
        {
          name: 'Free Cash Flow',
          type: 'bar',
          data: freeCashFlow,
          itemStyle: { color: '#10b981' }
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
  
  // Initialize Operating Cash Flow Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = operatingCashFlowGrowthRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const operatingCashFlows = displayData.map(d => d.operatingCashFlow || 0);
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentOCF = period.operatingCashFlow || 0;
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearOCF = allData[lastYearIndex].operatingCashFlow || 0;
        if (lastYearOCF !== 0) {
          return ((currentOCF - lastYearOCF) / Math.abs(lastYearOCF)) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Operating Cash Flow Growth Analysis',
        subtext: 'Quarterly Operating Cash Flow with Year-over-Year Growth Rate',
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
            if (param.seriesName === 'Operating Cash Flow') {
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
        data: ['Operating Cash Flow', 'YoY Growth'],
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
          name: 'Operating Cash Flow',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return '$' + (value / 1000000).toFixed(0) + 'M';
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
          name: 'Operating Cash Flow',
          type: 'bar',
          data: operatingCashFlows,
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
  
  // Initialize Capital Expenditures Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = capexGrowthRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const capitalExpenditures = displayData.map(d => Math.abs(getCapitalExpenditure(d)));
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentCapex = Math.abs(getCapitalExpenditure(period));
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearCapex = Math.abs(getCapitalExpenditure(allData[lastYearIndex]));
        if (lastYearCapex !== 0) {
          return ((currentCapex - lastYearCapex) / lastYearCapex) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Capital Expenditures Growth Analysis',
        subtext: 'Quarterly Capital Expenditures with Year-over-Year Growth Rate',
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
            if (param.seriesName === 'Capital Expenditures') {
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
        data: ['Capital Expenditures', 'YoY Growth'],
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
          name: 'Capital Expenditures',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return '$' + (value / 1000000).toFixed(0) + 'M';
            }
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#f59e0b'
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
          name: 'Capital Expenditures',
          type: 'bar',
          data: capitalExpenditures,
          itemStyle: { color: '#f59e0b' },
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cash flow data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading cash flow: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <p className="text-yellow-700">No cash flow data available for {symbol}</p>
      </div>
    );
  }
  
  const latestData = data.data[0];
  const previousData = data.data[1] || latestData;
  
  // Calculate changes
  const calculateChange = (current, previous) => {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  
  const metrics = [
    {
      label: 'Operating Cash Flow',
      value: latestData.operatingCashFlow,
      change: calculateChange(latestData.operatingCashFlow, previousData.operatingCashFlow),
      icon: Activity
    },
    {
      label: 'Free Cash Flow',
      value: latestData.freeCashFlow,
      change: calculateChange(latestData.freeCashFlow, previousData.freeCashFlow),
      icon: DollarSign
    },
    {
      label: 'Capital Expenditures',
      value: Math.abs(getCapitalExpenditure(latestData)),
      change: calculateChange(getCapitalExpenditure(latestData), getCapitalExpenditure(previousData)),
      icon: ArrowUpDown
    },
    {
      label: 'Net Change in Cash',
      value: latestData.netChangeInCash,
      change: calculateChange(latestData.netChangeInCash, previousData.netChangeInCash),
      icon: TrendingUp
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
                {metric.label === 'Capital Expenditures' ? '-' : ''}
                ${metric.value ? (Math.abs(metric.value) / 1000000).toFixed(1) + 'M' : 'N/A'}
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
      
      {/* Operating Cash Flow vs Free Cash Flow Paired Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={pairedBarChartRef} style={{ height: '400px' }}></div>
      </div>
      
      {/* Growth Charts - Two side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Cash Flow Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={operatingCashFlowGrowthRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* Capital Expenditures Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={capexGrowthRef} style={{ height: '400px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowTab;
