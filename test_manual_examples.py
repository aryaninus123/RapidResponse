import requests
import json
import asyncio
from datetime import datetime

# Base URL for your API
BASE_URL = "http://localhost:8000"

def test_fire_emergency():
    """Test a fire emergency through the API"""
    print("\n🔥 TESTING FIRE EMERGENCY")
    print("-" * 30)
    
    data = {
        'text': 'There is a large building fire with smoke coming out of the windows. People might be trapped inside!',
        'lat': 40.7589,  # Times Square, NYC
        'lon': -73.9851
    }
    
    try:
        response = requests.post(f"{BASE_URL}/emergency/report", data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Emergency Type: {result['emergency_type']}")
            print(f"Priority: {result['priority_level']}")
            print(f"Response Plan Keys: {list(result['response_plan'].keys())}")
            
            # Check for enhanced features
            details = result['response_plan'].get('details', {})
            if 'handler_used' in details:
                print(f"🎯 Handler Used: {details['handler_used']}")
                print(f"🤖 Agent Confidence: {details.get('agent_confidence', 'N/A')}")
                
                # Show location intelligence
                location_intel = details.get('location_intelligence', {})
                if location_intel:
                    facilities = location_intel.get('facilities', {})
                    print(f"🏥 Facilities Found: {len(facilities.get('hospitals', []))} hospitals, {len(facilities.get('fire_stations', []))} fire stations")
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_medical_emergency():
    """Test a medical emergency through the API"""
    print("\n🚑 TESTING MEDICAL EMERGENCY")
    print("-" * 30)
    
    data = {
        'text': 'My father is having severe chest pain and trouble breathing. He says his left arm is numb. Please help!',
        'lat': 40.7505,  # Near Empire State Building
        'lon': -73.9934
    }
    
    try:
        response = requests.post(f"{BASE_URL}/emergency/report", data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Emergency Type: {result['emergency_type']}")
            print(f"Priority: {result['priority_level']}")
            
            # Check for enhanced features
            details = result['response_plan'].get('details', {})
            if 'handler_used' in details:
                print(f"🎯 Handler Used: {details['handler_used']}")
                
                # Check agent response
                agent_response = details.get('agent_response', {})
                if agent_response:
                    print(f"🏥 Medical Condition: {agent_response.get('medical_condition', 'N/A')}")
                    print(f"⏱️  Time Critical: {agent_response.get('time_critical', False)}")
                    
                    hospital_dest = agent_response.get('hospital_destination', {})
                    if hospital_dest:
                        print(f"🏨 Recommended Hospital: {hospital_dest.get('hospital_name', 'N/A')}")
                        print(f"📍 Distance: {hospital_dest.get('distance', 'N/A')} km")
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_complex_emergency():
    """Test a complex emergency (explosion with fire and casualties)"""
    print("\n💥 TESTING COMPLEX EMERGENCY")
    print("-" * 30)
    
    data = {
        'text': 'There has been an explosion at a chemical plant! There is a massive fire spreading and multiple people are injured. We need immediate help with fire suppression and medical assistance!',
        'lat': 40.6892,  # Near Statue of Liberty
        'lon': -74.0445
    }
    
    try:
        response = requests.post(f"{BASE_URL}/emergency/report", data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Emergency Type: {result['emergency_type']}")
            print(f"Priority: {result['priority_level']}")
            
            # Show enhanced data
            details = result['response_plan'].get('details', {})
            if details:
                print(f"🎯 Handler: {details.get('handler_used', 'N/A')}")
                
                # Enhanced recommendations
                enhanced_recs = details.get('enhanced_recommendations', {})
                if enhanced_recs:
                    print("🎯 ENHANCED RECOMMENDATIONS:")
                    for rec_type, rec_data in enhanced_recs.items():
                        if isinstance(rec_data, dict) and 'primary' in rec_data:
                            primary = rec_data['primary']
                            print(f"  {rec_type}: {primary.get('name', 'N/A')} ({primary.get('distance_km', 0):.1f}km)")
                
                # Resource optimization
                resource_opt = details.get('resource_optimization', {})
                if resource_opt:
                    strategy = resource_opt.get('deployment_strategy', 'standard')
                    print(f"📊 Deployment Strategy: {strategy}")
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_api_endpoints():
    """Test other API endpoints to see system stats"""
    print("\n📊 TESTING API ENDPOINTS")
    print("-" * 30)
    
    try:
        # Test emergency stats
        stats_response = requests.get(f"{BASE_URL}/emergency/stats")
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print("📈 Emergency Stats:")
            print(f"  Total Emergencies: {stats.get('total_emergencies', 0)}")
            print(f"  Avg Response Time: {stats.get('average_response_time', 0)} min")
            print(f"  Active Emergencies: {stats.get('active_emergencies', 0)}")
        
        # Test service availability
        services_response = requests.get(f"{BASE_URL}/services/availability")
        if services_response.status_code == 200:
            services = services_response.json()
            print("\n🚒 Service Availability:")
            for service_name, service_data in services.items():
                available = service_data.get('available_units', 0)
                total = service_data.get('total_units', 0)
                print(f"  {service_name}: {available}/{total} units available")
        
        # Test emergency history
        history_response = requests.get(f"{BASE_URL}/emergency/history?limit=3")
        if history_response.status_code == 200:
            history = history_response.json()
            print(f"\n📜 Recent Emergencies ({len(history)} shown):")
            for i, emergency in enumerate(history[:3]):
                print(f"  {i+1}. {emergency.get('emergency_type', 'UNKNOWN')} - {emergency.get('priority_level', 'UNKNOWN')} priority")
                
                # Show enhanced context if available
                context_data = emergency.get('context_data', {})
                if context_data and context_data.get('handler_used'):
                    print(f"     🎯 Handler: {context_data['handler_used']} (Confidence: {context_data.get('agent_confidence', 0):.2f})")
                
    except Exception as e:
        print(f"❌ ERROR testing endpoints: {e}")

def main():
    """Run all manual tests"""
    print("🚀 MANUAL TESTING OF ENHANCED RAPIDRESPONSE")
    print("=" * 60)
    print("Make sure your server is running: python main.py")
    print("Testing enhanced features through HTTP API...")
    
    # Test different emergency types
    test_fire_emergency()
    test_medical_emergency() 
    test_complex_emergency()
    
    # Test API endpoints
    test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("✅ MANUAL TESTING COMPLETED")
    print("\n💡 TIPS:")
    print("1. Start the server: python main.py")
    print("2. Open web interface: http://localhost:3000")
    print("3. Run this script: python test_manual_examples.py")
    print("4. Try different emergency scenarios!")

if __name__ == "__main__":
    main() 