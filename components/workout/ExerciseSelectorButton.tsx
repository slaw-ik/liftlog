import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ChevronRight } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { Exercise, getExerciseDisplayName } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

import { WorkoutSection } from './types';

type Props = {
  selectedSection: WorkoutSection | null;
  selectedExercise: Exercise | null;
  getLastExerciseStats: (exerciseId: number) => string;
  onPress: () => void;
};

export function ExerciseSelectorButton({
  selectedSection,
  selectedExercise,
  getLastExerciseStats,
  onPress,
}: Props) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4 rounded-2xl border-2 border-dashed border-border bg-card p-5"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {t('sectionAndExercise')}
          </Text>
          {selectedSection && selectedExercise ? (
            <View>
              <Text className="text-lg font-semibold text-foreground">
                {getExerciseDisplayName(
                  selectedExercise.name,
                  selectedExercise.i18n_key ?? null,
                  t
                )}
              </Text>
              <Text className="mt-0.5 text-sm text-muted-foreground">
                {getCategoryDisplayName(selectedSection.name, t)}
              </Text>
              <View className="mt-2 flex-row items-center self-start rounded-lg bg-muted px-2.5 py-1.5">
                <Text className="text-xs text-muted-foreground">
                  {t('last')}:{' '}
                  <Text className="font-medium text-foreground">
                    {getLastExerciseStats(selectedExercise.id)}
                  </Text>
                </Text>
              </View>
            </View>
          ) : (
            <Text className="font-medium text-muted-foreground">{t('chooseSectionExercise')}</Text>
          )}
        </View>
        <View className="rounded-full bg-muted p-2.5">
          <ChevronRight className="text-muted-foreground" size={20} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
