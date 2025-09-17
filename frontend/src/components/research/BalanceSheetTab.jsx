import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { TrendingUp, TrendingDown, DollarSign, Building, AlertCircle } from 'lucide-react';

const BalanceSheetTab = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart refs - now we have 5 charts
  const assetsLiabilitiesChartRef = useRef(null);
  const debtChartRef = useRef(null);
  const cashWorkingCapitalChartRef = useRef(null);
  const retainedEarningsChartRef = useRef(null);
  const sharesOutstandingChartRef = useRef(null);
  
  // Fetch balance sheet data
  useEffect(() => {
    if (!symbol) return;
    
    const fetchBalanceSheetData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/research/financial-statements/balance-sheet/${symbol}?limit=12`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch balance sheet data: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Balance sheet data received:', result);
        setData(result);
      } catch (err) {
        console.error('Balance sheet fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalanceSheetData();
  }, [symbol]);
  
  // Initialize Assets vs Liabilities bar chart
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = assetsLiabilitiesChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data for the last 12 quarters
    const chartData = data.data.slice(0, 12).reverse();
    const dates = chartData.map(d => d.date);
    const assets = chartData.map(d => d.totalAssets || 0);
    const liabilities = chartData.map(d => d.totalLiabilities || 0);
    
    const option = {
      title: {
        text: 'Total Assets vs Total Liabilities',
        subtext: 'Quarterly comparison (in millions)',
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
        data: ['Total Assets', 'Total Liabilities'],
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
          name: 'Total Assets',
          type: 'bar',
          data: assets,
          itemStyle: { color: '#3b82f6' },
          barGap: '0%'
        },
        {
          name: 'Total Liabilities',
          type: 'bar',
          data: liabilities,
          itemStyle: { color: '#ef4444' }
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
  
  // Initialize Total Debt bar chart
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = debtChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data for the last 12 quarters
    const chartData = data.data.slice(0, 12).reverse();
    const dates = chartData.map(d => d.date);
    const totalDebt = chartData.map(d => d.totalDebt || 0);
    const totalEquity = chartData.map(d => d.totalEquity || 0);
    
    const option = {
      title: {
        text: 'Total Debt vs Total Equity',
        subtext: 'Capital structure over time (in millions)',
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
          // Add debt-to-equity ratio
          const debtValue = params[0].value;
          const equityValue = params[1].value;
          if (equityValue > 0) {
            const ratio = (debtValue / equityValue).toFixed(2);
            result += `<br/>Debt-to-Equity Ratio: ${ratio}`;
          }
          return result;
        }
      },
      legend: {
        data: ['Total Debt', 'Total Equity'],
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
          name: 'Total Debt',
          type: 'bar',
          data: totalDebt,
          itemStyle: { color: '#f59e0b' },
          barGap: '0%'
        },
        {
          name: 'Total Equity',
          type: 'bar',
          data: totalEquity,
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
  
  // Initialize Cash & Equivalents + Working Capital Area Chart
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = cashWorkingCapitalChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data for the last 12 quarters
    const chartData = data.data.slice(0, 12).reverse();
    
    const dates = chartData.map(d => d.date);
    const cashAndEquivalents = chartData.map(d => d.cashAndEquivalents || 0);
    
    // Calculate working capital - using the simpler formula that's more commonly available
    const workingCapital = chartData.map(d => {
      // Try different field names that might be used
      const currentAssets = d.currentAssets || d.totalCurrentAssets || 0;
      const currentLiabilities = d.currentLiabilities || d.totalCurrentLiabilities || 0;
      
      // Alternative calculation if current assets/liabilities not available
      if (currentAssets === 0 && currentLiabilities === 0) {
        // Use a proxy: Cash + Receivables + Inventory - Current Liabilities
        const cash = d.cashAndEquivalents || 0;
        const receivables = d.netReceivables || d.accountsReceivable || 0;
        const inventory = d.inventory || 0;
        const shortTermDebt = d.shortTermDebt || 0;
        const accountsPayable = d.accountsPayable || 0;
        
        const estimatedCurrentAssets = cash + receivables + inventory;
        const estimatedCurrentLiabilities = shortTermDebt + accountsPayable;
        
        return estimatedCurrentAssets - estimatedCurrentLiabilities;
      }
      
      return currentAssets - currentLiabilities;
    });
    
    const option = {
      title: {
        text: 'Cash & Equivalents and Working Capital',
        subtext: 'Quarterly trends (in millions)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(1)}M<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Cash & Equivalents', 'Working Capital'],
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
            return '$' + (value / 1000000000).toFixed(1) + 'B';
          }
        }
      },
      series: [
        {
          name: 'Cash & Equivalents',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: cashAndEquivalents,
          lineStyle: {
            width: 3,
            color: '#3b82f6'
          },
          itemStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          }
        },
        {
          name: 'Working Capital',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: workingCapital,
          lineStyle: {
            width: 3,
            color: '#10b981'
          },
          itemStyle: {
            color: '#10b981'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ])
          }
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
  
  // Initialize Retained Earnings Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = retainedEarningsChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const retainedEarnings = displayData.map(d => d.retainedEarnings || 0);
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentRE = period.retainedEarnings || 0;
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearRE = allData[lastYearIndex].retainedEarnings || 0;
        if (lastYearRE !== 0) {
          return ((currentRE - lastYearRE) / Math.abs(lastYearRE)) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Retained Earnings Growth Analysis',
        subtext: 'Quarterly Retained Earnings with Year-over-Year Growth Rate',
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
            if (param.seriesName === 'Retained Earnings') {
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
        data: ['Retained Earnings', 'YoY Growth'],
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
          name: 'Retained Earnings',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return '$' + (value / 1000000).toFixed(0) + 'M';
            }
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#8b5cf6'
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
          name: 'Retained Earnings',
          type: 'bar',
          data: retainedEarnings,
          itemStyle: { color: '#8b5cf6' },
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
  
  // Initialize Shares Outstanding Growth Chart (Bars + YoY Growth Line)
  useEffect(() => {
    if (!data || !data.data || data.data.length === 0) return;
    
    const chartDom = sharesOutstandingChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Prepare data - we need at least 5 quarters to calculate YoY for the first quarter
    const allData = data.data.slice().reverse();
    const displayData = allData.slice(-8); // Show last 8 quarters
    
    const dates = displayData.map(d => d.date);
    const sharesOutstanding = displayData.map(d => (d.commonStock || d.sharesOutstanding || 0) / 1000000); // Convert to millions
    
    // Calculate YoY growth
    const yoyGrowth = displayData.map((period, index) => {
      const currentShares = period.commonStock || period.sharesOutstanding || 0;
      // Look for same quarter last year (4 quarters back in the full dataset)
      const fullDataIndex = allData.findIndex(d => d.date === period.date);
      const lastYearIndex = fullDataIndex - 4;
      
      if (lastYearIndex >= 0 && allData[lastYearIndex]) {
        const lastYearShares = allData[lastYearIndex].commonStock || allData[lastYearIndex].sharesOutstanding || 0;
        if (lastYearShares !== 0) {
          return ((currentShares - lastYearShares) / Math.abs(lastYearShares)) * 100;
        }
      }
      return null;
    });
    
    const option = {
      title: {
        text: 'Shares Outstanding Growth Analysis',
        subtext: 'Quarterly Shares Outstanding with Year-over-Year Growth Rate',
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
            if (param.seriesName === 'Shares Outstanding') {
              result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(1)}M shares<br/>`;
            } else if (param.seriesName === 'YoY Growth' && param.value !== null) {
              const color = param.value >= 0 ? '#ef4444' : '#10b981'; // Red for dilution, green for buybacks
              result += `<span style="color: ${color}">${param.marker} ${param.seriesName}: ${param.value > 0 ? '+' : ''}${param.value.toFixed(1)}%</span><br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Shares Outstanding', 'YoY Growth'],
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
          name: 'Shares (Millions)',
          position: 'left',
          axisLabel: {
            formatter: function(value) {
              return value.toFixed(0) + 'M';
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
          name: 'Shares Outstanding',
          type: 'bar',
          data: sharesOutstanding,
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
              return params.value >= 0 ? '#ef4444' : '#10b981'; // Red for dilution, green for buybacks
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
          <p className="text-gray-500">Loading balance sheet data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading balance sheet: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <p className="text-yellow-700">No balance sheet data available for {symbol}</p>
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
  
  // Updated metrics to use correct field names from FMP
  const metrics = [
    {
      label: 'Total Assets',
      value: latestData.totalAssets,
      change: calculateChange(latestData.totalAssets, previousData.totalAssets),
      icon: Building
    },
    {
      label: 'Total Equity',
      value: latestData.totalEquity, // Fixed: was totalStockholdersEquity
      change: calculateChange(latestData.totalEquity, previousData.totalEquity),
      icon: DollarSign
    },
    {
      label: 'Cash & Equivalents',
      value: latestData.cashAndEquivalents, // Fixed: was cashAndCashEquivalents
      change: calculateChange(latestData.cashAndEquivalents, previousData.cashAndEquivalents),
      icon: DollarSign
    },
    {
      label: 'Total Debt',
      value: latestData.totalDebt,
      change: calculateChange(latestData.totalDebt, previousData.totalDebt),
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
      
      {/* Assets vs Liabilities Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={assetsLiabilitiesChartRef} style={{ height: '400px' }}></div>
      </div>
      
      {/* Debt vs Equity Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={debtChartRef} style={{ height: '400px' }}></div>
      </div>
      
      {/* Cash & Equivalents + Working Capital Area Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div ref={cashWorkingCapitalChartRef} style={{ height: '400px' }}></div>
      </div>
      
      {/* Two New Horizontal Bar Charts - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retained Earnings Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={retainedEarningsChartRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* Shares Outstanding Growth Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={sharesOutstandingChartRef} style={{ height: '400px' }}></div>
        </div>
      </div>
      
      {/* Optional: Add a simple insight box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Balance Sheet Insights</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Latest Debt-to-Equity Ratio: {latestData.totalDebt && latestData.totalEquity ? 
            (latestData.totalDebt / latestData.totalEquity).toFixed(2) : 'N/A'}</p>
          <p>• Asset Coverage: {latestData.totalAssets && latestData.totalLiabilities ? 
            (latestData.totalAssets / latestData.totalLiabilities).toFixed(2) + 'x' : 'N/A'}</p>
          <p>• Equity as % of Assets: {latestData.totalEquity && latestData.totalAssets ? 
            ((latestData.totalEquity / latestData.totalAssets) * 100).toFixed(1) + '%' : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetTab;
