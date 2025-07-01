import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

// Screens
import { EmergencyReportScreen } from './src/components/EmergencyReportScreen';
import { EmergencyDashboardScreen } from './src/components/EmergencyDashboardScreen';
import { EmergencyDetailsScreen } from './src/components/EmergencyDetailsScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { SettingsScreen } from './src/components/SettingsScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'Report') {
            iconName = 'emergency';
          } else if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#ef4444',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Report" 
        component={EmergencyReportScreen}
        options={{
          title: 'Report Emergency',
          tabBarLabel: 'Report',
        }}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={EmergencyDashboardScreen}
        options={{
          title: 'Emergency Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Request notification permissions
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permission not granted');
      }
    };

    requestNotificationPermissions();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#ef4444" />
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EmergencyDetails" 
          component={EmergencyDetailsScreen}
          options={{
            title: 'Emergency Details',
            headerStyle: {
              backgroundColor: '#ef4444',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
} 