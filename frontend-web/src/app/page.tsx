'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Clock, MapPin } from 'lucide-react';
import { EmergencyReportForm } from '@/components/EmergencyReportForm';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { EmergencyResponse } from '@/types/emergency';
import { useEmergencyWebSocket } from '@/hooks/useWebSocket';
import { systemAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [view, setView] = useState<'report' | 'dashboard'>('report');
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);
  const [lastEmergencyResponse, setLastEmergencyResponse] = useState<EmergencyResponse | null>(null);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useEmergencyWebSocket('dashboard-client');

  // Check system health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await systemAPI.health();
        setIsSystemHealthy(true);
      } catch (error) {
        setIsSystemHealthy(false);
        toast.error('Emergency system is offline. Please try again later.');
      }
    };

    checkHealth();
  }, []);

  // Handle real-time messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_emergency':
          toast.success('New emergency reported in the system');
          break;
        case 'emergency_update':
          toast('Emergency status updated', {
            icon: '📢',
          });
          break;
        case 'service_update':
          toast('Emergency service status changed', {
            icon: '🚨',
          });
          break;
      }
    }
  }, [lastMessage]);

  const handleEmergencySuccess = (response: EmergencyResponse) => {
    setLastEmergencyResponse(response);
    toast.success('Emergency reported successfully! Help is on the way.');
    
    // Auto-switch to dashboard after successful submission
    setTimeout(() => {
      setView('dashboard');
    }, 2000);
  };

  const handleEmergencyError = (error: Error) => {
    toast.error(`Failed to report emergency: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-emergency-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RapidResponse</h1>
                <p className="text-sm text-gray-500">Emergency Response System</p>
              </div>
            </div>

            {/* System Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isSystemHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <Activity size={16} />
                <span>{isSystemHealthy ? 'System Online' : 'System Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setView('report')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'report'
                  ? 'border-emergency-500 text-emergency-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="inline mr-2" size={16} />
              Report Emergency
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'dashboard'
                  ? 'border-emergency-500 text-emergency-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="inline mr-2" size={16} />
              Emergency Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {view === 'report' ? (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                    <p className="text-lg font-semibold text-gray-900">8 min</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Available Units</p>
                    <p className="text-lg font-semibold text-gray-900">23</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Active Emergencies</p>
                    <p className="text-lg font-semibold text-gray-900">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Coverage Area</p>
                    <p className="text-lg font-semibold text-gray-900">24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Report Form */}
            <EmergencyReportForm
              onSubmissionSuccess={handleEmergencySuccess}
              onSubmissionError={handleEmergencyError}
            />

            {/* Last Response Display */}
            {lastEmergencyResponse && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Emergency Reported Successfully
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Type: <strong>{lastEmergencyResponse.emergency_type}</strong></p>
                      <p>Priority: <strong>{lastEmergencyResponse.priority_level}</strong></p>
                      <p>Emergency services have been notified and are responding.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmergencyDashboard />
        )}
      </main>
    </div>
  );
} 