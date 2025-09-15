/**
 * Enhanced Segment Mapping Rules - Extended for Common Companies
 * Maps company segment variations to consistent names across all quarters
 */

class SegmentContinuityService {
  constructor() {
    // Company-specific segment evolution mappings
    this.companySegmentMappings = {
      // UnitedHealth Group
      'UNH': {
        mappings: {
          // Premium revenue can appear under different names
          'Premiums': 'UnitedHealthcare',
          'Premium': 'UnitedHealthcare',
          'Premium Revenue': 'UnitedHealthcare',
          'Premiums Revenue': 'UnitedHealthcare',
          'Insurance Premiums': 'UnitedHealthcare',
          'Health Insurance Premiums': 'UnitedHealthcare',
          'UnitedHealthcare Premiums': 'UnitedHealthcare',
          
          // Products and Services map to Optum
          'Products': 'Optum',
          'Services': 'Optum Services',
          'Products Revenue': 'Optum',
          'Services Revenue': 'Optum Services',
          'Optum Products': 'Optum',
          'Optum Services': 'Optum Services',
          
          // Keep these as-is
          'UnitedHealthcare': 'UnitedHealthcare',
          'Optum': 'Optum',
          'OptumHealth': 'Optum',
          'OptumInsight': 'Optum', 
          'OptumRx': 'Optum'
        },
        consolidate: true
      },
      
      // JPMorgan Chase
      'JPM': {
        mappings: {
          // Standardize all variations
          'Consumer & Community Banking': 'Consumer & Community Banking',
          'Consumer & Community Banking Consumer': 'Consumer & Community Banking',
          'Consumer and Community Banking': 'Consumer & Community Banking',
          'CCB': 'Consumer & Community Banking',
          
          'Corporate & Investment Bank': 'Corporate & Investment Bank',
          'Corporate & Investment Bank Commercial': 'Corporate & Investment Bank',
          'Corporate and Investment Bank': 'Corporate & Investment Bank',
          'CIB': 'Corporate & Investment Bank',
          'Investment Banking': 'Corporate & Investment Bank',
          
          'Asset & Wealth Management': 'Asset & Wealth Management',
          'Asset Wealth Management': 'Asset & Wealth Management',
          'Asset and Wealth Management': 'Asset & Wealth Management',
          'AWM': 'Asset & Wealth Management',
          
          'Commercial Banking': 'Commercial Banking',
          'Commercial Banking Commercial': 'Commercial Banking',
          'CB': 'Commercial Banking',
          
          'Corporate': 'Corporate',
          'Corporate Center': 'Corporate',
          'Other': 'Corporate'
        },
        consolidate: false
      },
      
      // Bank of America
      'BAC': {
        mappings: {
          'Consumer Banking': 'Consumer Banking',
          'Global Wealth & Investment Management': 'Global Wealth & Investment Management',
          'Global Wealth and Investment Management': 'Global Wealth & Investment Management',
          'GWIM': 'Global Wealth & Investment Management',
          'Global Banking': 'Global Banking',
          'Global Markets': 'Global Markets',
          'All Other': 'All Other'
        }
      },
      
      // Wells Fargo
      'WFC': {
        mappings: {
          'Consumer Banking and Lending': 'Consumer Banking & Lending',
          'Consumer Banking & Lending': 'Consumer Banking & Lending',
          'Commercial Banking': 'Commercial Banking',
          'Corporate and Investment Banking': 'Corporate & Investment Banking',
          'Corporate & Investment Banking': 'Corporate & Investment Banking',
          'Wealth and Investment Management': 'Wealth & Investment Management',
          'Wealth & Investment Management': 'Wealth & Investment Management'
        }
      },
      
      // Amazon
      'AMZN': {
        mappings: {
          'Online stores': 'Online Stores',
          'Online Stores': 'Online Stores',
          'Physical stores': 'Physical Stores',
          'Physical Stores': 'Physical Stores',
          'Third-party seller services': 'Third-Party Seller Services',
          'Third Party Seller Services': 'Third-Party Seller Services',
          'Subscription services': 'Subscription Services',
          'Subscription Services': 'Subscription Services',
          'AWS': 'AWS',
          'Amazon Web Services': 'AWS',
          'Advertising services': 'Advertising Services',
          'Advertising Services': 'Advertising Services',
          'Other': 'Other'
        }
      },
      
      // Apple
      'AAPL': {
        mappings: {
          'iPhone': 'iPhone',
          'Mac': 'Mac',
          'iPad': 'iPad',
          'Wearables, Home and Accessories': 'Wearables, Home & Accessories',
          'Wearables Home and Accessories': 'Wearables, Home & Accessories',
          'Services': 'Services',
          'Service': 'Services'
        }
      },
      
      // Microsoft
      'MSFT': {
        mappings: {
          'Productivity and Business Processes': 'Productivity & Business Processes',
          'Productivity & Business Processes': 'Productivity & Business Processes',
          'Intelligent Cloud': 'Intelligent Cloud',
          'More Personal Computing': 'More Personal Computing',
          'LinkedIn': 'LinkedIn',
          'Office Products and Cloud Services': 'Office Products & Cloud Services',
          'Office Products & Cloud Services': 'Office Products & Cloud Services',
          'Azure': 'Azure',
          'Server Products and Cloud Services': 'Server Products & Cloud Services',
          'Server Products & Cloud Services': 'Server Products & Cloud Services',
          'Windows': 'Windows',
          'Gaming': 'Gaming',
          'Search Advertising': 'Search Advertising',
          'Devices': 'Devices'
        }
      },
      
      // Alphabet/Google
      'GOOGL': {
        mappings: {
          'Google Services': 'Google Services',
          'Google Cloud': 'Google Cloud',
          'Other Bets': 'Other Bets',
          'Google advertising': 'Google Advertising',
          'Google Advertising': 'Google Advertising',
          'Google Search & other': 'Google Search & Other',
          'Google Search & Other': 'Google Search & Other',
          'YouTube ads': 'YouTube Ads',
          'YouTube Ads': 'YouTube Ads',
          'Google Network': 'Google Network',
          'Google other': 'Google Other',
          'Google Other': 'Google Other'
        }
      },
      
      'GOOG': {
        mappings: {
          // Same as GOOGL
          'Google Services': 'Google Services',
          'Google Cloud': 'Google Cloud',
          'Other Bets': 'Other Bets',
          'Google advertising': 'Google Advertising',
          'Google Advertising': 'Google Advertising',
          'Google Search & other': 'Google Search & Other',
          'Google Search & Other': 'Google Search & Other',
          'YouTube ads': 'YouTube Ads',
          'YouTube Ads': 'YouTube Ads',
          'Google Network': 'Google Network',
          'Google other': 'Google Other',
          'Google Other': 'Google Other'
        }
      },
      
      // Meta/Facebook
      'META': {
        mappings: {
          'Family of Apps': 'Family of Apps',
          'Reality Labs': 'Reality Labs',
          'Facebook': 'Family of Apps',
          'Instagram': 'Family of Apps',
          'WhatsApp': 'Family of Apps',
          'Messenger': 'Family of Apps',
          'Advertising': 'Advertising',
          'Other revenue': 'Other Revenue',
          'Other Revenue': 'Other Revenue'
        }
      },
      
      // Tesla
      'TSLA': {
        mappings: {
          'Automotive sales': 'Automotive Sales',
          'Automotive Sales': 'Automotive Sales',
          'Automotive regulatory credits': 'Automotive Regulatory Credits',
          'Automotive Regulatory Credits': 'Automotive Regulatory Credits',
          'Automotive leasing': 'Automotive Leasing',
          'Automotive Leasing': 'Automotive Leasing',
          'Energy generation and storage': 'Energy Generation & Storage',
          'Energy Generation and Storage': 'Energy Generation & Storage',
          'Energy Generation & Storage': 'Energy Generation & Storage',
          'Services and other': 'Services & Other',
          'Services and Other': 'Services & Other',
          'Services & Other': 'Services & Other'
        }
      },
      
      // Berkshire Hathaway
      'BRK.A': {
        mappings: {
          'Insurance and Other': 'Insurance & Other',
          'Insurance & Other': 'Insurance & Other',
          'Railroad': 'Railroad',
          'Utilities and Energy': 'Utilities & Energy',
          'Utilities & Energy': 'Utilities & Energy',
          'Manufacturing, Service and Retailing': 'Manufacturing, Service & Retailing',
          'Manufacturing Service and Retailing': 'Manufacturing, Service & Retailing',
          'Manufacturing, Service & Retailing': 'Manufacturing, Service & Retailing'
        }
      },
      
      'BRK.B': {
        mappings: {
          // Same as BRK.A
          'Insurance and Other': 'Insurance & Other',
          'Insurance & Other': 'Insurance & Other',
          'Railroad': 'Railroad',
          'Utilities and Energy': 'Utilities & Energy',
          'Utilities & Energy': 'Utilities & Energy',
          'Manufacturing, Service and Retailing': 'Manufacturing, Service & Retailing',
          'Manufacturing Service and Retailing': 'Manufacturing, Service & Retailing',
          'Manufacturing, Service & Retailing': 'Manufacturing, Service & Retailing'
        }
      },
      
      // Johnson & Johnson
      'JNJ': {
        mappings: {
          'Pharmaceutical': 'Pharmaceutical',
          'Medical Devices': 'Medical Devices',
          'Consumer': 'Consumer',
          'Consumer Products': 'Consumer',
          'Pharmaceuticals': 'Pharmaceutical'
        }
      },
      
      // Visa
      'V': {
        mappings: {
          'Service revenues': 'Service Revenues',
          'Service Revenues': 'Service Revenues',
          'Data processing revenues': 'Data Processing Revenues',
          'Data Processing Revenues': 'Data Processing Revenues',
          'International transaction revenues': 'International Transaction Revenues',
          'International Transaction Revenues': 'International Transaction Revenues',
          'Other revenues': 'Other Revenues',
          'Other Revenues': 'Other Revenues'
        }
      },
      
      // Walmart
      'WMT': {
        mappings: {
          'Walmart U.S.': 'Walmart U.S.',
          'Walmart US': 'Walmart U.S.',
          'Walmart International': 'Walmart International',
          'Sam\'s Club': 'Sam\'s Club',
          'Sams Club': 'Sam\'s Club'
        }
      }
    };
    
    // Generic segment patterns that apply to all companies
    this.genericPatterns = [
      // Remove redundant suffixes
      { pattern: /\s+(Revenue|Sales|Income)$/i, replacement: '' },
      { pattern: /\s+(Segment|Division|Unit|Group)$/i, replacement: '' },
      
      // Standardize common terms
      { pattern: /\s+&\s+/g, replacement: ' & ' },
      { pattern: /\s+and\s+/gi, replacement: ' & ' },
      
      // Fix spacing
      { pattern: /\s+/g, replacement: ' ' },
      { pattern: /^\s+|\s+$/g, replacement: '' }
    ];
    
    console.log('🔄 [SEGMENT CONTINUITY] Service initialized for temporal consistency');
    console.log(`   📊 ${Object.keys(this.companySegmentMappings).length} companies with specific mappings`);
  }
  
