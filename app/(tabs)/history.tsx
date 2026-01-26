import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  Filter,
  LineChart,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { BarChart, LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { deleteSet, getAllSetsWithDetails, getCategories, SetWithDetails } from '@/lib/database';
import { calculateE1RM, getProgressValue, ProgressMetric } from '@/lib/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Types for UI
type ExerciseProgress = {
  exerciseName: string;
  sets: SetWithDetails[];
  maxWeight: number;
  maxE1RM: number;
  totalSets: number;
  avgReps: number;
};

type ChartView = 'overview' | 'exercise';

export default function HistoryScreen() {
  const { t, locale } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [allSets, setAllSets] = useState<SetWithDetails[]>([]);
  const [filteredSets, setFilteredSets] = useState<SetWithDetails[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseProgress | null>(null);
  const [chartView, setChartView] = useState<ChartView>('overview');
  const [selectedChartExercise, setSelectedChartExercise] = useState<string>('all');
  const [progressMetric, setProgressMetric] = useState<ProgressMetric>('e1rm');

  // Filter states
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterExercise, setFilterExercise] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'week' | 'month' | 'all'>('all');

  // Expanded log IDs
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  // Theme colors for charts
  const chartColors = useMemo(
    () => ({
      primary: isDark ? '#A3E635' : '#84CC16',
      secondary: isDark ? '#2DD4BF' : '#14B8A6',
      text: isDark ? '#FAFAFA' : '#0F0F0F',
      textMuted: isDark ? '#94A3B8' : '#64748B',
      background: isDark ? '#161616' : '#FFFFFF',
      card: isDark ? '#262626' : '#F1F5F9',
      grid: isDark ? '#262626' : '#E2E8F0',
    }),
    [isDark]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const sets = await getAllSetsWithDetails();
      const cats = await getCategories();

      setAllSets(sets);
      setCategories(cats);
      applyFiltersToSets(sets, filterSection, filterExercise, filterDateRange);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFiltersToSets = (
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
      filtered = filtered.filter((set) => set.exercise_name === exercise);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((set) => new Date(set.workout_date) >= cutoffDate);
    }

    setFilteredSets(filtered);
  };

  // Re-apply filters when filter state changes
  useMemo(() => {
    if (allSets.length > 0) {
      applyFiltersToSets(allSets, filterSection, filterExercise, filterDateRange);
    }
  }, [filterSection, filterExercise, filterDateRange, allSets]);

  const clearFilters = () => {
    setFilterSection('all');
    setFilterExercise('all');
    setFilterDateRange('all');
  };

  const getUniqueExercises = () => {
    const exercises = new Set<string>();
    allSets.forEach((set) => exercises.add(set.exercise_name));
    return Array.from(exercises).sort();
  };

  const getExerciseProgress = (exerciseName: string): ExerciseProgress => {
    const exerciseSets = allSets.filter((set) => set.exercise_name === exerciseName);
    const maxWeight = Math.max(...exerciseSets.map((set) => set.weight), 0);
    const maxE1RM = Math.max(...exerciseSets.map((set) => calculateE1RM(set.weight, set.reps)), 0);
    const totalSets = exerciseSets.length;
    const avgReps =
      totalSets > 0 ? exerciseSets.reduce((sum, set) => sum + set.reps, 0) / totalSets : 0;

    return {
      exerciseName,
      sets: exerciseSets.sort(
        (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
      ),
      maxWeight,
      maxE1RM: Math.round(maxE1RM * 10) / 10,
      totalSets,
      avgReps: Math.round(avgReps * 10) / 10,
    };
  };

  const viewExerciseProgress = (exerciseName: string) => {
    const progress = getExerciseProgress(exerciseName);
    setSelectedExercise(progress);
    setShowProgressModal(true);
  };

  const exportToCSV = async () => {
    if (filteredSets.length === 0) {
      Alert.alert(t('noData'), t('noLogsToExport'));
      return;
    }

    const headers = `${t('date')},${t('section')},${t('exercise')},${t('weight')} (kg),${t('reps')}\n`;
    const rows = filteredSets
      .map(
        (set) =>
          `${formatDate(set.workout_date)},${set.exercise_category},${set.exercise_name},${set.weight},${set.reps}`
      )
      .join('\n');

    const csv = headers + rows;

    try {
      await Share.share({
        message: csv,
        title: t('workoutHistoryExport'),
      });
    } catch (error) {
      Alert.alert(t('exportFailed'), t('couldNotExport'));
    }
  };

  const handleDeleteSet = async (setId: number) => {
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleLogExpansion = (setId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
    }
    setExpandedLogs(newExpanded);
  };

  const groupSetsByDate = () => {
    const grouped: { [key: string]: SetWithDetails[] } = {};
    filteredSets.forEach((set) => {
      const dateKey = new Date(set.workout_date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(set);
    });
    return grouped;
  };

  // Generate weekly activity data for bar chart
  const getWeeklyActivityData = useMemo(() => {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      const daySets = allSets.filter(
        (set) => new Date(set.workout_date).toDateString() === dateStr
      ).length;

      const dayName = date.toLocaleDateString(locale, { weekday: 'short' });

      last7Days.push({
        value: daySets,
        label: dayName,
        frontColor: daySets > 0 ? chartColors.primary : chartColors.card,
        topLabelComponent: () =>
          daySets > 0 ? (
            <Text style={{ color: chartColors.text, fontSize: 10, marginBottom: 4 }}>
              {daySets}
            </Text>
          ) : null,
      });
    }

    return last7Days;
  }, [allSets, locale, chartColors]);

  // Generate exercise progression data based on selected metric
  const getExerciseChartData = useMemo(() => {
    if (selectedChartExercise === 'all' || !selectedChartExercise) {
      return [];
    }

    const exerciseSets = allSets
      .filter((set) => set.exercise_name === selectedChartExercise)
      .sort((a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime())
      .slice(-15); // Last 15 entries

    return exerciseSets.map((set) => {
      const value = getProgressValue(set.weight, set.reps, progressMetric);
      return {
        value,
        label: formatShortDate(set.workout_date),
        dataPointText: `${value}`,
      };
    });
  }, [selectedChartExercise, allSets, progressMetric]);

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
  }, [selectedExercise, progressMetric]);

  const groupedSets = groupSetsByDate();
  const dateKeys = Object.keys(groupedSets);

  // Calculate stats
  const totalWorkouts = filteredSets.length;
  const totalWeight = filteredSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const uniqueDates = new Set(filteredSets.map((set) => new Date(set.workout_date).toDateString()))
    .size;

  const activeFiltersCount =
    (filterSection !== 'all' ? 1 : 0) +
    (filterExercise !== 'all' ? 1 : 0) +
    (filterDateRange !== 'all' ? 1 : 0);

  const exercises = getUniqueExercises();

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
      >
        {/* Stats Cards */}
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
                {totalWeight >= 1000
                  ? `${(totalWeight / 1000).toFixed(1)}k`
                  : Math.round(totalWeight)}
              </Text>
              <Text className="text-xs text-muted-foreground">{t('totalKgReps')}</Text>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        {allSets.length > 0 && (
          <View className="mb-4 px-6">
            {/* Chart View Toggle */}
            <View className="mb-4 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setChartView('overview')}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${
                  chartView === 'overview' ? 'border-primary bg-primary' : 'border-border bg-card'
                }`}
              >
                <BarChart3
                  size={16}
                  color={
                    chartView === 'overview' ? (isDark ? '#0A0A0A' : '#0F0F0F') : chartColors.text
                  }
                />
                <Text
                  className={`font-medium ${
                    chartView === 'overview' ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {t('weeklyActivity')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartView('exercise')}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${
                  chartView === 'exercise' ? 'border-primary bg-primary' : 'border-border bg-card'
                }`}
              >
                <LineChart
                  size={16}
                  color={
                    chartView === 'exercise' ? (isDark ? '#0A0A0A' : '#0F0F0F') : chartColors.text
                  }
                />
                <Text
                  className={`font-medium ${
                    chartView === 'exercise' ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {t('progress')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chart Content */}
            <View className="rounded-2xl border border-border bg-card p-4">
              {chartView === 'overview' ? (
                <View>
                  <Text className="mb-1 text-lg font-bold text-foreground">{t('setsPerDay')}</Text>
                  <Text className="mb-4 text-sm text-muted-foreground">{t('last7Days')}</Text>
                  <View style={{ marginLeft: -10 }}>
                    <BarChart
                      data={getWeeklyActivityData}
                      width={CHART_WIDTH - 20}
                      height={150}
                      barWidth={28}
                      spacing={16}
                      roundedTop
                      roundedBottom
                      noOfSections={4}
                      yAxisThickness={0}
                      xAxisThickness={1}
                      xAxisColor={chartColors.grid}
                      rulesColor={chartColors.grid}
                      rulesType="solid"
                      xAxisLabelTextStyle={{
                        color: chartColors.textMuted,
                        fontSize: 10,
                      }}
                      yAxisTextStyle={{
                        color: chartColors.textMuted,
                        fontSize: 10,
                      }}
                      hideRules={false}
                      barBorderRadius={6}
                      isAnimated
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text className="mb-1 text-lg font-bold text-foreground">
                    {t('exerciseProgress')}
                  </Text>
                  <Text className="mb-3 text-sm text-muted-foreground">
                    {t('selectExerciseToView')}
                  </Text>

                  {/* Exercise Selector */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                  >
                    {exercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise}
                        onPress={() => setSelectedChartExercise(exercise)}
                        className={`rounded-full border px-4 py-2 ${
                          selectedChartExercise === exercise
                            ? 'border-primary bg-primary'
                            : 'border-border bg-secondary'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedChartExercise === exercise
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {exercise}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Metric Toggle */}
                  <View className="mb-4 flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setProgressMetric('e1rm')}
                      className={`flex-1 rounded-lg border px-3 py-2 ${
                        progressMetric === 'e1rm'
                          ? 'border-primary bg-primary/20'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <Text
                        className={`text-center text-xs font-medium ${
                          progressMetric === 'e1rm' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {t('estimated1RM')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setProgressMetric('volume')}
                      className={`flex-1 rounded-lg border px-3 py-2 ${
                        progressMetric === 'volume'
                          ? 'border-primary bg-primary/20'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <Text
                        className={`text-center text-xs font-medium ${
                          progressMetric === 'volume' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {t('volume')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setProgressMetric('weight')}
                      className={`flex-1 rounded-lg border px-3 py-2 ${
                        progressMetric === 'weight'
                          ? 'border-primary bg-primary/20'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <Text
                        className={`text-center text-xs font-medium ${
                          progressMetric === 'weight' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {t('weightOnly')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Line Chart */}
                  {selectedChartExercise && getExerciseChartData.length > 0 ? (
                    <View style={{ marginLeft: -10 }}>
                      <GiftedLineChart
                        data={getExerciseChartData}
                        width={CHART_WIDTH - 20}
                        height={180}
                        spacing={40}
                        thickness={3}
                        color={chartColors.primary}
                        dataPointsColor={chartColors.primary}
                        dataPointsRadius={5}
                        noOfSections={4}
                        yAxisThickness={0}
                        xAxisThickness={1}
                        xAxisColor={chartColors.grid}
                        rulesColor={chartColors.grid}
                        rulesType="solid"
                        xAxisLabelTextStyle={{
                          color: chartColors.textMuted,
                          fontSize: 9,
                          width: 40,
                          textAlign: 'center',
                        }}
                        yAxisTextStyle={{
                          color: chartColors.textMuted,
                          fontSize: 10,
                        }}
                        hideDataPoints={false}
                        curved
                        isAnimated
                        animationDuration={800}
                        startFillColor={chartColors.primary}
                        endFillColor={chartColors.background}
                        startOpacity={0.3}
                        endOpacity={0.05}
                        areaChart
                        yAxisLabelSuffix={
                          progressMetric === 'e1rm' ? '' : progressMetric === 'volume' ? '' : ' kg'
                        }
                      />
                    </View>
                  ) : (
                    <View className="h-40 items-center justify-center">
                      <LineChart size={32} color={chartColors.textMuted} />
                      <Text className="mt-2 text-center text-muted-foreground">
                        {t('selectExerciseAbove')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 px-6 pb-4">
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="flex-1 flex-row items-center justify-center rounded-xl border border-border bg-card px-4 py-3"
          >
            <Filter className="mr-2 text-foreground" size={18} />
            <Text className="font-medium text-foreground">
              {t('filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exportToCSV}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-primary px-4 py-3"
          >
            <Download className="mr-2 text-primary-foreground" size={18} />
            <Text className="font-medium text-primary-foreground">{t('exportCSV')}</Text>
          </TouchableOpacity>
        </View>

        {/* Workout History List */}
        <View className="px-6">
          {filteredSets.length === 0 ? (
            <View className="items-center py-16">
              <Calendar className="mb-4 text-muted-foreground" size={48} />
              <Text className="text-center text-xl font-bold text-foreground">
                {t('noWorkoutsYet')}
              </Text>
              <Text className="mt-2 text-center text-muted-foreground">
                {activeFiltersCount > 0 ? t('noWorkoutsMatchFilters') : t('startLoggingWorkouts')}
              </Text>
            </View>
          ) : (
            dateKeys.map((dateKey) => {
              const dateSets = groupedSets[dateKey];
              const firstSet = dateSets[0];
              const displayDate = formatDate(firstSet.workout_date);

              return (
                <View key={dateKey} className="mb-6">
                  <Text className="mb-3 text-lg font-bold text-foreground">{displayDate}</Text>

                  <View className="gap-3">
                    {dateSets.map((set) => {
                      const isExpanded = expandedLogs.has(set.id);

                      return (
                        <View
                          key={set.id}
                          className="overflow-hidden rounded-2xl border border-border bg-card"
                        >
                          <TouchableOpacity
                            onPress={() => toggleLogExpansion(set.id)}
                            className="p-4"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="text-base font-bold text-foreground">
                                  {set.exercise_name}
                                </Text>
                                <Text className="mt-1 text-sm text-muted-foreground">
                                  {set.exercise_category}
                                </Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-lg font-bold text-primary">
                                  {set.weight} {t('kg')} × {set.reps}
                                </Text>
                                <Text className="mt-1 text-xs text-muted-foreground">
                                  {formatTime(set.created_at)}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {isExpanded && (
                            <View className="border-t border-border px-4 pb-4 pt-3">
                              <View className="flex-row gap-3">
                                <TouchableOpacity
                                  onPress={() => viewExerciseProgress(set.exercise_name)}
                                  className="flex-1 rounded-xl bg-secondary px-4 py-3"
                                >
                                  <Text className="text-center text-sm font-medium text-secondary-foreground">
                                    {t('viewProgress')}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleDeleteSet(set.id)}
                                  className="flex-1 rounded-xl bg-destructive px-4 py-3"
                                >
                                  <Text className="text-center text-sm font-medium text-white">
                                    {t('delete')}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-background p-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-foreground">{t('filters')}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X className="text-foreground" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Range Filter */}
              <View className="mb-6">
                <Text className="mb-3 text-sm font-medium text-foreground">{t('dateRange')}</Text>
                <View className="flex-row gap-2">
                  {(['all', 'week', 'month'] as const).map((range) => (
                    <TouchableOpacity
                      key={range}
                      onPress={() => setFilterDateRange(range)}
                      className={`flex-1 rounded-xl border px-4 py-3 ${
                        filterDateRange === range
                          ? 'border-primary bg-primary'
                          : 'border-border bg-card'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          filterDateRange === range ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {range === 'all'
                          ? t('allTime')
                          : range === 'week'
                            ? t('last7Days')
                            : t('last30Days')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Section Filter */}
              <View className="mb-6">
                <Text className="mb-3 text-sm font-medium text-foreground">{t('section')}</Text>
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => setFilterSection('all')}
                    className={`rounded-xl border px-4 py-3 ${
                      filterSection === 'all'
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filterSection === 'all' ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {t('allSections')}
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setFilterSection(category)}
                      className={`rounded-xl border px-4 py-3 ${
                        filterSection === category
                          ? 'border-primary bg-primary'
                          : 'border-border bg-card'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          filterSection === category ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Exercise Filter */}
              <View className="mb-6">
                <Text className="mb-3 text-sm font-medium text-foreground">{t('exercise')}</Text>
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => setFilterExercise('all')}
                    className={`rounded-xl border px-4 py-3 ${
                      filterExercise === 'all'
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filterExercise === 'all' ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {t('allExercises')}
                    </Text>
                  </TouchableOpacity>
                  {exercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise}
                      onPress={() => setFilterExercise(exercise)}
                      className={`rounded-xl border px-4 py-3 ${
                        filterExercise === exercise
                          ? 'border-primary bg-primary'
                          : 'border-border bg-card'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          filterExercise === exercise
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {exercise}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="mt-4 flex-row gap-3">
                <TouchableOpacity
                  onPress={clearFilters}
                  className="flex-1 rounded-xl bg-secondary px-4 py-4"
                >
                  <Text className="text-center font-bold text-secondary-foreground">
                    {t('clearAll')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  className="flex-1 rounded-xl bg-primary px-4 py-4"
                >
                  <Text className="text-center font-bold text-primary-foreground">
                    {t('applyFilters')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exercise Progress Modal */}
      <Modal visible={showProgressModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-3xl bg-background p-6">
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">
                  {selectedExercise?.exerciseName}
                </Text>
                <Text className="text-sm text-muted-foreground">{t('progressOverview')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProgressModal(false)}>
                <X className="text-foreground" size={24} />
              </TouchableOpacity>
            </View>

            {selectedExercise && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View className="mb-6 flex-row gap-3">
                  <View className="flex-1 rounded-xl border border-border bg-card p-4">
                    <Text className="mb-1 text-xs text-muted-foreground">{t('maxWeight')}</Text>
                    <Text className="text-2xl font-bold text-primary">
                      {selectedExercise.maxWeight} {t('kg')}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border border-border bg-card p-4">
                    <Text className="mb-1 text-xs text-muted-foreground">{t('estimated1RM')}</Text>
                    <Text className="text-2xl font-bold text-primary">
                      {selectedExercise.maxE1RM} {t('kg')}
                    </Text>
                  </View>
                </View>
                <View className="mb-6 flex-row gap-3">
                  <View className="flex-1 rounded-xl border border-border bg-card p-4">
                    <Text className="mb-1 text-xs text-muted-foreground">{t('totalSets')}</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {selectedExercise.totalSets}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border border-border bg-card p-4">
                    <Text className="mb-1 text-xs text-muted-foreground">{t('avgReps')}</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {selectedExercise.avgReps}
                    </Text>
                  </View>
                </View>

                {/* Progress Line Chart */}
                {getProgressChartData.length > 1 && (
                  <View className="mb-6 rounded-xl border border-border bg-card p-4">
                    <Text className="mb-4 text-lg font-bold text-foreground">
                      {t('weightProgress')}
                    </Text>
                    <View style={{ marginLeft: -10 }}>
                      <GiftedLineChart
                        data={getProgressChartData}
                        width={CHART_WIDTH - 40}
                        height={160}
                        spacing={35}
                        thickness={3}
                        color={chartColors.primary}
                        dataPointsColor={chartColors.primary}
                        dataPointsRadius={5}
                        noOfSections={4}
                        yAxisThickness={0}
                        xAxisThickness={1}
                        xAxisColor={chartColors.grid}
                        rulesColor={chartColors.grid}
                        rulesType="solid"
                        xAxisLabelTextStyle={{
                          color: chartColors.textMuted,
                          fontSize: 8,
                          width: 35,
                        }}
                        yAxisTextStyle={{
                          color: chartColors.textMuted,
                          fontSize: 10,
                        }}
                        curved
                        isAnimated
                        startFillColor={chartColors.primary}
                        endFillColor={chartColors.background}
                        startOpacity={0.3}
                        endOpacity={0.05}
                        areaChart
                      />
                    </View>
                  </View>
                )}

                {/* All Sets */}
                <Text className="mb-3 text-lg font-bold text-foreground">
                  {t('completeHistory')}
                </Text>
                <View className="gap-2">
                  {selectedExercise.sets
                    .slice()
                    .reverse()
                    .map((set) => (
                      <View key={set.id} className="rounded-xl border border-border bg-card p-4">
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="text-sm font-medium text-foreground">
                              {formatDate(set.workout_date)} {t('at')} {formatTime(set.created_at)}
                            </Text>
                            <Text className="mt-1 text-xs text-muted-foreground">
                              {set.exercise_category}
                            </Text>
                          </View>
                          <Text className="text-lg font-bold text-primary">
                            {set.weight} {t('kg')} × {set.reps}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
