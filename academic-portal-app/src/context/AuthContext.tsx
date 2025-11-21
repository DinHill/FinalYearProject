import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithCustomToken, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { api, setAuthToken, clearAuthToken } from '../services/api';
import { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (token: string) => {
    try {
      await setAuthToken(token);
      console.log('📡 Fetching user profile from API...');
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        console.log('✅ User profile loaded:', response.data.full_name, '- Role:', response.data.role);
        setUser(response.data);
      } else {
        console.error('❌ Failed to fetch user profile:', response.error);
        // Clear user on profile fetch failure
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      // Clear user on network error
      setUser(null);
      throw error; // Re-throw to handle in caller
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          console.log('🔑 Got Firebase token, fetching user profile...');
          await fetchUserProfile(token);
        } catch (error) {
          console.error('❌ Error in auth flow:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        await clearAuthToken();
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const loginEndpoint = `${apiUrl}/api/v1/auth/student-login`;
      
      console.log('🔐 Attempting login to:', loginEndpoint);
      console.log('📱 API URL from env:', process.env.EXPO_PUBLIC_API_URL);
      
      // Call backend to get custom token
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('✅ Login successful, got custom token');
      const customToken = data.custom_token;

      // Sign in to Firebase with custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      const token = await userCredential.user.getIdToken();
      await fetchUserProfile(token);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      await clearAuthToken();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      await fetchUserProfile(token);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
