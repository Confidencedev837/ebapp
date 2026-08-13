import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';


const VerifiedBadge = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View
            style={{
                backgroundColor: isDark ? COLORS.bgDark : COLORS.white,
                borderRadius: RADIUS.full,
                padding: 2
            }}
        >
            <MaterialIcons name="verified-user" size={14} color={COLORS.success} />
        </View>
    );
};

export default VerifiedBadge;
