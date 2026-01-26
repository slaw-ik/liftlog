import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { ArrowRight, Check, ChevronRight, Flame, Target, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { RepsPicker, WeightPicker } from '@/components/NumberPicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  createSet,
  createWorkout,
  Exercise,
  getAllExercises,
  getCategories,
  getSetsByExercise,
  getTodaySets,
  getWeeklyStats,
  getWorkoutsByDateRange,
  SetWithDetails,
} from '@/lib/database';

// Section type for UI grouping
type Section = {
  id: string;
  name: string;
  exercises: Exercise[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Get time-based greeting
const getGreeting = (
  t: (key: string) => string
): { greeting: string; emoji: string; subtitle: string } => {
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

export default function WorkoutScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [recentSets, setRecentSets] = useState<SetWithDetails[]>([]);
  const [todaySetsData, setTodaySetsData] = useState<SetWithDetails[]>([]);
  const [weeklyStatsData, setWeeklyStatsData] = useState({ sets: 0, volume: 0, days: 0 });
  const [exerciseLastSets, setExerciseLastSets] = useState<Map<number, SetWithDetails>>(new Map());
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const greetingData = useMemo(() => getGreeting(t), [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load categories and exercises from SQLite
      const categories = await getCategories();
      const allExercises = await getAllExercises();

      // Group exercises by category into sections
      const sectionsList: Section[] = categories.map((category) => ({
        id: category.toLowerCase().replace(/\s+/g, '_'),
        name: category,
        exercises: allExercises.filter((ex) => ex.category === category),
      }));
      setSections(sectionsList);

      // Load today's sets
      const todaySets = await getTodaySets();
      setTodaySetsData(todaySets);

      // Load weekly stats
      const stats = await getWeeklyStats();
      setWeeklyStatsData(stats);

      // Build recent sets list (use today's sets + we could add more)
      setRecentSets(todaySets.slice(0, 8));

      // Build last set map for each exercise
      const lastSetsMap = new Map<number, SetWithDetails>();
      for (const exercise of allExercises) {
        const exerciseSets = await getSetsByExercise(exercise.id);
        if (exerciseSets.length > 0) {
          lastSetsMap.set(exercise.id, exerciseSets[0]); // First one is most recent
        }
      }
      setExerciseLastSets(lastSetsMap);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveWorkout = async () => {
    if (!selectedSection || !selectedExercise || !weight || !reps) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    try {
      // Get or create today's workout
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayWorkouts = await getWorkoutsByDateRange(
        todayStart.toISOString(),
        todayEnd.toISOString()
      );

      let workoutId: number;
      if (todayWorkouts.length > 0) {
        workoutId = todayWorkouts[0].id;
      } else {
        workoutId = await createWorkout(new Date().toISOString());
      }

      // Create the set
      const weightValue = parseFloat(weight);
      const isBodyweight = weightValue === 0;
      await createSet(
        workoutId,
        selectedExercise.id,
        isBodyweight ? 1 : weightValue, // Use 1 for bodyweight exercises
        parseInt(reps),
        isBodyweight ? 'bodyweight' : 'weighted',
        todaySetsData.length // set order
      );

      // Reload data
      await loadData();

      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setSelectedSection(null);
        setSelectedExercise(null);
        setWeight('');
        setReps('');
        setShowExerciseModal(false);
      }, 1200);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(t('error'), String(error));
    }
  };

  const getLastExerciseStats = (exerciseId: number) => {
    const lastSet = exerciseLastSets.get(exerciseId);
    return lastSet ? `${lastSet.weight}kg × ${lastSet.reps}` : t('noData');
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);

    // Pre-fill weight and reps from last log
    const lastSet = exerciseLastSets.get(exercise.id);
    if (lastSet) {
      setWeight(lastSet.weight.toString());
      setReps(lastSet.reps.toString());
    }

    setShowExerciseModal(false);
  };

  const todaySets = todaySetsData.length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Success overlay */}
      {showSuccessAnimation && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/60">
          <View className="rounded-full bg-primary p-6">
            <Check className="text-primary-foreground" size={48} strokeWidth={3} />
          </View>
          <Text className="mt-4 text-xl font-bold text-white">{t('setAdded')}!</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}
      >
        {/* Header Section */}
        <View className="px-6 pb-6 pt-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-4xl">{greetingData.emoji}</Text>
              <Text className="text-3xl font-bold tracking-tight text-foreground">
                {greetingData.greeting}
              </Text>
              <Text className="mt-1 text-base text-muted-foreground">{greetingData.subtitle}</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Stats Section */}
        <View className="mb-6 px-6">
          {/* Hero Card - Today's Progress */}
          <View className="mb-4 rounded-2xl bg-primary p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Flame className="text-primary-foreground" size={20} />
                <Text className="text-base font-semibold text-primary-foreground">
                  {t('today')}
                </Text>
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
                    {todaySetsData
                      .reduce((acc, set) => acc + set.weight * set.reps, 0)
                      .toLocaleString()}{' '}
                    kg
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Weekly Stats Row - 3 equal cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Target className="text-accent" size={16} />
                <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('thisWeek')}
                </Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">{weeklyStatsData.days}</Text>
              <Text className="text-sm text-muted-foreground">{t('activeDays')}</Text>
            </View>

            <View className="flex-1 rounded-2xl border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Zap className="text-chart-3" size={16} />
                <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('thisWeek')}
                </Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">{weeklyStatsData.sets}</Text>
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
                {weeklyStatsData.volume >= 1000
                  ? `${(weeklyStatsData.volume / 1000).toFixed(1)}k`
                  : weeklyStatsData.volume}
              </Text>
              <Text className="text-sm text-muted-foreground">kg</Text>
            </View>
          </View>
        </View>

        {/* Log Workout Section */}
        <View className="mb-6 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">{t('logWorkout')}</Text>
          </View>

          {/* Exercise Selector */}
          <TouchableOpacity
            onPress={() => setShowExerciseModal(true)}
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
                      {selectedExercise.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-muted-foreground">
                      {selectedSection.name}
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
                  <View className="flex-row items-center">
                    <Text className="font-medium text-muted-foreground">
                      {t('chooseSectionExercise')}
                    </Text>
                  </View>
                )}
              </View>
              <View className="rounded-full bg-muted p-2.5">
                <ChevronRight className="text-muted-foreground" size={20} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Weight & Reps Pickers */}
          <View className="mb-4 flex-row gap-3">
            <WeightPicker value={weight} onValueChange={setWeight} label={`${t('weight')} (kg)`} />
            <RepsPicker value={reps} onValueChange={setReps} label={t('reps')} />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveWorkout}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary p-4"
            activeOpacity={0.85}
          >
            <Text className="text-lg font-bold text-primary-foreground">{t('saveSet')}</Text>
            <ArrowRight className="text-primary-foreground" size={20} />
          </TouchableOpacity>
        </View>

        {/* Recent Sets - Horizontal Scroll */}
        {recentSets.length > 0 && (
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between px-6">
              <Text className="text-xl font-bold text-foreground">{t('recentSets')}</Text>
              <Text className="text-sm text-muted-foreground">
                {recentSets.length} {t('total')}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              directionalLockEnabled={true}
              alwaysBounceVertical={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {recentSets.slice(0, 8).map((set) => {
                const isToday =
                  new Date(set.workout_date).toDateString() === new Date().toDateString();
                return (
                  <View
                    key={set.id}
                    className={`rounded-2xl p-4 ${isToday ? 'border-2 border-primary/30 bg-primary/10' : 'border border-border bg-card'}`}
                    style={{ width: SCREEN_WIDTH * 0.42 }}
                  >
                    {isToday && (
                      <View className="mb-2 self-start rounded-full bg-primary px-2 py-0.5">
                        <Text className="text-2xs font-bold text-primary-foreground">
                          {t('today')}
                        </Text>
                      </View>
                    )}
                    <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                      {set.exercise_name}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
                      {set.exercise_category}
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
        )}

        {/* Empty State */}
        {recentSets.length === 0 && (
          <View className="items-center px-6 py-12">
            <View className="mb-4 rounded-full bg-muted p-6">
              <Flame className="text-muted-foreground" size={32} />
            </View>
            <Text className="mb-2 text-lg font-semibold text-foreground">{t('noWorkoutsYet')}</Text>
            <Text className="max-w-xs text-center text-muted-foreground">
              {t('noWorkoutsYetSub')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal visible={showExerciseModal} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={() => {
              setSelectedSection(null);
              setShowExerciseModal(false);
            }}
          />
          <View className="rounded-t-3xl bg-background" style={{ maxHeight: '75%' }}>
            {/* Modal Handle */}
            <View className="items-center pb-2 pt-3">
              <View className="h-1 w-10 rounded-full bg-muted" />
            </View>

            <View className="border-b border-border px-6 pb-4">
              <Text className="text-2xl font-bold text-foreground">
                {selectedSection ? selectedSection.name : t('chooseSection')}
              </Text>
              {selectedSection && (
                <Text className="mt-1 text-sm text-muted-foreground">
                  {selectedSection.exercises.length} {t('exercises')}
                </Text>
              )}
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
              {!selectedSection
                ? sections.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      onPress={() => setSelectedSection(section)}
                      className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-card p-5"
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text className="text-lg font-bold text-foreground">{section.name}</Text>
                        <Text className="mt-1 text-sm text-muted-foreground">
                          {section.exercises.length} {t('exercises')}
                        </Text>
                      </View>
                      <ChevronRight className="text-muted-foreground" size={20} />
                    </TouchableOpacity>
                  ))
                : selectedSection.exercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => handleExerciseSelect(exercise)}
                      className="mb-3 rounded-2xl border border-border bg-card p-5"
                      activeOpacity={0.7}
                    >
                      <Text className="text-lg font-semibold text-foreground">{exercise.name}</Text>
                      <View className="mt-2 flex-row items-center">
                        <Text className="text-xs text-muted-foreground">
                          {t('last')}:{' '}
                          <Text className="text-foreground">
                            {getLastExerciseStats(exercise.id)}
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
            </ScrollView>

            <View className="gap-3 border-t border-border px-6 pb-8 pt-4">
              {selectedSection && (
                <TouchableOpacity
                  onPress={() => setSelectedSection(null)}
                  className="items-center rounded-2xl bg-secondary p-4"
                  activeOpacity={0.7}
                >
                  <Text className="font-semibold text-secondary-foreground">
                    {t('backToSections')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setSelectedSection(null);
                  setShowExerciseModal(false);
                }}
                className="items-center py-2"
                activeOpacity={0.7}
              >
                <Text className="font-medium text-muted-foreground">{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
