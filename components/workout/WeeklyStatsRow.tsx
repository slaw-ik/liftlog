import React from 'react';
import { Text, View } from 'react-native';

import { Target, Zap } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = { days: number; sets: number; volume: number };

export function WeeklyStatsRow({ days, sets, volume }: Props) {
  const { t } = useI18n();

  return (
    <View className="flex-row gap-3">
      <View className="flex-1 rounded-2xl border border-border bg-card p-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Target className="text-accent" size={16} />
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('thisWeek')}
          </Text>
        </View>
        <Text className="text-3xl font-bold text-foreground">{days}</Text>
        <Text className="text-sm text-muted-foreground">{t('activeDays')}</Text>
      </View>

      <View className="flex-1 rounded-2xl border border-border bg-card p-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Zap className="text-chart-3" size={16} />
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('thisWeek')}
          </Text>
        </View>
        <Text className="text-3xl font-bold text-foreground">{sets}</Text>
        <Text className="text-sm text-muted-foreground">{t('totalSets')}</Text>
      </View>

      <View className="flex-1 rounded-2xl border border-border bg-card p-4">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-4 w-4 rounded-full bg-chart-1" />
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('volume')}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">
          {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}
        </Text>
        <Text className="text-sm text-muted-foreground">kg</Text>
      </View>
    </View>
  );
}
