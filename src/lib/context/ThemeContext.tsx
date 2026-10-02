import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const deviceColorScheme = useDeviceColorScheme();

  const getInitialTheme = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  };

  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialTheme);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserPreference, setHasUserPreference] = useState(false);

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setThemeModeState(stored);
          setHasUserPreference(true);
        } else {
          // Se não há preferência manual gravada, acompanha o sistema
          setThemeModeState(getInitialTheme());
          setHasUserPreference(false);
        }
      } catch {
        setThemeModeState(getInitialTheme());
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredTheme();
  }, []);

  useEffect(() => {
    if (hasUserPreference) return;

    if (deviceColorScheme === 'dark' || deviceColorScheme === 'light') {
      setThemeModeState(deviceColorScheme);
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (!hasUserPreference) {
          setThemeModeState(e.matches ? 'dark' : 'light');
        }
      };
      mediaQuery.addEventListener?.('change', handler);
      return () => mediaQuery.removeEventListener?.('change', handler);
    }
  }, [deviceColorScheme, hasUserPreference]);

  const setThemeMode = async (mode: ThemeMode) => {
    setHasUserPreference(true);
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
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      }
      if (document.body) {
        document.body.style.backgroundColor = bg;
        document.body.classList.toggle('dark', isDark);
      }
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.setAttribute('content', bg);

      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta');
        statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(statusBarMeta);
      }
      statusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
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
