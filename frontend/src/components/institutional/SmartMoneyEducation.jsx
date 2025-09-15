import React, { useState } from 'react';
import { GraduationCap, Info, TrendingUp, Shield, Target, Brain, BookOpen, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

const SmartMoneyEducation = ({ manager, isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState('philosophy');
  
  const educationalContent = {
    'Warren Buffett': {
      philosophy: {
        title: "Value Investing Philosophy",
        icon: <Brain className="w-5 h-5" />,
        content: [
          "Warren Buffett follows a 'buy and hold forever' approach, looking for companies with durable competitive advantages (moats).",
          "Key principles: Buy wonderful companies at fair prices, not fair companies at wonderful prices.",
          "Focuses on: Strong brands, pricing power, consistent earnings, and excellent management.",
          "Famous quote: 'Be fearful when others are greedy, and greedy when others are fearful.'"
        ],
        whyItWorks: "This approach has produced 20%+ annual returns over 50+ years by avoiding market timing and focusing on business quality."
      },
      typicalHoldings: {
        title: "What Buffett Buys",
        icon: <Target className="w-5 h-5" />,
        characteristics: [
          "Consumer brands everyone knows (Coca-Cola, Apple)",
          "Financial companies with competitive advantages (American Express)",
          "Businesses with predictable cash flows",
          "Companies with 'economic moats' - barriers to competition"
        ],
        avoidList: [
          "Technology companies he doesn't understand",
          "Highly leveraged businesses",
          "Companies without pricing power",
          "Speculative growth stocks"
        ]
      },
      riskReturn: {
        title: "Risk & Return Profile",
        icon: <Shield className="w-5 h-5" />,
        profile: "Low Risk, Steady Returns",
        explanation: "Buffett prioritizes capital preservation over high growth. His approach typically produces steady 15-20% annual returns with lower volatility than the market.",
        bestFor: [
          "Long-term investors (10+ year horizon)",
          "Those seeking wealth preservation",
          "Investors who want to sleep well at night",
          "People who understand business fundamentals"
        ]
      }
    },
    'Ray Dalio': {
      philosophy: {
        title: "All Weather Philosophy",
        icon: <Brain className="w-5 h-5" />,
        content: [
          "Ray Dalio created the 'All Weather' strategy to perform well in any economic environment.",
          "Uses 'risk parity' - balancing risk across asset classes rather than dollar amounts.",
          "Focuses on understanding economic 'machines' and cycles.",
          "Famous for 'Principles' - systematic decision-making rules."
        ],
        whyItWorks: "Diversification across uncorrelated assets provides steady returns regardless of economic conditions."
      },
      typicalHoldings: {
        title: "What Dalio Buys",
        icon: <Target className="w-5 h-5" />,
        characteristics: [
          "Stocks from multiple countries and sectors",
          "Government and corporate bonds",
          "Gold and commodities for inflation protection",
          "Emerging market exposure"
        ],
        avoidList: [
          "Concentrated single-stock bets",
          "Unhedged currency exposure",
          "Assets without fundamental value",
          "Illiquid investments"
        ]
      },
      riskReturn: {
        title: "Risk & Return Profile",
        icon: <Shield className="w-5 h-5" />,
        profile: "Moderate Risk, Consistent Returns",
        explanation: "The All Weather approach targets 10-12% returns with half the volatility of stocks alone.",
        bestFor: [
          "Investors worried about market crashes",
          "Those nearing retirement",
          "People who want global diversification",
          "Systematic, rules-based investors"
        ]
      }
    },
    'Cathie Wood': {
      philosophy: {
        title: "Disruptive Innovation Investing",
        icon: <Brain className="w-5 h-5" />,
        content: [
          "Cathie Wood focuses on companies creating or capitalizing on disruptive innovation.",
          "Key themes: Artificial Intelligence, Robotics, Genomics, Space Exploration, Blockchain.",
          "Believes in exponential growth curves for transformative technologies.",
          "Takes concentrated positions in high-conviction ideas."
        ],
        whyItWorks: "Catching disruptive trends early can produce explosive returns, though with high volatility."
      },
      typicalHoldings: {
        title: "What ARK Buys",
        icon: <Target className="w-5 h-5" />,
        characteristics: [
          "High-growth technology companies (Tesla, Roku)",
          "Genomics and biotech firms",
          "Cryptocurrency and blockchain plays",
          "Space and automation companies"
        ],
        avoidList: [
          "Traditional value stocks",
          "Dividend-paying utilities",
          "Mature, slow-growth businesses",
          "Companies resistant to innovation"
        ]
      },
      riskReturn: {
        title: "Risk & Return Profile", 
        icon: <Shield className="w-5 h-5" />,
        profile: "High Risk, High Potential Return",
        explanation: "ARK targets 40%+ annual returns but with extreme volatility. Funds can drop 50%+ in corrections.",
        bestFor: [
          "Young investors with high risk tolerance",
          "Those who understand technology trends",
          "Investors with 5-10+ year horizons",
          "People comfortable with volatility"
        ]
      }
    }
  };

  // Default content for managers not specifically defined
  const defaultContent = {
    philosophy: {
      title: "Investment Philosophy",
      icon: <Brain className="w-5 h-5" />,
      content: [
        `${manager} is a professional institutional investor with a sophisticated approach.`,
        "Institutional investors typically have access to research, data, and resources individual investors don't.",
        "They often take large positions and hold for extended periods.",
        "Following their trades can provide insights, but remember they have different goals and constraints than individual investors."
      ],
      whyItWorks: "Institutional investors have proven track records and professional analysis capabilities."
    },
    typicalHoldings: {
      title: "Typical Holdings",
      icon: <Target className="w-5 h-5" />,
      characteristics: [
        "Large-cap stocks with liquidity",
        "Positions sized for institutional portfolios",
        "Diversified across sectors",
        "Both growth and value opportunities"
      ],
      avoidList: [
        "Micro-cap stocks (too small)",
        "Highly speculative positions",
        "Investments requiring active management",
        "Illiquid positions"
      ]
    },
    riskReturn: {
      title: "Risk & Return Profile",
      icon: <Shield className="w-5 h-5" />,
      profile: "Varies by Manager",
      explanation: "Each institutional investor has different risk tolerances and return targets based on their mandate.",
      bestFor: [
        "Learning from professional strategies",
        "Understanding institutional thinking",
        "Diversifying investment ideas",
        "Long-term wealth building"
      ]
    }
  };

  const content = educationalContent[manager] || defaultContent;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Learn from {manager}</h2>
                <p className="text-indigo-100">Understanding institutional investment strategies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="space-y-4">
            {/* Philosophy Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'philosophy' ? null : 'philosophy')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  {content.philosophy.icon}
                  <h3 className="ml-3 font-semibold text-gray-900 text-lg">
                    {content.philosophy.title}
                  </h3>
                </div>
                {expandedSection === 'philosophy' ? 
                  <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                }
              </button>
              
              {expandedSection === 'philosophy' && (
                <div className="px-6 pb-6">
                  <div className="space-y-3">
                    {content.philosophy.content.map((point, index) => (
                      <p key={index} className="text-gray-700 leading-relaxed">
                        {point}
                      </p>
                    ))}
                  </div>
                  
                  {content.philosophy.whyItWorks && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700 mb-1">Why It Works:</p>
                      <p className="text-sm text-gray-700">{content.philosophy.whyItWorks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Typical Holdings Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'holdings' ? null : 'holdings')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  {content.typicalHoldings.icon}
                  <h3 className="ml-3 font-semibold text-gray-900 text-lg">
                    {content.typicalHoldings.title}
                  </h3>
                </div>
                {expandedSection === 'holdings' ? 
                  <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                }
              </button>
              
              {expandedSection === 'holdings' && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                        Typically Buys
                      </h4>
                      <ul className="space-y-2">
                        {content.typicalHoldings.characteristics.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                        Typically Avoids
                      </h4>
                      <ul className="space-y-2">
                        {content.typicalHoldings.avoidList.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Risk & Return Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'risk' ? null : 'risk')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  {content.riskReturn.icon}
                  <h3 className="ml-3 font-semibold text-gray-900 text-lg">
                    {content.riskReturn.title}
                  </h3>
                </div>
                {expandedSection === 'risk' ? 
                  <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                }
              </button>
              
              {expandedSection === 'risk' && (
                <div className="px-6 pb-6">
                  <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                    <p className="font-semibold text-green-700 text-lg">{content.riskReturn.profile}</p>
                    <p className="text-gray-700 mt-2">{content.riskReturn.explanation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      Best For These Investors:
                    </h4>
                    <ul className="space-y-2">
                      {content.riskReturn.bestFor.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Learning Resources */}
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
              Want to Learn More?
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Read {manager}'s shareholder letters or investment philosophy</p>
              <p>• Study their largest holdings and understand why they own them</p>
              <p>• Track their portfolio changes over time for insights</p>
              <p>• Remember: You don't need to copy exactly - adapt ideas to your situation</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-gray-600 flex items-start">
              <Info className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>
                Remember: Institutional investors have different goals, time horizons, and resources than individual investors. 
                Use their strategies as inspiration, not a blueprint. Always do your own research and consider your personal 
                financial situation before making investment decisions.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMoneyEducation;