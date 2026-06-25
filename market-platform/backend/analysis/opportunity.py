import json

def calculate_opportunity_score(stock_features: dict, sector_strength: float) -> dict:
    """
    Calculates the 0-100 opportunity score for a single stock.
    Now strictly penalizes negative daily performance.
    """
    # 20% Sector Strength
    w_sector = 0.20 * sector_strength
    
    # 20% Relative Strength (vs Nifty)
    rs = stock_features.get('stock_vs_nifty', 0)
    norm_rs = max(0, min(100, (rs + 0.03) * (100 / 0.06)))
    w_rs = 0.20 * norm_rs
    
    # 30% Today's Absolute Return (NEW)
    # Map -2% to +2% -> 0 to 100
    daily_ret = stock_features.get('daily_return', 0)
    norm_daily = max(0, min(100, (daily_ret + 0.02) * (100 / 0.04)))
    w_daily = 0.30 * norm_daily
    
    # 15% Momentum (RSI + MACD combined)
    rsi = stock_features.get('rsi', 50)
    norm_rsi = max(0, min(100, rsi))
    macd_hist = stock_features.get('macd_hist', 0)
    norm_macd = 100 if macd_hist > 0 else (50 if macd_hist == 0 else 0)
    w_mom = 0.15 * ((norm_rsi * 0.6) + (norm_macd * 0.4))
    
    # 15% Volume Ratio
    vol_ratio = stock_features.get('volume_ratio', 1.0)
    norm_vol = max(0, min(100, vol_ratio * 50))
    w_vol = 0.15 * norm_vol
    
    total_score = w_sector + w_rs + w_daily + w_mom + w_vol
    
    # CRITICAL FILTER: If today's return is negative, cap the max possible score to 40
    # This prevents red stocks from showing up as top opportunities over surging stocks
    if daily_ret < 0:
        total_score = min(total_score, 40)
        
    total_score = max(0, min(100, total_score))
    
    # Generate explanations
    reasons = []
    if daily_ret < 0:
        reasons.append(f"Penalty: Stock is down {(daily_ret*100):.2f}% today")
    else:
        reasons.append(f"Strong absolute performance: +{(daily_ret*100):.2f}% today")
        
    if rs > 0.01:
        reasons.append(f"Outperforming Nifty by {(rs*100):.1f}%")
        
    if vol_ratio > 1.5:
        reasons.append(f"High volume detected ({vol_ratio:.1f}x avg)")
        
    explanation = {
        "score": round(total_score),
        "reasons": reasons,
        "weights": {
            "sector_strength": round(w_sector, 1),
            "relative_strength": round(w_rs, 1),
            "todays_return": round(w_daily, 1),
            "momentum": round(w_mom, 1),
            "volume": round(w_vol, 1)
        }
    }
    
    return {
        "score": total_score,
        "sector_weight": w_sector,
        "momentum_weight": w_mom,
        "volume_weight": w_vol,
        "rs_weight": w_rs,
        "explanation_json": json.dumps(explanation)
    }
