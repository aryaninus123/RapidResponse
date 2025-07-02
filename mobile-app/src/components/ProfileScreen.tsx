import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProfileScreenProps {
  navigation: any;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={48} color="#6b7280" />
        </View>
        <Text style={styles.userName}>Emergency User</Text>
        <Text style={styles.userEmail}>user@rapidresponse.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Information</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="medical-services" size={24} color="#3b82f6" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Medical Information</Text>
            <Text style={styles.menuSubtitle}>Allergies, medications, conditions</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="contacts" size={24} color="#16a34a" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Emergency Contacts</Text>
            <Text style={styles.menuSubtitle}>Family, friends, doctors</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="location-on" size={24} color="#f59e0b" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Home Address</Text>
            <Text style={styles.menuSubtitle}>Primary emergency location</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="notifications" size={24} color="#7c3aed" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuSubtitle}>Emergency alerts and updates</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="language" size={24} color="#0ea5e9" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Language</Text>
            <Text style={styles.menuSubtitle}>English</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="security" size={24} color="#dc2626" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuSubtitle}>Data protection settings</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="help" size={24} color="#6b7280" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Help & FAQ</Text>
            <Text style={styles.menuSubtitle}>Get answers to common questions</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="feedback" size={24} color="#6b7280" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Send Feedback</Text>
            <Text style={styles.menuSubtitle}>Help us improve the app</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="info" size={24} color="#6b7280" />
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>About</Text>
            <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton}>
        <MaterialIcons name="logout" size={20} color="#dc2626" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  profileHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
}); 