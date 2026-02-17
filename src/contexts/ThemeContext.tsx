import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../styles/variables';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: typeof colors.light;
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  // Por enquanto, usa o esquema do sistema. No futuro, pode ser configurável.
  const [mode, setMode] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // Sincroniza com o sistema (pode ser desabilitado no futuro quando tiver configuração manual)
    if (systemColorScheme) {
      setMode(systemColorScheme as ThemeMode);
    }
  }, [systemColorScheme]);

  const theme = mode === 'dark' ? colors.dark : colors.light;
  const isDark = mode === 'dark';

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, isDark }}>
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
