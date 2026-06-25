import pandas as pd
import numpy as np

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    # Handle division by zero
    rs = np.where(loss == 0, 100, gain / loss)
    rsi = 100 - (100 / (1 + rs))
    
    # Return as pandas Series with original index
    return pd.Series(rsi, index=series.index).fillna(50) # Default to 50 for NaN

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    macd_signal = macd.ewm(span=signal, adjust=False).mean()
    macd_hist = macd - macd_signal
    return macd, macd_signal, macd_hist

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    
    atr = true_range.rolling(period).mean()
    return atr.bfill()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a DataFrame with ['date', 'open', 'high', 'low', 'close', 'volume']
    Returns DataFrame with all computed features.
    Assumes df is sorted by date ascending.
    """
    if df.empty or len(df) < 200:
        return df # Not enough data for EMA200
        
    df = df.copy()
    
    # Price features
    df['prev_close'] = df['close'].shift(1)
    df['daily_return'] = (df['close'] - df['prev_close']) / df['prev_close']
    df['weekly_return'] = df['close'].pct_change(periods=5)
    df['monthly_return'] = df['close'].pct_change(periods=21)
    
    df['gap'] = df['open'] - df['prev_close']
    df['intraday_change'] = df['close'] - df['open']
    df['high_low_range'] = df['high'] - df['low']
    
    # Trend (EMA)
    df['ema20'] = df['close'].ewm(span=20, adjust=False).mean()
    df['ema50'] = df['close'].ewm(span=50, adjust=False).mean()
    df['ema100'] = df['close'].ewm(span=100, adjust=False).mean()
    df['ema200'] = df['close'].ewm(span=200, adjust=False).mean()
    
    # Momentum
    df['rsi'] = calculate_rsi(df['close'], period=14)
    macd, macd_signal, macd_hist = calculate_macd(df['close'])
    df['macd'] = macd
    df['macd_signal'] = macd_signal
    df['macd_hist'] = macd_hist
    
    # Volatility
    df['atr'] = calculate_atr(df, period=14)
    df['rolling_volatility'] = df['daily_return'].rolling(window=20).std()
    
    # Volume
    df['avg_volume'] = df['volume'].rolling(window=20).mean()
    # Handle zero division
    df['volume_ratio'] = np.where(df['avg_volume'] > 0, df['volume'] / df['avg_volume'], 1.0)
    df['volume_spike'] = df['volume_ratio'] > 2.0
    
    # Fill NaN values created by shifts/rolling windows using backfill or 0
    df = df.bfill()
    
    return df
