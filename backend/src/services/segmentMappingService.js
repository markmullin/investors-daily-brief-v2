/**
 * Segment Mapping Service
 * 
 * PURPOSE: Standardize revenue segment names across quarters
 * PROBLEM: Companies reorganize and rename segments over time
 * SOLUTION: Map historical segment names to current standardized names
 * 
 * Examples:
 * - Microsoft: "Office System" → "Microsoft 365 Commercial"
 * - NextEra: "FPL Segment" → "Florida Power & Light"
 */

class SegmentMappingService {
  constructor() {
    // Company-specific segment mappings
    this.segmentMappings = {
      // Microsoft segment evolution
      'MSFT': {
        // Office/365 Evolution
        'Office System': 'Microsoft 365',
        'Office Products': 'Microsoft 365',
        'Office Commercial': 'Microsoft 365 Commercial',
        'Office Consumer': 'Microsoft 365 Consumer',
        'Office 365 Commercial': 'Microsoft 365 Commercial',
        'Office 365 Consumer': 'Microsoft 365 Consumer',
        'Microsoft Office System': 'Microsoft 365',
        'Microsoft Three Six Five Commercial Products And Cloud Services': 'Microsoft 365 Commercial',
        'Microsoft Three Six Five Consumer Products And Cloud Services': 'Microsoft 365 Consumer',
        'M365 Commercial': 'Microsoft 365 Commercial',
        'M365 Consumer': 'Microsoft 365 Consumer',
        
        // Windows Evolution
        'Windows': 'Windows',
        'Windows OEM': 'Windows',
        'Windows Commercial': 'Windows',
        'Windows Products': 'Windows',
        
        // Server/Cloud Evolution
        'Server Products': 'Server Products & Cloud Services',
        'Server Products And Tools': 'Server Products & Cloud Services',
        'Server Products and Cloud Services': 'Server Products & Cloud Services',
        'Azure': 'Server Products & Cloud Services',
        'Intelligent Cloud': 'Server Products & Cloud Services',
        
        // Other Products
        'Gaming': 'Gaming',
        'Xbox': 'Gaming',
        'Xbox Content and Services': 'Gaming',
        'LinkedIn': 'LinkedIn',
        'Linked In Corporation': 'LinkedIn',
        'LinkedIn Corporation': 'LinkedIn',
        'Dynamics': 'Dynamics',
        'Dynamics Products And Cloud Services': 'Dynamics',
        'Dynamics 365': 'Dynamics',
        'Devices': 'Devices',
        'Surface': 'Devices',
        'Search': 'Search & Advertising',
        'Search And News Advertising': 'Search & Advertising',
        'Search & News Ads': 'Search & Advertising',
        'Bing': 'Search & Advertising',
        'Advertising': 'Search & Advertising',
        
        // Business Segments
        'Productivity and Business Processes': 'Productivity & Business',
        'Intelligent Cloud': 'Cloud & Server',
        'More Personal Computing': 'Personal Computing',
        
        // Enterprise
        'Enterprise Services': 'Enterprise Services',
        'Enterprise Support': 'Enterprise Services',
        'Consulting And Product Support Services': 'Enterprise Services',
        'Consulting & Support': 'Enterprise Services',
        
        // Other
        'Other': 'Other',
        'Other Products And Services': 'Other',
        'Other Products & Services': 'Other'
      },
      
      // NextEra Energy segment mappings
      'NEE': {
        'FPL': 'Florida Power & Light',
        'FPL Segment': 'Florida Power & Light',
        'Florida Power & Light Company': 'Florida Power & Light',
        'Florida Power and Light': 'Florida Power & Light',
        'FP&L': 'Florida Power & Light',
        
        'NEER': 'NextEra Energy Resources',
        'NEER Segment': 'NextEra Energy Resources',
        'NextEra Energy Resources Segment': 'NextEra Energy Resources',
        'Energy Resources': 'NextEra Energy Resources',
        
        'Corporate and Other': 'Corporate & Other',
        'Corporate': 'Corporate & Other',
        'Other': 'Corporate & Other',
        'Eliminations': 'Eliminations'
      },
      
      // Apple segment mappings
      'AAPL': {
        'iPhone': 'iPhone',
        'iPhones': 'iPhone',
        
        'Mac': 'Mac',
        'Macs': 'Mac',
        'MacBook': 'Mac',
        
        'iPad': 'iPad',
        'iPads': 'iPad',
        
        'Wearables, Home and Accessories': 'Wearables & Accessories',
        'Wearables': 'Wearables & Accessories',
        'Apple Watch': 'Wearables & Accessories',
        'AirPods': 'Wearables & Accessories',
        'Accessories': 'Wearables & Accessories',
        
        'Services': 'Services',
        'Service': 'Services',
        'App Store': 'Services',
        'Apple Services': 'Services',
        
        'Other Products': 'Other',
        'Other': 'Other'
      },
      
      // Google/Alphabet segment mappings
      'GOOGL': {
        'Google Search': 'Google Search',
        'Search': 'Google Search',
        'Google Search & Other': 'Google Search',
        
        'YouTube': 'YouTube',
        'YouTube Ads': 'YouTube',
        'YouTube Advertising': 'YouTube',
        
        'Google Cloud': 'Google Cloud',
        'Cloud': 'Google Cloud',
        'GCP': 'Google Cloud',
        
        'Google Network': 'Google Network',
        'Network': 'Google Network',
        'AdSense': 'Google Network',
        
        'Google Other': 'Google Other',
        'Other Google': 'Google Other',
        'Hardware': 'Google Other',
        'Play Store': 'Google Other',
        
        'Other Bets': 'Other Bets',
        'Waymo': 'Other Bets',
        'Verily': 'Other Bets'
      },
      
      // Amazon segment mappings
      'AMZN': {
        'AWS': 'AWS',
        'Amazon Web Services': 'AWS',
        'Cloud Services': 'AWS',
        
        'Online Stores': 'Online Stores',
        'Online Sales': 'Online Stores',
        'E-commerce': 'Online Stores',
        'Retail': 'Online Stores',
        
        'Physical Stores': 'Physical Stores',
        'Whole Foods': 'Physical Stores',
        'Amazon Go': 'Physical Stores',
        
        'Third-party Seller Services': 'Seller Services',
        'Marketplace': 'Seller Services',
        'Fulfillment': 'Seller Services',
        
        'Subscription Services': 'Subscription Services',
        'Prime': 'Subscription Services',
        'Amazon Prime': 'Subscription Services',
        
        'Advertising Services': 'Advertising',
        'Advertising': 'Advertising',
        'Amazon Advertising': 'Advertising',
        
        'Other': 'Other'
      }
    };
    
    // Segment color mappings for consistent colors across quarters
    this.segmentColors = {
      // Microsoft colors
      'Microsoft 365': '#0078D4',           // Microsoft Blue
      'Microsoft 365 Commercial': '#0078D4',
      'Microsoft 365 Consumer': '#40E0D0',  // Turquoise
      'Windows': '#00BCF2',                 // Windows Blue
      'Server Products & Cloud Services': '#00D7CC', // Azure Blue
      'Cloud & Server': '#00D7CC',
      'Gaming': '#107C10',                  // Xbox Green
      'LinkedIn': '#0A66C2',               // LinkedIn Blue
      'Dynamics': '#002050',               // Dark Blue
      'Devices': '#5C2D91',                // Surface Purple
      'Search & Advertising': '#F25022',    // Bing Red
      'Enterprise Services': '#7FBA00',     // Green
      'Productivity & Business': '#FFB900', // Gold
      'Personal Computing': '#E81123',      // Red
      'Other': '#737373',                  // Gray
      
      // NextEra colors
      'Florida Power & Light': '#0066CC',   // FPL Blue
      'NextEra Energy Resources': '#00A652', // Green
      'Corporate & Other': '#666666',       // Gray
      'Eliminations': '#999999',           // Light Gray
      
      // Apple colors
      'iPhone': '#1D1D1F',                 // Apple Black
      'Mac': '#0071E3',                    // Apple Blue
      'iPad': '#AC39FF',                   // Purple
      'Wearables & Accessories': '#FF3B30', // Red
      'Services': '#34C759',               // Green
      
      // Google colors
      'Google Search': '#4285F4',          // Google Blue
      'YouTube': '#FF0000',                // YouTube Red
      'Google Cloud': '#34A853',           // Google Green
      'Google Network': '#FBBC04',         // Google Yellow
      'Google Other': '#EA4335',           // Google Red
      'Other Bets': '#9E9E9E',            // Gray
      
      // Amazon colors
      'AWS': '#FF9900',                    // Amazon Orange
      'Online Stores': '#232F3E',          // Amazon Dark Blue
      'Physical Stores': '#146EB4',        // Blue
      'Seller Services': '#FF6F00',        // Dark Orange
      'Subscription Services': '#00A8E1',   // Light Blue
      'Advertising': '#36C5F0',            // Cyan
      
      // Default colors for unmapped segments
      'DEFAULT_1': '#3b82f6',
      'DEFAULT_2': '#10b981',
      'DEFAULT_3': '#f59e0b',
      'DEFAULT_4': '#8b5cf6',
      'DEFAULT_5': '#ef4444',
      'DEFAULT_6': '#06b6d4',
      'DEFAULT_7': '#ec4899',
      'DEFAULT_8': '#f97316'
    };
  }
  
