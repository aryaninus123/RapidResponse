# RapidResponse Mobile App - React Native

This is the **React Native mobile application** for the RapidResponse Emergency Response System. Built with **Expo** for cross-platform deployment on iOS and Android.

## 📱 **Features**

- **Emergency Reporting** - Quick voice and text emergency reporting
- **GPS Location** - Automatic location detection for emergency response
- **Voice Recording** - High-quality audio recording for emergency details
- **Real-time Updates** - Push notifications for emergency status updates
- **Offline Capability** - Core functionality works without internet
- **Emergency Contacts** - Quick access to emergency services and personal contacts
- **Multi-language Support** - Report emergencies in multiple languages
- **Background Location** - Location tracking during active emergencies

## 🛠 **Tech Stack**

- **Framework**: React Native with Expo SDK 49
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **Audio**: Expo AV for voice recording
- **Location**: Expo Location for GPS services
- **Notifications**: Expo Notifications for push alerts
- **Maps**: React Native Maps
- **Forms**: React Hook Form + Zod validation
- **Storage**: AsyncStorage for offline data
- **UI Components**: React Native Paper

## 📦 **Installation**

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- RapidResponse FastAPI backend running

### Setup Steps

1. **Install Dependencies**
```bash
cd mobile-app
npm install
```

2. **Start Development Server**
```bash
npx expo start
```

3. **Run on Device/Emulator**
```bash
# iOS (macOS only)
npx expo start --ios

# Android
npx expo start --android

# Web (for testing)
npx expo start --web
```

## 📱 **Development**

### Expo Development Build

For development with custom native modules:

```bash
# Create development build
npx expo install --fix
npx expo prebuild
npx expo run:ios
npx expo run:android
```

### Available Scripts

```bash
# Start development server
npm start

# Start on specific platform
npm run ios
npm run android

# Build for production
npx expo build:ios
npx expo build:android

# Test on web
npm run web
```

## 🏗️ **Project Structure**

```
mobile-app/
├── src/
│   ├── components/           # React Native screens & components
│   │   ├── EmergencyReportScreen.tsx
│   │   ├── EmergencyDashboardScreen.tsx
│   │   ├── AudioRecorder.tsx
│   │   ├── LocationPicker.tsx
│   │   └── EmergencyTypeSelector.tsx
│   ├── services/            # API and native services
│   │   ├── api.ts           # FastAPI client
│   │   ├── location.ts      # GPS services
│   │   ├── audio.ts         # Audio recording
│   │   └── notifications.ts # Push notifications
│   ├── hooks/               # Custom React hooks
│   │   ├── useLocation.ts
│   │   ├── useAudio.ts
│   │   └── useEmergency.ts
│   ├── types/               # TypeScript definitions
│   │   └── emergency.ts     # Shared types with web
│   ├── utils/               # Utility functions
│   │   ├── permissions.ts
│   │   └── storage.ts
│   └── constants/           # App constants
│       └── config.ts
├── assets/                  # Images, fonts, icons
├── app.json                 # Expo configuration
├── package.json
└── README.md
```

## 🚨 **Emergency Features**

### Voice Recording
- **High-quality audio** recording with pause/resume
- **Background recording** - continues even if app is backgrounded
- **Automatic compression** for faster upload
- **Playback functionality** to review before submission

### Location Services
- **GPS accuracy** - High-precision location detection
- **Background location** - Track location during emergencies
- **Location history** - For emergency response optimization
- **Manual location entry** - Backup when GPS unavailable

### Emergency Types
- 🔥 **Fire Emergency** - Fire department dispatch
- 🚑 **Medical Emergency** - Ambulance and medical response
- 🚨 **Crime/Security** - Police and security services
- ⛈️ **Natural Disaster** - Multi-service emergency response
- 🚗 **Traffic Accident** - Police and medical coordination
- ⚠️ **Other Emergency** - General emergency services

### Push Notifications
- **Emergency status updates** - Real-time status changes
- **Response team updates** - When help is dispatched
- **Safety alerts** - Area-wide emergency notifications
- **Test notifications** - System health checks

## 📱 **Platform-Specific Features**

