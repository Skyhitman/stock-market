from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..analysis.backtest import run_historical_backtest

router = APIRouter(prefix="/api/backtest", tags=["Backtest"])

@router.get("/run")
def get_backtest_results(days: int = 90, db: Session = Depends(get_db)):
    results = run_historical_backtest(db, days)
    return results
