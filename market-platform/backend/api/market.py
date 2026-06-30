from .utils import get_data_date, get_data_date_info
import urllib.request
import json
from cachetools import TTLCache
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/market", tags=["Market"])

@router.post("/force-refresh")
def force_refresh_market_data():
    """Forces a synchronous live market update."""
    try:
        from ..data.pipeline import run_live_update
        run_live_update()
        return {"status": "success", "message": "Market data refreshed successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/summary")
def get_market_summary(db: Session = Depends(get_db)):
    # Top sector
    top_sector = db.query(models.SectorMetric).order_by(
        models.SectorMetric.date.desc(), models.SectorMetric.rank.asc()
    ).first()

    # Weakest sector
    weakest_sector = db.query(models.SectorMetric).order_by(
        models.SectorMetric.date.desc(), models.SectorMetric.rank.desc()
    ).first()

    # Top stock by opportunity score
    top_stock = db.query(models.OpportunityScore).order_by(
        models.OpportunityScore.date.desc(), models.OpportunityScore.score.desc()
    ).first()

    # Compute sentiment from latest stock features
    latest_feat = db.query(models.StockFeature).order_by(
        models.StockFeature.date.desc()
    ).first()

    sentiment = "Neutral"
    bullish_count = 0
    total_count = 0

    if latest_feat:
        features = db.query(models.StockFeature).filter(
            models.StockFeature.date == latest_feat.date
        ).all()
        for f in features:
            total_count += 1
            if f.daily_return and f.daily_return > 0:
                bullish_count += 1
        if total_count > 0:
            ratio = bullish_count / total_count
            if ratio >= 0.65:
                sentiment = "Bullish"
            elif ratio <= 0.35:
                sentiment = "Bearish"
            else:
                sentiment = "Neutral"

    data_info = get_data_date_info(db)

    # Count of stocks tracked
    stock_count = db.query(models.Stock).count()

    # News Sentiment
    recent_news = db.query(models.NewsArticle).order_by(models.NewsArticle.published_at.desc()).limit(50).all()
    news_score = 0.0
    news_mood = "Neutral"
    if recent_news:
        avg_score = sum((n.sentiment_score or 0) for n in recent_news) / len(recent_news)
        news_score = round(avg_score, 2)
        if avg_score > 0.1:
            news_mood = "Positive"
        elif avg_score < -0.1:
            news_mood = "Negative"

    return {
        "top_sector": top_sector.sector if top_sector else "N/A",
        "top_sector_score": round(top_sector.strength_score, 0) if top_sector else 0,
        "weakest_sector": weakest_sector.sector if weakest_sector else "N/A",
        "weakest_sector_score": round(weakest_sector.strength_score, 0) if weakest_sector else 0,
        "top_stock": top_stock.ticker if top_stock else "N/A",
        "top_stock_score": round(top_stock.score, 0) if top_stock else 0,
        "market_sentiment": sentiment,
        "bullish_ratio": round(bullish_count / total_count * 100, 1) if total_count else 0,
        "stocks_tracked": stock_count,
        "data_date": data_info["trading_date"],
        "last_updated": data_info["last_updated"],
        "news_mood": news_mood,
        "news_score": news_score,
    }

# Cache for movers, expires in 5 minutes
movers_cache = TTLCache(maxsize=2, ttl=300)

def _fetch_yahoo_india_screener(screener_id: str, count: int = 10):
    """Fetch top gainers or losers across ALL Indian stocks via Yahoo Finance screener."""
    url = (
        f'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved'
        f'?formatted=false&lang=en-US&region=IN&scrIds={screener_id}&count={count}'
    )
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('finance', {}).get('result', [])
        if results and 'quotes' in results[0]:
            return results[0]['quotes']
    except Exception as e:
        print(f"Error fetching Yahoo screener {screener_id}: {e}")
    return []


def _yahoo_quote_to_stock(quote: dict) -> dict:
    """Convert a Yahoo Finance quote dict to our standard stock format."""
    symbol = quote.get('symbol', '')
    # Clean the .NS / .BO suffix for display
    display_ticker = symbol.replace('.NS', '').replace('.BO', '')
    name = quote.get('longName') or quote.get('shortName') or display_ticker
    
    prev_close = quote.get('regularMarketPreviousClose', 0)
    cur_price = quote.get('regularMarketPrice', 0)
    change_pct = quote.get('regularMarketChangePercent', 0)
    
    return {
        "ticker": display_ticker,
        "name": name,
        "sector": "NSE Stock",
        "open": quote.get('regularMarketOpen', 0),
        "high": quote.get('regularMarketDayHigh', 0),
        "low": quote.get('regularMarketDayLow', 0),
        "close": cur_price,
        "volume": quote.get('regularMarketVolume', 0),
        "return_pct": round(change_pct, 2),
    }

def _is_valid_stock(quote: dict) -> bool:
    """Filter out ETFs, unlisted, and low liquidity/junk stocks."""
    if quote.get('regularMarketVolume', 0) < 1000:
        return False
    if quote.get('regularMarketChangePercent', 0) == 0:
        return False
    # If it has no high/low it's likely an ETF NAV or not trading
    if quote.get('regularMarketDayHigh', 0) == 0 and quote.get('regularMarketDayLow', 0) == 0:
        return False
    return True


@router.get("/movers")
def get_market_movers(db: Session = Depends(get_db)):
    cache_key = "all_movers"
    
    if cache_key in movers_cache:
        cached = movers_cache[cache_key]
    else:
        # Fetch from Yahoo Finance India screeners (covers ALL Indian stocks)
        gainers_raw = _fetch_yahoo_india_screener('day_gainers_in', count=25)
        losers_raw = _fetch_yahoo_india_screener('day_losers_in', count=25)
        cached = (gainers_raw, losers_raw)
        if gainers_raw or losers_raw:
            movers_cache[cache_key] = cached
    
    gainers_raw, losers_raw = cached
    
    # Convert Yahoo quotes to our format and filter out junk
    gainers = [_yahoo_quote_to_stock(q) for q in gainers_raw if _is_valid_stock(q)][:10]
    losers = [_yahoo_quote_to_stock(q) for q in losers_raw if _is_valid_stock(q)][:10]
    
    # Fallback to local DB screener if Yahoo returned nothing
    if not gainers or not losers:
        from .stocks import get_market_screener
        db_screener = get_market_screener(db)
        if db_screener:
            active = [s for s in db_screener if s["return_pct"] != 0]
            if not gainers:
                gainers = [s for s in active if s["return_pct"] > 0][:10]
            if not losers:
                losers = list(reversed([s for s in active if s["return_pct"] < 0]))[:10]
                
    data_info = get_data_date_info(db)

    return {
        "gainers": gainers,
        "losers": losers,
        "data_date": data_info["trading_date"],
        "last_updated": data_info["last_updated"]
    }

