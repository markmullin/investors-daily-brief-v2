import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Building, 
  Calendar, 
  Info, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { marketApi } from '../../services/api';

/**
 * Enhanced tooltip component for fundamentals
 */
const MetricTooltip = ({ children, title, explanation, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1">
        {children}
        <Info size={14} className="text-gray-400 hover:text-blue-500 cursor-help" />
      </div>
      
      {isHovered && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{explanation}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced metric card with trend indicators and performance coloring
 */
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  performanceLevel, 
  tooltip,
  icon: Icon,
  iconColor = "text-blue-600"
}) => {
  const getPerformanceColor = (level) => {
    switch (level) {
      case 'excellent': return 'border-l-green-500 bg-green-50';
      case 'good': return 'border-l-blue-500 bg-blue-50';
      case 'fair': return 'border-l-yellow-500 bg-yellow-50';
      case 'poor': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  const getTrendIcon = (trendValue) => {
    if (!trendValue && trendValue !== 0) return null;
    if (trendValue > 0) return <ArrowUp size={16} className="text-green-600" />;
    if (trendValue < 0) return <ArrowDown size={16} className="text-red-600" />;
    return null;
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getPerformanceColor(performanceLevel)} border border-gray-200 transition-all hover:shadow-md`}>
      <MetricTooltip title={title} explanation={tooltip}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className={iconColor} />}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          {getTrendIcon(trend)}
        </div>
      </MetricTooltip>
      
      <p className="text-xl font-bold text-gray-900">{value}</p>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

/**
 * Performance analysis helpers
 */
const getGrowthPerformance = (growthRate) => {
  if (!growthRate && growthRate !== 0) return 'neutral';
  if (growthRate >= 15) return 'excellent';
  if (growthRate >= 8) return 'good';
  if (growthRate >= 0) return 'fair';
  return 'poor';
};

const getMarginPerformance = (margin) => {
  if (!margin && margin !== 0) return 'neutral';
  if (margin >= 20) return 'excellent';
  if (margin >= 10) return 'good';
  if (margin >= 5) return 'fair';
  return 'poor';
};

const getROEPerformance = (roe) => {
  if (!roe && roe !== 0) return 'neutral';
  if (roe >= 20) return 'excellent';
  if (roe >= 15) return 'good';
  if (roe >= 10) return 'fair';
  return 'poor';
};

const getDebtRatioPerformance = (ratio) => {
  if (!ratio && ratio !== 0) return 'neutral';
  if (ratio <= 0.3) return 'excellent';
  if (ratio <= 0.6) return 'good';
  if (ratio <= 1.0) return 'fair';
  return 'poor';
};

/**
 * Fundamentals component to display EDGAR financial data
 */
const FundamentalsTab = ({ symbol }) => {
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFundamentals = async () => {
      if (!symbol) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching fundamentals for:', symbol);
        const data = await marketApi.getFundamentals(symbol);
        setFundamentalsData(data);
      } catch (err) {
        console.error('Error fetching fundamentals:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFundamentals();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <AlertCircle className="text-red-500 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Fundamentals Unavailable</h3>
        <p className="text-gray-600 text-center max-w-md">
          Could not load fundamental data for {symbol}. This may be because the company is not publicly traded in the US or SEC data is not available.
        </p>
      </div>
    );
  }

  if (!fundamentalsData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <Calculator className="text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
        <p className="text-gray-600 text-center max-w-md">
          Fundamental data for {symbol} is not currently available.
        </p>
      </div>
    );
  }

  const { fundamentals, companyName, currentPrice } = fundamentalsData;
  const { latest, growth, ratios, legacy } = fundamentals;

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building className="text-blue-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{companyName}</h3>
            <p className="text-gray-600">Financial Analysis • Data from SEC EDGAR</p>
          </div>
        </div>
        
        {currentPrice && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Current Price:</span>
            <span className="text-2xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Latest Quarter Metrics */}
      {latest && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-green-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Latest Quarter Performance</h4>
            {latest.revenue?.period && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Period ending {new Date(latest.revenue.period).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.revenue && (
              <MetricCard
                title="Quarterly Revenue"
                value={latest.revenue.quarterlyFormatted}
                subtitle="Total sales for the quarter"
                performanceLevel="good"
                tooltip="Revenue represents the total amount of money the company earned from sales during the quarter. This is the top line of the income statement."
                icon={DollarSign}
                iconColor="text-green-600"
              />
            )}
            
            {latest.netIncome && (
              <MetricCard
                title="Net Income"
                value={latest.netIncome.quarterlyFormatted}
                subtitle="Profit after all expenses"
                performanceLevel={latest.netIncome.quarterly > 0 ? "good" : "poor"}
                tooltip="Net income is the company's total profit after all expenses, taxes, and costs have been subtracted from revenue. This is the 'bottom line'."
                icon={TrendingUp}
                iconColor="text-blue-600"
              />
            )}
            
            {latest.eps && (
              <MetricCard
                title="Earnings Per Share (EPS)"
                value={latest.eps.formatted}
                subtitle="Profit per share of stock"
                performanceLevel={latest.eps.value > 1 ? "good" : "fair"}
                tooltip="EPS shows how much profit the company earned for each share of stock. Higher EPS generally indicates better profitability per share."
                icon={Calculator}
                iconColor="text-purple-600"
              />
            )}
            
            {ratios?.profitMarginQuarterly && (
              <MetricCard
                title="Profit Margin"
                value={ratios.profitMarginQuarterly.formatted}
                subtitle="Efficiency of converting sales to profit"
                performanceLevel={getMarginPerformance(ratios.profitMarginQuarterly.margin)}
                tooltip="Profit margin shows what percentage of revenue becomes profit. Higher margins indicate the company is more efficient at converting sales into earnings."
                icon={TrendingUp}
                iconColor="text-emerald-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Growth Analysis - Enhanced */}
      {growth && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Revenue Growth Analysis</h4>
            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Growth rates show company expansion trends
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {growth.quarterOverQuarter?.revenue && (
              <MetricCard
                title="Revenue Growth (Quarter-over-Quarter)"
                value={growth.quarterOverQuarter.revenue.formatted}
                subtitle={growth.quarterOverQuarter.revenue.note}
                trend={growth.quarterOverQuarter.revenue.growth}
                performanceLevel={getGrowthPerformance(growth.quarterOverQuarter.revenue.growth)}
                tooltip="Compares revenue from the same quarter in the previous year to account for seasonal business patterns. This gives a clearer picture of underlying growth trends."
                icon={Calendar}
                iconColor="text-blue-600"
              />
            )}
            
            {growth.yearOverYear?.revenue && (
              <MetricCard
                title="Revenue Growth (Year-over-Year)"
                value={growth.yearOverYear.revenue.formatted}
                subtitle="Annual revenue comparison"
                trend={growth.yearOverYear.revenue.growth}
                performanceLevel={getGrowthPerformance(growth.yearOverYear.revenue.growth)}
                tooltip="Compares the most recent full year of revenue to the previous year. This shows the company's overall growth trajectory over a complete business cycle."
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            )}
            
            {growth.fiveYear?.revenue && (
              <MetricCard
                title={`Revenue Growth (${growth.fiveYear.revenue.actualYears}-Year CAGR)`}
                value={growth.fiveYear.revenue.cagrFormatted}
                subtitle="Compound Annual Growth Rate"
                trend={growth.fiveYear.revenue.cagr}
                performanceLevel={getGrowthPerformance(growth.fiveYear.revenue.cagr)}
                tooltip={`CAGR shows the average annual growth rate over ${growth.fiveYear.revenue.actualYears} years. This smooths out year-to-year volatility and shows long-term growth consistency.`}
                icon={TrendingUp}
                iconColor="text-indigo-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Financial Efficiency & Ratios */}
      {ratios && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="text-purple-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Financial Efficiency Ratios</h4>
            <span className="text-sm text-gray-500 bg-purple-50 px-2 py-1 rounded">
              Key metrics for financial health assessment
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ratios.roe && (
              <MetricCard
                title="Return on Equity (ROE)"
                value={ratios.roe.formatted}
                subtitle={ratios.roe.note}
                performanceLevel={getROEPerformance(ratios.roe.roe)}
                tooltip="ROE measures how efficiently the company uses shareholders' money to generate profits. Higher ROE generally indicates better management performance."
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            )}
            
            {ratios.bookValuePerShare && (
              <MetricCard
                title="Book Value per Share"
                value={ratios.bookValuePerShare.formatted}
                subtitle="Net worth per share if liquidated"
                performanceLevel="good"
                tooltip="Book value per share represents the company's net worth (assets minus liabilities) divided by shares outstanding. It shows the theoretical value if the company were liquidated."
                icon={DollarSign}
                iconColor="text-blue-600"
              />
            )}
            
            {ratios.debtToEquity && (
              <MetricCard
                title="Debt-to-Equity Ratio"
                value={ratios.debtToEquity.formatted}
                subtitle="Financial leverage indicator"
                performanceLevel={getDebtRatioPerformance(ratios.debtToEquity.ratio)}
                tooltip="This ratio shows how much debt the company has relative to shareholders' equity. Lower ratios generally indicate less financial risk."
                icon={AlertCircle}
                iconColor={ratios.debtToEquity.ratio > 1 ? "text-red-600" : "text-green-600"}
              />
            )}
            
            {ratios.assetToLiabilityRatio && (
              <MetricCard
                title="Asset-to-Liability Ratio"
                value={ratios.assetToLiabilityRatio.formatted}
                subtitle="Asset coverage of obligations"
                performanceLevel={ratios.assetToLiabilityRatio.ratio > 1.5 ? "excellent" : "good"}
                tooltip="This shows how well the company's assets can cover its liabilities. Higher ratios indicate stronger financial stability and lower bankruptcy risk."
                icon={Building}
                iconColor="text-emerald-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Balance Sheet Snapshot */}
      {latest && (latest.assets || latest.liabilities || latest.equity) && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="text-emerald-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Balance Sheet Snapshot</h4>
            {latest.assets?.period && (
              <span className="text-sm text-gray-500 bg-emerald-50 px-2 py-1 rounded">
                As of {new Date(latest.assets.period).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latest.assets && (
              <MetricCard
                title="Total Assets"
                value={latest.assets.formatted}
                subtitle="Everything the company owns"
                performanceLevel="good"
                tooltip="Total assets include cash, inventory, equipment, real estate, and other valuable items owned by the company. This represents the company's total resources."
                icon={Building}
                iconColor="text-blue-600"
              />
            )}
            
            {latest.liabilities && (
              <MetricCard
                title="Total Liabilities"
                value={latest.liabilities.formatted}
                subtitle="Everything the company owes"
                performanceLevel="neutral"
                tooltip="Total liabilities include all debts, loans, accounts payable, and other financial obligations the company must pay. Lower relative to assets is generally better."
                icon={AlertCircle}
                iconColor="text-orange-600"
              />
            )}
            
            {latest.equity && (
              <MetricCard
                title="Shareholders' Equity"
                value={latest.equity.formatted}
                subtitle="Net worth belonging to shareholders"
                performanceLevel="good"
                tooltip="Shareholders' equity is what remains after subtracting liabilities from assets. This represents the net worth that belongs to the company's owners."
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Data Source and Methodology */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 mt-1" size={20} />
          <div>
            <h5 className="font-semibold text-blue-900 mb-2">Data Source & Methodology</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Source:</strong> SEC EDGAR filings - Official financial statements filed with the Securities and Exchange Commission</p>
              <p>• <strong>Accuracy:</strong> Data is extracted directly from quarterly (10-Q) and annual (10-K) reports</p>
              <p>• <strong>Currency:</strong> All figures in USD. Growth comparisons use same-period-prior-year to account for seasonality</p>
              <p>• <strong>Performance Indicators:</strong> Color coding based on industry-standard benchmarks for financial health</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundamentalsTab;