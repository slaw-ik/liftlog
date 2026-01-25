import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Check, Globe } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import { getAvailableLanguages } from '@/lib/i18n';

export function LanguageSelector() {
  const [modalVisible, setModalVisible] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const languages = getAvailableLanguages();

  const handleLanguageChange = async (langCode: string) => {
    await setLocale(langCode);
    setModalVisible(false);
  };

  const currentLanguage = languages.find((l) => l.code === locale);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center justify-between rounded-xl bg-card p-4"
      >
        <View className="flex-row items-center gap-3">
          <Globe className="text-primary" size={20} />
          <View>
            <Text className="text-sm font-medium text-foreground">{t('language')}</Text>
            <Text className="text-xs text-muted-foreground">{currentLanguage?.nativeName}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-6">
          <View className="w-full max-w-md rounded-2xl bg-card p-6">
            <Text className="mb-6 text-xl font-bold text-foreground">{t('selectLanguage')}</Text>

            <ScrollView className="max-h-96">
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  className="mb-2 flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
                >
                  <View>
                    <Text className="font-medium text-foreground">{lang.nativeName}</Text>
                    <Text className="text-sm text-muted-foreground">{lang.name}</Text>
                  </View>
                  {locale === lang.code && <Check className="text-primary" size={20} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-6 rounded-xl bg-primary py-3"
            >
              <Text className="text-center font-semibold text-primary-foreground">
                {t('close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
