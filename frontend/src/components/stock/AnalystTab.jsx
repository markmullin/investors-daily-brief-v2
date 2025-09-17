import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { TrendingUp, TrendingDown, Target, Users, AlertCircle, DollarSign } from 'lucide-react';

const AnalystTab = ({ symbol }) => {
  const [analystData, setAnalystData] = useState(null);
  const [priceTargets, setPriceTargets] = useState(null);
  const [estimates, setEstimates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart refs
  const priceTargetChartRef = useRef(null);
  const ratingsChartRef = useRef(null);
  const revenueProjectionChartRef = useRef(null);
  const epsProjectionChartRef = useRef(null);
  
  useEffect(() => {
    if (!symbol) return;
    
    const fetchAnalystData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch multiple analyst endpoints
        const [ratingsRes, targetsRes, estimatesRes] = await Promise.all([
          fetch(`/api/research/analyst/${symbol}`),
          fetch(`/api/research/analyst/${symbol}`),
          fetch(`/api/research/analyst/${symbol}`)
        ]);
        
        if (!ratingsRes.ok || !targetsRes.ok || !estimatesRes.ok) {
          throw new Error('Failed to fetch analyst data');
        }
        
        const [ratings, targets, estimates] = await Promise.all([
          ratingsRes.json(),
          targetsRes.json(),
          estimatesRes.json()
        ]);
        
        console.log('Analyst data received:', { ratings, targets, estimates });
        
        setAnalystData(ratings);
        setPriceTargets(targets);
        setEstimates(estimates);
      } catch (err) {
        console.error('Analyst data fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalystData();
  }, [symbol]);
  
  // Initialize Price Target Chart
  useEffect(() => {
    if (!priceTargets || !priceTargets.length) return;
    
    const chartDom = priceTargetChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Get latest price target data
    const latestTarget = priceTargets[0];
    const currentPrice = latestTarget.currentPrice || 0;
    const avgTarget = latestTarget.averagePrice || latestTarget.targetMean || 0;
    const highTarget = latestTarget.targetHigh || 0;
    const lowTarget = latestTarget.targetLow || 0;
    
    const option = {
      title: {
        text: 'Analyst Price Targets',
        subtext: 'Bull, Base, and Bear Case Scenarios',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = 'Price Targets<br/>';
          params.forEach(param => {
            const upside = ((param.value - currentPrice) / currentPrice * 100).toFixed(1);
            const color = upside >= 0 ? 'green' : 'red';
            result += `${param.marker} ${param.name}: $${param.value.toFixed(2)} `;
            result += `<span style="color: ${color}">(${upside >= 0 ? '+' : ''}${upside}%)</span><br/>`;
          });
          return result;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: ['Bear Case', 'Current Price', 'Base Case', 'Bull Case'],
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        },
        min: function(value) {
          return Math.floor(value.min * 0.9);
        }
      },
      series: [{
        type: 'bar',
        data: [
          {
            value: lowTarget,
            itemStyle: { color: '#ef4444' }
          },
          {
            value: currentPrice,
            itemStyle: { color: '#6b7280' }
          },
          {
            value: avgTarget,
            itemStyle: { color: '#3b82f6' }
          },
          {
            value: highTarget,
            itemStyle: { color: '#10b981' }
          }
        ],
        label: {
          show: true,
          position: 'top',
          formatter: '${c}'
        },
        barWidth: '50%'
      }]
    };
    
    myChart.setOption(option);
    
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [priceTargets]);
  
  // Initialize Ratings Distribution Chart
  useEffect(() => {
    if (!analystData || !analystData.length) return;
    
    const chartDom = ratingsChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Get latest ratings
    const latestRatings = analystData[0];
    const strongBuy = latestRatings.strongBuy || 0;
    const buy = latestRatings.buy || 0;
    const hold = latestRatings.hold || 0;
    const sell = latestRatings.sell || 0;
    const strongSell = latestRatings.strongSell || 0;
    
    const option = {
      title: {
        text: 'Analyst Ratings Distribution',
        subtext: `${strongBuy + buy + hold + sell + strongSell} Total Analysts`,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        data: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: strongBuy, name: 'Strong Buy', itemStyle: { color: '#065f46' } },
          { value: buy, name: 'Buy', itemStyle: { color: '#10b981' } },
          { value: hold, name: 'Hold', itemStyle: { color: '#fbbf24' } },
          { value: sell, name: 'Sell', itemStyle: { color: '#f87171' } },
          { value: strongSell, name: 'Strong Sell', itemStyle: { color: '#b91c1c' } }
        ].filter(item => item.value > 0)
      }]
    };
    
    myChart.setOption(option);
    
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [analystData]);
  
  // Initialize Revenue Projection Chart
  useEffect(() => {
    if (!estimates || !estimates.length) return;
    
    const chartDom = revenueProjectionChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Sort estimates by period
    const sortedEstimates = [...estimates].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    const periods = sortedEstimates.map(e => e.period || e.date);
    const revenueEstimates = sortedEstimates.map(e => e.estimatedRevenueAvg || 0);
    const actualRevenue = sortedEstimates.map(e => e.revenue || null);
    
    const option = {
      title: {
        text: 'Revenue Projections',
        subtext: 'Analyst Consensus Estimates vs Actual',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            if (param.value !== null) {
              result += `${param.marker} ${param.seriesName}: $${(param.value / 1000000).toFixed(1)}M<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Estimated Revenue', 'Actual Revenue'],
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
        data: periods,
        axisLabel: {
          rotate: 45
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
          name: 'Estimated Revenue',
          type: 'line',
          data: revenueEstimates,
          smooth: true,
          lineStyle: {
            width: 3,
            type: 'dashed',
            color: '#3b82f6'
          },
          itemStyle: {
            color: '#3b82f6'
          }
        },
        {
          name: 'Actual Revenue',
          type: 'line',
          data: actualRevenue,
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#10b981'
          },
          itemStyle: {
            color: '#10b981'
          }
        }
      ]
    };
    
    myChart.setOption(option);
    
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [estimates]);
  
  // Initialize EPS Projection Chart
  useEffect(() => {
    if (!estimates || !estimates.length) return;
    
    const chartDom = epsProjectionChartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Sort estimates by period
    const sortedEstimates = [...estimates].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    const periods = sortedEstimates.map(e => e.period || e.date);
    const epsEstimates = sortedEstimates.map(e => e.estimatedEpsAvg || 0);
    const actualEps = sortedEstimates.map(e => e.eps || null);
    
    const option = {
      title: {
        text: 'EPS Projections',
        subtext: 'Analyst Consensus Estimates vs Actual',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            if (param.value !== null) {
              result += `${param.marker} ${param.seriesName}: $${param.value.toFixed(2)}<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Estimated EPS', 'Actual EPS'],
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
        data: periods,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        }
      },
      series: [
        {
          name: 'Estimated EPS',
          type: 'bar',
          data: epsEstimates,
          itemStyle: {
            color: '#3b82f6'
          },
          barGap: '0%'
        },
        {
          name: 'Actual EPS',
          type: 'bar',
          data: actualEps,
          itemStyle: {
            color: '#10b981'
          }
        }
      ]
    };
    
    myChart.setOption(option);
    
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [estimates]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analyst data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading analyst data: {error}</p>
        </div>
      </div>
    );
  }
  
  // Calculate consensus rating
  const getConsensusRating = () => {
    if (!analystData || !analystData.length) return 'N/A';
    const latest = analystData[0];
    const totalRatings = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
    if (totalRatings === 0) return 'No Coverage';
    
    const score = (latest.strongBuy * 5 + latest.buy * 4 + latest.hold * 3 + latest.sell * 2 + latest.strongSell * 1) / totalRatings;
    
    if (score >= 4.5) return 'Strong Buy';
    if (score >= 3.5) return 'Buy';
    if (score >= 2.5) return 'Hold';
    if (score >= 1.5) return 'Sell';
    return 'Strong Sell';
  };
  
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Strong Buy': return 'text-green-700 bg-green-100';
      case 'Buy': return 'text-green-600 bg-green-50';
      case 'Hold': return 'text-yellow-600 bg-yellow-50';
      case 'Sell': return 'text-red-600 bg-red-50';
      case 'Strong Sell': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const latestTarget = priceTargets && priceTargets[0];
  const consensusRating = getConsensusRating();
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Consensus Rating Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Consensus Rating</h3>
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getRatingColor(consensusRating)}`}>
            {consensusRating}
          </div>
          {analystData && analystData[0] && (
            <p className="text-sm text-gray-500 mt-3">
              Based on {analystData[0].strongBuy + analystData[0].buy + analystData[0].hold + analystData[0].sell + analystData[0].strongSell} analysts
            </p>
          )}
        </div>
        
        {/* Price Target Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Average Price Target</h3>
            <Target className="h-6 w-6 text-gray-400" />
          </div>
          {latestTarget ? (
            <>
              <div className="text-2xl font-bold text-gray-800">
                ${(latestTarget.averagePrice || latestTarget.targetMean || 0).toFixed(2)}
              </div>
              <div className={`text-sm mt-2 flex items-center ${
                (latestTarget.averagePrice || latestTarget.targetMean) > latestTarget.currentPrice 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {(latestTarget.averagePrice || latestTarget.targetMean) > latestTarget.currentPrice 
                  ? <TrendingUp className="h-4 w-4 mr-1" /> 
                  : <TrendingDown className="h-4 w-4 mr-1" />
                }
                {(((latestTarget.averagePrice || latestTarget.targetMean) - latestTarget.currentPrice) / latestTarget.currentPrice * 100).toFixed(1)}% 
                {(latestTarget.averagePrice || latestTarget.targetMean) > latestTarget.currentPrice ? 'upside' : 'downside'}
              </div>
            </>
          ) : (
            <div className="text-gray-500">No data</div>
          )}
        </div>
        
        {/* Estimates Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Next Quarter Est.</h3>
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          {estimates && estimates[0] ? (
            <>
              <div className="text-sm text-gray-600">Revenue</div>
              <div className="text-xl font-bold text-gray-800">
                ${(estimates[0].estimatedRevenueAvg / 1000000000).toFixed(2)}B
              </div>
              <div className="text-sm text-gray-600 mt-2">EPS</div>
              <div className="text-xl font-bold text-gray-800">
                ${estimates[0].estimatedEpsAvg.toFixed(2)}
              </div>
            </>
          ) : (
            <div className="text-gray-500">No estimates</div>
          )}
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Target Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={priceTargetChartRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* Ratings Distribution Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={ratingsChartRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* Revenue Projection Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={revenueProjectionChartRef} style={{ height: '400px' }}></div>
        </div>
        
        {/* EPS Projection Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div ref={epsProjectionChartRef} style={{ height: '400px' }}></div>
        </div>
      </div>
      
      {/* Analyst Insights Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Analyst Insights</h3>
        <div className="space-y-2 text-sm text-blue-800">
          {latestTarget && (
            <>
              <p>• Price Target Range: ${latestTarget.targetLow?.toFixed(2)} - ${latestTarget.targetHigh?.toFixed(2)}</p>
              <p>• Number of Analysts: {latestTarget.numberOfAnalysts || 'N/A'}</p>
            </>
          )}
          {estimates && estimates[0] && (
            <>
              <p>• Revenue Growth (YoY): {estimates[0].estimatedRevenueGrowth ? 
                `${(estimates[0].estimatedRevenueGrowth * 100).toFixed(1)}%` : 'N/A'}</p>
              <p>• EPS Growth (YoY): {estimates[0].estimatedEpsGrowth ? 
                `${(estimates[0].estimatedEpsGrowth * 100).toFixed(1)}%` : 'N/A'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalystTab;
