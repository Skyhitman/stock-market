from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..database import SessionLocal
from .. import models

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID = "846823789818-3s4gh09a9q6ae402dt6voajhhntdkbtd.apps.googleusercontent.com"
JWT_SECRET = os.environ.get("JWT_SECRET", "sk-share-market-analysis-jwt-secret-key-1234567890")
ALGORITHM = "HS256"

security = HTTPBearer()

class GoogleLoginRequest(BaseModel):
    token: str

class GuestLoginRequest(BaseModel):
    name: str

class HeartbeatRequest(BaseModel):
    pages_visited: list[str]

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def get_current_user_or_session(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    payload = get_current_user_or_session(credentials, db)
    if payload.get("is_guest"):
        raise HTTPException(status_code=403, detail="Admin or registered user required")
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/google")
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        # Verify the ID Token
        id_info = id_token.verify_oauth2_token(req.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = id_info.get("email")
        google_sub = id_info.get("sub")
        name = id_info.get("name", "Google User")
        picture = id_info.get("picture")
        
        if not email or not google_sub:
            raise HTTPException(status_code=400, detail="Invalid token details")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token validation failed: {str(e)}")

    # Check if user exists, otherwise create
    user = db.query(models.User).filter(models.User.google_sub == google_sub).first()
    is_admin = (email.lower() == "sauravksep29@gmail.com")
    
    if not user:
        user = models.User(
            google_sub=google_sub,
            email=email,
            name=name,
            picture=picture,
            is_admin=is_admin
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user details if changed
        user.name = name
        user.picture = picture
        user.is_admin = is_admin
        db.commit()
        db.refresh(user)

    # Log the Session
    ip = request.headers.get("x-forwarded-for") or request.client.host
    user_agent = request.headers.get("user-agent")
    
    # Mock location for Indian Stock Market focus
    location = "India"
    
    session = models.UserSession(
        user_id=user.id,
        name=user.name,
        login_time=datetime.utcnow(),
        ip_address=ip,
        user_agent=user_agent,
        location=location,
        pages_visited="[]"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate token
    token_payload = {
        "user_id": user.id,
        "session_id": session.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "is_admin": user.is_admin,
        "is_guest": False
    }
    access_token = create_access_token(token_payload)

    return {
        "access_token": access_token,
        "user": {
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "is_admin": user.is_admin
        }
    }

@router.post("/guest")
def guest_login(req: GuestLoginRequest, request: Request, db: Session = Depends(get_db)):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
        
    name = req.name.strip()
    
    # Create guest user in the users table
    user = models.User(
        google_sub=None,
        email=None,
        name=name,
        picture=None,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    ip = request.headers.get("x-forwarded-for") or request.client.host
    user_agent = request.headers.get("user-agent")
    location = "India (Guest)"

    session = models.UserSession(
        user_id=user.id,
        name=name,
        login_time=datetime.utcnow(),
        ip_address=ip,
        user_agent=user_agent,
        location=location,
        pages_visited="[]"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate token
    token_payload = {
        "user_id": user.id,
        "session_id": session.id,
        "name": name,
        "is_admin": False,
        "is_guest": True
    }
    access_token = create_access_token(token_payload)

    return {
        "access_token": access_token,
        "user": {
            "name": name,
            "is_admin": False,
            "is_guest": True
        }
    }

@router.post("/heartbeat")
def session_heartbeat(req: HeartbeatRequest, payload: dict = Depends(get_current_user_or_session), db: Session = Depends(get_db)):
    session_id = payload.get("session_id")
    session = db.query(models.UserSession).filter(models.UserSession.id == session_id).first()
    if session:
        import json
        try:
            # Merge existing visits
            existing = json.loads(session.pages_visited or "[]")
            for page in req.pages_visited:
                if page not in existing:
                    existing.append(page)
            session.pages_visited = json.dumps(existing)
        except Exception:
            session.pages_visited = json.dumps(req.pages_visited)
            
        # Update logout_time to be current heartbeat to represent the last time seen alive
        session.logout_time = datetime.utcnow()
        db.commit()
    return {"status": "alive"}

@router.post("/logout")
def session_logout(payload: dict = Depends(get_current_user_or_session), db: Session = Depends(get_db)):
    session_id = payload.get("session_id")
    session = db.query(models.UserSession).filter(models.UserSession.id == session_id).first()
    if session:
        session.logout_time = datetime.utcnow()
        db.commit()
    return {"status": "logged out"}
