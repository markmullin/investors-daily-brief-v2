import React from 'react';
import { Info, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

/**
 * Market Education and Analysis Component
 */
const MarketEducation = ({ sectorData, relationshipData, currentRelationship }) => {
  
  // Sector Performance Analysis
  const analyzeSectorPerformance = () => {
    if (!sectorData || sectorData.length === 0) return null;
    
    // Sort sectors by performance
    const sortedSectors = [...sectorData].sort((a, b) => b.change_p - a.change_p);
    const topPerformers = sortedSectors.slice(0, 3);
    const bottomPerformers = sortedSectors.slice(-3);
    
    // Determine market conditions based on sector performance
    const techSector = sectorData.find(s => s.symbol === 'XLK');
    const financialsSector = sectorData.find(s => s.symbol === 'XLF');
    const utilitiesSector = sectorData.find(s => s.symbol === 'XLU');
    const consumerDiscretionary = sectorData.find(s => s.symbol === 'XLY');
    const consumerStaples = sectorData.find(s => s.symbol === 'XLP');
    
    let marketCondition = 'neutral';
    let explanation = '';
    
    // Risk-on vs Risk-off analysis
    if (techSector && utilitiesSector) {
      const riskDiff = techSector.change_p - utilitiesSector.change_p;
      if (riskDiff > 2) {
        marketCondition = 'risk-on';
        explanation = 'Technology outperforming utilities suggests risk-on sentiment. Investors are confident and seeking growth.';
      } else if (riskDiff < -2) {
        marketCondition = 'risk-off';
        explanation = 'Utilities outperforming technology suggests defensive positioning. Investors are seeking safety.';
      }
    }
    
    // Economic cycle analysis
    let cyclePhase = 'unknown';
    if (consumerDiscretionary && consumerStaples) {
      const consumerRatio = consumerDiscretionary.change_p - consumerStaples.change_p;
      if (consumerRatio > 1) {
        cyclePhase = 'expansion';
      } else if (consumerRatio < -1) {
        cyclePhase = 'contraction';
      }
    }
    
    return {
      topPerformers,
      bottomPerformers,
      marketCondition,
      explanation,
      cyclePhase,
      analysis: {
        tech: techSector,
        financials: financialsSector,
        utilities: utilitiesSector,
        consumerDisc: consumerDiscretionary,
        consumerStaples: consumerStaples
      }
    };
  };
  
  // Key Relationships Analysis
  const analyzeRelationship = (relationshipId) => {
    const analyses = {
      'spy-vs-tlt': {
        title: 'Stocks vs Bonds Analysis',
        interpretation: {
          positive: 'When SPY outperforms TLT, it indicates risk-on sentiment. Investors are moving money from safe bonds to riskier stocks.',
          negative: 'When TLT outperforms SPY, it shows flight to safety. Economic concerns drive investors to government bonds.',
          neutral: 'Similar performance suggests market uncertainty. Neither risk assets nor safe havens are clearly preferred.'
        },
        signals: [
          'Divergence often precedes major market moves',
          'Both falling together may indicate liquidity crisis',
          'Both rising suggests abundant liquidity'
        ],
        tradingImplications: [
          'SPY > TLT: Consider growth stocks, cyclicals',
          'TLT > SPY: Consider defensive sectors, quality bonds',
          'Large divergence: Potential mean reversion opportunity'
        ]
      },
      'spy-vs-eem-vs-efa': {
        title: 'Global Equity Markets Analysis',
        interpretation: {
          spyLead: 'US outperformance shows American exceptionalism. Dollar strength and US tech dominance.',
          eemLead: 'Emerging markets outperformance indicates high global risk appetite. Weak dollar environment.',
          efaLead: 'Developed international markets leading suggests global recovery outside US.'
        },
        signals: [
          'EEM leading often marks late-cycle behavior',
          'SPY isolated strength may be unsustainable',
          'Convergence suggests synchronized global growth'
        ],
        tradingImplications: [
          'EEM > SPY: Consider commodities, international exposure',
          'SPY > EEM: Focus on US large-cap, technology',
          'All rising: Broad global equity exposure appropriate'
        ]
      },
      'ive-vs-ivw': {
        title: 'Value vs Growth Analysis',
        interpretation: {
          growthLead: 'Growth outperformance typical in low-rate environments. Innovation and future earnings valued.',
          valueLead: 'Value outperformance suggests economic recovery, rising rates, or late-cycle rotation.',
          neutral: 'Balanced performance indicates stable market without strong style preference.'
        },
        signals: [
          'Major style rotations often last 3-5 years',
          'Value leads at economic turning points',
          'Growth dominates during monetary expansion'
        ],
        tradingImplications: [
          'IVW > IVE: Focus on tech, healthcare, discretionary',
          'IVE > IVW: Consider financials, energy, industrials',
          'Rotation starting: Rebalance portfolio gradually'
        ]
      },
      'ibit-vs-gld': {
        title: 'Digital vs Traditional Store of Value',
        interpretation: {
          bitcoinLead: 'Bitcoin outperformance shows risk-on sentiment and technology adoption.',
          goldLead: 'Gold outperformance indicates traditional safe-haven demand and inflation concerns.',
          correlation: 'Both rising suggests currency debasement fears and inflation hedging.'
        },
        signals: [
          'Bitcoin more volatile but higher potential returns',
          'Gold more stable during market stress',
          'Divergence shows changing investor preferences'
        ],
        tradingImplications: [
          'IBIT > GLD: Risk-on, consider growth assets',
          'GLD > IBIT: Defensive positioning warranted',
          'Both rising: Hedge against currency devaluation'
        ]
      },
      'bnd-vs-jnk': {
        title: 'Credit Spread Analysis',
        interpretation: {
          tightening: 'JNK outperforming BND shows credit spread tightening. Risk appetite increasing.',
          widening: 'BND outperforming JNK indicates credit spread widening. Quality flight underway.',
          stable: 'Similar performance suggests stable credit conditions.'
        },
        signals: [
          'Spreads widen before recessions',
          'Tight spreads indicate late-cycle complacency',
          'Direction changes are more important than levels'
        ],
        tradingImplications: [
          'JNK > BND: Consider credit risk, high yield',
          'BND > JNK: Reduce credit exposure, quality focus',
          'Spreads widening: Defensive positioning'
        ]
      },
      'uso-vs-uup': {
        title: 'Commodity-Currency Dynamics',
        interpretation: {
          oilStrength: 'Oil outperforming dollar suggests inflationary pressures and commodity supercycle.',
          dollarStrength: 'Dollar outperforming oil indicates deflationary forces and US strength.',
          inverse: 'Traditional inverse relationship holding. Normal market dynamics.'
        },
        signals: [
          'Breaking correlation warns of regime change',
          'Both rising rare - usually unsustainable',
          'Oil leads inflation expectations'
        ],
        tradingImplications: [
          'USO > UUP: Commodity exposure, international assets',
          'UUP > USO: US assets, growth stocks',
          'Correlation breaking: Review all positions'
        ]
      },
      'xlp-vs-xly': {
        title: 'Consumer Behavior Analysis',
        interpretation: {
          discretionaryLead: 'XLY outperformance shows consumer confidence and economic expansion.',
          staplesLead: 'XLP outperformance indicates defensive positioning and economic concerns.',
          balanced: 'Similar performance suggests transitional economic phase.'
        },
        signals: [
          'XLY/XLP ratio predicts economic cycles',
          'Extreme readings mark turning points',
          'Consumer behavior leads broader economy'
        ],
        tradingImplications: [
          'XLY > XLP: Cyclical sectors, growth focus',
          'XLP > XLY: Defensive sectors, dividend stocks',
          'Ratio turning: Prepare for cycle change'
        ]
      },
      'smh-vs-xsw': {
        title: 'Technology Sector Dynamics',
        interpretation: {
          semiconductorLead: 'SMH outperformance indicates hardware cycle upturn and manufacturing strength.',
          softwareLead: 'XSW outperformance shows preference for recurring revenue and SaaS models.',
          synchronized: 'Both performing well suggests broad tech strength.'
        },
        signals: [
          'SMH more cyclical than XSW',
          'Software generally more defensive',
          'AI boom benefits both but hardware more'
        ],
        tradingImplications: [
          'SMH > XSW: Early cycle tech recovery',
          'XSW > SMH: Late cycle or defensive tech',
          'Both strong: Broad tech exposure'
        ]
      }
    };
    
    return analyses[relationshipId] || null;
  };
  
  const currentAnalysis = currentRelationship ? analyzeRelationship(currentRelationship.id) : null;
  const sectorAnalysis = analyzeSectorPerformance();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info className="text-blue-500" size={20} />
        Market Analysis & Education
      </h3>
      
      {/* Sector Performance Analysis */}
      {sectorAnalysis && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Sector Performance Analysis</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={18} />
                <span className="font-medium text-green-800">Top Performers</span>
              </div>
              {sectorAnalysis.topPerformers.map((sector, idx) => (
                <div key={idx} className="text-sm text-gray-700">
                  {sector.name}: <span className="font-medium text-green-600">+{sector.change_p.toFixed(2)}%</span>
                </div>
              ))}
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="text-red-600" size={18} />
                <span className="font-medium text-red-800">Bottom Performers</span>
              </div>
              {sectorAnalysis.bottomPerformers.map((sector, idx) => (
                <div key={idx} className="text-sm text-gray-700">
                  {sector.name}: <span className="font-medium text-red-600">{sector.change_p.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Market Condition: {sectorAnalysis.marketCondition.toUpperCase()}</h5>
            <p className="text-sm text-gray-700">{sectorAnalysis.explanation}</p>
            {sectorAnalysis.cyclePhase !== 'unknown' && (
              <p className="text-sm text-gray-700 mt-2">
                Economic Cycle Phase: <span className="font-medium">{sectorAnalysis.cyclePhase}</span>
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Relationship Analysis */}
      {currentAnalysis && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3">{currentAnalysis.title}</h4>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-800 mb-2">Interpretation</h5>
              {Object.entries(currentAnalysis.interpretation).map(([key, value]) => (
                <p key={key} className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">{key}:</span> {value}
                </p>
              ))}
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">Key Signals</h5>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {currentAnalysis.signals.map((signal, idx) => (
                  <li key={idx}>{signal}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">Trading Implications</h5>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {currentAnalysis.tradingImplications.map((implication, idx) => (
                  <li key={idx}>{implication}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketEducation;