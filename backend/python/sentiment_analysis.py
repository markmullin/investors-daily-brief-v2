#!/usr/bin/env python3
"""
Sentiment Analysis Service for Portfolio AI
Implements multi-source sentiment analysis for market timing
Part of Phase 5: AI-Powered Investment Intelligence
"""

import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import re
import warnings
warnings.filterwarnings('ignore')

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.preprocessing import StandardScaler
    from textblob import TextBlob
except ImportError as e:
    print(json.dumps({"error": f"Required NLP libraries not installed: {e}"}))
    sys.exit(1)

class SentimentAnalysisService:
    def __init__(self):
        # Sentiment scoring weights
        self.source_weights = {
            'news': 0.4,
            'social': 0.3,
            'market_indicators': 0.3
        }
        
        # Market sentiment thresholds
        self.sentiment_thresholds = {
            'extreme_bullish': 0.8,
            'bullish': 0.6,
            'neutral_high': 0.55,
            'neutral_low': 0.45,
            'bearish': 0.4,
            'extreme_bearish': 0.2
        }
        
        # Financial keywords for sentiment analysis
        self.bullish_keywords = [
            'growth', 'rally', 'surge', 'bull', 'optimistic', 'positive', 'gain', 'rise',
            'breakthrough', 'strong', 'robust', 'expansion', 'opportunity', 'upgrade',
            'beat', 'exceed', 'outperform', 'momentum', 'acceleration', 'upside'
        ]
        
        self.bearish_keywords = [
            'decline', 'fall', 'crash', 'bear', 'pessimistic', 'negative', 'loss', 'drop',
            'concern', 'weak', 'fragile', 'contraction', 'risk', 'downgrade',
            'miss', 'disappoint', 'underperform', 'slowdown', 'deceleration', 'downside'
        ]
        
        # Initialize sentiment models
        self.vectorizer = None
        self.sentiment_model = None
        self.models_trained = False

    def analyze_sentiment(self, input_data):
        """
        Main method to analyze sentiment from multiple sources
        """
        try:
            news_sentiment = input_data.get('news_sentiment', {})
            social_sentiment = input_data.get('social_sentiment', {})
            market_sentiment = input_data.get('market_sentiment', {})
            symbols = input_data.get('symbols', [])
            
            print("💭 Analyzing multi-source market sentiment...")
            
            # Process news sentiment
            processed_news = self.process_news_sentiment(news_sentiment, symbols)
            
            # Process social sentiment
            processed_social = self.process_social_sentiment(social_sentiment, symbols)
            
            # Process market sentiment indicators
            processed_market = self.process_market_sentiment_indicators(market_sentiment)
            
            # Combine sentiment sources
            combined_sentiment = self.combine_sentiment_sources(
                processed_news, processed_social, processed_market
            )
            
            # Calculate sentiment trend
            sentiment_trend = self.calculate_sentiment_trend(combined_sentiment)
            
            # Generate sentiment signals
            sentiment_signals = self.generate_sentiment_signals(combined_sentiment, sentiment_trend)
            
            # Detect extreme readings
            extreme_readings = self.detect_extreme_sentiment_readings(combined_sentiment)
            
            # Generate contrarian indicators
            contrarian_indicators = self.generate_contrarian_indicators(combined_sentiment, extreme_readings)
            
            # Calculate overall confidence
            confidence = self.calculate_sentiment_confidence(
                processed_news, processed_social, processed_market
            )
            
            return {
                "success": True,
                "overall_score": combined_sentiment['overall_score'],
                "trend": sentiment_trend,
                "news_sentiment": processed_news,
                "social_sentiment": processed_social,
                "market_sentiment": processed_market,
                "sentiment_signals": sentiment_signals,
                "extreme_readings": extreme_readings,
                "contrarian_indicators": contrarian_indicators,
                "confidence": confidence,
                "sentiment_breakdown": combined_sentiment,
                "source_weights": self.source_weights,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error in sentiment analysis: {str(e)}")
            return self.generate_fallback_sentiment_analysis(symbols)

    def process_news_sentiment(self, news_data, symbols):
        """
        Process news sentiment data
        """
        try:
            print("📰 Processing news sentiment...")
            
            # Extract news articles and data
            articles = news_data.get('articles', [])
            news_score = news_data.get('score', 0.5)
            
            if not articles:
                return {
                    'sentiment_score': news_score,
                    'article_count': 0,
                    'keyword_analysis': {},
                    'topic_sentiment': {},
                    'confidence': 0.3
                }
            
            # Analyze individual articles
            article_sentiments = []
            keyword_counts = {'bullish': 0, 'bearish': 0, 'neutral': 0}
            topic_sentiments = {}
            
            for article in articles[:20]:  # Analyze up to 20 articles
                title = article.get('title', '')
                content = article.get('content', '') or article.get('description', '')
                
                # Analyze article sentiment
                article_sentiment = self.analyze_text_sentiment(title + ' ' + content)
                article_sentiments.append(article_sentiment)
                
                # Count sentiment keywords
                text_lower = (title + ' ' + content).lower()
                bullish_count = sum(1 for word in self.bullish_keywords if word in text_lower)
                bearish_count = sum(1 for word in self.bearish_keywords if word in text_lower)
                
                if bullish_count > bearish_count:
                    keyword_counts['bullish'] += 1
                elif bearish_count > bullish_count:
                    keyword_counts['bearish'] += 1
                else:
                    keyword_counts['neutral'] += 1
                
                # Topic-based sentiment (by symbol)
                for symbol in symbols:
                    if symbol.upper() in text_lower.upper():
                        if symbol not in topic_sentiments:
                            topic_sentiments[symbol] = []
                        topic_sentiments[symbol].append(article_sentiment)
            
            # Calculate overall news sentiment
            if article_sentiments:
                overall_news_sentiment = np.mean(article_sentiments)
            else:
                overall_news_sentiment = news_score
            
            # Calculate topic-specific sentiments
            topic_avg_sentiments = {}
            for symbol, sentiments in topic_sentiments.items():
                topic_avg_sentiments[symbol] = {
                    'sentiment': np.mean(sentiments),
                    'article_count': len(sentiments),
                    'confidence': min(1.0, len(sentiments) / 5.0)  # Higher confidence with more articles
                }
            
            # Calculate keyword analysis
            total_keywords = sum(keyword_counts.values())
            keyword_analysis = {
                'bullish_ratio': keyword_counts['bullish'] / max(1, total_keywords),
                'bearish_ratio': keyword_counts['bearish'] / max(1, total_keywords),
                'neutral_ratio': keyword_counts['neutral'] / max(1, total_keywords),
                'keyword_sentiment_score': (keyword_counts['bullish'] - keyword_counts['bearish']) / max(1, total_keywords)
            }
            
            # Calculate confidence based on data quality
            confidence = min(1.0, len(articles) / 10.0) * 0.8 + 0.2
            
            return {
                'sentiment_score': float(overall_news_sentiment),
                'article_count': len(articles),
                'keyword_analysis': keyword_analysis,
                'topic_sentiment': topic_avg_sentiments,
                'article_sentiments': article_sentiments[:10],  # Keep sample of individual sentiments
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"⚠️ Error processing news sentiment: {str(e)}")
            return {
                'sentiment_score': 0.5,
                'article_count': 0,
                'keyword_analysis': {},
                'topic_sentiment': {},
                'confidence': 0.3
            }

    def process_social_sentiment(self, social_data, symbols):
        """
        Process social media sentiment data
        """
        try:
            print("📱 Processing social sentiment...")
            
            social_score = social_data.get('score', 0.5)
            sources = social_data.get('sources', [])
            
            if not sources:
                return {
                    'sentiment_score': social_score,
                    'source_count': 0,
                    'platform_breakdown': {},
                    'symbol_mentions': {},
                    'confidence': 0.2
                }
            
            # Analyze social media sources
            platform_sentiments = {}
            symbol_mentions = {symbol: {'mentions': 0, 'sentiment': 0.5} for symbol in symbols}
            
            for source in sources[:50]:  # Analyze up to 50 social sources
                platform = source.get('platform', 'unknown')
                text = source.get('text', '') or source.get('content', '')
                
                if not text:
                    continue
                
                # Analyze social post sentiment
                post_sentiment = self.analyze_text_sentiment(text)
                
                # Group by platform
                if platform not in platform_sentiments:
                    platform_sentiments[platform] = []
                platform_sentiments[platform].append(post_sentiment)
                
                # Check for symbol mentions
                text_upper = text.upper()
                for symbol in symbols:
                    if symbol.upper() in text_upper or f"${symbol.upper()}" in text_upper:
                        symbol_mentions[symbol]['mentions'] += 1
                        symbol_mentions[symbol]['sentiment'] = (
                            symbol_mentions[symbol]['sentiment'] * (symbol_mentions[symbol]['mentions'] - 1) + post_sentiment
                        ) / symbol_mentions[symbol]['mentions']
            
            # Calculate platform-specific sentiments
            platform_breakdown = {}
            for platform, sentiments in platform_sentiments.items():
                platform_breakdown[platform] = {
                    'sentiment': np.mean(sentiments),
                    'post_count': len(sentiments),
                    'weight': len(sentiments) / len(sources)
                }
            
            # Calculate overall social sentiment
            if platform_sentiments:
                all_sentiments = []
                for sentiments in platform_sentiments.values():
                    all_sentiments.extend(sentiments)
                overall_social_sentiment = np.mean(all_sentiments)
            else:
                overall_social_sentiment = social_score
            
            # Calculate confidence based on data volume and diversity
            confidence = min(1.0, len(sources) / 20.0) * 0.6 + 0.2
            
            return {
                'sentiment_score': float(overall_social_sentiment),
                'source_count': len(sources),
                'platform_breakdown': platform_breakdown,
                'symbol_mentions': symbol_mentions,
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"⚠️ Error processing social sentiment: {str(e)}")
            return {
                'sentiment_score': 0.5,
                'source_count': 0,
                'platform_breakdown': {},
                'symbol_mentions': {},
                'confidence': 0.2
            }

    def process_market_sentiment_indicators(self, market_data):
        """
        Process market-based sentiment indicators
        """
        try:
            print("📊 Processing market sentiment indicators...")
            
            # Extract market sentiment metrics
            fear_greed = market_data.get('fear_greed', 50)  # Fear & Greed Index (0-100)
            put_call_ratio = market_data.get('put_call', 1.0)  # Put/Call ratio
            vix_level = market_data.get('vix_level', 20)  # VIX level
            
            # Additional sentiment indicators (if available)
            advance_decline = market_data.get('advance_decline_ratio', 1.0)
            insider_buying = market_data.get('insider_buying_ratio', 0.5)
            margin_debt = market_data.get('margin_debt_level', 0.5)
            
            # Convert market indicators to sentiment scores (0-1 scale)
            
            # Fear & Greed Index (0=extreme fear, 100=extreme greed)
            fear_greed_sentiment = fear_greed / 100.0
            
            # Put/Call Ratio (high ratio = bearish, low ratio = bullish)
            # Normal range ~0.7-1.3, invert for sentiment
            put_call_sentiment = max(0, min(1, 1.5 - put_call_ratio))
            
            # VIX Level (high VIX = fear, low VIX = complacency)
            # Normal range ~10-40, invert for sentiment
            vix_sentiment = max(0, min(1, (40 - vix_level) / 30))
            
            # Advance/Decline Ratio (>1 = more stocks advancing)
            ad_sentiment = min(1, advance_decline / 2.0)
            
            # Insider Buying (higher = more bullish)
            insider_sentiment = insider_buying
            
            # Margin Debt (higher = more speculative/risky)
            margin_sentiment = 1.0 - margin_debt
            
            # Combine market sentiment indicators
            market_indicators = {
                'fear_greed': {
                    'value': fear_greed,
                    'sentiment': fear_greed_sentiment,
                    'weight': 0.25
                },
                'put_call': {
                    'value': put_call_ratio,
                    'sentiment': put_call_sentiment,
                    'weight': 0.20
                },
                'vix': {
                    'value': vix_level,
                    'sentiment': vix_sentiment,
                    'weight': 0.20
                },
                'advance_decline': {
                    'value': advance_decline,
                    'sentiment': ad_sentiment,
                    'weight': 0.15
                },
                'insider_buying': {
                    'value': insider_buying,
                    'sentiment': insider_sentiment,
                    'weight': 0.10
                },
                'margin_debt': {
                    'value': margin_debt,
                    'sentiment': margin_sentiment,
                    'weight': 0.10
                }
            }
            
            # Calculate weighted average market sentiment
            weighted_sentiment = sum(
                indicator['sentiment'] * indicator['weight']
                for indicator in market_indicators.values()
            )
            
            # Determine market sentiment regime
            if weighted_sentiment > 0.7:
                sentiment_regime = 'Extreme Optimism'
            elif weighted_sentiment > 0.6:
                sentiment_regime = 'Optimistic'
            elif weighted_sentiment > 0.4:
                sentiment_regime = 'Neutral'
            elif weighted_sentiment > 0.3:
                sentiment_regime = 'Pessimistic'
            else:
                sentiment_regime = 'Extreme Pessimism'
            
            # Calculate confidence based on data availability
            available_indicators = sum(1 for ind in market_indicators.values() if ind['value'] is not None)
            confidence = available_indicators / len(market_indicators)
            
            return {
                'sentiment_score': float(weighted_sentiment),
                'sentiment_regime': sentiment_regime,
                'indicators': market_indicators,
                'raw_values': {
                    'fear_greed': fear_greed,
                    'put_call': put_call_ratio,
                    'vix': vix_level,
                    'advance_decline': advance_decline,
                    'insider_buying': insider_buying,
                    'margin_debt': margin_debt
                },
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"⚠️ Error processing market sentiment: {str(e)}")
            return {
                'sentiment_score': 0.5,
                'sentiment_regime': 'Neutral',
                'indicators': {},
                'confidence': 0.3
            }

    def analyze_text_sentiment(self, text):
        """
        Analyze sentiment of individual text using multiple methods
        """
        try:
            if not text or len(text.strip()) == 0:
                return 0.5
            
            # Method 1: TextBlob sentiment analysis
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # Range: -1 to 1
            textblob_sentiment = (polarity + 1) / 2  # Convert to 0-1 scale
            
            # Method 2: Keyword-based sentiment
            text_lower = text.lower()
            
            bullish_count = sum(1 for word in self.bullish_keywords if word in text_lower)
            bearish_count = sum(1 for word in self.bearish_keywords if word in text_lower)
            
            if bullish_count + bearish_count > 0:
                keyword_sentiment = bullish_count / (bullish_count + bearish_count)
            else:
                keyword_sentiment = 0.5
            
            # Method 3: Pattern-based sentiment (simple heuristics)
            pattern_sentiment = 0.5
            
            # Look for specific patterns
            if '!' in text and any(word in text_lower for word in ['great', 'excellent', 'amazing']):
                pattern_sentiment += 0.2
            elif '!' in text and any(word in text_lower for word in ['terrible', 'awful', 'horrible']):
                pattern_sentiment -= 0.2
            
            # Check for negations
            negation_words = ['not', 'no', 'never', 'none', 'nothing', 'neither', 'nor']
            if any(neg in text_lower for neg in negation_words):
                pattern_sentiment = 1.0 - pattern_sentiment  # Flip sentiment
            
            # Combine sentiment methods
            combined_sentiment = (
                textblob_sentiment * 0.5 +
                keyword_sentiment * 0.3 +
                pattern_sentiment * 0.2
            )
            
            # Ensure result is in valid range
            return max(0.0, min(1.0, combined_sentiment))
            
        except Exception as e:
            print(f"⚠️ Error analyzing text sentiment: {str(e)}")
            return 0.5

    def combine_sentiment_sources(self, news_sentiment, social_sentiment, market_sentiment):
        """
        Combine sentiment from multiple sources using weighted average
        """
        try:
            # Extract sentiment scores
            news_score = news_sentiment.get('sentiment_score', 0.5)
            social_score = social_sentiment.get('sentiment_score', 0.5)
            market_score = market_sentiment.get('sentiment_score', 0.5)
            
            # Extract confidence scores
            news_confidence = news_sentiment.get('confidence', 0.5)
            social_confidence = social_sentiment.get('confidence', 0.5)
            market_confidence = market_sentiment.get('confidence', 0.5)
            
            # Adjust weights based on confidence
            adjusted_weights = {
                'news': self.source_weights['news'] * news_confidence,
                'social': self.source_weights['social'] * social_confidence,
                'market_indicators': self.source_weights['market_indicators'] * market_confidence
            }
            
            # Normalize weights
            total_weight = sum(adjusted_weights.values())
            if total_weight > 0:
                normalized_weights = {k: v / total_weight for k, v in adjusted_weights.items()}
            else:
                normalized_weights = self.source_weights
            
            # Calculate weighted sentiment
            overall_score = (
                news_score * normalized_weights['news'] +
                social_score * normalized_weights['social'] +
                market_score * normalized_weights['market_indicators']
            )
            
            # Calculate sentiment strength (how far from neutral)
            sentiment_strength = abs(overall_score - 0.5) * 2
            
            # Determine sentiment label
            if overall_score > self.sentiment_thresholds['extreme_bullish']:
                sentiment_label = 'Extreme Bullish'
            elif overall_score > self.sentiment_thresholds['bullish']:
                sentiment_label = 'Bullish'
            elif overall_score > self.sentiment_thresholds['neutral_high']:
                sentiment_label = 'Slightly Bullish'
            elif overall_score > self.sentiment_thresholds['neutral_low']:
                sentiment_label = 'Neutral'
            elif overall_score > self.sentiment_thresholds['bearish']:
                sentiment_label = 'Slightly Bearish'
            elif overall_score > self.sentiment_thresholds['extreme_bearish']:
                sentiment_label = 'Bearish'
            else:
                sentiment_label = 'Extreme Bearish'
            
            return {
                'overall_score': float(overall_score),
                'sentiment_label': sentiment_label,
                'sentiment_strength': sentiment_strength,
                'source_scores': {
                    'news': news_score,
                    'social': social_score,
                    'market_indicators': market_score
                },
                'adjusted_weights': normalized_weights,
                'confidence_scores': {
                    'news': news_confidence,
                    'social': social_confidence,
                    'market_indicators': market_confidence
                }
            }
            
        except Exception as e:
            print(f"⚠️ Error combining sentiment sources: {str(e)}")
            return {
                'overall_score': 0.5,
                'sentiment_label': 'Neutral',
                'sentiment_strength': 0.0,
                'source_scores': {'news': 0.5, 'social': 0.5, 'market_indicators': 0.5},
                'adjusted_weights': self.source_weights
            }

    def calculate_sentiment_trend(self, combined_sentiment):
        """
        Calculate sentiment trend (improving/deteriorating)
        """
        try:
            # In production, this would use historical sentiment data
            # For now, use current sentiment strength as proxy for trend
            current_score = combined_sentiment['overall_score']
            sentiment_strength = combined_sentiment['sentiment_strength']
            
            # Simple trend calculation (would be more sophisticated with historical data)
            if current_score > 0.6 and sentiment_strength > 0.3:
                trend = 'strongly_improving'
                trend_score = 0.8
            elif current_score > 0.55:
                trend = 'improving'
                trend_score = 0.6
            elif current_score < 0.4 and sentiment_strength > 0.3:
                trend = 'strongly_deteriorating'
                trend_score = 0.2
            elif current_score < 0.45:
                trend = 'deteriorating'
                trend_score = 0.4
            else:
                trend = 'stable'
                trend_score = 0.5
            
            return {
                'trend': trend,
                'trend_score': trend_score,
                'trend_strength': sentiment_strength,
                'momentum': 'positive' if trend_score > 0.5 else 'negative' if trend_score < 0.5 else 'neutral'
            }
            
        except Exception as e:
            print(f"⚠️ Error calculating sentiment trend: {str(e)}")
            return {
                'trend': 'stable',
                'trend_score': 0.5,
                'trend_strength': 0.0,
                'momentum': 'neutral'
            }

    def generate_sentiment_signals(self, combined_sentiment, sentiment_trend):
        """
        Generate trading signals based on sentiment analysis
        """
        try:
            signals = {
                'buy': [],
                'sell': [],
                'neutral': [],
                'contrarian_buy': [],
                'contrarian_sell': []
            }
            
            current_score = combined_sentiment['overall_score']
            trend = sentiment_trend['trend']
            sentiment_strength = combined_sentiment['sentiment_strength']
            
            # Momentum-based signals
            if current_score > 0.7 and trend in ['improving', 'strongly_improving']:
                signals['buy'].append({
                    'signal': 'Strong bullish sentiment with positive momentum',
                    'strength': sentiment_strength,
                    'type': 'momentum'
                })
            elif current_score < 0.3 and trend in ['deteriorating', 'strongly_deteriorating']:
                signals['sell'].append({
                    'signal': 'Strong bearish sentiment with negative momentum',
                    'strength': sentiment_strength,
                    'type': 'momentum'
                })
            
            # Contrarian signals (extreme sentiment often precedes reversals)
            if current_score > 0.85:
                signals['contrarian_sell'].append({
                    'signal': 'Extreme bullish sentiment - potential reversal risk',
                    'strength': min(1.0, sentiment_strength * 1.5),
                    'type': 'contrarian'
                })
            elif current_score < 0.15:
                signals['contrarian_buy'].append({
                    'signal': 'Extreme bearish sentiment - potential reversal opportunity',
                    'strength': min(1.0, sentiment_strength * 1.5),
                    'type': 'contrarian'
                })
            
            # Neutral signals
            if 0.45 <= current_score <= 0.55 and trend == 'stable':
                signals['neutral'].append({
                    'signal': 'Balanced sentiment - wait for clearer signals',
                    'strength': 1.0 - sentiment_strength,
                    'type': 'neutral'
                })
            
            # Sentiment divergence signals (would require more data in production)
            news_score = combined_sentiment['source_scores']['news']
            market_score = combined_sentiment['source_scores']['market_indicators']
            
            if abs(news_score - market_score) > 0.3:
                signals['neutral'].append({
                    'signal': f'Sentiment divergence detected - news vs market indicators',
                    'strength': abs(news_score - market_score),
                    'type': 'divergence'
                })
            
            return signals
            
        except Exception as e:
            print(f"⚠️ Error generating sentiment signals: {str(e)}")
            return {'buy': [], 'sell': [], 'neutral': [], 'contrarian_buy': [], 'contrarian_sell': []}

    def detect_extreme_sentiment_readings(self, combined_sentiment):
        """
        Detect extreme sentiment readings that might indicate market turning points
        """
        try:
            extreme_readings = {}
            current_score = combined_sentiment['overall_score']
            sentiment_strength = combined_sentiment['sentiment_strength']
            
            # Extreme bullish readings
            if current_score > 0.8:
                extreme_readings['extreme_bullish'] = {
                    'level': 'high',
                    'score': current_score,
                    'strength': sentiment_strength,
                    'warning': 'Markets may be overbought - consider taking profits',
                    'historical_context': 'Extreme bullishness often precedes corrections'
                }
            
            # Extreme bearish readings
            if current_score < 0.2:
                extreme_readings['extreme_bearish'] = {
                    'level': 'high',
                    'score': current_score,
                    'strength': sentiment_strength,
                    'opportunity': 'Markets may be oversold - consider contrarian positions',
                    'historical_context': 'Extreme pessimism often marks market bottoms'
                }
            
            # Sentiment complacency (very low volatility in sentiment)
            if sentiment_strength < 0.1:
                extreme_readings['complacency'] = {
                    'level': 'medium',
                    'strength': 1.0 - sentiment_strength,
                    'warning': 'Low sentiment volatility may indicate complacency',
                    'implication': 'Potential for sudden sentiment shifts'
                }
            
            # Check for source-specific extremes
            source_scores = combined_sentiment['source_scores']
            
            for source, score in source_scores.items():
                if score > 0.9:
                    extreme_readings[f'{source}_extreme_bullish'] = {
                        'source': source,
                        'score': score,
                        'warning': f'Extreme bullishness in {source} sentiment'
                    }
                elif score < 0.1:
                    extreme_readings[f'{source}_extreme_bearish'] = {
                        'source': source,
                        'score': score,
                        'opportunity': f'Extreme pessimism in {source} sentiment'
                    }
            
            return extreme_readings
            
        except Exception as e:
            print(f"⚠️ Error detecting extreme readings: {str(e)}")
            return {}

    def generate_contrarian_indicators(self, combined_sentiment, extreme_readings):
        """
        Generate contrarian investment indicators
        """
        try:
            contrarian_indicators = {}
            current_score = combined_sentiment['overall_score']
            
            # Classic contrarian signals
            if 'extreme_bullish' in extreme_readings:
                contrarian_indicators['sell_signal'] = {
                    'strength': 'high',
                    'reasoning': 'When everyone is bullish, be cautious',
                    'action': 'Consider reducing equity exposure or taking profits',
                    'time_horizon': 'short_term',
                    'confidence': extreme_readings['extreme_bullish']['strength']
                }
            
            if 'extreme_bearish' in extreme_readings:
                contrarian_indicators['buy_signal'] = {
                    'strength': 'high',
                    'reasoning': 'When everyone is bearish, be greedy',
                    'action': 'Consider increasing equity exposure or buying dips',
                    'time_horizon': 'medium_term',
                    'confidence': extreme_readings['extreme_bearish']['strength']
                }
            
            # Sentiment exhaustion signals
            if current_score > 0.7:
                source_agreement = self.calculate_source_agreement(combined_sentiment)
                if source_agreement > 0.8:
                    contrarian_indicators['exhaustion_signal'] = {
                        'strength': 'medium',
                        'reasoning': 'High agreement across sentiment sources suggests exhaustion',
                        'action': 'Prepare for potential sentiment reversal',
                        'time_horizon': 'short_term'
                    }
            
            # News vs market sentiment divergence
            news_score = combined_sentiment['source_scores']['news']
            market_score = combined_sentiment['source_scores']['market_indicators']
            
            if abs(news_score - market_score) > 0.4:
                if news_score > market_score:
                    contrarian_indicators['news_disconnect'] = {
                        'strength': 'medium',
                        'reasoning': 'News sentiment more positive than market indicators',
                        'action': 'Market fundamentals may not support news optimism',
                        'bias': 'bearish'
                    }
                else:
                    contrarian_indicators['market_disconnect'] = {
                        'strength': 'medium',
                        'reasoning': 'Market indicators more positive than news sentiment',
                        'action': 'Market may be undervaluing positive fundamentals',
                        'bias': 'bullish'
                    }
            
            return contrarian_indicators
            
        except Exception as e:
            print(f"⚠️ Error generating contrarian indicators: {str(e)}")
            return {}

    def calculate_source_agreement(self, combined_sentiment):
        """
        Calculate agreement between different sentiment sources
        """
        try:
            source_scores = list(combined_sentiment['source_scores'].values())
            if len(source_scores) < 2:
                return 0.5
            
            # Calculate standard deviation of source scores
            std_dev = np.std(source_scores)
            
            # High agreement = low standard deviation
            # Convert to agreement score (0-1, where 1 = perfect agreement)
            max_possible_std = 0.5  # Maximum possible std dev when scores range 0-1
            agreement = 1.0 - min(1.0, std_dev / max_possible_std)
            
            return agreement
            
        except Exception as e:
            print(f"⚠️ Error calculating source agreement: {str(e)}")
            return 0.5

    def calculate_sentiment_confidence(self, news_sentiment, social_sentiment, market_sentiment):
        """
        Calculate overall confidence in sentiment analysis
        """
        try:
            # Individual confidence scores
            news_conf = news_sentiment.get('confidence', 0.3)
            social_conf = social_sentiment.get('confidence', 0.3)
            market_conf = market_sentiment.get('confidence', 0.3)
            
            # Data volume factors
            news_articles = news_sentiment.get('article_count', 0)
            social_sources = social_sentiment.get('source_count', 0)
            market_indicators = len(market_sentiment.get('indicators', {}))
            
            # Volume bonuses
            news_volume_bonus = min(0.3, news_articles / 20.0)
            social_volume_bonus = min(0.2, social_sources / 30.0)
            market_volume_bonus = min(0.2, market_indicators / 6.0)
            
            # Calculate weighted confidence
            base_confidence = (news_conf + social_conf + market_conf) / 3.0
            volume_bonus = news_volume_bonus + social_volume_bonus + market_volume_bonus
            
            overall_confidence = min(1.0, base_confidence + volume_bonus)
            
            return float(overall_confidence)
            
        except Exception as e:
            print(f"⚠️ Error calculating sentiment confidence: {str(e)}")
            return 0.5

    def generate_fallback_sentiment_analysis(self, symbols):
        """
        Generate fallback sentiment analysis when processing fails
        """
        return {
            "success": False,
            "overall_score": 0.5,
            "trend": "neutral",
            "news_sentiment": {"sentiment_score": 0.5, "confidence": 0.3},
            "social_sentiment": {"sentiment_score": 0.5, "confidence": 0.3},
            "market_sentiment": {"sentiment_score": 0.5, "confidence": 0.3},
            "sentiment_signals": {"neutral": ["Sentiment analysis unavailable - using neutral stance"]},
            "extreme_readings": {},
            "contrarian_indicators": {},
            "confidence": 0.3,
            "error": "Sentiment analysis failed - using fallback neutral sentiment",
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Main entry point for the sentiment analysis service"""
    try:
        # Read input from command line
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        # Create service instance and analyze sentiment
        sentiment_service = SentimentAnalysisService()
        result = sentiment_service.analyze_sentiment(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "overall_score": 0.5,
            "trend": "neutral",
            "confidence": 0.3,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))


if __name__ == "__main__":
    main()
