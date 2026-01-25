import { Stack } from 'expo-router';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/components/I18nProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

import '@/global.css';

export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
