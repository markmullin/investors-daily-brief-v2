import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, PieChart, AlertCircle, CheckCircle, ArrowRight, Upload, Link, FileSpreadsheet, Shield, ChevronRight } from 'lucide-react';

const FinancialFoundations = ({ onDataUpdate }) => {
  const [financialData, setFinancialData] = useState({
    netWorth: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    totalDebt: '',
    emergencyFund: '',
    connectedAccounts: [],
    connectionType: null // 'plaid' or 'csv'
  });

  const [showPlaidConnect, setShowPlaidConnect] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null); // null, 'plaid', or 'manual'

  // Load connection type from localStorage on mount
  useEffect(() => {
    const savedConnectionType = localStorage.getItem('financialConnectionType');
    if (savedConnectionType) {
      setFinancialData(prev => ({ ...prev, connectionType: savedConnectionType }));
      setSelectedPath(savedConnectionType === 'plaid' ? 'plaid' : 'manual');
    }
  }, []);

  // Calculate financial health score (0-100)
  const calculateHealthScore = () => {
    const { netWorth, monthlyIncome, monthlyExpenses, totalDebt, emergencyFund } = financialData;
    
    // Return null if no data entered
    if (!monthlyIncome || !monthlyExpenses) return null;
    
    let score = 50; // Base score
    
    // Positive factors
    const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
    if (savingsRate > 0.2) score += 20;
    else if (savingsRate > 0.1) score += 10;
    else if (savingsRate > 0) score += 5;
    
    // Debt-to-income ratio
    const debtToIncome = totalDebt ? (totalDebt / 12) / monthlyIncome : 0;
    if (debtToIncome < 0.2) score += 15;
    else if (debtToIncome < 0.4) score += 5;
    else score -= 10;
    
    // Emergency fund
    const monthsOfExpenses = emergencyFund / monthlyExpenses;
    if (monthsOfExpenses >= 6) score += 15;
    else if (monthsOfExpenses >= 3) score += 10;
    else if (monthsOfExpenses >= 1) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const healthScore = calculateHealthScore();
  const investmentCapacity = financialData.monthlyIncome && financialData.monthlyExpenses 
    ? Math.max(0, financialData.monthlyIncome - financialData.monthlyExpenses)
    : null;

  const handleInputChange = (field, value) => {
    const newData = { ...financialData, [field]: value };
    setFinancialData(newData);
    
    // Notify parent component of data changes
    if (onDataUpdate) {
      onDataUpdate({
        ...newData,
        healthScore: calculateHealthScore(),
        investmentCapacity
      });
    }
  };

  const handlePathSelection = (path) => {
    setSelectedPath(path);
    const connectionType = path === 'plaid' ? 'plaid' : 'manual';
    localStorage.setItem('financialConnectionType', connectionType);
    setFinancialData(prev => ({ ...prev, connectionType }));
  };

  const handlePlaidConnect = () => {
    // Placeholder for future Plaid integration
    handlePathSelection('plaid');
    setShowPlaidConnect(true);
  };

  const handleCSVUpload = () => {
    // This would trigger the CSV upload modal from Portfolio section
    handlePathSelection('manual');
    // Scroll to Portfolio Analysis section
    document.getElementById('portfolio-analysis-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with Flow Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 border-b border-gray-200">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-green-600" />
            Financial Foundations
          </h3>
          <p className="text-gray-600">Connect your accounts or upload CSV files to build your personalized financial profile</p>
        </div>

        {/* Visual Flow Indicator */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedPath ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <span className="font-bold">1</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Connect Data</span>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
          
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              healthScore !== null ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <span className="font-bold">2</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Analyze Health</span>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
              <span className="font-bold">3</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Portfolio Analysis</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Dual Path Selection */}
        {!selectedPath && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Connection Method</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Path A: Connect with Plaid */}
              <button
                onClick={handlePlaidConnect}
                className="group relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-lg"
              >
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    PREMIUM (Coming Soon)
                  </span>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <Link className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="text-xl font-semibold text-gray-900 mb-2">Connect with Plaid</h5>
                  <p className="text-gray-600 text-sm mb-4">
                    Securely link your bank accounts, credit cards, and investments for automatic real-time analysis
                  </p>
                  <div className="space-y-2 text-left w-full">
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>Real-time balance updates</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>Automatic categorization</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>Bank-level security</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                    <span className="font-medium">Select This Option</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </button>

              {/* Path B: Upload CSV */}
              <button
                onClick={handleCSVUpload}
                className="group relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-gray-200 hover:border-green-400 transition-all hover:shadow-lg"
              >
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    AVAILABLE NOW
                  </span>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <h5 className="text-xl font-semibold text-gray-900 mb-2">Upload CSV Files</h5>
                  <p className="text-gray-600 text-sm mb-4">
                    Import your investment data from any broker using CSV export files
                  </p>
                  <div className="space-y-2 text-left w-full">
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>Works with all brokers</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>Privacy-first approach</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>No account linking needed</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-green-600 group-hover:text-green-700">
                    <span className="font-medium">Select This Option</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </button>
            </div>

            {/* Or divider for manual entry */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with manual entry below</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Path Indicator */}
        {selectedPath && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {selectedPath === 'plaid' ? (
                  <>
                    <Link className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">Connection Method: Plaid (Premium)</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Connection Method: CSV Upload</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedPath(null);
                  localStorage.removeItem('financialConnectionType');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Change method
              </button>
            </div>
            
            {selectedPath === 'manual' && (
              <div className="mt-3 flex items-center text-sm text-blue-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                <span>Data flows to Section 3 (Portfolio Analysis) for comprehensive analysis</span>
              </div>
            )}
          </div>
        )}

        {/* Plaid Connection Section (if selected) */}
        {selectedPath === 'plaid' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Accounts</h4>
                <p className="text-gray-600 text-sm">Premium feature coming soon - Get notified when available</p>
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 opacity-50 cursor-not-allowed"
                disabled
              >
                <CreditCard className="w-5 h-5" />
                <span>Launch Plaid</span>
              </button>
            </div>
            
            {/* Preview of connected accounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Checking Account</span>
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">Bank-level encryption</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Investment Account</span>
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">Real-time portfolio sync</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Credit Cards</span>
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">Automatic debt tracking</div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Input Section */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">
            {selectedPath ? 'Supplement with Additional Information' : 'Enter Your Financial Information'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income (after tax)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={financialData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || '')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5,000"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Expenses
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={financialData.monthlyExpenses}
                  onChange={(e) => handleInputChange('monthlyExpenses', parseFloat(e.target.value) || '')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="3,500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Debt
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={financialData.totalDebt}
                  onChange={(e) => handleInputChange('totalDebt', parseFloat(e.target.value) || '')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="25,000"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Fund
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={financialData.emergencyFund}
                  onChange={(e) => handleInputChange('emergencyFund', parseFloat(e.target.value) || '')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10,000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {healthScore !== null && (
          <div className="mt-8 space-y-6">
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Financial Health Analysis</h4>
              
              {/* Health Score */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">Financial Health Score</h5>
                    <p className="text-sm text-gray-600 mt-1">Based on your income, expenses, debt, and savings</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${
                      healthScore >= 80 ? 'text-green-600' :
                      healthScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthScore}
                    </div>
                    <div className="text-sm text-gray-600">out of 100</div>
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    {investmentCapacity > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">
                      Monthly savings: ${investmentCapacity?.toLocaleString() || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {financialData.emergencyFund / financialData.monthlyExpenses >= 3 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-700">
                      Emergency fund: {Math.round(financialData.emergencyFund / financialData.monthlyExpenses)} months of expenses
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {financialData.totalDebt / (financialData.monthlyIncome * 12) < 0.3 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-700">
                      Debt-to-income ratio: {Math.round((financialData.totalDebt / (financialData.monthlyIncome * 12)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Capacity */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h5 className="text-lg font-semibold text-gray-900 mb-3">Available for Investment</h5>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-800">
                      ${investmentCapacity?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">per month after expenses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">
                      ${(investmentCapacity * 12)?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600">per year</p>
                  </div>
                </div>
                
                {investmentCapacity > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      💡 <strong>Tip:</strong> Consider allocating this amount across retirement accounts (401k, IRA) 
                      and taxable investment accounts based on your goals.
                    </p>
                  </div>
                )}
              </div>

              {/* Next Step Indicator */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 font-medium">Ready for the next step?</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Your financial data will flow to Section 3 for portfolio analysis
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialFoundations;