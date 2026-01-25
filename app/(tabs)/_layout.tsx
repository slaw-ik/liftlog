import { Tabs } from 'expo-router';

import { Dumbbell, History, Home, User } from 'lucide-react-native';
import { cssInterop, useColorScheme } from 'nativewind';

import { useI18n } from '@/components/I18nProvider';

// Enable className styling for icons
cssInterop(Home, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Dumbbell, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(History, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useI18n();

  return (
    <Tabs
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
          title: t('workout'),
          tabBarIcon: ({ focused }) => (
            <Home className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: t('history'),
          tabBarIcon: ({ focused }) => (
            <History className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: t('sections'),
          tabBarIcon: ({ focused }) => (
            <Dumbbell className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ focused }) => (
            <User className={focused ? 'text-primary' : 'text-muted-foreground'} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
