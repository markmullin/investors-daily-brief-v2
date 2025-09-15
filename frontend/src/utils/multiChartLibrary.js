/**
 * MULTI-CHART LIBRARY ARCHITECTURE
 * 
 * Strategy: Use the BEST chart library for each specific visualization
 * No limitations - we'll integrate them all for maximum visual impact
 */

// Chart Library Registry and Configuration
export const ChartLibraries = {
  // Apache ECharts - For complex financial visualizations
  echarts: {
    library: 'echarts',
    import: () => import('echarts'),
    bestFor: [
      'candlestick-charts',
      'waterfall-charts',
      'sankey-diagrams',
      'treemaps',
      'heatmaps',
      'gauge-charts',
      'parallel-coordinates',
      'box-plots'
    ],
    config: {
      theme: 'dark', // Premium dark theme
      renderer: 'canvas', // Better performance
      useDirtyRect: true // Performance optimization
    }
  },

  // D3.js - For custom, highly interactive visualizations
  d3: {
    library: 'd3',
    import: () => import('d3'),
    bestFor: [
      'force-directed-graphs',
      'custom-animations',
      'interactive-timelines',
      'morphing-charts',
      'network-diagrams',
      'custom-financial-viz',
      'sunburst-charts'
    ],
    config: {
      transitions: true,
      easing: 'easeQuadInOut'
    }
  },

  // Plotly - For scientific-grade 3D and statistical visualizations
  plotly: {
    library: 'plotly.js',
    import: () => import('plotly.js-finance-dist'),
    bestFor: [
      '3d-surface-plots',
      'statistical-distributions',
      'correlation-matrices',
      'monte-carlo-simulations',
      'volatility-surfaces',
      'options-payoff-diagrams',
      'regression-analysis'
    ],
    config: {
      displayModeBar: true,
      responsive: true,
      theme: 'plotly_dark'
    }
  },

  // Victory - For React-native animated charts
  victory: {
    library: 'victory',
    import: () => import('victory'),
    bestFor: [
      'animated-transitions',
      'mobile-optimized-charts',
      'simple-line-charts',
      'area-charts',
      'spark-lines',
      'progress-indicators'
    ],
    config: {
      animate: {
        duration: 1000,
        onLoad: { duration: 500 }
      }
    }
  },

  // Chart.js - For simple, performant basic charts
  chartjs: {
    library: 'chart.js',
    import: () => import('chart.js/auto'),
    bestFor: [
      'basic-line-charts',
      'bar-charts',
      'pie-charts',
      'doughnut-charts',
      'radar-charts',
      'polar-area-charts'
    ],
    config: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750
      }
    }
  },

  // Recharts - Keep for backward compatibility
  recharts: {
    library: 'recharts',
    import: () => import('recharts'),
    bestFor: [
      'simple-composed-charts',
      'responsive-containers',
      'basic-tooltips'
    ],
    config: {
      // Existing config
    }
  }
};

// Premium Chart Components for Each Financial Statement

export const BalanceSheetCharts = {
  // Main visualization: Stacked waterfall showing asset composition
  AssetWaterfall: {
    library: 'echarts',
    type: 'waterfall',
    config: {
      title: 'Asset Composition Breakdown',
      features: [
        'Interactive drill-down',
        'Time series animation',
        'Hover details with educational tooltips'
      ]
    }
  },

  // Assets vs Liabilities vs Equity over time
  FinancialPositionTimeline: {
    library: 'd3',
    type: 'custom-stacked-area',
    config: {
      features: [
        'Morphing transitions between quarters',
        'Interactive time brush',
        'Annotation layers for major events'
      ]
    }
  },

  // Debt analysis visualization
  DebtStructure3D: {
    library: 'plotly',
    type: '3d-bar',
    config: {
      features: [
        'Debt maturity schedule',
        'Interest rate layers',
        'Interactive rotation'
      ]
    }
  },

  // Key ratios as gauges
  FinancialHealthGauges: {
    library: 'echarts',
    type: 'gauge-cluster',
    config: {
      metrics: ['Current Ratio', 'Debt-to-Equity', 'Quick Ratio'],
      features: [
        'Historical range indicators',
        'Industry benchmarks',
        'Animated transitions'
      ]
    }
  }
};

