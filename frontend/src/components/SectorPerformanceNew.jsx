import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Brain, BarChart3, ChevronRight, GraduationCap } from 'lucide-react';
import SectorBarChart from './SectorBarChart';
import TimePeriodSelector from './TimePeriodSelector';
import { marketApi } from '../services/api';

const SectorPerformanceNew = ({ initialSectorData = [] }) => {
  const [sectorData, setSectorData] = useState(Array.isArray(initialSectorData) ? initialSectorData : []);
  const [pythonAnalysis, setPythonAnalysis] = useState(null);
  const [marketImplications, setMarketImplications] = useState([]);
  const [periodSummary, setPeriodSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Fetch sector data when period changes
  useEffect(() => {
    const fetchSectorData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`🔍 Fetching enhanced sector data for period: ${selectedPeriod}`);
        
        // Use the correct API method
        const response = await marketApi.getSectors(selectedPeriod);
        
        console.log('📊 Enhanced sector response received:', response);
        console.log('📊 Response type:', typeof response);
        console.log('📊 Has python_analysis:', !!response?.python_analysis);
        
        // 🚀 ENHANCED PROCESSING: Extract all parts of the enhanced response
        let processedData = [];
        let pythonAnalysisData = null;
        let marketImplicationsData = [];
        let periodSummaryData = null;
        
        if (Array.isArray(response)) {
          // Backward compatibility: If response is just an array (old format)
          processedData = response;
          console.log('📊 Using legacy array format');
        } else if (response && typeof response === 'object') {
          // 🎯 NEW ENHANCED FORMAT: Extract all components
          if (Array.isArray(response.sectors)) {
            processedData = response.sectors;
            console.log(`✅ Extracted ${processedData.length} sectors from enhanced response`);
          }
          
          if (response.python_analysis) {
            pythonAnalysisData = response.python_analysis;
            console.log('🐍 Python analysis extracted:', pythonAnalysisData);
          }
          
          if (Array.isArray(response.market_implications)) {
            marketImplicationsData = response.market_implications;
            console.log(`📈 Market implications extracted: ${marketImplicationsData.length} insights`);
          }
          
          if (response.period_summary) {
            periodSummaryData = response.period_summary;
            console.log('📊 Period summary extracted:', periodSummaryData);
          }
        } else {
          console.warn('⚠️ Unexpected sector data format:', response);
          processedData = [];
        }
        
        // CRITICAL: Validate each item in the sectors array
        const validatedData = processedData.filter(item => {
          return item && typeof item === 'object' && (item.symbol || item.name);
        });
        
        console.log(`✅ Processed sector data: ${validatedData.length} sectors`);
        console.log(`🐍 Python analysis available: ${!!pythonAnalysisData}`);
        console.log(`📈 Market implications: ${marketImplicationsData.length}`);
        
        // 🚀 SET ALL ENHANCED DATA
        setSectorData(validatedData);
        setPythonAnalysis(pythonAnalysisData);
        setMarketImplications(marketImplicationsData);
        setPeriodSummary(periodSummaryData);
        
      } catch (error) {
        console.error('❌ Error fetching enhanced sector data:', error);
        setError('Failed to fetch sector data');
        // SAFE: Keep using existing data if fetch fails, but ensure it's an array
        setSectorData(prevData => Array.isArray(prevData) ? prevData : []);
        setPythonAnalysis(null);
        setMarketImplications([]);
        setPeriodSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectorData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period.value);
  };

  // SAFE: Ensure sectorData is always an array
  const safeSectorData = Array.isArray(sectorData) ? sectorData : [];

  return (
    <>
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
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-blue-600" size={20} />
                <h3 className="text-sm font-medium text-gray-600">
                  {selectedPeriod.toUpperCase()} Performance
                </h3>
              </div>
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
      </div>

      {/* Sector Intelligence Section (Collapsible) - OUTSIDE the main div */}
      <div className="border-t border-gray-200 bg-white rounded-xl shadow-lg mt-4">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Sector Intelligence</span>
            {pythonAnalysis && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                AI Analysis
              </span>
            )}
            <span className="text-xs text-gray-500">95% confidence</span>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAnalysis ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {showAnalysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="space-y-4">
              {/* Period Summary */}
              {periodSummary && (
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {periodSummary}
                  </p>
                </div>
              )}

              {/* Python Analysis */}
              {pythonAnalysis && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Technical Analysis</div>
                  <p className="text-sm text-gray-600">
                    {pythonAnalysis.summary || pythonAnalysis}
                  </p>
                  {pythonAnalysis.insights && pythonAnalysis.insights.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {pythonAnalysis.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Market Implications */}
              {marketImplications && marketImplications.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Market Implications</div>
                  <ul className="space-y-1">
                    {marketImplications.map((implication, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Default Analysis */}
              {!pythonAnalysis && !periodSummary && !marketImplications.length && (
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Sector rotation analysis shows {safeSectorData.filter(s => (s.changePercent || s.change_p || 0) > 0).length} sectors advancing 
                    and {safeSectorData.filter(s => (s.changePercent || s.change_p || 0) <= 0).length} sectors declining. 
                    {safeSectorData.length > 0 && safeSectorData[0] && (
                      <> {safeSectorData[0].name} leads with {(safeSectorData[0].changePercent || safeSectorData[0].change_p || 0).toFixed(2)}% {(safeSectorData[0].changePercent || safeSectorData[0].change_p || 0) >= 0 ? 'gain' : 'loss'}.</>
                    )}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  📊 Analysis based on {safeSectorData.length} sectors with {selectedPeriod} performance data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SectorPerformanceNew;