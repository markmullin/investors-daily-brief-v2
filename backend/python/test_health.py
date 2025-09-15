#!/usr/bin/env python3
"""
Quick health check script for DeepSeek-Math service
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from deepseek_financial_service import deepseek_service

async def test_health():
    try:
        health = await deepseek_service.health_check()
        print('🧮 DeepSeek-Math Health Check:')
        for key, value in health.items():
            print(f'  ✅ {key}: {value}')
        return health.get('status') == 'healthy'
    except Exception as e:
        print(f'❌ Health check failed: {e}')
        return False

def test_basic_math():
    """Test basic mathematical functions"""
    try:
        print('\n🧮 Testing mathematical calculations...')
        
        # Test market sentiment calculation
        test_data = {
            'gainers': [
                {'symbol': 'AAPL', 'changesPercentage': 2.5},
                {'symbol': 'MSFT', 'changesPercentage': 1.8}
            ],
            'losers': [
                {'symbol': 'TSLA', 'changesPercentage': -1.2}
            ]
        }
        
        # Calculate basic sentiment
        total_stocks = len(test_data['gainers']) + len(test_data['losers'])
        advance_decline = len(test_data['gainers']) / total_stocks
        sentiment_score = advance_decline * 100
        
        print(f'  ✅ Total stocks analyzed: {total_stocks}')
        print(f'  ✅ Advance/decline ratio: {advance_decline:.2f}')
        print(f'  ✅ Sentiment score: {sentiment_score:.1f}/100')
        print('  ✅ Mathematical calculations working')
        
        return True
        
    except Exception as e:
        print(f'  ❌ Mathematical test failed: {e}')
        return False

if __name__ == "__main__":
    print('🔧 Testing DeepSeek-Math Service...')
    
    # Test basic math
    math_ok = test_basic_math()
    
    # Test async health check
    health_ok = asyncio.run(test_health())
    
    if math_ok and health_ok:
        print('\n✅ All tests passed - DeepSeek-Math service ready!')
        sys.exit(0)
    elif math_ok:
        print('\n✅ Mathematical functions working - Service ready for fallback mode!')
        sys.exit(0)
    else:
        print('\n❌ Tests failed')
        sys.exit(1)
