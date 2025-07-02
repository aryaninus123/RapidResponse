# 🚀 Enhanced RapidResponse Features

This document describes the two major new features added to the RapidResponse emergency system:

1. **🎯 Routing Engine**: Central dispatcher with MCP formatting and modular agent handlers
2. **📍 Location Intelligence**: Apify-powered real-world emergency facility context

## 🎯 Routing Engine

### Overview
The Routing Engine is a central dispatcher that formats emergency data into **Model Context Protocol (MCP)** format and routes requests to specialized emergency agent handlers based on emergency type and priority.

### Key Components

#### 1. **MCP Data Structures**
```python
@dataclass
class MCPContext:
    session_id: str
    timestamp: str
    emergency_id: str
    location: Optional[Dict[str, float]]
    user_context: Optional[Dict[str, Any]]
    system_context: Optional[Dict[str, Any]]

@dataclass
class MCPRequest:
    context: MCPContext
    emergency_type: str
    priority: str
    raw_input: str
    processed_data: Dict[str, Any]
    routing_metadata: Dict[str, Any]

@dataclass
class MCPResponse:
    context: MCPContext
    handler_id: str
    response_data: Dict[str, Any]
    confidence: float
    processing_time: float
    next_actions: List[str]
```

#### 2. **Specialized Agent Handlers**

##### 🔥 **Fire Emergency Agent**
- **Handler ID**: `fire_emergency_agent`
- **Specialties**: Structure fires, wildfires, vehicle fires, gas leaks, hazmat
- **Capabilities**:
  - Fire type classification (structure, wildfire, vehicle, gas leak)
  - Severity assessment based on keywords and weather conditions
  - Evacuation need determination
  - Safety perimeter calculation
  - Water source identification
  - Equipment deployment planning

**Example Response**:
```json
{
  "status": "fire_response_initiated",
  "fire_type": "structure_fire",
  "severity": "high",
  "units_dispatched": 5,
  "equipment_deployed": ["fire_truck", "ladder_truck", "ambulance"],
  "safety_perimeter": 200,
  "evacuation_needed": true,
  "next_actions": ["dispatch_fire_units", "establish_command_post", "coordinate_evacuation"]
}
```

##### 🏥 **Medical Emergency Agent**
- **Handler ID**: `medical_emergency_agent`
- **Specialties**: Cardiac arrest, trauma, stroke, overdose, respiratory distress
- **Capabilities**:
  - Medical condition classification
  - Time-critical assessment (golden hour protocols)
  - Hospital recommendation based on condition
  - Treatment priority determination
  - Resource allocation optimization

**Example Response**:
```json
{
  "status": "medical_response_initiated",
  "medical_condition": "cardiac_arrest",
  "time_critical": true,
  "hospital_destination": {
    "hospital_name": "Cardiac Care Hospital",
    "distance": 8.2,
    "eta": 10,
    "specialties": ["cardiac_cath_lab", "cardiology"]
  },
  "treatment_priorities": ["cpr", "defibrillation", "advanced_airway"]
}
```

#### 3. **Routing Rules**
```python
routing_rules = {
    "FIRE": ["FIRE"],
    "MEDICAL": ["MEDICAL"],
    "POLICE": ["fallback"],
    "TRAFFIC": ["MEDICAL", "fallback"],
    "NATURAL_DISASTER": ["FIRE", "MEDICAL", "fallback"],
    "OTHER": ["fallback"],
    "fallback": ["MEDICAL", "FIRE"]
}
```

### Usage Example
```python
from services.routing.dispatch_engine import dispatch_engine

# Dispatch emergency through routing engine
emergency_data = {
    "type": "FIRE",
    "priority": "HIGH",
    "text": "Large building fire with people trapped",
    "location": {"lat": 40.7589, "lon": -73.9851}
}

mcp_response = await dispatch_engine.dispatch(emergency_data)
print(f"Handler: {mcp_response.handler_id}")
print(f"Confidence: {mcp_response.confidence}")
```

---

## 📍 Location Intelligence

