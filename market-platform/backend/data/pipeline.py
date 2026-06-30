"""
Data Pipeline: Orchestrates yfinance → features → analysis → ML → DB
Three modes:
  run_full_seed()    - Initial load: fetches 3y history, computes everything, trains model
  run_live_update()  - 5-min refresh: updates latest prices/features/scores
  run_eod_predict()  - EOD: retrains model, generates predictions
"""
import pandas as pd
import numpy as np
import json
import traceback
from datetime import datetime, date
from sqlalchemy.orm import Session
import yfinance as yf

from ..database import SessionLocal
from ..models import (
    Stock, DailyPrice, StockFeature, SectorMetric,
    OpportunityScore, RelationshipScore, Prediction,
    NewsArticle, Alert
)
from .constants import STOCKS, BENCHMARK, get_all_tickers
from .fetcher import fetch_historical_data
from .cache import history_cache
from ..features.engineer import engineer_features
from ..analysis.sector import calculate_sector_metrics, rank_sectors
from ..analysis.relationships import calculate_correlations, detect_leaders
from ..analysis.opportunity import calculate_opportunity_score
from ..analysis.nlp_sentiment import fetch_and_analyze_news
from ..ml.predictor import train_predictor, predict_next_day

# ─── Stock Names ───────────────────────────────────────────────
STOCK_NAMES = {
    "TCS.NS": "Tata Consultancy Services",
    "INFY.NS": "Infosys",
    "HCLTECH.NS": "HCL Technologies",
    "SUNPHARMA.NS": "Sun Pharmaceutical",
    "CIPLA.NS": "Cipla",
    "LUPIN.NS": "Lupin",
    "DIVISLAB.NS": "Divi's Laboratories",
    "AUROPHARMA.NS": "Aurobindo Pharma",
    "SBIN.NS": "State Bank of India",
    "HDFCBANK.NS": "HDFC Bank",
    "ICICIBANK.NS": "ICICI Bank",
    "AXISBANK.NS": "Axis Bank",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "CANBK.NS": "Canara Bank",
    "RELIANCE.NS": "Reliance Industries",
    "ONGC.NS": "Oil & Natural Gas Corp",
    "IOC.NS": "Indian Oil Corp",
    "BPCL.NS": "Bharat Petroleum",
    "HPCL.NS": "Hindustan Petroleum",
}


# ─── Helpers ───────────────────────────────────────────────────
def safe_float(val, default=0.0):
    """Convert to float, handling NaN/Inf/None gracefully."""
    try:
        v = float(val)
        return default if (np.isnan(v) or np.isinf(v)) else v
    except (TypeError, ValueError):
        return default


def is_db_seeded(db: Session) -> bool:
    return db.query(Stock).count() > 0


def fetch_fresh_daily(ticker: str) -> pd.DataFrame:
    """Fetch latest 5d data fresh (no cache) for live updates."""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="5d")
        if df.empty:
            return pd.DataFrame()
        df = df.ffill().dropna()
        df = df.reset_index()
        df.columns = [col.lower() for col in df.columns]
        if hasattr(df["date"].dtype, "tz") and df["date"].dtype.tz is not None:
            df["date"] = df["date"].dt.tz_localize(None)
        df["date"] = df["date"].dt.date
        return df[["date", "open", "high", "low", "close", "volume"]]
    except Exception as e:
        print(f"[Pipeline] Error fetching fresh data for {ticker}: {e}")
        return pd.DataFrame()


def merge_fresh_data(historical: pd.DataFrame, fresh: pd.DataFrame) -> pd.DataFrame:
    """Merge fresh latest data into historical, replacing overlapping dates."""
    if fresh.empty:
        return historical
    fresh_dates = set(fresh["date"].values)
    filtered = historical[~historical["date"].isin(fresh_dates)]
    combined = pd.concat([filtered, fresh], ignore_index=True)
    return combined.sort_values("date").reset_index(drop=True)


# ─── DB Writers ────────────────────────────────────────────────
def seed_stocks(db: Session):
    existing = {s.ticker for s in db.query(Stock).all()}
    for sector, tickers in STOCKS.items():
        for ticker in tickers:
            if ticker not in existing:
                db.add(Stock(
                    ticker=ticker,
                    name=STOCK_NAMES.get(ticker, ticker.replace(".NS", "")),
                    sector=sector,
                ))
    db.commit()
    print(f"[Pipeline] Stocks table: {db.query(Stock).count()} stocks")


