import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Calendar, Filter, TrendingUp } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { useChartColors } from '@/lib/useChartColors';

type Props = {
  viewMode: 'progress' | 'calendar';
  onViewModeChange: (m: 'progress' | 'calendar') => void;
  onOpenFilters: () => void;
  activeFiltersCount: number;
};

const buttonBase = {
  flex: 1,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 6,
  borderRadius: 12,
  paddingVertical: 12,
  borderWidth: 1,
};

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  onOpenFilters,
  activeFiltersCount,
}: Props) {
  const { t } = useI18n();
  const chartColors = useChartColors();

  const isProgress = viewMode === 'progress';
  const isCalendar = viewMode === 'calendar';

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingBottom: 16 }}>
      <TouchableOpacity
        onPress={onOpenFilters}
        activeOpacity={0.7}
        style={{ ...buttonBase, backgroundColor: chartColors.card, borderColor: chartColors.grid }}
      >
        <View style={{ position: 'relative' }}>
          <Filter size={18} color={chartColors.text} />
          {activeFiltersCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: chartColors.primary,
              }}
            />
          )}
        </View>
        <Text numberOfLines={1} style={{ fontWeight: '500', color: chartColors.text }}>
          {t('filters')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onViewModeChange('progress')}
        activeOpacity={0.7}
        style={{
          ...buttonBase,
          backgroundColor: isProgress ? chartColors.primary : chartColors.card,
          borderColor: isProgress ? chartColors.primary : chartColors.grid,
        }}
      >
        <TrendingUp
          size={18}
          color={isProgress ? chartColors.primaryForeground : chartColors.text}
        />
        <Text
          numberOfLines={1}
          style={{
            fontWeight: '500',
            color: isProgress ? chartColors.primaryForeground : chartColors.text,
          }}
        >
          {t('progress')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onViewModeChange('calendar')}
        activeOpacity={0.7}
        style={{
          ...buttonBase,
          backgroundColor: isCalendar ? chartColors.primary : chartColors.card,
          borderColor: isCalendar ? chartColors.primary : chartColors.grid,
        }}
      >
        <Calendar
          size={18}
          color={isCalendar ? chartColors.primaryForeground : chartColors.text}
        />
        <Text
          numberOfLines={1}
          style={{
            fontWeight: '500',
            color: isCalendar ? chartColors.primaryForeground : chartColors.text,
          }}
        >
          {t('calendar')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}