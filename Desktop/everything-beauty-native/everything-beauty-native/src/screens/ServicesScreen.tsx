// src/screens/ServicesScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const ServicesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
            <Text style={{ color: isDark ? COLORS.white : COLORS.textDark }}>Services Screen Placeholder</Text>
        </View>
    );
};

export default ServicesScreen;