### Overview
Location Intelligence uses the **Apify API** to fetch real-world emergency facility data, providing context about nearby hospitals, fire stations, police stations, and other critical infrastructure.

### Key Features

#### 1. **Real-World Facility Discovery**
- **Data Source**: Apify Google Maps Scraper
- **Search Radius**: 25km configurable radius
- **Facility Types**: Hospitals, fire stations, police stations, pharmacies, urgent care
- **Real-Time Data**: Live facility information including hours, contact details, specialties

#### 2. **Intelligent Facility Ranking**
```python
def ranking_score(facility):
    score = 0
    # Distance factor (40% weight)
    distance_score = max(0, 25 - facility.distance_km) / 25
    score += distance_score * 0.4
    
    # Availability factor (30% weight)
    if facility.availability_status == "available_24_7":
        score += 0.3
    
    # Capability factor (30% weight)
    capability_bonus = len(facility.capabilities) * 0.1
    score += min(capability_bonus, 0.3)
    
    return score
```

#### 3. **Emergency Facility Data Structure**
```python
@dataclass
class EmergencyFacility:
    id: str
    name: str
    facility_type: str  # hospital, fire_station, police_station
    address: str
    coordinates: Dict[str, float]
    distance_km: float
    estimated_time: int  # minutes for emergency vehicles
    capabilities: List[str]
    availability_status: str
    contact_info: Dict[str, str]
    specialties: List[str]
```

#### 4. **Capability Detection**
The system automatically detects facility capabilities from descriptions:

**Hospital Capabilities**:
- `emergency_department`: Emergency/ER/Trauma keywords
- `intensive_care`: ICU/Intensive/Critical care keywords  
- `cardiac_care`: Cardiac/Heart/Cardiology keywords
- `trauma_center`: Trauma/Level 1 keywords
- `stroke_center`: Stroke/Neurology keywords

**Fire Station Capabilities**:
- `structure_fire`: Structure/Building keywords
- `wildfire`: Wildfire/Forest/Brush keywords
- `hazmat`: Hazmat/Hazardous/Chemical keywords
- `rescue`: Rescue/Technical rescue keywords

### Usage Example
```python
from services.location_intelligence import LocationIntelligence

# Initialize with Apify token
location_intel = LocationIntelligence(apify_token)

# Get emergency context
context = await location_intel.get_emergency_context(
    location={"lat": 40.7589, "lon": -73.9851},
    emergency_type="MEDICAL",
    urgency_level="high"
)

# Access facilities
hospitals = context['facilities']['hospitals']
for hospital in hospitals[:3]:
    print(f"{hospital['name']} - {hospital['distance_km']}km")
    print(f"Capabilities: {hospital['capabilities']}")
```

---

## 🔗 Enhanced Emergency Coordinator

### Integration
The Enhanced Emergency Coordinator combines both features into a unified processing pipeline:

```python
from services.enhanced_coordinator import enhanced_emergency_coordinator

# Process emergency with full enhancement
result = await enhanced_emergency_coordinator.process_emergency(
    text="Building fire with people trapped",
    location={"lat": 40.7589, "lon": -73.9851},
    session_id="emergency_001"
)

# Access enhanced data
handler_used = result['details']['handler_used']
location_intelligence = result['details']['location_intelligence']
enhanced_recommendations = result['details']['enhanced_recommendations']
```

### Processing Pipeline
1. **Audio/Text Processing**: Convert audio to text, handle translation
2. **Emergency Classification**: Determine emergency type and priority
3. **Location Intelligence**: Fetch real-world facility context
4. **MCP Routing**: Route to specialized agent handler
5. **Response Enhancement**: Combine agent response with location data
6. **Resource Optimization**: Optimize resource allocation
7. **Enhanced Notifications**: Send comprehensive notifications

---

## 🧪 Testing

### Run Feature Tests
```bash
python test_enhanced_features.py
```

### Test Coverage
- **Routing Engine**: Fire and medical emergency routing with MCP formatting
- **Location Intelligence**: Facility discovery and ranking for multiple emergency types
- **Integration**: End-to-end processing with both systems