  /**
   * Process company segments with continuity mapping
   */
  processSegments(symbol, segmentData) {
    if (!segmentData || !segmentData.data || segmentData.data.length === 0) {
      return segmentData;
    }
    
    console.log(`🔄 [SEGMENT CONTINUITY] Processing ${symbol} segments for consistency`);
    
    // Check if we have company-specific mappings
    const companyConfig = this.companySegmentMappings[symbol];
    
    if (companyConfig) {
      return this.applyCompanySpecificMapping(symbol, segmentData, companyConfig);
    } else {
      return this.applyGenericMapping(segmentData);
    }
  }
  
  /**
   * Apply company-specific segment mappings
   */
  applyCompanySpecificMapping(symbol, segmentData, config) {
    const mappedData = JSON.parse(JSON.stringify(segmentData)); // Deep clone
    const allMappedSegments = new Set();
    const segmentFirstAppearance = new Map();
    const segmentLastAppearance = new Map();
    
    // First pass: collect all segments and map them
    mappedData.data.forEach((quarter, index) => {
      if (quarter.segments) {
        const mappedSegments = {};
        
        Object.entries(quarter.segments).forEach(([segment, value]) => {
          // Apply mapping
          const mappedName = config.mappings[segment] || this.applyGenericPatterns(segment);
          
          if (!segmentFirstAppearance.has(mappedName)) {
            segmentFirstAppearance.set(mappedName, index);
          }
          segmentLastAppearance.set(mappedName, index);
          
          allMappedSegments.add(mappedName);
          
          // Aggregate values for same mapped segment
          if (mappedSegments[mappedName]) {
            mappedSegments[mappedName] += value || 0;
          } else {
            mappedSegments[mappedName] = value || 0;
          }
        });
        
        quarter.segments = mappedSegments;
      }
    });
    
    // Get consistent segment list
    const consistentSegments = Array.from(allMappedSegments).sort();
    
    // Second pass: ensure all quarters have all segments
    mappedData.data.forEach((quarter) => {
      const filledSegments = {};
      
      consistentSegments.forEach(segment => {
        filledSegments[segment] = quarter.segments[segment] || null;
      });
      
      quarter.segments = filledSegments;
    });
    
    // Add metadata about the mapping
    mappedData.segments = consistentSegments;
    mappedData.segmentMapping = config.mappings;
    mappedData.segmentContinuityApplied = true;
    mappedData.message = `Segment continuity mapping applied for ${symbol}. Segments standardized across all quarters.`;
    
    // Add continuity info
    const continuityInfo = [];
    segmentFirstAppearance.forEach((firstIndex, segment) => {
      const lastIndex = segmentLastAppearance.get(segment);
      if (lastIndex - firstIndex < mappedData.data.length - 1) {
        const coverage = ((lastIndex - firstIndex + 1) / mappedData.data.length * 100).toFixed(0);
        continuityInfo.push(`${segment}: ${coverage}% coverage`);
      }
    });
    
    if (continuityInfo.length > 0) {
      mappedData.continuityNote = `Segment coverage: ${continuityInfo.join(', ')}`;
    }
    
    return mappedData;
  }
  
