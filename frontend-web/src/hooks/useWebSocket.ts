import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage } from '@/types/emergency';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: unknown) => void;
  connect: () => void;
  disconnect: () => void;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptCountRef = useRef(0);
  
  // Use refs to store current callback functions to avoid dependency issues
  const callbacksRef = useRef({ onMessage, onError, onConnect, onDisconnect });
  callbacksRef.current = { onMessage, onError, onConnect, onDisconnect };

  const connect = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');
    
    try {
      websocketRef.current = new WebSocket(url);

      websocketRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionState('connected');
        attemptCountRef.current = 0;
        callbacksRef.current.onConnect?.();
      };

      websocketRef.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          callbacksRef.current.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocketRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionState('disconnected');
        callbacksRef.current.onDisconnect?.();

        // Attempt to reconnect
        if (attemptCountRef.current < reconnectAttempts) {
          attemptCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      websocketRef.current.onerror = (error: Event) => {
        setConnectionState('error');
        callbacksRef.current.onError?.(error);
      };
    } catch (error) {
      setConnectionState('error');
      console.error('WebSocket connection error:', error);
    }
  }, [url, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    connectionState,
  };
};

// Specialized hook for emergency updates
export const useEmergencyWebSocket = (clientId: string) => {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  
  // Memoize callbacks to prevent infinite reconnection loops
  const onConnect = useCallback(() => {
    console.log('Connected to emergency WebSocket');
  }, []);
  
  const onDisconnect = useCallback(() => {
    console.log('Disconnected from emergency WebSocket');
  }, []);
  
  const onError = useCallback((error: Event) => {
    console.error('Emergency WebSocket error:', error);
  }, []);
  
  return useWebSocket(`${WS_URL}/ws/${clientId}`, {
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts: 5,
    reconnectInterval: 2000,
  });
}; 