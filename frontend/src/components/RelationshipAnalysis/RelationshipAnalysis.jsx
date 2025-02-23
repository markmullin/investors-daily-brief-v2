import React, { useMemo } from 'react'
import { Info } from 'lucide-react'
import InfoTooltip from '../InfoTooltip'

const calculateTrend = (data, key) => {
    if (!data || data.length < 2) return 'neutral'
    
    // Ensure we're working with performance data in the correct format
    let values
    if (Array.isArray(data) && data[0]?.[key]) {
        // Handle direct performance data
        values = data.map(d => d[key]).filter(Boolean)
    } else if (data.performance && Array.isArray(data.performance)) {
        // Handle wrapped performance data
        values = data.performance.map(d => d[key]).filter(Boolean)
    } else {
        return 'neutral'
    }
    
    if (values.length < 2) return 'neutral'
    
    const first = values[0]
    const last = values[values.length - 1]
    const change = ((last - first) / Math.abs(first)) * 100
    
    if (change > 10) return 'strong up'
    if (change > 0) return 'up'
    if (change < -10) return 'strong down'
    if (change < 0) return 'down'
    return 'neutral'
}

const getRelationshipInsight = (type, trends) => {
    const insights = {
        tech: {
            title: "Semiconductor vs Software Relationship",
            description: "Real-time performance comparison between semiconductor and software sectors",
            analysis: (t) => {
                const semiPerf = t.etf1Price || ''
                const softPerf = t.etf2Price || ''
                
                if (!semiPerf && !softPerf) return "Analyzing semiconductor and software trends..."
                
                const semiStrength = semiPerf.toString().includes('strong')
                const softStrength = softPerf.toString().includes('strong')
                const semiUp = semiPerf.toString().includes('up')
                const softUp = softPerf.toString().includes('up')

                if (semiUp && softUp && semiStrength && softStrength)
                    return "Strong broad-based tech rally with both semiconductors and software showing powerful momentum. Indicates robust tech spending environment."
                if (semiUp && !softUp)
                    return "Semiconductor strength leading software - typically early cycle behavior suggesting potential tech sector acceleration ahead."
                if (!semiUp && softUp)
                    return "Software resilience despite semiconductor weakness - may indicate shift toward cloud/SaaS or late-cycle positioning."
                if (!semiUp && !softUp)
                    return "Tech sector under pressure with both semiconductors and software declining. Watch for semiconductor stabilization as potential bottom signal."
                return "Mixed tech sector performance - monitor semiconductor trends for directional cues."
            }
        },
        stocksBonds: {
            title: "Risk Asset Relationships",
            description: "Real-time analysis of stocks, investment grade, and high yield bonds",
            analysis: (t) => {
                const spyPerf = t?.pct_SPY || t?.etf1Price || ''
                const bndPerf = t?.pct_BND || t?.etf2Price || ''
                const jnkPerf = t?.pct_JNK || t?.etf3Price || ''
                
                if (!spyPerf || !bndPerf) return "Analyzing risk trends..."

                const stocksUp = spyPerf.toString().includes('up')
                const bondsUp = bndPerf.toString().includes('up')
                const junkUp = jnkPerf?.toString().includes('up')
                
                if (stocksUp && !bondsUp && junkUp)
                    return "Classic risk-on environment: stocks and high yield bonds rallying while Treasuries decline. Strong risk appetite suggests economic optimism."
                if (!stocksUp && bondsUp && !junkUp)
                    return "Clear risk-off signal with Treasuries outperforming both stocks and junk bonds. Traditional flight to safety pattern emerging."
                if (stocksUp && bondsUp)
                    return "Unusual strength across both stocks and bonds suggests strong liquidity environment. Watch Fed policy for direction."
                if (!stocksUp && !bondsUp)
                    return "Broad market pressure across risk assets. Monitor credit spreads and liquidity conditions."
                return "Mixed signals between stocks and bonds - focus on credit spread trends for risk appetite cues."
            }
        },
        alternativeAssets: {
            title: "Bitcoin vs Gold Dynamic",
            description: "Real-time comparison of digital and traditional safe havens",
            analysis: (t) => {
                const btcPerf = t?.pct_IBIT || t?.etf1Price || ''
                const goldPerf = t?.pct_GLD || t?.etf2Price || ''
                
                if (!btcPerf && !goldPerf) return "Analyzing alternative asset trends..."
                
                const btcStrong = btcPerf.toString().includes('strong')
                const goldStrong = goldPerf.toString().includes('strong')
                const btcUp = btcPerf.toString().includes('up')
                const goldUp = goldPerf.toString().includes('up')

                if (btcUp && !goldUp && btcStrong)
                    return "Bitcoin showing significant outperformance vs gold - indicates strong risk appetite and potential shift in safe haven preferences."
                if (!btcUp && goldUp && goldStrong)
                    return "Gold's strong outperformance vs Bitcoin suggests traditional safe haven demand dominating. Watch for geopolitical or market stress catalysts."
                if (btcUp && goldUp)
                    return "Both Bitcoin and gold rising together - unusual pattern suggesting broad hedging demand. Monitor inflation expectations."
                if (!btcUp && !goldUp)
                    return "Weakness in both assets hints at reduced need for safe havens. Watch real rates and dollar strength."
                return "Mixed safe haven performance - track institutional flows for preference shifts."
            }
        },
        commodityCurrency: {
            title: "Oil-Dollar Relationship",
            description: "Real-time analysis of oil prices vs dollar strength",
            analysis: (t) => {
                const oilPerf = t?.pct_USO || t?.etf1Price || ''
                const dollarPerf = t?.pct_UUP || t?.etf2Price || ''
                
                if (!oilPerf && !dollarPerf) return "Analyzing oil-dollar dynamics..."
                
                const oilStrong = oilPerf.toString().includes('strong')
                const dollarStrong = dollarPerf.toString().includes('strong')
                const oilUp = oilPerf.toString().includes('up')
                const dollarUp = dollarPerf.toString().includes('up')

                if (oilUp && !dollarUp && oilStrong)
                    return "Strong oil rally with dollar weakness - classic inverse relationship suggesting commodity strength and possible inflationary pressures."
                if (!oilUp && dollarUp && dollarStrong)
                    return "Dollar strength creating significant headwind for oil prices. Watch for impacts on energy sector margins."
                if (oilUp && dollarUp)
                    return "Unusual strength in both oil and dollar suggests potential supply constraints or geopolitical premium in oil."
                if (!oilUp && !dollarUp)
                    return "Both oil and dollar declining may indicate global growth concerns. Monitor economic data for confirmation."
                return "Complex oil-dollar dynamics - watch OPEC+ decisions and Fed policy for direction."
            }
        },
        globalMarkets: {
            title: "Global Market Interactions",
            description: "Real-time analysis of emerging vs developed markets and dollar impact",
            analysis: (t) => {
                const emPerf = t?.pct_EEM || t?.etf1Price || ''
                const dmPerf = t?.pct_EFA || t?.etf2Price || ''
                const dollarPerf = t?.pct_UUP || t?.etf3Price || ''
                
                if (!emPerf && !dmPerf) return "Analyzing global market trends..."
                
                const emStrong = emPerf.toString().includes('strong')
                const dmStrong = dmPerf.toString().includes('strong')
                const emUp = emPerf.toString().includes('up')
                const dmUp = dmPerf.toString().includes('up')
                const dollarUp = dollarPerf?.toString().includes('up')

                if (emUp && dmUp && !dollarUp)
                    return "Global equity rally with dollar weakness - optimal environment for international assets. Strong risk appetite signal."
                if (!emUp && dollarUp)
                    return "Emerging markets underperforming with dollar strength - classic pressure pattern. Watch for stress in dollar-denominated debt."
                if (dmUp && !emUp)
                    return "Developed markets outperforming emerging - suggests defensive positioning and flight to quality."
                if (!emUp && !dmUp)
                    return "Broad global market weakness - watch central bank policies and currency volatility."
                return "Mixed global equity performance - monitor currency trends for direction."
            }
        },
        yields: {
            title: "Treasury Yield Dynamics",
            description: "Real-time analysis of Treasury yield curve movements",
            analysis: (t) => {
                const shortPerf = t?.pct_SHY || t?.etf1Price || ''
                const medPerf = t?.pct_IEF || t?.etf2Price || ''
                const longPerf = t?.pct_TLT || t?.etf3Price || ''
                
                if (!shortPerf && !longPerf) return "Analyzing yield trends..."
                
                const shortUp = shortPerf.toString().includes('up')
                const medUp = medPerf?.toString().includes('up')
                const longUp = longPerf.toString().includes('up')

                if (!longUp && shortUp)
                    return "Long bonds underperforming short duration - indicates rising rate expectations. Watch for economic growth implications."
                if (longUp && !shortUp)
                    return "Long bonds outperforming short duration - suggests falling rate expectations or flight to quality moves."
                if (longUp && medUp && shortUp)
                    return "Rally across the curve - likely indicates broad expectations for Fed dovishness or economic concerns."
                if (!longUp && !shortUp)
                    return "Weakness across Treasury curve - watch for inflation implications and Fed policy shifts."
                return "Complex yield curve movements - monitor Fed commentary and economic data."
            }
        }
    }

    const defaultInsight = {
        title: "Market Relationship Analysis",
        description: "Analysis of key market relationships and their implications",
        analysis: () => "Monitor correlation changes for regime shift signals."
    }

    const insight = insights[type] || defaultInsight
    return {
        ...insight,
        analysis: () => insight.analysis(trends)
    }
}

