import React from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { useI18n } from '@/components/I18nProvider';
import { getExerciseDisplayName, SetWithDetails } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

type Props = { sets: SetWithDetails[] };

export function RecentSetsScroll({ sets }: Props) {
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();

  if (sets.length === 0) {
    return null;
  }

  const todayString = new Date().toDateString();

  return (
    <View className="mb-6">
      <View className="mb-4 flex-row items-center justify-between px-6">
        <Text className="text-xl font-bold text-foreground">{t('recentSets')}</Text>
        <Text className="text-sm text-muted-foreground">
          {sets.length} {t('total')}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled={true}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {sets.map((set) => {
          const isToday = new Date(set.workout_date).toDateString() === todayString;
          return (
            <View
              key={set.id}
              className={`rounded-2xl p-4 ${isToday ? 'border-2 border-primary/30 bg-primary/10' : 'border border-border bg-card'}`}
              style={{ width: screenWidth * 0.42 }}
            >
              {isToday && (
                <View className="mb-2 self-start rounded-full bg-primary px-2 py-0.5">
                  <Text className="text-2xs font-bold text-primary-foreground">{t('today')}</Text>
                </View>
              )}
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {getExerciseDisplayName(set.exercise_name, set.exercise_i18n_key ?? null, t)}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
                {getCategoryDisplayName(set.exercise_category, t)}
              </Text>
              <View className="mt-3 flex-row items-baseline">
                <Text className="text-2xl font-bold text-foreground">{set.weight}</Text>
                <Text className="ml-1 text-sm text-muted-foreground">kg</Text>
                <Text className="mx-2 text-muted-foreground">×</Text>
                <Text className="text-2xl font-bold text-foreground">{set.reps}</Text>
              </View>
              {!isToday && (
                <Text className="mt-2 text-2xs text-muted-foreground">
                  {new Date(set.workout_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
