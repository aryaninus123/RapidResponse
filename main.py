from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Path, WebSocket, Depends, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
import logging

# Load environment variables
load_dotenv()

# Import our services
from services.emergency_coordinator import emergency_coordinator
from services.notification.notification_service import notification_manager
from database.connection import get_db, init_db
from database.models import (
    Emergency,
    EmergencyStatus,
    ServiceStatus,
    ServiceAvailability,
    Notification,
    NotificationSubscription
)

# Initialize FastAPI app
app = FastAPI(
    title="RapidRespond Emergency Response System",
    description="Multi-agent, voice-activated emergency response system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class Location(BaseModel):
    lat: float
    lon: float

class EmergencyResponse(BaseModel):
    emergency_type: str
    priority_level: str
    response_plan: Dict
    estimated_response_time: Optional[int] = None

class EmergencyUpdate(BaseModel):
    status: EmergencyStatus
    notes: Optional[str] = None

class ServiceStatus(BaseModel):
    service_type: str
    status: str
    available_units: int
    average_response_time: int

class EmergencyStats(BaseModel):
    total_emergencies: int
    average_response_time: float
    response_by_type: Dict[str, int]
    success_rate: float

class NotificationSubscriptionCreate(BaseModel):
    subscriber_type: str
    subscriber_id: str
    notification_type: str
    channel: str

class EmergencyRequest(BaseModel):
    text: Optional[str] = None
    location: Optional[Location] = None

@app.post("/emergency/report", response_model=EmergencyResponse)
async def report_emergency(
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """Process an emergency report from audio or text input"""
    try:
        logger.info("Received new emergency report")
        if not audio and not text:
            raise HTTPException(
                status_code=400,
                detail="Either audio or text must be provided"
            )
            
        # Read audio file if provided
        audio_data = await audio.read() if audio else None
        
        # Create location dict if coordinates provided
        location = None
        if lat is not None and lon is not None:
            location = {"lat": lat, "lon": lon}
        
        # Process emergency through coordinator
        logger.info("Processing emergency with coordinator...")
        response = await emergency_coordinator.process_emergency(
            text=text,
            audio=audio_data,
            location=location
        )
        logger.info(f"Coordinator response: {response}")
        
        # Create emergency record
        logger.info("Creating emergency record in database...")
        emergency = Emergency(
            id=uuid4(),
            emergency_type=response["type"],
            priority_level=response["priority"],
            status="ACTIVE",
            location_lat=lat,
            location_lon=lon,
            response_plan=response,
            estimated_response_time=None,  # We'll calculate this later
            actual_response_time=None,
            notes=None
        )
        db.add(emergency)
        db.commit()
        logger.info("Emergency record created successfully")
        
        # Send notifications
        logger.info("Sending notifications...")
        await notification_manager.send_notification(
            "emergency",
            {
                "emergency_id": str(emergency.id),
                **response
            }
        )
        logger.info("Notifications sent")
        
        return {
            "emergency_type": response["type"],
            "priority_level": response["priority"],
            "response_plan": response,
            "estimated_response_time": None  # We'll calculate this later
        }
    except Exception as e:
        logger.error(f"Error processing emergency report: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/emergency/{emergency_id}")
async def get_emergency_status(
    emergency_id: UUID,
    db: Session = Depends(get_db)
):
    """Get the status and details of a specific emergency"""
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    return {
        "id": emergency.id,
        "emergency_type": emergency.emergency_type,
        "priority_level": emergency.priority_level,
        "status": emergency.status,
        "response_plan": emergency.response_plan,
        "estimated_response_time": emergency.estimated_response_time,
        "actual_response_time": emergency.actual_response_time,
        "created_at": emergency.created_at,
        "updated_at": emergency.updated_at
    }

@app.put("/emergency/{emergency_id}")
async def update_emergency(
    emergency_id: UUID,
    update: EmergencyUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of an emergency"""
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    old_status = emergency.status
    emergency.status = update.status
    emergency.notes = update.notes
    emergency.updated_at = datetime.utcnow()
    
    if update.status == EmergencyStatus.RESOLVED:
        emergency.actual_response_time = int(
            (datetime.utcnow() - emergency.created_at).total_seconds() / 60
        )
    
    db.commit()
    
    # Send notification
    await notification_manager.send_notification(
        "status_update",
        {
            "emergency_id": str(emergency_id),
            "old_status": old_status,
            "new_status": update.status,
            "notes": update.notes
        }
    )
    
    return {"message": "Emergency updated successfully"}

@app.get("/emergency/history")
async def get_emergency_history(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    emergency_type: Optional[str] = None,
    status: Optional[EmergencyStatus] = None,
    db: Session = Depends(get_db)
):
    """Get historical emergency data with filters"""
    query = db.query(Emergency)
    
    if start_date:
        query = query.filter(Emergency.created_at >= start_date)
    if end_date:
        query = query.filter(Emergency.created_at <= end_date)
    if emergency_type:
        query = query.filter(Emergency.emergency_type == emergency_type)
    if status:
        query = query.filter(Emergency.status == status)
        
    return query.all()

@app.get("/emergency/stats")
async def get_emergency_stats(
    time_period: str = Query("24h"),
    db: Session = Depends(get_db)
):
    """Get emergency response statistics"""
    if time_period == "24h":
        threshold = datetime.utcnow() - timedelta(hours=24)
    elif time_period == "7d":
        threshold = datetime.utcnow() - timedelta(days=7)
    else:
        threshold = datetime.utcnow() - timedelta(days=30)
    
    emergencies = db.query(Emergency).filter(
        Emergency.created_at >= threshold
    ).all()
    
    total = len(emergencies)
    if total == 0:
        return EmergencyStats(
            total_emergencies=0,
            average_response_time=0,
            response_by_type={},
            success_rate=0
        )
    
    response_times = []
    type_counts = {}
    resolved_count = 0
    
    for emergency in emergencies:
        if emergency.actual_response_time:
            response_times.append(emergency.actual_response_time)
        type_counts[emergency.emergency_type] = type_counts.get(
            emergency.emergency_type, 0
        ) + 1
        if emergency.status == EmergencyStatus.RESOLVED:
            resolved_count += 1
    
    return EmergencyStats(
        total_emergencies=total,
        average_response_time=sum(response_times) / len(response_times) if response_times else 0,
        response_by_type=type_counts,
        success_rate=resolved_count / total
    )

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time notifications"""
    await notification_manager.connect(websocket, client_id)
    try:
        while True:
            await websocket.receive_text()
    except:
        await notification_manager.disconnect(websocket, client_id)

@app.post("/notifications/subscribe")
async def subscribe_to_notifications(
    subscription: NotificationSubscriptionCreate,
    db: Session = Depends(get_db)
):
    """Subscribe to notifications"""
    db_subscription = NotificationSubscription(
        subscriber_type=subscription.subscriber_type,
        subscriber_id=subscription.subscriber_id,
        notification_type=subscription.notification_type,
        channel=subscription.channel
    )
    db.add(db_subscription)
    db.commit()
    
    return {"message": "Subscription created successfully"}

@app.get("/notifications/{subscriber_id}")
async def get_notifications(
    subscriber_id: str,
    db: Session = Depends(get_db)
):
    """Get notifications for a subscriber"""
    notifications = db.query(Notification).filter(
        Notification.recipient_id == subscriber_id
    ).order_by(
        Notification.created_at.desc()
    ).limit(100).all()
    
    return notifications

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    ) 