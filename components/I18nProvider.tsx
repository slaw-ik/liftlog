import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [, setIsInitialized] = useState(false);

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

  // Translation function - recreated when locale changes
  // Using useMemo to ensure the function identity changes when locale changes
  const t = useMemo(() => {
    // This closure captures the current locale to force consumers to re-render
    return (key: string, options?: object) => {
      // Access locale to establish dependency (even though i18n.t uses i18n.locale internally)
      void locale;
      return i18n.t(key, options);
    };
  }, [locale]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

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
