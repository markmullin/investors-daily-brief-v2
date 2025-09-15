import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Calculator, Upload, Activity, Zap } from 'lucide-react';

const MonteCarloSimulation = ({ portfolioData, initialValue = 100000, timeHorizon = 10, goalAmount = 200000 }) => {
  const [simulationResults, setSimulationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('median');

  // Real Monte Carlo calculation - ONLY works with actual portfolio data
  const calculateMonteCarlo = useMemo(() => {
    // FIXED: Check for holdings as object, not array
    const hasHoldings = portfolioData?.holdings && Object.keys(portfolioData.holdings).length > 0;
    if (!hasHoldings) return null;

    return async () => {
      setIsCalculating(true);
      
      setTimeout(() => {
        // FIXED: Convert holdings object to array for processing
        const holdingsArray = Object.values(portfolioData.holdings);
        
        // Calculate portfolio composition-based returns and volatility
        const calculatePortfolioStats = (holdings) => {
          // Analyze actual portfolio composition
          let totalValue = 0;
          let techWeight = 0;
          let financialWeight = 0;
          let healthcareWeight = 0;
          let bondWeight = 0;
          let etfWeight = 0;
          
          // Calculate actual position weights from real holdings
          holdings.forEach(holding => {
            const value = (holding.shares || holding.quantity || 0) * (holding.currentPrice || holding.price || 100);
            totalValue += value;
            
            const symbol = holding.symbol?.toUpperCase() || '';
            
            // Categorize by actual symbols in portfolio
            if (symbol.match(/^(AAPL|MSFT|GOOGL|GOOG|AMZN|TSLA|NVDA|META|CRM|ADBE|NFLX|AMD)/)) {
              techWeight += value;
            } else if (symbol.match(/^(JPM|BAC|WFC|GS|MS|C|AXP|BRK|V|MA)/)) {
              financialWeight += value;
            } else if (symbol.match(/^(JNJ|PFE|UNH|MRK|ABBV|TMO|LLY|BMY|AMGN)/)) {
              healthcareWeight += value;
            } else if (symbol.match(/^(TLT|AGG|BND|IEF|SHY|LQD|HYG|TIP)/)) {
              bondWeight += value;
            } else if (symbol.match(/^(SPY|QQQ|IWM|VTI|VOO|IVV|VEA|VWO|EEM)/)) {
              etfWeight += value;
            }
          });
          
          // Convert to percentages
          if (totalValue > 0) {
            techWeight = techWeight / totalValue;
            financialWeight = financialWeight / totalValue;
            healthcareWeight = healthcareWeight / totalValue;
            bondWeight = bondWeight / totalValue;
            etfWeight = etfWeight / totalValue;
          }
          
          // Calculate expected return and volatility based on actual allocation
          let expectedReturn = 0.07; // Base market return
          let volatility = 0.15; // Base market volatility
          
          // Adjust based on actual portfolio composition
          expectedReturn += (techWeight * 0.03); // Tech premium
          expectedReturn += (financialWeight * 0.02); // Financial premium
          expectedReturn += (healthcareWeight * 0.01); // Healthcare premium
          expectedReturn -= (bondWeight * 0.04); // Bond discount
          expectedReturn += (etfWeight * 0.001); // ETF slight premium
          
          volatility += (techWeight * 0.08); // Tech volatility
          volatility += (financialWeight * 0.03); // Financial volatility
          volatility += (healthcareWeight * 0.02); // Healthcare volatility
          volatility -= (bondWeight * 0.08); // Bond stability
          volatility -= (etfWeight * 0.02); // ETF diversification
          
          return {
            expectedReturn: Math.max(0.02, Math.min(0.18, expectedReturn)), // Cap between 2-18%
            volatility: Math.max(0.05, Math.min(0.35, volatility)), // Cap between 5-35%
            composition: {
              tech: techWeight,
              financial: financialWeight,
              healthcare: healthcareWeight,
              bonds: bondWeight,
              etfs: etfWeight,
              other: 1 - (techWeight + financialWeight + healthcareWeight + bondWeight + etfWeight)
            }
          };
        };

        const portfolioStats = calculatePortfolioStats(holdingsArray);
        const { expectedReturn, volatility } = portfolioStats;

        // Box-Muller transform for generating normal distribution
        const boxMullerTransform = () => {
          let u = 0, v = 0;
          while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
          while(v === 0) v = Math.random();
          return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };

        // Generate 10,000 Monte Carlo scenarios
        const numSimulations = 10000;
        const scenarios = [];
        const finalValues = [];

        for (let sim = 0; sim < numSimulations; sim++) {
          const scenario = [];
          let currentValue = initialValue;
          
          for (let year = 0; year <= timeHorizon; year++) {
            if (year === 0) {
              scenario.push({
                year: year,
                value: currentValue,
                cumulativeReturn: 0
              });
            } else {
              // Generate random annual return using normal distribution
              const randomReturn = expectedReturn + (volatility * boxMullerTransform());
              currentValue *= (1 + randomReturn);
              
              scenario.push({
                year: year,
                value: currentValue,
                cumulativeReturn: ((currentValue - initialValue) / initialValue) * 100,
                annualReturn: randomReturn * 100
              });
            }
          }
          
          scenarios.push(scenario);
          finalValues.push(currentValue);
        }

        // Calculate percentiles
        finalValues.sort((a, b) => a - b);
        const percentiles = {
          p5: finalValues[Math.floor(0.05 * numSimulations)],
          p10: finalValues[Math.floor(0.10 * numSimulations)],
          p25: finalValues[Math.floor(0.25 * numSimulations)],
          p50: finalValues[Math.floor(0.50 * numSimulations)],
          p75: finalValues[Math.floor(0.75 * numSimulations)],
          p90: finalValues[Math.floor(0.90 * numSimulations)],
          p95: finalValues[Math.floor(0.95 * numSimulations)]
        };

        // Calculate goal achievement probability
        const goalAchievers = finalValues.filter(value => value >= goalAmount).length;
        const goalProbability = (goalAchievers / numSimulations) * 100;

        // Calculate expected shortfall (average of worst 5% scenarios)
        const worstScenarios = finalValues.slice(0, Math.floor(0.05 * numSimulations));
        const expectedShortfall = worstScenarios.reduce((sum, val) => sum + val, 0) / worstScenarios.length;

        // Prepare chart data with confidence bands
        const chartData = [];
        for (let year = 0; year <= timeHorizon; year++) {
          const yearValues = scenarios.map(s => s[year].value).sort((a, b) => a - b);
          chartData.push({
            year: year,
            p5: yearValues[Math.floor(0.05 * numSimulations)],
            p25: yearValues[Math.floor(0.25 * numSimulations)],
            p50: yearValues[Math.floor(0.50 * numSimulations)],
            p75: yearValues[Math.floor(0.75 * numSimulations)],
            p95: yearValues[Math.floor(0.95 * numSimulations)],
            mean: yearValues.reduce((sum, val) => sum + val, 0) / numSimulations
          });
        }

        // Statistical analysis
        const mean = finalValues.reduce((sum, val) => sum + val, 0) / numSimulations;
        const variance = finalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numSimulations;
        const standardDeviation = Math.sqrt(variance);
        const skewness = calculateSkewness(finalValues, mean, standardDeviation);
        const kurtosis = calculateKurtosis(finalValues, mean, standardDeviation);

        // Distribution analysis
        const distributionBuckets = 20;
        const bucketSize = (finalValues[finalValues.length - 1] - finalValues[0]) / distributionBuckets;
        const distribution = [];
        
        for (let i = 0; i < distributionBuckets; i++) {
          const bucketMin = finalValues[0] + (i * bucketSize);
          const bucketMax = bucketMin + bucketSize;
          const count = finalValues.filter(val => val >= bucketMin && val < bucketMax).length;
          
          distribution.push({
            range: `$${(bucketMin / 1000).toFixed(0)}K`,
            count: count,
            probability: (count / numSimulations) * 100,
            midpoint: bucketMin + (bucketSize / 2)
          });
        }

        setSimulationResults({
          scenarios: scenarios.slice(0, 100), // Store first 100 for visualization
          chartData,
          percentiles,
          goalProbability,
          expectedShortfall,
          statistics: {
            mean,
            standardDeviation,
            skewness,
            kurtosis,
            expectedReturn: expectedReturn * 100,
            volatility: volatility * 100
          },
          distribution,
          portfolioStats,
          numSimulations,
          initialValue,
          goalAmount,
          timeHorizon
        });
        
        setIsCalculating(false);
      }, 2000); // Longer calculation time for realism
    };
  }, [portfolioData, initialValue, timeHorizon, goalAmount]);

  // Helper functions for statistical calculations
  const calculateSkewness = (values, mean, stdDev) => {
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  };

  const calculateKurtosis = (values, mean, stdDev) => {
    const n = values.length;
    const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  };

  useEffect(() => {
    if (calculateMonteCarlo) {
      calculateMonteCarlo();
    }
  }, [calculateMonteCarlo]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isCalculating) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Running Monte Carlo Simulation</h3>
              <p className="text-gray-600">Analyzing 10,000+ scenarios based on your portfolio composition...</p>
              <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  Using Box-Muller transform for statistical accuracy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show premium portfolio upload prompt when no data - FIXED validation
  if (!portfolioData?.holdings || Object.keys(portfolioData.holdings).length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl shadow-lg border border-blue-200 overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id="monte-carlo-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="6" cy="6" r="1" fill="#3B82F6"/>
                  <circle cx="3" cy="3" r="0.5" fill="#1D4ED8"/>
                  <circle cx="9" cy="9" r="0.5" fill="#1D4ED8"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#monte-carlo-grid)" />
            </svg>
          </div>
          
          <div className="relative p-12 text-center">
            {/* Premium Header */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Monte Carlo Simulation</h2>
              <p className="text-xl text-gray-600 mb-2">10,000+ scenario analysis for financial goal planning</p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                <Activity className="w-4 h-4 mr-2" />
                Statistical Distribution Analysis
              </div>
            </div>

            {/* Professional Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-300 mb-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Portfolio Data Required</h3>
                  <p className="text-gray-700 text-lg mb-4 max-w-md">
                    Upload your portfolio CSV to run Monte Carlo simulations based on your actual asset allocation and risk profile
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ 10,000+ scenarios using Box-Muller transformation</p>
                    <p>✓ Goal achievement probability analysis</p>
                    <p>✓ Confidence intervals and risk assessment</p>
                    <p>✓ Portfolio composition-based return modeling</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-blue-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-blue-900 text-lg mb-2">Scenario Analysis</h4>
                <p className="text-blue-800 text-sm">10,000+ scenarios with confidence intervals</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                <div className="text-indigo-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h4 className="font-bold text-indigo-900 text-lg mb-2">Goal Planning</h4>
                <p className="text-indigo-800 text-sm">Achievement probability analysis</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="text-purple-600 mb-4">
                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-purple-900 text-lg mb-2">Risk Assessment</h4>
                <p className="text-purple-800 text-sm">Statistical distribution modeling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!simulationResults) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center py-8">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Monte Carlo Simulation</h3>
          <p className="text-gray-600 mb-6 text-lg">Analyze 10,000+ scenarios for your financial goals</p>
          {calculateMonteCarlo && (
            <button
              onClick={calculateMonteCarlo}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Run Simulation
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Data Source Confirmation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-emerald-900 font-bold text-lg">
              Real Portfolio Monte Carlo • {Object.keys(portfolioData.holdings).length} Holdings
            </p>
            <p className="text-emerald-800 text-sm">
              Expected Return: {simulationResults.statistics.expectedReturn.toFixed(1)}% | 
              Volatility: {simulationResults.statistics.volatility.toFixed(1)}% | 
              {simulationResults.numSimulations.toLocaleString()} scenarios
            </p>
          </div>
        </div>
      </div>

      {/* Summary Results */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Target className="w-7 h-7 mr-3 text-blue-600" />
          Simulation Results Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-xl shadow-lg">
            <h4 className="font-bold text-blue-900 text-lg mb-2">Goal Achievement</h4>
            <div className="text-3xl font-black text-blue-700 mb-2">
              {simulationResults.goalProbability.toFixed(1)}%
            </div>
            <p className="text-blue-600 text-sm leading-relaxed">
              Probability of reaching {formatCurrency(simulationResults.goalAmount)} 
              in {simulationResults.timeHorizon} years
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-xl shadow-lg">
            <h4 className="font-bold text-green-900 text-lg mb-2">Expected Value</h4>
            <div className="text-3xl font-black text-green-700 mb-2">
              {formatCurrency(simulationResults.percentiles.p50)}
            </div>
            <p className="text-green-600 text-sm leading-relaxed">
              Median portfolio value after {simulationResults.timeHorizon} years
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-xl shadow-lg">
            <h4 className="font-bold text-purple-900 text-lg mb-2">Best Case (95%)</h4>
            <div className="text-3xl font-black text-purple-700 mb-2">
              {formatCurrency(simulationResults.percentiles.p95)}
            </div>
            <p className="text-purple-600 text-sm leading-relaxed">
              95th percentile outcome
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-xl shadow-lg">
            <h4 className="font-bold text-orange-900 text-lg mb-2">Worst Case (5%)</h4>
            <div className="text-3xl font-black text-orange-700 mb-2">
              {formatCurrency(simulationResults.percentiles.p5)}
            </div>
            <p className="text-orange-600 text-sm leading-relaxed">
              5th percentile outcome
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h4 className="font-bold text-gray-900 mb-6 text-xl">Portfolio Growth Projections</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationResults.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(year) => `Year ${year}`}
                contentStyle={{
                  backgroundColor: '#F8FAFC',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontWeight: 600
                }}
              />
              
              {/* Confidence Bands */}
              <Area
                type="monotone"
                dataKey="p95"
                fill="url(#blueGradient)"
                fillOpacity={0.1}
                stroke="none"
              />
              <Area
                type="monotone"
                dataKey="p75"
                fill="url(#blueGradient)"
                fillOpacity={0.2}
                stroke="none"
              />
              <Area
                type="monotone"
                dataKey="p25"
                fill="url(#blueGradient)"
                fillOpacity={0.2}
                stroke="none"
              />
              <Area
                type="monotone"
                dataKey="p5"
                fill="url(#blueGradient)"
                fillOpacity={0.1}
                stroke="none"
              />
              
              {/* Key Lines */}
              <Line 
                type="monotone" 
                dataKey="p50" 
                stroke="#3B82F6" 
                strokeWidth={4}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                name="Median (50%)"
              />
              <Line 
                type="monotone" 
                dataKey="p95" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="95th Percentile"
              />
              <Line 
                type="monotone" 
                dataKey="p5" 
                stroke="#EF4444" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="5th Percentile"
              />
              
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#DBEAFE" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-8 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>Median (50%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-green-600 rounded-full" style={{ borderStyle: 'dashed' }}></div>
            <span>95th Percentile</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-red-600 rounded-full" style={{ borderStyle: 'dashed' }}></div>
            <span>5th Percentile</span>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="font-bold text-blue-900">Shaded Area: Confidence Bands</span>
          </div>
        </div>
      </div>

      {/* Statistical Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h4 className="font-bold text-gray-900 mb-6 text-xl">Statistical Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-gray-600 font-medium block text-sm">Mean</span>
            <div className="font-bold text-lg text-gray-900">{formatCurrency(simulationResults.statistics.mean)}</div>
          </div>
          <div>
            <span className="text-gray-600 font-medium block text-sm">Std Deviation</span>
            <div className="font-bold text-lg text-gray-900">{formatCurrency(simulationResults.statistics.standardDeviation)}</div>
          </div>
          <div>
            <span className="text-gray-600 font-medium block text-sm">Skewness</span>
            <div className="font-bold text-lg text-gray-900">{simulationResults.statistics.skewness.toFixed(3)}</div>
          </div>
          <div>
            <span className="text-gray-600 font-medium block text-sm">Kurtosis</span>
            <div className="font-bold text-lg text-gray-900">{simulationResults.statistics.kurtosis.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* Portfolio Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-xl mb-3">Monte Carlo Insights</h4>
            <p className="text-blue-800 mb-4 text-lg leading-relaxed">
              Based on {simulationResults.numSimulations.toLocaleString()} scenarios using your actual portfolio composition, 
              there's a <span className="font-bold">{simulationResults.goalProbability.toFixed(1)}%</span> chance of reaching your 
              goal of {formatCurrency(simulationResults.goalAmount)} within {simulationResults.timeHorizon} years.
            </p>
            
            {simulationResults.goalProbability < 70 && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-3">
                <p className="text-orange-800 font-semibold">
                  ⚠️ Goal probability below 70% - consider increasing contributions or adjusting time horizon.
                </p>
              </div>
            )}
            
            {simulationResults.statistics.skewness > 0.5 && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-3">
                <p className="text-green-800 font-semibold">
                  📈 Positive skewness detected - portfolio positioned for potential upside opportunities.
                </p>
              </div>
            )}
            
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <p className="text-blue-800 font-semibold">
                💡 Portfolio expected return: {simulationResults.statistics.expectedReturn.toFixed(1)}% with 
                {simulationResults.statistics.volatility.toFixed(1)}% volatility based on your current allocation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloSimulation;