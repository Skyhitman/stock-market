from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import pytz

from .data.pipeline import run_live_update, run_eod_predict

def job_5_min_update():
    print(f"[{datetime.now()}] Running 5-min live market update...")
    try:
        run_live_update()
    except Exception as e:
        print(f"[Scheduler] 5-min update failed: {e}")

def job_end_of_day_predict():
    print(f"[{datetime.now()}] Running End-of-Day XGBoost Retrain & Predict...")
    try:
        run_eod_predict()
    except Exception as e:
        print(f"[Scheduler] EOD predict failed: {e}")

def start_scheduler():
    ist_tz = pytz.timezone('Asia/Kolkata')
    scheduler = AsyncIOScheduler(timezone=ist_tz)
    
    # 5-minute interval during market hours (09:15 to 15:30 IST), Mon-Fri
    scheduler.add_job(
        job_5_min_update,
        CronTrigger(day_of_week='mon-fri', hour='9-15', minute='*/5', timezone=ist_tz),
        id='5_min_update',
        replace_existing=True
    )
    
    # End of day trigger (15:35 IST)
    scheduler.add_job(
        job_end_of_day_predict,
        CronTrigger(day_of_week='mon-fri', hour=15, minute=35, timezone=ist_tz),
        id='eod_predict',
        replace_existing=True
    )
    
    scheduler.start()
    return scheduler
