import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyATeDJFrRltXSQAbyLeLGq2LiuKecJrHCg',
  authDomain: 'liftlog-d77b8.firebaseapp.com',
  projectId: 'liftlog-d77b8',
  storageBucket: 'liftlog-d77b8.firebasestorage.app',
  messagingSenderId: '487709376366',
  appId: '1:487709376366:web:91b38a81598ca9e7e38b7f',
  measurementId: 'G-M0K94VZWJ8',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;
