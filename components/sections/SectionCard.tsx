import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ChevronRight, Dumbbell, Edit, Plus, Trash2 } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { Exercise, getExerciseDisplayName } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

import { SectionsSection } from './types';

type Props = {
  section: SectionsSection;
  isExpanded: boolean;
  onToggle: (name: string) => void;
  onDeleteSection: (name: string) => void;
  onAddExercise: (name: string) => void;
  onEditExercise: (name: string, exercise: Exercise) => void;
  onDeleteExercise: (name: string, exerciseId: number) => void;
};

export const SectionCard = React.memo(function SectionCard({
  section,
  isExpanded,
  onToggle,
  onDeleteSection,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}: Props) {
  const { t } = useI18n();
  const exerciseCount = section.exercises.length;

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <TouchableOpacity
        onPress={() => onToggle(section.name)}
        className="flex-row items-center justify-between p-4"
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {getCategoryDisplayName(section.name, t)}
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {exerciseCount}{' '}
            {exerciseCount === 1 ? t('sectionScreen.exercise') : t('sectionScreen.exercises')}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => onDeleteSection(section.name)}
            className="rounded-lg bg-destructive/10 p-2"
            activeOpacity={0.7}
          >
            <Trash2 className="text-destructive" size={18} />
          </TouchableOpacity>
          <ChevronRight
            className={`text-muted-foreground ${isExpanded ? 'rotate-90' : ''}`}
            size={20}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="border-t border-border bg-muted/30">
          <TouchableOpacity
            onPress={() => onAddExercise(section.name)}
            className="mx-3 mt-3 flex-row items-center justify-center rounded-lg border border-border bg-background p-3"
            activeOpacity={0.7}
          >
            <Plus className="mr-2 text-primary" size={18} />
            <Text className="font-medium text-primary">{t('sectionScreen.addExercise')}</Text>
          </TouchableOpacity>

          {exerciseCount === 0 ? (
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
                  <Text className="flex-1 text-foreground">
                    {getExerciseDisplayName(exercise.name, exercise.i18n_key ?? null, t)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => onEditExercise(section.name, exercise)}
                      className="rounded-lg bg-secondary p-2"
                      activeOpacity={0.7}
                    >
                      <Edit className="text-secondary-foreground" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteExercise(section.name, exercise.id)}
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
});
