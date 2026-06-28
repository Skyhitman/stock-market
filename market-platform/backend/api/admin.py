from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime, timezone

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
            # If active, calculate till now (use timezone-aware UTC)
            duration = int((datetime.now(timezone.utc).replace(tzinfo=None) - s.login_time).total_seconds())

        pages = []
        try:
            pages = json.loads(s.pages_visited or "[]")
        except Exception:
            pages = []

        # Append +00:00 so JavaScript knows these are UTC timestamps
        login_iso = (s.login_time.isoformat() + "+00:00") if s.login_time else None
        logout_iso = (s.logout_time.isoformat() + "+00:00") if s.logout_time else None

        enriched.append({
            "id": s.id,
            "name": s.name,
            "login_time": login_iso,
            "logout_time": logout_iso,
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
    
    # Guest sessions have a User whose google_sub is None
    guest_sessions = db.query(models.UserSession).join(models.User).filter(models.User.google_sub == None).count()
    google_sessions = db.query(models.UserSession).join(models.User).filter(models.User.google_sub != None).count()

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
