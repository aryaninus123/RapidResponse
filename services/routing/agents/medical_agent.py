from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from ..dispatch_engine import EmergencyHandler, MCPRequest, MCPResponse

logger = logging.getLogger(__name__)

class MedicalEmergencyAgent(EmergencyHandler):
    """Specialized agent for medical emergency handling"""
    
    def __init__(self):
        super().__init__("medical_emergency_agent")
        self.response_protocols = {
            "cardiac_arrest": {
                "priority": "CRITICAL",
                "response_time": 2,  # minutes
                "units_required": 2,
                "equipment": ["aed", "advanced_life_support", "cardiac_monitor"]
            },
            "severe_trauma": {
                "priority": "HIGH", 
                "response_time": 3,
                "units_required": 2,
                "equipment": ["trauma_kit", "spine_board", "helicopter_possible"]
            },
            "respiratory_distress": {
                "priority": "HIGH",
                "response_time": 3,
                "units_required": 1,
                "equipment": ["oxygen", "nebulizer", "intubation_kit"]
            },
            "stroke": {
                "priority": "HIGH",
                "response_time": 2,
                "units_required": 1,
                "equipment": ["stroke_kit", "blood_glucose", "cardiac_monitor"]
            },
            "overdose": {
                "priority": "HIGH",
                "response_time": 3,
                "units_required": 1,
                "equipment": ["narcan", "iv_kit", "cardiac_monitor"]
            },
            "general_medical": {
                "priority": "MEDIUM",
                "response_time": 5,
                "units_required": 1,
                "equipment": ["basic_life_support", "transport_equipment"]
            }
        }
        
        # Time-sensitive conditions
        self.time_critical = {
            "cardiac_arrest": {"golden_time": 4, "survival_drop_per_minute": 10},
            "stroke": {"golden_time": 60, "treatment_window": 180},  # minutes
            "severe_trauma": {"golden_time": 60, "trauma_center_time": 20}
        }
    
    async def process(self, request: MCPRequest) -> MCPResponse:
        """Process medical emergency with specialized protocols"""
        try:
            start_time = datetime.now()
            
            # Analyze medical emergency details
            medical_analysis = await self._analyze_medical_emergency(request)
            
            # Determine response protocol
            protocol = self._select_response_protocol(medical_analysis)
            
            # Calculate medical response strategy
            response_strategy = await self._build_medical_response_strategy(
                request, medical_analysis, protocol
            )
            
            # Find optimal hospital destination
            hospital_recommendation = await self._recommend_hospital(
                request.context.location, medical_analysis
            )
            
            # Build specialized response
            response_data = {
                "status": "medical_response_initiated",
                "medical_condition": medical_analysis["condition_type"],
                "severity": medical_analysis["severity"],
                "time_critical": medical_analysis.get("time_critical", False),
                "response_protocol": protocol,
                "response_strategy": response_strategy,
                "estimated_response_time": protocol["response_time"],
                "units_dispatched": protocol["units_required"],
                "equipment_deployed": protocol["equipment"],
                "hospital_destination": hospital_recommendation,
                "patient_assessment": medical_analysis.get("patient_status", {}),
                "treatment_priorities": medical_analysis.get("treatment_priorities", []),
                "next_actions": [
                    "dispatch_ems_units",
                    "notify_receiving_hospital",
                    "establish_patient_contact",
                    "prepare_advanced_care" if protocol["priority"] in ["CRITICAL", "HIGH"] else "prepare_basic_care"
                ]
            }
            
            return MCPResponse(
                context=request.context,
                handler_id=self.handler_id,
                response_data=response_data,
                confidence=medical_analysis["confidence"],
                processing_time=(datetime.now() - start_time).total_seconds(),
                next_actions=response_data["next_actions"]
            )
            
        except Exception as e:
            logger.error(f"Medical agent processing failed: {e}")
            raise
    
    async def _analyze_medical_emergency(self, request: MCPRequest) -> Dict[str, Any]:
        """Analyze medical emergency characteristics"""
        raw_text = request.raw_input.lower()
        location = request.context.location
        context_data = request.processed_data.get("context", {})
        
        # Determine condition type from description
        condition_type = "general_medical"  # default
        
        # Check for critical conditions
        if any(word in raw_text for word in ["heart attack", "chest pain", "cardiac", "heart"]):
            condition_type = "cardiac_arrest"
        elif any(word in raw_text for word in ["stroke", "can't speak", "face drooping", "weakness"]):
            condition_type = "stroke"
        elif any(word in raw_text for word in ["overdose", "pills", "drugs", "unconscious"]):
            condition_type = "overdose"
        elif any(word in raw_text for word in ["bleeding", "trauma", "accident", "fall", "broken"]):
            condition_type = "severe_trauma"
        elif any(word in raw_text for word in ["breathing", "asthma", "choking", "airway"]):
            condition_type = "respiratory_distress"
        
        # Assess severity based on keywords and vital signs mentions
        severity = "medium"
        if any(word in raw_text for word in ["unconscious", "not breathing", "severe", "critical"]):
            severity = "critical"
        elif any(word in raw_text for word in ["conscious", "talking", "minor", "stable"]):
            severity = "low"
        
        # Check if time-critical
        time_critical = condition_type in self.time_critical
        
        # Estimate patient status
        patient_status = self._estimate_patient_status(raw_text, condition_type)
        
        # Determine treatment priorities
        treatment_priorities = self._get_treatment_priorities(condition_type, severity)
        
        return {
            "condition_type": condition_type,
            "severity": severity,
            "confidence": 0.80,  # Good confidence for medical classification
            "time_critical": time_critical,
            "patient_status": patient_status,
            "treatment_priorities": treatment_priorities,
            "golden_time": self.time_critical.get(condition_type, {}).get("golden_time"),
            "additional_resources_needed": self._assess_additional_resources(condition_type, severity)
        }
    
    def _select_response_protocol(self, medical_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Select appropriate medical response protocol"""
        condition_type = medical_analysis["condition_type"]
        severity = medical_analysis["severity"]
        
        protocol = self.response_protocols.get(condition_type, self.response_protocols["general_medical"]).copy()
        
        # Adjust protocol based on severity
        if severity == "critical":
            protocol["response_time"] = max(protocol["response_time"] - 1, 1)
            protocol["units_required"] = min(protocol["units_required"] + 1, 3)
        elif severity == "low":
            protocol["response_time"] = protocol["response_time"] + 2
        
        return protocol
    
    async def _build_medical_response_strategy(
        self, 
        request: MCPRequest, 
        medical_analysis: Dict[str, Any], 
        protocol: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive medical response strategy"""
        condition_type = medical_analysis["condition_type"]
        
        return {
            "primary_objective": self._determine_medical_objective(medical_analysis),
            "treatment_protocol": self._get_treatment_protocol(condition_type),
            "crew_configuration": {
                "paramedic": 1 if protocol["priority"] in ["CRITICAL", "HIGH"] else 0,
                "emt": 1,
                "driver": 1
            },
            "medical_priorities": [
                "airway_management",
                "breathing_support", 
                "circulation_control",
                "disability_prevention",
                "exposure_prevention"
            ],
            "transport_decision": {
                "criteria": "load_and_go" if medical_analysis["time_critical"] else "stay_and_play",
                "destination_type": "trauma_center" if condition_type == "severe_trauma" else "emergency_department"
            },
            "communication_plan": {
                "medical_control": "required" if protocol["priority"] == "CRITICAL" else "optional",
                "hospital_notification": "immediate",
                "family_notification": "coordinate_with_hospital"
            }
        }
    
    async def _recommend_hospital(self, location: Optional[Dict[str, float]], medical_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend optimal hospital based on location and medical condition"""
        if not location:
            return {"status": "location_unknown", "recommendation": "nearest_hospital"}
        
        condition_type = medical_analysis["condition_type"]
        
        # Mock hospital selection - in production, this would query real hospital data
        if condition_type == "stroke":
            return {
                "hospital_name": "Regional Stroke Center",
                "distance": 12.5,  # km
                "eta": 15,  # minutes
                "specialties": ["stroke_center", "neurology", "emergency"],
                "bed_availability": "available",
                "contact": "stroke_coordinator"
            }
        elif condition_type == "cardiac_arrest":
            return {
                "hospital_name": "Cardiac Care Hospital",
                "distance": 8.2,
                "eta": 10,
                "specialties": ["cardiac_cath_lab", "cardiology", "emergency"],
                "bed_availability": "available",
                "contact": "cardiac_team"
            }
        elif condition_type == "severe_trauma":
            return {
                "hospital_name": "Level 1 Trauma Center",
                "distance": 15.0,
                "eta": 18,
                "specialties": ["trauma_surgery", "emergency", "intensive_care"],
                "bed_availability": "available",
                "contact": "trauma_coordinator"
            }
        else:
            return {
                "hospital_name": "General Hospital Emergency",
                "distance": 6.5,
                "eta": 8,
                "specialties": ["emergency", "general_medicine"],
                "bed_availability": "available",
                "contact": "emergency_department"
            }
    
    def _determine_medical_objective(self, medical_analysis: Dict[str, Any]) -> str:
        """Determine primary medical objective"""
        condition_type = medical_analysis["condition_type"]
        severity = medical_analysis["severity"]
        
        if severity == "critical":
            return "immediate_life_support"
        elif medical_analysis["time_critical"]:
            return "rapid_transport_with_treatment"
        elif condition_type == "severe_trauma":
            return "trauma_stabilization"
        else:
            return "assessment_and_stabilization"
    
    def _estimate_patient_status(self, raw_text: str, condition_type: str) -> Dict[str, Any]:
        """Estimate patient status from description"""
        status = {"consciousness": "unknown", "breathing": "unknown", "circulation": "unknown"}
        
        if "unconscious" in raw_text:
            status["consciousness"] = "unconscious"
        elif "conscious" in raw_text or "talking" in raw_text:
            status["consciousness"] = "conscious"
        
        if "not breathing" in raw_text:
            status["breathing"] = "absent"
        elif "difficulty breathing" in raw_text:
            status["breathing"] = "labored"
        
        return status
    
    def _get_treatment_priorities(self, condition_type: str, severity: str) -> List[str]:
        """Get treatment priorities for condition"""
        priorities = {
            "cardiac_arrest": ["cpr", "defibrillation", "advanced_airway", "medications"],
            "stroke": ["neuro_assessment", "blood_glucose", "blood_pressure", "rapid_transport"],
            "severe_trauma": ["hemorrhage_control", "airway", "spine_immobilization", "shock_treatment"],
            "respiratory_distress": ["oxygen", "airway_assessment", "breathing_support", "medication"],
            "overdose": ["airway_protection", "narcan_administration", "cardiac_monitoring", "supportive_care"]
        }
        
        return priorities.get(condition_type, ["assessment", "stabilization", "transport"])
    
    def _get_treatment_protocol(self, condition_type: str) -> Dict[str, Any]:
        """Get specific treatment protocol"""
        protocols = {
            "cardiac_arrest": {
                "algorithm": "acls_cardiac_arrest",
                "medications": ["epinephrine", "amiodarone"],
                "procedures": ["cpr", "defibrillation", "intubation"]
            },
            "stroke": {
                "algorithm": "stroke_assessment",
                "assessments": ["fast_exam", "blood_glucose", "vital_signs"],
                "time_goals": {"scene_time": 10, "transport_time": "minimize"}
            }
        }
        
        return protocols.get(condition_type, {"algorithm": "basic_life_support"})
    
    def _assess_additional_resources(self, condition_type: str, severity: str) -> List[str]:
        """Assess if additional resources are needed"""
        additional = []
        
        if condition_type == "severe_trauma" and severity == "critical":
            additional.extend(["helicopter_ems", "trauma_surgeon"])
        elif condition_type == "cardiac_arrest":
            additional.extend(["additional_als_unit", "supervisor"])
        
        return additional 