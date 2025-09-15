import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Building, 
  Info, 
  ArrowUp, 
  ArrowDown,
  CheckCircle
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
 * Enhanced metric card with performance coloring
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
 * Helper function to format large numbers
 */
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

/**
 * Helper function to format percentages
 */
const formatPercent = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
};

/**
 * *** FIXED: Fundamentals component to handle direct FMP API data response ***
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
        
        console.log('🔍 [STOCK MODAL] Fetching fundamentals for:', symbol);
        const response = await marketApi.getFundamentals(symbol);
        
        console.log('📊 [STOCK MODAL] Raw fundamentals response:', response);
        
        // *** FIXED: Handle direct data response from research/fundamentals endpoint ***
        if (response && typeof response === 'object') {
          // Check if response has success wrapper (old format) or is direct data (new format)
          if (response.success !== undefined) {
            // Wrapped format: {success: true, data: {...}}
            if (response.success) {
              setFundamentalsData(response.data);
              console.log('✅ [STOCK MODAL] Fundamentals loaded (wrapped format):', response.data);
            } else {
              throw new Error(response.error || 'Failed to load fundamentals');
            }
          } else {
            // *** FIXED: Direct data format from /api/research/fundamentals/ endpoint ***
            setFundamentalsData(response);
            console.log('✅ [STOCK MODAL] Fundamentals loaded (direct format):', {
              symbol: response.symbol,
              name: response.name,
              hasRevenue: !!response.revenue,
              hasNetIncome: !!response.netIncome,
              hasRatios: !!(response.pe || response.roe || response.debtToEquity),
              dataSource: response.dataSource
            });
          }
        } else {
          throw new Error('Invalid response format from fundamentals API');
        }
      } catch (err) {
        console.error('❌ [STOCK MODAL] Error fetching fundamentals:', err);
        setError(`Failed to load fundamentals: ${err.message}`);
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
          Could not load fundamental data for {symbol}: {error}
        </p>
        <div className="mt-4 text-xs text-gray-500">
          <p>Endpoint: /api/research/fundamentals/{symbol}</p>
          <p>This should return direct fundamental data from FMP API</p>
        </div>
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

  // Extract data from FMP API response structure
  const {
    name,
    price,
    marketCap,
    revenue,
    netIncome,
    grossProfit,
    operatingIncome,
    ebitda,
    eps,
    totalAssets,
    totalDebt,
    totalEquity,
    cash,
    freeCashFlow,
    operatingCashFlow,
    capex,
    pe,
    priceToBook,
    priceToSales,
    roe,
    roa,
    debtToEquity,
    currentRatio,
    quickRatio,
    grossMargin,
    operatingMargin,
    profitMargin,
    fcfMargin,
    revenueGrowth,
    earningsGrowth,
    sharesOutstanding,
    beta,
    wacc,
    sector,
    industry,
    description,
    website,
    ceo,
    employees,
    bookValue,
    tangibleBookValue,
    dividendYield,
    payoutRatio,
    dataSource
  } = fundamentalsData;

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building className="text-blue-600" size={24} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{name || symbol}</h3>
            <p className="text-gray-600">
              {sector && industry ? `${sector} • ${industry}` : sector || industry || 'Financial Analysis'}
            </p>
            {dataSource && (
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <CheckCircle size={14} />
                {dataSource}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {price && (
            <div>
              <span className="text-gray-600">Current Price:</span>
              <div className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</div>
            </div>
          )}
          {marketCap && (
            <div>
              <span className="text-gray-600">Market Cap:</span>
              <div className="text-lg font-semibold text-gray-900">{formatNumber(marketCap)}</div>
            </div>
          )}
          {pe && (
            <div>
              <span className="text-gray-600">P/E Ratio:</span>
              <div className="text-lg font-semibold text-gray-900">{pe.toFixed(2)}</div>
            </div>
          )}
          {beta && (
            <div>
              <span className="text-gray-600">Beta:</span>
              <div className="text-lg font-semibold text-gray-900">{beta.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Income Statement Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-green-600" size={20} />
          <h4 className="text-lg font-semibold text-gray-900">Income Statement</h4>
          <span className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded">
            Revenue and Profitability
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenue !== null && revenue !== undefined && (
            <MetricCard
              title="Total Revenue"
              value={formatNumber(revenue)}
              subtitle="Annual total sales"
              performanceLevel="good"
              tooltip="Revenue represents the total amount of money the company earned from sales during the year. This is the top line of the income statement."
              icon={DollarSign}
              iconColor="text-green-600"
            />
          )}
          
          {netIncome !== null && netIncome !== undefined && (
            <MetricCard
              title="Net Income"
              value={formatNumber(netIncome)}
              subtitle="Profit after all expenses"
              performanceLevel={netIncome > 0 ? "good" : "poor"}
              tooltip="Net income is the company's total profit after all expenses, taxes, and costs have been subtracted from revenue. This is the 'bottom line'."
              icon={TrendingUp}
              iconColor={netIncome > 0 ? "text-green-600" : "text-red-600"}
            />
          )}
          
          {eps && (
            <MetricCard
              title="Earnings Per Share (EPS)"
              value={`$${eps.toFixed(2)}`}
              subtitle="Profit per share of stock"
              performanceLevel={eps > 1 ? "good" : "fair"}
              tooltip="EPS shows how much profit the company earned for each share of stock. Higher EPS generally indicates better profitability per share."
              icon={Calculator}
              iconColor="text-purple-600"
            />
          )}
          
          {ebitda !== null && ebitda !== undefined && (
            <MetricCard
              title="EBITDA"
              value={formatNumber(ebitda)}
              subtitle="Earnings before interest, tax, depreciation, amortization"
              performanceLevel={ebitda > 0 ? "good" : "poor"}
              tooltip="EBITDA shows the company's operating performance before the impact of capital structure, tax rates, and depreciation policies."
              icon={Calculator}
              iconColor="text-blue-600"
            />
          )}
        </div>
      </div>

      {/* Profitability Ratios */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="text-blue-600" size={20} />
          <h4 className="text-lg font-semibold text-gray-900">Profitability & Efficiency</h4>
          <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
            Margin analysis and efficiency metrics
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {grossMargin !== null && grossMargin !== undefined && (
            <MetricCard
              title="Gross Margin"
              value={formatPercent(grossMargin)}
              subtitle="Revenue after cost of goods sold"
              performanceLevel={getMarginPerformance(grossMargin * 100)}
              tooltip="Gross margin shows what percentage of revenue remains after subtracting the direct costs of producing goods or services."
              icon={TrendingUp}
              iconColor="text-green-600"
            />
          )}
          
          {operatingMargin !== null && operatingMargin !== undefined && (
            <MetricCard
              title="Operating Margin"
              value={formatPercent(operatingMargin)}
              subtitle="Operational efficiency"
              performanceLevel={getMarginPerformance(operatingMargin * 100)}
              tooltip="Operating margin shows what percentage of revenue becomes operating profit, measuring the company's operational efficiency."
              icon={Calculator}
              iconColor="text-blue-600"
            />
          )}
          
          {profitMargin !== null && profitMargin !== undefined && (
            <MetricCard
              title="Net Profit Margin"
              value={formatPercent(profitMargin)}
              subtitle="Bottom line efficiency"
              performanceLevel={getMarginPerformance(profitMargin * 100)}
              tooltip="Net profit margin shows what percentage of revenue becomes net profit after all expenses, taxes, and costs."
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
          )}
          
          {roe !== null && roe !== undefined && (
            <MetricCard
              title="Return on Equity (ROE)"
              value={formatPercent(roe)}
              subtitle="Efficiency of using shareholder equity"
              performanceLevel={getROEPerformance(roe * 100)}
              tooltip="ROE measures how efficiently the company uses shareholders' money to generate profits. Higher ROE generally indicates better management performance."
              icon={TrendingUp}
              iconColor="text-emerald-600"
            />
          )}
        </div>
      </div>

      {/* Balance Sheet Strength */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Building className="text-emerald-600" size={20} />
          <h4 className="text-lg font-semibold text-gray-900">Balance Sheet Strength</h4>
          <span className="text-sm text-gray-500 bg-emerald-50 px-2 py-1 rounded">
            Financial position and leverage
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalAssets !== null && totalAssets !== undefined && (
            <MetricCard
              title="Total Assets"
              value={formatNumber(totalAssets)}
              subtitle="Everything the company owns"
              performanceLevel="good"
              tooltip="Total assets include cash, inventory, equipment, real estate, and other valuable items owned by the company."
              icon={Building}
              iconColor="text-blue-600"
            />
          )}
          
          {totalEquity !== null && totalEquity !== undefined && (
            <MetricCard
              title="Shareholders' Equity"
              value={formatNumber(totalEquity)}
              subtitle="Net worth belonging to shareholders"
              performanceLevel="good"
              tooltip="Shareholders' equity is what remains after subtracting liabilities from assets. This represents the net worth that belongs to the company's owners."
              icon={TrendingUp}
              iconColor="text-green-600"
            />
          )}
          
          {cash !== null && cash !== undefined && (
            <MetricCard
              title="Cash & Cash Equivalents"
              value={formatNumber(cash)}
              subtitle="Liquid assets available"
              performanceLevel="good"
              tooltip="Cash and cash equivalents provide financial flexibility and ability to weather economic downturns or invest in opportunities."
              icon={DollarSign}
              iconColor="text-emerald-600"
            />
          )}
          
          {debtToEquity !== null && debtToEquity !== undefined && (
            <MetricCard
              title="Debt-to-Equity Ratio"
              value={debtToEquity.toFixed(2)}
              subtitle="Financial leverage indicator"
              performanceLevel={getDebtRatioPerformance(debtToEquity)}
              tooltip="This ratio shows how much debt the company has relative to shareholders' equity. Lower ratios generally indicate less financial risk."
              icon={AlertCircle}
              iconColor={debtToEquity > 1 ? "text-red-600" : "text-green-600"}
            />
          )}
        </div>
      </div>

      {/* Cash Flow Analysis */}
      {(freeCashFlow !== null && freeCashFlow !== undefined) || (operatingCashFlow !== null && operatingCashFlow !== undefined) && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="text-blue-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Cash Flow Analysis</h4>
            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Cash generation and usage
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {operatingCashFlow !== null && operatingCashFlow !== undefined && (
              <MetricCard
                title="Operating Cash Flow"
                value={formatNumber(operatingCashFlow)}
                subtitle="Cash generated from operations"
                performanceLevel={operatingCashFlow > 0 ? "good" : "poor"}
                tooltip="Operating cash flow shows how much cash the company generates from its core business operations."
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            )}
            
            {freeCashFlow !== null && freeCashFlow !== undefined && (
              <MetricCard
                title="Free Cash Flow"
                value={formatNumber(freeCashFlow)}
                subtitle="Cash available after capital expenditures"
                performanceLevel={freeCashFlow > 0 ? "excellent" : "poor"}
                tooltip="Free cash flow is the cash generated by operations minus capital expenditures. This represents cash available for dividends, buybacks, or growth investments."
                icon={DollarSign}
                iconColor="text-emerald-600"
              />
            )}
            
            {capex !== null && capex !== undefined && (
              <MetricCard
                title="Capital Expenditures"
                value={formatNumber(capex)}
                subtitle="Investment in long-term assets"
                performanceLevel="neutral"
                tooltip="Capital expenditures represent investments in property, plant, equipment, and other long-term assets needed to maintain or grow the business."
                icon={Building}
                iconColor="text-blue-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Growth Metrics */}
      {(revenueGrowth !== null && revenueGrowth !== undefined) || (earningsGrowth !== null && earningsGrowth !== undefined) && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <ArrowUp className="text-green-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Growth Analysis</h4>
            <span className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded">
              Revenue and earnings growth trends
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {revenueGrowth !== null && revenueGrowth !== undefined && (
              <MetricCard
                title="Revenue Growth"
                value={formatPercent(revenueGrowth)}
                subtitle="Year-over-year revenue growth"
                trend={revenueGrowth}
                performanceLevel={getGrowthPerformance(revenueGrowth * 100)}
                tooltip="Revenue growth shows how much the company's sales have increased compared to the previous year."
                icon={TrendingUp}
                iconColor="text-green-600"
              />
            )}
            
            {earningsGrowth !== null && earningsGrowth !== undefined && (
              <MetricCard
                title="Earnings Growth"
                value={formatPercent(earningsGrowth)}
                subtitle="Year-over-year earnings growth"
                trend={earningsGrowth}
                performanceLevel={getGrowthPerformance(earningsGrowth * 100)}
                tooltip="Earnings growth shows how much the company's net income has increased compared to the previous year."
                icon={Calculator}
                iconColor="text-blue-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Company Information */}
      {(website || ceo || employees || description) && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Info className="text-gray-600" size={20} />
            <h4 className="text-lg font-semibold text-gray-900">Company Information</h4>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {ceo && (
                <div>
                  <span className="text-sm text-gray-600">CEO:</span>
                  <div className="font-medium text-gray-900">{ceo}</div>
                </div>
              )}
              {employees && (
                <div>
                  <span className="text-sm text-gray-600">Employees:</span>
                  <div className="font-medium text-gray-900">{employees.toLocaleString()}</div>
                </div>
              )}
              {website && (
                <div>
                  <span className="text-sm text-gray-600">Website:</span>
                  <div>
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {website}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {description && (
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="text-gray-900 mt-1 leading-relaxed">{description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-blue-600 mt-1" size={20} />
          <div>
            <h5 className="font-semibold text-blue-900 mb-2">Data Source & Quality</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Source:</strong> {dataSource || 'Financial Modeling Prep (FMP) API'}</p>
              <p>• <strong>Accuracy:</strong> Professional-grade financial data with comprehensive coverage</p>
              <p>• <strong>Currency:</strong> All figures in USD with real-time pricing and comprehensive fundamentals</p>
              <p>• <strong>Coverage:</strong> Income statement, balance sheet, cash flow, and key financial ratios</p>
              <p>• <strong>API Endpoint:</strong> /api/research/fundamentals/{symbol} (direct data response)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundamentalsTab;