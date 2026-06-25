from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd

def cluster_market_structure(features_df: pd.DataFrame, n_clusters: int = 4) -> dict:
    """
    K-Means clustering based on latest features.
    features_df must contain: daily_return, rolling_volatility (or atr), volume_ratio, rsi, stock_vs_nifty.
    Returns a dictionary mapping ticker -> cluster label and centroids description.
    """
    if features_df.empty or len(features_df) < n_clusters:
        return {}

    # Define the required features for clustering
    req_cols = ['daily_return', 'rolling_volatility', 'volume_ratio', 'rsi', 'stock_vs_nifty']
    
    # Check if we have all columns, else fallback
    available_cols = [c for c in req_cols if c in features_df.columns]
    
    # Fill any NaNs
    cluster_data = features_df[available_cols].fillna(0)
    
    # Standardize the features
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(cluster_data)
    
    # Run K-Means
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(scaled_data)
    
    # Create output
    results = {}
    tickers = features_df['ticker'].values if 'ticker' in features_df.columns else features_df.index
    
    for i, ticker in enumerate(tickers):
        results[ticker] = int(labels[i])
        
    centroids = kmeans.cluster_centers_
    # Inverse transform to get real feature values for description
    real_centroids = scaler.inverse_transform(centroids)
    
    centroid_descriptions = {}
    for i in range(n_clusters):
        desc = {col: float(real_centroids[i][j]) for j, col in enumerate(available_cols)}
        centroid_descriptions[i] = desc
        
    return {
        "labels": results,
        "centroids": centroid_descriptions
    }
