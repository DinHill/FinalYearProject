import React, { createContext, useCallback, useMemo, useEffect, useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './AuthContext';

type UserRole = 'student' | 'teacher' | 'admin';

interface RoleContextValue {
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

export const RoleContext = createContext<RoleContextValue>({
  isAuthenticated: false,
  role: null,
  login: async () => ({ ok: false }),
  logout: () => {},
});

// Export useRole hook
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, login: authLogin, logout: authLogout, loading } = useAuth();
  
  // Derive role from authenticated user
  const role = user?.role as UserRole | null;
  const isAuthenticated = !!user;

  console.log('🎭 RoleContext state:', { isAuthenticated, role: role, userName: user?.full_name, loading });

  const login = useCallback(async (username: string, password: string) => {
    try {
      await authLogin(username, password);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, message: error.message || 'Login failed' };
    }
  }, [authLogin]);

  const logout = useCallback(async () => {
    await authLogout();
  }, [authLogout]);

  const value = useMemo(
    () => ({ isAuthenticated, role, login, logout }),
    [isAuthenticated, role, login, logout],
  );

  // Don't render children until auth state is determined
  if (loading) {
    console.log('⏳ RoleProvider: Waiting for auth state...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});


