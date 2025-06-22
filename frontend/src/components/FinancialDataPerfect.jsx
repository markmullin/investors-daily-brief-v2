// FINANCIAL DATA COMPONENT WITH PERFECT EDGAR INTEGRATION
// Shows financial data with quality indicators and comprehensive metrics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';

const FinancialDataPerfect = ({ symbol, onDataLoad }) => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);

  useEffect(() => {
    if (symbol) {
      fetchPerfectFinancialData();
    }
  }, [symbol]);

  const fetchPerfectFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/edgar/perfect/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFinancialData(data.financials);
      setDataQuality(data.dataQuality);
      
      if (onDataLoad) {
        onDataLoad(data);
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value, type = 'currency') => {
    if (!value || typeof value !== 'number') return 'N/A';
    
    switch (type) {
      case 'currency':
        const billions = Math.abs(value) / 1e9;
        const millions = Math.abs(value) / 1e6;
        if (billions >= 1) {
          return `${value < 0 ? '-' : ''}$${billions.toFixed(2)}B`;
        } else if (millions >= 1) {
          return `${value < 0 ? '-' : ''}$${millions.toFixed(1)}M`;
        } else {
          return `${value < 0 ? '-' : ''}$${(Math.abs(value) / 1000).toFixed(0)}K`;
        }
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toFixed(2);
    }
  };

  const getQualityColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score) => {
    if (score >= 0.95) return { text: 'Excellent', variant: 'success' };
    if (score >= 0.9) return { text: 'Very Good', variant: 'success' };
    if (score >= 0.8) return { text: 'Good', variant: 'warning' };
    if (score >= 0.7) return { text: 'Fair', variant: 'warning' };
    return { text: 'Poor', variant: 'destructive' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading perfect financial data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load financial data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!financialData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No financial data available for {symbol}
        </AlertDescription>
      </Alert>
    );
  }

  const qualityBadge = dataQuality ? getQualityBadge(dataQuality.overallScore) : null;

  return (
    <div className="space-y-4">
      {/* Data Quality Indicator */}
      {dataQuality && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Data Quality
              </CardTitle>
              <Badge variant={qualityBadge.variant}>
                {qualityBadge.text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span className={getQualityColor(dataQuality.overallScore)}>
                    {(dataQuality.overallScore * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={dataQuality.overallScore * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Completeness</span>
                  <p className="font-medium">{(dataQuality.completeness * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy</span>
                  <p className="font-medium">{(dataQuality.accuracy * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Consistency</span>
                  <p className="font-medium">{(dataQuality.consistency * 100).toFixed(0)}%</p>
                </div>
              </div>

              {dataQuality.issues && dataQuality.issues.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Issues detected:</p>
                  {dataQuality.issues.map((issue, idx) => (
                    <p key={idx} className="text-xs text-yellow-600">• {issue}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Statement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Income Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {financialData.revenue && (
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.revenue.value)}
                </p>
                {financialData.revenue.source && (
                  <p className="text-xs text-muted-foreground">
                    Source: {financialData.revenue.source}
                  </p>
                )}
              </div>
            )}
            
            {financialData.grossProfit && (
              <div>
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.grossProfit.value)}
                </p>
                {financialData.grossMargin && (
                  <p className="text-sm text-green-600">
                    {financialData.grossMargin.value.toFixed(1)}% margin
                  </p>
                )}
              </div>
            )}
            
            {financialData.operatingIncome && (
              <div>
                <p className="text-sm text-muted-foreground">Operating Income</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.operatingIncome.value)}
                </p>
              </div>
            )}
            
            {financialData.netIncome && (
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.netIncome.value)}
                </p>
                {financialData.netMargin && (
                  <p className="text-sm text-green-600">
                    {financialData.netMargin.value.toFixed(1)}% margin
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {financialData.operatingCashFlow && (
              <div>
                <p className="text-sm text-muted-foreground">Operating Cash Flow</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.operatingCashFlow.value)}
                </p>
              </div>
            )}
            
            {financialData.capitalExpenditures && (
              <div>
                <p className="text-sm text-muted-foreground">Capital Expenditures</p>
                <p className="text-xl font-bold text-red-600">
                  -{formatValue(Math.abs(financialData.capitalExpenditures.value))}
                </p>
              </div>
            )}
            
            {financialData.freeCashFlow && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Free Cash Flow</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatValue(financialData.freeCashFlow.value)}
                </p>
                {financialData.freeCashFlow.formula && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialData.freeCashFlow.formula}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Balance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {financialData.totalAssets && (
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.totalAssets.value)}
                </p>
              </div>
            )}
            
            {financialData.totalLiabilities && (
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.totalLiabilities.value)}
                </p>
              </div>
            )}
            
            {financialData.shareholdersEquity && (
              <div>
                <p className="text-sm text-muted-foreground">Shareholders' Equity</p>
                <p className="text-xl font-bold">
                  {formatValue(financialData.shareholdersEquity.value)}
                </p>
              </div>
            )}
            
            {financialData.debtToEquity && (
              <div>
                <p className="text-sm text-muted-foreground">Debt/Equity Ratio</p>
                <p className="text-xl font-bold">
                  {financialData.debtToEquity.value.toFixed(2)}x
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Key Ratios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {financialData.roe && (
              <div>
                <p className="text-sm text-muted-foreground">Return on Equity (ROE)</p>
                <p className="text-xl font-bold">
                  {financialData.roe.value.toFixed(1)}%
                </p>
              </div>
            )}
            
            {financialData.roa && (
              <div>
                <p className="text-sm text-muted-foreground">Return on Assets (ROA)</p>
                <p className="text-xl font-bold">
                  {financialData.roa.value.toFixed(1)}%
                </p>
              </div>
            )}
            
            {financialData.grossMargin && (
              <div>
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-xl font-bold">
                  {financialData.grossMargin.value.toFixed(1)}%
                </p>
              </div>
            )}
            
            {financialData.netMargin && (
              <div>
                <p className="text-sm text-muted-foreground">Net Margin</p>
                <p className="text-xl font-bold">
                  {financialData.netMargin.value.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDataPerfect;
