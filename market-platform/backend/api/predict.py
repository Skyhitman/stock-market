from .utils import get_data_date_info
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/predict", tags=["Predict"])

@router.get("/all")
def get_all_predictions(db: Session = Depends(get_db)):
    """Get the latest predictions for all stocks."""
    stocks = db.query(models.Stock).all()
    if not stocks:
        return []
        
    data_info = get_data_date_info(db)
    results = []
    
    for stock in stocks:
        p = db.query(models.Prediction).filter(
            models.Prediction.ticker == stock.ticker
        ).order_by(models.Prediction.date.desc()).first()
        
        if not p:
            continue
            
        import json
        try:
            shap_data = json.loads(p.shap_json) if p.shap_json else []
        except (json.JSONDecodeError, TypeError):
            shap_data = []

        price = db.query(models.DailyPrice).filter(
            models.DailyPrice.ticker == p.ticker
        ).order_by(models.DailyPrice.date.desc()).first()
        actual_close = price.close if price else None

        results.append({
            "ticker": p.ticker,
            "name": stock.name if stock else p.ticker,
            "sector": stock.sector if stock else "Unknown",
            "date": data_info["trading_date"],
            "last_updated": data_info["last_updated"],
            "pred_open": p.pred_open,
            "pred_close": p.pred_close,
            "actual_close": actual_close,
            "direction": p.direction,
            "confidence": p.confidence,
            "top_factors": shap_data,
        })
    return results

@router.get("/sectors")
def get_sector_predictions(db: Session = Depends(get_db)):
    """Aggregates individual stock predictions to predict sector movements."""
    stocks = db.query(models.Stock).all()
    if not stocks:
        return []
        
    from collections import defaultdict
    sector_data = defaultdict(lambda: {"bullish": 0, "total": 0, "confidence_sum": 0.0})

    for stock in stocks:
        p = db.query(models.Prediction).filter(
            models.Prediction.ticker == stock.ticker
        ).order_by(models.Prediction.date.desc()).first()
        
        if not p:
            continue
            
        sector = stock.sector if stock else "Unknown"
        
        sector_data[sector]["total"] += 1
        sector_data[sector]["confidence_sum"] += p.confidence
        if p.direction == 'Bullish':
            sector_data[sector]["bullish"] += 1

    results = []
    for sector, data in sector_data.items():
        if sector == "Unknown":
            continue
            
        bullish_ratio = data["bullish"] / data["total"]
        avg_confidence = data["confidence_sum"] / data["total"]
        
        # Determine sector direction based on ratio
        if bullish_ratio >= 0.5:
            direction = 'Bullish'
            # Adjust confidence slightly based on how overwhelming the ratio is
            confidence = avg_confidence * (0.5 + bullish_ratio)
        else:
            direction = 'Bearish'
            bearish_ratio = 1.0 - bullish_ratio
            confidence = avg_confidence * (0.5 + bearish_ratio)
            
        results.append({
            "sector": sector,
            "direction": direction,
            "confidence": round(min(confidence, 99.9), 1),
            "bullish_ratio": round(bullish_ratio * 100, 1),
            "total_stocks": data["total"]
        })
        
    return sorted(results, key=lambda x: x["confidence"], reverse=True)

@router.get("/{ticker}")
def get_prediction(ticker: str, db: Session = Depends(get_db)):
    pred = db.query(models.Prediction).filter(
        models.Prediction.ticker == ticker
    ).order_by(models.Prediction.date.desc()).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found for this ticker")

    import json
    try:
        shap_data = json.loads(pred.shap_json) if pred.shap_json else []
    except (json.JSONDecodeError, TypeError):
        shap_data = []

    stock = db.query(models.Stock).filter(models.Stock.ticker == ticker).first()
    price = db.query(models.DailyPrice).filter(models.DailyPrice.ticker == ticker).order_by(models.DailyPrice.date.desc()).first()
    actual_close = price.close if price else None

    data_info = get_data_date_info(db)

    return {
        "ticker": pred.ticker,
        "name": stock.name if stock else pred.ticker,
        "sector": stock.sector if stock else "Unknown",
        "date": data_info["trading_date"],
        "last_updated": data_info["last_updated"],
        "pred_open": pred.pred_open,
        "pred_close": pred.pred_close,
        "actual_close": actual_close,
        "direction": pred.direction,
        "confidence": pred.confidence,
        "top_factors": shap_data,
    }
