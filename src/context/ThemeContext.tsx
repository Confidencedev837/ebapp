// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode } from '../types';
import { useThemeStore } from '../store/useThemeStore';

interface ThemeContextType {
    theme: 'light' | 'dark';
    mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
    const { themeMode } = useThemeStore();
    const systemColorScheme = useColorScheme();

    const theme = themeMode === ThemeMode.SYSTEM
        ? (systemColorScheme || 'light')
        : themeMode;

    return (
        <ThemeContext.Provider value={{ theme: theme as 'light' | 'dark', mode: themeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
