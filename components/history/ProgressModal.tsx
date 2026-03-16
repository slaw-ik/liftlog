import React from 'react';
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { X } from 'lucide-react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';

import { useI18n } from '@/components/I18nProvider';
import { getExerciseDisplayNameForStableId, SetWithDetails } from '@/lib/database';
import { getCategoryDisplayName } from '@/lib/i18n';
import { useChartColors } from '@/lib/useChartColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

export type ExerciseProgress = {
  exerciseName: string;
  sets: SetWithDetails[];
  maxWeight: number;
  maxE1RM: number;
  totalSets: number;
  avgReps: number;
};

type ChartDataPoint = { value: number; label: string; dataPointText: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedExercise: ExerciseProgress | null;
  chartData: ChartDataPoint[];
  reversedSets: SetWithDetails[];
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
};

export function ProgressModal({
  visible,
  onClose,
  selectedExercise,
  chartData,
  reversedSets,
  formatDate,
  formatTime,
}: Props) {
  const { t } = useI18n();
  const chartColors = useChartColors();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[85%] rounded-t-3xl bg-background p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {selectedExercise &&
                  getExerciseDisplayNameForStableId(selectedExercise.exerciseName, t)}
              </Text>
              <Text className="text-sm text-muted-foreground">{t('progressOverview')}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
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
                  <Text className="mb-1 text-xs text-muted-foreground">{t('estimated1RM')}</Text>
                  <Text className="text-2xl font-bold text-primary">
                    {selectedExercise.maxE1RM} {t('kg')}
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row gap-3">
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
              {chartData.length > 1 && (
                <View className="mb-6 rounded-xl border border-border bg-card p-4">
                  <Text className="mb-4 text-lg font-bold text-foreground">
                    {t('weightProgress')}
                  </Text>
                  <View style={{ marginLeft: -10, overflow: 'hidden' }}>
                    <GiftedLineChart
                      data={chartData}
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
                      isAnimated={false}
                      startFillColor={chartColors.primary}
                      endFillColor={chartColors.background}
                      startOpacity={0.2}
                      endOpacity={0.02}
                      areaChart
                    />
                  </View>
                </View>
              )}

              {/* All Sets */}
              <Text className="mb-3 text-lg font-bold text-foreground">{t('completeHistory')}</Text>
              <View className="gap-2">
                {reversedSets.map((set) => (
                  <View key={set.id} className="rounded-xl border border-border bg-card p-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-medium text-foreground">
                          {formatDate(set.workout_date)} {t('at')} {formatTime(set.created_at)}
                        </Text>
                        <Text className="mt-1 text-xs text-muted-foreground">
                          {getCategoryDisplayName(set.exercise_category, t)}
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-primary">
                        {set.weight} {t('kg')} × {set.reps}
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
  );
}