export const IncomeStatementCharts = {
  // Revenue segmentation like Unusual Whales
  RevenueSegmentFlow: {
    library: 'd3',
    type: 'sankey-custom',
    config: {
      features: [
        'Product/Geographic segments',
        'Quarter-over-quarter flow',
        'Interactive segment isolation',
        'Color-coded growth rates'
      ]
    }
  },

  // Profitability cascade
  ProfitabilityWaterfall: {
    library: 'echarts',
    type: 'waterfall-enhanced',
    config: {
      stages: [
        'Revenue',
        'Cost of Goods Sold',
        'Gross Profit',
        'Operating Expenses',
        'Operating Income',
        'Interest & Taxes',
        'Net Income'
      ],
      features: [
        'Margin percentages',
        'YoY comparisons',
        'Drill-down capabilities'
      ]
    }
  },

  // Margin trends with projections
  MarginAnalysis: {
    library: 'plotly',
    type: 'multi-axis-timeline',
    config: {
      metrics: ['Gross Margin', 'Operating Margin', 'Net Margin'],
      features: [
        'Regression trendlines',
        'Confidence intervals',
        'Anomaly detection'
      ]
    }
  }
};

export const CashFlowCharts = {
  // Cash flow sources and uses
  CashFlowSankey: {
    library: 'echarts',
    type: 'sankey-multilevel',
    config: {
      levels: [
        'Operating Activities',
        'Investing Activities',
        'Financing Activities'
      ],
      features: [
        'Free cash flow highlight',
        'Capital allocation breakdown',
        'Period comparison mode'
      ]
    }
  },

  // Free cash flow generation
  FreeCashFlowTrend: {
    library: 'd3',
    type: 'area-with-annotations',
    config: {
      features: [
        'FCF conversion rate',
        'CapEx intensity overlay',
        'Dividend coverage analysis'
      ]
    }
  }
};

export const ValuationCharts = {
  // Multiple valuation comparison
  ValuationHeatmap: {
    library: 'plotly',
    type: 'heatmap-3d',
    config: {
      metrics: ['P/E', 'P/S', 'P/B', 'EV/EBITDA', 'PEG'],
      dimensions: ['Current', 'Historical Average', 'Sector Average'],
      features: [
        'Interactive rotation',
        'Time animation',
        'Peer comparison overlay'
      ]
    }
  },

  // Historical valuation bands
  ValuationBands: {
    library: 'd3',
    type: 'range-band-chart',
    config: {
      features: [
        'Statistical percentile bands',
        'Mean reversion indicators',
        'Event annotations'
      ]
    }
  }
};

// Chart Factory Pattern
export class ChartFactory {
  static async createChart(chartConfig, containerId, data) {
    const { library, type, config } = chartConfig;
    const chartLib = ChartLibraries[library];
    
    if (!chartLib) {
      throw new Error(`Chart library ${library} not configured`);
    }
    
    // Dynamically import the required library
    const libModule = await chartLib.import();
    
    // Create chart based on library
    switch (library) {
      case 'echarts':
        return this.createEChartsChart(libModule, type, config, containerId, data);
      case 'd3':
        return this.createD3Chart(libModule, type, config, containerId, data);
      case 'plotly':
        return this.createPlotlyChart(libModule, type, config, containerId, data);
      case 'victory':
        return this.createVictoryChart(libModule, type, config, containerId, data);
      case 'chartjs':
        return this.createChartJSChart(libModule, type, config, containerId, data);
      default:
        throw new Error(`Unsupported chart library: ${library}`);
    }
  }
  
  // Library-specific creation methods...
  static createEChartsChart(echarts, type, config, containerId, data) {
    const container = document.getElementById(containerId);
    const chart = echarts.init(container, 'dark');
    
    // Configure based on chart type
    let option = {};
    
    switch (type) {
      case 'waterfall':
        option = this.createWaterfallOption(data, config);
        break;
      case 'gauge-cluster':
        option = this.createGaugeClusterOption(data, config);
        break;
      // ... other chart types
    }
    
    chart.setOption(option);
    return chart;
  }
  
