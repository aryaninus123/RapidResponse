import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from database.models import User, UserSession, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for emergency systems

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user

def create_user_session(db: Session, user: User, token: str) -> UserSession:
    """Create a new user session"""
    expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    session = UserSession(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Update user's last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return session

def verify_user_session(db: Session, token: str) -> Optional[User]:
    """Verify a user session token"""
    session = db.query(UserSession).filter(UserSession.token == token).first()
    
    if not session:
        return None
    
    if session.expires_at < datetime.utcnow():
        # Session expired, delete it
        db.delete(session)
        db.commit()
        return None
    
    # Update last used time
    session.last_used = datetime.utcnow()
    db.commit()
    
    return session.user

def invalidate_user_session(db: Session, token: str) -> bool:
    """Invalidate a user session (logout)"""
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False

def cleanup_expired_sessions(db: Session) -> int:
    """Clean up expired sessions and return count of cleaned sessions"""
    expired_count = db.query(UserSession).filter(
        UserSession.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
    return expired_count

def user_has_permission(user: User, required_role: UserRole) -> bool:
    """Check if user has required role permission"""
    if not user or not user.is_active:
        return False
    
    # Role hierarchy: admin > dispatcher > public
    role_hierarchy = {
        UserRole.PUBLIC: 0,
        UserRole.DISPATCHER: 1,
        UserRole.ADMIN: 2
    }
    
    user_level = role_hierarchy.get(user.role, 0)
    required_level = role_hierarchy.get(required_role, 0)
    
    return user_level >= required_level

def get_user_dict(user: User) -> Dict[str, Any]:
    """Convert user model to dictionary for API responses"""
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "badge_number": user.badge_number,
        "role": user.role.value,
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat()
    } 