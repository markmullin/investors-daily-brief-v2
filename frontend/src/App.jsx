import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components
const LoginModal = lazy(() => import('./components/auth/LoginModal'));
const EnhancedHeader = lazy(() => import('./components/EnhancedHeader'));
const NavigationSystem = lazy(() => import('./components/NavigationSystem'));

// Lazy load pages
const MarketAwareness = lazy(() => import('./pages/MarketAwareness'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const StockAnalysisPage = lazy(() => import('./pages/StockAnalysisPage'));
const EndpointTest = lazy(() => import('./pages/EndpointTest'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary message="Application error occurred. Please refresh the page.">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<PageLoader />}>
              {/* Enhanced Header with Chatbot and Ticker */}
              <ErrorBoundary message="Header component error">
                <EnhancedHeader />
              </ErrorBoundary>

              {/* Navigation System */}
              <ErrorBoundary message="Navigation component error">
                <NavigationSystem />
              </ErrorBoundary>

              {/* Routes */}
              <ErrorBoundary message="Page loading error">
                <Routes>
                  <Route path="/" element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary message="Market Awareness page error">
                        <MarketAwareness />
                      </ErrorBoundary>
                    </Suspense>
                  } />
                  <Route path="/research" element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary message="Research page error">
                        <ResearchPage />
                      </ErrorBoundary>
                    </Suspense>
                  } />
                  <Route path="/research/stock/:symbol" element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary message="Stock Analysis page error">
                        <StockAnalysisPage />
                      </ErrorBoundary>
                    </Suspense>
                  } />
                  <Route path="/portfolio" element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary message="Portfolio page error">
                        <PortfolioPage />
                      </ErrorBoundary>
                    </Suspense>
                  } />
                  <Route path="/test" element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary message="Test page error">
                        <EndpointTest />
                      </ErrorBoundary>
                    </Suspense>
                  } />
                </Routes>
              </ErrorBoundary>

              {/* Login Modal - renders when showLoginModal is true */}
              <ErrorBoundary message="Login modal error">
                <LoginModal />
              </ErrorBoundary>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;