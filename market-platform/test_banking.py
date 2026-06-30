import pandas as pd
from backend.database import SessionLocal
from backend.models import StockFeature, Stock
db = SessionLocal()

features = db.query(StockFeature).filter(StockFeature.date == "2026-06-29").all()
for f in features:
    stock = db.query(Stock).filter(Stock.ticker == f.ticker).first()
    if stock and stock.sector == "Banking":
        print(f"{f.ticker}: {f.daily_return}")
