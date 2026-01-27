import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check, Dumbbell, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/AuthProvider';
import { GoogleLogo } from '@/components/GoogleLogo';
import { useI18n } from '@/components/I18nProvider';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { signInWithGoogle, isSigningIn, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(t('error'), t('googleSignInError') || 'Failed to sign in with Google');
    }
  };

  const handleSignup = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(t('error'), t('enterValidEmail'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(t('error'), t('acceptTerms'));
      return;
    }

    setLoading(true);

    try {
      // Mock user creation
      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        joinedDate: new Date().toISOString(),
      };

      // Save to AsyncStorage (mock authentication)
      await AsyncStorage.setItem('userAuth', JSON.stringify(newUser));

      Alert.alert(t('success'), t('accountCreatedWelcome'), [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      Alert.alert(t('error'), t('accountCreationError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Header */}
        <View className="px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10">
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
        </View>

        {/* Logo/Brand */}
        <View className="mt-4 items-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Dumbbell className="text-primary-foreground" size={40} />
          </View>
          <Text className="mb-2 text-3xl font-bold text-foreground">{t('createAccount')}</Text>
          <Text className="text-center text-muted-foreground">{t('startTrackingProgress')}</Text>
        </View>

        {/* Signup Form */}
        <View className="mt-8 px-6">
          {/* Name Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('name')}</Text>
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-input px-4 py-3">
              <User className="text-muted-foreground" size={20} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('yourName')}
                placeholderTextColor="#a8a29e"
                autoCapitalize="words"
                className="flex-1 text-foreground"
              />
            </View>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('email')}</Text>
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-input px-4 py-3">
              <Mail className="text-muted-foreground" size={20} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor="#a8a29e"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-foreground"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('password')}</Text>
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-input px-4 py-3">
              <Lock className="text-muted-foreground" size={20} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor="#a8a29e"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 text-foreground"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff className="text-muted-foreground" size={20} />
                ) : (
                  <Eye className="text-muted-foreground" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('confirmPassword')}</Text>
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-input px-4 py-3">
              <Lock className="text-muted-foreground" size={20} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('repeatPassword')}
                placeholderTextColor="#a8a29e"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                className="flex-1 text-foreground"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff className="text-muted-foreground" size={20} />
                ) : (
                  <Eye className="text-muted-foreground" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Acceptance */}
          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            className="mb-8 flex-row items-start gap-3"
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                acceptedTerms ? 'border-primary bg-primary' : 'border-border'
              }`}
            >
              {acceptedTerms && <Check className="text-primary-foreground" size={14} />}
            </View>
            <Text className="flex-1 text-sm text-foreground">
              {t('iAccept')} <Text className="font-medium text-primary">{t('termsOfUse')}</Text>{' '}
              {t('and')} <Text className="font-medium text-primary">{t('privacyPolicy')}</Text>
            </Text>
          </TouchableOpacity>

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className={`mb-4 rounded-xl bg-primary py-4 ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-center text-base font-semibold text-primary-foreground">
              {loading ? t('creatingAccount') : t('createAccount')}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="mb-4 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-4 text-muted-foreground">{t('or') || 'or'}</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            className={`mb-4 flex-row items-center justify-center gap-3 rounded-xl border border-border bg-white py-4 shadow-sm ${isSigningIn ? 'opacity-50' : ''}`}
            style={{ elevation: 1 }}
          >
            <GoogleLogo size={20} />
            <Text className="text-base font-medium text-gray-700">
              {isSigningIn ? t('signingIn') : t('continueWithGoogle')}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-muted-foreground">{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="font-semibold text-primary">{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Note */}
        <View className="mt-8 px-6">
          <View className="rounded-xl border border-border bg-muted/50 p-4">
            <Text className="mb-2 text-sm font-semibold text-foreground">🔒 {t('security')}</Text>
            <Text className="text-sm text-muted-foreground">{t('securityNote')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
