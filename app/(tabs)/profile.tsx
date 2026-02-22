import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileText, LogOut, Settings, Shield, Trash2, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/AuthProvider';
import { GoogleLogo } from '@/components/GoogleLogo';
import { useI18n } from '@/components/I18nProvider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clearAllData, getAllSetsWithDetails } from '@/lib/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, isLoading, signOut, signInWithGoogle, isSigningIn } = useAuth();

  const formatDateForCSV = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return t('today');
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    }
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleExportData = async () => {
    const sets = await getAllSetsWithDetails();
    if (sets.length === 0) {
      Alert.alert(t('noData'), t('noLogsToExport'));
      return;
    }
    const headers = `${t('date')},${t('section')},${t('exercise')},${t('weight')} (kg),${t('reps')}\n`;
    const rows = sets
      .map(
        (set) =>
          `${formatDateForCSV(set.workout_date)},${set.exercise_category},${set.exercise_name},${set.weight},${set.reps}`
      )
      .join('\n');
    const csv = headers + rows;
    try {
      await Share.share({
        message: csv,
        title: t('workoutHistoryExport'),
      });
    } catch {
      Alert.alert(t('exportFailed'), t('couldNotExport'));
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(t('error'), t('googleSignInError') || 'Failed to sign in with Google');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(t('clearAllData'), t('clearDataConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllData();
            // Also clear any remaining AsyncStorage caches
            await AsyncStorage.removeItem('workoutLogs');
            await AsyncStorage.removeItem('workout_sections');
            Alert.alert(t('clearDataSuccess'));
          } catch (error) {
            Alert.alert('Error', String(error));
          }
        },
      },
    ]);
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateToSignup = () => {
    router.push('/signup');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Text className="text-2xl font-bold text-foreground">{t('profileTitle')}</Text>
            <ThemeToggle />
          </View>

          {/* Not Logged In Card */}
          <View className="mt-8 px-6">
            <View className="items-center rounded-xl border border-border bg-card p-8">
              <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-muted">
                <User className="text-muted-foreground" size={48} />
              </View>

              <Text className="mb-2 text-2xl font-bold text-foreground">{t('welcome')}</Text>
              <Text className="mb-8 text-center text-muted-foreground">{t('guestMessage')}</Text>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isSigningIn}
                className={`mb-3 w-full flex-row items-center justify-center gap-3 rounded-xl border border-border bg-white py-4 shadow-sm ${isSigningIn ? 'opacity-50' : ''}`}
                style={{ elevation: 1 }}
              >
                <GoogleLogo size={20} />
                <Text className="text-base font-medium text-gray-700">
                  {isSigningIn ? t('signingIn') : t('continueWithGoogle')}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="my-3 flex-row items-center">
                <View className="h-px flex-1 bg-border" />
                <Text className="mx-4 text-sm text-muted-foreground">{t('or') || 'or'}</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <TouchableOpacity
                onPress={navigateToLogin}
                className="mb-3 w-full rounded-xl bg-primary py-4"
              >
                <Text className="text-center text-base font-semibold text-primary-foreground">
                  {t('login')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={navigateToSignup}
                className="w-full rounded-xl bg-secondary py-4"
              >
                <Text className="text-center text-base font-semibold text-secondary-foreground">
                  {t('signup')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guest Settings */}
          <View className="mt-8 px-6">
            <Text className="mb-4 text-lg font-semibold text-foreground">{t('settings')}</Text>

            <View className="gap-2 overflow-hidden rounded-xl border border-border bg-card p-2">
              <View className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4">
                <View className="flex-row items-center gap-3">
                  <Settings className="text-foreground" size={20} />
                  <Text className="text-foreground">{t('settings')}</Text>
                </View>
                <ThemeToggle />
              </View>

              <LanguageSelector />

              <TouchableOpacity
                onPress={handleClearAllData}
                className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
              >
                <View className="flex-row items-center gap-3">
                  <Trash2 className="text-destructive" size={20} />
                  <Text className="text-destructive">{t('clearAllData')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Logged in state
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-2xl font-bold text-foreground">{t('profileTitle')}</Text>
          <ThemeToggle />
        </View>

        {/* Profile Card */}
        <View className="mt-4 px-6">
          <View className="rounded-xl border border-border bg-card p-6">
            <View className="items-center">
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} className="mb-4 h-24 w-24 rounded-full" />
              ) : (
                <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary">
                  <Text className="text-3xl font-bold text-primary-foreground">
                    {user.displayName?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text className="mb-1 text-2xl font-bold text-foreground">
                {user.displayName || t('user') || 'User'}
              </Text>
              <Text className="mb-1 text-muted-foreground">{user.email}</Text>
              {user.metadata.creationTime && (
                <Text className="text-sm text-muted-foreground">
                  {t('memberSince')} {new Date(user.metadata.creationTime).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="mt-8 px-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">{t('settings')}</Text>

          <View className="mb-4 gap-2 overflow-hidden rounded-xl border border-border bg-card p-2">
            <View className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4">
              <View className="flex-row items-center gap-3">
                <Settings className="text-foreground" size={20} />
                <Text className="text-foreground">{t('settings')}</Text>
              </View>
              <ThemeToggle />
            </View>

            <LanguageSelector />
          </View>
        </View>

        {/* Data Management */}
        <View className="mt-4 px-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">{t('dataManagement')}</Text>

          <View className="mb-4 gap-2 overflow-hidden rounded-xl border border-border bg-card p-2">
            <TouchableOpacity
              onPress={handleExportData}
              className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
            >
              <View className="flex-row items-center gap-3">
                <FileText className="text-foreground" size={20} />
                <Text className="text-foreground">{t('exportData')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAllData}
              className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
            >
              <View className="flex-row items-center gap-3">
                <Trash2 className="text-destructive" size={20} />
                <Text className="text-destructive">{t('clearAllData')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className="mt-4 px-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">{t('about')}</Text>

          <View className="mb-4 rounded-xl border border-border bg-card p-4">
            <View className="mb-2 flex-row items-center gap-3">
              <Shield className="text-primary" size={20} />
              <Text className="font-semibold text-foreground">LiftLog</Text>
            </View>
            <Text className="text-sm text-muted-foreground">{t('version')} 1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View className="mt-4 px-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 py-4"
          >
            <LogOut className="text-destructive" size={20} />
            <Text className="text-base font-semibold text-destructive">{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
