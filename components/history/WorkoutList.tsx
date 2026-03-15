import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Calendar, Edit, Trash2, TrendingUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { useI18n } from '@/components/I18nProvider';
import { getExerciseDisplayName, SetWithDetails } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

// Icon colors match button text (same semantic color per action for UI consistency)
const ACTION_COLORS = {
  light: { primary: '#84cc16', foreground: '#0f0f0f', onDestructive: '#ffffff' },
  dark: { primary: '#a3e635', foreground: '#fafafa', onDestructive: '#ffffff' },
} as const;

// Memoized set item to prevent re-renders
const SetItem = memo(function SetItem({
  set,
  isExpanded,
  onToggle,
  onEdit,
  onViewProgress,
  onDelete,
  t,
  formatTime,
  iconColors,
}: {
  set: SetWithDetails;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onViewProgress: () => void;
  onDelete: () => void;
  t: (key: string) => string;
  formatTime: (date: string) => string;
  iconColors: { primary: string; foreground: string; onDestructive: string };
}) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <TouchableOpacity onPress={onToggle} className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {getExerciseDisplayName(set.exercise_name, set.exercise_i18n_key ?? null, t)}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {getCategoryDisplayName(set.exercise_category, t)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-primary">
              {set.weight} {t('kg')} × {set.reps}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">{formatTime(set.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="border-t border-border px-4 pb-4 pt-3">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onEdit}
              activeOpacity={0.8}
              className="min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary/15"
            >
              <Edit color={iconColors.primary} size={18} />
              <Text className="text-sm font-semibold text-primary">{t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onViewProgress}
              activeOpacity={0.8}
              className="min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-muted/80"
            >
              <TrendingUp color={iconColors.foreground} size={18} />
              <Text className="text-sm font-semibold text-foreground">{t('viewProgress')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.8}
              className="min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-destructive"
            >
              <Trash2 color={iconColors.onDestructive} size={18} />
              <Text className="text-sm font-semibold text-white">{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

type Props = {
  dateKeys: string[];
  groupedSets: Record<string, SetWithDetails[]>;
  expandedLogs: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (set: SetWithDetails) => void;
  onViewProgress: (stableId: string) => void;
  onDelete: (id: number) => void;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  selectedDate: string | null;
  activeFiltersCount: number;
  totalSetsCount: number;
};

export function WorkoutList({
  dateKeys,
  groupedSets,
  expandedLogs,
  onToggle,
  onEdit,
  onViewProgress,
  onDelete,
  formatDate,
  formatTime,
  selectedDate,
  activeFiltersCount,
  totalSetsCount,
}: Props) {
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColors = ACTION_COLORS[isDark ? 'dark' : 'light'];

  if (totalSetsCount === 0) {
    return (
      <View className="items-center py-16">
        <Calendar className="mb-4 text-muted-foreground" size={48} />
        <Text className="text-center text-xl font-bold text-foreground">
          {selectedDate ? t('noWorkoutsOnThisDay') : t('noWorkoutsYet')}
        </Text>
        {!selectedDate && (
          <Text className="mt-2 text-center text-muted-foreground">
            {activeFiltersCount > 0 ? t('noWorkoutsMatchFilters') : t('startLoggingWorkouts')}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      {dateKeys
        .filter((dateKey) => (groupedSets[dateKey]?.length ?? 0) > 0)
        .map((dateKey) => {
          const dateSets = groupedSets[dateKey]!;
          const firstSet = dateSets[0]!;
          const displayDate = formatDate(firstSet.workout_date);

          return (
            <View key={dateKey} className="mb-6">
              <Text className="mb-3 text-lg font-bold text-foreground">{displayDate}</Text>
              <View className="gap-3">
                {dateSets.map((set) => (
                  <SetItem
                    key={set.id}
                    set={set}
                    isExpanded={expandedLogs.has(set.id)}
                    onToggle={() => onToggle(set.id)}
                    onEdit={() => onEdit(set)}
                    onViewProgress={() =>
                      onViewProgress(set.exercise_i18n_key ?? set.exercise_name)
                    }
                    onDelete={() => onDelete(set.id)}
                    t={t}
                    formatTime={formatTime}
                    iconColors={iconColors}
                  />
                ))}
              </View>
            </View>
          );
        })}
    </>
  );
}
