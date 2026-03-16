import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '@/components/I18nProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

const getGreeting = (t: (key: string) => string) => {
  const hour = new Date().getHours();
  if (hour < 6) {
    return { greeting: t('greetingNight'), emoji: '🌙', subtitle: t('greetingNightSub') };
  }
  if (hour < 12) {
    return { greeting: t('greetingMorning'), emoji: '☀️', subtitle: t('greetingMorningSub') };
  }
  if (hour < 17) {
    return { greeting: t('greetingAfternoon'), emoji: '💪', subtitle: t('greetingAfternoonSub') };
  }
  if (hour < 21) {
    return { greeting: t('greetingEvening'), emoji: '🔥', subtitle: t('greetingEveningSub') };
  }
  return { greeting: t('greetingNight'), emoji: '🌙', subtitle: t('greetingNightSub') };
};

export function GreetingHeader() {
  const { t } = useI18n();
  const { emoji, greeting, subtitle } = useMemo(() => getGreeting(t), [t]);

  return (
    <View className="px-6 pb-6 pt-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-4xl">{emoji}</Text>
          <Text className="text-3xl font-bold tracking-tight text-foreground">{greeting}</Text>
          <Text className="mt-1 text-base text-muted-foreground">{subtitle}</Text>
        </View>
        <ThemeToggle />
      </View>
    </View>
  );
}
