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

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  onOpenFilters,
  activeFiltersCount,
}: Props) {
  const { t } = useI18n();
  const chartColors = useChartColors();

  return (
    <View className="flex-row gap-3 px-6 pb-4">
      <TouchableOpacity
        onPress={onOpenFilters}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
      >
        <Filter className="text-foreground" size={18} />
        <Text className="font-medium text-foreground">
          {t('filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onViewModeChange('progress')}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: viewMode === 'progress' ? chartColors.primary : chartColors.card,
            borderWidth: viewMode === 'progress' ? 0 : 1,
            borderColor: chartColors.grid,
          }}
        >
          <TrendingUp
            size={18}
            color={viewMode === 'progress' ? chartColors.primaryForeground : chartColors.text}
          />
          <Text
            style={{
              fontWeight: '500',
              color: viewMode === 'progress' ? chartColors.primaryForeground : chartColors.text,
            }}
          >
            {t('progress')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onViewModeChange('calendar')}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: viewMode === 'calendar' ? chartColors.primary : chartColors.card,
            borderWidth: viewMode === 'calendar' ? 0 : 1,
            borderColor: chartColors.grid,
          }}
        >
          <Calendar
            size={18}
            color={viewMode === 'calendar' ? chartColors.primaryForeground : chartColors.text}
          />
          <Text
            style={{
              fontWeight: '500',
              color: viewMode === 'calendar' ? chartColors.primaryForeground : chartColors.text,
            }}
          >
            {t('calendar')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
