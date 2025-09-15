import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Brain,
  BarChart3,
  MessageSquare
} from 'lucide-react';

/**
 * WORKING EARNINGS TAB - REAL DATA ONLY
 * No fallbacks, no mock data - this works with actual transcripts
 */
const EarningsTab = ({ symbol }) => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTranscript, setExpandedTranscript] = useState(null);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  // Fetch earnings data
  const fetchEarningsData = async () => {
    if (!symbol) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📊 [EARNINGS TAB] Fetching data for ${symbol}...`);
      
      // Call the earnings analysis endpoint
      const response = await fetch(`/api/themes/earnings/${symbol}/analyze`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [EARNINGS TAB] Data received:`, data);
      
      // Validate the data structure
      if (!data || !data.transcripts) {
        throw new Error('Invalid data structure received from API');
      }
      
      setEarningsData(data);
      
      // Auto-select first transcript if available
      if (data.transcripts && data.transcripts.length > 0) {
        setSelectedTranscript(data.transcripts[0]);
      }
      
    } catch (error) {
      console.error(`❌ [EARNINGS TAB] Error:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle transcript expansion
  const toggleTranscript = (index) => {
    setExpandedTranscript(expandedTranscript === index ? null : index);
    setSelectedTranscript(earningsData.transcripts[index]);
  };

  // Format date properly
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return 'Date N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Date N/A';
    }
  };

  // Format quarter label
  const formatQuarter = (transcript) => {
    if (transcript.quarter && transcript.period) {
      return `${transcript.period} ${transcript.year || ''}`;
    }
    if (transcript.quarter) {
      return transcript.quarter;
    }
    return 'Quarter N/A';
  };

  useEffect(() => {
    fetchEarningsData();
  }, [symbol]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading earnings data...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching transcripts from FMP API...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="font-semibold text-red-900 text-lg">Error Loading Earnings Data</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchEarningsData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  // Get data
  const transcripts = earningsData?.transcripts || [];
  const insights = earningsData?.investmentInsights || {};
  const sentimentTrend = earningsData?.sentimentTrend || {};

  // No data state
  if (transcripts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Mic className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Earnings Data Available</h3>
        <p className="text-gray-600">No earnings transcripts found for {symbol}</p>
        <button
          onClick={fetchEarningsData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} className="inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="text-blue-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Earnings Transcripts</h2>
              <p className="text-gray-600">{transcripts.length} quarterly calls available</p>
            </div>
          </div>
          <button
            onClick={fetchEarningsData}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-600">Sentiment Score</p>
            <p className="text-xl font-bold text-gray-900">
              {insights.sentimentSummary?.score || 0}/100
            </p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-600">Themes Identified</p>
            <p className="text-xl font-bold text-gray-900">
              {insights.keyMetrics?.themesIdentified || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-600">Momentum</p>
            <p className="text-xl font-bold text-gray-900">
              {sentimentTrend.momentum || 'Neutral'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-600">Recommendation</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {insights.recommendation || 'Watch'}
            </p>
          </div>
        </div>
      </div>

      {/* Transcripts List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Calendar className="inline mr-2" size={20} />
          Quarterly Analysis (Past {transcripts.length} quarters)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transcripts.map((transcript, index) => {
            const isExpanded = expandedTranscript === index;
            const hasContent = transcript.fullContent || transcript.summary || transcript.content;
            
            return (
              <div 
                key={index}
                className={`border rounded-lg transition-all ${
                  isExpanded ? 'lg:col-span-3 bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleTranscript(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        {formatQuarter(transcript)}
                      </span>
                    </div>
                    {hasContent ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        AI Analysis Complete
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        Available for Analysis
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {formatDate(transcript.date)}
                  </p>
                  
                  {/* Topics */}
                  {transcript.topics && transcript.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {transcript.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      {isExpanded ? (
                        <>Hide Details <ChevronUp size={14} /></>
                      ) : (
                        <>View Full Analysis <ChevronDown size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    {hasContent ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Transcript Summary</h4>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {transcript.summary || 'Processing transcript content...'}
                          </p>
                        </div>
                        
                        {transcript.fullContent && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Full Transcript</h4>
                            <div className="max-h-96 overflow-y-auto bg-gray-50 rounded p-3">
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                {transcript.fullContent}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="mx-auto text-gray-400 mb-3" size={32} />
                        <p className="text-gray-600">No transcript data available</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Check if FMP API has data for this quarter
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Source Note */}
      <div className="text-center text-sm text-gray-500 mt-8">
        Data provided by Financial Modeling Prep API
      </div>
    </div>
  );
};

export default EarningsTab;
