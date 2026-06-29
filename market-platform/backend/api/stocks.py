from .utils import get_data_date_info
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

@router.get("/overview")
def get_stocks_overview(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    if not stocks:
        return []

    data_info = get_data_date_info(db)
    result = []

    for stock in stocks:
        f = db.query(models.StockFeature).filter(
            models.StockFeature.ticker == stock.ticker
        ).order_by(models.StockFeature.date.desc()).first()
        
        if not f:
            continue
            
        opp = db.query(models.OpportunityScore).filter(
            models.OpportunityScore.ticker == stock.ticker
        ).order_by(models.OpportunityScore.date.desc()).first()
        
        result.append({
            "ticker": stock.ticker,
            "name": stock.name if stock else stock.ticker.replace(".NS", ""),
            "sector": stock.sector if stock else "Unknown",
            "rsi": round(f.rsi, 1) if f.rsi else 0,
            "macd": round(f.macd, 4) if f.macd else 0,
            "daily_return": round(f.daily_return * 100, 2) if f.daily_return else 0,
            "volume_ratio": round(f.volume_ratio, 2) if f.volume_ratio else 0,
            "ema20": round(f.ema20, 2) if f.ema20 else 0,
            "ema50": round(f.ema50, 2) if f.ema50 else 0,
            "atr": round(f.atr, 2) if f.atr else 0,
            "opportunity_score": round(opp.score, 1) if opp else 0,
            "date": data_info["trading_date"],
            "last_updated": data_info["last_updated"],
        })
        
    return sorted(result, key=lambda x: x["opportunity_score"], reverse=True)

@router.get("/{ticker}/detail")
def get_stock_detail(ticker: str, db: Session = Depends(get_db)):
    features = db.query(models.StockFeature).filter(
        models.StockFeature.ticker == ticker
    ).order_by(models.StockFeature.date.desc()).limit(30).all()
    if not features:
        raise HTTPException(status_code=404, detail="Stock not found")

    opp = db.query(models.OpportunityScore).filter(
        models.OpportunityScore.ticker == ticker
    ).order_by(models.OpportunityScore.date.desc()).first()

    stock = db.query(models.Stock).filter(models.Stock.ticker == ticker).first()

    return {
        "ticker": ticker,
        "name": stock.name if stock else ticker,
        "sector": stock.sector if stock else "Unknown",
        "latest_features": features[0],
        "history": features,
        "opportunity": opp,
    }

@router.get("/screener")
def get_market_screener(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    if not stocks:
        return []
        
    data_info = get_data_date_info(db)
    result = []

    for stock in stocks:
        p = db.query(models.DailyPrice).filter(
            models.DailyPrice.ticker == stock.ticker
        ).order_by(models.DailyPrice.date.desc()).first()
        
        f = db.query(models.StockFeature).filter(
            models.StockFeature.ticker == stock.ticker
        ).order_by(models.StockFeature.date.desc()).first()
        
        if not p:
            continue
            
        open_val = p.open if p.open else 0
        close_val = p.close if p.close else 0
        pnl = close_val - open_val
        ret_pct = (pnl / open_val * 100) if open_val > 0 else 0
        
        result.append({
            "ticker": p.ticker,
            "name": stock.name if stock else p.ticker.replace(".NS", ""),
            "sector": stock.sector if stock else "Unknown",
            "open": round(open_val, 2),
            "high": round(p.high, 2) if p.high else 0,
            "low": round(p.low, 2) if p.low else 0,
            "close": round(close_val, 2),
            "volume": p.volume if p.volume else 0,
            "return_pct": round(ret_pct, 2),
            "rsi": round(f.rsi, 1) if f and f.rsi else 0,
            "macd": round(f.macd, 2) if f and f.macd else 0,
            "atr": round(f.atr, 2) if f and f.atr else 0,
            "volatility": round(f.volatility, 4) if f and getattr(f, 'volatility', None) else 0,
            "date": data_info["trading_date"],
            "last_updated": data_info["last_updated"],
        })
        
    return sorted(result, key=lambda x: x["return_pct"], reverse=True)
