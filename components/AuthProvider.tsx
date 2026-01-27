import React, { createContext, useContext, useEffect, useState } from 'react';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
const GOOGLE_WEB_CLIENT_ID =
  '487709376366-41015sldp07vlgi2vqavikce6gudldq4.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID =
  '487709376366-hnn5cfo187mnip18utjpb7rorsdp6thb.apps.googleusercontent.com';

// ============================================================================
// Types
// ============================================================================

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Configure Google Auth Request
  // For iOS, expo-auth-session automatically uses the reversed client ID as redirect
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    // For Android standalone builds, you'd add: androidClientId: 'YOUR_ANDROID_CLIENT_ID'
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Google Sign-In error:', response.error);
      setIsSigningIn(false);
    } else if (response?.type === 'dismiss') {
      setIsSigningIn(false);
    }
  }, [response]);

  // Exchange Google token for Firebase credential
  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error('Firebase sign-in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Public sign-in method
  const signInWithGoogle = async () => {
    if (!request) {
      console.error('Google Auth request not ready');
      return;
    }

    setIsSigningIn(true);
    await promptAsync();
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSigningIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
