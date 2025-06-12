import React, {createContext, useContext, useEffect, useState} from 'react';
import {StyleSheet, ColorSchemeName, Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Palette = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  border: string;
};

const light: Palette = {
  background: '#F8F9FC',
  foreground: '#0F172A',
  card: '#ffffff',
  primary: '#7960F4',
  primaryForeground: '#ffffff',
  secondary: '#E2E8F0',
  secondaryForeground: '#475569',
  muted: '#E2E8F0',
  mutedForeground: '#64748b',
  destructive: '#ef4444',
  border: '#CBD5E1',
};

const dark: Palette = {
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#1e293b',
  primary: '#9380FF',
  primaryForeground: '#0f172a',
  secondary: '#334155',
  secondaryForeground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  destructive: '#f87171',
  border: '#334155',
};

/* ------------ helpers ------------ */
const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: c.background},
    content: {padding: 16},
    h1: {fontSize: 24, fontWeight: 'bold', color: c.foreground, marginBottom: 16},
    text: {fontSize: 16, color: c.foreground},
    textMuted: {fontSize: 14, color: c.mutedForeground},
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      backgroundColor: c.background,
      color: c.foreground,
      fontSize: 16,
      marginBottom: 16,
    },
    inputLabel: {fontSize: 14, fontWeight: '500', color: c.foreground, marginBottom: 8},
    buttonPrimary: {
      backgroundColor: c.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {color: c.primaryForeground, fontSize: 16, fontWeight: '500'},
    buttonTextSecondary: {color: c.mutedForeground, fontSize: 16, fontWeight: '500'},
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
    },
    cardTitle: {fontSize: 18, fontWeight: 'bold', color: c.foreground, marginBottom: 8},
    weightDisplay: {fontSize: 48, fontWeight: 'bold', color: c.primary, textAlign: 'center'},
  });

/* ------------ contexto ------------ */
type ThemeCtx = {
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx>({} as ThemeCtx);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isDark, setIsDark] = useState(false);

  /* 1 ) leer preferencia almacenada o sistema */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        setIsDark(saved === 'dark');
      } else {
        const sys: ColorSchemeName = Appearance.getColorScheme();
        setIsDark(sys === 'dark');
      }
    })();
  }, []);

  /* 2 ) guardar cambio */
  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const palette = isDark ? dark : light;
  return (
    <ThemeContext.Provider value={{colors: palette, styles: makeStyles(palette), isDark, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
