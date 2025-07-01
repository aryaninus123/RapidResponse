import requests
import json

def test_emergency_in_language(text, language_name, lat=40.7128, lon=-74.0060):
    """Test emergency reporting in different languages"""
    print(f"\n🌍 Testing {language_name} emergency report:")
    print(f"Original text: {text}")
    
    try:
        data = {
            'text': text,
            'lat': lat,
            'lon': lon
        }
        
        response = requests.post("http://localhost:8100/emergency/report", data=data, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS! Emergency processed successfully")
            print(f"Emergency Type: {result['emergency_type']}")
            print(f"Priority Level: {result['priority_level']}")
            print(f"Translated Text: {result['response_plan']['details']['original_text']}")
            return True
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Test emergency reporting in multiple languages"""
    print("🚨 Testing Multi-Language Emergency Reporting System")
    print("=" * 60)
    
    # Test cases in different languages
    test_cases = [
        {
            "text": "Help! There is a fire in the building and people are trapped!",
            "language": "English",
            "lat": 40.7128,
            "lon": -74.0060
        },
        {
            "text": "¡Ayuda! Hay un incendio en el edificio y hay personas atrapadas!",
            "language": "Spanish", 
            "lat": 40.4168,
            "lon": -3.7038
        },
        {
            "text": "Au secours! Il y a un incendie dans le bâtiment et des gens sont piégés!",
            "language": "French",
            "lat": 48.8566,
            "lon": 2.3522
        },
        {
            "text": "Hilfe! Es gibt einen Brand im Gebäude und Menschen sind eingeschlossen!",
            "language": "German",
            "lat": 52.5200,
            "lon": 13.4050
        },
        {
            "text": "Aiuto! C'è un incendio nell'edificio e ci sono persone intrappolate!",
            "language": "Italian",
            "lat": 41.9028,
            "lon": 12.4964
        },
        {
            "text": "助けて！建物で火事が発生し、人々が閉じ込められています！",
            "language": "Japanese",
            "lat": 35.6762,
            "lon": 139.6503
        },
        {
            "text": "救命！大楼起火，有人被困！",
            "language": "Chinese",
            "lat": 39.9042,
            "lon": 116.4074
        }
    ]
    
    successful_tests = 0
    total_tests = len(test_cases)
    
    for test_case in test_cases:
        success = test_emergency_in_language(
            test_case["text"],
            test_case["language"],
            test_case["lat"],
            test_case["lon"]
        )
        if success:
            successful_tests += 1
    
    print("\n" + "=" * 60)
    print(f"📊 RESULTS: {successful_tests}/{total_tests} languages tested successfully")
    
    if successful_tests == total_tests:
        print("🎉 All languages processed successfully!")
    else:
        print(f"⚠️  {total_tests - successful_tests} languages had issues")

if __name__ == "__main__":
    main() 