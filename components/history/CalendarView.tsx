import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { enUS, ru, uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { useChartColors } from '@/lib/useChartColors';

const DATE_FNS_LOCALE: Record<string, typeof enUS> = { en: enUS, ru, uk };

/** i18n keys for calendar header month names (nominative). */
const CALENDAR_MONTH_KEYS = [
  'months.january',
  'months.february',
  'months.march',
  'months.april',
  'months.may',
  'months.june',
  'months.july',
  'months.august',
  'months.september',
  'months.october',
  'months.november',
  'months.december',
] as const;

/** Start of a week (Monday) for generating weekday labels in a given locale */
const WEEK_START = new Date(2024, 0, 1); // Monday

type Props = {
  calendarMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  daysWithWorkouts: Set<string>;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  onJumpToMonth: (month: Date) => void;
  todayDateString: string;
};

export function CalendarView({
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  daysWithWorkouts,
  selectedDate,
  onSelectDate,
  onJumpToMonth,
  todayDateString,
}: Props) {
  const { t, locale } = useI18n();
  const chartColors = useChartColors();

  const dateFnsLocale = useMemo(
    () => DATE_FNS_LOCALE[locale?.slice(0, 2) ?? 'en'] ?? enUS,
    [locale]
  );

  const calendarWeekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        format(addDays(WEEK_START, i), 'EEE', { locale: dateFnsLocale })
      ),
    [dateFnsLocale]
  );

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
      }),
    [calendarMonth]
  );

  return (
    <View className="mb-4 px-6">
      <Text className="mb-2 text-lg font-semibold text-foreground">{t('calendar')}</Text>
      <View className="rounded-2xl border border-border bg-card p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={onPrevMonth} className="rounded-full p-2" hitSlop={12}>
            <ChevronLeft size={24} color={chartColors.text} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">
            {t(CALENDAR_MONTH_KEYS[calendarMonth.getMonth()])} {calendarMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={onNextMonth} className="rounded-full p-2" hitSlop={12}>
            <ChevronRight size={24} color={chartColors.text} />
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap">
          {calendarWeekdayLabels.map((label, i) => (
            <View key={`weekday-${i}`} className="w-[14.28%] items-center pb-1">
              <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
            </View>
          ))}
          {calendarDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const hasWorkout = daysWithWorkouts.has(dayStr);
            const isSelected = selectedDate === dayStr;
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            const isToday = dayStr === todayDateString;
            return (
              <TouchableOpacity
                key={dayStr}
                onPress={() => {
                  const next = selectedDate === dayStr ? null : dayStr;
                  onSelectDate(next);
                  if (next && !isSameMonth(day, calendarMonth)) {
                    onJumpToMonth(new Date(day));
                  }
                }}
                activeOpacity={0.7}
                className="aspect-square w-[14.28%] items-center justify-center py-0.5"
              >
                <View
                  className="min-h-[32px] min-w-[32px] items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isSelected
                      ? chartColors.primary
                      : hasWorkout
                        ? chartColors.primaryAlpha
                        : 'transparent',
                    borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                    borderColor: isSelected
                      ? chartColors.primaryDark
                      : isToday
                        ? chartColors.primary
                        : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.35,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: isSelected
                        ? '#0f0f0f'
                        : isCurrentMonth
                          ? chartColors.text
                          : chartColors.textMuted,
                    }}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedDate !== null && (
          <TouchableOpacity
            onPress={() => onSelectDate(null)}
            className="mt-3 self-center rounded-full border border-border bg-muted/50 px-4 py-2"
          >
            <Text className="text-sm font-medium text-foreground">{t('allDays')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
