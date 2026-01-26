import { Tabs } from 'expo-router';

import { Dumbbell, History, Home, User } from 'lucide-react-native';
import { cssInterop, useColorScheme } from 'nativewind';

import { useI18n } from '@/components/I18nProvider';
import i18n from '@/lib/i18n';

// Enable className styling for icons
cssInterop(Home, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Dumbbell, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(History, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { locale } = useI18n();

  // Read translations directly from i18n, using locale to trigger re-renders
  const workoutLabel = locale ? i18n.t('workout') : i18n.t('workout');
  const historyLabel = locale ? i18n.t('history') : i18n.t('history');
  const sectionsLabel = locale ? i18n.t('sections') : i18n.t('sections');
  const profileLabel = locale ? i18n.t('profile') : i18n.t('profile');

  return (
    <Tabs
      key={`tabs-${locale}`}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderTopColor: isDark ? '#262626' : '#e4e4e7',
        },
        tabBarActiveTintColor: isDark ? '#e4e4e7' : '#18181b',
        tabBarInactiveTintColor: isDark ? '#a1a1aa' : '#71717a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: workoutLabel,
          tabBarIcon: ({ focused }) => (
            <Home className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: historyLabel,
          tabBarIcon: ({ focused }) => (
            <History className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: sectionsLabel,
          tabBarIcon: ({ focused }) => (
            <Dumbbell className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: profileLabel,
          tabBarIcon: ({ focused }) => (
            <User className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
