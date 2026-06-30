import pandas as pd
import numpy as np

def calculate_sector_metrics(stocks_df: pd.DataFrame, nifty_return: float) -> dict:
    """
    Calculate metrics for a single sector.
    stocks_df should contain features for all stocks in the sector for the current day.
    """
    if stocks_df.empty:
        return {}
        
    # Equal-weight average of stock returns
    sector_return = stocks_df['daily_return'].mean()
    
    # 5-day rolling sector return (momentum) - assuming we calculate this historically and pass it in
    # Here we just use the mean of weekly_returns as a proxy for sector momentum if historical sector returns aren't built
    sector_momentum = stocks_df['weekly_return'].mean()
    
    # Relative strength vs Nifty
    # To handle division by zero or near zero, we use subtraction or simple ratio
    if nifty_return != 0:
        relative_strength = sector_return / nifty_return
    else:
        relative_strength = 1.0 # fallback
        
    # Volume activity
    volume_activity = stocks_df['volume_ratio'].mean()
    
    # Breadth (% stocks above EMA20)
    # Check if close > ema20
    above_ema20 = (stocks_df['close'] > stocks_df['ema20']).sum()
    breadth = (above_ema20 / len(stocks_df)) * 100
    
    # Sector strength score (0-100)
    # Normalize components (rough approximation, in a real system we'd use z-scores)
    # Let's map momentum (-0.05 to 0.05) -> (0 to 100)
    norm_momentum = np.clip((sector_momentum + 0.05) * 1000, 0, 100)
    # Let's map RS (-0.05 to 0.05) -> (0 to 100)
    rs_diff = sector_return - nifty_return
    norm_rs = np.clip((rs_diff + 0.05) * 1000, 0, 100)
    # Volume: 1.0 -> 50, 2.0 -> 100
    norm_vol = np.clip(volume_activity * 50, 0, 100)
    
    strength_score = (
        0.40 * norm_momentum +
        0.30 * norm_rs +
        0.20 * norm_vol +
        0.10 * breadth
    )
    
    # CRITICAL FILTER: If the sector is down today, cap its strength score to 40
    # This prevents red sectors from showing up as top performers
    if sector_return < 0:
        strength_score = min(strength_score, 40)
    
    return {
        "sector_return": sector_return,
        "sector_momentum": sector_momentum,
        "relative_strength": relative_strength,
        "strength_score": np.clip(strength_score, 0, 100)
    }

def rank_sectors(sector_metrics: dict) -> list:
    """
    Takes a dictionary mapping sector name to its metrics dictionary.
    Returns list of sectors ranked by strength_score descending.
    """
    sorted_sectors = sorted(
        sector_metrics.items(), 
        key=lambda item: item[1].get('strength_score', 0), 
        reverse=True
    )
    
    ranked = []
    for rank, (sector, metrics) in enumerate(sorted_sectors, 1):
        metrics['rank'] = rank
        metrics['sector'] = sector
        ranked.append(metrics)
        
    return ranked
