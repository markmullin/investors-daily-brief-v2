import { getStockData } from './stockService.js';

export const getMarketScore = async () => {
    try {
        // Get key market data
        const [spy, qqq, vix] = await Promise.all([
            getStockData('SPY'),
            getStockData('QQQ'),
            getStockData('VIX')
        ]);

        // Calculate component scores
        const technicalScore = calculateTechnicalScore(spy, qqq);
        const volatilityScore = calculateVolatilityScore(vix);
        const momentumScore = calculateMomentumScore(spy, qqq);

        // Calculate final score
        const finalScore = Math.round(
            (technicalScore * 0.4) + 
            (volatilityScore * 0.3) + 
            (momentumScore * 0.3)
        );

        return {
            overall: {
                score: finalScore,
                grade: getGradeFromScore(finalScore),
                timestamp: new Date().toISOString()
            },
            components: {
                technical: {
                    score: technicalScore,
                    grade: getGradeFromScore(technicalScore),
                    metrics: {
                        spyChange: spy.price.changePercent.toFixed(2),
                        qqqChange: qqq.price.changePercent.toFixed(2)
                    }
                },
                volatility: {
                    score: volatilityScore,
                    grade: getGradeFromScore(volatilityScore),
                    metrics: {
                        vixLevel: vix.price.current?.toFixed(2) || 'N/A'
                    }
                },
                momentum: {
                    score: momentumScore,
                    grade: getGradeFromScore(momentumScore),
                    metrics: {
                        spyVolume: (spy.price.volume > (spy.price.avgVolume || spy.price.volume)) ? 'Above Average' : 'Normal',
                        qqqVolume: (qqq.price.volume > (qqq.price.avgVolume || qqq.price.volume)) ? 'Above Average' : 'Normal'
                    }
                }
            },
            analysis: {
                summary: generateMarketSummary(finalScore, spy, vix),
                technicalAnalysis: generateTechnicalAnalysis(spy, qqq),
                riskAnalysis: generateRiskAnalysis(vix)
            }
        };
    } catch (error) {
        console.error('Error calculating market score:', error);
        throw error;
    }
};

const calculateTechnicalScore = (spy, qqq) => {
    // Weight both major indices
    const spyScore = 50 + (spy.price.changePercent * 5); // Base 50, ±5 points per percent
    const qqqScore = 50 + (qqq.price.changePercent * 5);
    
    // Average the scores and ensure within bounds
    return Math.min(100, Math.max(0, (spyScore * 0.6 + qqqScore * 0.4)));
};

const calculateVolatilityScore = (vix) => {
    const vixLevel = vix.price.current || 20;
    
    // Higher score for lower VIX (less volatility)
    if (vixLevel <= 15) return 90; // Very low volatility
    if (vixLevel <= 20) return 75; // Normal volatility
    if (vixLevel <= 25) return 60; // Elevated volatility
    if (vixLevel <= 30) return 45; // High volatility
    if (vixLevel <= 35) return 30; // Very high volatility
    return 15; // Extreme volatility
};

const calculateMomentumScore = (spy, qqq) => {
    // Consider price action and volume
    const spyMomentum = spy.price.changePercent * (spy.price.volume / (spy.price.avgVolume || spy.price.volume));
    const qqqMomentum = qqq.price.changePercent * (qqq.price.volume / (qqq.price.avgVolume || qqq.price.volume));
    
    // Base score of 50, adjust by momentum
    const baseScore = 50 + ((spyMomentum + qqqMomentum) * 2.5);
    return Math.min(100, Math.max(0, baseScore));
};

const generateMarketSummary = (score, spy, vix) => {
    const marketState = score >= 70 ? 'Bullish' :
                       score >= 50 ? 'Neutral' : 'Bearish';
    
    const vixLevel = vix.price.current || 20;
    const volatilityState = vixLevel <= 20 ? 'Low' :
                           vixLevel <= 30 ? 'Moderate' : 'High';
    
    return `Market conditions are ${marketState} with ${volatilityState} volatility. ` +
           `S&P 500 is ${spy.price.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(spy.price.changePercent).toFixed(2)}% ` +
           `with ${spy.price.volume > (spy.price.avgVolume || spy.price.volume) ? 'above average' : 'normal'} volume.`;
};

const generateTechnicalAnalysis = (spy, qqq) => {
    const spyStrength = Math.abs(spy.price.changePercent) >= 1 ? 'strong' : 'moderate';
    const qqqStrength = Math.abs(qqq.price.changePercent) >= 1 ? 'strong' : 'moderate';
    
    return `S&P 500 showing ${spyStrength} ${spy.price.changePercent >= 0 ? 'bullish' : 'bearish'} momentum. ` +
           `NASDAQ showing ${qqqStrength} ${qqq.price.changePercent >= 0 ? 'bullish' : 'bearish'} momentum.`;
};

const generateRiskAnalysis = (vix) => {
    const vixLevel = vix.price.current || 20;
    
    if (vixLevel <= 15) return 'Very low risk environment, market showing high confidence';
    if (vixLevel <= 20) return 'Normal risk environment, market functioning efficiently';
    if (vixLevel <= 25) return 'Slightly elevated risk, market showing some concern';
    if (vixLevel <= 30) return 'High risk environment, market showing significant concern';
    return 'Very high risk environment, market showing extreme caution';
};

const getGradeFromScore = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    if (score >= 45) return 'D';
    if (score >= 40) return 'D-';
    return 'F';
};
