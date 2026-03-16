import React from 'react';
import { Text, View } from 'react-native';

import { Flame } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = { todaySets: number; todayVolume: number };

export function TodayHeroCard({ todaySets, todayVolume }: Props) {
  const { t } = useI18n();

  return (
    <View className="mb-4 rounded-2xl bg-primary p-6">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Flame className="text-primary-foreground" size={20} />
          <Text className="text-base font-semibold text-primary-foreground">{t('today')}</Text>
        </View>
        <View className="rounded-full bg-primary-foreground/20 px-3 py-1">
          <Text className="text-xs font-medium text-primary-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-6xl font-bold tracking-tighter text-primary-foreground">
            {todaySets}
          </Text>
          <Text className="mt-1 text-sm font-medium text-primary-foreground/70">
            {t('setsCompleted')}
          </Text>
        </View>
        {todaySets > 0 && (
          <View className="items-end">
            <Text className="text-xs text-primary-foreground/70">{t('todayVolume')}</Text>
            <Text className="text-lg font-bold text-primary-foreground">
              {todayVolume.toLocaleString()} kg
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
