// سياق التطبيق العام - اللغة والثيم والبيانات
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Lang } from '@/constants/i18n';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type ColorScheme = 'dark' | 'light';

interface AppContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorScheme: ColorScheme;
  refreshTrigger: number;
  triggerRefresh: () => void;
  manufacturers: string[];
  setManufacturers: (list: string[]) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [lang, setLangState] = useState<Lang>('ar');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  // تحديد الثيم الفعلي
  const colorScheme: ColorScheme = themeMode === 'auto'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : themeMode;

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const load = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('lang');
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedLang) setLangState(savedLang as Lang);
        if (savedTheme) setThemeModeState(savedTheme as ThemeMode);
      } catch {}
    };
    load();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem('lang', l);
  }, []);

  const setThemeMode = useCallback(async (m: ThemeMode) => {
    setThemeModeState(m);
    await AsyncStorage.setItem('themeMode', m);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  return (
    <AppContext.Provider value={{
      lang, setLang,
      themeMode, setThemeMode,
      colorScheme,
      refreshTrigger, triggerRefresh,
      manufacturers, setManufacturers,
    }}>
      {children}
    </AppContext.Provider>
  );
}
