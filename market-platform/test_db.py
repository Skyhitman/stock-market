from backend.database import SessionLocal
from backend.models import StockFeature, OpportunityScore
db = SessionLocal()
f = db.query(StockFeature).filter(StockFeature.ticker == "SBIN.NS").order_by(StockFeature.date.desc()).first()
o = db.query(OpportunityScore).filter(OpportunityScore.ticker == "SBIN.NS").order_by(OpportunityScore.date.desc()).first()
print(f"SBIN.NS feature date: {f.date if f else 'None'}, daily_return: {f.daily_return if f else 'None'}")
print(f"SBIN.NS opp score: {o.score if o else 'None'}, date: {o.date if o else 'None'}")
