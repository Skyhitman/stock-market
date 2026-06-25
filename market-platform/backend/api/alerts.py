from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(20).all()
    return [{"id": a.id, "message": a.message, "level": a.level, "is_read": a.is_read, "created_at": a.created_at} for a in alerts]

@router.post("/mark-read")
def mark_read(db: Session = Depends(get_db)):
    db.query(models.Alert).filter(models.Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}
