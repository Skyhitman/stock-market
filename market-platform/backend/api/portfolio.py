from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import models
from pydantic import BaseModel
from .auth import get_current_user_or_session
import traceback

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

class PortfolioItemCreate(BaseModel):
    ticker: str
    quantity: float
    buy_price: float

@router.get("/")
def get_portfolio(db: Session = Depends(get_db), payload: dict = Depends(get_current_user_or_session)):
    try:
        user_id = payload.get("user_id")
        if user_id is None:
            return []
        
        items = db.query(models.PortfolioItem).filter(models.PortfolioItem.user_id == user_id).all()
        results = []
        
        for item in items:
            try:
                # Get latest price and prediction for this ticker
                latest_price = db.query(models.DailyPrice).filter(models.DailyPrice.ticker == item.ticker).order_by(models.DailyPrice.date.desc()).first()
                prediction = db.query(models.Prediction).filter(models.Prediction.ticker == item.ticker).order_by(models.Prediction.date.desc()).first()
                opportunity = db.query(models.OpportunityScore).filter(models.OpportunityScore.ticker == item.ticker).order_by(models.OpportunityScore.date.desc()).first()
                
                current_price = latest_price.close if latest_price else item.buy_price
                buy_price = item.buy_price or 0
                pnl = (current_price - buy_price) * item.quantity
                pnl_pct = ((current_price - buy_price) / buy_price) * 100 if buy_price > 0 else 0
                
                results.append({
                    "id": item.id,
                    "ticker": item.ticker,
                    "quantity": item.quantity,
                    "buy_price": buy_price,
                    "current_price": current_price,
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 2),
                    "prediction": prediction.direction if prediction else "Neutral",
                    "confidence": prediction.confidence if prediction else 0.0,
                    "opportunity_score": opportunity.score if opportunity else 0.0
                })
            except Exception as e:
                print(f"[Portfolio] Error processing item {item.ticker}: {e}")
                # Still include the item with basic info
                results.append({
                    "id": item.id,
                    "ticker": item.ticker,
                    "quantity": item.quantity,
                    "buy_price": item.buy_price or 0,
                    "current_price": item.buy_price or 0,
                    "pnl": 0,
                    "pnl_pct": 0,
                    "prediction": "Neutral",
                    "confidence": 0.0,
                    "opportunity_score": 0.0
                })
            
        return results
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Portfolio] GET error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Portfolio load error: {str(e)}")

@router.post("/")
def add_portfolio_item(item: PortfolioItemCreate, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_or_session)):
    user_id = payload.get("user_id")
    existing = db.query(models.PortfolioItem).filter(
        models.PortfolioItem.user_id == user_id,
        models.PortfolioItem.ticker == item.ticker
    ).first()
    
    if existing:
        # Update existing
        total_qty = existing.quantity + item.quantity
        if total_qty > 0:
            avg_price = ((existing.quantity * existing.buy_price) + (item.quantity * item.buy_price)) / total_qty
            existing.quantity = total_qty
            existing.buy_price = avg_price
        else:
            db.delete(existing)
    else:
        new_item = models.PortfolioItem(
            user_id=user_id,
            ticker=item.ticker,
            quantity=item.quantity,
            buy_price=item.buy_price,
            added_at=datetime.utcnow()
        )
        db.add(new_item)
        
    db.commit()
    return {"status": "success"}

@router.delete("/{ticker}")
def remove_portfolio_item(ticker: str, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_or_session)):
    user_id = payload.get("user_id")
    item = db.query(models.PortfolioItem).filter(
        models.PortfolioItem.user_id == user_id,
        models.PortfolioItem.ticker == ticker
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(item)
    db.commit()
    return {"status": "deleted"}
