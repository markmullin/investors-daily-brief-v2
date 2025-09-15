// Test script to verify market metrics and macroeconomic data
console.log('Testing Market Metrics and Macroeconomic APIs...');

// Test 1: Check if IndexChart renders
const testIndexChart = () => {
  const chartElement = document.querySelector('.recharts-wrapper');
  if (chartElement) {
    console.log('✅ IndexChart is rendering');
    
    // Check for moving average lines
    const lines = document.querySelectorAll('.recharts-line');
    console.log(`Found ${lines.length} chart lines (should be 2-4 including MAs)`);
  } else {
    console.log('❌ IndexChart not found in DOM');
  }
};

// Test 2: Check macroeconomic data structure
const testMacroData = async () => {
  try {
    const response = await fetch('/api/macroeconomic/simple');
    const data = await response.json();
    console.log('Macroeconomic response:', data);
    
    // The frontend expects this structure:
    const expectedStructure = {
      interestRates: {
        data: {
          DGS2: [], // Array of {date, value}
          DGS10: [],
          DGS30: []
        }
      },
      growthInflation: {
        data: {
          A191RL1Q225SBEA: [], // GDP
          CPI_YOY: [],
          PCE_YOY: [],
          M2_YOY: [],
          MONEY_MARKET_FUNDS: []
        }
      },
      laborConsumer: {
        data: {
          UNRATE: [],
          RETAIL_YOY: [],
          REAL_PERSONAL_INCOME: []
        }
      }
    };
    
    console.log('Expected structure keys:', Object.keys(expectedStructure));
    console.log('Actual structure keys:', Object.keys(data));
    
    // Check if data matches expected structure
    if (!data.interestRates || !data.growthInflation || !data.laborConsumer) {
      console.log('❌ Data structure mismatch!');
      console.log('Missing keys:', {
        interestRates: !data.interestRates,
        growthInflation: !data.growthInflation,
        laborConsumer: !data.laborConsumer
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch macro data:', error);
  }
};

// Test 3: Check if MarketMetrics component has data
const testMarketMetrics = () => {
  const marketMetricsElement = document.querySelector('[class*="MarketMetrics"]');
  if (marketMetricsElement) {
    console.log('✅ MarketMetrics component found');
    
    // Check for index tabs
    const tabs = document.querySelectorAll('button[class*="border-b-2"]');
    console.log(`Found ${tabs.length} index tabs (should be 5: S&P, NASDAQ, DOW, Russell, Bitcoin)`);
    
    // Check if chart container exists
    const chartContainer = document.querySelector('.recharts-responsive-container');
    if (chartContainer) {
      console.log('✅ Chart container exists');
    } else {
      console.log('❌ Chart container not found');
    }
  } else {
    console.log('❌ MarketMetrics component not found');
  }
};

// Run tests
setTimeout(() => {
  console.log('=== Running Market Metrics Tests ===');
  testIndexChart();
  testMarketMetrics();
  testMacroData();
}, 2000);
