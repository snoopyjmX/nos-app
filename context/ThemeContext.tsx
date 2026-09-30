import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextData {
  themeMode: ThemeMode;
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@nos_theme_mode';

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setThemeModeState(stored);
        } else {
          // Se for legado 'system' ou vazio, define 'light'
          setThemeModeState('light');
        }
      } catch {
        setThemeModeState('light');
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignora falha de gravação local
    }
  };

  const toggleTheme = async () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    await setThemeMode(next);
  };

  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const bg = isDark ? '#0F0D18' : '#F8F9FC';
      if (document.documentElement) {
        document.documentElement.style.backgroundColor = bg;
      }
      if (document.body) {
        document.body.style.backgroundColor = bg;
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', bg);
      }
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
      }
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        mode: themeMode,
        isDark,
        setThemeMode,
        setMode: setThemeMode,
        toggleTheme,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} animated={false} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
