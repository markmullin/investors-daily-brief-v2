/**
 * Simple Intelligent Segment Service (No External Dependencies)
 * 
 * PURPOSE: Automatically standardize revenue segments for ALL companies
 * APPROACH: Pattern matching, string similarity, and intelligent grouping
 * SCALE: Works for thousands of companies without manual mapping
 */

class IntelligentSegmentService {
  constructor() {
    // Common segment patterns and their standardized forms
    this.segmentPatterns = {
      // Product/Service patterns
      products: {
        patterns: [/products?$/i, /product line/i, /product sales/i],
        standardize: (segment) => segment.replace(/\s*products?\s*$/i, ' Products')
      },
      services: {
        patterns: [/services?$/i, /service revenue/i, /service sales/i],
        standardize: (segment) => segment.replace(/\s*services?\s*$/i, ' Services')
      },
      
      // Business unit patterns
      commercial: {
        patterns: [/commercial/i, /business/i, /enterprise/i, /b2b/i],
        keywords: ['commercial', 'business', 'enterprise', 'corporate'],
        suffix: 'Commercial'
      },
      consumer: {
        patterns: [/consumer/i, /retail/i, /personal/i, /b2c/i],
        keywords: ['consumer', 'retail', 'personal', 'individual'],
        suffix: 'Consumer'
      },
      
      // Geographic patterns
      domestic: {
        patterns: [/domestic/i, /united states/i, /\bus\b/i, /north america/i],
        standardize: 'Domestic'
      },
      international: {
        patterns: [/international/i, /foreign/i, /overseas/i, /global/i],
        standardize: 'International'
      },
      
      // Technology patterns
      cloud: {
        patterns: [/cloud/i, /saas/i, /paas/i, /iaas/i],
        keywords: ['cloud', 'azure', 'aws', 'gcp'],
        standardize: 'Cloud Services'
      },
      software: {
        patterns: [/software/i, /applications?/i, /platforms?/i],
        standardize: 'Software'
      },
      hardware: {
        patterns: [/hardware/i, /devices?/i, /equipment/i],
        standardize: 'Hardware'
      },
      
      // Common business segments
      advertising: {
        patterns: [/advertis/i, /ads?\b/i, /marketing solutions/i],
        standardize: 'Advertising'
      },
      subscription: {
        patterns: [/subscription/i, /recurring/i, /membership/i],
        standardize: 'Subscription Services'
      },
      licensing: {
        patterns: [/licens/i, /royalt/i],
        standardize: 'Licensing'
      }
    };
    
    // Accounting terms to filter out or flag
    this.accountingTerms = [
      'revenue from contract',
      'deferred revenue',
      'net revenue',
      'total revenue',
      'revenue, net',
      'sales revenue',
      'assessed tax',
      'gaap',
      'non-gaap',
      'unallocated',
      'eliminations',
      'adjustments',
      'other income',
      'interest income'
    ];
    
    // Color palette for segments
    this.colorPalette = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
      '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1',
      '#14b8a6', '#a855f7', '#0891b2', '#dc2626', '#65a30d',
      '#7c3aed', '#ea580c', '#0d9488', '#2563eb', '#db2777'
    ];
    
    // Similarity threshold for grouping
    this.SIMILARITY_THRESHOLD = 0.75;
    