def store_daily_prices(db: Session, ticker: str, df: pd.DataFrame):
    db.query(DailyPrice).filter(DailyPrice.ticker == ticker).delete()
    records = []
    for _, row in df.iterrows():
        records.append(DailyPrice(
            ticker=ticker, date=row["date"],
            open=float(row["open"]), high=float(row["high"]),
            low=float(row["low"]), close=float(row["close"]),
            adj_close=float(row["close"]), volume=int(row["volume"]),
        ))
    db.bulk_save_objects(records)


def store_all_features(db: Session, ticker: str, df: pd.DataFrame,
                       nifty_returns: dict, sector_returns: dict):
    """Store full feature history for a stock."""
    db.query(StockFeature).filter(StockFeature.ticker == ticker).delete()
    records = []
    for _, row in df.iterrows():
        dr = safe_float(row.get("daily_return", 0))
        d = row.get("date", date.today())
        records.append(StockFeature(
            ticker=ticker, date=d,
            rsi=safe_float(row.get("rsi", 50)),
            macd=safe_float(row.get("macd", 0)),
            ema20=safe_float(row.get("ema20", 0)),
            ema50=safe_float(row.get("ema50", 0)),
            ema200=safe_float(row.get("ema200", 0)),
            atr=safe_float(row.get("atr", 0)),
            volatility=safe_float(row.get("rolling_volatility", 0)),
            daily_return=dr,
            volume_ratio=safe_float(row.get("volume_ratio", 1)),
            stock_vs_nifty=dr - nifty_returns.get(d, 0),
            stock_vs_sector=dr - sector_returns.get(d, 0),
        ))
    db.bulk_save_objects(records)


def store_sector_metrics(db: Session, ranked: list):
    db.query(SectorMetric).delete()
    today = date.today()
    for sm in ranked:
        db.add(SectorMetric(
            sector=sm["sector"], date=today,
            strength_score=safe_float(sm.get("strength_score", 0)),
            momentum=safe_float(sm.get("sector_momentum", 0)),
            rank=int(sm.get("rank", 0)),
            relative_strength=safe_float(sm.get("relative_strength", 0)),
        ))


def store_relationships(db: Session, all_features: dict):
    db.query(RelationshipScore).delete()
    for sector, tickers in STOCKS.items():
        history_dict = {t: all_features[t] for t in tickers if t in all_features}
        if len(history_dict) < 2:
            continue
        corr_results = calculate_correlations(history_dict, list(history_dict.keys()))
        leaders = detect_leaders(corr_results, list(history_dict.keys()))
        for corr in corr_results:
            db.add(RelationshipScore(
                ticker_a=corr["ticker_a"], ticker_b=corr["ticker_b"],
                pearson_corr=safe_float(corr.get("pearson_corr", 0)),
                rolling_corr=safe_float(corr.get("rolling_corr", 0)),
                lag_corr=safe_float(corr.get("lag_corr_ab", 0)),
                leader_score=leaders.get("leader_score", 0) if leaders.get("leader") == corr["ticker_a"] else 0,
                follower_score=leaders.get("leader_score", 0) if leaders.get("leader") == corr["ticker_b"] else 0,
            ))


def store_opportunity_scores(db: Session, all_features: dict,
                             sector_metrics_dict: dict, nifty_return: float):
    db.query(OpportunityScore).delete()
    today = date.today()
    for sector, tickers in STOCKS.items():
        ss = sector_metrics_dict.get(sector, {}).get("strength_score", 50)
        for ticker in tickers:
            if ticker not in all_features:
                continue
            latest = all_features[ticker].iloc[-1]
            stock_dict = {
                "stock_vs_nifty": safe_float(latest.get("daily_return", 0)) - nifty_return,
                "daily_return": safe_float(latest.get("daily_return", 0)),
                "rsi": safe_float(latest.get("rsi", 50)),
                "macd_hist": safe_float(latest.get("macd_hist", 0)),
                "volume_ratio": safe_float(latest.get("volume_ratio", 1)),
            }
            opp = calculate_opportunity_score(stock_dict, ss)
            db.add(OpportunityScore(
                ticker=ticker, date=today,
                score=safe_float(opp["score"]),
                sector_weight=safe_float(opp["sector_weight"]),
                momentum_weight=safe_float(opp["momentum_weight"]),
                volume_weight=safe_float(opp["volume_weight"]),
                rs_weight=safe_float(opp["rs_weight"]),
                explanation_json=opp["explanation_json"],
            ))


