from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from ..dispatch_engine import EmergencyHandler, MCPRequest, MCPResponse

logger = logging.getLogger(__name__)

class FireEmergencyAgent(EmergencyHandler):
    """Specialized agent for fire emergency handling"""
    
    def __init__(self):
        super().__init__("fire_emergency_agent")
        self.response_protocols = {
            "structure_fire": {
                "units_required": 3,
                "response_time": 4,  # minutes
                "equipment": ["fire_truck", "ladder_truck", "ambulance"]
            },
            "wildfire": {
                "units_required": 5,
                "response_time": 6,
                "equipment": ["fire_truck", "tanker", "helicopter"]
            },
            "vehicle_fire": {
                "units_required": 2,
                "response_time": 3,
                "equipment": ["fire_truck", "foam_unit"]
            },
            "gas_leak": {
                "units_required": 2,
                "response_time": 5,
                "equipment": ["hazmat_unit", "fire_truck"]
            }
        }
    
    async def process(self, request: MCPRequest) -> MCPResponse:
        """Process fire emergency with specialized protocols"""
        try:
            start_time = datetime.now()
            
            # Analyze fire emergency details
            fire_analysis = await self._analyze_fire_emergency(request)
            
            # Determine response protocol
            protocol = self._select_response_protocol(fire_analysis)
            
            # Calculate response strategy
            response_strategy = await self._build_response_strategy(
                request, fire_analysis, protocol
            )
            
            # Build specialized response
            response_data = {
                "status": "fire_response_initiated",
                "fire_type": fire_analysis["fire_type"],
                "severity": fire_analysis["severity"], 
                "response_protocol": protocol,
                "response_strategy": response_strategy,
                "estimated_response_time": protocol["response_time"],
                "units_dispatched": protocol["units_required"],
                "equipment_deployed": protocol["equipment"],
                "safety_perimeter": fire_analysis.get("safety_perimeter", 100),
                "evacuation_needed": fire_analysis.get("evacuation_needed", False),
                "water_sources": fire_analysis.get("nearby_water_sources", []),
                "weather_impact": fire_analysis.get("weather_conditions", {}),
                "next_actions": [
                    "dispatch_fire_units",
                    "establish_command_post", 
                    "assess_water_supply",
                    "coordinate_evacuation" if fire_analysis.get("evacuation_needed") else "secure_perimeter"
                ]
            }
            
            return MCPResponse(
                context=request.context,
                handler_id=self.handler_id,
                response_data=response_data,
                confidence=fire_analysis["confidence"],
                processing_time=(datetime.now() - start_time).total_seconds(),
                next_actions=response_data["next_actions"]
            )
            
        except Exception as e:
            logger.error(f"Fire agent processing failed: {e}")
            raise
    
    async def _analyze_fire_emergency(self, request: MCPRequest) -> Dict[str, Any]:
        """Analyze fire emergency characteristics"""
        raw_text = request.raw_input.lower()
        location = request.context.location
        context_data = request.processed_data.get("context", {})
        
        # Determine fire type from description
        fire_type = "structure_fire"  # default
        if any(word in raw_text for word in ["forest", "grass", "wildfire", "brush"]):
            fire_type = "wildfire"
        elif any(word in raw_text for word in ["car", "vehicle", "truck", "auto"]):
            fire_type = "vehicle_fire" 
        elif any(word in raw_text for word in ["gas", "propane", "leak", "explosion"]):
            fire_type = "gas_leak"
        
        # Assess severity based on keywords
        severity = "medium"
        if any(word in raw_text for word in ["explosion", "spreading", "multiple", "large"]):
            severity = "high"
        elif any(word in raw_text for word in ["small", "contained", "minor"]):
            severity = "low"
        
        # Check weather conditions impact
        weather_conditions = context_data.get("weather", {})
        wind_speed = weather_conditions.get("wind_speed", 0)
        
        # Determine if evacuation is needed
        evacuation_needed = (
            severity == "high" or 
            fire_type == "wildfire" or
            wind_speed > 20
        )
        
        # Safety perimeter based on fire type and severity
        safety_perimeter = {
            "structure_fire": {"low": 50, "medium": 100, "high": 200},
            "wildfire": {"low": 200, "medium": 500, "high": 1000},
            "vehicle_fire": {"low": 30, "medium": 50, "high": 100},
            "gas_leak": {"low": 100, "medium": 300, "high": 500}
        }.get(fire_type, {}).get(severity, 100)
        
        return {
            "fire_type": fire_type,
            "severity": severity,
            "confidence": 0.85,  # High confidence for fire classification
            "evacuation_needed": evacuation_needed,
            "safety_perimeter": safety_perimeter,
            "weather_conditions": weather_conditions,
            "nearby_water_sources": self._find_water_sources(location),
            "access_routes": self._assess_access_routes(location)
        }
    
    def _select_response_protocol(self, fire_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Select appropriate response protocol based on fire analysis"""
        fire_type = fire_analysis["fire_type"]
        severity = fire_analysis["severity"]
        
        protocol = self.response_protocols.get(fire_type, self.response_protocols["structure_fire"]).copy()
        
        # Adjust protocol based on severity
        if severity == "high":
            protocol["units_required"] = min(protocol["units_required"] + 2, 8)
            protocol["response_time"] = max(protocol["response_time"] - 1, 2)
        elif severity == "low":
            protocol["units_required"] = max(protocol["units_required"] - 1, 1)
        
        return protocol
    
    async def _build_response_strategy(
        self, 
        request: MCPRequest, 
        fire_analysis: Dict[str, Any], 
        protocol: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive response strategy"""
        return {
            "primary_objective": self._determine_primary_objective(fire_analysis),
            "command_structure": "incident_command_system",
            "resource_allocation": {
                "suppression": protocol["units_required"] - 1,
                "rescue": 1 if fire_analysis["severity"] != "low" else 0,
                "medical": 1,
                "support": 1
            },
            "tactical_priorities": [
                "life_safety",
                "incident_stabilization", 
                "property_conservation",
                "environmental_protection"
            ],
            "communication_plan": {
                "command_frequency": "fire_command_1",
                "tactical_frequency": "fire_tac_1",
                "emergency_medical": "ems_dispatch"
            }
        }
    
    def _determine_primary_objective(self, fire_analysis: Dict[str, Any]) -> str:
        """Determine primary tactical objective"""
        if fire_analysis["evacuation_needed"]:
            return "life_safety_evacuation"
        elif fire_analysis["fire_type"] == "gas_leak":
            return "hazmat_mitigation"
        elif fire_analysis["severity"] == "high":
            return "defensive_suppression"
        else:
            return "offensive_suppression"
    
    def _find_water_sources(self, location: Optional[Dict[str, float]]) -> List[Dict[str, Any]]:
        """Find nearby water sources for firefighting"""
        if not location:
            return []
        
        # Mock water sources - in production, this would query real GIS data
        return [
            {
                "type": "fire_hydrant",
                "distance": 0.2,  # km
                "flow_rate": 1000,  # GPM
                "status": "active"
            },
            {
                "type": "water_tank",
                "distance": 0.5,
                "capacity": 50000,  # gallons
                "status": "available"
            }
        ]
    
    def _assess_access_routes(self, location: Optional[Dict[str, float]]) -> Dict[str, Any]:
        """Assess vehicle access routes to emergency location"""
        if not location:
            return {"status": "unknown"}
        
        return {
            "status": "accessible",
            "primary_route": "clear",
            "alternate_routes": 2,
            "restrictions": [],
            "ladder_truck_access": True
        } 