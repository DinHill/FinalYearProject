// AuthContext removed - will be re-added after backend rebuild
// This will be rebuilt to work with the new backend API

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  // Additional properties will be added when backend is rebuilt
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth state management will be implemented after backend rebuild
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Login implementation will be rebuilt
    console.log('Login - to be implemented');
  };

  const logout = async () => {
    // Logout implementation will be rebuilt
    console.log('Logout - to be implemented');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