### iOS Features
- **Native GPS** - Core Location integration
- **Background app refresh** - Emergency status updates
- **Siri shortcuts** - Quick emergency reporting
- **Apple Watch support** - Emergency reporting from watch
- **HealthKit integration** - Medical information access

### Android Features
- **Emergency SOS** - Volume button emergency triggers
- **Background location** - Continuous location tracking
- **Emergency contacts** - Quick access from lock screen
- **Google Assistant** - Voice-activated emergency reporting
- **Wear OS support** - Smartwatch emergency features

## 🔧 **Configuration**

### Environment Setup

Create `.env` file:
```env
EXPO_PUBLIC_API_BASE=http://your-api-domain.com
EXPO_PUBLIC_WS_URL=ws://your-api-domain.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "RapidResponse",
    "slug": "rapidresponse-emergency",
    "ios": {
      "bundleIdentifier": "com.rapidresponse.emergency"
    },
    "android": {
      "package": "com.rapidresponse.emergency"
    }
  }
}
```

## 🔐 **Permissions**

### Required Permissions

#### iOS (Info.plist)
- **NSLocationWhenInUseUsageDescription** - Emergency location reporting
- **NSMicrophoneUsageDescription** - Voice emergency reports
- **NSCameraUsageDescription** - Emergency photo documentation

#### Android (AndroidManifest.xml)
- **ACCESS_FINE_LOCATION** - GPS emergency location
- **RECORD_AUDIO** - Voice emergency recording
- **CAMERA** - Emergency photo capture
- **WAKE_LOCK** - Keep app active during emergency

## 📊 **Offline Functionality**

### Cached Data
- **Emergency contacts** - Always accessible
- **Previous locations** - For quick location selection
- **Emergency templates** - Pre-filled emergency types
- **User profile** - Medical information and preferences

### Offline Queue
- **Emergency reports** - Queue for when connectivity returns
- **Location updates** - Store GPS data for later sync
- **Audio recordings** - Local storage until upload possible

## 🚀 **Production Deployment**

### App Store Deployment (iOS)

```bash
# Build for App Store
npx expo build:ios --type archive

# Submit to App Store
npx expo upload:ios
```

### Google Play Deployment (Android)

```bash
# Build APK
npx expo build:android --type apk

# Build AAB for Play Store
npx expo build:android --type app-bundle

# Submit to Play Store
npx expo upload:android
```

### Environment Variables (Production)
```env
EXPO_PUBLIC_API_BASE=https://api.rapidresponse.com
EXPO_PUBLIC_WS_URL=wss://api.rapidresponse.com
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_ANALYTICS_KEY=your_analytics_key
```

## 🧪 **Testing**

### Unit Testing
```bash
npm test
```

### E2E Testing
```bash
# Install Detox
npm install -g detox-cli

# Run E2E tests
detox test
```

### Emergency Flow Testing
```bash
# Test emergency reporting flow
npm run test:emergency

# Test location services
npm run test:location

# Test audio recording
npm run test:audio
```

## 🔔 **Push Notifications**

### Setup
1. **Firebase Setup** (Android)
2. **APNs Setup** (iOS)
3. **Expo Push Notifications** (Development)

### Notification Types
- **Emergency Alerts** - High-priority emergency notifications
- **Status Updates** - Emergency response progress
- **System Notifications** - App updates and maintenance
- **Safety Alerts** - Area-wide emergency warnings

## 📱 **Device Compatibility**

### Minimum Requirements
- **iOS**: iOS 11.0+
- **Android**: Android 6.0+ (API level 23)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 100MB app size, 500MB for offline data

### Tested Devices
- **iPhone**: iPhone 8, X, 11, 12, 13, 14, 15 series
- **Android**: Samsung Galaxy S series, Google Pixel, OnePlus
- **Tablets**: iPad, Android tablets (limited support)

## 🆘 **Emergency Contact**

For app issues during emergencies:
- **Always call local emergency services first (911, 112, etc.)**
- **App support**: emergency-support@rapidresponse.com
- **Critical bugs**: urgent@rapidresponse.com

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/emergency-notifications`)
3. Commit changes (`git commit -m 'Add push notifications'`)
4. Push to branch (`git push origin feature/emergency-notifications`)
5. Open Pull Request

## 📄 **License**

MIT License - see LICENSE file for details. 