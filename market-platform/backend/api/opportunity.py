from .utils import get_data_date_info
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/opportunity", tags=["Opportunity"])

@router.get("/rankings")
def get_opportunity_rankings(db: Session = Depends(get_db)):
    latest = db.query(models.OpportunityScore).order_by(models.OpportunityScore.date.desc()).first()
    if not latest:
        return []
        
    scores = db.query(models.OpportunityScore).filter(models.OpportunityScore.date == latest.date).order_by(models.OpportunityScore.score.desc()).all()
    
    data_info = get_data_date_info(db)

    result = []
    for i, s in enumerate(scores, 1):
        stock = db.query(models.Stock).filter(models.Stock.ticker == s.ticker).first()
        feat = db.query(models.StockFeature).filter(models.StockFeature.ticker == s.ticker, models.StockFeature.date == s.date).first()
        
        result.append({
            "rank": i,
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
    return result
