import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Check, X } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';

type Props = {
  visible: boolean;
  title: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function NameInputModal({
  visible,
  title,
  label,
  placeholder,
  value,
  onChangeValue,
  onSave,
  onClose,
}: Props) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X className="text-muted-foreground" size={24} />
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">{label}</Text>
            <TextInput
              value={value}
              onChangeText={onChangeValue}
              placeholder={placeholder}
              placeholderTextColor="#a8a29e"
              className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center rounded-xl bg-secondary p-3"
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-secondary-foreground">{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              className="flex-1 flex-row items-center justify-center rounded-xl bg-primary p-3"
              activeOpacity={0.7}
            >
              <Check className="mr-2 text-primary-foreground" size={18} />
              <Text className="font-semibold text-primary-foreground">{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
