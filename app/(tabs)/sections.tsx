import React, { useEffect, useState } from 'react';
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, ChevronRight, Dumbbell, Edit, Plus, Trash2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/components/I18nProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import i18n from '@/lib/i18n';

// Types
type Exercise = {
  id: string;
  name: string;
};

type Section = {
  id: string;
  name: string;
  exercises: Exercise[];
};

// Default sections with translated exercises
const getDefaultSections = (): Section[] => [
  {
    id: 'pulls',
    name: i18n.t('defaultSections.pulls'),
    exercises: [
      { id: 'ex1', name: i18n.t('defaultExercises.upperPull') },
      { id: 'ex2', name: i18n.t('defaultExercises.narrowGrip') },
      { id: 'ex3', name: i18n.t('defaultExercises.lowerPull') },
      { id: 'ex4', name: i18n.t('defaultExercises.dumbbellRow') },
      { id: 'ex5', name: i18n.t('defaultExercises.pullover') },
      { id: 'ex6', name: i18n.t('defaultExercises.deadlift') },
      { id: 'ex7', name: i18n.t('defaultExercises.barbellCurl') },
      { id: 'ex8', name: i18n.t('defaultExercises.extension') },
      { id: 'ex9', name: i18n.t('defaultExercises.trapezius') },
      { id: 'ex10', name: i18n.t('defaultExercises.pullUps') },
      { id: 'ex11', name: i18n.t('defaultExercises.forearm') },
    ],
  },
  {
    id: 'presses',
    name: i18n.t('defaultSections.presses'),
    exercises: [
      { id: 'ex12', name: i18n.t('defaultExercises.benchPress') },
      { id: 'ex13', name: i18n.t('defaultExercises.inclineDumbbellPress') },
      { id: 'ex14', name: i18n.t('defaultExercises.seatedPress') },
      { id: 'ex15', name: i18n.t('defaultExercises.flyDumbbell') },
      { id: 'ex16', name: i18n.t('defaultExercises.lateralRaise') },
      { id: 'ex17', name: i18n.t('defaultExercises.pushdown') },
      { id: 'ex18', name: i18n.t('defaultExercises.seatedFlye') },
      { id: 'ex19', name: i18n.t('defaultExercises.rearDelt') },
      { id: 'ex20', name: i18n.t('defaultExercises.dipsPause') },
    ],
  },
  {
    id: 'legs',
    name: i18n.t('defaultSections.legs'),
    exercises: [
      { id: 'ex21', name: i18n.t('defaultExercises.squats') },
      { id: 'ex22', name: i18n.t('defaultExercises.lunges') },
      { id: 'ex23', name: i18n.t('defaultExercises.quadriceps') },
      { id: 'ex24', name: i18n.t('defaultExercises.hamstring') },
      { id: 'ex25', name: i18n.t('defaultExercises.hipAbduction') },
      { id: 'ex26', name: i18n.t('defaultExercises.hipAdduction') },
      { id: 'ex27', name: i18n.t('defaultExercises.calfRaise') },
      { id: 'ex28', name: i18n.t('defaultExercises.cableSquat') },
      { id: 'ex29', name: i18n.t('defaultExercises.legPress') },
      { id: 'ex30', name: i18n.t('defaultExercises.gluteBridge') },
    ],
  },
];

