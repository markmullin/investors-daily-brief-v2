import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { marketApi } from '../services/api';

const SectorRotation = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Use the marketApi service instead of direct fetch
                const data = await marketApi.getSectorRotation();
                setAnalysis(data);
                setError(null);
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

    if (loading) return <div className="animate-pulse">Loading sector analysis...</div>;
    if (error) return (
        <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            <span className="text-red-700">{error}</span>
        </div>
    );
    if (!analysis) return (
        <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-center text-gray-500">Sector rotation data unavailable</p>
        </div>
    );

    // Safe access to analysis data
    const sectors = analysis?.sectors || [];
    const leaders = sectors.slice(0, Math.min(3, sectors.length));
    const laggards = sectors.slice(-Math.min(3, sectors.length));

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Market Cycle Analysis</h2>
                <div className="space-y-4">
                    <div className="text-lg font-semibold text-blue-600">
                        {analysis?.marketPhase || 'Phase data unavailable'}
                    </div>
                    <div className="text-gray-600">
                        {analysis?.interpretation?.phase || 'Interpretation unavailable'}
                    </div>
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Actionable Insights:</h3>
                        <ul className="list-disc list-inside space-y-2">
                            {(analysis?.interpretation?.actionItems || []).map((item, index) => (
                                <li key={index} className="text-gray-600">{item}</li>
                            ))}
                            {(!analysis?.interpretation?.actionItems || analysis.interpretation.actionItems.length === 0) && (
                                <li className="text-gray-600">No actionable insights available at this time.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3">Sector Leadership</h3>
                    <div className="space-y-4">
                        {leaders.length > 0 ? leaders.map((sector) => (
                            <div key={sector.symbol || index} className="flex justify-between items-center">
                                <span className="text-gray-700">{sector.name || 'Unknown'}</span>
                                <div className="flex items-center gap-2">
                                    <span className={(sector.change_p || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                                        {(sector.change_p || 0).toFixed(2)}%
                                    </span>
                                    {(sector.change_p || 0) >= 0 ? (
                                        <ArrowUp className="text-green-500" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-500" size={16} />
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-500 text-center">No sector leadership data available</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3">Sector Laggards</h3>
                    <div className="space-y-4">
                        {laggards.length > 0 ? laggards.map((sector) => (
                            <div key={sector.symbol || index} className="flex justify-between items-center">
                                <span className="text-gray-700">{sector.name || 'Unknown'}</span>
                                <div className="flex items-center gap-2">
                                    <span className={(sector.change_p || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                                        {(sector.change_p || 0).toFixed(2)}%
                                    </span>
                                    {(sector.change_p || 0) >= 0 ? (
                                        <ArrowUp className="text-green-500" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-500" size={16} />
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-500 text-center">No sector laggards data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectorRotation;