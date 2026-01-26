import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell,
  Database,
  Download,
  Edit,
  FileText,
  LogOut,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clearAllData } from '@/lib/database';
import { getImportPreview, importTrainingsToDatabase } from '@/lib/importTrainings';

type UserProfile = {
  name: string;
  email: string;
  joinedDate: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authData = await AsyncStorage.getItem('userAuth');
      if (authData) {
        const user = JSON.parse(authData);
        setUserProfile(user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userAuth');
          setIsLoggedIn(false);
          setUserProfile(null);
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('fillAllFields'));
      return;
    }

    if (userProfile) {
      const updatedProfile = { ...userProfile, name: editName.trim() };
      await AsyncStorage.setItem('userAuth', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      setEditModalVisible(false);
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

  const handleImportTrainings = () => {
    try {
      const preview = getImportPreview();
      Alert.alert(
        'Import Training Data',
        `This will import:\n\n` +
          `• ${preview.totalSessions} workout sessions\n` +
          `• ${preview.totalSets} total sets\n` +
          `• ${preview.uniqueExercises} unique exercises\n` +
          `• Date range: ${preview.dateRange.from} - ${preview.dateRange.to}\n\n` +
          `This will REPLACE your current workout data.`,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const result = await importTrainingsToDatabase(true);
                Alert.alert(
                  'Import Complete!',
                  `Successfully imported:\n` +
                    `• ${result.workoutsCreated} workout sessions\n` +
                    `• ${result.setsCreated} sets\n` +
                    `• ${result.exercisesCreated} exercises`
                );
              } catch (error) {
                Alert.alert('Import Failed', String(error));
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Preview Failed', String(error));
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateToSignup = () => {
    router.push('/signup');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
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
                onPress={handleImportTrainings}
                className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
              >
                <View className="flex-row items-center gap-3">
                  <Download className="text-primary" size={20} />
                  <Text className="text-foreground">Import Training Data</Text>
                </View>
                <Text className="text-sm text-primary">39 sessions</Text>
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
            <View className="mb-6 items-center">
              <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary">
                <Text className="text-3xl font-bold text-primary-foreground">
                  {userProfile?.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <Text className="mb-1 text-2xl font-bold text-foreground">{userProfile?.name}</Text>
              <Text className="mb-1 text-muted-foreground">{userProfile?.email}</Text>
              <Text className="text-sm text-muted-foreground">
                {t('memberSince')} {new Date(userProfile?.joinedDate || '').toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditProfile}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-secondary py-3"
            >
              <Edit className="text-secondary-foreground" size={18} />
              <Text className="font-semibold text-secondary-foreground">{t('editProfile')}</Text>
            </TouchableOpacity>
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

            <View className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4 opacity-50">
              <View className="flex-row items-center gap-3">
                <Bell className="text-foreground" size={20} />
                <Text className="text-foreground">{t('notifications')}</Text>
              </View>
              <Text className="text-sm text-muted-foreground">Soon</Text>
            </View>

            <View className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4 opacity-50">
              <View className="flex-row items-center gap-3">
                <Database className="text-foreground" size={20} />
                <Text className="text-foreground">{t('units')}</Text>
              </View>
              <Text className="text-sm text-muted-foreground">Soon</Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View className="mt-4 px-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">{t('dataManagement')}</Text>

          <View className="mb-4 gap-2 overflow-hidden rounded-xl border border-border bg-card p-2">
            <TouchableOpacity
              onPress={handleImportTrainings}
              className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
            >
              <View className="flex-row items-center gap-3">
                <Download className="text-primary" size={20} />
                <Text className="text-foreground">Import Training Data</Text>
              </View>
              <Text className="text-sm text-primary">39 sessions</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between rounded-lg bg-muted/50 p-4 opacity-50">
              <View className="flex-row items-center gap-3">
                <FileText className="text-foreground" size={20} />
                <Text className="text-foreground">Export Data</Text>
              </View>
              <Text className="text-sm text-muted-foreground">Soon</Text>
            </View>

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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-6">
          <View className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">{t('editProfile')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X className="text-foreground" size={24} />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">{t('yourName')}</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={t('yourName')}
                className="rounded-xl bg-muted px-4 py-3 text-foreground"
                placeholderTextColor="#999"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 rounded-xl bg-secondary py-3"
              >
                <Text className="text-center font-semibold text-secondary-foreground">
                  {t('cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3"
              >
                <Save className="text-primary-foreground" size={18} />
                <Text className="text-center font-semibold text-primary-foreground">
                  {t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