def store_predictions(db: Session, predictions: list):
    db.query(Prediction).delete()
    today = date.today()
    for pred in predictions:
        db.add(Prediction(
            ticker=pred["ticker"], date=today,
            pred_open=pred["pred_open"], pred_close=pred["pred_close"],
            direction=pred["direction"], confidence=pred["confidence"],
            shap_json=json.dumps(pred.get("top_factors", [])),
            explanation_json=json.dumps({"factors": pred.get("top_factors", [])}),
        ))

def fetch_and_store_news(db: Session, tickers: list):
    db.query(NewsArticle).delete()
    for ticker in tickers:
        news_items = fetch_and_analyze_news(ticker, limit=3)
        for item in news_items:
            db.add(NewsArticle(
                ticker=item["ticker"],
                title=item["title"],
                sentiment_score=safe_float(item["sentiment_score"]),
                link=item["link"],
                publisher=item["publisher"],
                published_at=item["published_at"]
            ))

def generate_alerts(db: Session, ranked_sectors: list, opportunity_scores: list):
    # Clear old alerts so notifications stay fresh
    db.query(Alert).delete()
    
    now = datetime.now()
    
    # 1. Sector rotation alerts
    for sm in ranked_sectors:
        momentum = safe_float(sm.get("sector_momentum", 0))
        if momentum > 0.002:
            db.add(Alert(message=f"📈 {sm['sector']} sector rotating IN — momentum +{momentum*100:.2f}%", level="SUCCESS", created_at=now))
        elif momentum < -0.002:
            db.add(Alert(message=f"📉 {sm['sector']} sector rotating OUT — momentum {momentum*100:.2f}%", level="WARN", created_at=now))

    # 2. Opportunity score alerts
    sorted_opps = sorted(opportunity_scores, key=lambda x: x["score"], reverse=True)
    if sorted_opps:
        best = sorted_opps[0]
        db.add(Alert(message=f"🏆 Top pick today: {best['ticker']} with score {best['score']:.0f}/100", level="SUCCESS", created_at=now))
        worst = sorted_opps[-1]
        if worst["score"] < 35:
            db.add(Alert(message=f"⚠️ Weakest signal: {worst['ticker']} scored only {worst['score']:.0f}/100", level="WARN", created_at=now))

    # 3. Volume spike alerts — check StockFeature for high volume_ratio
    features = db.query(StockFeature).all()
    latest_by_ticker = {}
    for f in features:
        if f.ticker not in latest_by_ticker or f.date > latest_by_ticker[f.ticker].date:
            latest_by_ticker[f.ticker] = f
    for ticker, feat in latest_by_ticker.items():
        if feat.volume_ratio and feat.volume_ratio > 1.8:
            db.add(Alert(message=f"🔊 Volume spike on {ticker} — {feat.volume_ratio:.1f}x average volume", level="INFO", created_at=now))

    # 4. Big movers alerts
    for ticker, feat in latest_by_ticker.items():
        if feat.daily_return and feat.daily_return > 0.015:
            db.add(Alert(message=f"🚀 {ticker} surging +{feat.daily_return*100:.2f}% today", level="SUCCESS", created_at=now))
        elif feat.daily_return and feat.daily_return < -0.015:
            db.add(Alert(message=f"🔻 {ticker} dropping {feat.daily_return*100:.2f}% today", level="ERROR", created_at=now))

    # 5. RSI extremes
    for ticker, feat in latest_by_ticker.items():
        if feat.rsi and feat.rsi > 75:
            db.add(Alert(message=f"⚡ {ticker} RSI at {feat.rsi:.0f} — overbought territory", level="WARN", created_at=now))
        elif feat.rsi and feat.rsi < 25:
            db.add(Alert(message=f"💎 {ticker} RSI at {feat.rsi:.0f} — oversold, potential bounce", level="INFO", created_at=now))

    # 6. AI prediction alerts
    preds = db.query(Prediction).all()
    latest_preds = {}
    for p in preds:
        if p.ticker not in latest_preds or p.date > latest_preds[p.ticker].date:
            latest_preds[p.ticker] = p
    for ticker, pred in latest_preds.items():
        if pred.confidence and pred.confidence > 0.65:
            direction_emoji = "🟢" if pred.direction == "UP" else "🔴"
            db.add(Alert(message=f"{direction_emoji} AI predicts {ticker} → {pred.direction} (confidence: {pred.confidence*100:.0f}%)", level="INFO", created_at=now))



