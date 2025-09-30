import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

export const saveUserData = async (user: User, campus?: string) => {
  try {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      campus: campus || '',
      lastLogin: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    if (campus) {
      await AsyncStorage.setItem('userCampus', campus);
    }
    
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove(['userData', 'userCampus']);
    console.log('User data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const validateCampus = (campus: string | null): boolean => {
  return campus !== null && campus.trim() !== '';
}; 