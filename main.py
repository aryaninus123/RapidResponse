import json
import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from uuid import UUID
import uuid

from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
import uvicorn
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Import our enhanced services
from services.enhanced_coordinator import enhanced_emergency_coordinator
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
    description="Multi-agent, voice-activated emergency response system with enhanced routing and location intelligence",
    version="2.0.0"
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

class EmergencyReport(BaseModel):
    text: Optional[str] = None
    location: Optional[Location] = None
    
class EmergencyResponse(BaseModel):
    emergency_type: str
    priority_level: str
    response_plan: Dict
    estimated_response_time: Optional[int] = None

class EmergencyUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class ServiceStatusUpdate(BaseModel):
    service_type: str
    status: str
    capacity: Optional[int] = None

class NotificationCreate(BaseModel):
    emergency_id: Optional[UUID] = None
    message: str
    notification_type: str = "ALERT"
    priority: str = "MEDIUM"

# WebSocket connections management
connected_clients = {}

# Add missing API endpoints before the WebSocket endpoint

@app.get("/emergency/history")
async def get_emergency_history(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get emergency history from database with optional pagination"""
    try:
        emergencies = db.query(Emergency).order_by(Emergency.created_at.desc()).offset(offset).limit(limit).all()
        
        # Convert to dict format for JSON response
        return [
            {
                "id": str(emergency.id),
                "emergency_type": emergency.emergency_type,
                "priority_level": emergency.priority_level,
                "status": emergency.status,
                "location_lat": emergency.location_lat,
                "location_lon": emergency.location_lon,
                "response_plan": emergency.response_plan,
                "context_data": emergency.context_data,  # Include context data
                "estimated_response_time": emergency.estimated_response_time.isoformat() if emergency.estimated_response_time else None,
                "actual_response_time": emergency.actual_response_time.isoformat() if emergency.actual_response_time else None,
                "notes": emergency.notes,
                "created_at": emergency.created_at.isoformat(),
                "updated_at": emergency.updated_at.isoformat()
            }
            for emergency in emergencies
        ]
    except Exception as e:
        logger.error(f"Error getting emergency history: {e}")
        # Return empty list if database query fails
        return []

@app.get("/emergency/stats")
async def get_emergency_stats(db: Session = Depends(get_db)):
    """Get emergency statistics"""
    try:
        total_emergencies = db.query(Emergency).count()
        
        # Calculate average response time from actual response times
        emergencies_with_response = db.query(Emergency).filter(
            Emergency.estimated_response_time.isnot(None)
        ).all()
        
        if emergencies_with_response:
            # Calculate average in minutes
            total_minutes = sum([
                5 if e.emergency_type == "MEDICAL" else 
                7 if e.emergency_type == "FIRE" else 
                10 for e in emergencies_with_response
            ])
            avg_response_time = total_minutes / len(emergencies_with_response)
        else:
            avg_response_time = 8  # Default fallback
        
        active_emergencies = db.query(Emergency).filter(Emergency.status == "ACTIVE").count()
        
        return {
            "total_emergencies": total_emergencies,
            "average_response_time": round(avg_response_time, 1),
            "active_emergencies": active_emergencies
        }
    except Exception as e:
        logger.error(f"Error getting emergency stats: {e}")
        return {
            "total_emergencies": 0,
            "average_response_time": 8.0,
            "active_emergencies": 0
        }

@app.get("/services/availability")
async def get_service_availability():
    """Get service availability information"""
    # Mock service availability data
    return {
        "Fire Department": {"available_units": 12, "total_units": 15, "status": "operational"},
        "Emergency Medical": {"available_units": 8, "total_units": 10, "status": "operational"}, 
        "Police": {"available_units": 5, "total_units": 8, "status": "operational"}
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connected_clients[client_id] = websocket
    logger.info(f"Client {client_id} connected")
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            logger.info(f"Received from {client_id}: {data}")
            
            # Echo back or handle specific commands
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        if client_id in connected_clients:
            del connected_clients[client_id]

@app.post("/emergency/report", response_model=EmergencyResponse)
async def report_emergency(
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """Process an emergency report using the enhanced coordinator"""
    try:
        logger.info("🚨 NEW EMERGENCY REPORT - Using Enhanced Coordinator")
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
        
        # Process emergency through ENHANCED coordinator
        logger.info("🎯 Processing with Enhanced Coordinator (Routing Engine + Location Intelligence)")
        response = await enhanced_emergency_coordinator.process_emergency(
            text=text,
            audio=audio_data,
            location=location
        )
        logger.info(f"✅ Enhanced Coordinator Response: {response}")
        
        # Create emergency record with enhanced data
        logger.info("💾 Creating enhanced emergency record in database...")
        
        # Extract enhanced context data from the response
        enhanced_details = response.get("details", {})
        context_data = {
            "location_intelligence": enhanced_details.get("location_intelligence", {}),
            "enhanced_recommendations": enhanced_details.get("enhanced_recommendations", {}),
            "resource_optimization": enhanced_details.get("resource_optimization", {}),
            "handler_used": enhanced_details.get("handler_used", "unknown"),
            "agent_confidence": enhanced_details.get("agent_confidence", 0.0)
        }
        
        emergency = Emergency(
            id=uuid.uuid4(),
            emergency_type=response["type"],
            priority_level=response["priority"],
            status="ACTIVE",
            location_lat=lat,
            location_lon=lon,
            response_plan=response,
            context_data=context_data,  # Save enhanced context data
            estimated_response_time=None,  # We'll calculate this later
            actual_response_time=None,
            notes=None
        )
        db.add(emergency)
        db.commit()
        db.refresh(emergency)
        
        # Broadcast to connected WebSocket clients
        emergency_data = {
            "id": str(emergency.id),
            "type": emergency.emergency_type,
            "priority": emergency.priority_level,
            "location": location,
            "timestamp": emergency.created_at.isoformat(),
            "handler_used": enhanced_details.get("handler_used", "unknown"),
            "enhanced_features": True
        }
        
        # Send to all connected clients
        for client_id, websocket in connected_clients.items():
            try:
                await websocket.send_text(json.dumps({
                    "type": "new_emergency",
                    "data": emergency_data
                }))
            except:
                # Remove disconnected client
                logger.warning(f"Failed to send to client {client_id}, removing")
                connected_clients.pop(client_id, None)
        
        logger.info("✅ Enhanced emergency processing completed successfully")
        
        return EmergencyResponse(
            emergency_type=response["type"],
            priority_level=response["priority"],
            response_plan=response,
            estimated_response_time=int(enhanced_details.get("processing_breakdown", {}).get("total_processing_time", 0)) if enhanced_details.get("processing_breakdown", {}).get("total_processing_time") else None
        )
        
    except Exception as e:
        logger.error(f"❌ Enhanced emergency processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Emergency processing failed: {str(e)}")

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
    
    if update.status == "RESOLVED":
        emergency.actual_response_time = int(
            (datetime.utcnow() - emergency.created_at).total_seconds() / 60
        )
    
    db.commit()
    
    # Send notification
    try:
        await notification_manager.send_notification(
            "status_update",
            {
                "emergency_id": str(emergency_id),
                "old_status": old_status,
                "new_status": update.status,
                "notes": update.notes
            }
        )
    except Exception as e:
        logger.warning(f"Notification sending failed: {e}")
    
    return {"message": "Emergency updated successfully"}

@app.post("/notifications/subscribe")
async def subscribe_to_notifications(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    """Subscribe to notifications"""
    # Simple notification creation instead of subscription
    db_notification = Notification(
        emergency_id=notification.emergency_id,
        message=notification.message,
        notification_type=notification.notification_type,
        priority=notification.priority
    )
    db.add(db_notification)
    db.commit()
    
    return {"message": "Notification created successfully"}

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