# ─── Pipeline Modes ───────────────────────────────────────────
def run_full_seed():
    """Full data pipeline: fetch 3y history → features → analysis → ML → DB."""
    print("[Pipeline] ========== STARTING FULL SEED ==========")
    db = SessionLocal()
    try:
        seed_stocks(db)

        # ── 1. Fetch & compute features for all tickers ──
        all_history = {}
        all_features = {}
        nifty_returns = {}

        # Nifty benchmark first
        print(f"[Pipeline] Fetching {BENCHMARK}...")
        nifty_hist = fetch_historical_data(BENCHMARK)
        if not nifty_hist.empty:
            nifty_feat = engineer_features(nifty_hist.copy())
            if not nifty_feat.empty and "daily_return" in nifty_feat.columns:
                nifty_returns = {
                    row["date"]: safe_float(row["daily_return"])
                    for _, row in nifty_feat.iterrows()
                }
                all_features[BENCHMARK] = nifty_feat
            all_history[BENCHMARK] = nifty_hist

        # All stocks by sector
        for sector, tickers in STOCKS.items():
            sector_feat_list = []
            for ticker in tickers:
                print(f"[Pipeline] Fetching {ticker}...")
                hist = fetch_historical_data(ticker)
                if hist.empty:
                    print(f"[Pipeline] WARNING: No data for {ticker}, skipping")
                    continue
                all_history[ticker] = hist
                store_daily_prices(db, ticker, hist)

                featured = engineer_features(hist.copy())
                if featured.empty or "rsi" not in featured.columns:
                    print(f"[Pipeline] WARNING: Insufficient data for {ticker}")
                    continue
                featured["ticker"] = ticker
                all_features[ticker] = featured
                sector_feat_list.append(featured)

            # Sector average returns for stock_vs_sector
            if sector_feat_list:
                combined = pd.concat(sector_feat_list)
                sector_avg = combined.groupby("date")["daily_return"].mean().to_dict()
            else:
                sector_avg = {}

            for ticker in tickers:
                if ticker in all_features:
                    store_all_features(db, ticker, all_features[ticker],
                                       nifty_returns, sector_avg)

        db.commit()
        n_stocks = len(all_features) - (1 if BENCHMARK in all_features else 0)
        print(f"[Pipeline] Stored prices & features for {n_stocks} stocks")

        # ── 2. Sector metrics ──
        print("[Pipeline] Computing sector metrics...")
        sector_metrics_dict = _compute_sector_metrics(all_features, nifty_returns)
        if sector_metrics_dict:
            ranked = rank_sectors(sector_metrics_dict)
            store_sector_metrics(db, ranked)
            db.commit()
            print(f"[Pipeline] Stored metrics for {len(ranked)} sectors")

        # ── 3. Relationships ──
        print("[Pipeline] Computing relationships...")
        store_relationships(db, all_features)
        db.commit()

        # ── 4. Opportunity scores ──
        print("[Pipeline] Computing opportunity scores...")
        latest_nifty_ret = list(nifty_returns.values())[-1] if nifty_returns else 0
        store_opportunity_scores(db, all_features, sector_metrics_dict, latest_nifty_ret)
        db.commit()

        # ── 5. Train XGBoost ──
        print("[Pipeline] Training XGBoost model...")
        training_dfs = []
        for sector, tickers in STOCKS.items():
            for ticker in tickers:
                if ticker in all_features:
                    training_dfs.append(all_features[ticker])
        if training_dfs:
            training_df = pd.concat(training_dfs, ignore_index=True)
            success = train_predictor(training_df)
            print(f"[Pipeline] Model trained: {success}")

        # ── 6. Predictions ──
        print("[Pipeline] Generating predictions...")
        latest_rows = []
        for sector, tickers in STOCKS.items():
            for ticker in tickers:
                if ticker in all_features:
                    row = all_features[ticker].iloc[-1:].copy()
                    row["ticker"] = ticker
                    latest_rows.append(row)
        if latest_rows:
            latest_df = pd.concat(latest_rows, ignore_index=True)
            preds = predict_next_day(latest_df)
            if preds:
                store_predictions(db, preds)
                db.commit()
                print(f"[Pipeline] Stored {len(preds)} predictions")

        # ── 7. News and Alerts ──
        print("[Pipeline] Fetching news...")
        all_tickers = [t for tickers in STOCKS.values() for t in tickers]
        fetch_and_store_news(db, all_tickers)
        db.commit()

        # Generate Alerts
        opps = [{"ticker": o.ticker, "score": o.score} for o in db.query(OpportunityScore).all()]
        generate_alerts(db, ranked, opps)
        db.commit()

        print("[Pipeline] ========== FULL SEED COMPLETE ==========")
        return True

    except Exception as e:
        db.rollback()
        print(f"[Pipeline] SEED ERROR: {e}")
        traceback.print_exc()
        return False
    finally:
        db.close()