  /**
   * Standardize segment name based on company mappings
   */
  standardizeSegmentName(rawSegmentName, symbol) {
    if (!rawSegmentName || !symbol) return rawSegmentName;
    
    const upperSymbol = symbol.toUpperCase();
    const mappings = this.segmentMappings[upperSymbol];
    
    if (!mappings) {
      // No mappings for this company, clean up the name
      return this.cleanSegmentName(rawSegmentName);
    }
    
    // Check for exact match first
    if (mappings[rawSegmentName]) {
      return mappings[rawSegmentName];
    }
    
    // Check for case-insensitive match
    const normalizedRaw = rawSegmentName.trim();
    for (const [oldName, newName] of Object.entries(mappings)) {
      if (oldName.toLowerCase() === normalizedRaw.toLowerCase()) {
        return newName;
      }
    }
    
    // Check for partial matches (contains)
    for (const [oldName, newName] of Object.entries(mappings)) {
      if (normalizedRaw.includes(oldName) || oldName.includes(normalizedRaw)) {
        return newName;
      }
    }
    
    // No mapping found, clean up the name
    return this.cleanSegmentName(rawSegmentName);
  }
  
  /**
   * Clean up segment names for display
   */
  cleanSegmentName(segmentName) {
    return segmentName
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/And/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Get consistent color for a segment
   */
  getSegmentColor(standardizedSegmentName, index = 0) {
    // Check if we have a specific color for this segment
    if (this.segmentColors[standardizedSegmentName]) {
      return this.segmentColors[standardizedSegmentName];
    }
    
    // Use default color based on index
    const defaultKey = `DEFAULT_${(index % 8) + 1}`;
    return this.segmentColors[defaultKey] || '#666666';
  }
  
  /**
   * Process revenue segmentation data to standardize names across quarters
   */
  processSegmentData(segmentData, symbol) {
    if (!segmentData || !segmentData.hasSegmentData || !segmentData.data) {
      return segmentData;
    }
    
    const upperSymbol = symbol.toUpperCase();
    
    // First pass: collect all unique segment names and their standardized versions
    const segmentNameMap = new Map();
    const standardizedSegments = new Set();
    
    segmentData.data.forEach(quarter => {
      if (quarter.segments) {
        Object.keys(quarter.segments).forEach(rawSegment => {
          const standardized = this.standardizeSegmentName(rawSegment, upperSymbol);
          segmentNameMap.set(rawSegment, standardized);
          standardizedSegments.add(standardized);
        });
      }
    });
    
    // Convert to array and sort
    const uniqueStandardizedSegments = Array.from(standardizedSegments).sort();
    
    // Second pass: transform the data to use standardized names
    const transformedData = segmentData.data.map(quarter => {
      const standardizedQuarter = {
        date: quarter.date,
        period: quarter.period,
        segments: {}
      };
      
      // Initialize all standardized segments with 0
      uniqueStandardizedSegments.forEach(segment => {
        standardizedQuarter.segments[segment] = 0;
      });
      
      // Aggregate values for segments that map to the same standardized name
      if (quarter.segments) {
        Object.entries(quarter.segments).forEach(([rawSegment, value]) => {
          const standardizedName = segmentNameMap.get(rawSegment);
          if (standardizedName && value != null && !isNaN(value)) {
            standardizedQuarter.segments[standardizedName] = 
              (standardizedQuarter.segments[standardizedName] || 0) + Number(value);
          }
        });
      }
      
      return standardizedQuarter;
    });
    
    // Create color mappings for the standardized segments
    const segmentColorMap = {};
    uniqueStandardizedSegments.forEach((segment, index) => {
      segmentColorMap[segment] = this.getSegmentColor(segment, index);
    });
    
    // Return enhanced segment data
    return {
      ...segmentData,
      segments: uniqueStandardizedSegments,
      data: transformedData,
      segmentColorMap: segmentColorMap,
      isStandardized: true,
      originalSegmentCount: segmentNameMap.size,
      standardizedSegmentCount: uniqueStandardizedSegments.length,
      segmentMappings: Object.fromEntries(segmentNameMap)
    };
  }
}

// Export singleton instance
export default new SegmentMappingService();
