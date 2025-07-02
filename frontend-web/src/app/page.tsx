'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Clock, MapPin } from 'lucide-react';
import { EmergencyReportForm } from '@/components/EmergencyReportForm';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { EmergencyResponse, EmergencyStats, ServiceAvailability } from '@/types/emergency';
import { useEmergencyWebSocket } from '@/hooks/useWebSocket';
import { systemAPI, emergencyAPI, serviceAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [view, setView] = useState<'report' | 'dashboard'>('report');
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);
  const [lastEmergencyResponse, setLastEmergencyResponse] = useState<EmergencyResponse | null>(null);
  
  // Real-time stats for the Report Emergency tab
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [services, setServices] = useState<ServiceAvailability[] | Record<string, any>>([]);
  const [statsLoading, setStatsLoading] = useState(true);

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

  // Load real-time stats for the quick stats display
  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        const [statsData, serviceData] = await Promise.all([
          emergencyAPI.getStats('24h'),
          serviceAPI.getAvailability()
        ]);
        setStats(statsData);
        setServices(serviceData);
      } catch (error) {
        console.error('Failed to load quick stats:', error);
        // Keep stats as null to show loading state
      } finally {
        setStatsLoading(false);
      }
    };

    loadQuickStats();
  }, []);

  // Handle real-time messages and update stats
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_emergency':
          toast.success('New emergency reported in the system');
          // Refresh stats when new emergency comes in
          refreshStats();
          break;
        case 'emergency_update':
          toast('Emergency status updated', {
            icon: '📢',
          });
          refreshStats();
          break;
        case 'service_update':
          toast('Emergency service status changed', {
            icon: '🚨',
          });
          refreshServices();
          break;
      }
    }
  }, [lastMessage]);

  const refreshStats = async () => {
    try {
      const statsData = await emergencyAPI.getStats('24h');
      setStats(statsData);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const refreshServices = async () => {
    try {
      const serviceData = await serviceAPI.getAvailability();
      setServices(serviceData);
    } catch (error) {
      console.error('Failed to refresh services:', error);
    }
  };

  const handleEmergencySuccess = (response: EmergencyResponse) => {
    setLastEmergencyResponse(response);
    toast.success('Emergency reported successfully! Help is on the way.');
    
    // Refresh stats immediately after successful submission
    refreshStats();
    
    // Auto-switch to dashboard after successful submission
    setTimeout(() => {
      setView('dashboard');
    }, 2000);
  };

  const handleEmergencyError = (error: Error) => {
    toast.error(`Failed to report emergency: ${error.message}`);
  };

  // Calculate total available units from all services
  const totalAvailableUnits = Array.isArray(services) 
    ? services.reduce((total, service) => total + service.available_units, 0)
    : Object.values(services || {}).reduce((total: number, service: any) => total + (service.available_units || 0), 0);
  
  // Count active emergencies (assuming ACTIVE status means currently ongoing)
  const activeEmergencyCount = stats ? 
    Object.values(stats.response_by_type || {}).reduce((total, count) => total + count, 0) : 0;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {statsLoading ? (
                        <span className="animate-pulse bg-gray-200 rounded w-12 h-5 inline-block"></span>
                      ) : stats ? (
                        `${stats.average_response_time.toFixed(1)}m`
                      ) : (
                        '8.0m'
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Available Units</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {statsLoading ? (
                        <span className="animate-pulse bg-gray-200 rounded w-8 h-5 inline-block"></span>
                      ) : (
                        totalAvailableUnits || 25
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Emergencies</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {statsLoading ? (
                        <span className="animate-pulse bg-gray-200 rounded w-6 h-5 inline-block"></span>
                      ) : stats ? (
                        stats.total_emergencies
                      ) : (
                        '0'
                      )}
                    </p>
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
          <EmergencyDashboard lastMessage={lastMessage} />
        )}
      </main>
    </div>
  );
} 