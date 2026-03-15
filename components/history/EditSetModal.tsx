import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

import { X } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { RepsPicker, WeightPicker } from '@/components/NumberPicker';
import { getExerciseDisplayName, SetWithDetails } from '@/lib/database';

type Props = {
  editingSet: SetWithDetails | null;
  editWeight: string;
  editReps: string;
  isSavingEdit: boolean;
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function EditSetModal({
  editingSet,
  editWeight,
  editReps,
  isSavingEdit,
  onWeightChange,
  onRepsChange,
  onSave,
  onClose,
}: Props) {
  const { t } = useI18n();

  return (
    <Modal visible={editingSet !== null} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-background p-6 pb-8">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">{t('editSet')}</Text>
            <TouchableOpacity onPress={onClose}>
              <X className="text-foreground" size={24} />
            </TouchableOpacity>
          </View>
          {editingSet && (
            <>
              <Text className="mb-2 text-sm font-medium text-muted-foreground">
                {getExerciseDisplayName(
                  editingSet.exercise_name,
                  editingSet.exercise_i18n_key ?? null,
                  t
                )}
              </Text>
              <View className="mb-6 flex-row gap-3">
                <View className="min-h-[76px] flex-1">
                  <WeightPicker
                    value={editWeight}
                    onValueChange={onWeightChange}
                    label={`${t('weight')} (kg)`}
                  />
                </View>
                <View className="min-h-[76px] flex-1">
                  <RepsPicker value={editReps} onValueChange={onRepsChange} label={t('reps')} />
                </View>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-3"
                >
                  <Text className="text-center font-medium text-foreground">{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSave}
                  disabled={isSavingEdit}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 disabled:opacity-50"
                >
                  <Text className="text-center font-medium text-primary-foreground">
                    {t('save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
