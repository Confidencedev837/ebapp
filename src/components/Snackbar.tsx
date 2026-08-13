// src/components/Snackbar.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'offline';

interface Props {
    visible: boolean;
    message: string;
    type?: SnackbarType;
    /** Auto-dismiss after this many ms. Omit or set 0 for persistent (no auto-dismiss). */
    duration?: number;
    onDismiss: () => void;
    /** Show a manual close (×) button even when persistent. Defaults true. */
    dismissible?: boolean;
}

const Snackbar: React.FC<Props> = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onDismiss,
    dismissible = true,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const translateY = useRef(new Animated.Value(120)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDismiss = () => {
        Animated.timing(translateY, {
            toValue: 120,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onDismiss());
    };

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();

            // Only auto-dismiss if duration > 0 and not a persistent type
            const isPersistent = !duration || duration <= 0 || type === 'offline';
            if (!isPersistent) {
                timerRef.current = setTimeout(handleDismiss, duration);
            }
        } else {
            handleDismiss();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible]);

    const getBgColor = (): string => {
        switch (type) {
            case 'success': return '#16A34A';
            case 'error':   return '#DC2626';
            case 'warning': return '#D97706';
            case 'offline': return '#1E293B';
            default:        return isDark ? COLORS.surfaceDark : COLORS.textDark;
        }
    };

    const getIcon = (): keyof typeof MaterialIcons.glyphMap => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error':   return 'error';
            case 'warning': return 'warning';
            case 'offline': return 'wifi-off';
            default:        return 'info';
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
                },
            ]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                <MaterialIcons name={getIcon()} size={20} color="white" />
                <Text
                    style={[styles.message, { fontFamily: FONTS.sansMedium }]}
                    numberOfLines={2}
                >
                    {message}
                </Text>
            </View>
            {dismissible && (
                <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={20} color="white" />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 88, // sits above the bottom tab bar
        left: 20,
        right: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
    },
    message: {
        color: '#FFFFFF',
        marginLeft: 12,
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
});

export default Snackbar;
