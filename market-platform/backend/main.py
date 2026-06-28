from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
import threading
import os

from .database import Base, engine, SessionLocal
from .api import sector, stocks, relationships, opportunity, predict, market, portfolio, alerts, news, backtest, auth, admin

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

def _seed_in_background():
    """Run seed in a background thread so the server starts immediately."""
    db = SessionLocal()
    try:
        from .data.pipeline import is_db_seeded, run_full_seed
        if not is_db_seeded(db):
            print("[Startup] Database is empty — running initial seed in background...")
            db.close()
            run_full_seed()
        else:
            print("[Startup] Database already seeded, skipping initial load.")
            db.close()
    except Exception as e:
        print(f"[Startup] Seed error: {e}")
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up Market Intelligence Platform...")
    # Start data seed in background thread
    seed_thread = threading.Thread(target=_seed_in_background, daemon=True)
    seed_thread.start()
    # Start scheduler
    from .scheduler import start_scheduler
    scheduler = start_scheduler()
    yield
    print("Shutting down...")
    if scheduler:
        scheduler.shutdown()

app = FastAPI(title="Market Intelligence API", lifespan=lifespan)

# CORS setup — allow Vercel frontend and localhost for dev
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(sector.router)
app.include_router(stocks.router)
app.include_router(relationships.router)
app.include_router(opportunity.router)
app.include_router(predict.router)
app.include_router(market.router)
app.include_router(portfolio.router)
app.include_router(alerts.router)
app.include_router(news.router)
app.include_router(backtest.router)

@app.get("/")
def read_root():
    return {"status": "Market Intelligence API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/data/seed")
def trigger_seed(background_tasks: BackgroundTasks):
    """Manually trigger a full data re-seed."""
    from .data.pipeline import run_full_seed
    background_tasks.add_task(run_full_seed)
    return {"status": "Seed started in background"}

@app.get("/api/data/seed_sync")
def trigger_seed_sync():
    """Manually trigger a full data re-seed synchronously to diagnose errors."""
    from .data.pipeline import run_full_seed
    import traceback
    try:
        res = run_full_seed()
        return {"status": "success", "result": res}
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/data/status")
def data_status():
    """Check if the database has been seeded."""
    db = SessionLocal()
    try:
        from . import models
        return {
            "stocks": db.query(models.Stock).count(),
            "daily_prices": db.query(models.DailyPrice).count(),
            "features": db.query(models.StockFeature).count(),
            "sectors": db.query(models.SectorMetric).count(),
            "opportunities": db.query(models.OpportunityScore).count(),
            "relationships": db.query(models.RelationshipScore).count(),
            "predictions": db.query(models.Prediction).count(),
        }
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
