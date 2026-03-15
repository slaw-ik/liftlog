import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { X } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { getExerciseDisplayNameForStableId } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  exercises: string[];
  filterSection: string;
  filterExercise: string;
  filterDateRange: 'week' | 'month' | 'all';
  onSectionChange: (v: string) => void;
  onExerciseChange: (v: string) => void;
  onDateRangeChange: (v: 'week' | 'month' | 'all') => void;
  onClearFilters: () => void;
};

export function FiltersModal({
  visible,
  onClose,
  categories,
  exercises,
  filterSection,
  filterExercise,
  filterDateRange,
  onSectionChange,
  onExerciseChange,
  onDateRangeChange,
  onClearFilters,
}: Props) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[80%] rounded-t-3xl bg-background p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">{t('filters')}</Text>
            <TouchableOpacity onPress={onClose}>
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
                    onPress={() => onDateRangeChange(range)}
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
                  onPress={() => onSectionChange('all')}
                  className={`rounded-xl border px-4 py-3 ${
                    filterSection === 'all' ? 'border-primary bg-primary' : 'border-border bg-card'
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
                    onPress={() => onSectionChange(category)}
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
                      {getCategoryDisplayName(category, t)}
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
                  onPress={() => onExerciseChange('all')}
                  className={`rounded-xl border px-4 py-3 ${
                    filterExercise === 'all' ? 'border-primary bg-primary' : 'border-border bg-card'
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
                    onPress={() => onExerciseChange(exercise)}
                    className={`rounded-xl border px-4 py-3 ${
                      filterExercise === exercise
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filterExercise === exercise ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {getExerciseDisplayNameForStableId(exercise, t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                onPress={onClearFilters}
                className="flex-1 rounded-xl bg-secondary px-4 py-4"
              >
                <Text className="text-center font-bold text-secondary-foreground">
                  {t('clearAll')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
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
  );
}
