import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, TrendingUp, PieChart, Search, Brain, CheckCircle, Zap } from 'lucide-react';

const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Your Investment Dashboard! 🎯",
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Transform your financial future with the most comprehensive investment platform designed for everyone.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll discover:</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Real-time market analysis explained in simple terms</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Professional-grade research tools anyone can use</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>AI-powered portfolio management and optimization</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Understanding the Dashboard Layout 📊",
      icon: PieChart,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Your dashboard has three powerful sections:</p>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">📰 Daily Market Brief</h4>
              <p className="text-sm text-blue-800">Your morning coffee companion - see what's happening in markets with AI explanations</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-1">🔍 Research Hub</h4>
              <p className="text-sm text-green-800">Deep dive into any company - from Apple to Tesla, with professional analysis tools</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-1">💼 Portfolio Management</h4>
              <p className="text-sm text-purple-800">Track your investments, get AI recommendations, and see what billionaires are buying</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How to Research Stocks 🔍",
      icon: Search,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Finding great investments is easy with our tools:</p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">1</span>
                <div>
                  <strong className="text-gray-900">Search Any Company:</strong>
                  <p className="text-sm text-gray-600 mt-1">Type a company name in the search bar to see detailed analysis</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">2</span>
                <div>
                  <strong className="text-gray-900">Use the Stock Screener:</strong>
                  <p className="text-sm text-gray-600 mt-1">Filter thousands of stocks by price, market cap, and performance</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">3</span>
                <div>
                  <strong className="text-gray-900">Check Fundamentals:</strong>
                  <p className="text-sm text-gray-600 mt-1">See which S&P 500 companies have the best growth and profits</p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>💡 Pro Tip:</strong> Start by researching companies you already know and use!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "AI-Powered Features 🤖",
      icon: Brain,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Our AI helps you invest smarter:</p>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Market Analysis</h4>
                <p className="text-sm text-gray-600">Complex market movements explained in simple English</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Portfolio Optimization</h4>
                <p className="text-sm text-gray-600">Get personalized recommendations based on your goals</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Smart Insights</h4>
                <p className="text-sm text-gray-600">See what institutional investors are buying and why</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
            <p className="text-purple-900 font-medium">
              Every number, chart, and recommendation is designed to help you make confident investment decisions.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Start Investing? 🚀",
      icon: Zap,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">You're all set to begin your investment journey!</p>
          
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">Your First Steps:</h4>
            <ol className="space-y-2 text-green-800">
              <li>1️⃣ Check today's market conditions in the Daily Brief</li>
              <li>2️⃣ Research a company you're interested in</li>
              <li>3️⃣ Upload your portfolio to get AI insights</li>
              <li>4️⃣ Set your financial goals for personalized advice</li>
            </ol>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-900">
              <strong>Remember:</strong> Investing is a marathon, not a sprint. Take your time to learn and make informed decisions.
            </p>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-gray-600 mb-2">Questions? Hover over any <strong>(?)</strong> icon for help!</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Start Exploring! 🎯
            </button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <CurrentIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-white/80 text-sm mt-1">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {steps[currentStep].content}
        </div>
        
        {/* Navigation */}
        <div className="p-6 border-t flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Get Started!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;