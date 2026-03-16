import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Dumbbell, Plus } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = { isEmpty: boolean; onAddDefaults: () => void };

export function SectionsEmptyState({ isEmpty, onAddDefaults }: Props) {
  const { t } = useI18n();

  return (
    <View className="items-center py-12">
      <Dumbbell className="mb-4 text-muted-foreground" size={48} />
      <Text className="text-center text-xl font-bold text-foreground">
        {t('sectionScreen.noSectionsYet')}
      </Text>
      <Text className="mt-2 px-8 text-center text-muted-foreground">
        {t('sectionScreen.createFirstSection')}
      </Text>
      {isEmpty && (
        <TouchableOpacity
          onPress={onAddDefaults}
          className="mt-6 flex-row items-center rounded-xl bg-secondary px-6 py-3"
          activeOpacity={0.7}
        >
          <Plus className="mr-2 text-secondary-foreground" size={18} />
          <Text className="font-semibold text-secondary-foreground">
            {t('sectionScreen.addDefaultCategories')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
