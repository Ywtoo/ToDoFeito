import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../styles/variables';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'auto' | 'light' | 'blue' | 'dark' | 'veryDark' | 'sepia';

interface ThemeContextType {
  theme: typeof colors.light;
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
  fontScale: number;
  setFontScale: (v: number) => void;
  setThemeMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  // Por padrão, segue o sistema ('auto'). O usuário pode salvar preferência.
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [fontScale, setFontScale] = useState<number>(1);

  // try to load persisted font scale
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('@pref_fontScale');
        if (mounted && v) setFontScale(Number(v) || 1);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // try to load persisted theme mode
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await AsyncStorage.getItem('@pref_themeMode');
        if (mounted && t) setMode(t as ThemeMode);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // persist fontScale when it changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('@pref_fontScale', String(fontScale));
      } catch {
        // ignore
      }
    })();
  }, [fontScale]);

  // Determine active theme object based on mode and system setting
  const resolvedMode = mode === 'auto' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : mode;
  const theme = resolvedMode === 'dark' ? colors.dark 
    : resolvedMode === 'blue' ? colors.blue 
    : resolvedMode === 'veryDark' ? colors.veryDark 
    : resolvedMode === 'sepia' ? colors.sepia 
    : colors.light;
  const isDark = resolvedMode === 'dark' || resolvedMode === 'veryDark';

  const toggleTheme = () => {
    // simple toggle between light and dark (user-facing quick toggle)
    setMode((prev) => (prev === 'dark' || prev === 'veryDark' ? 'light' : 'dark'));
  };

  const setThemeMode = (m: ThemeMode) => {
    setMode(m);
    // persist
    (async () => {
      try {
        await AsyncStorage.setItem('@pref_themeMode', m);
      } catch {
        // ignore
      }
    })();
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, isDark, fontScale, setFontScale, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
