import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkAuth = () => {
    const token = localStorage.getItem('advisergpt-auth-token');
    const email = localStorage.getItem('advisergpt-user-email');
    
    if (token && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      return true;
    }
    
    setIsAuthenticated(false);
    setUserEmail(null);
    return false;
  };

  const login = (email: string, password: string): boolean => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Password just needs to be non-empty for prototype
    if (!password.trim()) {
      return false;
    }

    // Set localStorage items
    localStorage.setItem('advisergpt-auth-token', 'authenticated');
    localStorage.setItem('advisergpt-user-email', email);
    
    setIsAuthenticated(true);
    setUserEmail(email);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('advisergpt-auth-token');
    localStorage.removeItem('advisergpt-user-email');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    userEmail,
    login,
    logout,
    checkAuth,
  };

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
