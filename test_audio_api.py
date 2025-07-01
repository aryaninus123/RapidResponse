import requests
import json

def test_audio_emergency_report():
    """Test the audio-based emergency reporting endpoint"""
    
    url = "http://localhost:8099/emergency/report"
    
    # Prepare the files and data
    files = {
        'audio': ('test_emergency_audio.wav', open('test_emergency_audio.wav', 'rb'), 'audio/wav')
    }
    
    data = {
        'lat': 40.7128,
        'lon': -74.0060
    }
    
    try:
        print("Sending audio-based emergency report...")
        response = requests.post(url, files=files, data=data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Audio emergency report processed successfully.")
            print("\nResponse:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    finally:
        # Close the file
        if 'audio' in files:
            files['audio'][1].close()

if __name__ == "__main__":
    test_audio_emergency_report() 