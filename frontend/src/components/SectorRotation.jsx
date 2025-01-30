import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';

const SectorRotation = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/market/sector-rotation');
                const data = await response.json();
                setAnalysis(data);
                setError(null);
            } catch (err) {
                setError(err.message);
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
    if (!analysis) return null;

    const leaders = analysis.sectors.slice(0, 3);
    const laggards = analysis.sectors.slice(-3);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Market Cycle Analysis</h2>
                <div className="text-gray-600">{analysis.interpretation}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3">Sector Leadership</h3>
                    <div className="space-y-4">
                        {leaders.map((sector, index) => (
                            <div key={sector.symbol} className="flex justify-between items-center">
                                <span className="text-gray-700">{sector.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={sector.change_p >= 0 ? "text-green-500" : "text-red-500"}>
                                        {sector.change_p.toFixed(2)}%
                                    </span>
                                    {sector.change_p >= 0 ? (
                                        <ArrowUp className="text-green-500" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-500" size={16} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3">Sector Laggards</h3>
                    <div className="space-y-4">
                        {laggards.map((sector, index) => (
                            <div key={sector.symbol} className="flex justify-between items-center">
                                <span className="text-gray-700">{sector.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={sector.change_p >= 0 ? "text-green-500" : "text-red-500"}>
                                        {sector.change_p.toFixed(2)}%
                                    </span>
                                    {sector.change_p >= 0 ? (
                                        <ArrowUp className="text-green-500" size={16} />
                                    ) : (
                                        <ArrowDown className="text-red-500" size={16} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectorRotation;