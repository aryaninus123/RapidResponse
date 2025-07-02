from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncio
import logging
import math
import json
from apify_client import ApifyClient

logger = logging.getLogger(__name__)

@dataclass
class EmergencyFacility:
    """Structured emergency facility data"""
    id: str
    name: str
    facility_type: str  # hospital, fire_station, police_station
    address: str
    coordinates: Dict[str, float]
    distance_km: float
    estimated_time: int  # minutes
    capabilities: List[str]
    availability_status: str
    contact_info: Dict[str, str]
    specialties: List[str] = None
    
class LocationIntelligence:
    """Enhanced location intelligence with real emergency facility data"""
    
    def __init__(self, apify_token: str):
        self.client = ApifyClient(apify_token)
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = 3600  # 1 hour
        
        # Actor IDs for different data sources
        self.actors = {
            "hospitals": "lukaskrivka/google-maps-scraper",
            "fire_stations": "lukaskrivka/google-maps-scraper", 
            "police_stations": "lukaskrivka/google-maps-scraper",
            "pharmacies": "lukaskrivka/google-maps-scraper",
            "urgent_care": "lukaskrivka/google-maps-scraper"
        }
        
        # Search radius in km
        self.search_radius = 25
        
    async def get_emergency_context(
        self, 
        location: Dict[str, float], 
        emergency_type: str,
        urgency_level: str = "medium"
    ) -> Dict[str, Any]:
        """
        Get comprehensive emergency context for a location
        
        Args:
            location: Dict with lat and lon
            emergency_type: Type of emergency (FIRE, MEDICAL, POLICE, etc.)
            urgency_level: Level of urgency (low, medium, high, critical)
            
        Returns:
            Dict containing emergency facilities and context data
        """
        try:
            # Determine which facilities are needed
            required_facilities = self._get_required_facilities(emergency_type)
            
            # Get facilities in parallel
            facility_tasks = []
            for facility_type in required_facilities:
                task = self._get_facilities_by_type(location, facility_type)
                facility_tasks.append(task)
            
            # Execute all facility searches in parallel
            facility_results = await asyncio.gather(*facility_tasks, return_exceptions=True)
            
            # Process results
            emergency_facilities = {}
            for i, result in enumerate(facility_results):
                facility_type = required_facilities[i]
                if isinstance(result, Exception):
                    logger.error(f"Failed to get {facility_type}: {result}")
                    emergency_facilities[facility_type] = []
                else:
                    emergency_facilities[facility_type] = result
            
            # Enhance with additional context
            context = await self._build_emergency_context(
                location, emergency_type, emergency_facilities, urgency_level
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to get emergency context: {e}")
            return self._get_fallback_context(location, emergency_type)
    
    async def _get_facilities_by_type(
        self, 
        location: Dict[str, float], 
        facility_type: str
    ) -> List[EmergencyFacility]:
        """Get facilities of a specific type near the location"""
        cache_key = f"{facility_type}_{location['lat']:.3f}_{location['lon']:.3f}"
        
        # Check cache first
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            return cached_result
        
        try:
            # Prepare search query based on facility type
            search_query = self._get_search_query(facility_type)
            
            # Run Apify actor to search for facilities
            run_input = {
                "searchQuery": search_query,
                "lat": location["lat"],
                "lng": location["lon"],
                "zoom": 13,  # City level zoom
                "maxResults": 10,
                "language": "en",
                "extractContacts": True,
                "extractOpeningHours": True,
                "extractReviews": False  # Skip reviews for speed
            }
            
            # Execute search
            run = self.client.actor(self.actors[facility_type]).call(run_input=run_input)
            
            # Process results
            facilities = []
            items = list(run.iterate_items())
            
            for item in items[:10]:  # Limit to 10 closest
                facility = self._process_facility_data(item, location, facility_type)
                if facility and facility.distance_km <= self.search_radius:
                    facilities.append(facility)
            
            # Sort by distance and relevance
            facilities = self._rank_facilities(facilities, facility_type)
            
            # Cache results
            self._set_in_cache(cache_key, facilities)
            
            return facilities
            
        except Exception as e:
            logger.error(f"Failed to fetch {facility_type}: {e}")
            return self._get_mock_facilities(location, facility_type)
    
    def _get_search_query(self, facility_type: str) -> str:
        """Get appropriate search query for facility type"""
        queries = {
            "hospitals": "hospital emergency room",
            "fire_stations": "fire station fire department",
            "police_stations": "police station police department",
            "pharmacies": "pharmacy 24 hour pharmacy",
            "urgent_care": "urgent care walk-in clinic"
        }
        return queries.get(facility_type, facility_type)
    
    def _process_facility_data(
        self, 
        item: Dict[str, Any], 
        location: Dict[str, float], 
        facility_type: str
    ) -> Optional[EmergencyFacility]:
        """Process raw facility data into structured format"""
        try:
            # Extract coordinates
            if not item.get("location"):
                return None
                
            facility_coords = {
                "lat": item["location"].get("lat"),
                "lon": item["location"].get("lng")
            }
            
            if not facility_coords["lat"] or not facility_coords["lon"]:
                return None
            
            # Calculate distance
            distance = self._calculate_distance(location, facility_coords)
            estimated_time = self._estimate_travel_time(distance)
            
            # Extract facility details
            name = item.get("title", "Unknown Facility")
            address = item.get("address", "Address not available")
            
            # Determine capabilities based on facility type and description
            capabilities = self._determine_capabilities(item, facility_type)
            
            # Extract contact information
            contact_info = {
                "phone": item.get("phone", ""),
                "website": item.get("website", ""),
                "hours": item.get("openingHours", "")
            }
            
            # Determine specialties
            specialties = self._extract_specialties(item, facility_type)
            
            return EmergencyFacility(
                id=item.get("placeId", f"{facility_type}_{hash(name)}"),
                name=name,
                facility_type=facility_type,
                address=address,
                coordinates=facility_coords,
                distance_km=distance,
                estimated_time=estimated_time,
                capabilities=capabilities,
                availability_status=self._assess_availability(item),
                contact_info=contact_info,
                specialties=specialties
            )
            
        except Exception as e:
            logger.error(f"Error processing facility data: {e}")
            return None
    
    def _calculate_distance(self, loc1: Dict[str, float], loc2: Dict[str, float]) -> float:
        """Calculate distance between two coordinates in km"""
        lat1, lon1 = math.radians(loc1["lat"]), math.radians(loc1["lon"])
        lat2, lon2 = math.radians(loc2["lat"]), math.radians(loc2["lon"])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return 6371 * c  # Earth radius in km
    
    def _estimate_travel_time(self, distance_km: float) -> int:
        """Estimate travel time in minutes for emergency vehicles"""
        # Emergency vehicles travel faster than normal traffic
        emergency_speed = 60  # km/h average for emergency vehicles
        return max(1, int((distance_km / emergency_speed) * 60))
    
    def _determine_capabilities(self, item: Dict[str, Any], facility_type: str) -> List[str]:
        """Determine facility capabilities from description"""
        description = (item.get("description", "") + " " + item.get("title", "")).lower()
        
        capabilities_map = {
            "hospitals": {
                "emergency_department": ["emergency", "er", "trauma"],
                "intensive_care": ["icu", "intensive", "critical care"],
                "cardiac_care": ["cardiac", "heart", "cardiology"],
                "trauma_center": ["trauma", "level 1", "level i"],
                "stroke_center": ["stroke", "neurology"],
                "maternity": ["maternity", "obstetrics", "birth"]
            },
            "fire_stations": {
                "structure_fire": ["structure", "building"],
                "wildfire": ["wildfire", "forest", "brush"],
                "hazmat": ["hazmat", "hazardous", "chemical"],
                "rescue": ["rescue", "technical rescue"],
                "medical": ["ems", "ambulance", "medical"]
            },
            "police_stations": {
                "patrol": ["patrol", "response"],
                "detective": ["detective", "investigation"],
                "swat": ["swat", "tactical", "special"],
                "traffic": ["traffic", "highway"]
            }
        }
        
        capabilities = []
        facility_capabilities = capabilities_map.get(facility_type, {})
        
        for capability, keywords in facility_capabilities.items():
            if any(keyword in description for keyword in keywords):
                capabilities.append(capability)
        
        # Default capabilities if none detected
        if not capabilities:
            defaults = {
                "hospitals": ["emergency_department"],
                "fire_stations": ["structure_fire", "medical"],
                "police_stations": ["patrol"]
            }
            capabilities = defaults.get(facility_type, [])
        
        return capabilities
    
    def _extract_specialties(self, item: Dict[str, Any], facility_type: str) -> List[str]:
        """Extract medical specialties or service specialties"""
        description = (item.get("description", "") + " " + item.get("title", "")).lower()
        
        specialty_keywords = {
            "cardiology": ["cardiology", "heart", "cardiac"],
            "neurology": ["neurology", "brain", "stroke", "neuro"],
            "trauma_surgery": ["trauma", "surgery", "surgical"],
            "pediatrics": ["pediatric", "children", "kids"],
            "emergency_medicine": ["emergency", "er", "trauma"],
            "orthopedics": ["orthopedic", "bone", "joint"]
        }
        
        specialties = []
        for specialty, keywords in specialty_keywords.items():
            if any(keyword in description for keyword in keywords):
                specialties.append(specialty)
        
        return specialties
    
    def _assess_availability(self, item: Dict[str, Any]) -> str:
        """Assess facility availability status"""
        # Check if it's currently open
        hours = item.get("openingHours", "")
        if "24" in hours or "always open" in hours.lower():
            return "available_24_7"
        elif "closed" in hours.lower():
            return "closed"
        else:
            return "available"
    
    def _rank_facilities(self, facilities: List[EmergencyFacility], facility_type: str) -> List[EmergencyFacility]:
        """Rank facilities by relevance and distance"""
        def ranking_score(facility: EmergencyFacility) -> float:
            score = 0
            
            # Distance factor (closer is better)
            distance_score = max(0, 25 - facility.distance_km) / 25
            score += distance_score * 0.4
            
            # Availability factor
            if facility.availability_status == "available_24_7":
                score += 0.3
            elif facility.availability_status == "available":
                score += 0.2
            
            # Capability factor
            capability_bonus = len(facility.capabilities) * 0.1
            score += min(capability_bonus, 0.3)
            
            return score
        
        return sorted(facilities, key=ranking_score, reverse=True)
    
    def _get_required_facilities(self, emergency_type: str) -> List[str]:
        """Determine which facility types are needed for emergency type"""
        facility_mapping = {
            "MEDICAL": ["hospitals", "pharmacies", "urgent_care"],
            "FIRE": ["fire_stations", "hospitals"],
            "POLICE": ["police_stations", "hospitals"],
            "TRAFFIC": ["hospitals", "police_stations"],
            "NATURAL_DISASTER": ["hospitals", "fire_stations", "police_stations"],
            "OTHER": ["hospitals", "police_stations"]
        }
        
        return facility_mapping.get(emergency_type, ["hospitals"])
    
    async def _build_emergency_context(
        self,
        location: Dict[str, float],
        emergency_type: str,
        facilities: Dict[str, List[EmergencyFacility]],
        urgency_level: str
    ) -> Dict[str, Any]:
        """Build comprehensive emergency context"""
        return {
            "location": location,
            "emergency_type": emergency_type,
            "urgency_level": urgency_level,
            "facilities": {
                facility_type: [self._facility_to_dict(f) for f in facility_list]
                for facility_type, facility_list in facilities.items()
            },
            "response_recommendations": self._generate_response_recommendations(
                emergency_type, facilities, urgency_level
            ),
            "optimal_routes": self._calculate_optimal_routes(location, facilities),
            "resource_assessment": self._assess_resource_availability(facilities),
            "context_metadata": {
                "search_radius_km": self.search_radius,
                "search_timestamp": datetime.now().isoformat(),
                "data_source": "apify_google_maps"
            }
        }
    
    def _generate_response_recommendations(
        self,
        emergency_type: str,
        facilities: Dict[str, List[EmergencyFacility]],
        urgency_level: str
    ) -> Dict[str, Any]:
        """Generate response recommendations based on available facilities"""
        recommendations = {}
        
        # Primary facility recommendations
        if emergency_type == "MEDICAL":
            hospitals = facilities.get("hospitals", [])
            if hospitals:
                if urgency_level in ["high", "critical"]:
                    # Recommend closest hospital with emergency capabilities
                    trauma_centers = [h for h in hospitals if "trauma_center" in h.capabilities]
                    recommendations["primary_hospital"] = trauma_centers[0] if trauma_centers else hospitals[0]
                else:
                    recommendations["primary_hospital"] = hospitals[0]
        
        return recommendations
    
    def _calculate_optimal_routes(
        self, 
        location: Dict[str, float], 
        facilities: Dict[str, List[EmergencyFacility]]
    ) -> Dict[str, Any]:
        """Calculate optimal routing to facilities"""
        routes = {}
        
        for facility_type, facility_list in facilities.items():
            if facility_list:
                closest = facility_list[0]  # Already sorted by relevance
                routes[f"route_to_{facility_type}"] = {
                    "destination": closest.name,
                    "distance_km": closest.distance_km,
                    "estimated_time_minutes": closest.estimated_time,
                    "coordinates": closest.coordinates
                }
        
        return routes
    
    def _assess_resource_availability(self, facilities: Dict[str, List[EmergencyFacility]]) -> Dict[str, Any]:
        """Assess overall resource availability in the area"""
        assessment = {}
        
        for facility_type, facility_list in facilities.items():
            available_count = len([f for f in facility_list if f.availability_status != "closed"])
            total_count = len(facility_list)
            
            assessment[facility_type] = {
                "total_facilities": total_count,
                "available_facilities": available_count,
                "coverage_status": "good" if available_count >= 2 else "limited" if available_count == 1 else "poor"
            }
        
        return assessment
    
    def _facility_to_dict(self, facility: EmergencyFacility) -> Dict[str, Any]:
        """Convert facility object to dictionary"""
        return {
            "id": facility.id,
            "name": facility.name,
            "facility_type": facility.facility_type,
            "address": facility.address,
            "coordinates": facility.coordinates,
            "distance_km": facility.distance_km,
            "estimated_time": facility.estimated_time,
            "capabilities": facility.capabilities,
            "availability_status": facility.availability_status,
            "contact_info": facility.contact_info,
            "specialties": facility.specialties or []
        }
    
    def _get_from_cache(self, key: str) -> Optional[List[EmergencyFacility]]:
        """Get data from cache if not expired"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if (datetime.now() - timestamp).seconds < self.cache_ttl:
                return data
        return None
    
    def _set_in_cache(self, key: str, data: List[EmergencyFacility]):
        """Set data in cache with timestamp"""
        self.cache[key] = (data, datetime.now())
    
    def _get_fallback_context(self, location: Dict[str, float], emergency_type: str) -> Dict[str, Any]:
        """Get fallback context when API calls fail"""
        return {
            "location": location,
            "emergency_type": emergency_type,
            "facilities": {},
            "status": "fallback_mode",
            "message": "Using fallback emergency context due to data unavailability"
        }
    
    def _get_mock_facilities(self, location: Dict[str, float], facility_type: str) -> List[EmergencyFacility]:
        """Get mock facilities as fallback"""
        mock_facilities = {
            "hospitals": [
                EmergencyFacility(
                    id="mock_hospital_1",
                    name="General Hospital Emergency",
                    facility_type="hospitals",
                    address="123 Hospital Drive",
                    coordinates={"lat": location["lat"] + 0.01, "lon": location["lon"] + 0.01},
                    distance_km=2.5,
                    estimated_time=5,
                    capabilities=["emergency_department"],
                    availability_status="available_24_7",
                    contact_info={"phone": "911", "website": ""},
                    specialties=["emergency_medicine"]
                )
            ],
            "fire_stations": [
                EmergencyFacility(
                    id="mock_fire_1",
                    name="Fire Station 1",
                    facility_type="fire_stations",
                    address="456 Fire Station Road",
                    coordinates={"lat": location["lat"] + 0.005, "lon": location["lon"] - 0.005},
                    distance_km=1.2,
                    estimated_time=3,
                    capabilities=["structure_fire", "medical"],
                    availability_status="available_24_7",
                    contact_info={"phone": "911", "website": ""},
                    specialties=[]
                )
            ]
        }
        
        return mock_facilities.get(facility_type, []) 