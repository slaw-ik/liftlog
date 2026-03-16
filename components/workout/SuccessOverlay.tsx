import React from 'react';
import { Text, View } from 'react-native';

import { Check } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = { visible: boolean };

export function SuccessOverlay({ visible }: Props) {
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/60">
      <View className="rounded-full bg-primary p-6">
        <Check className="text-primary-foreground" size={48} strokeWidth={3} />
      </View>
      <Text className="mt-4 text-xl font-bold text-white">{t('setAdded')}!</Text>
    </View>
  );
}
