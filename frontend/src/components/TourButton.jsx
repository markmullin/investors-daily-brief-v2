import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const TourButton = () => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: "Welcome to Investor's Daily Brief",
      content: "This dashboard provides a comprehensive view of market conditions, trends, and analysis. Let's take a tour of its features.",
      target: "body"
    },
    {
      title: "Market Metrics",
      content: "This section shows the performance of major market indices. Click on any card to see detailed historical charts and information.",
      target: ".market-metrics"
    },
    {
      title: "Market Environment",
      content: "Get a quick overview of the current market environment with scores for technical, breadth, and sentiment factors.",
      target: ".market-environment"
    },
    {
      title: "Sector Performance",
      content: "See which sectors are leading or lagging in the current market environment.",
      target: ".sector-performance"
    },
    {
      title: "Advanced Analysis",
      content: "Toggle between Basic and Advanced views for more detailed market analysis.",
      target: ".view-toggle"
    }
  ];

  const startTour = () => {
    setCurrentStep(0);
    setShowTour(true);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTour(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <button
        onClick={startTour}
        className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-gray-800 text-white text-sm font-medium
                 hover:bg-gray-900 transition-colors"
      >
        <HelpCircle size={16} />
        <span>Dashboard Tour</span>
      </button>

      {showTour && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{tourSteps[currentStep].title}</h3>
              <button onClick={() => setShowTour(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">{tourSteps[currentStep].content}</p>
            
            <div className="flex justify-between">
              <button 
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-gray-900' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextStep}
                className="px-4 py-2 rounded bg-gray-900 text-white"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TourButton;