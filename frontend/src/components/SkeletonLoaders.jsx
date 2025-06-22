import React from 'react';

// Base skeleton component
function SkeletonBase({ className = '', width = 'w-full', height = 'h-4', ...props }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
      {...props}
    />
  );
}

// Skeleton for market metric cards
export function MarketMetricSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <SkeletonBase width="w-16" height="h-4" />
        <SkeletonBase width="w-12" height="h-6" />
      </div>
      <div className="space-y-2">
        <SkeletonBase width="w-20" height="h-8" />
        <SkeletonBase width="w-16" height="h-4" />
      </div>
      <div className="mt-4">
        <SkeletonBase width="w-full" height="h-24" />
      </div>
    </div>
  );
}

// Skeleton for sector performance
export function SectorPerformanceSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <SkeletonBase width="w-32" height="h-6" className="mb-2" />
        <SkeletonBase width="w-48" height="h-4" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded">
            <div className="flex items-center space-x-3">
              <SkeletonBase width="w-8" height="h-8" className="rounded" />
              <div>
                <SkeletonBase width="w-24" height="h-4" className="mb-1" />
                <SkeletonBase width="w-16" height="h-3" />
              </div>
            </div>
            <div className="text-right">
              <SkeletonBase width="w-16" height="h-4" className="mb-1" />
              <SkeletonBase width="w-12" height="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for key insights
export function KeyInsightsSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <SkeletonBase width="w-28" height="h-6" className="mb-2" />
        <SkeletonBase width="w-full" height="h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 border border-gray-100 rounded">
            <SkeletonBase width="w-20" height="h-4" className="mb-2" />
            <SkeletonBase width="w-full" height="h-4" className="mb-1" />
            <SkeletonBase width="w-3/4" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for relationship analysis
export function RelationshipSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <SkeletonBase width="w-36" height="h-6" className="mb-2" />
        <SkeletonBase width="w-full" height="h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-3 border border-gray-100 rounded">
            <div className="flex justify-between items-center mb-2">
              <SkeletonBase width="w-24" height="h-4" />
              <SkeletonBase width="w-12" height="h-4" />
            </div>
            <SkeletonBase width="w-full" height="h-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for macro carousel
export function MacroCarouselSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <SkeletonBase width="w-40" height="h-6" className="mb-2" />
        <SkeletonBase width="w-full" height="h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-100 rounded">
            <div className="flex items-center justify-between mb-3">
              <SkeletonBase width="w-20" height="h-4" />
              <SkeletonBase width="w-8" height="h-4" />
            </div>
            <SkeletonBase width="w-16" height="h-6" className="mb-2" />
            <SkeletonBase width="w-24" height="h-3" className="mb-3" />
            <SkeletonBase width="w-full" height="h-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for news ticker
export function NewsTickerSkeleton() {
  return (
    <div className="bg-gray-900 text-white p-2">
      <div className="flex items-center space-x-8">
        <SkeletonBase width="w-24" height="h-4" className="bg-gray-700" />
        <div className="flex space-x-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonBase key={i} width="w-32" height="h-4" className="bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton for chart
export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`${height} flex items-center justify-center bg-gray-50 rounded border border-gray-200`}>
      <div className="text-center">
        <SkeletonBase width="w-16" height="h-16" className="mx-auto mb-2 rounded-full" />
        <SkeletonBase width="w-24" height="h-4" className="mx-auto" />
      </div>
    </div>
  );
}

// Error state component with retry
export function ErrorState({ 
  title = "Unable to load data", 
  message = "Something went wrong while loading this section.", 
  onRetry = null,
  showRetry = true 
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.684-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
      </div>
      <p className="text-sm text-red-700 mb-3">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}

// Refreshing indicator
export function RefreshingIndicator({ isRefreshing, className = "" }) {
  if (!isRefreshing) return null;
  
  return (
    <div className={`flex items-center space-x-2 text-sm text-blue-600 ${className}`}>
      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Refreshing...</span>
    </div>
  );
}

export default SkeletonBase;
