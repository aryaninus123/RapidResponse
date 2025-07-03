"""
Script to create initial users for the RapidResponse system
"""
import os
import sys
from pathlib import Path

# Add parent directory to path so we can import from the project
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

from sqlalchemy.orm import Session
from database.connection import get_db, init_db
from database.models import User, UserRole
from services.auth.auth_utils import get_password_hash

def create_initial_users():
    """Create initial users for the system"""
    
    # Initialize database
    init_db()
    
    # Get database session
    db = next(get_db())
    
    # Check if users already exist
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"Database already has {existing_users} users. Skipping user creation.")
        return
    
    # Define initial users (matching frontend mock data)
    initial_users = [
        {
            "username": "dispatcher1",
            "email": "sarah.johnson@rapidresponse.gov",
            "password": "dispatch123",
            "full_name": "Sarah Johnson",
            "badge_number": "D-001",
            "role": UserRole.DISPATCHER
        },
        {
            "username": "dispatcher2", 
            "email": "mike.rodriguez@rapidresponse.gov",
            "password": "dispatch456",
            "full_name": "Mike Rodriguez",
            "badge_number": "D-002",
            "role": UserRole.DISPATCHER
        },
        {
            "username": "admin",
            "email": "chief.anderson@rapidresponse.gov", 
            "password": "admin123",
            "full_name": "Chief Anderson",
            "badge_number": "A-001",
            "role": UserRole.ADMIN
        }
    ]
    
    print("Creating initial users...")
    
    for user_data in initial_users:
        # Hash password
        hashed_password = get_password_hash(user_data["password"])
        
        # Create user
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=hashed_password,
            full_name=user_data["full_name"],
            badge_number=user_data["badge_number"],
            role=user_data["role"]
        )
        
        db.add(user)
        print(f"  Created user: {user_data['username']} ({user_data['full_name']}) - {user_data['role'].value}")
    
    # Commit all users
    db.commit()
    db.close()
    
    print(f"\n✅ Successfully created {len(initial_users)} initial users!")
    print("\nLogin credentials:")
    for user_data in initial_users:
        print(f"  {user_data['username']} / {user_data['password']} ({user_data['role'].value})")
    
    print("\nUsers can now authenticate using these credentials.")

if __name__ == "__main__":
    create_initial_users() 