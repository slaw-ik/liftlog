import React from 'react';
import { Text, View } from 'react-native';

import { Activity, Calendar, TrendingUp } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = {
  uniqueDates: number;
  totalWorkouts: number;
  totalWeight: number;
};

export function StatsCards({ uniqueDates, totalWorkouts, totalWeight }: Props) {
  const { t } = useI18n();

  return (
    <View className="px-6 py-4">
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-border bg-card p-4">
          <Calendar className="mb-2 text-primary" size={20} />
          <Text className="text-2xl font-bold text-foreground">{uniqueDates}</Text>
          <Text className="text-xs text-muted-foreground">{t('trainingDays')}</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border bg-card p-4">
          <TrendingUp className="mb-2 text-primary" size={20} />
          <Text className="text-2xl font-bold text-foreground">{totalWorkouts}</Text>
          <Text className="text-xs text-muted-foreground">{t('totalSets')}</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border bg-card p-4">
          <Activity className="mb-2 text-accent" size={20} />
          <Text className="text-2xl font-bold text-foreground">
            {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)}k` : Math.round(totalWeight)}
          </Text>
          <Text className="text-xs text-muted-foreground">{t('totalKgReps')}</Text>
        </View>
      </View>
    </View>
  );
}
