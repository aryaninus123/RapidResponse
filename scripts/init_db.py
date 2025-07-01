import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from database.connection import init_db, get_db, engine
from database.models import Base, ServiceAvailability, ServiceStatus, Emergency, EmergencyStatus, PriorityLevel
from sqlalchemy import text

def create_enum_types():
    """Create enum types in the database"""
    with engine.connect() as conn:
        # Create EmergencyStatus enum
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE emergency_status AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        # Create PriorityLevel enum
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE priority_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        conn.commit()

def initialize_database():
    """Initialize database and create initial records"""
    print("Initializing database...")
    
    # Create enum types
    create_enum_types()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
    
    # Create initial service records
    initial_services = [
        {
            "service_type": "MEDICAL",
            "status": ServiceStatus.ACTIVE,
            "available_units": 10,
            "average_response_time": 8
        },
        {
            "service_type": "FIRE",
            "status": ServiceStatus.ACTIVE,
            "available_units": 8,
            "average_response_time": 6
        },
        {
            "service_type": "POLICE",
            "status": ServiceStatus.ACTIVE,
            "available_units": 15,
            "average_response_time": 10
        },
        {
            "service_type": "NGO",
            "status": ServiceStatus.ACTIVE,
            "available_units": 5,
            "average_response_time": 15
        }
    ]
    
    with get_db() as db:
        # Check if services already exist
        existing_services = db.query(ServiceAvailability).all()
        if not existing_services:
            print("Creating initial service records...")
            for service_data in initial_services:
                service = ServiceAvailability(**service_data)
                db.add(service)
            db.commit()
            print("Initial service records created successfully")
        else:
            print("Service records already exist")

def main():
    """Initialize the database"""
    print("Initializing database...")
    
    # Create enum types
    create_enum_types()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")

if __name__ == "__main__":
    main() 