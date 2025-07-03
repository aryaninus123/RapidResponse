# RapidResponse Frontend - Next.js Web Dashboard

This is the **Next.js 14** web frontend for the RapidResponse Emergency Response System. It provides a modern, real-time dashboard for reporting and managing emergencies.

## 🚀 **Features**

- **Voice & Text Emergency Reporting** - Record audio or type emergency descriptions
- **Real-time Updates** - WebSocket connection for live emergency status updates  
- **Multilingual Support** - Report emergencies in multiple languages
- **Location Services** - GPS integration for accurate emergency location
- **Emergency Dashboard** - Monitor active emergencies and service status
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Offline Capability** - PWA features for emergency situations

## 🛠 **Tech Stack**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Real-time**: WebSocket + Socket.io
- **Audio**: MediaRecorder API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 **Installation**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- RapidResponse FastAPI backend running

### Setup Steps

1. **Install Dependencies**
```bash
cd frontend-web
npm install
```

2. **Environment Configuration**
Create a `.env.local` file:
```env
# Emergency Response API
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Google Maps API (required for interactive maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

3. **Google Maps API Setup**
To enable interactive maps with location search:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** 
   - **Geocoding API**
4. Create an API key in "Credentials"
5. Add the API key to your `.env.local` file

**Note**: Without the API key, the app will show a fallback location picker with manual coordinate entry.

4. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ **Project Structure**

```
frontend-web/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── AudioRecorder.tsx  # Voice recording
│   │   ├── EmergencyReportForm.tsx
│   │   ├── EmergencyDashboard.tsx  
│   │   └── LocationPicker.tsx # GPS location picker
│   ├── hooks/                 # Custom React hooks
│   │   └── useWebSocket.ts    # Real-time updates
│   ├── lib/                   # Utilities
│   │   └── api.ts             # FastAPI client
│   └── types/                 # TypeScript types
│       └── emergency.ts       # Shared type definitions
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🔧 **Development**

### Available Scripts

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting with Next.js rules
- **Prettier** - Code formatting
- **Tailwind CSS** - Utility-first styling

## 🚨 **Emergency Features**

### Voice Recording
- **MediaRecorder API** for browser audio recording
- **Pause/Resume** functionality
- **Auto-stop** at maximum duration (5 minutes)
- **Playback** to review before submission

### Location Services
- **GPS Integration** - Automatic location detection with browser geolocation
- **Interactive Maps** - Google Maps with click-to-select functionality
- **Places Search** - Google Places API for address/landmark search
- **Manual Entry** - Coordinate input fallback for precise locations
- **Custom Markers** - Visual indicators for selected emergency locations

### Real-time Updates
- **WebSocket Connection** - Live emergency status updates
- **Auto-reconnection** - Handles connection failures
- **Toast Notifications** - Real-time alerts for new emergencies

### Emergency Types
- 🔥 **Fire Emergency**
- 🚑 **Medical Emergency** 
- 🚨 **Crime/Security**
- ⛈️ **Natural Disaster**
- 🚗 **Traffic Accident**
- ⚠️ **Other Emergency**

## 🔌 **API Integration**

The frontend communicates with the FastAPI backend through:

### REST API Endpoints
- `POST /emergency/report` - Submit emergency reports
- `GET /emergency/{id}` - Get emergency details
- `GET /emergency/history` - Emergency history
- `GET /emergency/stats` - Statistics

### WebSocket Connection
- Real-time emergency updates
- Service status changes
- System notifications

### File Upload
- Audio file upload for voice reports
- FormData API for multipart uploads

## 🎨 **Styling & Theming**

### Tailwind Configuration
- **Emergency Colors** - Red, orange, yellow color schemes
- **Custom Animations** - Pulse effects for urgent alerts
- **Responsive Design** - Mobile-first approach

### Emergency Priority Colors
- **HIGH** - Red (`emergency-500`)
- **MEDIUM** - Yellow (`yellow-500`)
- **LOW** - Green (`green-500`)

## 📱 **Mobile Support**

- **Responsive Design** - Works on all screen sizes
- **Touch Gestures** - Mobile-friendly interactions
- **GPS Access** - Native location services
- **Audio Recording** - Mobile microphone access
- **PWA Ready** - Can be installed as mobile app

## 🔒 **Security**

- **CORS Configuration** - Secure cross-origin requests
- **Input Validation** - Zod schema validation
- **XSS Protection** - Sanitized user inputs
- **API Error Handling** - Secure error messages

## 🚀 **Production Deployment**

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```env
# Emergency Response API
NEXT_PUBLIC_API_BASE=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Deployment Platforms
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Docker** (included Dockerfile)
- **AWS/GCP/Azure**

## 🧪 **Testing**

```bash
# Run tests
npm test

# E2E testing
npm run test:e2e

# Test emergency reporting flow
npm run test:emergency
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/emergency-maps`)
3. Commit changes (`git commit -m 'Add interactive maps'`)
4. Push to branch (`git push origin feature/emergency-maps`)
5. Open Pull Request

## 📚 **API Documentation**

The frontend integrates with RapidResponse FastAPI backend. See the main project README for API documentation.

## 🆘 **Emergency Contact**

For system issues during emergencies:
- **Always call local emergency services first (911, 112, etc.)**
- System support: [emergency-support@rapidresponse.com]

## 📄 **License**

MIT License - see LICENSE file for details. 