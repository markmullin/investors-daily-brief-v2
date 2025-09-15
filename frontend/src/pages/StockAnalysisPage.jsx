import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Share } from 'lucide-react';
import StockAnalysisContent from '../components/StockAnalysisContent';
import { marketApi } from '../services/api';

/**
 * StockAnalysisPage - Full-page Bloomberg Terminal-grade Stock Analysis
 * 
 * This page provides the complete stock analysis experience in a dedicated full-page view.
 * Uses the same StockAnalysisContent component as the modal for consistency.
 * 
 * Route: /research/stock/:symbol
 * Features:
 * - Full-page Bloomberg Terminal-grade analysis
 * - All 4 analysis tabs (Overview, Financials, Growth, Valuation)
 * - Navigation back to research page
 * - Breadcrumb navigation
 * - Share functionality
 */
const StockAnalysisPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStock = async () => {
      if (!symbol) {
        setError('No symbol provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching stock data for full-page analysis:', symbol);
        const stockData = await marketApi.getQuote(symbol.toUpperCase());
        
        setStock(stockData);
      } catch (err) {
        console.error('Error fetching stock for full-page analysis:', err);
        setError(`Failed to load data for ${symbol.toUpperCase()}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [symbol]);

  const handleBack = () => {
    navigate('/research');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${symbol?.toUpperCase()} Analysis`,
          text: `Check out this Bloomberg Terminal-grade analysis of ${symbol?.toUpperCase()}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      // Fallback to clipboard
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // You could add a toast notification here
      console.log('URL copied to clipboard');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Research</span>
              </button>
              <span className="text-gray-400">•</span>
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                <span className="text-gray-600">Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading stock analysis...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Research</span>
              </button>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Error</span>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center py-12">
              <div className="text-red-500 text-lg font-semibold mb-2">Unable to Load Stock Data</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Research
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Research</span>
              </button>
              <span className="text-gray-400">•</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{symbol?.toUpperCase()}</span>
                <span className="text-gray-600">Analysis</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share size={16} />
                <span className="text-sm">Share</span>
              </button>
              
              <button
                onClick={() => window.open(`/research/stock/${symbol}`, '_blank')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExternalLink size={16} />
                <span className="text-sm">Open in New Tab</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <StockAnalysisContent
          stock={stock}
          isFullPage={true}
          className="rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default StockAnalysisPage;