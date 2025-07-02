from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)

class EmergencyType(Enum):
    FIRE = "FIRE"
    MEDICAL = "MEDICAL"
    POLICE = "POLICE"
    NATURAL_DISASTER = "NATURAL_DISASTER"
    TRAFFIC = "TRAFFIC"
    OTHER = "OTHER"

class Priority(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@dataclass
class MCPContext:
    """Model Context Protocol data structure"""
    session_id: str
    timestamp: str
    emergency_id: str
    location: Optional[Dict[str, float]] = None
    user_context: Optional[Dict[str, Any]] = None
    system_context: Optional[Dict[str, Any]] = None

@dataclass
class MCPRequest:
    """Standardized MCP request format"""
    context: MCPContext
    emergency_type: str
    priority: str
    raw_input: str
    processed_data: Dict[str, Any]
    routing_metadata: Dict[str, Any]

@dataclass
class MCPResponse:
    """Standardized MCP response format"""
    context: MCPContext
    handler_id: str
    response_data: Dict[str, Any]
    confidence: float
    processing_time: float
    next_actions: List[str]

class EmergencyHandler:
    """Base class for emergency type handlers"""
    
    def __init__(self, handler_id: str):
        self.handler_id = handler_id
    
    async def process(self, request: MCPRequest) -> MCPResponse:
        """Process emergency request - to be implemented by subclasses"""
        raise NotImplementedError
    
    async def validate_request(self, request: MCPRequest) -> bool:
        """Validate if this handler can process the request"""
        return True

class DispatchEngine:
    """Central routing engine with MCP formatting"""
    
    def __init__(self):
        self.handlers: Dict[str, EmergencyHandler] = {}
        self.routing_rules: Dict[str, List[str]] = {}
        self.session_cache: Dict[str, Dict] = {}
        
    def register_handler(self, emergency_type: str, handler: EmergencyHandler):
        """Register a modular agent handler for an emergency type"""
        if emergency_type not in self.handlers:
            self.handlers[emergency_type] = []
        self.handlers[emergency_type] = handler
        logger.info(f"Registered handler {handler.handler_id} for {emergency_type}")
    
    def set_routing_rules(self, rules: Dict[str, List[str]]):
        """Set routing rules for emergency types"""
        self.routing_rules = rules
        
    async def dispatch(
        self,
        emergency_data: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> MCPResponse:
        """
        Central dispatch method with MCP formatting
        
        Args:
            emergency_data: Raw emergency data
            session_id: Optional session identifier
            
        Returns:
            MCPResponse with processed results
        """
        start_time = datetime.now()
        
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Create MCP context
        context = MCPContext(
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            emergency_id=emergency_data.get("emergency_id", str(uuid.uuid4())),
            location=emergency_data.get("location"),
            user_context=emergency_data.get("user_context", {}),
            system_context=self._build_system_context(emergency_data)
        )
        
        # Format request into MCP structure
        mcp_request = MCPRequest(
            context=context,
            emergency_type=emergency_data.get("type", "OTHER"),
            priority=emergency_data.get("priority", "MEDIUM"),
            raw_input=emergency_data.get("text", ""),
            processed_data=emergency_data.get("details", {}),
            routing_metadata=self._build_routing_metadata(emergency_data)
        )
        
        # Route to appropriate handler
        handler = self._select_handler(mcp_request)
        
        if not handler:
            # Fallback to generic handler
            return self._create_fallback_response(mcp_request, start_time)
        
        # Process through selected handler
        try:
            response = await handler.process(mcp_request)
            
            # Add processing metadata
            response.processing_time = (datetime.now() - start_time).total_seconds()
            
            # Cache session data
            self._cache_session_data(session_id, mcp_request, response)
            
            return response
            
        except Exception as e:
            logger.error(f"Handler {handler.handler_id} failed: {e}")
            return self._create_error_response(mcp_request, str(e), start_time)
    
    def _select_handler(self, request: MCPRequest) -> Optional[EmergencyHandler]:
        """Select appropriate handler based on emergency type and routing rules"""
        emergency_type = request.emergency_type
        
        # Get handler for emergency type
        handler = self.handlers.get(emergency_type)
        
        if handler:
            return handler
        
        # Try fallback handlers
        fallback_handlers = self.routing_rules.get("fallback", [])
        for handler_type in fallback_handlers:
            handler = self.handlers.get(handler_type)
            if handler:
                return handler
        
        return None
    
    def _build_system_context(self, emergency_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build system context for MCP"""
        return {
            "timestamp": datetime.now().isoformat(),
            "system_version": "1.0.0",
            "available_services": list(self.handlers.keys()),
            "routing_rules": self.routing_rules,
            "location_services": emergency_data.get("context", {}).get("location_services", [])
        }
    
    def _build_routing_metadata(self, emergency_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build routing metadata for decision making"""
        return {
            "confidence": emergency_data.get("confidence", 0.0),
            "source": emergency_data.get("source", "unknown"),
            "language": emergency_data.get("language", "en"),
            "requires_translation": emergency_data.get("requires_translation", False),
            "location_accuracy": emergency_data.get("location_accuracy", "unknown")
        }
    
    def _cache_session_data(self, session_id: str, request: MCPRequest, response: MCPResponse):
        """Cache session data for context continuity"""
        self.session_cache[session_id] = {
            "last_request": asdict(request),
            "last_response": asdict(response),
            "timestamp": datetime.now().isoformat()
        }
    
    def _create_fallback_response(self, request: MCPRequest, start_time: datetime) -> MCPResponse:
        """Create fallback response when no handler is available"""
        return MCPResponse(
            context=request.context,
            handler_id="fallback",
            response_data={
                "status": "processed",
                "message": "Emergency received and logged. Generic response activated.",
                "emergency_type": request.emergency_type,
                "priority": request.priority,
                "actions": ["log_emergency", "notify_dispatch", "await_human_intervention"]
            },
            confidence=0.5,
            processing_time=(datetime.now() - start_time).total_seconds(),
            next_actions=["human_verification", "manual_dispatch"]
        )
    
    def _create_error_response(self, request: MCPRequest, error: str, start_time: datetime) -> MCPResponse:
        """Create error response"""
        return MCPResponse(
            context=request.context,
            handler_id="error",
            response_data={
                "status": "error",
                "error": error,
                "emergency_type": request.emergency_type,
                "priority": request.priority
            },
            confidence=0.0,
            processing_time=(datetime.now() - start_time).total_seconds(),
            next_actions=["error_logging", "human_intervention"]
        )

# Global dispatch engine instance
dispatch_engine = DispatchEngine() 