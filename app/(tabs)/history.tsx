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

import AsyncStorage from '@react-native-async-storage/async-storage';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Types
type WorkoutLog = {
  id: string;
  date: string;
  sectionId: string;
  sectionName: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
};

type Section = {
  id: string;
  name: string;
};

type ExerciseProgress = {
  exerciseName: string;
  logs: WorkoutLog[];
  maxWeight: number;
  totalSets: number;
  avgReps: number;
};

type ChartView = 'overview' | 'exercise';

export default function HistoryScreen() {
  const { t, locale } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<WorkoutLog[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseProgress | null>(null);
  const [chartView, setChartView] = useState<ChartView>('overview');
  const [selectedChartExercise, setSelectedChartExercise] = useState<string>('all');

  // Filter states
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterExercise, setFilterExercise] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'week' | 'month' | 'all'>('all');

  // Expanded log IDs
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

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
      const logsData = await AsyncStorage.getItem('workoutLogs');
      const sectionsData = await AsyncStorage.getItem('workout_sections');

      if (logsData) {
        const parsedLogs = JSON.parse(logsData);
        parsedLogs.sort(
          (a: WorkoutLog, b: WorkoutLog) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLogs(parsedLogs);
        applyFiltersToLogs(parsedLogs, filterSection, filterExercise, filterDateRange);
      }

      if (sectionsData) {
        setSections(JSON.parse(sectionsData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFiltersToLogs = (
    logsToFilter: WorkoutLog[],
    section: string,
    exercise: string,
    dateRange: 'week' | 'month' | 'all'
  ) => {
    let filtered = [...logsToFilter];

    if (section !== 'all') {
      filtered = filtered.filter((log) => log.sectionId === section);
    }

    if (exercise !== 'all') {
      filtered = filtered.filter((log) => log.exerciseName === exercise);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((log) => new Date(log.date) >= cutoffDate);
    }

    setFilteredLogs(filtered);
  };

  const applyFilters = () => {
    applyFiltersToLogs(logs, filterSection, filterExercise, filterDateRange);
  };

  // Re-apply filters when filter state changes
  useMemo(() => {
    if (logs.length > 0) {
      applyFiltersToLogs(logs, filterSection, filterExercise, filterDateRange);
    }
  }, [filterSection, filterExercise, filterDateRange]);

  const clearFilters = () => {
    setFilterSection('all');
    setFilterExercise('all');
    setFilterDateRange('all');
  };

  const getUniqueExercises = () => {
    const exercises = new Set<string>();
    logs.forEach((log) => exercises.add(log.exerciseName));
    return Array.from(exercises).sort();
  };

  const getExerciseProgress = (exerciseName: string): ExerciseProgress => {
    const exerciseLogs = logs.filter((log) => log.exerciseName === exerciseName);
    const maxWeight = Math.max(...exerciseLogs.map((log) => log.weight));
    const totalSets = exerciseLogs.length;
    const avgReps = exerciseLogs.reduce((sum, log) => sum + log.reps, 0) / totalSets;

    return {
      exerciseName,
      logs: exerciseLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      maxWeight,
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
    if (filteredLogs.length === 0) {
      Alert.alert(t('noData'), t('noLogsToExport'));
      return;
    }

    const headers = `${t('date')},${t('section')},${t('exercise')},${t('weight')} (kg),${t('reps')}\n`;
    const rows = filteredLogs
      .map(
        (log) =>
          `${formatDate(log.date)},${log.sectionName},${log.exerciseName},${log.weight},${log.reps}`
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

  const deleteLog = async (logId: string) => {
    Alert.alert(t('deleteWorkout'), t('confirmDeleteWorkout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          const updatedLogs = logs.filter((log) => log.id !== logId);
          setLogs(updatedLogs);
          await AsyncStorage.setItem('workoutLogs', JSON.stringify(updatedLogs));
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

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const groupLogsByDate = () => {
    const grouped: { [key: string]: WorkoutLog[] } = {};
    filteredLogs.forEach((log) => {
      const dateKey = new Date(log.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
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

      const daySets = logs.filter((log) => new Date(log.date).toDateString() === dateStr).length;

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
  }, [logs, locale, chartColors]);

  // Generate exercise weight progression data
  const getExerciseChartData = useMemo(() => {
    if (selectedChartExercise === 'all' || !selectedChartExercise) {
      return [];
    }

    const exerciseLogs = logs
      .filter((log) => log.exerciseName === selectedChartExercise)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15); // Last 15 entries

    return exerciseLogs.map((log, index) => ({
      value: log.weight,
      label: formatShortDate(log.date),
      dataPointText: `${log.weight}`,
    }));
  }, [selectedChartExercise, logs]);

  // Progress modal chart data
  const getProgressChartData = useMemo(() => {
    if (!selectedExercise) {
      return [];
    }

    return selectedExercise.logs.slice(-15).map((log) => ({
      value: log.weight,
      label: formatShortDate(log.date),
      dataPointText: `${log.weight}`,
    }));
  }, [selectedExercise]);

  const groupedLogs = groupLogsByDate();
  const dateKeys = Object.keys(groupedLogs);

  // Calculate stats
  const totalWorkouts = filteredLogs.length;
  const totalWeight = filteredLogs.reduce((sum, log) => sum + log.weight * log.reps, 0);
  const uniqueDates = new Set(filteredLogs.map((log) => new Date(log.date).toDateString())).size;

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
        {logs.length > 0 && (
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
                    {t('weightProgress')}
                  </Text>
                  <Text className="mb-3 text-sm text-muted-foreground">
                    {t('selectExerciseToView')}
                  </Text>

                  {/* Exercise Selector */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginBottom: 16 }}
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
                        yAxisLabelSuffix=" kg"
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
          {filteredLogs.length === 0 ? (
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
              const dateLogs = groupedLogs[dateKey];
              const firstLog = dateLogs[0];
              const displayDate = formatDate(firstLog.date);

              return (
                <View key={dateKey} className="mb-6">
                  <Text className="mb-3 text-lg font-bold text-foreground">{displayDate}</Text>

                  <View className="gap-3">
                    {dateLogs.map((log) => {
                      const isExpanded = expandedLogs.has(log.id);

                      return (
                        <View
                          key={log.id}
                          className="overflow-hidden rounded-2xl border border-border bg-card"
                        >
                          <TouchableOpacity
                            onPress={() => toggleLogExpansion(log.id)}
                            className="p-4"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="text-base font-bold text-foreground">
                                  {log.exerciseName}
                                </Text>
                                <Text className="mt-1 text-sm text-muted-foreground">
                                  {log.sectionName}
                                </Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-lg font-bold text-primary">
                                  {log.weight} {t('kg')} × {log.reps}
                                </Text>
                                <Text className="mt-1 text-xs text-muted-foreground">
                                  {formatTime(log.date)}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {isExpanded && (
                            <View className="border-t border-border px-4 pb-4 pt-3">
                              <View className="flex-row gap-3">
                                <TouchableOpacity
                                  onPress={() => viewExerciseProgress(log.exerciseName)}
                                  className="flex-1 rounded-xl bg-secondary px-4 py-3"
                                >
                                  <Text className="text-center text-sm font-medium text-secondary-foreground">
                                    {t('viewProgress')}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => deleteLog(log.id)}
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
                  {sections.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      onPress={() => setFilterSection(section.id)}
                      className={`rounded-xl border px-4 py-3 ${
                        filterSection === section.id
                          ? 'border-primary bg-primary'
                          : 'border-border bg-card'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          filterSection === section.id
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {section.name}
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

                {/* All Logs */}
                <Text className="mb-3 text-lg font-bold text-foreground">
                  {t('completeHistory')}
                </Text>
                <View className="gap-2">
                  {selectedExercise.logs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <View key={log.id} className="rounded-xl border border-border bg-card p-4">
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="text-sm font-medium text-foreground">
                              {formatDate(log.date)} {t('at')} {formatTime(log.date)}
                            </Text>
                            <Text className="mt-1 text-xs text-muted-foreground">
                              {log.sectionName}
                            </Text>
                          </View>
                          <Text className="text-lg font-bold text-primary">
                            {log.weight} {t('kg')} × {log.reps}
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
