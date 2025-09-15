import React, { useEffect, useRef } from 'react';
import './ReasoningStream.css';

const ReasoningStream = ({ thoughts = [], isActive = false }) => {
  const streamRef = useRef(null);
  const lastThoughtRef = useRef(null);

  // Auto-scroll to latest thought
  useEffect(() => {
    if (lastThoughtRef.current) {
      lastThoughtRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [thoughts]);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 1000) {
      return 'now';
    } else if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`;
    } else {
      return timestamp.toLocaleTimeString([], { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    }
  };

  const processThoughtContent = (content) => {
    // Clean up common AI reasoning artifacts
    let cleaned = content
      .replace(/^(Looking at|Analyzing|I need to|Let me|First,|Now,|Next,)/i, '')
      .replace(/\.\.\./g, '…')
      .trim();
    
    // Add appropriate punctuation if missing
    if (cleaned && !cleaned.match(/[.!?…]$/)) {
      cleaned += '…';
    }
    
    return cleaned;
  };

  const getThoughtIcon = (content, index) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('calculate') || lowerContent.includes('compute')) {
      return '🧮';
    } else if (lowerContent.includes('analyze') || lowerContent.includes('examining')) {
      return '🔍';
    } else if (lowerContent.includes('compare') || lowerContent.includes('versus')) {
      return '⚖️';
    } else if (lowerContent.includes('trend') || lowerContent.includes('pattern')) {
      return '📈';
    } else if (lowerContent.includes('risk') || lowerContent.includes('caution')) {
      return '⚠️';
    } else if (lowerContent.includes('opportunity') || lowerContent.includes('potential')) {
      return '💡';
    } else if (lowerContent.includes('conclusion') || lowerContent.includes('summary')) {
      return '🎯';
    } else {
      // Rotate through thinking icons
      const icons = ['🤔', '💭', '🧠', '🔬'];
      return icons[index % icons.length];
    }
  };

  return (
    <div className="reasoning-stream" ref={streamRef}>
      {thoughts.length === 0 && isActive && (
        <div className="stream-placeholder">
          <div className="pulse-dot"></div>
          <span>Waiting for AI thoughts...</span>
        </div>
      )}
      
      <div className="thoughts-container">
        {thoughts.map((thought, index) => {
          const processedContent = processThoughtContent(thought.content);
          const isLast = index === thoughts.length - 1;
          
          if (!processedContent) return null;
          
          return (
            <div
              key={thought.id}
              ref={isLast ? lastThoughtRef : null}
              className={`thought-bubble ${isLast && isActive ? 'active' : ''}`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="thought-header">
                <span className="thought-icon">
                  {getThoughtIcon(processedContent, index)}
                </span>
                <span className="thought-timestamp">
                  {formatTimestamp(thought.timestamp)}
                </span>
              </div>
              <div className="thought-content">
                {processedContent}
                {isLast && isActive && (
                  <span className="typing-cursor">|</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Active indicator */}
      {isActive && thoughts.length > 0 && (
        <div className="stream-status">
          <div className="thinking-indicator">
            <div className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>AI is still thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReasoningStream;