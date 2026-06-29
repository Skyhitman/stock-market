from .utils import get_data_date_info
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/opportunity", tags=["Opportunity"])

@router.get("/rankings")
def get_opportunity_rankings(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    if not stocks:
        return []
        
    data_info = get_data_date_info(db)
    result = []
    
    for stock in stocks:
        s = db.query(models.OpportunityScore).filter(
            models.OpportunityScore.ticker == stock.ticker
        ).order_by(models.OpportunityScore.date.desc()).first()
        
        if not s:
            continue
            
        feat = db.query(models.StockFeature).filter(
            models.StockFeature.ticker == stock.ticker
        ).order_by(models.StockFeature.date.desc()).first()
        
        result.append({
            "ticker": s.ticker,
            "sector": stock.sector if stock else "Unknown",
            "score": s.score,
            "sector_weight": s.sector_weight,
            "momentum_weight": s.momentum_weight,
            "volume_weight": s.volume_weight,
            "rs_weight": s.rs_weight,
            "daily_return": feat.daily_return * 100 if feat and feat.daily_return else 0.0,
            "explanation_json": s.explanation_json,
            "date": data_info["trading_date"],
            "last_updated": data_info["last_updated"],
        })
        
    # Sort by score descending and assign rank
    result = sorted(result, key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(result, 1):
        r["rank"] = i
        
    return result
