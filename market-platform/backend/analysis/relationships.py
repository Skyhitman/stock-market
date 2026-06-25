import pandas as pd
import numpy as np

def calculate_correlations(history_df_dict: dict, sector_stocks: list, window: int = 60) -> list:
    """
    Calculates Pearson correlation between stocks in a sector.
    history_df_dict: mapping of ticker -> DataFrame with historical features.
    """
    results = []
    
    # Align data on dates
    price_df = pd.DataFrame()
    for ticker in sector_stocks:
        if ticker in history_df_dict and not history_df_dict[ticker].empty:
            # Get last 'window' days
            df = history_df_dict[ticker].tail(window).set_index('date')
            price_df[ticker] = df['daily_return']
            
    if price_df.empty:
        return results
        
    price_df = price_df.dropna()
    
    if len(price_df) < 5: # Not enough data
        return results

    # Full window Pearson correlation
    pearson_corr_matrix = price_df.corr(method='pearson')
    
    # 20-day rolling correlation (latest value)
    rolling_corr_matrix = price_df.tail(20).corr(method='pearson')
    
    # Lag correlation (A today vs B tomorrow)
    # B tomorrow means shift B backwards by 1
    lag_df = price_df.shift(-1)
    
    for i in range(len(sector_stocks)):
        for j in range(i + 1, len(sector_stocks)):
            ticker_a = sector_stocks[i]
            ticker_b = sector_stocks[j]
            
            if ticker_a in price_df.columns and ticker_b in price_df.columns:
                p_corr = pearson_corr_matrix.loc[ticker_a, ticker_b]
                r_corr = rolling_corr_matrix.loc[ticker_a, ticker_b]
                
                # A today vs B tomorrow
                valid_idx = price_df[ticker_a].notna() & lag_df[ticker_b].notna()
                if valid_idx.sum() > 5:
                    lag_corr_ab = np.corrcoef(price_df[ticker_a][valid_idx], lag_df[ticker_b][valid_idx])[0, 1]
                else:
                    lag_corr_ab = 0.0
                    
                results.append({
                    "ticker_a": ticker_a,
                    "ticker_b": ticker_b,
                    "pearson_corr": p_corr,
                    "rolling_corr": r_corr,
                    "lag_corr_ab": lag_corr_ab # A leads B
                })
                
    return results

def detect_leaders(correlation_results: list, sector_stocks: list) -> dict:
    """
    Identifies the leader stock in a sector based on average lag correlation.
    """
    lead_scores = {ticker: 0.0 for ticker in sector_stocks}
    lead_counts = {ticker: 0 for ticker in sector_stocks}
    
    for res in correlation_results:
        # A leads B
        if res["lag_corr_ab"] > 0:
             lead_scores[res["ticker_a"]] += res["lag_corr_ab"]
             lead_counts[res["ticker_a"]] += 1
             
    # Calculate averages
    avg_lead = {}
    for ticker in sector_stocks:
        if lead_counts[ticker] > 0:
            avg_lead[ticker] = lead_scores[ticker] / lead_counts[ticker]
        else:
            avg_lead[ticker] = 0.0
            
    # Find max leader
    if not avg_lead:
        return {"leader": None, "followers": []}
        
    leader = max(avg_lead.items(), key=lambda x: x[1])[0]
    
    # Sort followers by score
    followers = [{"ticker": t, "score": avg_lead[t]} for t in sector_stocks if t != leader]
    followers = sorted(followers, key=lambda x: x["score"], reverse=True)
    
    return {
        "leader": leader,
        "leader_score": avg_lead[leader],
        "followers": followers
    }
