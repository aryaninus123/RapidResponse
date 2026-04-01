from fastapi import FastAPI, UploadFile, File, HTTPException, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, timezone
import logging
import re
import json
import uuid
import aiohttp
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RapidRespond Emergency Response System",
    description="Multi-agent emergency response system",
    version="1.0.0"
)

# CORS: allow all in dev, restrict to frontend URL in production
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
ALLOWED_ORIGINS = ["*"] if FRONTEND_URL == "*" else [FRONTEND_URL, "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
connected_clients: Dict[str, WebSocket] = {}

# In-memory emergency storage
emergencies_store: List[dict] = []

class EmergencyResponse(BaseModel):
    emergency_type: str
    priority_level: str
    response_plan: dict
    estimated_response_time: Optional[int] = None

def detect_language_simple(text: str) -> str:
    """Simple language detection based on common patterns"""
    text_lower = text.lower()
    
    # Spanish indicators
    if any(word in text_lower for word in ['ayuda', 'fuego', 'incendio', 'personas', 'emergencia', 'médica', 'ataque', 'corazón', '¡', '¿']):
        return "es"
    
    # French indicators  
    elif any(word in text_lower for word in ['secours', 'incendie', 'bâtiment', 'gens', 'piégés', 'urgence', 'maison', 'brûle']):
        return "fr"
    
    # German indicators
    elif any(word in text_lower for word in ['hilfe', 'brand', 'gebäude', 'menschen', 'eingeschlossen', 'notfall', 'jemand', 'zusammengebrochen']):
        return "de"
    
    # Italian indicators
    elif any(word in text_lower for word in ['aiuto', 'incendio', 'edificio', 'persone', 'intrappolate', 'emergenza']):
        return "it"
    
    # Japanese indicators (hiragana/katakana/kanji)
    elif re.search(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', text):
        return "ja"
    
    # Chinese indicators (simplified Chinese characters)
    elif re.search(r'[\u4E00-\u9FFF]', text) and any(word in text for word in ['救命', '大楼', '起火', '被困']):
        return "zh"
    
    # Default to English
    else:
        return "en"

def translate_to_english_mock(text: str, source_lang: str) -> str:
    """Mock translation function for testing"""
    
    translations = {
        "es": {
            "¡Ayuda! Hay un incendio en el edificio y hay personas atrapadas!": 
            "Help! There is a fire in the building and people are trapped!",
            "¡Fuego! ¡La cocina está en llamas!":
            "Fire! The kitchen is on fire!",
            "Emergencia médica! Ataque al corazón!":
            "Medical emergency! Heart attack!"
        },
        "fr": {
            "Au secours! Il y a un incendie dans le bâtiment et des gens sont piégés!":
            "Help! There is a fire in the building and people are trapped!",
            "Incendie! La maison brûle!":
            "Fire! The house is burning!"
        },
        "de": {
            "Hilfe! Es gibt einen Brand im Gebäude und Menschen sind eingeschlossen!":
            "Help! There is a fire in the building and people are trapped!",
            "Notfall! Jemand ist zusammengebrochen!":
            "Emergency! Someone has collapsed!"
        },
        "it": {
            "Aiuto! C'è un incendio nell'edificio e ci sono persone intrappolate!":
            "Help! There is a fire in the building and people are trapped!"
        },
        "ja": {
            "助けて！建物で火事が発生し、人々が閉じ込められています！":
            "Help! There is a fire in the building and people are trapped!"
        },
        "zh": {
            "救命！大楼起火，有人被困！":
            "Help! There is a fire in the building and people are trapped!"
        }
    }
    
    if source_lang == "en":
        return text
    
    # Try exact match first
    if source_lang in translations and text in translations[source_lang]:
        return translations[source_lang][text]
    
    # Generic emergency translation with keyword mapping
    emergency_translations = {
        "es": {
            "fuego": "fire", "incendio": "fire", "emergencia": "emergency", 
            "médica": "medical", "ataque": "attack", "corazón": "heart",
            "ayuda": "help"
        },
        "fr": {
            "incendie": "fire", "secours": "help", "urgence": "emergency",
            "maison": "house", "brûle": "burning"
        },
        "de": {
            "notfall": "emergency", "brand": "fire", "hilfe": "help",
            "zusammengebrochen": "collapsed", "jemand": "someone"
        },
        "it": {
            "incendio": "fire", "aiuto": "help", "emergenza": "emergency"
        },
        "ja": {
            "火事": "fire", "助けて": "help", "緊急": "emergency", "火災": "fire"
        },
        "zh": {
            "起火": "fire", "救命": "help", "紧急": "emergency", "火灾": "fire"
        }
    }
    
    # Simple keyword-based translation
    translated_text = text
    if source_lang in emergency_translations:
        for foreign_word, english_word in emergency_translations[source_lang].items():
            if foreign_word in text.lower():
                translated_text = f"Emergency: {english_word} situation - {text}"
                break
    
    return translated_text

def classify_emergency_simple(text: str) -> tuple:
    """Simple emergency classification based on keywords"""
    text_lower = text.lower()
    
    # Fire indicators (including translated terms)
    fire_keywords = ['fire', 'burn', 'smoke', 'flame', 'incendio', 'brand', 'incendie', '火事', '起火', 'burning', 'kitchen']
    if any(word in text_lower for word in fire_keywords):
        return "FIRE", "HIGH"
    
    # Medical indicators
    medical_keywords = ['medical', 'heart', 'breathing', 'collapsed', 'injured', 'ambulance', 'attack', 'emergency: medical', 'someone has collapsed']
    if any(word in text_lower for word in medical_keywords):
        return "MEDICAL", "HIGH"
    
    # Crime indicators
    crime_keywords = ['robbery', 'attack', 'violence', 'weapon', 'crime', 'armed', 'suspects']
    if any(word in text_lower for word in crime_keywords):
        return "CRIME", "HIGH"
    
    # Check for emergency context
    emergency_keywords = ['emergency', 'help', 'urgent', 'emergency:']
    if any(word in text_lower for word in emergency_keywords):
        return "OTHER", "HIGH"
    
    # Default
    return "OTHER", "MEDIUM"

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    connected_clients[client_id] = websocket
    logger.info(f"WebSocket client connected: {client_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from {client_id}: {data}")
    except WebSocketDisconnect:
        connected_clients.pop(client_id, None)
        logger.info(f"WebSocket client disconnected: {client_id}")
    except Exception as e:
        connected_clients.pop(client_id, None)
        logger.error(f"WebSocket error for {client_id}: {e}")

async def broadcast_to_clients(message: dict):
    """Broadcast a message to all connected WebSocket clients"""
    disconnected = []
    for client_id, ws in list(connected_clients.items()):
        try:
            await ws.send_text(json.dumps(message, default=str))
        except Exception:
            disconnected.append(client_id)
    for cid in disconnected:
        connected_clients.pop(cid, None)

@app.get("/")
async def root():
    return {"status": "ok", "message": "RapidResponse API is running", "docs": "/docs"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Minimal server with multi-language support is running"}

@app.post("/emergency/report", response_model=EmergencyResponse)
async def report_emergency(
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
):
    """Process an emergency report from audio or text input - MINIMAL VERSION WITH MULTI-LANGUAGE"""
    try:
        logger.info("Received emergency report")
        
        if not audio and not text:
            raise HTTPException(
                status_code=400,
                detail="Either audio or text must be provided"
            )
        
        # Process audio if provided
        if audio:
            logger.info(f"Received audio file: {audio.filename}, content_type: {audio.content_type}")
            # Read audio data
            audio_data = await audio.read()
            logger.info(f"Audio data length: {len(audio_data)} bytes")
            
            # Mock transcription for testing
            transcribed_text = "Mock transcription: Medical emergency at Central Park. Someone has collapsed."
            logger.info(f"Mock transcription: {transcribed_text}")
            
            # Use transcribed text
            emergency_text = transcribed_text
            detected_language = "en"
            translated_text = transcribed_text
        else:
            emergency_text = text
            # Detect language
            detected_language = detect_language_simple(emergency_text)
            logger.info(f"Detected language: {detected_language}")
            
            # Translate if needed
            if detected_language != "en":
                translated_text = translate_to_english_mock(emergency_text, detected_language)
                logger.info(f"Translated text: {translated_text}")
            else:
                translated_text = emergency_text
            
        logger.info(f"Processing emergency text: {translated_text}")
        
        # Classify emergency
        emergency_type, priority_level = classify_emergency_simple(translated_text)
        logger.info(f"Classification: {emergency_type}, Priority: {priority_level}")
        
        # Determine required services based on emergency type
        required_services = {
            "medical": emergency_type in ["MEDICAL", "FIRE"],
            "fire": emergency_type == "FIRE",
            "police": emergency_type in ["CRIME", "FIRE"],
            "rescue": emergency_type in ["FIRE", "MEDICAL"]
        }
        
        # Create response
        response_plan = {
            "type": emergency_type,
            "priority": priority_level,
            "details": {
                "original_text": translated_text,
                "original_language": detected_language,
                "location": {"lat": lat, "lon": lon} if lat and lon else None,
                "confidence": 0.95,
                "required_services": required_services
            }
        }
        
        logger.info("Emergency processed successfully")
        
        # Store the emergency
        now = datetime.now(timezone.utc).isoformat()
        emergency_record = {
            "id": str(uuid.uuid4()),
            "emergency_type": emergency_type,
            "priority_level": priority_level,
            "status": "ACTIVE",
            "location_lat": lat,
            "location_lon": lon,
            "response_plan": response_plan,
            "notes": translated_text,
            "context_data": {},
            "estimated_response_time": None,
            "actual_response_time": None,
            "created_at": now,
            "updated_at": now,
        }
        emergencies_store.insert(0, emergency_record)
        logger.info(f"Emergency stored: {emergency_record['id']}")
        
        # Broadcast to connected WebSocket clients
        await broadcast_to_clients({
            "type": "new_emergency",
            "data": emergency_record
        })
        
        return {
            "emergency_type": emergency_type,
            "priority_level": priority_level,
            "response_plan": response_plan,
            "estimated_response_time": None
        }
        
    except Exception as e:
        logger.error(f"Error processing emergency: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/emergency/stats")
async def get_emergency_stats(time_period: str = "24h"):
    """Get emergency statistics based on stored emergencies"""
    total = len(emergencies_store)
    active = sum(1 for e in emergencies_store if e["status"] == "ACTIVE")
    by_type = {"MEDICAL": 0, "FIRE": 0, "CRIME": 0, "OTHER": 0}
    for e in emergencies_store:
        t = e["emergency_type"]
        if t in by_type:
            by_type[t] += 1
        else:
            by_type["OTHER"] += 1
    return {
        "total_emergencies": total,
        "active_emergencies": active,
        "average_response_time": 8.0,
        "response_by_type": by_type,
        "time_period": time_period
    }

@app.get("/services/availability")
async def get_services_availability():
    """Get service availability - mock data for minimal version"""
    return [
        {
            "id": "fire-1",
            "service_type": "Fire Department",
            "available_units": 5,
            "total_units": 8,
            "status": "active",
            "average_response_time": 5
        },
        {
            "id": "medical-1",
            "service_type": "Medical Services",
            "available_units": 10,
            "total_units": 12,
            "status": "active",
            "average_response_time": 7
        },
        {
            "id": "police-1",
            "service_type": "Police",
            "available_units": 10,
            "total_units": 15,
            "status": "active",
            "average_response_time": 4
        }
    ]

@app.get("/emergency/history")
async def get_emergency_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    emergency_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """Get emergency history from in-memory store"""
    results = emergencies_store
    if emergency_type:
        results = [e for e in results if e["emergency_type"] == emergency_type]
    if status:
        results = [e for e in results if e["status"] == status]
    return results[offset:offset + limit]

@app.get("/emergency/{emergency_id}")
async def get_emergency(emergency_id: str):
    """Get a single emergency by ID"""
    for e in emergencies_store:
        if e["id"] == emergency_id:
            return e
    raise HTTPException(status_code=404, detail="Emergency not found")

@app.put("/emergency/{emergency_id}")
async def update_emergency(emergency_id: str, data: dict):
    """Update emergency status or notes"""
    for e in emergencies_store:
        if e["id"] == emergency_id:
            if "status" in data:
                e["status"] = data["status"]
            if "notes" in data:
                e["notes"] = data["notes"]
            e["updated_at"] = datetime.now(timezone.utc).isoformat()
            await broadcast_to_clients({"type": "emergency_update", "data": e})
            return e
    raise HTTPException(status_code=404, detail="Emergency not found")

@app.put("/services/{service_id}")
async def update_service(service_id: str, data: dict):
    """Update service status"""
    return {"id": service_id, "status": "updated", **data}

@app.post("/notifications/subscribe")
async def subscribe_notifications(data: dict):
    """Subscribe to notifications"""
    return {"success": True, "subscriber_id": str(uuid.uuid4())}

@app.get("/notifications/{subscriber_id}")
async def get_notifications(subscriber_id: str):
    """Get notifications for a subscriber"""
    return []

@app.get("/emergency/{emergency_id}/close")
async def close_emergency(emergency_id: str, notes: str = "Emergency closed"):
    """Close an emergency"""
    for e in emergencies_store:
        if e["id"] == emergency_id:
            e["status"] = "RESOLVED"
            e["notes"] = notes
            e["updated_at"] = datetime.now(timezone.utc).isoformat()
            e["actual_response_time"] = datetime.now(timezone.utc).isoformat()
            await broadcast_to_clients({
                "type": "emergency_update",
                "data": e
            })
            return {"success": True, "message": "Emergency closed", "emergency_id": emergency_id}
    raise HTTPException(status_code=404, detail="Emergency not found")

@app.get("/conditions/current")
async def get_current_conditions():
    """Get current weather/traffic conditions using live weather data"""
    # Default location: San Francisco (can be made configurable)
    lat, lon = 37.7749, -122.4194
    
    weather_data = {
        "conditions": "Unknown",
        "temperature": None,
        "wind_speed": None,
        "visibility": None,
    }
    
    try:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_ctx)) as session:
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m"
                f"&temperature_unit=celsius&wind_speed_unit=kmh"
            )
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    current = data.get("current", {})
                    
                    # Map WMO weather codes to readable conditions
                    code = current.get("weather_code", 0)
                    conditions_map = {
                        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy",
                        3: "Overcast", 45: "Foggy", 48: "Depositing rime fog",
                        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
                        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
                        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                        80: "Slight rain showers", 81: "Moderate rain showers",
                        82: "Violent rain showers", 95: "Thunderstorm",
                        96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
                    }
                    
                    weather_data = {
                        "conditions": conditions_map.get(code, "Unknown"),
                        "temperature": current.get("temperature_2m"),
                        "wind_speed": current.get("wind_speed_10m"),
                        "humidity": current.get("relative_humidity_2m"),
                        "visibility": 10,
                    }
                    logger.info(f"Fetched live weather: {weather_data['conditions']}, {weather_data['temperature']}°C")
    except Exception as e:
        logger.warning(f"Failed to fetch live weather: {e}, using defaults")
        weather_data = {
            "conditions": "Clear",
            "temperature": 18,
            "wind_speed": 10,
            "visibility": 10,
        }
    
    # Traffic estimate based on time of day
    hour = datetime.now().hour
    if 7 <= hour <= 9 or 16 <= hour <= 19:
        congestion, speed = "high", 20
    elif 10 <= hour <= 15:
        congestion, speed = "medium", 35
    else:
        congestion, speed = "low", 50
    
    # Count active emergencies that could affect traffic
    active_incidents = [
        {"description": f"{e['emergency_type']} emergency reported"}
        for e in emergencies_store
        if e["status"] == "ACTIVE" and e["emergency_type"] in ("FIRE", "TRAFFIC")
    ]
    if active_incidents:
        congestion = "high"
        speed = max(10, speed - 15)
    
    return {
        "weather": weather_data,
        "traffic": {
            "congestion_level": congestion,
            "average_speed": speed,
            "incidents": active_incidents,
        },
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 