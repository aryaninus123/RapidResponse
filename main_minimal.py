from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RapidRespond Emergency Response System - Minimal Test",
    description="Minimal version for testing audio uploads and multi-language support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        
        return {
            "emergency_type": emergency_type,
            "priority_level": priority_level,
            "response_plan": response_plan,
            "estimated_response_time": None
        }
        
    except Exception as e:
        logger.error(f"Error processing emergency: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100) 