def get_hist_from_db(db, ticker: str):
    import pandas as pd
    prices = db.query(DailyPrice).filter(DailyPrice.ticker == ticker).order_by(DailyPrice.date.asc()).all()
    if not prices:
        return pd.DataFrame()
    data = [{
        "date": p.date, "open": p.open, "high": p.high, 
        "low": p.low, "close": p.close, "volume": p.volume
    } for p in prices]
    df = pd.DataFrame(data)
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"]).dt.date
    return df

def run_live_update():
    """5-min refresh: fetch fresh latest data, update features & scores."""
    print(f"[Pipeline] [{datetime.now()}] Live update starting...")
    db = SessionLocal()
    try:
        all_features = {}
        nifty_returns = {}

        # Fresh Nifty data
        nifty_fresh = fetch_fresh_daily(BENCHMARK)
        nifty_hist = get_hist_from_db(db, BENCHMARK)
        if nifty_hist.empty:
            nifty_hist = fetch_historical_data(BENCHMARK)
            
        if not nifty_hist.empty:
            combined = merge_fresh_data(nifty_hist, nifty_fresh) if not nifty_fresh.empty else nifty_hist
            nf = engineer_features(combined)
            if not nf.empty and "daily_return" in nf.columns:
                nifty_returns = {r["date"]: safe_float(r["daily_return"]) for _, r in nf.iterrows()}

        # All stocks
        for sector, tickers in STOCKS.items():
            for ticker in tickers:
                try:
                    fresh = fetch_fresh_daily(ticker)
                    hist = get_hist_from_db(db, ticker)
                    if hist.empty:
                        hist = fetch_historical_data(ticker)
                        
                    if hist.empty:
                        continue
                    combined = merge_fresh_data(hist, fresh) if not fresh.empty else hist
                    featured = engineer_features(combined)
                    if featured.empty or "rsi" not in featured.columns:
                        continue
                    featured["ticker"] = ticker
                    all_features[ticker] = featured

                    # Upsert latest daily price
                    if not fresh.empty:
                        lp = fresh.iloc[-1]
                        db.query(DailyPrice).filter(
                            DailyPrice.ticker == ticker,
                            DailyPrice.date == lp["date"],
                        ).delete()
                        db.add(DailyPrice(
                            ticker=ticker, date=lp["date"],
                            open=float(lp["open"]), high=float(lp["high"]),
                            low=float(lp["low"]), close=float(lp["close"]),
                            adj_close=float(lp["close"]), volume=int(lp["volume"]),
                        ))

                    # Upsert latest features
                    lf = featured.iloc[-1]
                    db.query(StockFeature).filter(
                        StockFeature.ticker == ticker,
                        StockFeature.date == lf["date"],
                    ).delete()
                    dr = safe_float(lf.get("daily_return", 0))
                    db.add(StockFeature(
                        ticker=ticker, date=lf["date"],
                        rsi=safe_float(lf.get("rsi", 50)),
                        macd=safe_float(lf.get("macd", 0)),
                        ema20=safe_float(lf.get("ema20", 0)),
                        ema50=safe_float(lf.get("ema50", 0)),
                        ema200=safe_float(lf.get("ema200", 0)),
                        atr=safe_float(lf.get("atr", 0)),
                        daily_return=dr,
                        volume_ratio=safe_float(lf.get("volume_ratio", 1)),
                        stock_vs_nifty=dr - nifty_returns.get(lf["date"], 0),
                        stock_vs_sector=0,
                    ))
                except Exception as e:
                    print(f"[Pipeline] Error updating {ticker}: {e}")

        ranked = []
        if all_features:
            sector_metrics_dict = _compute_sector_metrics(all_features, nifty_returns)
            if sector_metrics_dict:
                ranked = rank_sectors(sector_metrics_dict)
                store_sector_metrics(db, ranked)
            latest_nifty = list(nifty_returns.values())[-1] if nifty_returns else 0
            store_opportunity_scores(db, all_features, sector_metrics_dict, latest_nifty)
            store_relationships(db, all_features)
        
        # News and Alerts
        all_tickers = [t for tickers in STOCKS.values() for t in tickers]
        fetch_and_store_news(db, all_tickers)
        
        db.commit() # Commit to read back for alerts
        
        # Generate Alerts
        opps = [{"ticker": o.ticker, "score": o.score} for o in db.query(OpportunityScore).all()]
        generate_alerts(db, ranked, opps)
        
        # Re-run predictions with updated features so all pages stay in sync
        if all_features:
            latest_rows = []
            for ticker, feat_df in all_features.items():
                row = feat_df.iloc[-1:].copy()
                row["ticker"] = ticker
                latest_rows.append(row)
            if latest_rows:
                latest_df = pd.concat(latest_rows, ignore_index=True)
                preds = predict_next_day(latest_df)
                if preds:
                    store_predictions(db, preds)
                    print(f"[Pipeline] Refreshed {len(preds)} predictions")
        
        db.commit()
        print(f"[Pipeline] Live update complete at {datetime.now()}")

    except Exception as e:
        db.rollback()
        print(f"[Pipeline] Live update ERROR: {e}")
        traceback.print_exc()
    finally:
        db.close()


