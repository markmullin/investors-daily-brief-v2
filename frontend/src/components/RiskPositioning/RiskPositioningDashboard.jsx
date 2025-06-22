/**
 * Risk Positioning Dashboard - Main Container
 * FIXED: Handles elegant calculating state and stable scoring
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RiskPositioningGauge from './RiskPositioningGauge';

const RiskPositioningDashboard = ({ 
  userId = null, 
  userProfile = null,
  className = '' 
}) => {
  const [currentScore, setCurrentScore] = useState(null); // Start with null for elegant loading

  // Handle score changes from the gauge
  const handleScoreChange = (score, riskData) => {
    // Only update if we have a valid score (not during calculating state)
    if (score && typeof score === 'number') {
      setCurrentScore(score);
      
      // Trigger notifications for significant changes
      if (currentScore && Math.abs(score - currentScore) > 10) {
        console.log(`Significant risk score change: ${currentScore} → ${score}`);
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Main Risk Gauge with Elegant Calculating State */}
      <RiskPositioningGauge
        userId={userId}
        onScoreChange={handleScoreChange}
        className="col-span-full"
      />
    </div>
  );
};

export default RiskPositioningDashboard;