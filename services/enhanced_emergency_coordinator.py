from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import logging
import os
from dotenv import load_dotenv

from .routing.dispatch_engine import dispatch_engine, MCPResponse
from .routing.agents.fire_agent import FireEmergencyAgent
from .routing.agents.medical_agent import MedicalEmergencyAgent
from .location_intelligence import LocationIntelligence
from .classification.emergency_classifier import EmergencyClassifier
from .translation.translation_service import TranslationService
from .speech.speech_service import SpeechService
from .notification.notification_service import notification_manager

load_dotenv()
logger = logging.getLogger(__name__)

class EnhancedEmergencyCoordinator:
    """Enhanced emergency coordinator with routing engine and location intelligence"""
    
    def __init__(self):
        # Initialize core services
        self.translation_service = TranslationService()
        self.emergency_classifier = EmergencyClassifier()
        self.speech_service = SpeechService(test_mode=False)
        
        # Initialize enhanced services
        apify_token = os.getenv("APIFY_API_TOKEN", "")
        self.location_intelligence = LocationIntelligence(apify_token)
        
        # Initialize and register emergency agents
        self._initialize_routing_engine()
        
        logger.info("Enhanced Emergency Coordinator initialized with routing engine and location intelligence")
    
    def _initialize_routing_engine(self):
        """Initialize and register emergency agent handlers"""
        # Register specialized agents
        fire_agent = FireEmergencyAgent()
        medical_agent = MedicalEmergencyAgent()
        
        dispatch_engine.register_handler("FIRE", fire_agent)
        dispatch_engine.register_handler("MEDICAL", medical_agent)
        
        # Set routing rules
        routing_rules = {
            "FIRE": ["FIRE"],
            "MEDICAL": ["MEDICAL"],
            "POLICE": ["fallback"],  # No specialized police agent yet
            "TRAFFIC": ["MEDICAL", "fallback"],  # Route traffic emergencies to medical if needed
            "NATURAL_DISASTER": ["FIRE", "MEDICAL", "fallback"],
            "OTHER": ["fallback"],
            "fallback": ["MEDICAL", "FIRE"]  # Fallback chain
        }
        
        dispatch_engine.set_routing_rules(routing_rules)
        
        logger.info("Routing engine initialized with specialized agents")
    
    async def process_emergency(
        self,
        text: Optional[str] = None,
        audio: Optional[bytes] = None,
        location: Optional[Dict[str, float]] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enhanced emergency processing with routing engine and location intelligence
        
        Args:
            text: Text input (optional)
            audio: Audio input in bytes (optional)
            location: Dictionary containing lat and lon (optional)
            session_id: Session identifier (optional)
            
        Returns:
            Dictionary containing comprehensive emergency response
        """
        try:
            start_time = datetime.now()
            
            # Step 1: Convert audio to text if provided
            processed_text = await self._process_audio_input(audio, text)
            
            # Step 2: Handle language detection and translation
            final_text = await self._handle_language_processing(processed_text)
            
            # Step 3: Classify the emergency
            classification = await self._classify_emergency(final_text)
            
            # Step 4: Get enhanced location intelligence
            location_context = await self._get_location_intelligence(
                location, classification["type"], classification["priority"]
            )
            
            # Step 5: Build emergency data package for routing
            emergency_data = self._build_emergency_data_package(
                final_text, location, classification, location_context, session_id
            )
            
            # Step 6: Route through dispatch engine with MCP formatting
            mcp_response = await dispatch_engine.dispatch(emergency_data, session_id)
            
            # Step 7: Enhance response with location intelligence
            enhanced_response = await self._enhance_response_with_intelligence(
                mcp_response, location_context
            )
            
            # Step 8: Send notifications
            await self._send_enhanced_notifications(enhanced_response)
            
            # Step 9: Build final response
            final_response = self._build_final_response(
                enhanced_response, location_context, start_time
            )
            
            logger.info(f"Enhanced emergency processed in {final_response['processing_time']:.2f}s")
            return final_response
            
        except Exception as e:
            logger.error(f"Enhanced emergency processing failed: {e}")
            return self._create_error_response(str(e))
    
    async def _process_audio_input(self, audio: Optional[bytes], text: Optional[str]) -> str:
        """Process audio input to text"""
        if audio and not text:
            transcription_result = await self.speech_service.transcribe(audio)
            return transcription_result["text"]
        return text or ""
    
    async def _handle_language_processing(self, text: str) -> str:
        """Handle language detection and translation"""
        if not text:
            raise Exception("No text input provided")
        
        lang_result = await self.translation_service.detect_language(text)
        if self.translation_service.is_translation_needed(lang_result["language"]):
            translation = await self.translation_service.translate(text)
            return translation["translated_text"]
        return text
    
    async def _classify_emergency(self, text: str) -> Dict[str, Any]:
        """Classify the emergency using the emergency classifier"""
        return await self.emergency_classifier.classify(text)
    
    async def _get_location_intelligence(
        self, 
        location: Optional[Dict[str, float]], 
        emergency_type: str, 
        priority: str
    ) -> Dict[str, Any]:
        """Get enhanced location intelligence context"""
        if not location:
            return {"status": "no_location", "facilities": {}}
        
        try:
            # Map priority to urgency level
            urgency_mapping = {
                "LOW": "low",
                "MEDIUM": "medium", 
                "HIGH": "high",
                "CRITICAL": "critical"
            }
            urgency_level = urgency_mapping.get(priority, "medium")
            
            # Get comprehensive location context
            context = await self.location_intelligence.get_emergency_context(
                location, emergency_type, urgency_level
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Location intelligence failed: {e}")
            return {"status": "location_intelligence_failed", "facilities": {}}
    
    def _build_emergency_data_package(
        self,
        text: str,
        location: Optional[Dict[str, float]],
        classification: Dict[str, Any],
        location_context: Dict[str, Any],
        session_id: Optional[str]
    ) -> Dict[str, Any]:
        """Build comprehensive emergency data package for routing"""
        return {
            "emergency_id": f"emergency_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "type": classification["type"],
            "priority": classification["priority"],
            "text": text,
            "location": location,
            "confidence": classification["confidence"],
            "details": {
                "classification": classification,
                "context": location_context,
                "timestamp": datetime.now().isoformat()
            },
            "user_context": {},
            "session_id": session_id,
            "source": "enhanced_coordinator",
            "language": "en",  # Updated during translation processing
            "requires_translation": False
        }
    
    async def _enhance_response_with_intelligence(
        self, 
        mcp_response: MCPResponse, 
        location_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance MCP response with location intelligence"""
        enhanced_response = {
            "mcp_response": {
                "handler_id": mcp_response.handler_id,
                "confidence": mcp_response.confidence,
                "processing_time": mcp_response.processing_time,
                "response_data": mcp_response.response_data,
                "next_actions": mcp_response.next_actions
            },
            "location_intelligence": location_context,
            "enhanced_recommendations": self._generate_enhanced_recommendations(
                mcp_response, location_context
            ),
            "resource_optimization": self._optimize_resource_allocation(
                mcp_response, location_context
            )
        }
        
        return enhanced_response
    
    def _generate_enhanced_recommendations(
        self, 
        mcp_response: MCPResponse, 
        location_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate enhanced recommendations combining agent response and location intelligence"""
        recommendations = {}
        
        # Get facilities from location intelligence
        facilities = location_context.get("facilities", {})
        
        # Combine with agent recommendations
        if mcp_response.handler_id == "medical_emergency_agent":
            hospitals = facilities.get("hospitals", [])
            if hospitals:
                # Use location intelligence to refine hospital selection
                recommendations["hospital_selection"] = {
                    "primary": hospitals[0] if hospitals else None,
                    "alternatives": hospitals[1:3] if len(hospitals) > 1 else [],
                    "selection_criteria": "closest_with_capabilities"
                }
        
        elif mcp_response.handler_id == "fire_emergency_agent":
            fire_stations = facilities.get("fire_stations", [])
            if fire_stations:
                recommendations["fire_station_dispatch"] = {
                    "primary": fire_stations[0] if fire_stations else None,
                    "backup_stations": fire_stations[1:2] if len(fire_stations) > 1 else [],
                    "response_strategy": "closest_available"
                }
        
        return recommendations
    
    def _optimize_resource_allocation(
        self, 
        mcp_response: MCPResponse, 
        location_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Optimize resource allocation based on location intelligence"""
        optimization = {
            "resource_assessment": location_context.get("resource_assessment", {}),
            "optimal_routes": location_context.get("optimal_routes", {}),
            "deployment_strategy": "standard"
        }
        
        # Adjust deployment based on resource availability
        resource_assessment = location_context.get("resource_assessment", {})
        
        for facility_type, assessment in resource_assessment.items():
            if assessment.get("coverage_status") == "poor":
                optimization["deployment_strategy"] = "extended_response_area"
                optimization[f"{facility_type}_alternatives"] = "consider_regional_resources"
        
        return optimization
    
    async def _send_enhanced_notifications(self, enhanced_response: Dict[str, Any]):
        """Send enhanced notifications using both MCP response and location intelligence"""
        try:
            mcp_response = enhanced_response["mcp_response"]
            location_intelligence = enhanced_response["location_intelligence"]
            
            # Build enhanced notification data
            notification_data = {
                **mcp_response["response_data"],
                "location_context": location_intelligence,
                "enhanced_recommendations": enhanced_response["enhanced_recommendations"],
                "resource_optimization": enhanced_response["resource_optimization"]
            }
            
            # Send to notification service
            await notification_manager.send_notification(
                notification_type="ENHANCED_EMERGENCY_RESPONSE",
                data=notification_data
            )
            
        except Exception as e:
            logger.error(f"Enhanced notification failed: {e}")
    
    def _build_final_response(
        self, 
        enhanced_response: Dict[str, Any], 
        location_context: Dict[str, Any], 
        start_time: datetime
    ) -> Dict[str, Any]:
        """Build the final comprehensive response"""
        mcp_response = enhanced_response["mcp_response"]
        
        return {
            "type": mcp_response["response_data"].get("emergency_type", "UNKNOWN"),
            "priority": mcp_response["response_data"].get("priority", "MEDIUM"),
            "details": {
                "handler_used": mcp_response["handler_id"],
                "agent_confidence": mcp_response["confidence"],
                "agent_response": mcp_response["response_data"],
                "location_intelligence": location_context,
                "enhanced_recommendations": enhanced_response["enhanced_recommendations"],
                "resource_optimization": enhanced_response["resource_optimization"],
                "next_actions": mcp_response["next_actions"],
                "processing_breakdown": {
                    "agent_processing_time": mcp_response["processing_time"],
                    "total_processing_time": (datetime.now() - start_time).total_seconds()
                }
            },
            "processing_time": (datetime.now() - start_time).total_seconds(),
            "status": "enhanced_processing_complete"
        }
    
    def _create_error_response(self, error: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "type": "ERROR",
            "priority": "HIGH",
            "details": {
                "error": error,
                "status": "processing_failed",
                "fallback_actions": ["human_intervention", "manual_dispatch"]
            }
        }

# Create global enhanced coordinator instance
enhanced_emergency_coordinator = EnhancedEmergencyCoordinator() 