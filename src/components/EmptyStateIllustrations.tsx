import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    Easing 
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export type EmptyIllustrationType = 
    | 'favorites' 
    | 'bookings' 
    | 'notifications' 
    | 'messages' 
    | 'search' 
    | 'services' 
    | 'posts' 
    | 'reviews' 
    | 'portfolio' 
    | 'agents' 
    | 'uploads';

interface Props {
    type: EmptyIllustrationType;
    size?: number;
}

export const EmptyStateIllustration = ({ type, size = 160 }: Props) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Animation values
    const floatValue = useSharedValue(0);
    const pulseValue = useSharedValue(1);

    useEffect(() => {
        // Soft floating animation
        floatValue.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Gentle pulse for background glows
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedFloat = useAnimatedStyle(() => ({
        transform: [{ translateY: floatValue.value }]
    }));

    const animatedPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }]
    }));

    // Shared styles
    const baseCircleSize = size * 0.7;
    const iconSize = size * 0.35;

    const renderIllustration = () => {
        switch (type) {
            case 'favorites':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(255, 98, 137, 0.15)' : 'rgba(255, 98, 137, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={[COLORS.primary, '#D946EF']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="favorite" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                            <View style={[styles.accentDot, { backgroundColor: '#F472B6', top: '10%', right: '10%' }]} />
                            <View style={[styles.accentDot, { backgroundColor: '#C084FC', bottom: '20%', left: '0%' }]} />
                        </Animated.View>
                    </View>
                );

            case 'bookings':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#F43F5E', '#9333EA']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize, borderRadius: baseCircleSize / 4 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="event-available" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                            <View style={[styles.accentDot, { backgroundColor: '#FB7185', top: '15%', left: '5%' }]} />
                        </Animated.View>
                    </View>
                );

            case 'notifications':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#38BDF8', '#818CF8']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="notifications" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                );

            case 'messages':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#34D399', '#3B82F6']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize, borderRadius: baseCircleSize / 3 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="chat-bubble-outline" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                            <View style={[styles.accentDot, { backgroundColor: '#6EE7B7', bottom: '15%', right: '5%' }]} />
                        </Animated.View>
                    </View>
                );

            case 'search':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#FBBF24', '#F43F5E']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="search" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                            <View style={[styles.accentDot, { backgroundColor: '#FCD34D', top: '25%', right: '5%' }]} />
                        </Animated.View>
                    </View>
                );

            case 'services':
            case 'portfolio':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#A78BFA', '#F472B6']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize, borderRadius: baseCircleSize / 4 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="auto-awesome" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                );

            case 'posts':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(251, 113, 133, 0.15)' : 'rgba(251, 113, 133, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#FB7185', '#F59E0B']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize, borderRadius: baseCircleSize / 5 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="photo-camera" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                );

            case 'reviews':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#FACC15', '#A855F7']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="star-rate" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                            <View style={[styles.accentDot, { backgroundColor: '#FDE047', top: '15%', left: '10%' }]} />
                            <View style={[styles.accentDot, { backgroundColor: '#D8B4FE', bottom: '15%', right: '10%' }]} />
                        </Animated.View>
                    </View>
                );

            case 'agents':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(45, 212, 191, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#2DD4BF', '#60A5FA']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="face" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                );

            case 'uploads':
                return (
                    <View style={[styles.container, { width: size, height: size }]}>
                        <Animated.View style={[animatedPulse, styles.glow, { width: size, height: size, backgroundColor: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.1)' }]} />
                        <Animated.View style={[animatedFloat, { alignItems: 'center', justifyContent: 'center' }]}>
                            <LinearGradient
                                colors={['#94A3B8', '#CBD5E1']}
                                style={[styles.circle, { width: baseCircleSize, height: baseCircleSize, borderRadius: baseCircleSize / 4 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name="cloud-upload" size={iconSize} color={COLORS.white} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                );

            default:
                return null;
        }
    };

    return renderIllustration();
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        borderRadius: 999,
    },
    circle: {
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    accentDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: 0.8,
    }
});
