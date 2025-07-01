import requests
import json

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8099/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Health check failed: {e}")

def test_simple_text():
    """Test simple text emergency"""
    try:
        data = {
            'text': 'Fire emergency',
            'lat': 40.7128,
            'lon': -74.0060
        }
        response = requests.post("http://localhost:8099/emergency/report", data=data, timeout=10)
        print(f"Text emergency: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        else:
            print(response.text)
    except Exception as e:
        print(f"Text emergency failed: {e}")

if __name__ == "__main__":
    print("Testing health endpoint...")
    test_health()
    
    print("\nTesting text emergency...")
    test_simple_text() 