  // ... implementation for other libraries
}

// Educational Tooltips and Descriptions
export const FinancialEducation = {
  balanceSheet: {
    totalAssets: {
      title: "Total Assets",
      description: "Everything the company owns that has value",
      whyItMatters: "Shows the company's resource base for generating profits",
      whatToLookFor: [
        "Growing assets indicate business expansion",
        "Asset quality matters - not all assets are equal",
        "Compare to liabilities to assess financial health"
      ]
    },
    debtToEquity: {
      title: "Debt-to-Equity Ratio",
      description: "How much the company owes vs what shareholders own",
      formula: "Total Debt ÷ Shareholders' Equity",
      whyItMatters: "Indicates financial leverage and risk",
      interpretation: {
        low: "< 0.5: Conservative, low financial risk",
        moderate: "0.5-1.5: Balanced approach",
        high: "> 1.5: Aggressive, higher risk"
      }
    }
    // ... more educational content
  },
  
  incomeStatement: {
    revenueGrowth: {
      title: "Revenue Growth",
      description: "Year-over-year increase in sales",
      whyItMatters: "Shows if the company is expanding its business",
      whatToLookFor: [
        "Consistent growth over multiple quarters",
        "Growth compared to industry peers",
        "Quality of growth (organic vs acquisitions)"
      ]
    }
    // ... more educational content
  }
};

// Premium UI/UX Features
export const ChartInteractions = {
  // Hover effects
  hoverEffects: {
    glowEffect: true,
    detailPanel: true,
    crosshair: true,
    connectedHighlight: true // Highlight related data across charts
  },
  
  // Animation settings
  animations: {
    entryAnimation: 'morphing',
    transitionDuration: 750,
    staggerDelay: 100,
    easing: 'easeInOutQuart'
  },
  
  // Interactive features
  interactions: {
    zoom: true,
    pan: true,
    brush: true,
    lasso: true, // Select multiple data points
    export: ['PNG', 'SVG', 'CSV'],
    fullscreen: true,
    annotations: true
  },
  
  // Premium themes
  themes: {
    dark: {
      background: '#0a0a0a',
      primary: '#00d4ff',
      secondary: '#ff006e',
      success: '#00ff88',
      danger: '#ff3333',
      text: '#ffffff',
      muted: '#666666'
    }
  }
};

// Real-time Update Manager
export class FinancialDataUpdateManager {
  constructor() {
    this.updateSchedule = new Map();
    this.pollingInterval = null;
  }
  
  // Track company reporting schedules
  async initializeReportingSchedule(symbols) {
    for (const symbol of symbols) {
      // Fetch next earnings date from FMP
      const nextEarnings = await fmpService.getNextEarningsDate(symbol);
      if (nextEarnings) {
        this.updateSchedule.set(symbol, {
          nextReportDate: nextEarnings.date,
          lastChecked: new Date()
        });
      }
    }
  }
  
  // Smart polling based on reporting windows
  startSmartPolling() {
    this.pollingInterval = setInterval(() => {
      const today = new Date();
      
      this.updateSchedule.forEach((schedule, symbol) => {
        const reportDate = new Date(schedule.nextReportDate);
        const daysDiff = Math.ceil((reportDate - today) / (1000 * 60 * 60 * 24));
        
        // Poll more frequently around earnings dates
        if (daysDiff <= 1) {
          this.checkForUpdates(symbol, 'high-priority');
        } else if (daysDiff <= 7) {
          this.checkForUpdates(symbol, 'medium-priority');
        }
      });
    }, 1000 * 60 * 60); // Check every hour
  }
  
  async checkForUpdates(symbol, priority) {
    // Check if new financial data is available
    console.log(`🔄 Checking for updates: ${symbol} (${priority})`);
    // Implementation to check FMP for new data
  }
}

export default {
  ChartLibraries,
  ChartFactory,
  BalanceSheetCharts,
  IncomeStatementCharts,
  CashFlowCharts,
  ValuationCharts,
  FinancialEducation,
  ChartInteractions,
  FinancialDataUpdateManager
};