import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { RepsPicker, WeightPicker } from '@/components/NumberPicker';
import { ExerciseSelectorButton } from '@/components/workout/ExerciseSelectorButton';
import { ExerciseSelectorModal } from '@/components/workout/ExerciseSelectorModal';
import { GreetingHeader } from '@/components/workout/GreetingHeader';
import { RecentSetsScroll } from '@/components/workout/RecentSetsScroll';
import { SuccessOverlay } from '@/components/workout/SuccessOverlay';
import { TodayHeroCard } from '@/components/workout/TodayHeroCard';
import { WorkoutSection } from '@/components/workout/types';
import { WeeklyStatsRow } from '@/components/workout/WeeklyStatsRow';
import { WorkoutEmptyState } from '@/components/workout/WorkoutEmptyState';
import {
  createSet,
  createWorkout,
  Exercise,
  getAllExercises,
  getCategories,
  getLastSetPerExercise,
  getTodaySets,
  getWeeklyStats,
  getWorkoutsByDateRange,
  SetWithDetails,
} from '@/lib/database';

export default function WorkoutScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState<WorkoutSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<WorkoutSection | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [todaySetsData, setTodaySetsData] = useState<SetWithDetails[]>([]);
  const [weeklyStatsData, setWeeklyStatsData] = useState({ sets: 0, volume: 0, days: 0 });
  const [exerciseLastSets, setExerciseLastSets] = useState<Map<number, SetWithDetails>>(new Map());
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [categories, allExercises, todaySets, weeklyStats, lastSets] = await Promise.all([
        getCategories(),
        getAllExercises(),
        getTodaySets(),
        getWeeklyStats(),
        getLastSetPerExercise(),
      ]);
      setSections(
        categories.map((category) => ({
          id: category.toLowerCase().replace(/\s+/g, '_'),
          name: category,
          exercises: allExercises.filter((ex) => ex.category === category),
        }))
      );
      setTodaySetsData(todaySets);
      setWeeklyStatsData(weeklyStats);
      setExerciseLastSets(lastSets);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const saveWorkout = async () => {
    if (!selectedSection || !selectedExercise || !weight || !reps) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayWorkouts = await getWorkoutsByDateRange(
        todayStart.toISOString(),
        todayEnd.toISOString()
      );
      const workoutId =
        todayWorkouts.length > 0
          ? todayWorkouts[0].id
          : await createWorkout(new Date().toISOString());

      const weightValue = parseFloat(weight);
      const isBodyweight = weightValue === 0;
      await createSet(
        workoutId,
        selectedExercise.id,
        isBodyweight ? 1 : weightValue,
        parseInt(reps),
        isBodyweight ? 'bodyweight' : 'weighted',
        todaySetsData.length
      );

      await loadData();
      setShowSuccessAnimation(true);
      successTimerRef.current = setTimeout(() => {
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

  const recentSets = useMemo(() => todaySetsData.slice(0, 8), [todaySetsData]);

  const todayVolume = useMemo(
    () => todaySetsData.reduce((acc, set) => acc + set.weight * set.reps, 0),
    [todaySetsData]
  );

  const getLastExerciseStats = useCallback(
    (exerciseId: number) => {
      const lastSet = exerciseLastSets.get(exerciseId);
      return lastSet ? `${lastSet.weight}kg × ${lastSet.reps}` : t('noData');
    },
    [exerciseLastSets, t]
  );

  const handleExerciseSelect = useCallback(
    (exercise: Exercise) => {
      setSelectedExercise(exercise);
      const lastSet = exerciseLastSets.get(exercise.id);
      if (lastSet) {
        setWeight(lastSet.weight.toString());
        setReps(lastSet.reps.toString());
      }
    },
    [exerciseLastSets]
  );

  const handleExerciseSelectAndClose = useCallback(
    (exercise: Exercise) => {
      handleExerciseSelect(exercise);
      setShowExerciseModal(false);
    },
    [handleExerciseSelect]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SuccessOverlay visible={showSuccessAnimation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}
      >
        <GreetingHeader />

        <View className="mb-6 px-6">
          <TodayHeroCard todaySets={todaySetsData.length} todayVolume={todayVolume} />
          <WeeklyStatsRow {...weeklyStatsData} />
        </View>

        <View className="mb-6 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">{t('logWorkout')}</Text>
          </View>
          <ExerciseSelectorButton
            selectedSection={selectedSection}
            selectedExercise={selectedExercise}
            getLastExerciseStats={getLastExerciseStats}
            onPress={() => setShowExerciseModal(true)}
          />
          <View className="mb-4 flex-row gap-3">
            <WeightPicker value={weight} onValueChange={setWeight} label={`${t('weight')} (kg)`} />
            <RepsPicker value={reps} onValueChange={setReps} label={t('reps')} />
          </View>
          <TouchableOpacity
            onPress={saveWorkout}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary p-4"
            activeOpacity={0.85}
          >
            <Text className="text-lg font-bold text-primary-foreground">{t('saveSet')}</Text>
            <ArrowRight className="text-primary-foreground" size={20} />
          </TouchableOpacity>
        </View>

        {recentSets.length > 0 ? <RecentSetsScroll sets={recentSets} /> : <WorkoutEmptyState />}
      </ScrollView>

      <ExerciseSelectorModal
        visible={showExerciseModal}
        sections={sections}
        getLastExerciseStats={getLastExerciseStats}
        onSelectExercise={handleExerciseSelectAndClose}
        onClose={() => setShowExerciseModal(false)}
      />
    </SafeAreaView>
  );
}
