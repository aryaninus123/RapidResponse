'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Users, 
  PhoneCall, 
  Clock, 
  AlertTriangle, 
  Send, 
  Mic, 
  MicOff,
  PhoneIncoming,
  UserCheck,
  Radio,
  Shield,
  Truck,
  Building2,
  MapPin,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';

interface EmergencyCall {
  id: string;
  caller: string;
  phone: string;
  emergency_type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  duration: string;
  location: string;
  timestamp: Date;
  dispatcher: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  channel: string;
  urgent: boolean;
}

interface Agency {
  id: string;
  name: string;
  type: 'FIRE' | 'MEDICAL' | 'POLICE' | 'OTHER';
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  contact: string;
  activeUnits: number;
  location: string;
}

export function CommunicationsCenter() {
  const [activeTab, setActiveTab] = useState<'hotline' | 'dispatch' | 'agencies'>('hotline');
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL_UNITS');
  const [micEnabled, setMicEnabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mock data initialization
  useEffect(() => {
    // Initialize mock emergency calls
    setEmergencyCalls([
      {
        id: '1',
        caller: 'Jane Smith',
        phone: '(555) 123-4567',
        emergency_type: 'MEDICAL',
        priority: 'HIGH',
        status: 'ACTIVE',
        duration: '00:03:45',
        location: '123 Oak Street',
        timestamp: new Date(Date.now() - 5 * 60000),
        dispatcher: 'Dispatcher A'
      },
      {
        id: '2',
        caller: 'Anonymous',
        phone: '(555) 987-6543',
        emergency_type: 'FIRE',
        priority: 'HIGH',
        status: 'ON_HOLD',
        duration: '00:08:12',
        location: '456 Pine Avenue',
        timestamp: new Date(Date.now() - 12 * 60000),
        dispatcher: 'Dispatcher B'
      }
    ]);

    // Initialize mock chat messages
    setChatMessages([
      {
        id: '1',
        sender: 'Fire Unit 12',
        message: 'Arrived at scene, assessing situation',
        timestamp: new Date(Date.now() - 2 * 60000),
        channel: 'FIRE_DEPT',
        urgent: false
      },
      {
        id: '2',
        sender: 'Medic 5',
        message: 'Patient stable, transporting to General Hospital',
        timestamp: new Date(Date.now() - 5 * 60000),
        channel: 'MEDICAL',
        urgent: false
      },
      {
        id: '3',
        sender: 'Police Unit 7',
        message: 'Need backup at current location - situation escalating',
        timestamp: new Date(Date.now() - 1 * 60000),
        channel: 'POLICE',
        urgent: true
      }
    ]);

    // Initialize mock agencies
    setAgencies([
      {
        id: '1',
        name: 'Central Fire Department',
        type: 'FIRE',
        status: 'ONLINE',
        contact: '(555) 100-0001',
        activeUnits: 3,
        location: 'Station 1'
      },
      {
        id: '2',
        name: 'City Emergency Medical',
        type: 'MEDICAL',
        status: 'ONLINE',
        contact: '(555) 100-0002',
        activeUnits: 5,
        location: 'Regional Hospital'
      },
      {
        id: '3',
        name: 'Metro Police Department',
        type: 'POLICE',
        status: 'BUSY',
        contact: '(555) 100-0003',
        activeUnits: 8,
        location: 'Precinct 12'
      }
    ]);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: 'Dispatcher 1',
        message: newMessage,
        timestamp: new Date(),
        channel: selectedChannel,
        urgent: false
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'ON_HOLD': return 'text-yellow-600 bg-yellow-50';
      case 'COMPLETED': return 'text-gray-600 bg-gray-50';
      case 'ONLINE': return 'text-green-600';
      case 'BUSY': return 'text-yellow-600';
      case 'OFFLINE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAgencyIcon = (type: string) => {
    switch (type) {
      case 'FIRE': return <Truck className="h-5 w-5" />;
      case 'MEDICAL': return <UserCheck className="h-5 w-5" />;
      case 'POLICE': return <Shield className="h-5 w-5" />;
      case 'OTHER': return <Building2 className="h-5 w-5" />;
      default: return <Circle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Radio className="h-7 w-7 text-blue-600 mr-3" />
              Communications Center
            </h2>
            <p className="text-gray-600 mt-1">Real-time emergency coordination and dispatch</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Circle className="h-3 w-3 text-green-500 fill-current" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <button
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                micEnabled 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'hotline', label: 'Emergency Hotline', icon: PhoneCall },
              { id: 'dispatch', label: 'Dispatch Chat', icon: MessageCircle },
              { id: 'agencies', label: 'Inter-Agency', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Emergency Hotline Tab */}
          {activeTab === 'hotline' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Call Queue */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PhoneIncoming className="h-5 w-5 text-blue-600 mr-2" />
                    Active Emergency Calls
                  </h3>
                  <div className="space-y-3">
                    {emergencyCalls.map(call => (
                      <div
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`bg-white rounded-lg p-4 border-l-4 cursor-pointer transition-all hover:shadow-md ${
                          call.priority === 'HIGH' ? 'border-red-500' : 
                          call.priority === 'MEDIUM' ? 'border-yellow-500' : 'border-green-500'
                        } ${selectedCall?.id === call.id ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <Phone className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-900">{call.caller}</span>
                              <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(call.priority)}`}>
                                {call.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(call.status)}`}>
                                {call.status}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-4">
                                <span>{call.emergency_type}</span>
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {call.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {call.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {format(call.timestamp, 'HH:mm:ss')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {call.dispatcher}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Call Details */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Details</h3>
                  {selectedCall ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Caller Information</label>
                        <div className="mt-1">
                          <p className="font-medium">{selectedCall.caller}</p>
                          <p className="text-sm text-gray-600">{selectedCall.phone}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="mt-1 text-sm">{selectedCall.location}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Emergency Type</label>
                        <p className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(selectedCall.priority)}`}>
                            {selectedCall.emergency_type} - {selectedCall.priority}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Call Duration</label>
                        <p className="mt-1 text-sm font-mono">{selectedCall.duration}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Join Call
                        </button>
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                          Transfer Call
                        </button>
                        <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                          End Call
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Select a call to view details</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dispatch Chat Tab */}
          {activeTab === 'dispatch' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Area */}
              <div className="lg:col-span-3">
                <div className="bg-gray-50 rounded-lg p-4 h-96 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Live Dispatch Chat</h3>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="text-sm border rounded-lg px-3 py-1"
                    >
                      <option value="ALL_UNITS">All Units</option>
                      <option value="FIRE_DEPT">Fire Department</option>
                      <option value="MEDICAL">Medical Units</option>
                      <option value="POLICE">Police</option>
                      <option value="DISPATCH">Dispatch Only</option>
                    </select>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {chatMessages
                      .filter(msg => selectedChannel === 'ALL_UNITS' || msg.channel === selectedChannel)
                      .map(message => (
                        <div key={message.id} className={`flex ${message.urgent ? 'items-start' : 'items-center'}`}>
                          <div className={`bg-white rounded-lg p-3 max-w-md ${message.urgent ? 'border-l-4 border-red-500' : ''}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">{message.sender}</span>
                              <span className="text-xs text-gray-500">{format(message.timestamp, 'HH:mm')}</span>
                              {message.urgent && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Channel Info */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel: {selectedChannel}</h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <div className="text-sm font-medium text-gray-700">Active Units</div>
                      <div className="text-2xl font-bold text-blue-600">12</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-sm font-medium text-gray-700">Messages Today</div>
                      <div className="text-2xl font-bold text-green-600">247</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-sm font-medium text-gray-700">Urgent Messages</div>
                      <div className="text-2xl font-bold text-red-600">3</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inter-Agency Tab */}
          {activeTab === 'agencies' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agency Directory */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    Emergency Agencies
                  </h3>
                  <div className="space-y-3">
                    {agencies.map(agency => (
                      <div key={agency.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              agency.type === 'FIRE' ? 'bg-red-100 text-red-600' :
                              agency.type === 'MEDICAL' ? 'bg-blue-100 text-blue-600' :
                              agency.type === 'POLICE' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {getAgencyIcon(agency.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{agency.name}</h4>
                              <p className="text-sm text-gray-600">{agency.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getStatusColor(agency.status)}`}>
                              <Circle className="h-2 w-2 inline mr-1 fill-current" />
                              {agency.status}
                            </div>
                            <div className="text-xs text-gray-500">{agency.activeUnits} units active</div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center">
                            <PhoneCall className="h-3 w-3 mr-1" />
                            Call
                          </button>
                          <button className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coordination Panel */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordination Center</h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Joint Operations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Multi-agency Response #1</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Evacuation Coordination</span>
                          <span className="text-yellow-600 font-medium">Standby</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Resource Sharing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Available Fire Units:</span>
                          <span className="font-medium">7</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available Ambulances:</span>
                          <span className="font-medium">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Police Units on Patrol:</span>
                          <span className="font-medium">12</span>
                        </div>
                      </div>
                    </div>
                    

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 