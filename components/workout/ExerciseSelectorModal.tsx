import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ChevronRight } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { Exercise, getExerciseDisplayName } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

import { WorkoutSection } from './types';

type Props = {
  visible: boolean;
  sections: WorkoutSection[];
  getLastExerciseStats: (exerciseId: number) => string;
  onSelectExercise: (exercise: Exercise) => void;
  onClose: () => void;
};

export function ExerciseSelectorModal({
  visible,
  sections,
  getLastExerciseStats,
  onSelectExercise,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [selectedSection, setSelectedSection] = useState<WorkoutSection | null>(null);

  const handleClose = () => {
    setSelectedSection(null);
    onClose();
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedSection(null);
    onSelectExercise(exercise);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={handleClose} />
        <View className="rounded-t-3xl bg-background" style={{ maxHeight: '75%' }}>
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
                      <Text className="text-lg font-bold text-foreground">
                        {getCategoryDisplayName(section.name, t)}
                      </Text>
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
                    onPress={() => handleSelectExercise(exercise)}
                    className="mb-3 rounded-2xl border border-border bg-card p-5"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-semibold text-foreground">
                      {getExerciseDisplayName(exercise.name, exercise.i18n_key ?? null, t)}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                      <Text className="text-xs text-muted-foreground">
                        {t('last')}:{' '}
                        <Text className="text-foreground">{getLastExerciseStats(exercise.id)}</Text>
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
              onPress={handleClose}
              className="items-center py-2"
              activeOpacity={0.7}
            >
              <Text className="font-medium text-muted-foreground">{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
