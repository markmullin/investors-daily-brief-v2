import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import SectorBarChart from './SectorBarChart';
import TimePeriodSelector from './TimePeriodSelector';
import { marketApi } from '../services/api';

const SectorPerformanceNew = ({ initialSectorData = [] }) => {
  const [sectorData, setSectorData] = useState(Array.isArray(initialSectorData) ? initialSectorData : []);
  const [selectedPeriod, setSelectedPeriod] = useState('1d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sector data when period changes
  useEffect(() => {
    const fetchSectorData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`🔍 Fetching sector data for period: ${selectedPeriod}`);
        
        // Use the correct API method
        const data = await marketApi.getSectors(selectedPeriod);
        
        console.log('📊 Sector data received:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Is array:', Array.isArray(data));
        
        // DEFENSIVE: Ensure we always work with an array
        let processedData = [];
        if (Array.isArray(data)) {
          processedData = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.sectors)) {
          processedData = data.sectors;
        } else if (data && typeof data === 'object' && Array.isArray(data.performance)) {
          processedData = data.performance;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          processedData = data.data;
        } else {
          console.warn('⚠️ Unexpected sector data format:', data);
          processedData = [];
        }
        
        // CRITICAL: Validate each item in the array to ensure it has expected structure
        const validatedData = processedData.filter(item => {
          return item && typeof item === 'object' && (item.symbol || item.name);
        });
        
        console.log(`✅ Processed sector data: ${validatedData.length} sectors`);
        setSectorData(validatedData);
      } catch (error) {
        console.error('❌ Error fetching sector data:', error);
        setError('Failed to fetch sector data');
        // SAFE: Keep using existing data if fetch fails, but ensure it's an array
        setSectorData(prevData => Array.isArray(prevData) ? prevData : []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectorData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period.value);
  };

  // ULTRA-SAFE: Analyze sector performance with bulletproof error handling
  const analyzeSectorPerformance = () => {
    // BULLETPROOF: Multiple layers of validation
    if (!sectorData) {
      console.log('⚠️ sectorData is null/undefined');
      return null;
    }
    
    if (!Array.isArray(sectorData)) {
      console.log('⚠️ sectorData is not an array:', typeof sectorData);
      return null;
    }
    
    if (sectorData.length === 0) {
      console.log('⚠️ sectorData array is empty');
      return null;
    }
    
    try {
      // SAFE: Create a defensive copy with validation
      const validSectorData = sectorData.filter(sector => {
        return sector && 
               typeof sector === 'object' && 
               (sector.symbol || sector.name) &&
               (typeof sector.changePercent === 'number' || typeof sector.change_p === 'number');
      });
      
      if (validSectorData.length === 0) {
        console.log('⚠️ No valid sector data after filtering');
        return null;
      }
      
      // SAFE: Sort sectors by performance with fallback values and error handling
      const sortedSectors = validSectorData.map(sector => ({
        ...sector,
        changePercent: sector.changePercent || sector.change_p || 0
      })).sort((a, b) => {
        const aChange = Number(a.changePercent) || 0;
        const bChange = Number(b.changePercent) || 0;
        return bChange - aChange;
      });
      
      const topPerformers = sortedSectors.slice(0, 3).filter(s => {
        const change = Number(s.changePercent) || 0;
        return change > 0;
      });
      
      // Determine market conditions based on sector performance
      const techSector = validSectorData.find(s => s.symbol === 'XLK');
      const utilitiesSector = validSectorData.find(s => s.symbol === 'XLU');
      
      // Determine if this is short-term or long-term analysis
      const isShortTerm = ['1d', '5d'].includes(selectedPeriod);
      const isLongTerm = ['1y', '5y'].includes(selectedPeriod);
      
      let marketCondition = 'NEUTRAL';
      let rotationInsights = '';
      let tradingImplications = [];
      
      // Risk-on vs Risk-off analysis
      if (techSector && utilitiesSector) {
        const techChange = Number(techSector.changePercent || techSector.change_p) || 0;
        const utilChange = Number(utilitiesSector.changePercent || utilitiesSector.change_p) || 0;
        const riskDiff = techChange - utilChange;
        
        if (isShortTerm) {
          if (riskDiff > 1) {
            marketCondition = 'RISK-ON';
            rotationInsights = 'Technology outperforming utilities today suggests positive market sentiment and risk appetite.';
            tradingImplications = [
              'Consider intraday momentum trades in growth stocks',
              'Watch for continuation in high-beta names',
              'Monitor volume for confirmation of the move'
            ];
          } else if (riskDiff < -1) {
            marketCondition = 'RISK-OFF';
            rotationInsights = 'Defensive sectors leading indicates caution and potential near-term volatility.';
            tradingImplications = [
              'Consider defensive positions or hedges',
              'Watch for support levels in major indices',
              'Quality dividend stocks may outperform'
            ];
          } else {
            marketCondition = 'NEUTRAL';
            rotationInsights = 'Mixed sector performance suggests market indecision in the short term.';
            tradingImplications = [
              'Wait for clearer directional signals',
              'Focus on individual stock stories',
              'Consider range-bound strategies'
            ];
          }
        } else if (isLongTerm) {
          if (riskDiff > 5) {
            marketCondition = 'GROWTH ORIENTED';
            rotationInsights = 'Long-term technology leadership indicates secular growth phase driven by innovation.';
            tradingImplications = [
              'Overweight growth and technology sectors',
              'Focus on companies with strong secular trends',
              'Consider long-term positions in innovation leaders'
            ];
          } else if (riskDiff < -5) {
            marketCondition = 'DEFENSIVE ROTATION';
            rotationInsights = 'Long-term outperformance of defensive sectors suggests economic uncertainty and value rotation.';
            tradingImplications = [
              'Increase allocation to value and dividend stocks',
              'Consider utilities and consumer staples for stability',
              'Reduce exposure to high-multiple growth stocks'
            ];
          } else {
            marketCondition = 'BALANCED';
            rotationInsights = 'Balanced long-term performance across sectors suggests stable market conditions.';
            tradingImplications = [
              'Maintain diversified portfolio allocation',
              'Focus on quality across all sectors',
              'Rebalance positions that have become overweight'
            ];
          }
        } else {
          // Medium term
          marketCondition = 'TRANSITIONING';
          rotationInsights = 'Medium-term trends show market in transition phase. Watch for emerging leadership.';
          tradingImplications = [
            'Monitor sector rotation for new trends',
            'Consider partial position adjustments',
            'Keep some dry powder for opportunities'
          ];
        }
      }
      
      // Additional rotation insights based on other sectors
      if (topPerformers.length > 0) {
        const avgTopPerformance = topPerformers.reduce((sum, s) => {
          const change = Number(s.changePercent) || 0;
          return sum + change;
        }, 0) / topPerformers.length;
        
        if (avgTopPerformance > 2) {
          rotationInsights += ' Strong sector momentum with clear leadership. Trend-following strategies may work well.';
        }
      }
      
      // Breadth analysis
      const positiveSectors = validSectorData.filter(s => {
        const change = Number(s.changePercent || s.change_p) || 0;
        return change > 0;
      }).length;
      
      if (positiveSectors > 7) {
        rotationInsights += ' Broad market participation - healthy rally.';
      } else if (positiveSectors < 4) {
        rotationInsights += ' Narrow breadth - be cautious of false moves.';
      }
      
      return {
        topPerformers,
        marketCondition,
        rotationInsights: rotationInsights.trim(),
        tradingImplications,
        breadthCount: positiveSectors,
        timeframe: isShortTerm ? 'short-term' : isLongTerm ? 'long-term' : 'medium-term'
      };
      
    } catch (error) {
      console.error('❌ Error in sector analysis:', error);
      console.error('❌ sectorData at time of error:', sectorData);
      return null;
    }
  };

  // SAFE: Ensure sectorData is always an array before calling analysis
  const safeSectorData = Array.isArray(sectorData) ? sectorData : [];
  const analysis = safeSectorData.length > 0 ? analyzeSectorPerformance() : null;

  return (
    <div className="space-y-4">
      {/* Time Period Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      {/* Sector Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        ) : safeSectorData.length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              {selectedPeriod.toUpperCase()} Performance
            </h3>
            <SectorBarChart data={safeSectorData} />
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>No sector data available</span>
            </div>
          </div>
        )}
      </div>

      {/* ENHANCED Sector Analysis - Quality Over Quantity */}
      {analysis && !isLoading && safeSectorData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {analysis.timeframe === 'short-term' ? 'Short-Term' : 
             analysis.timeframe === 'long-term' ? 'Long-Term' : 'Medium-Term'} Sector Analysis
          </h3>
          
          {/* Market Condition */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">
              Market Condition: {analysis.breadthCount}/11 Sectors Positive
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              analysis.marketCondition.includes('RISK-ON') || analysis.marketCondition.includes('GROWTH') ? 'bg-green-100 text-green-800' :
              analysis.marketCondition.includes('RISK-OFF') || analysis.marketCondition.includes('DEFENSIVE') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {analysis.marketCondition}
            </div>
          </div>

          {/* Sector Rotation Insights */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 mb-1">Sector Rotation Insights</h5>
            <p className="text-sm text-gray-600">{analysis.rotationInsights}</p>
          </div>

          {/* Trading Implications */}
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Trading Implications</h5>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {analysis.tradingImplications.map((implication, idx) => (
                <li key={idx}>{implication}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorPerformanceNew;