'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Clock, MapPin, Radio } from 'lucide-react';
import { EmergencyReportForm } from '@/components/EmergencyReportForm';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { CommunicationsCenter } from '@/components/CommunicationsCenter';
import { EmergencyResponse, EmergencyStats, ServiceAvailability } from '@/types/emergency';
import { useEmergencyWebSocket } from '@/hooks/useWebSocket';
import { systemAPI, emergencyAPI, serviceAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [view, setView] = useState<'report' | 'dashboard' | 'communications'>('report');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
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
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setView('report')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'report'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-red-300'
              }`}
            >
              <AlertTriangle className="inline mr-2" size={16} />
              Report Emergency
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300'
              }`}
            >
              <Activity className="inline mr-2" size={16} />
              Emergency Dashboard
            </button>
            <button
              onClick={() => setView('communications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'communications'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-purple-300'
              }`}
            >
              <Radio className="inline mr-2" size={16} />
              Communications Center
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={view === 'report' ? 'py-6 px-6 sm:px-8 lg:px-12' : 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'}>
        {view === 'report' ? (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-blue-700">Avg Response Time</p>
                    <p className="text-2xl font-semibold text-gray-900">
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
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-emerald-200">
                <div className="flex items-center">
                  <div className="bg-emerald-500 p-2 rounded-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-emerald-700">Available Units</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? (
                        <span className="animate-pulse bg-gray-200 rounded w-8 h-5 inline-block"></span>
                      ) : (
                        totalAvailableUnits || 25
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200">
                <div className="flex items-center">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-orange-700">Total Emergencies</p>
                    <p className="text-2xl font-semibold text-gray-900">
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
        ) : view === 'dashboard' ? (
          <EmergencyDashboard lastMessage={lastMessage} />
        ) : (
          <CommunicationsCenter />
        )}
      </main>
    </div>
  );
} 