    console.log('🧠 [INTELLIGENT SEGMENTS] Service initialized for automatic standardization');
  }
  
  /**
   * Simple tokenizer
   */
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }
    
    return dp[m][n];
  }
  
  /**
   * Calculate string similarity (0-1)
   */
  stringSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLen);
  }
  
  /**
   * Process segments for any company automatically
   */
  processCompanySegments(segmentData, symbol) {
    if (!segmentData || !segmentData.hasSegmentData || !segmentData.data) {
      return segmentData;
    }
    
    console.log(`🔍 [INTELLIGENT SEGMENTS] Processing ${symbol} with ${segmentData.segments?.length || 0} unique segments`);
    
    // Step 1: Analyze all segments across all quarters
    const segmentAnalysis = this.analyzeSegments(segmentData);
    
    // Step 2: Create intelligent groupings
    const segmentGroups = this.createSegmentGroups(segmentAnalysis);
    
    // Step 3: Standardize segment names
    const standardizedMapping = this.standardizeSegmentNames(segmentGroups, symbol);
    
    // Step 4: Apply standardization to data
    const standardizedData = this.applyStandardization(segmentData, standardizedMapping);
    
    // Step 5: Add quality metrics
    const enhancedData = this.addQualityMetrics(standardizedData, segmentAnalysis);
    
    // Step 6: Assign consistent colors
    const finalData = this.assignSegmentColors(enhancedData);
    
    return finalData;
  }
  
  /**
   * Analyze segments to understand patterns and quality
   */
  analyzeSegments(segmentData) {
    const analysis = {
      segments: new Map(),
      totalQuarters: segmentData.data.length,
      hasAccountingTerms: false,
      dataQuality: 'good',
      warnings: []
    };
    
    // Analyze each segment
    segmentData.data.forEach((quarter, qIndex) => {
      if (quarter.segments) {
        Object.entries(quarter.segments).forEach(([segment, value]) => {
          if (!analysis.segments.has(segment)) {
            analysis.segments.set(segment, {
              name: segment,
              quarters: [],
              totalValue: 0,
              avgValue: 0,
              frequency: 0,
              isAccounting: this.isAccountingTerm(segment),
              tokens: this.tokenize(segment)
            });
          }
          
          const segInfo = analysis.segments.get(segment);
          if (value != null && value > 0) {
            segInfo.quarters.push({ index: qIndex, date: quarter.date, value });
            segInfo.totalValue += value;
            segInfo.frequency++;
          }
        });
      }
    });
    
    // Calculate averages and detect issues
    analysis.segments.forEach((segInfo, segment) => {
      segInfo.avgValue = segInfo.frequency > 0 ? segInfo.totalValue / segInfo.frequency : 0;
      segInfo.coverageRatio = segInfo.frequency / analysis.totalQuarters;
      
      if (segInfo.isAccounting) {
        analysis.hasAccountingTerms = true;
      }
      
      // Quality warnings
      if (segInfo.coverageRatio < 0.5 && segInfo.frequency > 0) {
        analysis.warnings.push(`Segment "${segment}" only appears in ${Math.round(segInfo.coverageRatio * 100)}% of quarters`);
      }
    });
    
    // Overall data quality assessment
    if (analysis.totalQuarters < 4) {
      analysis.dataQuality = 'limited';
      analysis.warnings.push(`Only ${analysis.totalQuarters} quarters of data available`);
    } else if (analysis.hasAccountingTerms && analysis.segments.size <= 3) {
      analysis.dataQuality = 'accounting';
      analysis.warnings.push('Data contains accounting categories instead of product segments');
    }
    
    return analysis;
  }
  
  /**
   * Create intelligent segment groups based on similarity
   */
  createSegmentGroups(analysis) {
    const groups = [];
    const processedSegments = new Set();
    
    // Convert map to array and sort by total value (importance)
    const segments = Array.from(analysis.segments.values())
      .filter(seg => seg.frequency > 0)
      .sort((a, b) => b.totalValue - a.totalValue);
    
    segments.forEach(segment => {
      if (processedSegments.has(segment.name)) return;
      
      // Create new group
      const group = {
        primary: segment,
        members: [segment],
        pattern: this.detectPattern(segment.name),
        totalValue: segment.totalValue
      };
      
      // Find similar segments to group together
      segments.forEach(otherSegment => {
        if (segment.name === otherSegment.name || processedSegments.has(otherSegment.name)) return;
        
        const similarity = this.calculateSimilarity(segment, otherSegment);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          group.members.push(otherSegment);
          group.totalValue += otherSegment.totalValue;
          processedSegments.add(otherSegment.name);
        }
      });
      
      processedSegments.add(segment.name);
      groups.push(group);
    });
    
    return groups;
  }
  
  /**
   * Calculate similarity between two segments
   */
  calculateSimilarity(seg1, seg2) {
    // 1. String similarity
    const stringSim = this.stringSimilarity(seg1.name, seg2.name);
    
    // 2. Token overlap (Jaccard similarity)
    const tokens1 = new Set(seg1.tokens);
    const tokens2 = new Set(seg2.tokens);
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    const jaccardSim = union.size > 0 ? intersection.size / union.size : 0;
    
    // 3. Pattern matching bonus
    const pattern1 = this.detectPattern(seg1.name);
    const pattern2 = this.detectPattern(seg2.name);
    const patternBonus = (pattern1 && pattern1 === pattern2) ? 0.2 : 0;
    
    // 4. Common prefix/suffix check
    const prefixSuffixSim = this.checkPrefixSuffix(seg1.name, seg2.name) ? 0.3 : 0;
    
    // Weighted average
    const weightedSim = (stringSim * 0.4) + (jaccardSim * 0.3) + patternBonus + prefixSuffixSim;
    
    return Math.min(weightedSim, 1.0);
  }
  
  /**
   * Check if segments share common prefix or suffix
   */
  checkPrefixSuffix(str1, str2) {
    const minLen = Math.min(str1.length, str2.length);
    if (minLen < 5) return false;
    
    // Check prefix (at least 5 chars)
    const prefixLen = Math.min(5, Math.floor(minLen * 0.5));
    if (str1.substring(0, prefixLen).toLowerCase() === str2.substring(0, prefixLen).toLowerCase()) {
      return true;
    }
    
    // Check suffix (at least 4 chars)
    const suffixLen = Math.min(4, Math.floor(minLen * 0.4));
    if (str1.slice(-suffixLen).toLowerCase() === str2.slice(-suffixLen).toLowerCase()) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect common patterns in segment names
   */
  detectPattern(segmentName) {
    const lower = segmentName.toLowerCase();
    
    for (const [patternName, config] of Object.entries(this.segmentPatterns)) {
      // Check regex patterns
      if (config.patterns) {
        for (const pattern of config.patterns) {
          if (pattern.test(segmentName)) {
            return patternName;
          }
        }
      }
      
      // Check keywords
      if (config.keywords) {
        for (const keyword of config.keywords) {
          if (lower.includes(keyword)) {
            return patternName;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Standardize segment names intelligently
   */
  standardizeSegmentNames(groups, symbol) {
    const mapping = new Map();
    
    groups.forEach((group, index) => {
      let standardizedName;
      
      // If group has a detected pattern, use pattern-based standardization
      if (group.pattern && this.segmentPatterns[group.pattern]) {
        const pattern = this.segmentPatterns[group.pattern];
        if (pattern.standardize) {
          if (typeof pattern.standardize === 'function') {
            standardizedName = pattern.standardize(group.primary.name);
          } else {
            standardizedName = pattern.standardize;
          }
        } else if (pattern.suffix) {
          // Extract base name and add suffix
          const baseName = this.extractBaseName(group.primary.name);
          standardizedName = `${baseName} ${pattern.suffix}`;
        }
      }
      
      // If no pattern match, create intelligent standardization
      if (!standardizedName) {
        standardizedName = this.intelligentStandardize(group.primary.name);
      }
      
      // Map all group members to the standardized name
      group.members.forEach(member => {
        mapping.set(member.name, standardizedName);
      });
    });
    
    return mapping;
  }
  
  /**
   * Intelligent standardization for names without patterns
   */
  intelligentStandardize(segmentName) {
    let standardized = segmentName;
    
    // Remove common noise words
    const noiseWords = ['the', 'and', 'of', 'for', 'with', 'from', 'by', 'in', 'on', 'at'];
    const tokens = this.tokenize(standardized);
    
    // Filter noise and very short tokens
    const filtered = tokens.filter(token => 
      !noiseWords.includes(token.toLowerCase()) && token.length > 2
    );
    
    // Capitalize properly
    standardized = filtered.map(token => 
      token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
    ).join(' ');
    
    // Replace common abbreviations
    standardized = standardized
      .replace(/\b&\b/g, 'and')
      .replace(/\bsvcs?\b/gi, 'Services')
      .replace(/\bprods?\b/gi, 'Products')
      .replace(/\bmgmt\b/gi, 'Management')
      .replace(/\bcorp\b/gi, 'Corporate')
      .replace(/\bintl\b/gi, 'International')
      .replace(/\btech\b/gi, 'Technology')
      .replace(/\bcomm\b/gi, 'Commercial')
      .replace(/\bmfg\b/gi, 'Manufacturing')
      .replace(/\bdist\b/gi, 'Distribution');
    
    // Remove redundant suffixes
    standardized = standardized
      .replace(/\s+(revenue|sales|income|segment|division|unit|group)$/i, '')
      .trim();
    
    // Clean up spacing
    standardized = standardized.replace(/\s+/g, ' ').trim();
    
    // If result is too short or empty, use original
    if (standardized.length < 3) {
      standardized = segmentName;
    }
    
    return standardized;
  }
  
  /**
   * Extract base name from segment
   */
  extractBaseName(segmentName) {
    // Remove common suffixes
    let baseName = segmentName
      .replace(/\s*(products?|services?|revenue|sales|income|operations?|business|segment|division)$/i, '')
      .trim();
    
    return baseName || segmentName;
  }
  
  /**
   * Check if segment is an accounting term
   */
  isAccountingTerm(segment) {
    const lower = segment.toLowerCase();
    return this.accountingTerms.some(term => lower.includes(term));
  }
  
  /**
   * Apply standardization to segment data
   */
  applyStandardization(segmentData, mapping) {
    // Get unique standardized segments
    const standardizedSegments = new Set(mapping.values());
    const uniqueStandardized = Array.from(standardizedSegments).sort();
    
    // Transform data
    const transformedData = segmentData.data.map(quarter => {
      const standardizedQuarter = {
        date: quarter.date,
        period: quarter.period,
        segments: {}
      };
      
      // Initialize all standardized segments
      uniqueStandardized.forEach(segment => {
        standardizedQuarter.segments[segment] = 0;
      });
      
      // Aggregate values
      if (quarter.segments) {
        Object.entries(quarter.segments).forEach(([rawSegment, value]) => {
          const standardizedName = mapping.get(rawSegment);
          if (standardizedName && value != null && !isNaN(value)) {
            standardizedQuarter.segments[standardizedName] = 
              (standardizedQuarter.segments[standardizedName] || 0) + Number(value);
          }
        });
      }
      
      return standardizedQuarter;
    });
    
    return {
      ...segmentData,
      segments: uniqueStandardized,
      data: transformedData,
      isStandardized: true,
      segmentMapping: Object.fromEntries(mapping),
      originalSegmentCount: mapping.size,
      standardizedSegmentCount: uniqueStandardized.length
    };
  }
  
  /**
   * Add quality metrics to help users understand data
   */
  addQualityMetrics(standardizedData, analysis) {
    const metrics = {
      dataQuality: analysis.dataQuality,
      warnings: analysis.warnings,
      quartersCovered: analysis.totalQuarters,
      hasAccountingTerms: analysis.hasAccountingTerms,
      segmentCoverage: {}
    };
    
    // Calculate coverage for each standardized segment
    standardizedData.segments.forEach(segment => {
      const quartersWithData = standardizedData.data.filter(q => 
        q.segments[segment] && q.segments[segment] > 0
      ).length;
      
      metrics.segmentCoverage[segment] = {
        quarters: quartersWithData,
        percentage: (quartersWithData / standardizedData.data.length) * 100
      };
    });
    
    // Generate quality message
    let qualityMessage = '';
    if (metrics.dataQuality === 'limited') {
      qualityMessage = `Limited data available (only ${metrics.quartersCovered} quarters). More historical data may become available over time.`;
    } else if (metrics.dataQuality === 'accounting') {
      qualityMessage = 'Revenue data shows accounting categories rather than product segments. This is how the company reports to investors.';
    } else if (metrics.warnings.length > 0) {
      qualityMessage = metrics.warnings[0];
    }
    
    return {
      ...standardizedData,
      dataQualityMetrics: metrics,
      message: qualityMessage || standardizedData.message
    };
  }
  
  /**
   * Assign consistent colors to segments
   */
  assignSegmentColors(data) {
    const segmentColorMap = {};
    
    data.segments.forEach((segment, index) => {
      // Use index-based color assignment for consistency
      segmentColorMap[segment] = this.colorPalette[index % this.colorPalette.length];
    });
    
    return {
      ...data,
      segmentColorMap
    };
  }
}

// Export singleton instance
export default new IntelligentSegmentService();
