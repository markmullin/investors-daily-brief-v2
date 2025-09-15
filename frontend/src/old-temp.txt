import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, AlertCircle, TrendingUp } from 'lucide-react';

function App() {
  const [marketData, setMarketData] = useState({});
  const [macroData, setMacroData] = useState({});
  const [marketMover, setMarketMover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketResponse, macroResponse, moverResponse] = await Promise.all([
          fetch('http://localhost:5000/api/market-data'),
          fetch('http://localhost:5000/api/macro-data'),
          fetch('http://localhost:5000/api/market-mover')
        ]);

        const market = await marketResponse.json();
        const macro = await macroResponse.json();
        const mover = await moverResponse.json();
        
        setMarketData(market);
        setMacroData(macro);
        setMarketMover(mover);
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Market Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="space-y-8">
        {marketMover && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <TrendingUp className="text-blue-500" />
              Top Market Mover
            </h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">{marketMover.symbol}</h3>
                  <p className="text-2xl font-bold">${Number(marketMover.price).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Number(marketMover.changePercent) >= 0 ? (
                      <ArrowUp className="text-green-500" size={20} />
                    ) : (
                      <ArrowDown className="text-red-500" size={20} />
                    )}
                    <span className={Number(marketMover.changePercent) >= 0 ? "text-green-500" : "text-red-500"}>
                      {Number(marketMover.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="max-w-lg">
                  <p className="text-gray-600">{marketMover.reason}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Macroeconomic Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2">10Y Treasury Yield</h3>
              <p className="text-2xl font-bold">
                {macroData.treasury10Y?.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2">US Dollar (UUP)</h3>
              <p className="text-2xl font-bold">${macroData.usdIndex?.price.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2">
                {macroData.usdIndex?.change >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span className={macroData.usdIndex?.change >= 0 ? "text-green-500" : "text-red-500"}>
                  {macroData.usdIndex?.change.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2">Bitcoin ETF (IBIT)</h3>
              <p className="text-2xl font-bold">${macroData.bitcoin?.price.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2">
                {macroData.bitcoin?.change >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span className={macroData.bitcoin?.change >= 0 ? "text-green-500" : "text-red-500"}>
                  {macroData.bitcoin?.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(marketData).map(([symbol, data]) => (
              <div key={symbol} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-600 mb-2">{symbol}</h3>
                <p className="text-2xl font-bold">${data.close?.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {data.change_p >= 0 ? (
                    <ArrowUp className="text-green-500" size={20} />
                  ) : (
                    <ArrowDown className="text-red-500" size={20} />
                  )}
                  <span className={data.change_p >= 0 ? "text-green-500" : "text-red-500"}>
                    {data.change_p?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;