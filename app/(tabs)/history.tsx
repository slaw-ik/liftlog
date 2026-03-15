import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { addMonths, format, subMonths } from 'date-fns';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarView } from '@/components/history/CalendarView';
import { EditSetModal } from '@/components/history/EditSetModal';
import { FiltersModal } from '@/components/history/FiltersModal';
import { ProgressChart } from '@/components/history/ProgressChart';
import type { ExerciseProgress } from '@/components/history/ProgressModal';
import { ProgressModal } from '@/components/history/ProgressModal';
import { StatsCards } from '@/components/history/StatsCards';
import { ViewModeToggle } from '@/components/history/ViewModeToggle';
import { WorkoutList } from '@/components/history/WorkoutList';
import { useI18n } from '@/components/I18nProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  deleteSet,
  getAllSetsWithDetails,
  getCategories,
  SetWithDetails,
  updateSet,
} from '@/lib/database';
import { calculateE1RM, getProgressValue, ProgressMetric } from '@/lib/fitness';
import { useChartColors } from '@/lib/useChartColors';

export default function HistoryScreen() {
  const { t, locale } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const chartColors = useChartColors();

  const [allSets, setAllSets] = useState<SetWithDetails[]>([]);
  const [filteredSets, setFilteredSets] = useState<SetWithDetails[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseProgress | null>(null);
  const [selectedChartExercise, setSelectedChartExercise] = useState<string>('all');
  const [progressMetric, setProgressMetric] = useState<ProgressMetric>('e1rm');

  // View mode: progress chart vs calendar (default calendar)
  const [viewMode, setViewMode] = useState<'progress' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // Filter states
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterExercise, setFilterExercise] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'week' | 'month' | 'all'>('all');

  // Expanded log IDs
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  // Edit set modal
  const [editingSet, setEditingSet] = useState<SetWithDetails | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Loading state - only show on first load
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Run queries in parallel - limit to last 500 sets for performance
      const [sets, cats] = await Promise.all([getAllSetsWithDetails(500), getCategories()]);

      setAllSets(sets);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Always reload data when screen comes into focus so new sets appear immediately
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const applyFiltersToSets = useCallback(
    (
      setsToFilter: SetWithDetails[],
      section: string,
      exercise: string,
      dateRange: 'week' | 'month' | 'all'
    ) => {
      let filtered = [...setsToFilter];

      if (section !== 'all') {
        filtered = filtered.filter((set) => set.exercise_category === section);
      }

      if (exercise !== 'all') {
        filtered = filtered.filter(
          (set) => (set.exercise_i18n_key ?? set.exercise_name) === exercise
        );
      }

      if (dateRange !== 'all') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (dateRange === 'week' ? 7 : 30));
        const cutoffStr = format(cutoff, 'yyyy-MM-dd');
        filtered = filtered.filter((set) => set.workout_date >= cutoffStr);
      }

      return filtered;
    },
    []
  );

  // Single source of truth: derive filteredSets from allSets + filter state (fixes new sets not showing)
  useEffect(() => {
    const filtered = applyFiltersToSets(allSets, filterSection, filterExercise, filterDateRange);
    setFilteredSets(filtered);
  }, [allSets, filterSection, filterExercise, filterDateRange, applyFiltersToSets]);

  const clearFilters = () => {
    setFilterSection('all');
    setFilterExercise('all');
    setFilterDateRange('all');
  };

  // Ordered by most recent use; scoped to filteredSets so only in-range exercises appear.
  // filteredSets preserves the DB order (workout_date DESC), so first occurrence = most recent.
  const exercises = useMemo(() => {
    const seen = new Set<string>();
    for (const set of filteredSets) {
      seen.add(set.exercise_i18n_key ?? set.exercise_name);
    }
    return Array.from(seen);
  }, [filteredSets]);

  const getExerciseProgress = useCallback(
    (exerciseStableId: string): ExerciseProgress => {
      const exerciseSets = allSets.filter(
        (set) => (set.exercise_i18n_key ?? set.exercise_name) === exerciseStableId
      );
      let maxWeight = 0;
      let maxE1RM = 0;
      let totalReps = 0;
      for (const set of exerciseSets) {
        if (set.weight > maxWeight) {
          maxWeight = set.weight;
        }
        const e1rm = calculateE1RM(set.weight, set.reps);
        if (e1rm > maxE1RM) {
          maxE1RM = e1rm;
        }
        totalReps += set.reps;
      }
      const totalSets = exerciseSets.length;
      const avgReps = totalSets > 0 ? totalReps / totalSets : 0;

      return {
        exerciseName: exerciseStableId,
        sets: exerciseSets.sort((a, b) => (a.workout_date < b.workout_date ? -1 : 1)),
        maxWeight,
        maxE1RM: Math.round(maxE1RM * 10) / 10,
        totalSets,
        avgReps: Math.round(avgReps * 10) / 10,
      };
    },
    [allSets]
  );

  const viewExerciseProgress = useCallback(
    (exerciseStableId: string) => {
      const progress = getExerciseProgress(exerciseStableId);
      setSelectedExercise(progress);
      setShowProgressModal(true);
    },
    [getExerciseProgress]
  );

  const handleDeleteSet = useCallback(
    (setId: number) => {
      Alert.alert(t('deleteWorkout'), t('confirmDeleteWorkout'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSet(setId);
              await loadData();
            } catch (error) {
              Alert.alert('Error', String(error));
            }
          },
        },
      ]);
    },
    [t, loadData]
  );

  const openEditSet = useCallback((set: SetWithDetails) => {
    setEditingSet(set);
    setEditWeight(set.weight.toString());
    setEditReps(set.reps.toString());
  }, []);

  const closeEditSet = useCallback(() => {
    setEditingSet(null);
    setEditWeight('');
    setEditReps('');
    setIsSavingEdit(false);
  }, []);

  const collapseExpanded = useCallback(() => {
    setExpandedLogs(new Set());
  }, []);

  const handleSaveEditSet = useCallback(async () => {
    if (!editingSet || isSavingEdit) {
      return;
    }
    const weight = parseFloat(editWeight);
    const reps = parseInt(editReps, 10);
    if (Number.isNaN(weight) || Number.isNaN(reps) || weight < 0 || reps < 1) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    setIsSavingEdit(true);
    try {
      const setId = editingSet.id;
      await updateSet(setId, weight, reps, editingSet.load_type);
      await loadData();
      setExpandedLogs((prev) => {
        const next = new Set(prev);
        next.delete(setId);
        return next;
      });
      closeEditSet();
    } catch (error) {
      Alert.alert(t('error'), String(error));
    } finally {
      setIsSavingEdit(false);
    }
  }, [editingSet, editWeight, editReps, isSavingEdit, t, loadData, closeEditSet]);

  const formatDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return t('today');
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return t('yesterday');
      }
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    },
    [t, locale]
  );

  const formatShortDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    },
    [locale]
  );

  const formatTime = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [locale]
  );

  const toggleLogExpansion = useCallback((setId: number) => {
    setExpandedLogs((prev) => {
      if (prev.has(setId)) {
        return new Set<number>();
      }
      return new Set([setId]);
    });
  }, []);

  // Days that have at least one set (for calendar highlighting)
  const daysWithWorkouts = useMemo(() => {
    const set = new Set<string>();
    filteredSets.forEach((s) => set.add(s.workout_date.slice(0, 10)));
    return set;
  }, [filteredSets]);

  // When a day is selected in calendar, show only that day in the list; otherwise all
  const setsForList = useMemo(() => {
    if (!selectedDate) {
      return filteredSets;
    }
    return filteredSets.filter((set) => set.workout_date.slice(0, 10) === selectedDate);
  }, [filteredSets, selectedDate]);

  const groupedSets = useMemo(() => {
    const grouped: { [key: string]: SetWithDetails[] } = {};
    setsForList.forEach((set) => {
      const dateKey = set.workout_date.slice(0, 10);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(set);
    });
    // Within each day, show most recent sets first (last logged at top)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
    });
    return grouped;
  }, [setsForList]);

  // Generate exercise progression data based on selected metric
  const getExerciseChartData = useMemo(() => {
    if (selectedChartExercise === 'all' || !selectedChartExercise) {
      return [];
    }

    const exerciseSets = allSets
      .filter((set) => (set.exercise_i18n_key ?? set.exercise_name) === selectedChartExercise)
      .sort((a, b) => (a.workout_date < b.workout_date ? -1 : 1))
      .slice(-15);

    return exerciseSets.map((set) => {
      const value = getProgressValue(set.weight, set.reps, progressMetric);
      return {
        value,
        label: formatShortDate(set.workout_date),
        dataPointText: `${Math.round(value)}`,
      };
    });
  }, [selectedChartExercise, allSets, progressMetric, formatShortDate]);

  // Progress modal chart data
  const getProgressChartData = useMemo(() => {
    if (!selectedExercise) {
      return [];
    }

    return selectedExercise.sets.slice(-15).map((set) => {
      const value = getProgressValue(set.weight, set.reps, progressMetric);
      return {
        value,
        label: formatShortDate(set.workout_date),
        dataPointText: `${value}`,
      };
    });
  }, [selectedExercise, progressMetric, formatShortDate]);

  const dateKeys = useMemo(() => Object.keys(groupedSets), [groupedSets]);

  const reversedExerciseSets = useMemo(
    () => selectedExercise?.sets.slice().reverse() ?? [],
    [selectedExercise]
  );

  // Calculate stats - memoized
  const { totalWorkouts, totalWeight, uniqueDates } = useMemo(() => {
    const total = filteredSets.length;
    const weight = filteredSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    const dates = new Set(filteredSets.map((set) => set.workout_date.slice(0, 10))).size;
    return { totalWorkouts: total, totalWeight: weight, uniqueDates: dates };
  }, [filteredSets]);

  const activeFiltersCount = useMemo(
    () =>
      (filterSection !== 'all' ? 1 : 0) +
      (filterExercise !== 'all' ? 1 : 0) +
      (filterDateRange !== 'all' ? 1 : 0),
    [filterSection, filterExercise, filterDateRange]
  );

  const todayDateString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Show loading indicator on initial load
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-6 py-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">{t('workoutHistory')}</Text>
            <Text className="text-sm text-muted-foreground">{t('loading')}...</Text>
          </View>
          <ThemeToggle />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={chartColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-6 py-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">{t('workoutHistory')}</Text>
          <Text className="text-sm text-muted-foreground">
            {totalWorkouts} {t('totalSetsLogged')}
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}
        onScrollBeginDrag={collapseExpanded}
      >
        <Pressable onPress={collapseExpanded} style={{ flex: 1 }}>
          {allSets.length > 0 && (
            <StatsCards
              uniqueDates={uniqueDates}
              totalWorkouts={totalWorkouts}
              totalWeight={totalWeight}
            />
          )}

          {allSets.length > 0 && viewMode === 'progress' && (
            <ProgressChart
              exercises={exercises}
              selectedExercise={selectedChartExercise}
              onSelectExercise={setSelectedChartExercise}
              chartData={getExerciseChartData}
            />
          )}

          {allSets.length > 0 && viewMode === 'calendar' && (
            <CalendarView
              calendarMonth={calendarMonth}
              onPrevMonth={() => setCalendarMonth((m) => subMonths(m, 1))}
              onNextMonth={() => setCalendarMonth((m) => addMonths(m, 1))}
              daysWithWorkouts={daysWithWorkouts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onJumpToMonth={setCalendarMonth}
              todayDateString={todayDateString}
            />
          )}

          {allSets.length > 0 && (
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenFilters={() => setShowFilters(true)}
              activeFiltersCount={activeFiltersCount}
            />
          )}

          <View className="px-6">
            <WorkoutList
              dateKeys={dateKeys}
              groupedSets={groupedSets}
              expandedLogs={expandedLogs}
              onToggle={toggleLogExpansion}
              onEdit={openEditSet}
              onViewProgress={viewExerciseProgress}
              onDelete={handleDeleteSet}
              formatDate={formatDate}
              formatTime={formatTime}
              selectedDate={selectedDate}
              activeFiltersCount={activeFiltersCount}
              totalSetsCount={setsForList.length}
            />
          </View>
        </Pressable>
      </ScrollView>

      <EditSetModal
        editingSet={editingSet}
        editWeight={editWeight}
        editReps={editReps}
        isSavingEdit={isSavingEdit}
        onWeightChange={setEditWeight}
        onRepsChange={setEditReps}
        onSave={handleSaveEditSet}
        onClose={closeEditSet}
      />

      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        categories={categories}
        exercises={exercises}
        filterSection={filterSection}
        filterExercise={filterExercise}
        filterDateRange={filterDateRange}
        onSectionChange={setFilterSection}
        onExerciseChange={setFilterExercise}
        onDateRangeChange={setFilterDateRange}
        onClearFilters={clearFilters}
      />

      <ProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        selectedExercise={selectedExercise}
        chartData={getProgressChartData}
        reversedSets={reversedExerciseSets}
        progressMetric={progressMetric}
        formatDate={formatDate}
        formatTime={formatTime}
      />
    </SafeAreaView>
  );
}
