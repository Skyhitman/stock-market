from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, Text
from .database import Base

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    name = Column(Text)
    sector = Column(String, index=True)

class DailyPrice(Base):
    __tablename__ = "daily_prices"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    adj_close = Column(Float)
    volume = Column(Integer)

class SectorMetric(Base):
    __tablename__ = "sector_metrics"
    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String, index=True)
    date = Column(Date, index=True)
    strength_score = Column(Float)
    momentum = Column(Float)
    rank = Column(Integer)
    relative_strength = Column(Float)

class StockFeature(Base):
    __tablename__ = "stock_features"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    date = Column(Date, index=True)
    rsi = Column(Float)
    macd = Column(Float)
    ema20 = Column(Float)
    ema50 = Column(Float)
    ema200 = Column(Float)
    atr = Column(Float)
    daily_return = Column(Float)
    volume_ratio = Column(Float)
    stock_vs_sector = Column(Float)
    stock_vs_nifty = Column(Float)
    volatility = Column(Float)

class OpportunityScore(Base):
    __tablename__ = "opportunity_scores"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    date = Column(Date, index=True)
    score = Column(Float)
    sector_weight = Column(Float)
    momentum_weight = Column(Float)
    volume_weight = Column(Float)
    rs_weight = Column(Float)
    explanation_json = Column(Text) # JSON string

class RelationshipScore(Base):
    __tablename__ = "relationship_scores"
    id = Column(Integer, primary_key=True, index=True)
    ticker_a = Column(String, index=True)
    ticker_b = Column(String, index=True)
    pearson_corr = Column(Float)
    rolling_corr = Column(Float)
    lag_corr = Column(Float)
    leader_score = Column(Float)
    follower_score = Column(Float)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    date = Column(Date, index=True)
    pred_open = Column(Float)
    pred_close = Column(Float)
    direction = Column(String)
    confidence = Column(Float)
    shap_json = Column(Text) # JSON string
    explanation_json = Column(Text) # JSON string

class NewsArticle(Base):
    __tablename__ = "news_articles"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    title = Column(Text)
    sentiment_score = Column(Float)
    link = Column(Text)
    publisher = Column(Text)
    published_at = Column(DateTime, index=True)

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    quantity = Column(Float)
    buy_price = Column(Float)
    added_at = Column(DateTime)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text)
    level = Column(String) # INFO, WARN, SUCCESS
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, index=True)
