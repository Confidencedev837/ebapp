import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    Easing,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZE, RADIUS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { EmptyStateIllustration, EmptyIllustrationType } from './EmptyStateIllustrations';

interface EmptyStateProps {
    type: EmptyIllustrationType;
    title: string;
    description?: string;
    primaryActionTitle?: string;
    onPrimaryAction?: () => void;
    secondaryActionTitle?: string;
    onSecondaryAction?: () => void;
    containerStyle?: ViewStyle;
    illustrationSize?: number;
}

export const EmptyState = ({
    type,
    title,
    description,
    primaryActionTitle,
    onPrimaryAction,
    secondaryActionTitle,
    onSecondaryAction,
    containerStyle,
    illustrationSize = 160
}: EmptyStateProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Entry animation
    const enterValue = useSharedValue(0);

    useEffect(() => {
        enterValue.value = withDelay(
            150, 
            withTiming(1, { 
                duration: 600, 
                easing: Easing.out(Easing.back(1.2)) 
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: enterValue.value,
            transform: [
                { 
                    translateY: interpolate(enterValue.value, [0, 1], [20, 0], Extrapolate.CLAMP) 
                },
                {
                    scale: interpolate(enterValue.value, [0, 1], [0.95, 1], Extrapolate.CLAMP)
                }
            ]
        };
    });

    return (
        <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
            <View style={styles.illustrationWrapper}>
                <EmptyStateIllustration type={type} size={illustrationSize} />
            </View>
            
            <Text 
                style={[
                    styles.title, 
                    { color: isDark ? COLORS.white : COLORS.textDark }
                ]}
            >
                {title}
            </Text>
            
            {description && (
                <Text style={styles.description}>
                    {description}
                </Text>
            )}

            <View style={styles.actionsContainer}>
                {primaryActionTitle && onPrimaryAction && (
                    <TouchableOpacity 
                        style={[styles.primaryButton, { backgroundColor: COLORS.primary }]}
                        onPress={onPrimaryAction}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>{primaryActionTitle}</Text>
                    </TouchableOpacity>
                )}

                {secondaryActionTitle && onSecondaryAction && (
                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={onSecondaryAction}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.secondaryButtonText, { color: COLORS.primary }]}>
                            {secondaryActionTitle}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    illustrationWrapper: {
        marginBottom: 32,
    },
    title: {
        fontFamily: FONTS.playfairBold,
        fontSize: FONT_SIZE.h3,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 28,
    },
    description: {
        fontFamily: FONTS.sansRegular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    actionsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    primaryButton: {
        width: '100%',
        maxWidth: 280,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: FONTS.montserratBold,
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: FONTS.sansBold,
        fontSize: FONT_SIZE.md,
    }
});
