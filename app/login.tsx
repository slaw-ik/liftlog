import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Dumbbell, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(t('error'), t('validEmailRequired'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      // Mock authentication - check if user exists
      const existingUser = await AsyncStorage.getItem('userAuth');

      if (existingUser) {
        const userData = JSON.parse(existingUser);

        // Simple mock validation (in real app, validate against backend)
        if (userData.email === email.toLowerCase().trim()) {
          Alert.alert(t('success'), t('loginSuccessful'));
          router.replace('/(tabs)');
          return;
        }
      }

      // If no user found, show error
      Alert.alert(t('error'), t('invalidCredentials'));
    } catch (error) {
      Alert.alert(t('error'), t('loginError'));
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
        <View className="mt-8 items-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Dumbbell className="text-primary-foreground" size={40} />
          </View>
          <Text className="mb-2 text-3xl font-bold text-foreground">{t('welcomeBack')}</Text>
          <Text className="text-center text-muted-foreground">{t('loginToContinue')}</Text>
        </View>

        {/* Login Form */}
        <View className="mt-12 px-6">
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

          {/* Remember Me */}
          <View className="mb-8 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center gap-2"
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded border-2 ${
                  rememberMe ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {rememberMe && <View className="h-2 w-2 rounded-sm bg-primary-foreground" />}
              </View>
              <Text className="text-foreground">{t('rememberMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="font-medium text-primary">{t('forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`mb-4 rounded-xl bg-primary py-4 ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-center text-base font-semibold text-primary-foreground">
              {loading ? t('loggingIn') : t('login')}
            </Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-muted-foreground">{t('noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text className="font-semibold text-primary">{t('signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Credentials */}
        <View className="mt-12 px-6">
          <View className="rounded-xl border border-border bg-muted/50 p-4">
            <Text className="mb-2 text-sm font-semibold text-foreground">💡 {t('demoMode')}</Text>
            <Text className="text-sm text-muted-foreground">{t('demoModeDescription')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
