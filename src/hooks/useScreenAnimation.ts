// src/hooks/useScreenAnimation.ts
/**
 * Premium Screen Translate & Fade Animation Hook.
 *
 * Triggers every time a screen comes into focus (tab change, back navigation, or initial mount).
 * Smoothly translates upward (16px -> 0px) and fades in (opacity 0 -> 1).
 *
 * Safe & robust: Runs on both useFocusEffect and useEffect so screens NEVER stay blank.
 */
import { useRef, useCallback, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export interface ScreenAnimationConfig {
    /** Vertical slide offset in points. Default: 16 */
    translateY?: number;
    /** Animation duration in ms. Default: 260 */
    duration?: number;
}

export const useScreenAnimation = (config?: ScreenAnimationConfig) => {
    const { translateY: initY = 16, duration = 260 } = config ?? {};

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(initY)).current;

    const animate = useCallback(() => {
        opacity.setValue(0);
        translateY.setValue(initY);

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration + 40,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, translateY, initY, duration]);

    useFocusEffect(animate);

    useEffect(() => {
        animate();
    }, [animate]);

    const animStyle = {
        opacity,
        transform: [{ translateY }],
    };

    return { animStyle, opacity, translateY };
};