### Expected Output
```
🚀 TESTING ENHANCED RAPIDRESPONSE FEATURES
============================================================

🎯 TESTING ROUTING ENGINE WITH MCP
🔥 Testing Fire Emergency Routing:
✅ Handler Used: fire_emergency_agent
✅ Emergency Type: FIRE
✅ Priority: HIGH
✅ Agent Confidence: 0.85
✅ Fire Type: structure_fire
✅ Units Dispatched: 5

📍 TESTING LOCATION INTELLIGENCE
🏥 Testing Medical Emergency Facilities:
✅ Emergency Type: MEDICAL
📋 HOSPITALS (3 found):
  1. NewYork-Presbyterian Hospital
     📍 525 E 68th St, New York, NY
     📏 2.1km away (3 min)

🔗 TESTING INTEGRATED SYSTEM
✅ Handler: fire_emergency_agent
📍 Location Intelligence Results:
  hospitals: 3 facilities found
  fire_stations: 2 facilities found
```

---

## 📋 Configuration

### Environment Variables
```bash
# Required for Location Intelligence
APIFY_API_TOKEN=your_apify_token_here

# Optional Redis for caching
REDIS_URL=redis://localhost:6379
```

### Customization

#### Adding New Agent Handlers
```python
from services.routing.dispatch_engine import EmergencyHandler, dispatch_engine

class PoliceEmergencyAgent(EmergencyHandler):
    def __init__(self):
        super().__init__("police_emergency_agent")
    
    async def process(self, request: MCPRequest) -> MCPResponse:
        # Implement police-specific logic
        pass

# Register the agent
police_agent = PoliceEmergencyAgent()
dispatch_engine.register_handler("POLICE", police_agent)
```

#### Extending Location Intelligence
```python
# Add custom facility types
location_intel.actors["veterinary"] = "lukaskrivka/google-maps-scraper"

# Add custom search queries
def _get_search_query(self, facility_type: str) -> str:
    queries = {
        "veterinary": "veterinary emergency animal hospital",
        # ... existing queries
    }
    return queries.get(facility_type, facility_type)
```

---

## 🎯 Benefits

### Routing Engine Benefits
- **Standardized Processing**: MCP format ensures consistent data structure
- **Specialized Responses**: Each emergency type gets expert-level handling
- **Scalable Architecture**: Easy to add new agent handlers
- **Session Management**: Context continuity across interactions
- **Confidence Scoring**: Quality assessment of responses

### Location Intelligence Benefits
- **Real-World Data**: Live facility information via Apify API
- **Smart Ranking**: Distance, availability, and capability-based scoring
- **Comprehensive Coverage**: Multiple facility types for different emergencies
- **Resource Assessment**: Evaluation of area emergency preparedness
- **Optimal Routing**: Best path recommendations to facilities

### Combined System Benefits
- **Enhanced Decision Making**: Agent expertise + real-world context
- **Resource Optimization**: Intelligent allocation based on availability
- **Improved Response Times**: Direct routing to optimal facilities
- **Comprehensive Situational Awareness**: Full emergency context picture
- **Scalable Intelligence**: Modular design for easy expansion

---

## 🔧 Technical Architecture

```
Enhanced Emergency Coordinator
├── Input Processing (Audio/Text/Translation)
├── Emergency Classification
├── Location Intelligence
│   ├── Apify API Integration
│   ├── Facility Discovery
│   ├── Capability Detection
│   └── Resource Assessment
├── Routing Engine
│   ├── MCP Formatting
│   ├── Agent Selection
│   ├── Specialized Processing
│   └── Response Generation
├── Response Enhancement
│   ├── Intelligence Integration
│   ├── Recommendation Generation
│   └── Resource Optimization
└── Enhanced Notifications
```

This enhanced system transforms RapidResponse from a basic emergency processor into an intelligent, context-aware emergency response platform that combines AI-driven decision making with real-world situational awareness. 