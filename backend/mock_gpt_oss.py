"""
Mock GPT-OSS Service - For testing without GPU/Model
This simulates GPT-OSS responses for development
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:5173'])

# Pre-written insights for different analysis types
INSIGHTS = {
    'marketPhase': [
        "Market breadth indicators suggest cautious optimism with 60% of stocks above their 50-day moving average. The VIX remains subdued below 20, indicating lower volatility expectations. However, watch for potential resistance at current levels as indices approach recent highs. Focus on quality growth names with strong earnings momentum.",
        "Current market conditions reflect a transitional phase with mixed signals across sectors. While technology maintains leadership, defensive rotations into utilities and staples suggest underlying caution. The moderate VIX level around 20 warrants selective positioning. Consider balanced exposure between growth and value until clearer trends emerge.",
        "Strong bullish momentum continues with broad participation across market caps. Low volatility and positive breadth readings support risk-on positioning. The sustained uptrend above key moving averages favors growth-oriented strategies. However, monitor for potential profit-taking as indices reach overbought conditions.",
    ],
    'marketIndices': [
        "The S&P 500 continues to show resilience above its 50-day moving average, with volume slightly below average suggesting cautious participation. RSI at moderate levels indicates room for further upside without immediate overbought concerns. The index's P/E ratio remains elevated but supported by earnings growth expectations. Watch the 4,800 level as key resistance.",
        "Index performance reflects sector rotation dynamics with technology and financials leading gains. Volume patterns suggest institutional accumulation at current levels. Technical indicators remain constructive with RSI in neutral territory. Monitor for continuation above recent highs as confirmation of uptrend resumption.",
        "Today's price action shows consolidation near recent highs with healthy volume participation. The index maintains its upward trajectory above key moving averages. RSI readings suggest balanced momentum without extreme conditions. Position for potential breakout with stops below support levels.",
    ],
    'sectorRotation': [
        "Technology and consumer discretionary sectors leading indicates risk-on sentiment prevailing in markets. Defensive sectors lagging confirms investor appetite for growth exposure. This rotation pattern typically occurs during economic expansion phases. Consider overweighting growth sectors while maintaining some defensive positions for balance.",
        "Sector performance shows classic late-cycle rotation with energy and materials outperforming. Technology consolidation after extended gains appears healthy. The shift toward cyclical sectors suggests economic optimism. Position for continued rotation but maintain diversification across sectors.",
        "Broad-based sector strength indicates healthy market participation beyond mega-cap tech. Financial sector momentum suggests rate environment becoming more favorable. Healthcare lagging provides potential value opportunities. Balance exposure between momentum leaders and oversold laggards.",
    ],
    'correlations': [
        "Stock-bond correlation remains negative, providing portfolio diversification benefits during market volatility. The current -0.4 correlation aligns with historical averages during growth periods. This relationship supports traditional 60/40 portfolio construction. Maintain balanced allocations to capture uncorrelated returns.",
        "Unusual positive correlation between stocks and bonds suggests monetary policy influences dominating both markets. This divergence from historical norms warrants careful risk management. Consider alternative diversifiers like commodities or real assets. Monitor for correlation normalization as a regime change signal.",
        "Growth-value correlation breakdown indicates distinct market themes driving performance. Technology strength versus financial sector momentum creates opportunities for style rotation. The divergence exceeds historical ranges, suggesting potential mean reversion ahead. Position for convergence while respecting current trends.",
    ],
    'macroeconomic': [
        "Current yield curve dynamics suggest market expectations of steady Fed policy ahead. The 10-year yield stability around 4% reflects balanced growth and inflation outlook. This environment favors duration-neutral positioning in fixed income. Equities benefit from predictable rate environment supporting valuations.",
        "Rising yields across the curve indicate inflation concerns returning to market focus. The steepening yield curve suggests growth expectations improving. This environment challenges growth stock valuations while benefiting financials. Rotate toward sectors with pricing power and shorter duration assets.",
        "Inverted yield curve persists, signaling continued recession concerns among bond investors. However, equity markets divergence suggests different economic assessment. This disconnect creates cross-asset opportunities. Position defensively while monitoring for curve normalization signals.",
    ]
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'mock-gpt-oss', 'version': '1.0'})

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Mock GPT-OSS chat completions endpoint"""
    try:
        data = request.json
        messages = data.get('messages', [])
        
        # Extract the analysis type from the user message
        user_message = messages[-1]['content'] if messages else ""
        
        # Determine which type of analysis based on keywords
        if 'market phase' in user_message.lower() or 'market conditions' in user_message.lower():
            insight_type = 'marketPhase'
        elif 'index' in user_message.lower() or 's&p' in user_message.lower():
            insight_type = 'marketIndices'
        elif 'sector' in user_message.lower() or 'rotation' in user_message.lower():
            insight_type = 'sectorRotation'
        elif 'correlation' in user_message.lower() or 'relationship' in user_message.lower():
            insight_type = 'correlations'
        elif 'macro' in user_message.lower() or 'interest rate' in user_message.lower() or 'yield' in user_message.lower():
            insight_type = 'macroeconomic'
        else:
            insight_type = 'marketPhase'
        
        # Select a random insight from the appropriate category
        insights = INSIGHTS.get(insight_type, INSIGHTS['marketPhase'])
        selected_insight = random.choice(insights)
        
        # Simulate processing time
        time.sleep(0.5)
        
        # Return in OpenAI-compatible format
        response = {
            'id': f'mock-{random.randint(1000, 9999)}',
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': 'mock-gpt-oss',
            'choices': [
                {
                    'index': 0,
                    'message': {
                        'role': 'assistant',
                        'content': selected_insight
                    },
                    'finish_reason': 'stop'
                }
            ],
            'usage': {
                'prompt_tokens': 50,
                'completion_tokens': 75,
                'total_tokens': 125
            }
        }
        
        print(f"✅ Generated insight for: {insight_type}")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error generating completion: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 MOCK GPT-OSS Service")
    print("=" * 60)
    print("✅ No GPU or model required!")
    print("📊 Starting on port 8080...")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8080, debug=True)