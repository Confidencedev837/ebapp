// src/store/useThemeStore.ts
import { create } from 'zustand';
import { ThemeMode } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'theme-mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
    themeMode: ThemeMode.SYSTEM,
    setThemeMode: async (mode) => {
        set({ themeMode: mode });
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    },
    toggleTheme: async () => {
        const { themeMode } = get();
        let nextMode: ThemeMode;
        if (themeMode === ThemeMode.LIGHT) nextMode = ThemeMode.DARK;
        else if (themeMode === ThemeMode.DARK) nextMode = ThemeMode.SYSTEM;
        else nextMode = ThemeMode.LIGHT;

        set({ themeMode: nextMode });
        await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    },
}));
