import asyncio
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)

async def test_routing_engine():
    """Test the routing engine with MCP formatting"""
    print("\n🎯 TESTING ROUTING ENGINE WITH MCP")
    print("=" * 50)
    
    try:
        from services.enhanced_coordinator import enhanced_emergency_coordinator
        
        # Test Fire Emergency
        print("\n🔥 Testing Fire Emergency Routing:")
        fire_result = await enhanced_emergency_coordinator.process_emergency(
            text="There's a large fire spreading in the building next to me. I can see smoke and flames.",
            location={"lat": 40.7589, "lon": -73.9851},  # NYC coordinates
            session_id="test_fire_001"
        )
        
        print(f"✅ Handler Used: {fire_result['details']['handler_used']}")
        print(f"✅ Emergency Type: {fire_result['type']}")
        print(f"✅ Priority: {fire_result['priority']}")
        print(f"✅ Agent Confidence: {fire_result['details']['agent_confidence']:.2f}")
        print(f"✅ Processing Time: {fire_result['processing_time']:.2f}s")
        
        # Show enhanced response details
        if 'agent_response' in fire_result['details']:
            agent_response = fire_result['details']['agent_response']
            print(f"✅ Fire Type: {agent_response.get('fire_type', 'N/A')}")
            print(f"✅ Units Dispatched: {agent_response.get('units_dispatched', 'N/A')}")
            print(f"✅ Equipment: {agent_response.get('equipment_deployed', [])}")
        
        print("\n🏥 Testing Medical Emergency Routing:")
        medical_result = await enhanced_emergency_coordinator.process_emergency(
            text="My father is having chest pain and difficulty breathing. He's conscious but in severe pain.",
            location={"lat": 40.7505, "lon": -73.9934},  # NYC coordinates
            session_id="test_medical_001"
        )
        
        print(f"✅ Handler Used: {medical_result['details']['handler_used']}")
        print(f"✅ Emergency Type: {medical_result['type']}")
        print(f"✅ Priority: {medical_result['priority']}")
        print(f"✅ Agent Confidence: {medical_result['details']['agent_confidence']:.2f}")
        print(f"✅ Processing Time: {medical_result['processing_time']:.2f}s")
        
        # Show enhanced response details
        if 'agent_response' in medical_result['details']:
            agent_response = medical_result['details']['agent_response']
            print(f"✅ Medical Condition: {agent_response.get('medical_condition', 'N/A')}")
            print(f"✅ Time Critical: {agent_response.get('time_critical', False)}")
            print(f"✅ Hospital Destination: {agent_response.get('hospital_destination', {}).get('hospital_name', 'N/A')}")
        
        print("\n✅ ROUTING ENGINE TEST COMPLETED")
        return True
        
    except Exception as e:
        print(f"❌ Routing Engine Test Failed: {e}")
        return False

async def test_location_intelligence():
    """Test the location intelligence with Apify API"""
    print("\n📍 TESTING LOCATION INTELLIGENCE")
    print("=" * 50)
    
    try:
        from services.location_intelligence import LocationIntelligence
        import os
        
        # Initialize location intelligence
        apify_token = os.getenv("APIFY_API_TOKEN", "")
        if not apify_token:
            print("⚠️  No Apify token found - using fallback mode")
        
        location_intel = LocationIntelligence(apify_token)
        
        # Test Medical Emergency Location Context
        print("\n🏥 Testing Medical Emergency Facilities:")
        location = {"lat": 40.7589, "lon": -73.9851}  # Times Square, NYC
        
        context = await location_intel.get_emergency_context(
            location=location,
            emergency_type="MEDICAL",
            urgency_level="high"
        )
        
        print(f"✅ Emergency Type: {context.get('emergency_type')}")
        print(f"✅ Urgency Level: {context.get('urgency_level')}")
        print(f"✅ Search Radius: {context.get('context_metadata', {}).get('search_radius_km')}km")
        
        # Show facilities found
        facilities = context.get('facilities', {})
        for facility_type, facility_list in facilities.items():
            print(f"\n📋 {facility_type.upper()} ({len(facility_list)} found):")
            for i, facility in enumerate(facility_list[:3]):  # Show first 3
                print(f"  {i+1}. {facility['name']}")
                print(f"     📍 {facility['address']}")
                print(f"     📏 {facility['distance_km']:.1f}km away ({facility['estimated_time']} min)")
                print(f"     🏥 Capabilities: {', '.join(facility['capabilities'])}")
                print(f"     🕒 Status: {facility['availability_status']}")
        
        # Show resource assessment
        resource_assessment = context.get('resource_assessment', {})
        print(f"\n📊 RESOURCE ASSESSMENT:")
        for facility_type, assessment in resource_assessment.items():
            status = assessment.get('coverage_status', 'unknown')
            available = assessment.get('available_facilities', 0)
            total = assessment.get('total_facilities', 0)
            print(f"  {facility_type}: {available}/{total} available - {status.upper()} coverage")
        
        # Test Fire Emergency Location Context
        print(f"\n🔥 Testing Fire Emergency Facilities:")
        fire_context = await location_intel.get_emergency_context(
            location=location,
            emergency_type="FIRE",
            urgency_level="critical"
        )
        
        fire_facilities = fire_context.get('facilities', {})
        for facility_type, facility_list in fire_facilities.items():
            if facility_list:
                closest = facility_list[0]
                print(f"  Closest {facility_type}: {closest['name']} ({closest['distance_km']:.1f}km)")
        
        print("\n✅ LOCATION INTELLIGENCE TEST COMPLETED")
        return True
        
    except Exception as e:
        print(f"❌ Location Intelligence Test Failed: {e}")
        return False

