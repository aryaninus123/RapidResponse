from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from database.connection import get_db
from database.models import User, UserRole
from .auth_utils import (
    authenticate_user, 
    create_access_token, 
    create_user_session,
    invalidate_user_session,
    get_password_hash,
    get_user_dict,
    cleanup_expired_sessions
)
from .dependencies import get_current_active_user, get_optional_user, require_admin, security

router = APIRouter(prefix="/auth", tags=["authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    expires_in: int = 28800  # 8 hours in seconds

class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    badge_number: Optional[str] = None
    role: UserRole = UserRole.DISPATCHER

class UserResponse(BaseModel):
    user: Dict[str, Any]

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    # Clean up expired sessions first
    cleanup_expired_sessions(db)
    
    # Authenticate user
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value
    }
    access_token = create_access_token(data=access_token_data)
    
    # Create user session
    create_user_session(db, user, access_token)
    
    return LoginResponse(
        access_token=access_token,
        user=get_user_dict(user)
    )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user and invalidate session"""
    token = credentials.credentials
    success = invalidate_user_session(db, token)
    
    if success:
        return {"message": "Successfully logged out"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse(user=get_user_dict(current_user))

@router.get("/verify")
async def verify_token(
    user: Optional[User] = Depends(get_optional_user)
):
    """Verify if current token is valid"""
    if user:
        return {
            "valid": True,
            "user": get_user_dict(user)
        }
    else:
        return {"valid": False}

@router.post("/create-user", response_model=UserResponse)
async def create_user(
    user_data: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user (admin only)"""
    
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | 
        (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Check if badge number already exists (if provided)
    if user_data.badge_number:
        existing_badge = db.query(User).filter(User.badge_number == user_data.badge_number).first()
        if existing_badge:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Badge number already assigned"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        badge_number=user_data.badge_number,
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(user=get_user_dict(new_user))

@router.get("/users")
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 50
):
    """List all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return {
        "users": [get_user_dict(user) for user in users],
        "total": db.query(User).count()
    }

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Toggle user active status (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "user": get_user_dict(user)
    }

@router.delete("/cleanup-sessions")
async def cleanup_expired_sessions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean up expired sessions (admin only)"""
    count = cleanup_expired_sessions(db)
    return {"message": f"Cleaned up {count} expired sessions"} 