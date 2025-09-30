import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Firebase project configuration
// Project: Final Year Project
// Project ID: final-year-project-ab6b7
const firebaseConfig = {
  apiKey: "AIzaSyAQOSzX1BouczUcYusKi_jPytvNTeUEEpw",
  authDomain: "final-year-project-ab6b7.firebaseapp.com",
  projectId: "final-year-project-ab6b7",
  storageBucket: "final-year-project-ab6b7.firebasestorage.app",
  messagingSenderId: "374437192055",
  appId: "1:374437192055:web:a8e6cc2057cf42a5858172"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Use AsyncStorage for persistence in React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Initialize Firestore
const db = getFirestore(app);

// ✅ Initialize Firebase Storage
const storage = getStorage(app);

// ✅ Initialize Cloud Functions
const functions = getFunctions(app);

// ✅ Connect to emulators in development
if (__DEV__) {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app, auth, db, storage, functions };
