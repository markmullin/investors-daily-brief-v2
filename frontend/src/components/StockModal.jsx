import React from 'react';
import { X } from 'lucide-react';
import StockAnalysisContent from './StockAnalysisContent';

/**
 * StockModal - Modal wrapper for Bloomberg Terminal-grade Stock Analysis
 * 
 * This modal now uses the extracted StockAnalysisContent component for consistency
 * with the full-page analysis view. The modal provides the overlay and close functionality
 * while the analysis content is handled by the reusable component.
 * 
 * Props:
 * - stock: Stock data object
 * - onClose: Function to close the modal
 * - isOpen: Boolean to control modal visibility (optional)
 */
const StockModal = ({ stock, onClose, isOpen = true }) => {
  // Don't render if not open or no stock
  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-7xl m-4 max-h-[95vh] overflow-y-auto">
        <div className="relative">
          {/* Close Button - Positioned absolutely over the content */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-sm"
          >
            <X size={24} />
          </button>
          
          {/* Stock Analysis Content */}
          <StockAnalysisContent
            stock={stock}
            isFullPage={false}
            className="rounded-lg shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default StockModal;