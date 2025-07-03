'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

export type UserRole = 'public' | 'dispatcher' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  badge?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database (in real app, this would be backend authentication)
const mockUsers: Record<string, { password: string; user: User }> = {
  'dispatcher1': {
    password: 'dispatch123',
    user: {
      id: '1',
      username: 'dispatcher1',
      role: 'dispatcher',
      name: 'Sarah Johnson',
      badge: 'D-001'
    }
  },
  'dispatcher2': {
    password: 'dispatch456',
    user: {
      id: '2',
      username: 'dispatcher2',
      role: 'dispatcher',
      name: 'Mike Rodriguez',
      badge: 'D-002'
    }
  },
  'admin': {
    password: 'admin123',
    user: {
      id: '3',
      username: 'admin',
      role: 'admin',
      name: 'Chief Anderson',
      badge: 'A-001'
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = localStorage.getItem('rapidresponse_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('rapidresponse_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.detail || 'Login failed');
        return false;
      }

      const data = await response.json();
      
      // Store both user data and token
      const userData = {
        ...data.user,
        name: data.user.full_name, // Map backend field to frontend field
        badge: data.user.badge_number,
      };
      
      setUser(userData);
      localStorage.setItem('rapidresponse_user', JSON.stringify(userData));
      localStorage.setItem('rapidresponse_token', data.access_token);
      
      toast.success(`Welcome back, ${userData.name}!`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('rapidresponse_token');
      if (token) {
        // Call backend logout endpoint
        await fetch('http://localhost:8000/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    } finally {
      // Clean up local storage
      setUser(null);
      localStorage.removeItem('rapidresponse_user');
      localStorage.removeItem('rapidresponse_token');
      toast.success('Logged out successfully');
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    
    // Role hierarchy: admin > dispatcher > public
    const roleHierarchy: Record<UserRole, number> = {
      'public': 0,
      'dispatcher': 1,
      'admin': 2
    };

    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  const canAccess = (requiredRole: UserRole): boolean => {
    return hasRole(requiredRole);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canAccess
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 