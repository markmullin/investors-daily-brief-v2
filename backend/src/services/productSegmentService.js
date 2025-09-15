/**
 * Product Segment Mapping Service
 * Provides real product/service segments for major companies
 * Since FMP doesn't provide this data, we need a manual mapping approach
 * 
 * This is NOT hardcoded data - it's a mapping of segment names that will be 
 * populated with real revenue data from other sources
 */

const PRODUCT_SEGMENT_MAPPINGS = {
  'MSFT': {
    companyName: 'Microsoft',
    segments: [
      { key: 'cloud', name: 'Intelligent Cloud (Azure)', color: '#0078D4' },
      { key: 'productivity', name: 'Productivity & Business Processes', color: '#40E0D0' },
      { key: 'personal_computing', name: 'More Personal Computing', color: '#00BCF2' },
      { key: 'gaming', name: 'Gaming', color: '#107C10' },
      { key: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
      { key: 'other', name: 'Other', color: '#737373' }
    ],
    // Map FMP income statement items to segments (if available)
    revenueMapping: {
      'cloud': ['Azure', 'Cloud', 'Server'],
      'productivity': ['Office', 'Office 365', 'Dynamics'],
      'personal_computing': ['Windows', 'Surface', 'PC'],
      'gaming': ['Xbox', 'Gaming'],
      'linkedin': ['LinkedIn'],
      'other': ['Other']
    }
  },
  
  'AAPL': {
    companyName: 'Apple',
    segments: [
      { key: 'iphone', name: 'iPhone', color: '#A2AAAD' },
      { key: 'mac', name: 'Mac', color: '#333333' },
      { key: 'ipad', name: 'iPad', color: '#1D1D1F' },
      { key: 'wearables', name: 'Wearables, Home & Accessories', color: '#F56300' },
      { key: 'services', name: 'Services', color: '#0071E3' }
    ]
  },
  
  'GOOGL': {
    companyName: 'Google/Alphabet',
    segments: [
      { key: 'search', name: 'Google Search & Other', color: '#4285F4' },
      { key: 'youtube', name: 'YouTube Ads', color: '#FF0000' },
      { key: 'network', name: 'Google Network', color: '#34A853' },
      { key: 'cloud', name: 'Google Cloud', color: '#FBBC04' },
      { key: 'other_bets', name: 'Other Bets', color: '#EA4335' },
      { key: 'other', name: 'Other', color: '#5F6368' }
    ]
  },
  
  'AMZN': {
    companyName: 'Amazon',
    segments: [
      { key: 'online_stores', name: 'Online Stores', color: '#FF9900' },
      { key: 'physical_stores', name: 'Physical Stores', color: '#232F3E' },
      { key: 'third_party', name: 'Third-Party Seller Services', color: '#146EB4' },
      { key: 'aws', name: 'AWS', color: '#FF9900' },
      { key: 'subscription', name: 'Subscription Services', color: '#00A8E1' },
      { key: 'advertising', name: 'Advertising', color: '#FF6138' },
      { key: 'other', name: 'Other', color: '#879596' }
    ]
  },
  
  'META': {
    companyName: 'Meta',
    segments: [
      { key: 'family_apps', name: 'Family of Apps', color: '#1877F2' },
      { key: 'reality_labs', name: 'Reality Labs', color: '#0668E1' },
      { key: 'other', name: 'Other', color: '#42B883' }
    ]
  },
  
  'TSLA': {
    companyName: 'Tesla',
    segments: [
      { key: 'automotive_sales', name: 'Automotive Sales', color: '#CC0000' },
      { key: 'automotive_leasing', name: 'Automotive Leasing', color: '#E31937' },
      { key: 'services', name: 'Services & Other', color: '#787878' },
      { key: 'energy', name: 'Energy Generation & Storage', color: '#3BB44D' }
    ]
  }
};

/**
 * Service to fetch real revenue data from available sources and map to product segments
 */
class ProductSegmentService {
  constructor() {
    this.segmentMappings = PRODUCT_SEGMENT_MAPPINGS;
  }
  
  /**
   * Check if we have product segment mapping for a company
   */
  hasProductSegments(symbol) {
    return !!this.segmentMappings[symbol.toUpperCase()];
  }
  
  /**
   * Get product segment structure for a company
   */
  getSegmentStructure(symbol) {
    return this.segmentMappings[symbol.toUpperCase()] || null;
  }
  
  /**
   * TODO: Parse investor relations data or SEC filings to get actual revenue by segment
   * For now, return the structure so frontend knows what segments to expect
   */
  async getProductSegmentRevenue(symbol, period = 'quarter', limit = 12) {
    const upperSymbol = symbol.toUpperCase();
    const segmentInfo = this.segmentMappings[upperSymbol];
    
    if (!segmentInfo) {
      return {
        symbol: upperSymbol,
        hasProductSegments: false,
        message: 'Product segment mapping not available for this company',
        supportedCompanies: Object.keys(this.segmentMappings)
      };
    }
    
    // TODO: Implement actual data fetching from:
    // 1. SEC EDGAR API - Parse 10-Q/10-K segment footnotes
    // 2. Company investor relations APIs
    // 3. Alternative data providers
    // 4. Web scraping investor sites
    
    return {
      symbol: upperSymbol,
      hasProductSegments: true,
      companyName: segmentInfo.companyName,
      segments: segmentInfo.segments,
      dataType: 'product',
      message: 'Product segment structure available. Revenue data integration pending.',
      note: 'Real revenue data would come from SEC filings or investor relations data',
      dataPoints: 0,
      data: [] // This would be populated with real quarterly revenue by segment
    };
  }
}

// Export for use in unifiedDataService
module.exports = ProductSegmentService;

// Also create a test function
async function testProductSegments() {
  const service = new ProductSegmentService();
  
  console.log('📊 Testing Product Segment Mappings\n');
  
  const testSymbols = ['MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSLA'];
  
  for (const symbol of testSymbols) {
    console.log(`\n${symbol}:`);
    console.log('='.repeat(40));
    
    if (service.hasProductSegments(symbol)) {
      const structure = service.getSegmentStructure(symbol);
      console.log(`✅ ${structure.companyName} - ${structure.segments.length} segments`);
      
      structure.segments.forEach((segment, i) => {
        console.log(`   ${i + 1}. ${segment.name} (${segment.key}) - Color: ${segment.color}`);
      });
    } else {
      console.log('❌ No product segment mapping');
    }
  }
  
  console.log('\n\n📋 Implementation Plan:');
  console.log('1. Create ProductSegmentService with manual mappings for major companies');
  console.log('2. Integrate with SEC EDGAR API to parse segment data from 10-Q/10-K');
  console.log('3. Update unifiedDataService to check ProductSegmentService first');
  console.log('4. Fall back to FMP accounting data if no product segments available');
  console.log('5. Frontend will display real product segments like Unusual Whales');
}

// Run test if called directly
if (require.main === module) {
  testProductSegments();
}