const RelationshipAnalysis = ({ type, data, dataKeys }) => {
    const trends = useMemo(() => {
        const trendData = {}
        if (dataKeys && data) {
            // Handle both direct performance data and wrapped performance data
            const performanceData = data.performance || data
            
            Object.entries(dataKeys).forEach(([key, value]) => {
                // Try both the direct key and the pct_ prefixed version
                const trendValue = calculateTrend(performanceData, value) || 
                                 calculateTrend(performanceData, `pct_${value}`)
                trendData[key] = trendValue
            })
        }
        return trendData
    }, [data, dataKeys])

    const insight = getRelationshipInsight(type, trends)

    return (
        <div className="mt-4 text-sm">
            <div className="flex items-center gap-2 mb-2">
                <InfoTooltip 
                    basicContent={(
                        <div>
                            <p className="mb-2"><strong>Current Market Signal:</strong></p>
                            {type === 'tech' ? (
                                <div>
                                    <p className="mb-2">Semiconductor vs Software Performance:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Semis leading: Early cycle bullish signal</li>
                                        <li>Software leading: Late cycle indicator</li>
                                        <li>Both strong: Tech spending growth</li>
                                        <li>Both weak: Tech spending caution</li>
                                    </ul>
                                </div>
                            ) : type === 'stocksBonds' ? (
                                <div>
                                    <p className="mb-2">Risk Asset Dynamics:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Stocks {`>`} Bonds: Risk seeking</li>
                                        <li>Bonds {`>`} Stocks: Risk aversion</li>
                                        <li>Both up: Liquidity driven</li>
                                        <li>Both down: Tightening impact</li>
                                    </ul>
                                </div>
                            ) : type === 'alternativeAssets' ? (
                                <div>
                                    <p className="mb-2">Bitcoin vs Gold Performance:</p>
                                    <ul className="list-disc pl-4">
                                        <li>BTC {`>`} Gold: Digital preference</li>
                                        <li>Gold {`>`} BTC: Traditional safety</li>
                                        <li>Both up: Broad hedging</li>
                                        <li>Both down: Risk tolerance</li>
                                    </ul>
                                </div>
                            ) : type === 'commodityCurrency' ? (
                                <div>
                                    <p className="mb-2">Oil vs Dollar Impact:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Oil up/USD down: Classic inverse</li>
                                        <li>Both up: Supply driven</li>
                                        <li>Both down: Growth concerns</li>
                                        <li>Oil down/USD up: Currency pressure</li>
                                    </ul>
                                </div>
                            ) : type === 'globalMarkets' ? (
                                <div>
                                    <p className="mb-2">Global Market Dynamics:</p>
                                    <ul className="list-disc pl-4">
                                        <li>EM {`>`} DM: Growth confidence</li>
                                        <li>DM {`>`} EM: Safety preference</li>
                                        <li>Both up: Global expansion</li>
                                        <li>Both down: Global risks</li>
                                    </ul>
                                </div>
                            ) : type === 'yields' ? (
                                <div>
                                    <p className="mb-2">Treasury Curve Signals:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Long end leading: Rate optimism</li>
                                        <li>Short end leading: Rate pressure</li>
                                        <li>Curve steepening: Growth hopes</li>
                                        <li>Curve flattening: Growth fears</li>
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    )}
                    advancedContent={(
                        <div>
                            <p className="mb-2"><strong>Technical Implications:</strong></p>
                            {type === 'tech' && (
                                <div>
                                    <p className="mb-2">Key Indicators:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Semi book-to-bill trends</li>
                                        <li>Software earnings revisions</li>
                                        <li>Relative strength ratios</li>
                                        <li>Volume trends by sector</li>
                                    </ul>
                                </div>
                            ) || type === 'stocksBonds' && (
                                <div>
                                    <p className="mb-2">Market Mechanics:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Credit spread dynamics</li>
                                        <li>Real yield impacts</li>
                                        <li>Fund flow analysis</li>
                                        <li>Volatility regime shifts</li>
                                    </ul>
                                </div>
                            ) || type === 'alternativeAssets' && (
                                <div>
                                    <p className="mb-2">Flow Analysis:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Institutional positioning</li>
                                        <li>Correlation breakdowns</li>
                                        <li>Volume pattern shifts</li>
                                        <li>Momentum divergences</li>
                                    </ul>
                                </div>
                            ) || type === 'commodityCurrency' && (
                                <div>
                                    <p className="mb-2">Market Factors:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Supply/demand metrics</li>
                                        <li>Inventory levels</li>
                                        <li>Rate differential impacts</li>
                                        <li>Positioning extremes</li>
                                    </ul>
                                </div>
                            ) || type === 'globalMarkets' && (
                                <div>
                                    <p className="mb-2">Global Flows:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Currency impacts</li>
                                        <li>Policy divergences</li>
                                        <li>Capital flow trends</li>
                                        <li>Correlation regimes</li>
                                    </ul>
                                </div>
                            ) || type === 'yields' && (
                                <div>
                                    <p className="mb-2">Rate Analysis:</p>
                                    <ul className="list-disc pl-4">
                                        <li>Curve shape dynamics</li>
                                        <li>Real rate implications</li>
                                        <li>Policy expectations</li>
                                        <li>Term premium trends</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                >
                    <Info className="text-blue-500" size={16} />
                </InfoTooltip>
                <span className="font-medium">{insight.title}</span>
            </div>
            <p className="text-gray-800">{insight.analysis()}</p>
        </div>
    )
}

export default RelationshipAnalysis