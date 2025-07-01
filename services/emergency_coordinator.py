from typing import Dict, List, Optional, Any
from services.classification.emergency_classifier import EmergencyClassifier
from services.translation.translation_service import TranslationService
from services.speech.speech_service import SpeechService
from services.data_collection.apify_service import ApifyDataCollector
from services.notification.notification_service import notification_manager
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class EmergencyCoordinator:
    def __init__(self):
        """Initialize the emergency coordinator with required services"""
        self.translation_service = TranslationService()
        self.emergency_classifier = EmergencyClassifier()
        self.speech_service = SpeechService()
        self.data_collector = ApifyDataCollector(api_token=os.getenv("APIFY_API_TOKEN", ""))

    async def process_emergency(
        self,
        text: Optional[str] = None,
        audio: Optional[bytes] = None,
        location: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Process an emergency report from either text or audio input
        
        Args:
            text: Text input (optional)
            audio: Audio input in bytes (optional)
            location: Dictionary containing lat and lon (optional)
            
        Returns:
            Dictionary containing emergency type, priority, and other details
        """
        try:
            # Convert audio to text if provided
            if audio and not text:
                transcription_result = await self.speech_service.transcribe(audio)
                text = transcription_result["text"]

            if not text:
                raise Exception("No text input provided")

            # Detect language and translate if needed
            lang_result = await self.translation_service.detect_language(text)
            if self.translation_service.is_translation_needed(lang_result["language"]):
                translation = await self.translation_service.translate(text)
                text = translation["translated_text"]

            # Classify emergency
            classification = await self.emergency_classifier.classify(text)

            # Get required services
            required_services = await self.emergency_classifier.get_required_services(
                classification["type"],
                classification["confidence"]
            )

            # Get contextual data if location provided
            context = None
            if location:
                context = await self.data_collector.get_emergency_context(
                    location,
                    classification["type"]
                )

            return {
                "type": classification["type"],
                "priority": classification["priority"],
                "details": {
                    "original_text": text,
                    "location": location,
                    "confidence": classification["confidence"],
                    "required_services": required_services,
                    "context": context
                }
            }

        except Exception as e:
            raise Exception(f"Failed to process emergency: {str(e)}")

    def _determine_priority(
        self,
        classification: Dict[str, Any],
        location: Optional[Dict[str, float]] = None
    ) -> str:
        """
        Determine emergency priority based on classification and location
        
        Args:
            classification: Dictionary containing emergency type and confidence
            location: Dictionary containing lat and lon (optional)
            
        Returns:
            Priority level (HIGH, MEDIUM, LOW)
        """
        # Get base priority from classification
        base_priority = classification.get("priority", "MEDIUM")
        
        # Adjust priority based on confidence
        confidence = classification.get("confidence", 0.0)
        if confidence < 0.3:
            base_priority = "LOW"
        elif confidence > 0.8:
            base_priority = "HIGH"
            
        # TODO: Adjust priority based on location (e.g., population density)
        
        return base_priority

    async def _notify_services(
        self,
        emergency_details: Dict,
        required_services: List[tuple]
    ):
        """Notify relevant emergency services"""
        try:
            # Create notifications for each required service
            for service_type, confidence in required_services:
                notification_data = {
                    **emergency_details,
                    "service_confidence": confidence
                }
                
                await notification_manager.send_notification(
                    notification_type=service_type,
                    data=notification_data
                )
                
        except Exception as e:
            raise Exception(f"Failed to notify services: {str(e)}")

    async def update_emergency_status(
        self,
        emergency_id: str,
        new_status: str,
        update_data: Optional[Dict] = None
    ):
        """
        Update the status of an emergency
        
        Args:
            emergency_id: ID of the emergency
            new_status: New status
            update_data: Optional additional update data
        """
        try:
            # Create update notification
            notification_data = {
                "emergency_id": emergency_id,
                "status": new_status,
                **(update_data or {})
            }
            
            # Send update notification
            await notification_manager.send_notification(
                notification_type="STATUS_UPDATE",
                data=notification_data
            )
            
        except Exception as e:
            raise Exception(f"Failed to update emergency status: {str(e)}")

# Create global coordinator instance
emergency_coordinator = EmergencyCoordinator() 