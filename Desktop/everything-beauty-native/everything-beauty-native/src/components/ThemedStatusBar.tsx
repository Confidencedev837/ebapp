// src/components/ThemedStatusBar.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThemedStatusBar: React.FC = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const isDark = theme === 'dark';
    const statusBarColor = isDark ? COLORS.black : COLORS.blush;

    return (
        <>
            <StatusBar
                style={isDark ? 'light' : 'dark'}
                backgroundColor={statusBarColor}
                translucent={true}
            />
            {Platform.OS === 'android' && (
                <View
                    style={{
                        height: insets.top,
                        backgroundColor: statusBarColor,
                    }}
                />
            )}
        </>
    );
};

export default ThemedStatusBar;
