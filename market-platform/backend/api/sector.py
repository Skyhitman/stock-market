from .utils import get_data_date_info
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..data.constants import STOCKS

router = APIRouter(prefix="/api/sector", tags=["Sector"])

@router.get("/rankings")
def get_sector_rankings(db: Session = Depends(get_db)):
    latest = db.query(models.SectorMetric).order_by(models.SectorMetric.date.desc()).first()
    if not latest:
        return []

    metrics = db.query(models.SectorMetric).filter(
        models.SectorMetric.date == latest.date
    ).order_by(models.SectorMetric.rank.asc()).all()

    data_info = get_data_date_info(db)

    results = []
    for m in metrics:
        # Find sector leader (stock with highest opportunity score)
        sector_tickers = STOCKS.get(m.sector, [])
        leader = db.query(models.OpportunityScore).filter(
            models.OpportunityScore.ticker.in_(sector_tickers)
        ).order_by(models.OpportunityScore.score.desc()).first()

        # Rotation signal based on momentum
        if m.momentum and m.momentum > 0.005:
            rotation = "Rotating In"
        elif m.momentum and m.momentum < -0.005:
            rotation = "Rotating Out"
        else:
            rotation = "Hold"

        results.append({
            "sector": m.sector,
            "date": data_info["trading_date"],
            "last_updated": data_info["last_updated"],
            "strength_score": round(m.strength_score, 1) if m.strength_score else 0,
            "momentum": round((m.momentum or 0) * 100, 2),
            "rank": m.rank,
            "relative_strength": round(m.relative_strength, 3) if m.relative_strength else 0,
            "leader": leader.ticker if leader else "N/A",
            "rotation": rotation,
        })
    return results

@router.get("/history")
def get_sector_history(days: int = 30, db: Session = Depends(get_db)):
    """Returns cumulative sector performance for the chart."""
    results = {}
    for sector, tickers in STOCKS.items():
        features = db.query(models.StockFeature).filter(
            models.StockFeature.ticker.in_(tickers)
        ).order_by(models.StockFeature.date.asc()).all()

        by_date = {}
        for f in features:
            d = str(f.date)
            if d not in by_date:
                by_date[d] = []
            by_date[d].append(f.daily_return or 0)

        # Compute cumulative returns for last N days
        sorted_dates = sorted(by_date.keys())[-days:]
        cumulative = 1.0
        for d in sorted_dates:
            avg_ret = sum(by_date[d]) / len(by_date[d])
            cumulative *= (1 + avg_ret)
            if d not in results:
                results[d] = {"date": d}
            results[d][sector] = round(cumulative, 4)

    return sorted(results.values(), key=lambda x: x["date"])

@router.get("/{sector}/detail")
def get_sector_detail(sector: str, db: Session = Depends(get_db)):
    latest = db.query(models.SectorMetric).filter(
        models.SectorMetric.sector == sector
    ).order_by(models.SectorMetric.date.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="Sector not found")

    data_info = get_data_date_info(db)

    return {
        "sector": sector,
        "date": data_info["trading_date"],
        "last_updated": data_info["last_updated"],
        "strength_score": latest.strength_score,
        "momentum": latest.momentum,
        "rank": latest.rank,
        "relative_strength": latest.relative_strength,
        "rotation_signal": "Hold",
    }
