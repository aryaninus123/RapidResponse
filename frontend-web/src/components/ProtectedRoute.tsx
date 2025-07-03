'use client';

import React, { ReactNode } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: UserRole;
  fallbackMessage?: string;
  showLoginButton?: boolean;
  onLoginClick?: () => void;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackMessage,
  showLoginButton = true,
  onLoginClick 
}: ProtectedRouteProps) {
  const { user, canAccess } = useAuth();

  // If user can access, show the protected content
  if (canAccess(requiredRole)) {
    return <>{children}</>;
  }

  // Show access denied message
  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'dispatcher': return 'Dispatcher';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getDefaultMessage = () => {
    if (!user) {
      return `Please sign in with ${getRoleName(requiredRole)} credentials to access this section.`;
    }
    return `This section requires ${getRoleName(requiredRole)} access. Your current role (${getRoleName(user.role)}) does not have sufficient permissions.`;
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              {!user ? (
                <Lock className="h-8 w-8 text-yellow-600" />
              ) : (
                <Shield className="h-8 w-8 text-yellow-600" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {!user ? 'Authentication Required' : 'Access Restricted'}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {fallbackMessage || getDefaultMessage()}
          </p>

          {/* Required Role Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 mb-6">
            <Shield className="h-4 w-4 mr-1" />
            {getRoleName(requiredRole)} Access Required
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!user && showLoginButton && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                Sign In as {getRoleName(requiredRole)}
              </button>
            )}

            {user && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Currently signed in as: <span className="font-medium ml-1">{user.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Role: {getRoleName(user.role)} ({user.badge})
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Contact your system administrator if you need access to this section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience wrapper components for common use cases
export function DispatcherRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="dispatcher" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  );
} 