import os
from datetime import datetime
from sqlalchemy.orm import Session

def get_data_date_info(db: Session):
    """Returns both the trading date and the last-updated timestamp as a dict."""
    from .. import models
    latest_price = db.query(models.DailyPrice).order_by(models.DailyPrice.date.desc()).first()
    
    # Trading date from actual market data
    trading_date = str(latest_price.date) if latest_price else None
    
    # Last updated = current time to show fresh fetch on every page load
    last_updated = datetime.now().strftime("%d %b %Y, %I:%M %p").lower()
    
    return {
        "trading_date": trading_date,
        "last_updated": last_updated,
    }

def get_data_date(db: Session):
    """Returns a combined string for backward compatibility."""
    info = get_data_date_info(db)
    if info["trading_date"] and info["last_updated"]:
        return f"{info['trading_date']} | Updated: {info['last_updated']}"
    return info["trading_date"]
