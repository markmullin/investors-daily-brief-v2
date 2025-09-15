import React, { useState, useRef, useEffect } from 'react';
import './EducationIcon.css';

const EducationIcon = ({ context, data, onAnalysisRequest, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const iconRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  // Show tooltip after hover delay
  useEffect(() => {
    if (isHovered) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500); // 500ms delay before showing tooltip
    } else {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setShowTooltip(false);
    }

    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [isHovered]);

  const handleClick = async (event) => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      if (onAnalysisRequest) {
        // Pass the event to the handler
        await onAnalysisRequest(event, { context, data });
      }
    } catch (error) {
      console.error('Education analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getContextualTooltip = () => {
    const tooltips = {
      market_index: "Explain this market data to me",
      sector_rotation: "Help me understand sector rotation",
      technical_indicators: "What do these indicators mean?",
      portfolio_analysis: "Analyze my portfolio",
      macroeconomic: "Explain these economic indicators",
      default: "Explain this to me"
    };
    
    return tooltips[context] || tooltips.default;
  };

  return (
    <div className={`education-icon-container ${className}`}>
      <div
        ref={iconRef}
        className={`education-icon ${isHovered ? 'hovered' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={getContextualTooltip()}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <span className="graduate-emoji">
          {isAnalyzing ? (
            <div className="analyzing-spinner">🤔</div>
          ) : (
            '🎓'
          )}
        </span>
        
        {/* Gold shimmer effect */}
        <div className="shimmer-overlay"></div>
        
        {/* Pulsing ring for attention */}
        <div className="attention-ring"></div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && !isAnalyzing && (
        <div className="education-tooltip">
          {getContextualTooltip()}
          <div className="tooltip-arrow"></div>
        </div>
      )}
      
      {/* Loading state tooltip */}
      {isAnalyzing && (
        <div className="education-tooltip analyzing">
          AI is thinking...
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default EducationIcon;