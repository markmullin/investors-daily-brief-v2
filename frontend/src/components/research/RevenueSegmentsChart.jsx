import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const RevenueSegmentsChart = ({ data, symbol }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!data || !data.hasSegmentData || !data.data || data.data.length === 0 || !data.segments || data.segments.length === 0) return;
    
    const chartDom = chartRef.current;
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // Filter out segments that have $0 revenue across all quarters
    const activeSegments = data.segments.filter(segment => {
      // Check if this segment has any non-zero values across all quarters
      return data.data.some(quarter => {
        const value = quarter.segments[segment];
        return value && value > 0;
      });
    });
    
    console.log(`Filtered segments: ${data.segments.length} total, ${activeSegments.length} active (non-zero)`);
    
    // Log segment mapping information if available
    if (data.isStandardized) {
      console.log(`Segment mapping applied: ${data.originalSegmentCount} original segments → ${data.standardizedSegmentCount} standardized segments`);
      if (data.segmentMappings) {
        console.log('Segment mappings:', data.segmentMappings);
      }
    }
    
    // If no active segments after filtering, show a message
    if (activeSegments.length === 0) {
      myChart.dispose();
      return;
    }
    
    // Detect if these are accounting categories or product segments
    const accountingKeywords = ['Revenue From Contract', 'Deferred Revenue', 'Sales Revenue Net', 'Revenue, Net', 'Total Revenue'];
    const hasAccountingCategories = activeSegments.some(segment => 
      accountingKeywords.some(keyword => segment.includes(keyword))
    );
    
    // Prepare data for stacked bar chart
    const quarters = data.data.slice().reverse(); // Reverse to show oldest to newest
    const dates = quarters.map(q => q.date);
    
    // Use segment color map if available (from segment mapping service)
    const segmentColorMap = data.segmentColorMap || {};
    
    // Default color palette as fallback
    const defaultColorPalette = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#8b5cf6', // Purple
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#f97316', // Orange
      '#84cc16', // Lime
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#a855f7', // Purple
      '#0891b2', // Cyan-600
      '#dc2626', // Red-600
      '#65a30d', // Lime-600
      '#7c3aed', // Violet-600
      '#ea580c', // Orange-600
      '#0d9488', // Teal-600
      '#2563eb', // Blue-600
      '#db2777'  // Pink-600
    ];
    
    // Format segment names for display (already standardized if mapping was applied)
    const formatSegmentName = (segment) => {
      // If data is already standardized, minimal formatting needed
      if (data.isStandardized) {
        return segment;
      }
      
      // Legacy formatting for unmapped data
      if (hasAccountingCategories) {
        // Shorten long accounting names
        return segment
          .replace('Revenue From Contract with Customer, Excluding Assessed Tax', 'Contract Revenue')
          .replace('Sales Revenue Net', 'Net Sales')
          .replace('Deferred Revenue', 'Deferred')
          .replace('Revenue, Net', 'Net Revenue')
          .replace(', Excluding', ' ex.')
          .replace('Total Revenue', 'Total');
      } else {
        // Clean up product segment names
        return segment
          .replace('Microsoft Three Six Five Commercial Products And Cloud Services', 'M365 Commercial')
          .replace('Microsoft Three Six Five Consumer Products And Cloud Services', 'M365 Consumer')
          .replace('Server Products And Tools', 'Server Products')
          .replace('Microsoft Office System', 'Office System')
          .replace('Search And News Advertising', 'Search & News Ads')
          .replace('Dynamics Products And Cloud Services', 'Dynamics')
          .replace('Linked In Corporation', 'LinkedIn')
          .replace('Other Products And Services', 'Other')
          .replace('Consulting And Product Support Services', 'Consulting & Support')
          .replace(' And ', ' & ')
          .trim();
      }
    };
    
    // Create series for each active segment
    const series = activeSegments.map((segment, index) => {
      const displayName = formatSegmentName(segment);
      
      // Use mapped color if available, otherwise fallback to default palette
      const color = segmentColorMap[segment] || defaultColorPalette[index % defaultColorPalette.length];
      
      return {
        name: displayName,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: color
        },
        data: quarters.map(q => q.segments[segment] || 0)
      };
    });
    
    // Calculate total revenue for each quarter (using only active segments)
    const totals = quarters.map(q => {
      return activeSegments.reduce((sum, segment) => sum + (q.segments[segment] || 0), 0);
    });
    const maxRevenue = Math.max(...totals);
    
    // Determine chart title based on data type and standardization
    let titleText = 'Revenue by Product Segment';
    let subtitleText = `${symbol} - Quarterly Revenue Breakdown by Product Line`;
    
    if (hasAccountingCategories) {
      titleText = 'Revenue by Accounting Category';
      subtitleText = `${symbol} - Quarterly Revenue Breakdown by GAAP Categories`;
    } else if (data.isStandardized) {
      titleText = 'Revenue by Product Segment (Standardized)';
      subtitleText = `${symbol} - Quarterly Revenue with Consistent Segment Names`;
    }
    
    const option = {
      title: {
        text: titleText,
        subtext: subtitleText,
        left: 'center',
        textStyle: {
          fontSize: 16
        },
        subtextStyle: {
          fontSize: 12,
          color: hasAccountingCategories ? '#666' : '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          let total = 0;
          
          // Sort by value descending and filter out zeros
          const sortedParams = params
            .filter(param => param.value > 0)
            .sort((a, b) => b.value - a.value);
          
          sortedParams.forEach(param => {
            const value = param.value || 0;
            total += value;
            const percentage = totals[param.dataIndex] > 0 ? (value / totals[param.dataIndex]) * 100 : 0;
            
            // Format value based on magnitude
            let formattedValue;
            if (value >= 1000000000) {
              formattedValue = `$${(value / 1000000000).toFixed(1)}B`;
            } else {
              formattedValue = `$${(value / 1000000).toFixed(0)}M`;
            }
            
            result += `${param.marker} ${param.seriesName}: ${formattedValue} (${percentage.toFixed(1)}%)<br/>`;
          });
          
          // Format total
          const formattedTotal = total >= 1000000000 
            ? `$${(total / 1000000000).toFixed(1)}B`
            : `$${(total / 1000000).toFixed(0)}M`;
          
          result += `<br/><strong>Total: ${formattedTotal}</strong>`;
          return result;
        }
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 0,
        type: 'scroll',
        textStyle: {
          fontSize: 11
        },
        pageButtonItemGap: 5,
        pageButtonGap: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: activeSegments.length > 12 ? '18%' : '15%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: 'Revenue',
        nameTextStyle: {
          fontSize: 12
        },
        axisLabel: {
          formatter: function(value) {
            if (value >= 1000000000) {
              return '$' + (value / 1000000000).toFixed(0) + 'B';
            }
            return '$' + (value / 1000000).toFixed(0) + 'M';
          }
        },
        max: Math.ceil(maxRevenue * 1.1) // Add 10% padding
      },
      series: series,
      // Add dataZoom for better interaction with many quarters
      dataZoom: [{
        type: 'inside',
        start: data.data.length > 12 ? 100 - (12 / data.data.length * 100) : 0,
        end: 100
      }, {
        start: data.data.length > 12 ? 100 - (12 / data.data.length * 100) : 0,
        end: 100,
        handleIcon: 'path://M10,10 h10 v10 h-10 z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      }]
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
  }, [data, symbol]);
  
  // Loading state
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-full flex items-center justify-center" style={{ height: '400px' }}>
          <div className="text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Loading revenue segment data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // No segment data available
  if (!data.hasSegmentData || !data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-full flex items-center justify-center" style={{ height: '400px' }}>
          <div className="text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Revenue segment data not available</p>
            <p className="text-sm text-gray-400 mt-2">This company may not report revenue by segments</p>
          </div>
        </div>
      </div>
    );
  }
  
  // No historical data
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-full flex items-center justify-center" style={{ height: '400px' }}>
          <div className="text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No historical segment data</p>
            <p className="text-sm text-gray-400 mt-2">Time series data is missing</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if all segments have zero revenue
  const hasNonZeroData = data.segments.some(segment => 
    data.data.some(quarter => quarter.segments[segment] > 0)
  );
  
  if (!hasNonZeroData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-full flex items-center justify-center" style={{ height: '400px' }}>
          <div className="text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No revenue data in segments</p>
            <p className="text-sm text-gray-400 mt-2">All segment values are zero</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div ref={chartRef} style={{ height: '500px' }}></div>
      
      {/* Show mapping information if segments were standardized */}
      {data.isStandardized && data.originalSegmentCount > data.standardizedSegmentCount && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            <strong>Segment Standardization Applied:</strong> {data.originalSegmentCount} original segment names have been 
            consolidated into {data.standardizedSegmentCount} standardized segments for consistent tracking across quarters.
          </p>
        </div>
      )}
      
      {/* Show note about accounting categories if applicable */}
      {data.segments && data.segments.some(segment => 
        ['Revenue From Contract', 'Deferred Revenue', 'Sales Revenue Net'].some(keyword => segment.includes(keyword))
      ) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This chart shows revenue by accounting categories (GAAP classifications) rather than product segments. 
            For companies like {symbol}, actual product segment data (e.g., "Server Products", "Cloud Services") may not be available through this data source.
          </p>
        </div>
      )}
      
      {/* Show company-specific notes if available */}
      {data.note && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700">{data.note}</p>
        </div>
      )}
    </div>
  );
};

export default RevenueSegmentsChart;