import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { NameInputModal } from '@/components/sections/NameInputModal';
import { SectionCard } from '@/components/sections/SectionCard';
import { SectionsEmptyState } from '@/components/sections/SectionsEmptyState';
import { SectionsSection } from '@/components/sections/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  createExercise,
  DefaultExerciseDefinition,
  deleteExercise,
  Exercise,
  getAllExercises,
  getCategories,
  hasExercises,
  seedDefaultExercises,
  updateExercise,
} from '@/lib/database';
import { getEnglishDefaultExerciseName } from '@/lib/i18n';

export default function SectionsScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState<SectionsSection[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionName, setSectionName] = useState('');

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseName, setExerciseName] = useState('');

  const loadSections = useCallback(async () => {
    try {
      const [hasData, categories, allExercises] = await Promise.all([
        hasExercises(),
        getCategories(),
        getAllExercises(),
      ]);
      setIsEmpty(!hasData);
      setSections(
        categories.map((category) => ({
          name: category,
          exercises: allExercises.filter((ex) => ex.category === category),
        }))
      );
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSections();
    }, [loadSections])
  );

  const getDefaultExercises = (): DefaultExerciseDefinition[] => {
    const pulls = t('defaultSections.pulls');
    const presses = t('defaultSections.presses');
    const legs = t('defaultSections.legs');

    const keysPulls = [
      'upperPull',
      'narrowGrip',
      'lowerPull',
      'dumbbellRow',
      'pullover',
      'deadlift',
      'barbellCurl',
      'extension',
      'trapezius',
      'pullUps',
      'forearm',
    ];
    const keysPresses = [
      'benchPress',
      'inclineDumbbellPress',
      'seatedPress',
      'flyDumbbell',
      'lateralRaise',
      'pushdown',
      'seatedFlye',
      'rearDelt',
      'dipsPause',
    ];
    const keysLegs = [
      'squats',
      'lunges',
      'quadriceps',
      'hamstring',
      'hipAbduction',
      'hipAdduction',
      'calfRaise',
      'cableSquat',
      'legPress',
      'gluteBridge',
    ];

    return [
      ...keysPulls.map((key) => ({
        name: getEnglishDefaultExerciseName(key),
        category: pulls,
        i18n_key: `defaultExercises.${key}` as const,
      })),
      ...keysPresses.map((key) => ({
        name: getEnglishDefaultExerciseName(key),
        category: presses,
        i18n_key: `defaultExercises.${key}` as const,
      })),
      ...keysLegs.map((key) => ({
        name: getEnglishDefaultExerciseName(key),
        category: legs,
        i18n_key: `defaultExercises.${key}` as const,
      })),
    ];
  };

  const handleAddDefaultCategories = async () => {
    try {
      const created = await seedDefaultExercises(getDefaultExercises());
      await loadSections();
      Alert.alert(
        t('sectionScreen.defaultsAdded'),
        `${created} ${t('sectionScreen.exercisesAdded')}`
      );
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  const handleSaveSection = async () => {
    if (!sectionName.trim()) {
      Alert.alert(t('error'), t('sectionScreen.sectionNameEmpty'));
      return;
    }
    try {
      await createExercise(t('sectionScreen.newExercise'), sectionName.trim());
      await loadSections();
      setShowSectionModal(false);
      setSectionName('');
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  const handleDeleteSection = useCallback(
    (categoryName: string) => {
      Alert.alert(t('sectionScreen.deleteSection'), t('sectionScreen.deleteSectionConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const section = sections.find((s) => s.name === categoryName);
              if (section) {
                await Promise.all(section.exercises.map((ex) => deleteExercise(ex.id)));
              }
              await loadSections();
            } catch (error) {
              Alert.alert(t('error'), String(error));
            }
          },
        },
      ]);
    },
    [sections, t, loadSections]
  );

  const openAddExerciseModal = useCallback((categoryName: string) => {
    setActiveCategory(categoryName);
    setEditingExercise(null);
    setExerciseName('');
    setShowExerciseModal(true);
  }, []);

  const openEditExerciseModal = useCallback((categoryName: string, exercise: Exercise) => {
    setActiveCategory(categoryName);
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setShowExerciseModal(true);
  }, []);

  const handleSaveExercise = async () => {
    if (!exerciseName.trim() || !activeCategory) {
      Alert.alert(t('error'), t('sectionScreen.exerciseNameEmpty'));
      return;
    }
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, exerciseName.trim(), activeCategory);
      } else {
        await createExercise(exerciseName.trim(), activeCategory);
      }
      await loadSections();
      setShowExerciseModal(false);
      setExerciseName('');
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  const handleDeleteExercise = useCallback(
    (categoryName: string, exerciseId: number) => {
      Alert.alert(t('sectionScreen.deleteExercise'), t('sectionScreen.deleteExerciseConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(exerciseId);
              await loadSections();
            } catch (error) {
              Alert.alert(t('error'), String(error));
            }
          },
        },
      ]);
    },
    [t, loadSections]
  );

  const toggleSection = useCallback((categoryName: string) => {
    setExpandedSection((prev) => (prev === categoryName ? null : categoryName));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border px-6 py-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">{t('sectionScreen.title')}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {sections.length} {t('sectionScreen.sectionsCount')} •{' '}
            {sections.reduce((sum, s) => sum + s.exercises.length, 0)}{' '}
            {t('sectionScreen.exercisesCount')}
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 128, paddingTop: 16 }}>
        <View className="mb-4 px-6">
          <TouchableOpacity
            onPress={() => {
              setSectionName('');
              setShowSectionModal(true);
            }}
            className="flex-row items-center justify-center rounded-xl bg-primary p-4"
            activeOpacity={0.7}
          >
            <Plus className="mr-2 text-primary-foreground" size={20} />
            <Text className="text-base font-semibold text-primary-foreground">
              {t('sectionScreen.addNewSection')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-3 px-6">
          {sections.map((section) => (
            <SectionCard
              key={section.name}
              section={section}
              isExpanded={expandedSection === section.name}
              onToggle={toggleSection}
              onDeleteSection={handleDeleteSection}
              onAddExercise={openAddExerciseModal}
              onEditExercise={openEditExerciseModal}
              onDeleteExercise={handleDeleteExercise}
            />
          ))}

          {sections.length === 0 && (
            <SectionsEmptyState isEmpty={isEmpty} onAddDefaults={handleAddDefaultCategories} />
          )}
        </View>
      </ScrollView>

      <NameInputModal
        visible={showSectionModal}
        title={t('sectionScreen.newSection')}
        label={t('sectionScreen.sectionName')}
        placeholder={t('sectionScreen.sectionNamePlaceholder')}
        value={sectionName}
        onChangeValue={setSectionName}
        onSave={handleSaveSection}
        onClose={() => setShowSectionModal(false)}
      />

      <NameInputModal
        visible={showExerciseModal}
        title={editingExercise ? t('sectionScreen.editExercise') : t('sectionScreen.newExercise')}
        label={t('sectionScreen.exerciseName')}
        placeholder={t('sectionScreen.exerciseNamePlaceholder')}
        value={exerciseName}
        onChangeValue={setExerciseName}
        onSave={handleSaveExercise}
        onClose={() => setShowExerciseModal(false)}
      />
    </SafeAreaView>
  );
}
