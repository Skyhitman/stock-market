from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime

from ..database import SessionLocal
from .. import models
from .auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")
    return current_user

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    sessions = db.query(models.UserSession).order_by(models.UserSession.login_time.desc()).all()
    
    # Enrich sessions with user emails/pictures where available
    enriched = []
    for s in sessions:
        user_info = None
        if s.user_id:
            user = db.query(models.User).filter(models.User.id == s.user_id).first()
            if user:
                user_info = {
                    "email": user.email,
                    "picture": user.picture
                }
        
        # Calculate duration in seconds
        duration = None
        if s.logout_time:
            duration = int((s.logout_time - s.login_time).total_seconds())
        else:
            # If active, calculate till now
            duration = int((datetime.utcnow() - s.login_time).total_seconds())

        pages = []
        try:
            pages = json.loads(s.pages_visited or "[]")
        except Exception:
            pages = []

        enriched.append({
            "id": s.id,
            "name": s.name,
            "login_time": s.login_time.isoformat() if s.login_time else None,
            "logout_time": s.logout_time.isoformat() if s.logout_time else None,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "location": s.location,
            "pages_visited": pages,
            "duration_seconds": duration,
            "user": user_info
        })
    return enriched

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    total_users = db.query(models.User).count()
    total_sessions = db.query(models.UserSession).count()
    guest_sessions = db.query(models.UserSession).filter(models.UserSession.user_id == None).count()
    google_sessions = db.query(models.UserSession).filter(models.UserSession.user_id != None).count()

    # Aggregate page views
    page_counts = {}
    sessions = db.query(models.UserSession).all()
    for s in sessions:
        try:
            pages = json.loads(s.pages_visited or "[]")
            for p in pages:
                page_counts[p] = page_counts.get(p, 0) + 1
        except Exception:
            continue

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "guest_sessions": guest_sessions,
        "google_sessions": google_sessions,
        "page_views": page_counts
    }
