import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from .cache import history_cache, intraday_cache
from cachetools import cached
from .constants import STOCKS, BENCHMARK, get_all_tickers


@cached(history_cache)
def fetch_historical_data(ticker: str, period: str = "3y"):
    """
    Fetches historical daily data for a ticker.
    Cached for 24 hours to avoid hitting rate limits.
    """
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        if df.empty:
            return pd.DataFrame()
        
        # Handle missing data: forward fill then drop >10% NaN (we'll just drop rows if they have NaNs after ffill)
        df = df.ffill().dropna()
        
        # Reset index to make Date a column instead of index
        df = df.reset_index()
        # Clean column names to lowercase for consistency
        df.columns = [col.lower() for col in df.columns]
        
        # yfinance sometimes returns timezone aware dates, convert to naive
        if hasattr(df['date'].dtype, 'tz') and df['date'].dtype.tz is not None:
             df['date'] = df['date'].dt.tz_localize(None)
             
        # Extract just the date part for daily data
        df['date'] = df['date'].dt.date
             
        return df[['date', 'open', 'high', 'low', 'close', 'volume']]
    except Exception as e:
        print(f"Error fetching historical data for {ticker}: {e}")
        return pd.DataFrame()

@cached(intraday_cache)
def fetch_intraday_data(ticker: str, period: str = "5d", interval: str = "5m"):
    """
    Fetches intraday data for a ticker.
    Cached for 5 minutes.
    """
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)
        if df.empty:
            return pd.DataFrame()
            
        df = df.ffill().dropna()
        df = df.reset_index()
        df.columns = [col.lower() for col in df.columns]
        
        if 'datetime' in df.columns:
            df = df.rename(columns={'datetime': 'date'})
            
        if hasattr(df['date'].dtype, 'tz') and df['date'].dtype.tz is not None:
             df['date'] = df['date'].dt.tz_localize(None)
             
        return df[['date', 'open', 'high', 'low', 'close', 'volume']]
    except Exception as e:
        print(f"Error fetching intraday data for {ticker}: {e}")
        return pd.DataFrame()

def fetch_latest_price(ticker: str) -> float:
    """Convenience method to get current price"""
    try:
        stock = yf.Ticker(ticker)
        # Fast grab of the last row's close
        df = stock.history(period='1d')
        if not df.empty:
            return float(df['Close'].iloc[-1])
        return 0.0
    except Exception as e:
        print(f"Error fetching latest price for {ticker}: {e}")
        return 0.0
