  // 🤖 AI-powered sector rotation analysis
  async getSectorRotation() {
    const cacheKey = 'ai_sector_rotation';
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log('Returning cached AI sector rotation');
      return cached;
    }
    
    console.log('🤖 Fetching fresh AI sector rotation analysis');
    
    try {
      const data = await fetchWithRetry(`${API_BASE_URL}/api/ai-analysis/sectors`);
      
      // Transform AI analysis data to format expected by SectorRotation component
      const transformedData = {
        marketPhase: data.marketCycle || 'Unknown',
        sectors: [], // Will be populated from leadingSectors and laggingSectors
        interpretation: {
          phase: data.analysis || 'AI analysis unavailable',
          actionItems: data.insights || []
        }
      };
      
      // Combine leading and lagging sectors
      if (data.leadingSectors) {
        data.leadingSectors.forEach(sector => {
          transformedData.sectors.push({
            name: sector,
            symbol: sector.toUpperCase(),
            change_p: 2.5 // Placeholder positive value for leaders
          });
        });
      }
      
      if (data.laggingSectors) {
        data.laggingSectors.forEach(sector => {
          transformedData.sectors.push({
            name: sector,
            symbol: sector.toUpperCase(),
            change_p: -1.5 // Placeholder negative value for laggards
          });
        });
      }
      
      // Cache for 1 hour
      await setCached(cacheKey, transformedData, 3600000);
      return transformedData;
    } catch (error) {
      console.error('Error fetching AI sector rotation:', error);
      throw error;
    }
  },