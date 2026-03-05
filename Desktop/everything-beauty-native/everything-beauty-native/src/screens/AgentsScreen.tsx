// src/screens/AgentsScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const AgentsScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
            <Text style={{ color: isDark ? COLORS.white : COLORS.textDark }}>Agents Screen Placeholder</Text>
        </View>
    );
};

export default AgentsScreen;
