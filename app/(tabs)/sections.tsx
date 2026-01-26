import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Check, ChevronRight, Dumbbell, Edit, Plus, Trash2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
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

// Section type for UI grouping (category-based)
type Section = {
  name: string; // category name
  exercises: Exercise[];
};

export default function SectionsScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // Section modal states (for adding new categories)
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionName, setSectionName] = useState('');

  // Exercise modal states
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseName, setExerciseName] = useState('');

  // Load sections when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSections();
    }, [])
  );

  const loadSections = async () => {
    try {
      const hasData = await hasExercises();
      setIsEmpty(!hasData);

      const categories = await getCategories();
      const allExercises = await getAllExercises();

      // Group exercises by category
      const sectionsList: Section[] = categories.map((category) => ({
        name: category,
        exercises: allExercises.filter((ex) => ex.category === category),
      }));

      setSections(sectionsList);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  // Generate default exercises with current language translations
  const getDefaultExercises = (): DefaultExerciseDefinition[] => {
    const pulls = t('defaultSections.pulls');
    const presses = t('defaultSections.presses');
    const legs = t('defaultSections.legs');

    return [
      // PULLS / ТЯГИ
      { name: t('defaultExercises.upperPull'), category: pulls },
      { name: t('defaultExercises.narrowGrip'), category: pulls },
      { name: t('defaultExercises.lowerPull'), category: pulls },
      { name: t('defaultExercises.dumbbellRow'), category: pulls },
      { name: t('defaultExercises.pullover'), category: pulls },
      { name: t('defaultExercises.deadlift'), category: pulls },
      { name: t('defaultExercises.barbellCurl'), category: pulls },
      { name: t('defaultExercises.extension'), category: pulls },
      { name: t('defaultExercises.trapezius'), category: pulls },
      { name: t('defaultExercises.pullUps'), category: pulls },
      { name: t('defaultExercises.forearm'), category: pulls },
      // PRESSES / ЖИМЫ
      { name: t('defaultExercises.benchPress'), category: presses },
      { name: t('defaultExercises.inclineDumbbellPress'), category: presses },
      { name: t('defaultExercises.seatedPress'), category: presses },
      { name: t('defaultExercises.flyDumbbell'), category: presses },
      { name: t('defaultExercises.lateralRaise'), category: presses },
      { name: t('defaultExercises.pushdown'), category: presses },
      { name: t('defaultExercises.seatedFlye'), category: presses },
      { name: t('defaultExercises.rearDelt'), category: presses },
      { name: t('defaultExercises.dipsPause'), category: presses },
      // LEGS / НОГИ
      { name: t('defaultExercises.squats'), category: legs },
      { name: t('defaultExercises.lunges'), category: legs },
      { name: t('defaultExercises.quadriceps'), category: legs },
      { name: t('defaultExercises.hamstring'), category: legs },
      { name: t('defaultExercises.hipAbduction'), category: legs },
      { name: t('defaultExercises.hipAdduction'), category: legs },
      { name: t('defaultExercises.calfRaise'), category: legs },
      { name: t('defaultExercises.cableSquat'), category: legs },
      { name: t('defaultExercises.legPress'), category: legs },
      { name: t('defaultExercises.gluteBridge'), category: legs },
    ];
  };

  const handleAddDefaultCategories = async () => {
    try {
      const defaultExercises = getDefaultExercises();
      const created = await seedDefaultExercises(defaultExercises);
      await loadSections();
      Alert.alert(
        t('sectionScreen.defaultsAdded'),
        `${created} ${t('sectionScreen.exercisesAdded')}`
      );
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  // Section (Category) operations
  const openAddSectionModal = () => {
    setSectionName('');
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    if (!sectionName.trim()) {
      Alert.alert(t('error'), t('sectionScreen.sectionNameEmpty'));
      return;
    }

    try {
      // Create a placeholder exercise to establish the category
      // (Categories are derived from exercises in this schema)
      await createExercise(t('sectionScreen.newExercise'), sectionName.trim());
      await loadSections();
      setShowSectionModal(false);
      setSectionName('');
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  const handleDeleteSection = (categoryName: string) => {
    Alert.alert(t('sectionScreen.deleteSection'), t('sectionScreen.deleteSectionConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete all exercises in this category
            const section = sections.find((s) => s.name === categoryName);
            if (section) {
              for (const exercise of section.exercises) {
                await deleteExercise(exercise.id);
              }
            }
            await loadSections();
          } catch (error) {
            Alert.alert(t('error'), String(error));
          }
        },
      },
    ]);
  };

  // Exercise CRUD operations
  const openAddExerciseModal = (categoryName: string) => {
    setActiveCategory(categoryName);
    setEditingExercise(null);
    setExerciseName('');
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (categoryName: string, exercise: Exercise) => {
    setActiveCategory(categoryName);
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setShowExerciseModal(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseName.trim() || !activeCategory) {
      Alert.alert(t('error'), t('sectionScreen.exerciseNameEmpty'));
      return;
    }

    try {
      if (editingExercise) {
        // Edit existing exercise
        await updateExercise(editingExercise.id, exerciseName.trim(), activeCategory);
      } else {
        // Add new exercise
        await createExercise(exerciseName.trim(), activeCategory);
      }

      await loadSections();
      setShowExerciseModal(false);
      setExerciseName('');
    } catch (error) {
      Alert.alert(t('error'), String(error));
    }
  };

  const handleDeleteExercise = (categoryName: string, exerciseId: number) => {
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
  };

  const toggleSection = (categoryName: string) => {
    setExpandedSection(expandedSection === categoryName ? null : categoryName);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
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
        {/* Hero Image */}
        <View className="mb-6 px-6">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1591311630200-ffa9120a540f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8R3ltJTIwd2VpZ2h0cyUyMGVxdWlwbWVudHxlbnwwfHwwfHx8MA%3D%3D',
            }}
            className="h-40 w-full rounded-xl"
            resizeMode="cover"
          />
        </View>

        {/* Add Section Button */}
        <View className="mb-4 px-6">
          <TouchableOpacity
            onPress={openAddSectionModal}
            className="flex-row items-center justify-center rounded-xl bg-primary p-4"
            activeOpacity={0.7}
          >
            <Plus className="mr-2 text-primary-foreground" size={20} />
            <Text className="text-base font-semibold text-primary-foreground">
              {t('sectionScreen.addNewSection')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sections List */}
        <View className="gap-3 px-6">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.name;
            const exerciseCount = section.exercises.length;
            return (
              <View
                key={section.name}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Section Header */}
                <TouchableOpacity
                  onPress={() => toggleSection(section.name)}
                  className="flex-row items-center justify-between p-4"
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">{section.name}</Text>
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {exerciseCount}{' '}
                      {exerciseCount === 1
                        ? t('sectionScreen.exercise')
                        : t('sectionScreen.exercises')}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleDeleteSection(section.name)}
                      className="rounded-lg bg-destructive/10 p-2"
                      activeOpacity={0.7}
                    >
                      <Trash2 className="text-destructive" size={18} />
                    </TouchableOpacity>

                    <ChevronRight
                      className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      size={20}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Exercises */}
                {isExpanded && (
                  <View className="border-t border-border bg-muted/30">
                    {/* Add Exercise Button */}
                    <TouchableOpacity
                      onPress={() => openAddExerciseModal(section.name)}
                      className="mx-3 mt-3 flex-row items-center justify-center rounded-lg border border-border bg-background p-3"
                      activeOpacity={0.7}
                    >
                      <Plus className="mr-2 text-primary" size={18} />
                      <Text className="font-medium text-primary">
                        {t('sectionScreen.addExercise')}
                      </Text>
                    </TouchableOpacity>

                    {/* Exercises List */}
                    {section.exercises.length === 0 ? (
                      <View className="items-center p-6">
                        <Dumbbell className="mb-2 text-muted-foreground" size={32} />
                        <Text className="text-center text-muted-foreground">
                          {t('sectionScreen.noExercisesYet')}
                        </Text>
                        <Text className="mt-1 text-center text-sm text-muted-foreground">
                          {t('sectionScreen.tapAddExercise')}
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-2 p-3">
                        {section.exercises.map((exercise) => (
                          <View
                            key={exercise.id}
                            className="flex-row items-center justify-between rounded-lg border border-border bg-background p-3"
                          >
                            <Text className="flex-1 text-foreground">{exercise.name}</Text>

                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity
                                onPress={() => openEditExerciseModal(section.name, exercise)}
                                className="rounded-lg bg-secondary p-2"
                                activeOpacity={0.7}
                              >
                                <Edit className="text-secondary-foreground" size={16} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteExercise(section.name, exercise.id)}
                                className="rounded-lg bg-destructive/10 p-2"
                                activeOpacity={0.7}
                              >
                                <Trash2 className="text-destructive" size={16} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {sections.length === 0 && (
            <View className="items-center py-12">
              <Dumbbell className="mb-4 text-muted-foreground" size={48} />
              <Text className="text-center text-xl font-bold text-foreground">
                {t('sectionScreen.noSectionsYet')}
              </Text>
              <Text className="mt-2 px-8 text-center text-muted-foreground">
                {t('sectionScreen.createFirstSection')}
              </Text>

              {isEmpty && (
                <TouchableOpacity
                  onPress={handleAddDefaultCategories}
                  className="mt-6 flex-row items-center rounded-xl bg-secondary px-6 py-3"
                  activeOpacity={0.7}
                >
                  <Plus className="mr-2 text-secondary-foreground" size={18} />
                  <Text className="font-semibold text-secondary-foreground">
                    {t('sectionScreen.addDefaultCategories')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Section Add Modal (New Category) */}
      <Modal
        visible={showSectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSectionModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">
                {t('sectionScreen.newSection')}
              </Text>
              <TouchableOpacity onPress={() => setShowSectionModal(false)} activeOpacity={0.7}>
                <X className="text-muted-foreground" size={24} />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">
                {t('sectionScreen.sectionName')}
              </Text>
              <TextInput
                value={sectionName}
                onChangeText={setSectionName}
                placeholder={t('sectionScreen.sectionNamePlaceholder')}
                placeholderTextColor="#a8a29e"
                className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
                autoFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowSectionModal(false)}
                className="flex-1 items-center rounded-xl bg-secondary p-3"
                activeOpacity={0.7}
              >
                <Text className="font-semibold text-secondary-foreground">{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveSection}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-primary p-3"
                activeOpacity={0.7}
              >
                <Check className="mr-2 text-primary-foreground" size={18} />
                <Text className="font-semibold text-primary-foreground">{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exercise Add/Edit Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">
                {editingExercise ? t('sectionScreen.editExercise') : t('sectionScreen.newExercise')}
              </Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)} activeOpacity={0.7}>
                <X className="text-muted-foreground" size={24} />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">
                {t('sectionScreen.exerciseName')}
              </Text>
              <TextInput
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder={t('sectionScreen.exerciseNamePlaceholder')}
                placeholderTextColor="#a8a29e"
                className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
                autoFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowExerciseModal(false)}
                className="flex-1 items-center rounded-xl bg-secondary p-3"
                activeOpacity={0.7}
              >
                <Text className="font-semibold text-secondary-foreground">{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveExercise}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-primary p-3"
                activeOpacity={0.7}
              >
                <Check className="mr-2 text-primary-foreground" size={18} />
                <Text className="font-semibold text-primary-foreground">{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
