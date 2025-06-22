import React from 'react';

/**
 * Time Period Selector Component
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
    <div className={`flex gap-1 ${className}`}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
            selectedPeriod === period.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default TimePeriodSelector;