export default function SectionsScreen() {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Section modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState('');

  // Exercise modal states
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState('');

  // Load sections on mount
  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const stored = await AsyncStorage.getItem('workout_sections');
      if (stored) {
        setSections(JSON.parse(stored));
      } else {
        // First time - load defaults
        const defaultSections = getDefaultSections();
        await AsyncStorage.setItem('workout_sections', JSON.stringify(defaultSections));
        setSections(defaultSections);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      setSections(getDefaultSections());
    }
  };

  const saveSections = async (updatedSections: Section[]) => {
    try {
      await AsyncStorage.setItem('workout_sections', JSON.stringify(updatedSections));
      setSections(updatedSections);
    } catch (error) {
      console.error('Failed to save sections:', error);
      Alert.alert(t('error'), t('sectionScreen.failedToSave'));
    }
  };

  // Section CRUD operations
  const openAddSectionModal = () => {
    setEditingSectionId(null);
    setSectionName('');
    setShowSectionModal(true);
  };

  const openEditSectionModal = (section: Section) => {
    setEditingSectionId(section.id);
    setSectionName(section.name);
    setShowSectionModal(true);
  };

  const handleSaveSection = () => {
    if (!sectionName.trim()) {
      Alert.alert(t('error'), t('sectionScreen.sectionNameEmpty'));
      return;
    }

    let updatedSections: Section[];

    if (editingSectionId) {
      // Edit existing section
      updatedSections = sections.map((s) =>
        s.id === editingSectionId ? { ...s, name: sectionName.trim() } : s
      );
    } else {
      // Add new section
      const newSection: Section = {
        id: `section_${Date.now()}`,
        name: sectionName.trim(),
        exercises: [],
      };
      updatedSections = [...sections, newSection];
    }

    saveSections(updatedSections);
    setShowSectionModal(false);
    setSectionName('');
  };

  const handleDeleteSection = (sectionId: string) => {
    Alert.alert(t('sectionScreen.deleteSection'), t('sectionScreen.deleteSectionConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          const updatedSections = sections.filter((s) => s.id !== sectionId);
          saveSections(updatedSections);
        },
      },
    ]);
  };

  // Exercise CRUD operations
  const openAddExerciseModal = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingExerciseId(null);
    setExerciseName('');
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (sectionId: string, exercise: Exercise) => {
    setActiveSectionId(sectionId);
    setEditingExerciseId(exercise.id);
    setExerciseName(exercise.name);
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    if (!exerciseName.trim() || !activeSectionId) {
      Alert.alert(t('error'), t('sectionScreen.exerciseNameEmpty'));
      return;
    }

    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) {
        return section;
      }

      let updatedExercises: Exercise[];

      if (editingExerciseId) {
        // Edit existing exercise
        updatedExercises = section.exercises.map((ex) =>
          ex.id === editingExerciseId ? { ...ex, name: exerciseName.trim() } : ex
        );
      } else {
        // Add new exercise
        const newExercise: Exercise = {
          id: `ex_${Date.now()}`,
          name: exerciseName.trim(),
        };
        updatedExercises = [...section.exercises, newExercise];
      }

      return { ...section, exercises: updatedExercises };
    });

    saveSections(updatedSections);
    setShowExerciseModal(false);
    setExerciseName('');
  };

  const handleDeleteExercise = (sectionId: string, exerciseId: string) => {
    Alert.alert(t('sectionScreen.deleteExercise'), t('sectionScreen.deleteExerciseConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          const updatedSections = sections.map((section) => {
            if (section.id !== sectionId) {
              return section;
            }
            return {
              ...section,
              exercises: section.exercises.filter((ex) => ex.id !== exerciseId),
            };
          });
          saveSections(updatedSections);
        },
      },
    ]);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
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
            const isExpanded = expandedSection === section.id;
            const exerciseCount = section.exercises.length;
            return (
              <View
                key={section.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Section Header */}
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
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
                      onPress={() => openEditSectionModal(section)}
                      className="rounded-lg bg-secondary p-2"
                      activeOpacity={0.7}
                    >
                      <Edit className="text-secondary-foreground" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteSection(section.id)}
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
                      onPress={() => openAddExerciseModal(section.id)}
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
                                onPress={() => openEditExerciseModal(section.id, exercise)}
                                className="rounded-lg bg-secondary p-2"
                                activeOpacity={0.7}
                              >
                                <Edit className="text-secondary-foreground" size={16} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteExercise(section.id, exercise.id)}
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
            </View>
          )}
        </View>
      </ScrollView>

      {/* Section Add/Edit Modal */}
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
                {editingSectionId ? t('sectionScreen.editSection') : t('sectionScreen.newSection')}
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
                {editingExerciseId
                  ? t('sectionScreen.editExercise')
                  : t('sectionScreen.newExercise')}
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
