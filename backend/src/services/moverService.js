import fmpService from './fmpService.js';
import { getNewsAndSentiment } from './braveService.js';
const CACHE_DURATION = 60 * 1000; // 60 seconds
let moverCache = { data: null, timestamp: 0 };

export const getFocusedMover = async () => {
    // Check cache
    if (moverCache.data && Date.now() - moverCache.timestamp < CACHE_DURATION) {
        return moverCache.data;
    }

    try {
        // Fetch default stocks when API fails
        const defaultStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
        const defaultMover = {
            code: defaultStocks[Math.floor(Math.random() * defaultStocks.length)],
            price: 0,
            change: 0,
            change_p: 0,
            volume: 1000000
        };

        let marketMovers;
        try {
            // Get market movers from FMP API
            marketMovers = await fmpService.getGainers();
        } catch (error) {
            console.warn('Using default market mover due to API error:', error);
            marketMovers = [defaultMover];
        }

        // Ensure marketMovers is an array
        const moversArray = Array.isArray(marketMovers) ? marketMovers : 
                          Array.isArray(marketMovers.data) ? marketMovers.data : 
                          [defaultMover];

        // Get the most significant mover
        const significantMover = findSignificantMover(moversArray) || defaultMover;

        // Get company data with fallback
        let companyData = {};
        try {
            const profile = await fmpService.getCompanyProfile(significantMover.code || significantMover.symbol);
            companyData = profile?.[0] || {};
        } catch (error) {
            console.warn('Company data fetch failed:', error);
        }

        // Get news sentiment with fallback
        let newsSentiment;
        try {
            newsSentiment = await getNewsAndSentiment(`${significantMover.code} stock news`);
        } catch (error) {
            console.warn('News sentiment fetch failed:', error);
            newsSentiment = {
                sentiment: 'neutral',
                confidence: 0.5,
                topArticles: []
            };
        }

        // Build mover analysis with fallback values (adapted for FMP data structure)
        const moverAnalysis = {
            symbol: significantMover.symbol || significantMover.code,
            companyName: companyData?.companyName || significantMover.symbol || significantMover.code,
            price: {
                current: significantMover.price || 0,
                change: significantMover.change || 0,
                changePercent: significantMover.changesPercentage || significantMover.change_p || 0,
                volume: significantMover.volume || 0
            },
            company: {
                sector: companyData?.sector || 'Technology',
                industry: companyData?.industry || 'Software',
                marketCap: companyData?.mktCap || 'N/A',
                employees: companyData?.fullTimeEmployees || 'N/A'
            },
            analysis: {
                moveReason: analyzeMoveReason(significantMover, companyData),
                technicalSignals: analyzeTechnicalSignals(significantMover),
                riskLevel: assessRiskLevel(significantMover, companyData),
                sentiment: newsSentiment.sentiment,
                confidence: newsSentiment.confidence
            },
            news: newsSentiment.topArticles || []
        };

        // Update cache
        moverCache = {
            data: moverAnalysis,
            timestamp: Date.now()
        };

        return moverAnalysis;
    } catch (error) {
        console.error('Error fetching market mover:', error);
        if (moverCache.data) {
            return moverCache.data;
        }
        throw new Error('Failed to fetch market mover');
    }
};

const findSignificantMover = (movers) => {
    if (!Array.isArray(movers) || movers.length === 0) {
        return null;
    }

    return movers.find(mover => {
        if (!mover) return false;
        
        const hasSignificantVolume = (mover.volume || 0) > 1000000;
        const hasMeaningfulPrice = (mover.price || 0) > 10;
        const hasSignificantMove = Math.abs(mover.change_p || 0) > 5;

        return hasSignificantVolume && hasMeaningfulPrice && hasSignificantMove;
    });
};

const analyzeMoveReason = (mover, companyData) => {
    const reasons = [];

    try {
        if (Math.abs(mover?.change_p || 0) > 10) {
            reasons.push('Significant price movement indicates major market event');
        }

        if ((mover?.volume || 0) > ((mover?.volume_avg_60d || 0) * 3)) {
            reasons.push('Unusually high trading volume suggests strong market interest');
        }

        if (companyData?.Earnings?.EarningsDate) {
            const earningsDate = new Date(companyData.Earnings.EarningsDate);
            const today = new Date();
            const daysDiff = Math.abs((earningsDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 5) {
                reasons.push('Movement may be related to recent/upcoming earnings');
            }
        }
    } catch (error) {
        console.warn('Error analyzing move reasons:', error);
    }

    return reasons.length > 0 ? reasons : ['Analyzing market factors...'];
};

const analyzeTechnicalSignals = (mover) => {
    const signals = [];

    try {
        const sma50 = mover?.sma_50 || 0;
        const sma200 = mover?.sma_200 || 0;
        
        if (sma50 > sma200) {
            signals.push('Golden Cross (Bullish)');
        } else if (sma50 < sma200) {
            signals.push('Death Cross (Bearish)');
        }

        const rsi = mover?.rsi || 50;
        if (rsi < 30) {
            signals.push('Oversold conditions');
        } else if (rsi > 70) {
            signals.push('Overbought conditions');
        }

        if ((mover?.volume || 0) > ((mover?.volume_avg_60d || 0) * 2)) {
            signals.push('Unusual volume activity');
        }
    } catch (error) {
        console.warn('Error analyzing technical signals:', error);
    }

    return signals.length > 0 ? signals : ['Monitoring technical indicators...'];
};

const assessRiskLevel = (mover, companyData) => {
    let riskScore = 50; // Base risk score

    try {
        if (companyData?.Highlights?.Beta) {
            const beta = parseFloat(companyData.Highlights.Beta);
            if (!isNaN(beta)) {
                if (beta > 1.5) riskScore += 20;
                else if (beta < 0.75) riskScore -= 10;
            }
        }

        if (companyData?.Highlights?.MarketCapitalization) {
            const marketCap = parseFloat(companyData.Highlights.MarketCapitalization);
            if (!isNaN(marketCap)) {
                if (marketCap < 1000000000) riskScore += 15;
                else if (marketCap > 10000000000) riskScore -= 15;
            }
        }

        const movePercent = Math.abs(mover?.change_p || 0);
        if (movePercent > 20) riskScore += 25;
        else if (movePercent > 10) riskScore += 15;

    } catch (error) {
        console.warn('Error assessing risk level:', error);
    }

    if (riskScore >= 80) return 'Very High';
    if (riskScore >= 60) return 'High';
    if (riskScore >= 40) return 'Moderate';
    if (riskScore >= 20) return 'Low';
    return 'Very Low';
};

export default { getFocusedMover };
