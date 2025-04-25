// src/contexts/ThemeContext.tsx
import React, {createContext, useContext} from 'react';
import {StyleSheet} from 'react-native';

const colors = {
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  primary: '#0f172a',
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  destructive: '#ef4444',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#0f172a',
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: 16},
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 16,
  },
  text: {fontSize: 16, color: colors.foreground},
  textMuted: {fontSize: 14, color: colors.mutedForeground},
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextSecondary: {
    color: colors.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  weightDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 24,
  },
  bluetoothStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bluetoothStatusText: {marginLeft: 8, fontSize: 14, fontWeight: '500'},
});

type ThemeContextType = {
  colors: typeof colors;
  styles: typeof styles;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => (
  <ThemeContext.Provider value={{colors, styles}}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
