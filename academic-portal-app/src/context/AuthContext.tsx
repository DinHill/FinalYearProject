import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { saveUserData, clearUserData } from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get existing user data to preserve campus info
        const existingData = await AsyncStorage.getItem('userData');
        const userData = existingData ? JSON.parse(existingData) : {};
        await saveUserData(firebaseUser, userData.campus);
      } else {
        setUser(null);
        await clearUserData();
      }
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await clearUserData();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};