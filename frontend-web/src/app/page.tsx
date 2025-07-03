'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Users, Clock, MapPin, Radio, Shield, LogOut, User } from 'lucide-react';
import { EmergencyReportForm } from '@/components/EmergencyReportForm';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { CommunicationsCenter } from '@/components/CommunicationsCenter';
import { LoginForm } from '@/components/LoginForm';
import { DispatcherRoute } from '@/components/ProtectedRoute';
import { EmergencyResponse, EmergencyStats, ServiceAvailability } from '@/types/emergency';
import { useEmergencyWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { systemAPI, emergencyAPI, serviceAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [view, setView] = useState<'report' | 'dashboard' | 'communications'>('report');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);
  const [lastEmergencyResponse, setLastEmergencyResponse] = useState<EmergencyResponse | null>(null);
  
  // Real-time stats for the Report Emergency tab
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [services, setServices] = useState<ServiceAvailability[] | Record<string, any>>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Auth context
  const { user, logout, isAuthenticated, canAccess } = useAuth();

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

  // Load quick stats for the report view
  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        setStatsLoading(true);
        const [statsResponse, servicesResponse] = await Promise.all([
          emergencyAPI.getStats('24h').catch(() => null),
          serviceAPI.getAvailability().catch(() => [])
        ]);
        
        if (statsResponse) {
          setStats(statsResponse);
        }
        setServices(servicesResponse);
      } catch (error) {
        console.error('Failed to load quick stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadQuickStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadQuickStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh stats after emergency submission
  const refreshStats = async () => {
    try {
      const statsResponse = await emergencyAPI.getStats('24h');
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  // Refresh services
  const refreshServices = async () => {
    try {
      const servicesResponse = await serviceAPI.getAvailability();
      setServices(servicesResponse);
    } catch (error) {
      console.error('Failed to refresh services:', error);
    }
  };

  const handleEmergencySuccess = (response: EmergencyResponse) => {
    setLastEmergencyResponse(response);
    toast.success('Emergency reported successfully! Help is on the way.');
    
    // Refresh stats immediately after successful submission
    refreshStats();
    
    // Auto-switch to dashboard after successful submission (if user has access)
    if (canAccess('dispatcher')) {
      setTimeout(() => {
        setView('dashboard');
      }, 2000);
    }
  };

  const handleEmergencyError = (error: Error) => {
    toast.error(`Failed to report emergency: ${error.message}`);
  };

  const handleViewChange = (newView: 'report' | 'dashboard' | 'communications') => {
    // Check if user has access to protected views
    if ((newView === 'dashboard' || newView === 'communications') && !canAccess('dispatcher')) {
      setShowLoginModal(true);
      return;
    }
    setView(newView);
  };

  const handleLogout = () => {
    logout();
    setView('report'); // Redirect to public view after logout
  };

  // Calculate total available units from all services
  const totalAvailableUnits = Array.isArray(services) 
    ? services.reduce((total, service) => total + service.available_units, 0)
    : Object.values(services || {}).reduce((total: number, service: any) => total + (service.available_units || 0), 0);
  
  // Count active emergencies (assuming ACTIVE status means currently ongoing)
  const activeEmergencyCount = stats ? 
    Object.values(stats.response_by_type || {}).reduce((total, count) => total + count, 0) : 0;

  // Show login modal if requested
  if (showLoginModal) {
    return <LoginForm onClose={() => setShowLoginModal(false)} />;
  }

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

            {/* System Status & User Info */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center space-x-2">
                    <div className="bg-blue-500 p-1 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.badge} • {user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

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
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleViewChange('report')}
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
              onClick={() => handleViewChange('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                view === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300'
              }`}
            >
              <Activity className="inline mr-2" size={16} />
              Emergency Dashboard
              {!canAccess('dispatcher') && (
                <Shield className="inline ml-1" size={12} />
              )}
            </button>
            <button
              onClick={() => handleViewChange('communications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                view === 'communications'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-purple-300'
              }`}
            >
              <Radio className="inline mr-2" size={16} />
              Communications Center
              {!canAccess('dispatcher') && (
                <Shield className="inline ml-1" size={12} />
              )}
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
          <DispatcherRoute 
            onLoginClick={() => setShowLoginModal(true)}
            fallbackMessage="The Emergency Dashboard provides real-time monitoring of all emergency reports, response analytics, and dispatch coordination tools."
          >
            <EmergencyDashboard lastMessage={lastMessage} />
          </DispatcherRoute>
        ) : (
          <DispatcherRoute 
            onLoginClick={() => setShowLoginModal(true)}
            fallbackMessage="The Communications Center provides secure messaging, resource coordination, and inter-agency communication tools."
          >
            <CommunicationsCenter />
          </DispatcherRoute>
        )}
      </main>
    </div>
  );
} 