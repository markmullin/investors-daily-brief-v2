import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, PieChart, AlertCircle, CheckCircle, Target, Calculator, User, Save, Edit2 } from 'lucide-react';

const UserProfile = ({ isOpen, onClose, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Info
    name: user?.name || '',
    email: user?.email || '',
    
    // Financial Snapshot
    monthlyIncome: '',
    monthlyExpenses: '',
    totalDebt: '',
    emergencyFund: '',
    netWorth: '',
    
    // Investment Profile
    riskTolerance: 'moderate', // conservative, moderate, aggressive
    investmentHorizon: '5-10', // <2, 2-5, 5-10, 10-20, 20+
    investmentGoals: [],
    
    // Goals
    retirementAge: '',
    retirementTarget: '',
    monthlyInvestment: '',
  });

  const [compoundData, setCompoundData] = useState({
    initialAmount: 0,
    monthlyContribution: 0,
    annualReturn: 7,
    years: 30,
    futureValue: 0
  });

  // Load saved profile data
  useEffect(() => {
    if (user?.id) {
      const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
        updateCompoundCalculations(parsed);
      }
    }
  }, [user]);

  // Calculate compound interest
  const calculateCompoundInterest = (initial, monthly, rate, years) => {
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    
    // Future value of initial investment
    const futureInitial = initial * Math.pow(1 + rate / 100, years);
    
    // Future value of monthly contributions
    const futureMonthly = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    return futureInitial + futureMonthly;
  };

  // Update compound calculations when profile data changes
  const updateCompoundCalculations = (data) => {
    const initial = parseFloat(data.emergencyFund) || 0;
    const monthly = parseFloat(data.monthlyInvestment) || 
                   Math.max(0, (parseFloat(data.monthlyIncome) || 0) - (parseFloat(data.monthlyExpenses) || 0)) * 0.2;
    const years = data.investmentHorizon === '<2' ? 2 : 
                  data.investmentHorizon === '2-5' ? 5 :
                  data.investmentHorizon === '5-10' ? 10 :
                  data.investmentHorizon === '10-20' ? 15 : 25;
    
    const futureValue = calculateCompoundInterest(initial, monthly, 7, years);
    
    setCompoundData({
      initialAmount: initial,
      monthlyContribution: monthly,
      annualReturn: 7,
      years: years,
      futureValue: futureValue
    });
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    const newData = { ...profileData, [field]: value };
    setProfileData(newData);
    updateCompoundCalculations(newData);
  };

  // Save profile
  const handleSave = () => {
    if (user?.id) {
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(profileData));
      setIsEditing(false);
      console.log('✅ Profile saved successfully');
    }
  };

  // Calculate financial health score
  const calculateHealthScore = () => {
    const { monthlyIncome, monthlyExpenses, totalDebt, emergencyFund } = profileData;
    
    if (!monthlyIncome || !monthlyExpenses) return null;
    
    let score = 50;
    
    // Savings rate
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
  const monthlyInvestmentCapacity = profileData.monthlyIncome && profileData.monthlyExpenses 
    ? Math.max(0, profileData.monthlyIncome - profileData.monthlyExpenses)
    : 0;

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Financial Profile</h2>
                <p className="text-blue-100">Manage your financial data and goals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Edit/Save Toggle */}
          <div className="flex justify-end">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Financial Health Score */}
          {healthScore !== null && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Financial Health Score
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-4 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${healthScore}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          healthScore >= 70 ? 'bg-green-500' : 
                          healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-2xl font-bold text-gray-900">
                  {healthScore}/100
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {healthScore >= 70 ? 'Excellent financial health!' :
                 healthScore >= 40 ? 'Good progress, room for improvement' :
                 'Focus on building emergency fund and reducing debt'}
              </p>
            </div>
          )}

          {/* Financial Snapshot */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Financial Snapshot
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                <input
                  type="number"
                  value={profileData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
                <input
                  type="number"
                  value={profileData.monthlyExpenses}
                  onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Debt</label>
                <input
                  type="number"
                  value={profileData.totalDebt}
                  onChange={(e) => handleInputChange('totalDebt', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Fund</label>
                <input
                  type="number"
                  value={profileData.emergencyFund}
                  onChange={(e) => handleInputChange('emergencyFund', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="$0"
                />
              </div>
            </div>
            {monthlyInvestmentCapacity > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  💰 Monthly investment capacity: <strong>{formatCurrency(monthlyInvestmentCapacity)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Investment Profile */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Investment Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
                <select
                  value={profileData.riskTolerance}
                  onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investment Horizon</label>
                <select
                  value={profileData.investmentHorizon}
                  onChange={(e) => handleInputChange('investmentHorizon', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="<2">Less than 2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10-20">10-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retirement Age Target</label>
                <input
                  type="number"
                  value={profileData.retirementAge}
                  onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="65"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Investment Goal</label>
                <input
                  type="number"
                  value={profileData.monthlyInvestment}
                  onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="$500"
                />
              </div>
            </div>
          </div>

          {/* Compound Interest Calculator */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-purple-600" />
              Compound Interest Projection
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Initial Investment</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(compoundData.initialAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Monthly Contribution</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(compoundData.monthlyContribution)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Time Horizon</label>
                    <p className="text-lg font-semibold text-gray-900">{compoundData.years} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expected Return</label>
                    <p className="text-lg font-semibold text-gray-900">{compoundData.annualReturn}% annually</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="bg-white rounded-lg p-6 text-center border border-purple-300">
                  <p className="text-sm text-gray-600 mb-2">Future Value</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(compoundData.futureValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Total Contributions: {formatCurrency(compoundData.initialAmount + (compoundData.monthlyContribution * 12 * compoundData.years))}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-800">
                💡 Based on your financial snapshot and investment horizon. Adjust your monthly investment goal to see different projections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;