  /**
   * Apply generic pattern-based mapping
   */
  applyGenericMapping(segmentData) {
    const mappedData = JSON.parse(JSON.stringify(segmentData)); // Deep clone
    const segmentNameMap = new Map();
    
    // First pass: standardize all segment names
    segmentData.data.forEach(quarter => {
      if (quarter.segments) {
        Object.keys(quarter.segments).forEach(segment => {
          if (!segmentNameMap.has(segment)) {
            const standardized = this.applyGenericPatterns(segment);
            segmentNameMap.set(segment, standardized);
          }
        });
      }
    });
    
    // Apply standardization
    mappedData.data.forEach(quarter => {
      if (quarter.segments) {
        const standardizedSegments = {};
        
        Object.entries(quarter.segments).forEach(([segment, value]) => {
          const standardizedName = segmentNameMap.get(segment) || segment;
          
          // Aggregate if multiple segments map to same name
          if (standardizedSegments[standardizedName]) {
            standardizedSegments[standardizedName] += value || 0;
          } else {
            standardizedSegments[standardizedName] = value || 0;
          }
        });
        
        quarter.segments = standardizedSegments;
      }
    });
    
    // Update segment list
    const uniqueSegments = new Set();
    mappedData.data.forEach(quarter => {
      if (quarter.segments) {
        Object.keys(quarter.segments).forEach(seg => uniqueSegments.add(seg));
      }
    });
    
    mappedData.segments = Array.from(uniqueSegments).sort();
    
    return mappedData;
  }
  
  /**
   * Apply generic patterns to standardize segment name
   */
  applyGenericPatterns(segmentName) {
    let standardized = segmentName;
    
    this.genericPatterns.forEach(({ pattern, replacement }) => {
      standardized = standardized.replace(pattern, replacement);
    });
    
    return standardized;
  }
  
  /**
   * Add more company mappings dynamically
   */
  addCompanyMapping(symbol, mappings) {
    if (!this.companySegmentMappings[symbol]) {
      this.companySegmentMappings[symbol] = {
        mappings: {},
        consolidate: false
      };
    }
    
    Object.assign(this.companySegmentMappings[symbol].mappings, mappings);
    console.log(`📝 [SEGMENT CONTINUITY] Added mappings for ${symbol}`);
  }
  
  /**
   * Get list of companies with mappings
   */
  getMappedCompanies() {
    return Object.keys(this.companySegmentMappings);
  }
}

// Export singleton instance
export default new SegmentContinuityService();
