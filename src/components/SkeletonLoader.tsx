// src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonLoader: React.FC<Props> = ({ width, height, borderRadius, style }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width || '100%',
                    height: height || 20,
                    borderRadius: borderRadius || 4,
                    backgroundColor: isDark ? COLORS.surfaceDark : '#E2E8F0',
                    opacity,
                },
                style,
            ]}
        />
    );
};

export default SkeletonLoader;