async def test_integrated_system():
    """Test both systems working together"""
    print("\n🔗 TESTING INTEGRATED SYSTEM")
    print("=" * 50)
    
    try:
        from services.enhanced_coordinator import enhanced_emergency_coordinator
        
        # Test complex emergency with full integration
        print("\n🚨 Testing Complex Emergency (Fire + Medical):")
        complex_result = await enhanced_emergency_coordinator.process_emergency(
            text="There's been an explosion at a chemical plant. Multiple people are injured and there's a large fire spreading. We need immediate help!",
            location={"lat": 40.6892, "lon": -74.0445},  # Statue of Liberty area
            session_id="test_complex_001"
        )
        
        print(f"✅ Handler: {complex_result['details']['handler_used']}")
        print(f"✅ Type: {complex_result['type']} | Priority: {complex_result['priority']}")
        print(f"✅ Processing Time: {complex_result['processing_time']:.2f}s")
        
        # Show location intelligence integration
        location_intelligence = complex_result['details'].get('location_intelligence', {})
        if location_intelligence:
            facilities = location_intelligence.get('facilities', {})
            print(f"\n📍 Location Intelligence Results:")
            for facility_type, facility_list in facilities.items():
                if facility_list:
                    print(f"  {facility_type}: {len(facility_list)} facilities found")
        
        # Show enhanced recommendations
        enhanced_recs = complex_result['details'].get('enhanced_recommendations', {})
        if enhanced_recs:
            print(f"\n🎯 Enhanced Recommendations:")
            for rec_type, rec_data in enhanced_recs.items():
                print(f"  {rec_type}: {rec_data}")
        
        # Show resource optimization
        resource_opt = complex_result['details'].get('resource_optimization', {})
        if resource_opt:
            strategy = resource_opt.get('deployment_strategy', 'standard')
            print(f"\n📊 Resource Optimization: {strategy}")
        
        print("\n✅ INTEGRATED SYSTEM TEST COMPLETED")
        return True
        
    except Exception as e:
        print(f"❌ Integrated System Test Failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 TESTING ENHANCED RAPIDRESPONSE FEATURES")
    print("=" * 60)
    print("Testing new features:")
    print("1. 🎯 Routing Engine with MCP formatting")
    print("2. 📍 Location Intelligence with Apify API")
    print("3. 🔗 Integrated system functionality")
    
    results = []
    
    # Test 1: Routing Engine
    results.append(await test_routing_engine())
    
    # Test 2: Location Intelligence
    results.append(await test_location_intelligence())
    
    # Test 3: Integrated System
    results.append(await test_integrated_system())
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    tests = [
        "🎯 Routing Engine",
        "📍 Location Intelligence", 
        "🔗 Integrated System"
    ]
    
    for i, (test_name, result) in enumerate(zip(tests, results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    overall_success = all(results)
    if overall_success:
        print(f"\n🎉 ALL TESTS PASSED! Enhanced features are working correctly.")
        print(f"\n🔧 System Capabilities:")
        print(f"   • MCP-formatted emergency routing")
        print(f"   • Specialized fire and medical agents")
        print(f"   • Real-world facility discovery via Apify")
        print(f"   • Intelligent resource optimization")
        print(f"   • Enhanced emergency recommendations")
    else:
        print(f"\n⚠️  Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main()) 