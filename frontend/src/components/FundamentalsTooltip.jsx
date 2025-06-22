/**
 * Custom tooltip for fundamentals charts
 */
const FundamentalsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{data.period ? new Date(data.period).toLocaleDateString() : ''}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          {data.revenue && (
            <>
              <p className="text-gray-600">Revenue:</p>
              <p className="font-semibold">${data.revenueFormatted}</p>
            </>
          )}
          {data.netIncome !== undefined && data.netIncome !== null && (
            <>
              <p className="text-gray-600">Net Income:</p>
              <p className={`font-semibold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${data.netIncomeFormatted}
              </p>
            </>
          )}
          {data.revenueGrowth !== undefined && data.revenueGrowth !== null && typeof data.revenueGrowth === 'number' && (
            <>
              <p className="text-gray-600">Growth YoY:</p>
              <p className={`font-semibold ${data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.revenueGrowth.toFixed(1)}%
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};