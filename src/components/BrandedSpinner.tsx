// src/components/BrandedSpinner.tsx
// Signature Luxury Beauty Loader: Glowing Cursive 'eb' Monogram Crest with Breathing Halo
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface BrandedSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    showLabel?: boolean;
    labelText?: string;
}

const SIZES = {
    small: {
        crestSize: 32,
        fontSize: 15,
        haloSize: 44,
        borderWidth: 1.5,
        dotGap: 4,
    },
    medium: {
        crestSize: 58,
        fontSize: 26,
        haloSize: 78,
        borderWidth: 2,
        dotGap: 8,
    },
    large: {
        crestSize: 84,
        fontSize: 38,
        haloSize: 110,
        borderWidth: 2.5,
        dotGap: 12,
    },
};

export const BrandedSpinner: React.FC<BrandedSpinnerProps> = ({
    size = 'medium',
    color = COLORS.primary,
    showLabel = false,
    labelText = 'Loading...',
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const config = SIZES[size];

    const pulseAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const textShimmer = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        // 1. Smooth Breathing Pulse
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // 2. Slow hypnotic rotation on outer halo
        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 5500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // 3. Text Shimmer
        const textPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(textShimmer, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(textShimmer, {
                    toValue: 0.65,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        rotate.start();
        textPulse.start();

        return () => {
            pulse.stop();
            rotate.stop();
            textPulse.stop();
        };
    }, []);

    const haloScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.92, 1.14],
    });

    const haloOpacity = pulseAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.25, 0.6, 0.25],
    });

    const crestScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.97, 1.04],
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.container,
                    {
                        width: config.haloSize,
                        height: config.haloSize,
                    },
                ]}
            >
                {/* Outer Breathing Halo */}
                <Animated.View
                    style={[
                        styles.outerHalo,
                        {
                            width: config.haloSize,
                            height: config.haloSize,
                            borderRadius: config.haloSize / 2,
                            borderColor: color,
                            borderWidth: size === 'small' ? 1 : 1.5,
                            opacity: haloOpacity,
                            transform: [{ scale: haloScale }, { rotate: spin }],
                        },
                    ]}
                />

                {/* Inner Glowing Cursive 'eb' Monogram Crest */}
                <Animated.View
                    style={[
                        styles.crest,
                        {
                            width: config.crestSize,
                            height: config.crestSize,
                            borderRadius: config.crestSize / 2,
                            borderColor: color,
                            borderWidth: config.borderWidth,
                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                            transform: [{ scale: crestScale }],
                            shadowColor: color,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                            elevation: 6,
                        },
                    ]}
                >
                    <Animated.Text
                        style={[
                            styles.cursiveText,
                            {
                                fontSize: config.fontSize,
                                color: color,
                                opacity: textShimmer,
                            },
                        ]}
                    >
                        eb
                    </Animated.Text>
                </Animated.View>
            </View>

            {showLabel && (
                <Animated.Text
                    style={[
                        styles.label,
                        {
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            opacity: textShimmer,
                            marginTop: size === 'large' ? 16 : 10,
                        },
                    ]}
                >
                    {labelText}
                </Animated.Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    outerHalo: {
        position: 'absolute',
        borderStyle: 'dashed',
    },
    crest: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cursiveText: {
        fontFamily: FONTS.playfairBold,
        fontStyle: 'italic',
        textAlign: 'center',
        includeFontPadding: false,
        letterSpacing: -0.5,
    },
    label: {
        fontFamily: FONTS.sansMedium,
        fontSize: 12,
        letterSpacing: 0.5,
    },
});

export default BrandedSpinner;
