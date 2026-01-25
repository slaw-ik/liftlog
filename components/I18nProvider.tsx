import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import i18n, {
  getCurrentLanguage,
  initializeI18n,
  setLanguage as setI18nLanguage,
} from '@/lib/i18n';

type I18nContextType = {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: string, options?: object) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(getCurrentLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeI18n();
      setLocaleState(getCurrentLanguage());
      setIsInitialized(true);
    };
    init();
  }, []);

  const setLocale = useCallback(async (newLocale: string) => {
    await setI18nLanguage(newLocale);
    setLocaleState(newLocale);
  }, []);

  // Translation function that depends on locale state to trigger re-renders
  const t = useCallback(
    (key: string, options?: object) => {
      return i18n.t(key, options);
    },
    [locale]
  );

  const value = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Simple hook that just triggers re-render on language change
export function useLocale() {
  const context = useContext(I18nContext);
  return context?.locale ?? getCurrentLanguage();
}
