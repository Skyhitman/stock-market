from datetime import timedelta
from sqlalchemy.orm import Session
from .. import models

def run_historical_backtest(db: Session, days: int = 90):
    """
    Simulates a simple strategy:
    Buy the top 3 highest Opportunity Score stocks every 5 days.
    Compare the portfolio value against holding Nifty 50.
    """
    # 1. Get dates range
    features = db.query(models.StockFeature.date).filter(models.StockFeature.ticker == '^NSEI').order_by(models.StockFeature.date.asc()).all()
    if not features:
        return []
    
    dates = sorted(list(set([f.date for f in features])))
    if len(dates) > days:
        dates = dates[-days:]
        
    if not dates:
        return []

    # Pre-fetch opportunity scores
    opps = db.query(models.OpportunityScore).all()
    # Mocking historical opportunity scores based on features to simplify backtesting
    # A real backtest would require point-in-time scores, but since we just seeded, 
    # we'll approximate point-in-time scores using RSI and MACD
    
    results = []
    portfolio_value = 10000.0
    benchmark_value = 10000.0
    
    holdings = [] # List of tickers
    holding_days = 0
    
    for i, current_date in enumerate(dates):
        # Update benchmark
        nifty_feat = db.query(models.StockFeature).filter(models.StockFeature.ticker == '^NSEI', models.StockFeature.date == current_date).first()
        if nifty_feat and nifty_feat.daily_return:
            benchmark_value *= (1 + nifty_feat.daily_return)
            
        # Update portfolio
        daily_pnl_pct = 0
        if holdings:
            port_returns = []
            for t in holdings:
                feat = db.query(models.StockFeature).filter(models.StockFeature.ticker == t, models.StockFeature.date == current_date).first()
                if feat and feat.daily_return:
                    port_returns.append(feat.daily_return)
            if port_returns:
                daily_pnl_pct = sum(port_returns) / len(port_returns)
                portfolio_value *= (1 + daily_pnl_pct)
        else:
            # If no holdings, it acts like cash (no return)
            pass
            
        results.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "Portfolio": round(portfolio_value, 2),
            "Benchmark": round(benchmark_value, 2)
        })
        
        # Strategy Execution: Rebalance every 5 days
        holding_days += 1
        if holding_days >= 5 or not holdings:
            # Find top 3 stocks by RSI (proxy for opportunity since we don't have historical opp scores)
            top_stocks = db.query(models.StockFeature).filter(
                models.StockFeature.date == current_date,
                models.StockFeature.ticker != '^NSEI'
            ).order_by(models.StockFeature.rsi.asc()).limit(3).all() # Oversold
            
            holdings = [s.ticker for s in top_stocks]
            holding_days = 0

    return results
