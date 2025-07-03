from typing import Optional
from fastapi import HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User, UserRole
from .auth_utils import verify_token, verify_user_session

# Security scheme for JWT tokens
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        # Verify session token
        user = verify_user_session(db, token)
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if token is provided, otherwise return None"""
    if not authorization:
        return None
    
    try:
        # Extract Bearer token
        if not authorization.startswith("Bearer "):
            return None
        
        token = authorization.split(" ")[1]
        user = verify_user_session(db, token)
        return user if user and user.is_active else None
    except Exception:
        return None

def require_role(required_role: UserRole):
    """Dependency factory to require specific role"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        # Role hierarchy check
        role_hierarchy = {
            UserRole.PUBLIC: 0,
            UserRole.DISPATCHER: 1,
            UserRole.ADMIN: 2
        }
        
        user_level = role_hierarchy.get(current_user.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role.value}"
            )
        return current_user
    
    return role_checker

# Common role dependencies
require_dispatcher = require_role(UserRole.DISPATCHER)
require_admin = require_role(UserRole.ADMIN) 