def run_eod_predict():
    """EOD: clear cache, retrain model, generate predictions."""
    print(f"[Pipeline] [{datetime.now()}] EOD prediction starting...")
    history_cache.clear()
    db = SessionLocal()
    try:
        training_dfs, latest_rows = [], []
        for sector, tickers in STOCKS.items():
            for ticker in tickers:
                hist = fetch_historical_data(ticker)
                if hist.empty:
                    continue
                feat = engineer_features(hist.copy())
                if feat.empty or "rsi" not in feat.columns:
                    continue
                feat["ticker"] = ticker
                training_dfs.append(feat)
                latest_rows.append(feat.iloc[-1:].copy())

        if training_dfs:
            train_df = pd.concat(training_dfs, ignore_index=True)
            print(f"[Pipeline] Retraining on {len(train_df)} rows...")
            train_predictor(train_df)

        if latest_rows:
            latest_df = pd.concat(latest_rows, ignore_index=True)
            preds = predict_next_day(latest_df)
            if preds:
                store_predictions(db, preds)
                db.commit()
                print(f"[Pipeline] Stored {len(preds)} EOD predictions")

        print("[Pipeline] EOD prediction complete")
    except Exception as e:
        db.rollback()
        print(f"[Pipeline] EOD ERROR: {e}")
        traceback.print_exc()
    finally:
        db.close()


# ─── Internal Helpers ──────────────────────────────────────────
def _compute_sector_metrics(all_features: dict, nifty_returns: dict) -> dict:
    sector_metrics = {}
    for sector, tickers in STOCKS.items():
        sector_dfs = [all_features[t].iloc[-1:] for t in tickers if t in all_features]
        if not sector_dfs:
            continue
        sector_df = pd.concat(sector_dfs)
        nr = list(nifty_returns.values())[-1] if nifty_returns else 0
        metrics = calculate_sector_metrics(sector_df, nr)
        if metrics:
            sector_metrics[sector] = metrics
    return sector_metrics
