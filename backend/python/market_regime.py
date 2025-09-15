#!/usr/bin/env python3
"""
Market Regime Detection Service for Portfolio AI
Implements ML classification for Bull/Bear/Volatile/Stable market regimes
Part of Phase 5: AI-Powered Investment Intelligence
"""

import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.svm import SVC
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
    import joblib
except ImportError as e:
    print(json.dumps({"error": f"Required ML libraries not installed: {e}"}))
    sys.exit(1)

class MarketRegimeDetectionService:
    def __init__(self):
        self.regime_labels = ['Bull', 'Bear', 'Volatile', 'Stable']
        self.regime_mapping = {0: 'Bull', 1: 'Bear', 2: 'Volatile', 3: 'Stable'}
        self.models = {}
        self.scaler = StandardScaler()
        
        # Regime thresholds for classification
        self.thresholds = {
            'vix_low': 15,     # VIX below 15 = low fear
            'vix_high': 25,    # VIX above 25 = high fear
            'volatility_low': 0.15,   # Low market volatility
            'volatility_high': 0.30,  # High market volatility
            'momentum_bull': 0.05,    # Positive momentum threshold
            'momentum_bear': -0.05,   # Negative momentum threshold
            'volume_surge': 1.5,      # Volume surge threshold
            'correlation_breakdown': 0.3  # Low correlation = market stress
        }
        
        # Feature weights for regime scoring
        self.feature_weights = {
            'vix_level': 0.25,
            'market_volatility': 0.20,
            'momentum': 0.20,
            'sector_rotation': 0.15,
            'volume_patterns': 0.10,
            'correlations': 0.10
        }

    def detect_market_regime(self, input_data):
        """
        Main method to detect current market regime using ML classification
        """
        try:
            features = input_data.get('features', {})
            historical_data = input_data.get('historical_data', {})
            regime_config = input_data.get('regime_config', {})
            
            print("🔍 Analyzing market regime indicators...")
            
            # Update thresholds from config
            if regime_config:
                self.thresholds.update(regime_config.get('vixThresholds', {}))
                self.thresholds.update(regime_config.get('volatilityThresholds', {}))
                self.thresholds.update(regime_config.get('momentumThresholds', {}))
            
            # Extract and process features
            feature_vector = self.extract_regime_features(features, historical_data)
            
            # Generate training data for regime classification
            training_data = self.generate_regime_training_data(historical_data, features)
            
            # Train or load regime detection models
            models = self.train_regime_models(training_data)
            
            # Classify current regime
            regime_prediction = self.classify_current_regime(feature_vector, models)
            
            # Calculate regime probabilities
            regime_probabilities = self.calculate_regime_probabilities(feature_vector, models)
            
            # Analyze historical regimes and transitions
            historical_analysis = self.analyze_historical_regimes(historical_data)
            
            # Calculate transition matrix and expected duration
            transition_matrix = self.calculate_transition_matrix(historical_analysis['regime_history'])
            expected_duration = self.calculate_expected_duration(regime_prediction, transition_matrix)
            
            # Generate regime confidence score
            confidence = self.calculate_regime_confidence(regime_probabilities, feature_vector)
            
            return {
                "success": True,
                "predicted_regime": regime_prediction,
                "confidence": confidence,
                "regime_probabilities": regime_probabilities,
                "feature_vector": feature_vector.tolist() if isinstance(feature_vector, np.ndarray) else feature_vector,
                "historical_regimes": historical_analysis,
                "transition_matrix": transition_matrix,
                "expected_duration": expected_duration,
                "regime_thresholds": self.thresholds,
                "feature_importance": self.get_feature_importance(models),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error in market regime detection: {str(e)}")
            return self.generate_fallback_regime_analysis(features)

    def extract_regime_features(self, features, historical_data):
        """
        Extract features for regime classification
        """
        try:
            feature_vector = []
            
            # VIX features
            vix_level = features.get('vix_level', 20)
            vix_change = features.get('vix_change', 0)
            feature_vector.extend([
                vix_level / 100.0,  # Normalize VIX
                vix_change / 100.0,
                1.0 if vix_level > self.thresholds['vix_high'] else 0.0,  # High fear indicator
                1.0 if vix_level < self.thresholds['vix_low'] else 0.0   # Low fear indicator
            ])
            
            # Market volatility features
            market_volatility = features.get('market_volatility', 0.2)
            feature_vector.extend([
                market_volatility,
                1.0 if market_volatility > self.thresholds['volatility_high'] else 0.0,
                1.0 if market_volatility < self.thresholds['volatility_low'] else 0.0
            ])
            
            # Momentum features
            momentum_indicators = features.get('momentum_indicators', {})
            avg_momentum = 0
            if momentum_indicators:
                momentum_values = []
                for symbol, momentum_data in momentum_indicators.items():
                    if isinstance(momentum_data, dict):
                        momentum_values.append(momentum_data.get('momentum_20d', 0))
                avg_momentum = np.mean(momentum_values) if momentum_values else 0
            
            feature_vector.extend([
                avg_momentum,
                1.0 if avg_momentum > self.thresholds['momentum_bull'] else 0.0,
                1.0 if avg_momentum < self.thresholds['momentum_bear'] else 0.0
            ])
            
            # Sector rotation features
            sector_rotation = features.get('sector_rotation', {})
            rotation_score = sector_rotation.get('score', 0) if isinstance(sector_rotation, dict) else 0
            feature_vector.extend([
                rotation_score / 100.0,  # Normalize sector rotation
                1.0 if rotation_score > 5 else 0.0  # High rotation indicator
            ])
            
            # Volume pattern features
            volume_patterns = features.get('volume_patterns', {})
            avg_volume_ratio = 0
            if volume_patterns:
                volume_ratios = [data.get('volume_ratio', 1.0) for data in volume_patterns.values() if isinstance(data, dict)]
                avg_volume_ratio = np.mean(volume_ratios) if volume_ratios else 1.0
            
            feature_vector.extend([
                avg_volume_ratio,
                1.0 if avg_volume_ratio > self.thresholds['volume_surge'] else 0.0
            ])
            
            # Cross-asset correlation features
            correlations = features.get('cross_asset_correlations', {})
            avg_correlation = 0
            if correlations:
                corr_values = [abs(corr) for corr in correlations.values() if isinstance(corr, (int, float))]
                avg_correlation = np.mean(corr_values) if corr_values else 0.5
            
            feature_vector.extend([
                avg_correlation,
                1.0 if avg_correlation < self.thresholds['correlation_breakdown'] else 0.0
            ])
            
            # Yield curve and macro features
            yield_curve_slope = features.get('yield_curve_slope', 0)
            feature_vector.extend([
                yield_curve_slope,
                1.0 if yield_curve_slope < 0 else 0.0  # Inverted yield curve
            ])
            
            # Time-based features (market cycles)
            current_date = datetime.now()
            feature_vector.extend([
                current_date.month / 12.0,  # Seasonal effects
                (current_date.weekday()) / 6.0,  # Day of week effects
            ])
            
            return np.array(feature_vector)
            
        except Exception as e:
            print(f"⚠️ Error extracting regime features: {str(e)}")
            # Return default feature vector
            return np.array([0.2, 0.0, 0.0, 1.0, 0.2, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5, 0.3])

    def generate_regime_training_data(self, historical_data, current_features):
        """
        Generate training data for regime classification
        """
        try:
            X_train = []
            y_train = []
            
            # Generate synthetic training data based on known regime characteristics
            # In production, this would use historical labeled regime data
            
            # Bull market samples (regime 0)
            for _ in range(50):
                bull_features = self.generate_synthetic_regime_features('Bull')
                X_train.append(bull_features)
                y_train.append(0)
            
            # Bear market samples (regime 1)
            for _ in range(40):
                bear_features = self.generate_synthetic_regime_features('Bear')
                X_train.append(bear_features)
                y_train.append(1)
            
            # Volatile market samples (regime 2)
            for _ in range(35):
                volatile_features = self.generate_synthetic_regime_features('Volatile')
                X_train.append(volatile_features)
                y_train.append(2)
            
            # Stable market samples (regime 3)
            for _ in range(45):
                stable_features = self.generate_synthetic_regime_features('Stable')
                X_train.append(stable_features)
                y_train.append(3)
            
            return np.array(X_train), np.array(y_train)
            
        except Exception as e:
            print(f"⚠️ Error generating training data: {str(e)}")
            return None, None

    def generate_synthetic_regime_features(self, regime_type):
        """
        Generate synthetic features for a specific regime type
        """
        if regime_type == 'Bull':
            # Bull market: Low VIX, positive momentum, normal volatility
            return [
                np.random.normal(0.15, 0.05),  # Low VIX
                np.random.normal(0.0, 0.02),   # VIX change
                0.0,  # High fear indicator (off)
                1.0,  # Low fear indicator (on)
                np.random.normal(0.15, 0.05),  # Normal volatility
                0.0,  # High volatility indicator (off)
                1.0,  # Low volatility indicator (on)
                np.random.normal(0.08, 0.03),  # Positive momentum
                1.0,  # Bull momentum indicator (on)
                0.0,  # Bear momentum indicator (off)
                np.random.normal(0.03, 0.02),  # Low sector rotation
                0.0,  # High rotation indicator (off)
                np.random.normal(1.1, 0.2),   # Normal volume
                0.0,  # Volume surge indicator (off)
                np.random.normal(0.7, 0.15),  # High correlations
                0.0,  # Correlation breakdown indicator (off)
                np.random.normal(0.02, 0.01), # Positive yield curve
                0.0,  # Inverted curve indicator (off)
                np.random.uniform(0, 1),      # Month
                np.random.uniform(0, 1)       # Day of week
            ]
        
        elif regime_type == 'Bear':
            # Bear market: High VIX, negative momentum, high volatility
            return [
                np.random.normal(0.35, 0.1),   # High VIX
                np.random.normal(0.05, 0.03),  # VIX change (rising)
                1.0,  # High fear indicator (on)
                0.0,  # Low fear indicator (off)
                np.random.normal(0.35, 0.1),   # High volatility
                1.0,  # High volatility indicator (on)
                0.0,  # Low volatility indicator (off)
                np.random.normal(-0.08, 0.03), # Negative momentum
                0.0,  # Bull momentum indicator (off)
                1.0,  # Bear momentum indicator (on)
                np.random.normal(0.08, 0.03),  # High sector rotation
                1.0,  # High rotation indicator (on)
                np.random.normal(1.6, 0.3),    # High volume
                1.0,  # Volume surge indicator (on)
                np.random.normal(0.2, 0.1),    # Low correlations (breakdown)
                1.0,  # Correlation breakdown indicator (on)
                np.random.normal(-0.01, 0.02), # Potentially inverted yield curve
                0.5,  # Inverted curve indicator (maybe)
                np.random.uniform(0, 1),       # Month
                np.random.uniform(0, 1)        # Day of week
            ]
        
        elif regime_type == 'Volatile':
            # Volatile market: Variable VIX, mixed signals, high volatility
            return [
                np.random.normal(0.25, 0.1),   # Medium-high VIX
                np.random.normal(0.0, 0.05),   # Variable VIX change
                0.5,  # High fear indicator (sometimes)
                0.0,  # Low fear indicator (off)
                np.random.normal(0.30, 0.05),  # High volatility
                1.0,  # High volatility indicator (on)
                0.0,  # Low volatility indicator (off)
                np.random.normal(0.0, 0.06),   # Mixed momentum
                0.5,  # Bull momentum indicator (sometimes)
                0.5,  # Bear momentum indicator (sometimes)
                np.random.normal(0.10, 0.05),  # High sector rotation
                1.0,  # High rotation indicator (on)
                np.random.normal(1.4, 0.4),    # Variable high volume
                0.8,  # Volume surge indicator (often)
                np.random.normal(0.4, 0.2),    # Variable correlations
                0.6,  # Correlation breakdown indicator (often)
                np.random.normal(0.01, 0.03),  # Variable yield curve
                0.3,  # Inverted curve indicator (sometimes)
                np.random.uniform(0, 1),       # Month
                np.random.uniform(0, 1)        # Day of week
            ]
        
        else:  # Stable
            # Stable market: Low VIX, low momentum, low volatility
            return [
                np.random.normal(0.18, 0.03),  # Low-medium VIX
                np.random.normal(0.0, 0.01),   # Minimal VIX change
                0.0,  # High fear indicator (off)
                0.8,  # Low fear indicator (mostly on)
                np.random.normal(0.12, 0.03),  # Low volatility
                0.0,  # High volatility indicator (off)
                1.0,  # Low volatility indicator (on)
                np.random.normal(0.02, 0.02),  # Low momentum
                0.0,  # Bull momentum indicator (off)
                0.0,  # Bear momentum indicator (off)
                np.random.normal(0.02, 0.01),  # Low sector rotation
                0.0,  # High rotation indicator (off)
                np.random.normal(0.95, 0.15),  # Normal-low volume
                0.0,  # Volume surge indicator (off)
                np.random.normal(0.6, 0.1),    # Normal correlations
                0.0,  # Correlation breakdown indicator (off)
                np.random.normal(0.015, 0.01), # Normal yield curve
                0.0,  # Inverted curve indicator (off)
                np.random.uniform(0, 1),       # Month
                np.random.uniform(0, 1)        # Day of week
            ]

    def train_regime_models(self, training_data):
        """
        Train ensemble of models for regime classification
        """
        models = {}
        
        try:
            if training_data[0] is None or training_data[1] is None:
                print("⚠️ No training data available, using rule-based classification")
                return {}
            
            X_train, y_train = training_data
            
            if len(X_train) == 0:
                return {}
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X_train)
            
            # Random Forest Classifier
            print("🌲 Training Random Forest regime classifier...")
            rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            rf_model.fit(X_scaled, y_train)
            models['random_forest'] = rf_model
            
            # Gradient Boosting Classifier
            print("🚀 Training Gradient Boosting regime classifier...")
            gb_model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            gb_model.fit(X_scaled, y_train)
            models['gradient_boosting'] = gb_model
            
            # SVM Classifier (with probability estimates)
            print("🎯 Training SVM regime classifier...")
            svm_model = SVC(
                kernel='rbf',
                C=1.0,
                probability=True,
                random_state=42
            )
            svm_model.fit(X_scaled, y_train)
            models['svm'] = svm_model
            
            # Evaluate models
            for name, model in models.items():
                if len(X_train) > 10:  # Need sufficient data for cross-validation
                    cv_scores = cross_val_score(model, X_scaled, y_train, cv=5)
                    print(f"✅ {name} CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            return models
            
        except Exception as e:
            print(f"❌ Error training regime models: {str(e)}")
            return {}

    def classify_current_regime(self, feature_vector, models):
        """
        Classify current market regime using ensemble of models
        """
        try:
            if not models:
                # Fallback to rule-based classification
                return self.rule_based_regime_classification(feature_vector)
            
            # Scale features
            feature_scaled = self.scaler.transform(feature_vector.reshape(1, -1))
            
            # Get predictions from all models
            predictions = []
            prediction_probs = []
            
            for model_name, model in models.items():
                try:
                    pred = model.predict(feature_scaled)[0]
                    predictions.append(pred)
                    
                    # Get prediction probabilities if available
                    if hasattr(model, 'predict_proba'):
                        probs = model.predict_proba(feature_scaled)[0]
                        prediction_probs.append(probs)
                    
                except Exception as e:
                    print(f"⚠️ Error with {model_name}: {str(e)}")
                    continue
            
            if not predictions:
                return self.rule_based_regime_classification(feature_vector)
            
            # Ensemble prediction (majority vote)
            if len(predictions) > 1:
                from collections import Counter
                ensemble_prediction = Counter(predictions).most_common(1)[0][0]
            else:
                ensemble_prediction = predictions[0]
            
            return self.regime_mapping[ensemble_prediction]
            
        except Exception as e:
            print(f"⚠️ Error in regime classification: {str(e)}")
            return self.rule_based_regime_classification(feature_vector)

    def rule_based_regime_classification(self, feature_vector):
        """
        Fallback rule-based regime classification
        """
        try:
            # Extract key features (indices based on feature construction)
            vix_normalized = feature_vector[0] if len(feature_vector) > 0 else 0.2
            volatility = feature_vector[4] if len(feature_vector) > 4 else 0.2
            momentum = feature_vector[7] if len(feature_vector) > 7 else 0.0
            volume_ratio = feature_vector[12] if len(feature_vector) > 12 else 1.0
            
            # Convert back to normal scales
            vix_level = vix_normalized * 100
            
            # Rule-based classification
            if vix_level > 30 and volatility > 0.25 and momentum < -0.05:
                return 'Bear'
            elif vix_level < 15 and volatility < 0.15 and momentum > 0.05:
                return 'Bull'
            elif volatility > 0.25 or volume_ratio > 1.5:
                return 'Volatile'
            else:
                return 'Stable'
                
        except Exception as e:
            print(f"⚠️ Error in rule-based classification: {str(e)}")
            return 'Stable'  # Default to stable

    def calculate_regime_probabilities(self, feature_vector, models):
        """
        Calculate probabilities for each regime
        """
        try:
            if not models:
                # Rule-based probabilities
                regime = self.rule_based_regime_classification(feature_vector)
                probs = {'Bull': 0.25, 'Bear': 0.25, 'Volatile': 0.25, 'Stable': 0.25}
                probs[regime] = 0.7  # Higher probability for predicted regime
                return probs
            
            # Get average probabilities from all models
            feature_scaled = self.scaler.transform(feature_vector.reshape(1, -1))
            all_probs = []
            
            for model_name, model in models.items():
                try:
                    if hasattr(model, 'predict_proba'):
                        probs = model.predict_proba(feature_scaled)[0]
                        all_probs.append(probs)
                except Exception as e:
                    print(f"⚠️ Error getting probabilities from {model_name}: {str(e)}")
                    continue
            
            if all_probs:
                # Average probabilities across models
                avg_probs = np.mean(all_probs, axis=0)
                prob_dict = {}
                for i, label in enumerate(self.regime_labels):
                    prob_dict[label] = float(avg_probs[i])
                return prob_dict
            else:
                # Fallback uniform probabilities
                return {'Bull': 0.25, 'Bear': 0.25, 'Volatile': 0.25, 'Stable': 0.25}
                
        except Exception as e:
            print(f"⚠️ Error calculating regime probabilities: {str(e)}")
            return {'Bull': 0.25, 'Bear': 0.25, 'Volatile': 0.25, 'Stable': 0.25}

    def analyze_historical_regimes(self, historical_data):
        """
        Analyze historical regime patterns
        """
        try:
            # Generate synthetic historical regime analysis
            # In production, this would analyze actual historical data
            
            regime_history = []
            
            # Generate 100 days of synthetic regime history
            current_regime = 'Stable'
            for day in range(100):
                # Simple regime persistence with occasional transitions
                if np.random.random() < 0.95:  # 95% chance to stay in same regime
                    regime_history.append(current_regime)
                else:  # 5% chance to transition
                    # Transition probabilities
                    if current_regime == 'Stable':
                        current_regime = np.random.choice(['Bull', 'Volatile'], p=[0.7, 0.3])
                    elif current_regime == 'Bull':
                        current_regime = np.random.choice(['Stable', 'Volatile'], p=[0.6, 0.4])
                    elif current_regime == 'Volatile':
                        current_regime = np.random.choice(['Stable', 'Bear', 'Bull'], p=[0.4, 0.3, 0.3])
                    elif current_regime == 'Bear':
                        current_regime = np.random.choice(['Volatile', 'Stable'], p=[0.6, 0.4])
                    
                    regime_history.append(current_regime)
            
            # Calculate regime statistics
            regime_counts = {regime: regime_history.count(regime) for regime in self.regime_labels}
            total_days = len(regime_history)
            regime_percentages = {regime: (count / total_days) * 100 for regime, count in regime_counts.items()}
            
            # Calculate average regime durations
            regime_durations = self.calculate_regime_durations(regime_history)
            
            return {
                'regime_history': regime_history[-30:],  # Last 30 days
                'regime_counts': regime_counts,
                'regime_percentages': regime_percentages,
                'average_durations': regime_durations,
                'total_periods_analyzed': total_days
            }
            
        except Exception as e:
            print(f"⚠️ Error analyzing historical regimes: {str(e)}")
            return {
                'regime_history': ['Stable'] * 30,
                'regime_counts': {'Bull': 25, 'Bear': 15, 'Volatile': 20, 'Stable': 40},
                'regime_percentages': {'Bull': 25, 'Bear': 15, 'Volatile': 20, 'Stable': 40},
                'average_durations': {'Bull': 15, 'Bear': 10, 'Volatile': 8, 'Stable': 20}
            }

    def calculate_regime_durations(self, regime_history):
        """
        Calculate average duration for each regime
        """
        durations = {regime: [] for regime in self.regime_labels}
        
        if not regime_history:
            return {regime: 10 for regime in self.regime_labels}
        
        current_regime = regime_history[0]
        current_duration = 1
        
        for i in range(1, len(regime_history)):
            if regime_history[i] == current_regime:
                current_duration += 1
            else:
                durations[current_regime].append(current_duration)
                current_regime = regime_history[i]
                current_duration = 1
        
        # Add the last regime duration
        durations[current_regime].append(current_duration)
        
        # Calculate averages
        avg_durations = {}
        for regime, duration_list in durations.items():
            avg_durations[regime] = np.mean(duration_list) if duration_list else 10
        
        return avg_durations

    def calculate_transition_matrix(self, regime_history):
        """
        Calculate regime transition probability matrix
        """
        try:
            if len(regime_history) < 2:
                # Default transition matrix
                return {
                    'Bull': {'Bull': 0.8, 'Bear': 0.05, 'Volatile': 0.1, 'Stable': 0.05},
                    'Bear': {'Bull': 0.1, 'Bear': 0.7, 'Volatile': 0.15, 'Stable': 0.05},
                    'Volatile': {'Bull': 0.2, 'Bear': 0.2, 'Volatile': 0.4, 'Stable': 0.2},
                    'Stable': {'Bull': 0.2, 'Bear': 0.05, 'Volatile': 0.15, 'Stable': 0.6}
                }
            
            # Count transitions
            transitions = {}
            for regime in self.regime_labels:
                transitions[regime] = {target: 0 for target in self.regime_labels}
            
            for i in range(len(regime_history) - 1):
                current = regime_history[i]
                next_regime = regime_history[i + 1]
                transitions[current][next_regime] += 1
            
            # Convert to probabilities
            transition_matrix = {}
            for regime in self.regime_labels:
                total_transitions = sum(transitions[regime].values())
                if total_transitions > 0:
                    transition_matrix[regime] = {
                        target: count / total_transitions 
                        for target, count in transitions[regime].items()
                    }
                else:
                    # Default probabilities if no transitions observed
                    transition_matrix[regime] = {target: 0.25 for target in self.regime_labels}
            
            return transition_matrix
            
        except Exception as e:
            print(f"⚠️ Error calculating transition matrix: {str(e)}")
            return {
                'Bull': {'Bull': 0.8, 'Bear': 0.05, 'Volatile': 0.1, 'Stable': 0.05},
                'Bear': {'Bull': 0.1, 'Bear': 0.7, 'Volatile': 0.15, 'Stable': 0.05},
                'Volatile': {'Bull': 0.2, 'Bear': 0.2, 'Volatile': 0.4, 'Stable': 0.2},
                'Stable': {'Bull': 0.2, 'Bear': 0.05, 'Volatile': 0.15, 'Stable': 0.6}
            }

    def calculate_expected_duration(self, current_regime, transition_matrix):
        """
        Calculate expected duration of current regime
        """
        try:
            if current_regime not in transition_matrix:
                return 15  # Default duration
            
            # Expected duration = 1 / (1 - probability of staying in same regime)
            stay_probability = transition_matrix[current_regime].get(current_regime, 0.7)
            expected_duration = 1 / (1 - stay_probability) if stay_probability < 1.0 else 20
            
            return min(60, max(1, expected_duration))  # Bound between 1 and 60 days
            
        except Exception as e:
            print(f"⚠️ Error calculating expected duration: {str(e)}")
            return 15

    def calculate_regime_confidence(self, regime_probabilities, feature_vector):
        """
        Calculate confidence in regime prediction
        """
        try:
            # Confidence based on probability distribution
            probs = list(regime_probabilities.values())
            max_prob = max(probs)
            prob_spread = max_prob - min(probs)
            
            # Higher confidence when one regime has much higher probability
            probability_confidence = min(1.0, prob_spread * 2)
            
            # Feature-based confidence (how extreme are the features)
            feature_extremeness = 0
            if len(feature_vector) > 10:
                # Check how far features are from neutral values
                vix_extremeness = abs(feature_vector[0] - 0.2)  # VIX deviation from 20
                vol_extremeness = abs(feature_vector[4] - 0.15)  # Volatility deviation from 15%
                momentum_extremeness = abs(feature_vector[7])    # Momentum deviation from 0
                
                feature_extremeness = np.mean([vix_extremeness, vol_extremeness, momentum_extremeness])
            
            # Combined confidence
            combined_confidence = (probability_confidence * 0.7) + (min(1.0, feature_extremeness * 3) * 0.3)
            
            return max(0.1, min(0.95, combined_confidence))
            
        except Exception as e:
            print(f"⚠️ Error calculating confidence: {str(e)}")
            return 0.7

    def get_feature_importance(self, models):
        """
        Get feature importance from trained models
        """
        try:
            if 'random_forest' in models:
                importance = models['random_forest'].feature_importances_
                feature_names = [
                    'VIX Level', 'VIX Change', 'High Fear', 'Low Fear',
                    'Market Volatility', 'High Vol', 'Low Vol',
                    'Momentum', 'Bull Signal', 'Bear Signal',
                    'Sector Rotation', 'High Rotation',
                    'Volume Ratio', 'Volume Surge',
                    'Correlations', 'Correlation Breakdown',
                    'Yield Curve', 'Inverted Curve',
                    'Month', 'Day of Week'
                ]
                
                # Only show top 10 most important features
                top_indices = np.argsort(importance)[-10:]
                top_features = {
                    feature_names[i]: float(importance[i]) 
                    for i in top_indices if i < len(feature_names)
                }
                
                return top_features
            else:
                return {}
                
        except Exception as e:
            print(f"⚠️ Error getting feature importance: {str(e)}")
            return {}

    def generate_fallback_regime_analysis(self, features):
        """
        Generate fallback regime analysis when ML fails
        """
        # Simple rule-based fallback
        vix_level = features.get('vix_level', 20)
        market_volatility = features.get('market_volatility', 0.2)
        
        if vix_level > 25 and market_volatility > 0.25:
            regime = 'Bear'
            confidence = 0.6
        elif vix_level < 15 and market_volatility < 0.15:
            regime = 'Bull'
            confidence = 0.6
        elif market_volatility > 0.25:
            regime = 'Volatile'
            confidence = 0.5
        else:
            regime = 'Stable'
            confidence = 0.7
        
        return {
            "success": False,
            "predicted_regime": regime,
            "confidence": confidence,
            "regime_probabilities": {regime: 0.7, **{r: 0.1 for r in self.regime_labels if r != regime}},
            "fallback_mode": True,
            "error": "ML classification unavailable - using rule-based fallback",
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Main entry point for the market regime detection service"""
    try:
        # Read input from command line
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        # Create service instance and detect regime
        regime_service = MarketRegimeDetectionService()
        result = regime_service.detect_market_regime(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "predicted_regime": "Stable",
            "confidence": 0.3,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))


if __name__ == "__main__":
    main()
