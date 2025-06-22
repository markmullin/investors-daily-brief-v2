/**
 * Market Environment Service
 * Provides data about overall market conditions
 */

// Generate synthetic market environment score and components
export const generateMarketEnvironmentData = () => {
  const score = 55 + Math.floor(Math.random() * 20) - 10; // Random score between 45-65
  const technicalScore = score + Math.floor(Math.random() * 14) - 7;
  const breadthScore = score + Math.floor(Math.random() * 14) - 7;
  const sentimentScore = score + Math.floor(Math.random() * 14) - 7;
  
  const getGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D+';
    if (score >= 20) return 'D';
    return 'F';
  };
  
  return {
    overallScore: score,
    components: {
      technical: technicalScore,
      technicalGrade: getGrade(technicalScore),
      breadth: breadthScore,
      breadthGrade: getGrade(breadthScore),
      sentiment: sentimentScore,
      sentimentGrade: getGrade(sentimentScore),
    },
    analysis: {
      basic: `The market is currently showing ${score > 60 ? 'positive' : score < 40 ? 'negative' : 'mixed'} signals with ${score > 60 ? 'favorable' : score < 40 ? 'challenging' : 'balanced'} risk and opportunity.`,
      advanced: `Technical indicators suggest a ${technicalScore > 60 ? 'bullish' : technicalScore < 40 ? 'bearish' : 'neutral'} market stance with ${technicalScore > 60 ? 'strong' : technicalScore < 40 ? 'weak' : 'moderate'} momentum. Breadth measures indicate ${breadthScore > 60 ? 'broad' : breadthScore < 40 ? 'narrow' : 'balanced'} participation across sectors. Sentiment indicators reflect ${sentimentScore > 60 ? 'optimism' : sentimentScore < 40 ? 'pessimism' : 'caution'} among market participants.`
    }
  };
};

export default {
  generateMarketEnvironmentData
};