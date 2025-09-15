import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, ArrowRight } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  requirePremium = false, 
  fallback = null,
  onAuthRequired = null,
  featureName = "this feature"
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking access...</span>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Sign in to access {featureName}
          </h3>
          <p className="text-gray-600 mb-6">
            Create a free account to unlock this feature and save your progress
          </p>
          <button
            onClick={onAuthRequired}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 font-medium"
          >
            <span>Sign In or Create Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p className="font-medium">What you'll get:</p>
            <div className="flex items-center justify-center space-x-4">
              <span>✓ Save portfolios</span>
              <span>✓ Track goals</span>
              <span>✓ AI insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check premium requirement
  if (requirePremium && user?.tier !== 'premium') {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-600 mb-6">
            Upgrade to premium to access {featureName} and unlock all advanced features
          </p>
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors inline-flex items-center space-x-2 font-medium"
          >
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Starting at $19/month
          </p>
        </div>
      </div>
    );
  }

  // User has access
  return children;
};

export default ProtectedRoute;