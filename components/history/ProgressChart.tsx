import React from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { LineChart } from 'lucide-react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';

import { useI18n } from '@/components/I18nProvider';
import { getExerciseDisplayNameForStableId } from '@/lib/database';
import { useChartColors } from '@/lib/useChartColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

export type ChartDataPoint = { value: number; label: string; dataPointText: string };

type Props = {
  exercises: string[];
  selectedExercise: string;
  onSelectExercise: (id: string) => void;
  chartData: ChartDataPoint[];
};

export function ProgressChart({ exercises, selectedExercise, onSelectExercise, chartData }: Props) {
  const { t } = useI18n();
  const chartColors = useChartColors();

  return (
    <View className="mb-4 px-6">
      <Text className="mb-2 text-lg font-semibold text-foreground">{t('progress')}</Text>
      <View className="rounded-2xl border border-border bg-card p-4">
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, marginBottom: 12 }}
          >
            {exercises.map((exercise) => {
              const isSelected = selectedExercise === exercise;
              return (
                <TouchableOpacity
                  key={exercise}
                  onPress={() => onSelectExercise(exercise)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? chartColors.primary : chartColors.card,
                    borderColor: isSelected ? chartColors.primary : chartColors.grid,
                    borderWidth: 1.5,
                    borderRadius: 9999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#0f0f0f' : chartColors.text,
                      fontSize: 12,
                      fontWeight: '500',
                    }}
                  >
                    {getExerciseDisplayNameForStableId(exercise, t)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedExercise && chartData.length > 0 ? (
            <>
              <Text className="mb-1 text-xs text-muted-foreground">
                {getExerciseDisplayNameForStableId(selectedExercise, t)} · {t('estimated1RM')}
              </Text>
              <View style={{ marginLeft: -10, overflow: 'hidden' }}>
                <GiftedLineChart
                  data={chartData}
                  width={CHART_WIDTH - 20}
                  height={200}
                  spacing={40}
                  thickness={2}
                  color={chartColors.primary}
                  dataPointsColor={chartColors.primary}
                  dataPointsRadius={4}
                  noOfSections={4}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor={chartColors.grid}
                  rulesColor={chartColors.grid}
                  rulesType="solid"
                  xAxisLabelTextStyle={{
                    color: chartColors.textMuted,
                    fontSize: 9,
                    width: 40,
                    textAlign: 'center',
                  }}
                  yAxisTextStyle={{
                    color: chartColors.textMuted,
                    fontSize: 10,
                  }}
                  hideDataPoints={false}
                  curved
                  isAnimated={false}
                  areaChart
                  startFillColor={chartColors.primary}
                  endFillColor={chartColors.background}
                  startOpacity={0.2}
                  endOpacity={0.02}
                />
              </View>
            </>
          ) : (
            <View className="h-32 items-center justify-center">
              <LineChart size={28} color={chartColors.textMuted} />
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                {t('pickExercise')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
