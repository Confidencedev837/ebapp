// src/components/Snackbar.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onDismiss: () => void;
}

const Snackbar: React.FC<Props> = ({ visible, message, type = 'info', duration = 3000, onDismiss }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const translateY = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();

            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            handleDismiss();
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onDismiss());
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return COLORS.success;
            case 'error': return '#EF4444';
            default: return isDark ? COLORS.surfaceDark : COLORS.textDark;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'error';
            default: return 'info';
        }
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getBgColor(),
                    transform: [{ translateY }],
                    ...SHADOWS.md,
                }
            ]}
        >
            <View className="flex-row items-center flex-1 pr-2">
                <MaterialIcons name={getIcon()} size={20} color="white" />
                <Text
                    className="text-white ml-3 text-sm flex-1"
                    style={{ fontFamily: FONTS.sansMedium }}
                >
                    {message}
                </Text>
            </View>
            <TouchableOpacity onPress={handleDismiss}>
                <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
    }
});

export default Snackbar;
