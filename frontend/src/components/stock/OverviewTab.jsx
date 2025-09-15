import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  AlertTriangle, 
  Info,
  Building,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { marketApi } from '../../services/api';
import StockPriceCharts from './StockPriceCharts';

/**
 * Time Period Selector Component (Inline)
 */
const TimePeriodSelector = ({ selectedPeriod, onPeriodChange, className = '' }) => {
  const periods = [
    { label: '1D', value: '1d', days: 1 },
    { label: '5D', value: '5d', days: 5 },
    { label: '1M', value: '1m', days: 30 },
    { label: '3M', value: '3m', days: 90 },
    { label: '6M', value: '6m', days: 180 },
    { label: '1Y', value: '1y', days: 365 },
    { label: '5Y', value: '5y', days: 1825 }
  ];

  return (
    <div className={`flex gap-1 bg-white rounded-lg p-1 border border-gray-200 ${className}`}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1 text-sm rounded-md transition-all duration-200 font-medium ${
            selectedPeriod === period.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Circular Progress Score Component
 */
const CircularProgressScore = ({ 
  title, 
  score, 
  description, 
  color = "blue",
  icon: Icon 
}) => {
  const getColorClasses = (colorName) => {
    const colors = {
      blue: {
        bg: "text-blue-600",
        stroke: "stroke-blue-600",
        fill: "fill-blue-100"
      },
      green: {
        bg: "text-green-600", 
        stroke: "stroke-green-600",
        fill: "fill-green-100"
      },
      yellow: {
        bg: "text-yellow-600",
        stroke: "stroke-yellow-600", 
        fill: "fill-yellow-100"
      },
      red: {
        bg: "text-red-600",
        stroke: "stroke-red-600",
        fill: "fill-red-100"
      }
    };
    return colors[colorName] || colors.blue;
  };

  const colorClass = getColorClasses(color);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className={colorClass.bg} />}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{score}/100</div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="fill-none stroke-gray-200"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`fill-none ${colorClass.stroke}`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${colorClass.bg}`}>{score}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Investment Thesis Component
 */
const InvestmentThesis = ({ data, symbol }) => {
  const getBullishPoints = (fundamentals) => {
    const points = [];
    
    if (fundamentals?.roe && fundamentals.roe > 0.15) {
      points.push(`Strong ROE of ${(fundamentals.roe * 100).toFixed(1)}% indicates efficient use of shareholder capital`);
    }
    
    if (fundamentals?.profitMargin && fundamentals.profitMargin > 0.10) {
      points.push(`Healthy profit margin of ${(fundamentals.profitMargin * 100).toFixed(1)}% shows strong operational efficiency`);
    }
    
    if (fundamentals?.revenueGrowth && fundamentals.revenueGrowth > 0.05) {
      points.push(`Revenue growth of ${(fundamentals.revenueGrowth * 100).toFixed(1)}% demonstrates business expansion`);
    }
    
    if (fundamentals?.currentRatio && fundamentals.currentRatio > 1.5) {
      points.push(`Strong liquidity with current ratio of ${fundamentals.currentRatio.toFixed(2)}`);
    }
    
    if (fundamentals?.debtToEquity && fundamentals.debtToEquity < 0.5) {
      points.push(`Conservative debt management with debt-to-equity ratio of ${fundamentals.debtToEquity.toFixed(2)}`);
    }
    
    return points.slice(0, 3); // Limit to top 3 points
  };

  const getRiskFactors = (fundamentals) => {
    const risks = [];
    
    if (fundamentals?.debtToEquity && fundamentals.debtToEquity > 1.0) {
      risks.push(`High debt levels with debt-to-equity ratio of ${fundamentals.debtToEquity.toFixed(2)}`);
    }
    
    if (fundamentals?.pe && fundamentals.pe > 30) {
      risks.push(`High valuation with P/E ratio of ${fundamentals.pe.toFixed(1)} may limit upside`);
    }
    
    if (fundamentals?.currentRatio && fundamentals.currentRatio < 1.0) {
      risks.push(`Liquidity concerns with current ratio below 1.0`);
    }
    
    if (fundamentals?.beta && fundamentals.beta > 1.5) {
      risks.push(`High volatility with beta of ${fundamentals.beta.toFixed(2)}`);
    }
    
    return risks.slice(0, 3); // Limit to top 3 risks
  };

  const bullishPoints = getBullishPoints(data);
  const riskFactors = getRiskFactors(data);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Building className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-900">Investment Thesis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bullish Case */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-green-600" size={18} />
            <h4 className="font-semibold text-green-700">Why You Might Want to Own {symbol}</h4>
          </div>
          
          {bullishPoints.length > 0 ? (
            <ul className="space-y-2">
              {bullishPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              This company shows potential for growth and profitability. Consider fundamental analysis for specific investment merits.
            </p>
          )}
        </div>
        
        {/* Risk Factors */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-yellow-600" size={18} />
            <h4 className="font-semibold text-yellow-700">Key Risk Factors</h4>
          </div>
          
          {riskFactors.length > 0 ? (
            <ul className="space-y-2">
              {riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              General market risks apply. Always consider your risk tolerance and investment timeline.
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Investment Education Note:</p>
            <p className="text-blue-800">
              This analysis is based on fundamental financial metrics and should be combined with your own research, 
              risk tolerance assessment, and investment objectives before making any investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Company Story Component
 */
const CompanyStory = ({ data, symbol }) => {
  const getBusinessModelDescription = (fundamentals) => {
    if (!fundamentals) return `${symbol} is a publicly traded company. Detailed business information will appear here when fundamental data is available.`;
    
    const { sector, industry, description, marketCap, revenue } = fundamentals;
    
    let story = "";
    
    if (sector && industry) {
      story += `${symbol} operates in the ${industry} industry within the ${sector} sector. `;
    }
    
    if (marketCap) {
      const marketCapB = marketCap / 1e9;
      if (marketCapB > 200) {
        story += "As a large-cap company, it represents an established market leader ";
      } else if (marketCapB > 10) {
        story += "As a mid-cap company, it offers a balance of growth potential and stability ";
      } else {
        story += "As a small-cap company, it may offer higher growth potential with increased volatility ";
      }
    }
    
    if (revenue) {
      const revenueB = revenue / 1e9;
      story += `with annual revenue of approximately $${revenueB.toFixed(1)} billion. `;
    }
    
    if (description) {
      story += description.substring(0, 300);
      if (description.length > 300) story += "...";
    }
    
    return story;
  };

  const getKeyDrivers = (fundamentals) => {
    const drivers = [];
    
    if (fundamentals?.revenueGrowth && fundamentals.revenueGrowth > 0.1) {
      drivers.push("Strong revenue growth trajectory");
    }
    
    if (fundamentals?.roe && fundamentals.roe > 0.15) {
      drivers.push("Efficient capital allocation and management");
    }
    
    if (fundamentals?.freeCashFlow && fundamentals.freeCashFlow > 0) {
      drivers.push("Positive free cash flow generation");
    }
    
    if (fundamentals?.grossMargin && fundamentals.grossMargin > 0.3) {
      drivers.push("Strong pricing power and operational efficiency");
    }
    
    return drivers.length > 0 ? drivers : ["Market position in growing industry", "Operational excellence focus", "Strategic growth initiatives"];
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-900">Company Story</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Business Model</h4>
          <p className="text-gray-700 leading-relaxed">
            {getBusinessModelDescription(data)}
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Key Growth Drivers</h4>
          <ul className="space-y-2">
            {getKeyDrivers(data).map((driver, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {data?.website && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Learn More</h4>
            <a 
              href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Building size={16} />
              Visit Company Website
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Overview Tab Component
 */
const OverviewTab = ({ symbol, safeStock, historicalData, loading, onPeriodChange, selectedPeriod }) => {
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(true);

  useEffect(() => {
    const fetchFundamentals = async () => {
      if (!symbol) return;
      
      try {
        setFundamentalsLoading(true);
        const data = await marketApi.getFundamentals(symbol);
        setFundamentalsData(data);
      } catch (error) {
        console.error('Error fetching fundamentals for overview:', error);
        setFundamentalsData(null);
      } finally {
        setFundamentalsLoading(false);
      }
    };

    fetchFundamentals();
  }, [symbol]);

  // Handle period change from selector
  const handlePeriodChange = (period) => {
    if (onPeriodChange) {
      onPeriodChange(period.value);
    }
  };

  // Calculate circular progress scores
  const calculateQualityScore = (data) => {
    if (!data) return 75; // Default score
    
    let score = 50; // Base score
    
    // ROE component (0-25 points)
    if (data.roe) {
      if (data.roe > 0.20) score += 25;
      else if (data.roe > 0.15) score += 20;
      else if (data.roe > 0.10) score += 15;
      else if (data.roe > 0.05) score += 10;
    }
    
    // Profit margin component (0-15 points)  
    if (data.profitMargin) {
      if (data.profitMargin > 0.15) score += 15;
      else if (data.profitMargin > 0.10) score += 12;
      else if (data.profitMargin > 0.05) score += 8;
    }
    
    // Debt management (0-10 points)
    if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
      if (data.debtToEquity < 0.3) score += 10;
      else if (data.debtToEquity < 0.6) score += 7;
      else if (data.debtToEquity < 1.0) score += 4;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const calculateFinancialHealthScore = (data) => {
    if (!data) return 70; // Default score
    
    let score = 40; // Base score
    
    // Current ratio (0-20 points)
    if (data.currentRatio) {
      if (data.currentRatio > 2.0) score += 20;
      else if (data.currentRatio > 1.5) score += 15;
      else if (data.currentRatio > 1.0) score += 10;
    }
    
    // Debt to equity (0-20 points)
    if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
      if (data.debtToEquity < 0.3) score += 20;
      else if (data.debtToEquity < 0.6) score += 15;
      else if (data.debtToEquity < 1.0) score += 10;
      else if (data.debtToEquity < 2.0) score += 5;
    }
    
    // Cash position (0-20 points)
    if (data.cash && data.marketCap) {
      const cashRatio = data.cash / data.marketCap;
      if (cashRatio > 0.10) score += 20;
      else if (cashRatio > 0.05) score += 15;
      else if (cashRatio > 0.02) score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const calculateGrowthScore = (data) => {
    if (!data) return 65; // Default score
    
    let score = 30; // Base score
    
    // Revenue growth (0-35 points)
    if (data.revenueGrowth) {
      if (data.revenueGrowth > 0.20) score += 35;
      else if (data.revenueGrowth > 0.15) score += 30;
      else if (data.revenueGrowth > 0.10) score += 25;
      else if (data.revenueGrowth > 0.05) score += 20;
      else if (data.revenueGrowth > 0) score += 10;
    }
    
    // Earnings growth (0-35 points)
    if (data.earningsGrowth) {
      if (data.earningsGrowth > 0.20) score += 35;
      else if (data.earningsGrowth > 0.15) score += 30;
      else if (data.earningsGrowth > 0.10) score += 25;
      else if (data.earningsGrowth > 0.05) score += 20;
      else if (data.earningsGrowth > 0) score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const calculateRiskScore = (data) => {
    if (!data) return 60; // Default score (lower is better for risk)
    
    let score = 80; // Start with low risk assumption
    
    // Beta component - higher beta = higher risk
    if (data.beta) {
      if (data.beta > 2.0) score -= 30;
      else if (data.beta > 1.5) score -= 20;
      else if (data.beta > 1.2) score -= 10;
      else if (data.beta < 0.8) score += 10; // Very low beta is good
    }
    
    // Debt component - higher debt = higher risk
    if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
      if (data.debtToEquity > 2.0) score -= 25;
      else if (data.debtToEquity > 1.0) score -= 15;
      else if (data.debtToEquity > 0.5) score -= 5;
    }
    
    // Valuation risk - very high P/E = higher risk
    if (data.pe) {
      if (data.pe > 50) score -= 20;
      else if (data.pe > 30) score -= 10;
      else if (data.pe > 20) score -= 5;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  if (fundamentalsLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const qualityScore = calculateQualityScore(fundamentalsData);
  const healthScore = calculateFinancialHealthScore(fundamentalsData);
  const growthScore = calculateGrowthScore(fundamentalsData);
  const riskScore = calculateRiskScore(fundamentalsData);

  return (
    <div className="space-y-8">
      {/* Stock Price Chart Section - Enhanced with Technical Indicators */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Price Chart with Technical Analysis</h3>
            <div className="text-sm text-gray-500 ml-2">
              200-day MA • RSI • Volume
            </div>
          </div>
          <TimePeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        
        <StockPriceCharts 
          historicalData={historicalData}
          loading={loading}
          selectedPeriod={selectedPeriod}
          safeStock={safeStock}
        />
        
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-blue-600 rounded"></div>
              <span><strong>200-day MA:</strong> Long-term trend indicator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 border border-green-600 rounded"></div>
              <span><strong>RSI:</strong> Overbought (&gt;70) / Oversold (&lt;30)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded opacity-30"></div>
              <span><strong>Volume:</strong> Trading activity backdrop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Progress Scores */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Investment Analysis Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CircularProgressScore
            title="Quality Score"
            score={qualityScore}
            description="Financial stability, management quality, and consistent performance indicators"
            color={qualityScore >= 80 ? "green" : qualityScore >= 60 ? "blue" : qualityScore >= 40 ? "yellow" : "red"}
            icon={Shield}
          />
          
          <CircularProgressScore
            title="Financial Health"
            score={healthScore}
            description="Balance sheet strength, debt levels, liquidity, and cash position"
            color={healthScore >= 80 ? "green" : healthScore >= 60 ? "blue" : healthScore >= 40 ? "yellow" : "red"}
            icon={TrendingUp}
          />
          
          <CircularProgressScore
            title="Growth Potential"
            score={growthScore}
            description="Revenue trends, earnings growth, market opportunity, and expansion prospects"
            color={growthScore >= 80 ? "green" : growthScore >= 60 ? "blue" : growthScore >= 40 ? "yellow" : "red"}
            icon={Zap}
          />
          
          <CircularProgressScore
            title="Risk Assessment"
            score={100 - riskScore} // Invert so lower risk shows higher score
            description="Volatility, debt levels, sector risks, and business model stability"
            color={riskScore <= 40 ? "green" : riskScore <= 60 ? "blue" : riskScore <= 80 ? "yellow" : "red"}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Investment Thesis */}
      <InvestmentThesis data={fundamentalsData} symbol={symbol} />

      {/* Company Story */}
      <CompanyStory data={fundamentalsData} symbol={symbol} />
    </div>
  );
};

export default OverviewTab;