#!/usr/bin/env python3
"""
ML Predictions Service for Portfolio AI
Implements ensemble models: RandomForest + LSTM + Linear for return predictions
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
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression, Ridge
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import TimeSeriesSplit, cross_val_score
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    import joblib
except ImportError as e:
    print(json.dumps({"error": f"Required ML libraries not installed: {e}"}))
    sys.exit(1)

# Try to import TensorFlow for LSTM (optional for basic functionality)
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
    LSTM_AVAILABLE = True
except ImportError:
    LSTM_AVAILABLE = False
    print(json.dumps({"warning": "TensorFlow not available - LSTM models disabled"}))

class MLPredictionsService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        self.target_columns = []
        self.model_cache_path = '/tmp/ml_models_cache/'
        
        # Ensemble configuration
        self.ensemble_weights = {
            'random_forest': 0.4,
            'lstm': 0.35 if LSTM_AVAILABLE else 0.0,
            'linear': 0.6 if not LSTM_AVAILABLE else 0.25
        }
        
        # Model hyperparameters
        self.rf_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42
        }
        
        self.lstm_params = {
            'sequence_length': 30,
            'units': 50,
            'dropout': 0.2,
            'epochs': 50,
            'batch_size': 32
        }
        
        self.linear_params = {
            'alpha': 1.0,  # Ridge regression regularization
            'normalize': True
        }

    def generate_predictions(self, input_data):
        """
        Main method to generate ML predictions using ensemble models
        """
        try:
            feature_data = input_data.get('feature_data', {})
            symbols = input_data.get('symbols', [])
            prediction_horizon = input_data.get('prediction_horizon', 21)
            ensemble_weights = input_data.get('ensemble_weights', self.ensemble_weights)
            model_config = input_data.get('model_config', {})
            
            if not symbols:
                return {"error": "No symbols provided for prediction"}
            
            print(f"🤖 Generating ML predictions for {len(symbols)} symbols, horizon: {prediction_horizon} days")
            
            # Prepare training data
            X, y, symbol_mapping = self.prepare_training_data(feature_data, symbols, prediction_horizon)
            
            if X is None or len(X) == 0:
                return self.generate_fallback_predictions(symbols, prediction_horizon)
            
            # Train or load models
            models = self.train_ensemble_models(X, y, model_config.get('retrain', False))
            
            # Generate predictions
            predictions = self.make_ensemble_predictions(X, models, symbols, symbol_mapping, ensemble_weights)
            
            # Calculate confidence scores
            confidence_scores = self.calculate_confidence_scores(predictions, X, y, models)
            
            # Validate predictions
            validated_predictions = self.validate_predictions(predictions, confidence_scores)
            
            return {
                "success": True,
                "predictions": validated_predictions,
                "model_performance": self.get_model_performance_metrics(models, X, y),
                "confidence_scores": confidence_scores,
                "ensemble_weights": ensemble_weights,
                "prediction_horizon": prediction_horizon,
                "timestamp": datetime.now().isoformat(),
                "models_used": list(models.keys())
            }
            
        except Exception as e:
            print(f"❌ Error in ML predictions: {str(e)}")
            return self.generate_fallback_predictions(symbols, prediction_horizon, error=str(e))

    def prepare_training_data(self, feature_data, symbols, horizon):
        """
        Prepare training data from portfolio and market features
        """
        try:
            print("📊 Preparing training data...")
            
            # Extract features from input data
            portfolio_features = feature_data.get('portfolio_features', {})
            market_features = feature_data.get('market_features', {})
            technical_features = feature_data.get('technical_features', {})
            fundamental_features = feature_data.get('fundamental_features', {})
            macro_features = feature_data.get('macro_features', {})
            
            # Create feature matrix
            X_data = []
            y_data = []
            symbol_mapping = {}
            
            for i, symbol in enumerate(symbols):
                symbol_mapping[i] = symbol
                
                # Collect features for this symbol
                features = []
                
                # Technical features (most important for short-term prediction)
                tech_data = technical_features.get(symbol, {})
                features.extend([
                    tech_data.get('rsi', 50) / 100.0,  # Normalize RSI
                    tech_data.get('momentum', 0),
                    tech_data.get('volatility', 0.2),
                    tech_data.get('bollinger_position', 0.5),
                    tech_data.get('macd', {}).get('macd', 0) if isinstance(tech_data.get('macd'), dict) else 0
                ])
                
                # Fundamental features (for longer-term prediction)
                fund_data = fundamental_features.get(symbol, {})
                features.extend([
                    self.normalize_ratio(fund_data.get('pe_ratio', 20), 50),
                    self.normalize_ratio(fund_data.get('pb_ratio', 3), 10),
                    fund_data.get('roe', 0.15),
                    fund_data.get('revenue_growth', 0.05),
                    fund_data.get('profit_margin', 0.1)
                ])
                
                # Market features
                features.extend([
                    market_features.get('market_volatility', 0.2),
                    market_features.get('market_momentum', 0),
                    market_features.get('sector_rotation', {}).get('score', 0) / 100.0
                ])
                
                # Macro features
                features.extend([
                    macro_features.get('yield_curve_slope', 0),
                    macro_features.get('credit_spreads', 0.02),
                    macro_features.get('dollar_strength', 0),
                    macro_features.get('commodity_momentum', 0)
                ])
                
                # Add time-based features
                current_date = datetime.now()
                features.extend([
                    current_date.month / 12.0,  # Seasonal factors
                    current_date.weekday() / 6.0,  # Day of week
                    (current_date.day - 1) / 30.0  # Day of month
                ])
                
                # Ensure we have the expected number of features
                while len(features) < 20:
                    features.append(0.0)
                
                X_data.append(features[:20])  # Limit to 20 features
                
                # Generate synthetic target (return) - in production this would be historical returns
                target_return = self.generate_synthetic_target(symbol, horizon, features)
                y_data.append(target_return)
            
            if not X_data:
                return None, None, None
            
            X = np.array(X_data)
            y = np.array(y_data)
            
            # Store feature column names for later use
            self.feature_columns = [
                'rsi', 'momentum', 'volatility', 'bollinger_pos', 'macd',
                'pe_ratio', 'pb_ratio', 'roe', 'revenue_growth', 'profit_margin',
                'market_vol', 'market_momentum', 'sector_rotation',
                'yield_slope', 'credit_spreads', 'dollar_strength', 'commodity_momentum',
                'month', 'weekday', 'day'
            ]
            
            print(f"✅ Training data prepared: {X.shape[0]} samples, {X.shape[1]} features")
            return X, y, symbol_mapping
            
        except Exception as e:
            print(f"❌ Error preparing training data: {str(e)}")
            return None, None, None

    def train_ensemble_models(self, X, y, force_retrain=False):
        """
        Train or load ensemble models
        """
        models = {}
        
        try:
            # Random Forest Model
            print("🌲 Training Random Forest model...")
            rf_model = RandomForestRegressor(**self.rf_params)
            rf_model.fit(X, y)
            models['random_forest'] = rf_model
            
            # Linear/Ridge Regression Model
            print("📈 Training Linear Regression model...")
            linear_model = Ridge(**self.linear_params)
            
            # Scale features for linear model
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            linear_model.fit(X_scaled, y)
            
            models['linear'] = linear_model
            models['scaler'] = scaler
            
            # LSTM Model (if available)
            if LSTM_AVAILABLE and len(X) > 50:  # Need sufficient data for LSTM
                print("🧠 Training LSTM model...")
                lstm_model = self.train_lstm_model(X, y)
                if lstm_model is not None:
                    models['lstm'] = lstm_model
                else:
                    print("⚠️ LSTM training failed, using ensemble without LSTM")
            
            print(f"✅ Ensemble models trained: {list(models.keys())}")
            return models
            
        except Exception as e:
            print(f"❌ Error training models: {str(e)}")
            # Return simple linear model as fallback
            try:
                fallback_model = LinearRegression()
                fallback_model.fit(X, y)
                return {'linear': fallback_model}
            except:
                return {}

    def train_lstm_model(self, X, y):
        """
        Train LSTM model for time series prediction
        """
        try:
            if not LSTM_AVAILABLE:
                return None
            
            # Reshape data for LSTM (samples, timesteps, features)
            sequence_length = min(self.lstm_params['sequence_length'], len(X) // 2)
            
            # Create sequences
            X_sequences = []
            y_sequences = []
            
            for i in range(sequence_length, len(X)):
                X_sequences.append(X[i-sequence_length:i])
                y_sequences.append(y[i])
            
            if len(X_sequences) < 10:  # Not enough data for LSTM
                return None
            
            X_lstm = np.array(X_sequences)
            y_lstm = np.array(y_sequences)
            
            # Build LSTM model
            model = Sequential([
                LSTM(self.lstm_params['units'], return_sequences=True, input_shape=(sequence_length, X.shape[1])),
                Dropout(self.lstm_params['dropout']),
                LSTM(self.lstm_params['units'] // 2, return_sequences=False),
                Dropout(self.lstm_params['dropout']),
                Dense(25, activation='relu'),
                Dense(1)
            ])
            
            model.compile(
                optimizer=Adam(learning_rate=0.001),
                loss='mse',
                metrics=['mae']
            )
            
            # Train model
            history = model.fit(
                X_lstm, y_lstm,
                epochs=min(self.lstm_params['epochs'], 20),  # Limit epochs for speed
                batch_size=self.lstm_params['batch_size'],
                validation_split=0.2,
                verbose=0
            )
            
            return model
            
        except Exception as e:
            print(f"⚠️ LSTM training error: {str(e)}")
            return None

    def make_ensemble_predictions(self, X, models, symbols, symbol_mapping, ensemble_weights):
        """
        Generate predictions using ensemble of models
        """
        predictions = {}
        
        try:
            for i, symbol in enumerate(symbols):
                symbol_predictions = {}
                prediction_values = []
                model_contributions = {}
                
                # Get single sample for this symbol
                sample = X[i:i+1] if len(X) > i else X[0:1]
                
                # Random Forest prediction
                if 'random_forest' in models:
                    rf_pred = models['random_forest'].predict(sample)[0]
                    prediction_values.append(rf_pred * ensemble_weights.get('random_forest', 0))
                    model_contributions['random_forest'] = rf_pred
                
                # Linear model prediction
                if 'linear' in models:
                    sample_scaled = models.get('scaler', StandardScaler()).transform(sample) if 'scaler' in models else sample
                    linear_pred = models['linear'].predict(sample_scaled)[0]
                    prediction_values.append(linear_pred * ensemble_weights.get('linear', 0))
                    model_contributions['linear'] = linear_pred
                
                # LSTM prediction (if available)
                if 'lstm' in models and LSTM_AVAILABLE:
                    # For LSTM, we need sequence data - use repeated sample as fallback
                    sequence_length = self.lstm_params['sequence_length']
                    lstm_input = np.repeat(sample, sequence_length, axis=0).reshape(1, sequence_length, -1)
                    lstm_pred = models['lstm'].predict(lstm_input, verbose=0)[0][0]
                    prediction_values.append(lstm_pred * ensemble_weights.get('lstm', 0))
                    model_contributions['lstm'] = lstm_pred
                
                # Ensemble prediction
                ensemble_prediction = sum(prediction_values) if prediction_values else 0.0
                
                # Ensure prediction is reasonable (between -50% and +100% return)
                ensemble_prediction = max(-0.5, min(1.0, ensemble_prediction))
                
                # Convert to percentage and add confidence metrics
                predictions[symbol] = {
                    "expected_return": ensemble_prediction,
                    "expected_return_percent": ensemble_prediction * 100,
                    "direction": "bullish" if ensemble_prediction > 0.02 else "bearish" if ensemble_prediction < -0.02 else "neutral",
                    "confidence": min(0.9, max(0.1, abs(ensemble_prediction) * 2)),  # Higher magnitude = higher confidence
                    "model_contributions": model_contributions,
                    "ensemble_weight": ensemble_weights
                }
            
            return predictions
            
        except Exception as e:
            print(f"❌ Error making predictions: {str(e)}")
            return self.generate_simple_fallback_predictions(symbols)

    def calculate_confidence_scores(self, predictions, X, y, models):
        """
        Calculate confidence scores for predictions
        """
        confidence_scores = {}
        
        try:
            # Calculate cross-validation scores for model performance
            if 'random_forest' in models and len(X) > 5:
                cv_scores = cross_val_score(models['random_forest'], X, y, cv=min(5, len(X)), scoring='neg_mean_squared_error')
                avg_cv_score = -cv_scores.mean()
                
                # Convert MSE to confidence (lower MSE = higher confidence)
                model_confidence = max(0.1, min(0.9, 1.0 / (1.0 + avg_cv_score)))
            else:
                model_confidence = 0.5
            
            # Calculate confidence for each symbol
            for symbol, pred_data in predictions.items():
                # Base confidence from prediction magnitude
                magnitude_confidence = min(0.9, abs(pred_data['expected_return']) * 2)
                
                # Model agreement (if multiple models)
                contributions = pred_data.get('model_contributions', {})
                if len(contributions) > 1:
                    values = list(contributions.values())
                    agreement = 1.0 - (np.std(values) / (np.mean(np.abs(values)) + 0.001))
                    agreement_confidence = max(0.1, min(0.9, agreement))
                else:
                    agreement_confidence = 0.7
                
                # Combined confidence
                combined_confidence = (magnitude_confidence * 0.4 + model_confidence * 0.3 + agreement_confidence * 0.3)
                
                confidence_scores[symbol] = {
                    "overall_confidence": combined_confidence,
                    "magnitude_confidence": magnitude_confidence,
                    "model_confidence": model_confidence,
                    "agreement_confidence": agreement_confidence
                }
            
            return confidence_scores
            
        except Exception as e:
            print(f"⚠️ Error calculating confidence: {str(e)}")
            return {symbol: {"overall_confidence": 0.5} for symbol in predictions.keys()}

    def validate_predictions(self, predictions, confidence_scores):
        """
        Validate and adjust predictions based on confidence and reasonableness
        """
        validated = {}
        
        for symbol, pred_data in predictions.items():
            confidence = confidence_scores.get(symbol, {}).get('overall_confidence', 0.5)
            
            # Adjust prediction based on confidence
            if confidence < 0.3:
                # Low confidence - moderate the prediction
                pred_data['expected_return'] *= 0.5
                pred_data['expected_return_percent'] *= 0.5
                pred_data['direction'] = 'neutral'
                pred_data['warning'] = 'Low confidence prediction - treat with caution'
            
            # Ensure reasonable bounds
            pred_data['expected_return'] = max(-0.5, min(1.0, pred_data['expected_return']))
            pred_data['expected_return_percent'] = pred_data['expected_return'] * 100
            
            # Add risk warnings for extreme predictions
            if abs(pred_data['expected_return']) > 0.3:
                pred_data['risk_warning'] = 'Extreme prediction - high uncertainty'
            
            validated[symbol] = pred_data
        
        return validated

    def get_model_performance_metrics(self, models, X, y):
        """
        Calculate model performance metrics
        """
        metrics = {}
        
        try:
            if 'random_forest' in models and len(X) > 5:
                rf_pred = models['random_forest'].predict(X)
                metrics['random_forest'] = {
                    'mse': mean_squared_error(y, rf_pred),
                    'mae': mean_absolute_error(y, rf_pred),
                    'feature_importance': models['random_forest'].feature_importances_.tolist()
                }
            
            if 'linear' in models and len(X) > 5:
                X_scaled = models.get('scaler', StandardScaler()).transform(X) if 'scaler' in models else X
                linear_pred = models['linear'].predict(X_scaled)
                metrics['linear'] = {
                    'mse': mean_squared_error(y, linear_pred),
                    'mae': mean_absolute_error(y, linear_pred),
                    'coefficients': models['linear'].coef_.tolist() if hasattr(models['linear'], 'coef_') else []
                }
            
            # Add overall ensemble performance
            metrics['ensemble'] = {
                'models_used': list(models.keys()),
                'training_samples': len(X),
                'feature_count': X.shape[1] if len(X) > 0 else 0
            }
            
        except Exception as e:
            print(f"⚠️ Error calculating performance metrics: {str(e)}")
            metrics['error'] = str(e)
        
        return metrics

    # Helper methods
    def normalize_ratio(self, value, max_val):
        """Normalize financial ratios to 0-1 range"""
        return min(1.0, max(0.0, value / max_val)) if value is not None and max_val > 0 else 0.5

    def generate_synthetic_target(self, symbol, horizon, features):
        """
        Generate synthetic target for training (in production, use historical returns)
        """
        # Simple synthetic target based on features
        tech_score = features[0] + features[1] - features[2]  # RSI + momentum - volatility
        fund_score = features[6] + features[7] - features[5]  # ROE + growth - P/B ratio
        market_score = features[11] - features[10]  # Market momentum - volatility
        
        # Combine scores with some randomness
        base_return = (tech_score * 0.4 + fund_score * 0.4 + market_score * 0.2)
        
        # Add time horizon effect (longer horizon = larger potential returns)
        horizon_effect = horizon / 252.0  # Assume 252 trading days per year
        
        # Add some noise
        noise = np.random.normal(0, 0.05)
        
        synthetic_return = (base_return * horizon_effect) + noise
        
        # Bound the return to reasonable limits
        return max(-0.5, min(1.0, synthetic_return))

    def generate_fallback_predictions(self, symbols, horizon, error=None):
        """Generate simple fallback predictions when ML fails"""
        fallback_predictions = {}
        
        for symbol in symbols:
            # Simple market-based prediction
            base_return = 0.08 / (252 / horizon)  # 8% annual return adjusted for horizon
            
            fallback_predictions[symbol] = {
                "expected_return": base_return,
                "expected_return_percent": base_return * 100,
                "direction": "neutral",
                "confidence": 0.3,
                "model_contributions": {"fallback": base_return},
                "warning": "Using fallback prediction - ML models unavailable"
            }
        
        return {
            "success": False,
            "error": error,
            "predictions": fallback_predictions,
            "fallback_mode": True,
            "timestamp": datetime.now().isoformat()
        }

    def generate_simple_fallback_predictions(self, symbols):
        """Generate very simple predictions as last resort"""
        predictions = {}
        
        for symbol in symbols:
            predictions[symbol] = {
                "expected_return": 0.05,  # 5% return
                "expected_return_percent": 5.0,
                "direction": "neutral",
                "confidence": 0.2
            }
        
        return predictions


def main():
    """Main entry point for the ML predictions service"""
    try:
        # Read input from command line
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        # Create service instance and generate predictions
        ml_service = MLPredictionsService()
        result = ml_service.generate_predictions(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "fallback_predictions": {},
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))


if __name__ == "__main__":
    main()
