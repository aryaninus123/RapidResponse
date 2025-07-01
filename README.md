# RapidRespond Emergency Response System

RapidRespond is a multi-agent, voice-activated emergency response system that transforms unstructured, multilingual voice input into real-time, coordinated action.

## Features

- **Voice Recognition**: Uses Whisper AI for high-accuracy voice transcription
- **Multilingual Support**: Translates non-English input via Google Cloud Translation
- **Emergency Classification**: Uses fine-tuned BERT model to classify emergencies
- **Real-time Data Collection**: Leverages Apify for contextual data gathering
- **Intelligent Routing**: Automatically dispatches to appropriate emergency services
- **Priority-based Response**: Calculates response priority based on multiple factors
- **Traffic-aware**: Considers real-time traffic conditions for response time estimation
- **Weather Integration**: Incorporates weather data for comprehensive response planning
- **Real-time Notifications**: Provides instant updates to all stakeholders
- **Database Backend**: Robust PostgreSQL database for reliable data storage

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
- Database configuration
- API keys (Google Cloud, Apify)
- Email settings for notifications
- Redis configuration

3. Initialize the database:
```bash
python scripts/init_db.py
```

4. Start the application:
```bash
uvicorn main:app --reload
```

## Architecture

The system uses a microservices architecture with the following components:
- FastAPI-based main application
- PostgreSQL database for data persistence
- Redis for caching and real-time features
- Multiple specialized services for:
  - Speech processing
  - Translation
  - Emergency classification
  - Data collection
  - Notification handling

## API Endpoints

- `/emergency/new` - Submit new emergency
- `/emergency/{id}` - Track specific emergency
- `/emergency/history` - Access historical data
- `/emergency/stats` - View analytics
- `/services/status` - Monitor service status
- `/emergency/{id}/update` - Update emergency details

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 