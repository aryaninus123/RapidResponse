"""
Script to add new users to the RapidResponse system
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

def add_new_users():
    """Add new users to the system"""
    
    # Initialize database
    init_db()
    
    # Get database session
    db = next(get_db())
    
    # Define new users to add
    new_users = [
        {
            "username": "dispatcher5",
            "email": "emily.chen@rapidresponse.gov",
            "password": "dispatch789",
            "full_name": "Emily Chen",
            "badge_number": "D-005",
            "role": UserRole.DISPATCHER
        },
        {
            "username": "supervisor1",
            "email": "james.wilson@rapidresponse.gov",
            "password": "super123",
            "full_name": "James Wilson",
            "badge_number": "S-001",
            "role": UserRole.ADMIN
        },
        {
            "username": "trainee1",
            "email": "alex.martinez@rapidresponse.gov",
            "password": "trainee456",
            "full_name": "Alex Martinez",
            "badge_number": "T-001",
            "role": UserRole.DISPATCHER
        }
    ]
    
    print("Adding new users...")
    
    added_count = 0
    for user_data in new_users:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == user_data["username"]) | 
            (User.email == user_data["email"]) |
            (User.badge_number == user_data["badge_number"])
        ).first()
        
        if existing_user:
            print(f"  ⚠️  Skipping {user_data['username']} - user already exists")
            continue
        
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
        print(f"  ✅ Added user: {user_data['username']} ({user_data['full_name']}) - {user_data['role'].value}")
        added_count += 1
    
    # Commit all users
    if added_count > 0:
        db.commit()
        print(f"\n✅ Successfully added {added_count} new users!")
        
        print("\nNew login credentials:")
        for user_data in new_users:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                print(f"  {user_data['username']} / {user_data['password']} ({user_data['role'].value})")
    else:
        print("\n⚠️  No new users were added.")
    
    db.close()

if __name__ == "__main__":
    add_new_users() 