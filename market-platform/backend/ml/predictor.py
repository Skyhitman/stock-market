import xgboost as xgb
import shap
import pandas as pd
import numpy as np
import json
import os

MODEL_PATH = "backend/ml/xgboost_model.json"

def prepare_training_data(historical_df: pd.DataFrame):
    """
    Prepares data for XGBoost.
    Target: 1 if next day close > today close else 0.
    """
    df = historical_df.copy()
    
    # Create target
    df['next_close'] = df.groupby('ticker')['close'].shift(-1)
    df = df.dropna(subset=['next_close'])
    
    df['target'] = (df['next_close'] > df['close']).astype(int)
    
    features = [
        'open', 'high', 'low', 'close', 'volume', 'rsi', 'macd',
        'ema20', 'ema50', 'ema200', 'atr', 'daily_return', 'volume_ratio'
    ]
    # In a full run, we would also merge sector_strength_score, sector_rank, nifty_return, etc.
    # We will assume historical_df already contains these if available.
    
    available_features = [f for f in features if f in df.columns]
    
    df = df.dropna(subset=available_features)
    
    X = df[available_features]
    y = df['target']
    
    return X, y, available_features

def train_predictor(historical_df: pd.DataFrame):
    X, y, features = prepare_training_data(historical_df)
    
    if len(X) < 100:
        return False
        
    model = xgb.XGBClassifier(
        n_estimators=100, 
        max_depth=4, 
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X, y)
    
    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save_model(MODEL_PATH)
    
    return True

def predict_next_day(latest_features: pd.DataFrame):
    """
    Predicts next day direction for a single row or dataframe.
    """
    if not os.path.exists(MODEL_PATH):
        return None
        
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    features = [
        'open', 'high', 'low', 'close', 'volume', 'rsi', 'macd',
        'ema20', 'ema50', 'ema200', 'atr', 'daily_return', 'volume_ratio'
    ]
    available_features = [f for f in features if f in latest_features.columns]
    
    X = latest_features[available_features].fillna(0)
    
    # Predict
    prob = model.predict_proba(X)
    preds = model.predict(X)
    
    results = []
    
    # SHAP explanations
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # Handle multi-class / binary shap output format
    if isinstance(shap_values, list):
        shap_vals = shap_values[1] # positive class
    else:
        shap_vals = shap_values
        
    for i in range(len(X)):
        direction = "Bullish" if preds[i] == 1 else "Bearish"
        confidence = float(prob[i][1] if preds[i] == 1 else prob[i][0]) * 100
        
        # Get top 5 SHAP factors
        row_shap = np.abs(shap_vals[i])
        top_idx = np.argsort(row_shap)[-5:][::-1]
        
        top_factors = []
        for idx in top_idx:
            feat_name = available_features[idx]
            val = float(shap_vals[i][idx])
            impact = "+high" if val > 0.1 else ("+medium" if val > 0 else ("-medium" if val > -0.1 else "-high"))
            
            top_factors.append({
                "feature": feat_name,
                "impact": impact,
                "shap": round(val, 4)
            })
            
        current_close = float(latest_features.iloc[i]['close']) if 'close' in latest_features.columns else 0.0
        # Dummy prediction for open/close values (since we classify direction)
        # We can simulate pred_close based on confidence
        expected_change = 0.01 * (confidence / 50.0) # 1-2%
        if direction == "Bearish":
            expected_change = -expected_change
            
        pred_close = current_close * (1 + expected_change)
        
        results.append({
            "ticker": latest_features.iloc[i]['ticker'] if 'ticker' in latest_features.columns else "UNKNOWN",
            "pred_open": round(current_close, 2),
            "pred_close": round(pred_close, 2),
            "direction": direction,
            "confidence": round(confidence, 1),
            "top_factors": top_factors
        })
        
    return results
