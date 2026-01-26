import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Check, Globe } from 'lucide-react-native';

import { useI18n } from '@/components/I18nProvider';
import i18n, { getAvailableLanguages } from '@/lib/i18n';

// Separate component for modal content - reads i18n.locale directly
function LanguageModalContent({
  locale,
  onSelectLanguage,
  onClose,
}: {
  locale: string;
  onSelectLanguage: (code: string) => void;
  onClose: () => void;
}) {
  const languages = getAvailableLanguages();

  // Read current locale directly from i18n singleton
  const currentLocale = i18n.locale;

  return (
    <View className="flex-1 items-center justify-center bg-black/50 p-6">
      <View className="w-full max-w-md rounded-2xl bg-card p-6">
        <Text className="mb-6 text-xl font-bold text-foreground">{i18n.t('selectLanguage')}</Text>

        <ScrollView className="max-h-96">
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => onSelectLanguage(lang.code)}
              className="mb-2 flex-row items-center justify-between rounded-lg bg-muted/50 p-4"
            >
              <View>
                <Text className="font-medium text-foreground">{lang.nativeName}</Text>
                <Text className="text-sm text-muted-foreground">{lang.name}</Text>
              </View>
              {currentLocale === lang.code && <Check className="text-primary" size={20} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={onClose} className="mt-6 rounded-xl bg-primary py-3">
          <Text className="text-center font-semibold text-primary-foreground">
            {i18n.t('close')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function LanguageSelector() {
  const [modalVisible, setModalVisible] = useState(false);
  const { locale, setLocale } = useI18n();
  const languages = getAvailableLanguages();

  const handleLanguageChange = async (langCode: string) => {
    await setLocale(langCode);
    // Brief delay so user sees the language change, then close
    setTimeout(() => {
      setModalVisible(false);
    }, 500);
  };

  const currentLanguage = languages.find((l) => l.code === locale);

  // Compute label fresh on every render, explicitly using locale to ensure re-render updates it
  const languageLabel = locale ? i18n.t('language') : i18n.t('language');

  return (
    <>
      <TouchableOpacity
        key={`selector-${locale}`}
        onPress={() => setModalVisible(true)}
        className="flex-row items-center justify-between rounded-xl bg-card p-4"
      >
        <View className="flex-row items-center gap-3">
          <Globe className="text-primary" size={20} />
          <View>
            <Text className="text-sm font-medium text-foreground">{languageLabel}</Text>
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
        <LanguageModalContent
          key={locale}
          locale={locale}
          onSelectLanguage={handleLanguageChange}
          onClose={() => setModalVisible(false)}
        />
      </Modal>
    </>
  );
}
