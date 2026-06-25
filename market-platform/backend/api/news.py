from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/news", tags=["News"])

@router.get("/")
def get_news(ticker: str = None, db: Session = Depends(get_db)):
    query = db.query(models.NewsArticle)
    if ticker:
        query = query.filter(models.NewsArticle.ticker == ticker)
        
    news = query.order_by(models.NewsArticle.published_at.desc()).limit(50).all()
    
    return [
        {
            "id": n.id,
            "ticker": n.ticker,
            "title": n.title,
            "sentiment_score": n.sentiment_score,
            "link": n.link,
            "publisher": n.publisher,
            "published_at": n.published_at
        } for n in news
    ]
