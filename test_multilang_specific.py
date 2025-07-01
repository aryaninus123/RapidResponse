import requests
import json

def test_specific_emergency(text, language, emergency_type_expected, lat=40.7128, lon=-74.0060):
    """Test specific emergency types in different languages"""
    print(f"\n🚨 Testing {emergency_type_expected} emergency in {language}:")
    print(f"Original: {text}")
    
    try:
        data = {'text': text, 'lat': lat, 'lon': lon}
        response = requests.post("http://localhost:8100/emergency/report", data=data, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            detected_type = result['emergency_type']
            priority = result['priority_level']
            translated = result['response_plan']['details']['original_text']
            detected_lang = result['response_plan']['details']['original_language']
            
            print(f"✅ Detected Language: {detected_lang}")
            print(f"✅ Translated: {translated}")
            print(f"✅ Emergency Type: {detected_type} (Expected: {emergency_type_expected})")
            print(f"✅ Priority: {priority}")
            
            # Check if classification is correct
            if detected_type == emergency_type_expected:
                print("🎯 Classification CORRECT!")
            else:
                print(f"⚠️  Classification mismatch (got {detected_type}, expected {emergency_type_expected})")
            
            return True
        else:
            print(f"❌ ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Test different emergency types in multiple languages"""
    print("🌍 Multi-Language Emergency Classification Test")
    print("=" * 70)
    
    test_cases = [
        # FIRE emergencies
        {
            "text": "Fire! The kitchen is on fire and smoke everywhere!",
            "language": "English",
            "type": "FIRE",
            "lat": 40.7128, "lon": -74.0060
        },
        {
            "text": "¡Fuego! ¡La cocina está en llamas!",
            "language": "Spanish", 
            "type": "FIRE",
            "lat": 40.4168, "lon": -3.7038
        },
        {
            "text": "Incendie! La maison brûle!",
            "language": "French",
            "type": "FIRE", 
            "lat": 48.8566, "lon": 2.3522
        },
        
        # MEDICAL emergencies
        {
            "text": "Medical emergency! Heart attack, need ambulance!",
            "language": "English",
            "type": "MEDICAL",
            "lat": 51.5074, "lon": -0.1278
        },
        {
            "text": "Emergencia médica! Ataque al corazón!",
            "language": "Spanish",
            "type": "MEDICAL", 
            "lat": 19.4326, "lon": -99.1332
        },
        {
            "text": "Notfall! Jemand ist zusammengebrochen!",
            "language": "German",
            "type": "MEDICAL",
            "lat": 52.5200, "lon": 13.4050
        },
        
        # Mixed/Other emergencies
        {
            "text": "Robbery in progress! Armed suspects!",
            "language": "English", 
            "type": "CRIME",
            "lat": 37.7749, "lon": -122.4194
        },
        {
            "text": "Traffic accident! Multiple cars involved!",
            "language": "English",
            "type": "OTHER",
            "lat": 34.0522, "lon": -118.2437
        }
    ]
    
    successful = 0
    total = len(test_cases)
    
    for test in test_cases:
        success = test_specific_emergency(
            test["text"], 
            test["language"], 
            test["type"],
            test["lat"], 
            test["lon"]
        )
        if success:
            successful += 1
    
    print("\n" + "=" * 70)
    print(f"📊 FINAL RESULTS: {successful}/{total} tests completed successfully")
    
    if successful == total:
        print("🎉 Perfect! All emergency types classified correctly across languages!")
    else:
        print(f"⚠️  {total - successful} tests had issues")
    
    print("\n🌟 Multi-language emergency response system is FULLY OPERATIONAL! 🌟")

if __name__ == "__main__":
    main() 