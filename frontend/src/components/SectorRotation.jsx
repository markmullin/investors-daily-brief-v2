import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { marketApi } from '../services/api';

// TypewriterText component for AI analysis
const TypewriterText = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else {
      onComplete && onComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {displayedText}
      <span className="animate-pulse text-blue-500">|</span>
    </div>
  );
};

const SectorRotation = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Use the marketApi service instead of direct fetch
                const data = await marketApi.getSectorRotation();
                setAnalysis(data);
                setError(null);
                setIsTypewriterComplete(false); // Reset typewriter state
            } catch (err) {
                console.error('Error fetching sector rotation:', err);
                setError(err?.message || 'Failed to load sector rotation data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
        const interval = setInterval(fetchAnalysis, 300000); // Update every 5 minutes
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="animate-pulse">Loading AI sector analysis...</div>;
    if (error) return (
        <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            <span className="text-red-700">{error}</span>
        </div>
    );
    if (!analysis) return (
        <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-center text-gray-500">AI sector rotation analysis unavailable</p>
        </div>
    );

    // Safe access to analysis data
    const sectors = analysis?.sectors || [];
    const leaders = sectors.slice(0, Math.min(3, sectors.length));
    const laggards = sectors.slice(-Math.min(3, sectors.length));

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                        <ArrowUp className="w-5 h-5 text-white" />
                    </div>
                    AI Market Cycle Analysis
                </h2>
                <div className="space-y-4">
                    <div className="text-lg font-semibold text-blue-600">
                        {analysis?.marketPhase || 'Phase data unavailable'}
                    </div>
                    
                    {/* AI Analysis with Typewriter Effect */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-gray-700 leading-relaxed">
                            {analysis?.interpretation?.phase ? (
                                <TypewriterText 
                                    text={analysis.interpretation.phase}
                                    speed={25}
                                    onComplete={() => setIsTypewriterComplete(true)}
                                />
                            ) : (
                                'AI interpretation unavailable'
                            )}
                        </div>
                    </div>
                    
                    {/* Actionable Insights with fade-in after typewriter completes */}
                    {isTypewriterComplete && (
                        <div className="mt-4 animate-fade-in">
                            <h3 className="font-semibold mb-2 text-gray-800">🎯 Actionable Insights:</h3>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <ul className="list-disc list-inside space-y-2">
                                    {(analysis?.interpretation?.actionItems || []).map((item, index) => (
                                        <li key={index} className="text-gray-600 leading-relaxed">{item}</li>
                                    ))}
                                    {(!analysis?.interpretation?.actionItems || analysis.interpretation.actionItems.length === 0) && (
                                        <li className="text-gray-500 italic">No actionable insights available at this time.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                        <ArrowUp className="w-4 h-4" />
                        Sector Leadership
                    </h3>
                    <div className="space-y-4">
                        {leaders.length > 0 ? leaders.map((sector, index) => (
                            <div key={sector.symbol || index} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                                <span className="text-gray-700 font-medium">{sector.name || 'Unknown'}</span>
                                <div className="flex items-center gap-2">
                                    <span className={(sector.change_p || 0) >= 0 ? "text-green-600 font-semibold" : "text-red-500"}>
                                        {(sector.change_p || 0).toFixed(2)}%
                                    </span>
                                    {(sector.change_p || 0) >= 0 ? (
                                        <ArrowUp className="text-green-600" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-500" size={16} />
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-500 text-center py-4">No sector leadership data available</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3 text-red-700 flex items-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        Sector Laggards
                    </h3>
                    <div className="space-y-4">
                        {laggards.length > 0 ? laggards.map((sector, index) => (
                            <div key={sector.symbol || index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                                <span className="text-gray-700 font-medium">{sector.name || 'Unknown'}</span>
                                <div className="flex items-center gap-2">
                                    <span className={(sector.change_p || 0) >= 0 ? "text-green-500" : "text-red-600 font-semibold"}>
                                        {(sector.change_p || 0).toFixed(2)}%
                                    </span>
                                    {(sector.change_p || 0) >= 0 ? (
                                        <ArrowUp className="text-green-500" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-600" size={16} />
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-500 text-center py-4">No sector laggards data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer with refresh button */}
            {isTypewriterComplete && (
                <div className="flex items-center justify-between text-sm text-gray-500 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Live AI sector analysis • Market cycle detection • Actionable insights</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                        Refresh Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default SectorRotation;