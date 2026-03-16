import React from 'react';
import { Text, View } from 'react-native';

import { Flame } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

export function WorkoutEmptyState() {
  const { t } = useI18n();

  return (
    <View className="items-center px-6 py-12">
      <View className="mb-4 rounded-full bg-muted p-6">
        <Flame className="text-muted-foreground" size={32} />
      </View>
      <Text className="mb-2 text-lg font-semibold text-foreground">{t('noWorkoutsYet')}</Text>
      <Text className="max-w-xs text-center text-muted-foreground">{t('noWorkoutsYetSub')}</Text>
    </View>
  );
}
