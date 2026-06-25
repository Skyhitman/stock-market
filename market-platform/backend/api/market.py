from .utils import get_data_date, get_data_date_info
import urllib.request
import json
import concurrent.futures
from cachetools import TTLCache
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/market", tags=["Market"])

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

# Cache for both movers combined, expires in 5 minutes
nse_movers_cache = TTLCache(maxsize=2, ttl=300)

def fetch_all_nse_movers():
    cache_key = "all_movers"
    if cache_key in nse_movers_cache:
        return nse_movers_cache[cache_key]
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    try:
        session = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
        urllib.request.install_opener(session)
        # Establish session cookies
        session.open(urllib.request.Request('https://www.nseindia.com', headers=headers), timeout=8)
        
        # Fetch gainers
        g_req = urllib.request.Request('https://www.nseindia.com/api/live-analysis-variations?index=gainers', headers=headers)
        g_resp = session.open(g_req, timeout=8)
        gainers_data = json.loads(g_resp.read().decode('utf-8'))
        
        # Fetch losers (loosers)
        l_req = urllib.request.Request('https://www.nseindia.com/api/live-analysis-variations?index=loosers', headers=headers)
        l_resp = session.open(l_req, timeout=8)
        losers_data = json.loads(l_resp.read().decode('utf-8'))
        
        res = (gainers_data, losers_data)
        nse_movers_cache[cache_key] = res
        return res
    except Exception as e:
        print(f"Error fetching all NSE live movers: {e}")
        return None, None

def fetch_details_via_search(symbol: str):
    url = f'https://query2.finance.yahoo.com/v1/finance/search?q={symbol}.NS'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        response = urllib.request.urlopen(req, timeout=5)
        data = json.loads(response.read().decode('utf-8'))
        if 'quotes' in data and data['quotes']:
            quote = data['quotes'][0]
            name = quote.get('longname') or quote.get('shortname') or symbol
            sector = quote.get('sector') or quote.get('industry') or 'Other'
            return symbol, name, sector
    except Exception as e:
        print(f"Error fetching {symbol} via Yahoo Search: {e}")
    return symbol, symbol, 'NSE Stock'

@router.get("/movers")
def get_market_movers(db: Session = Depends(get_db)):
    gainers_data, losers_data = fetch_all_nse_movers()
    
    g_raw = []
    if gainers_data and 'allSec' in gainers_data and 'data' in gainers_data['allSec']:
        g_raw = gainers_data['allSec']['data'][:10]
        
    l_raw = []
    if losers_data and 'allSec' in losers_data and 'data' in losers_data['allSec']:
        l_raw = losers_data['allSec']['data'][:10]
        
    # Gather symbols to resolve details for
    symbols_to_resolve = []
    for item in g_raw:
        symbols_to_resolve.append(item.get('symbol'))
    for item in l_raw:
        symbols_to_resolve.append(item.get('symbol'))
        
    symbols_to_resolve = list(set([s for s in symbols_to_resolve if s]))
    
    # Filter untracked symbols
    untracked_symbols = []
    for symbol in symbols_to_resolve:
        stock = db.query(models.Stock).filter(models.Stock.ticker == f"{symbol}.NS").first()
        if not stock:
            untracked_symbols.append(symbol)
            
    # Resolve untracked symbols concurrently
    if untracked_symbols:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                resolved = list(executor.map(fetch_details_via_search, untracked_symbols))
            
            for symbol, name, sector in resolved:
                db_stock = models.Stock(ticker=f"{symbol}.NS", name=name, sector=sector)
                db.add(db_stock)
            db.commit()
        except Exception as e:
            print(f"Error resolving untracked symbols: {e}")
            
    # Build gainers list
    gainers = []
    for item in g_raw:
        symbol = item.get('symbol')
        stock = db.query(models.Stock).filter(models.Stock.ticker == f"{symbol}.NS").first()
        gainers.append({
            "ticker": symbol,
            "name": stock.name if stock else symbol,
            "sector": stock.sector if stock else "NSE Stock",
            "open": item.get('open_price', 0),
            "high": item.get('high_price', 0),
            "low": item.get('low_price', 0),
            "close": item.get('ltp', 0),
            "volume": item.get('trade_quantity', 0),
            "return_pct": item.get('perChange', 0)
        })
        
    # Build losers list
    losers = []
    for item in l_raw:
        symbol = item.get('symbol')
        stock = db.query(models.Stock).filter(models.Stock.ticker == f"{symbol}.NS").first()
        losers.append({
            "ticker": symbol,
            "name": stock.name if stock else symbol,
            "sector": stock.sector if stock else "NSE Stock",
            "open": item.get('open_price', 0),
            "high": item.get('high_price', 0),
            "low": item.get('low_price', 0),
            "close": item.get('ltp', 0),
            "volume": item.get('trade_quantity', 0),
            "return_pct": item.get('perChange', 0)
        })
        
    # Fallback to local DB screener if NSE API returned nothing
    if not gainers or not losers:
        # Get from DB screener
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
