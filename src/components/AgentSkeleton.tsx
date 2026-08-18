// src/components/AgentSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export const AgentRowSkeleton = ({ index = 0 }: { index?: number }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const shimmerAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 0.75,
                    duration: 750,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.3,
                    duration: 750,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [index]);

    const bgPlaceholder = isDark ? '#2A2A2A' : '#E2E8F0';

    return (
        <View
            style={[
                styles.rowContainer,
                {
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                },
                SHADOWS.sm,
            ]}
        >
            {/* Avatar skeleton on the far left */}
            <Animated.View
                style={[
                    styles.avatarSkeleton,
                    {
                        backgroundColor: bgPlaceholder,
                        opacity: shimmerAnim,
                    },
                ]}
            />

            {/* Middle details skeleton */}
            <View style={styles.centerWrap}>
                {/* Name + badge placeholder */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Animated.View
                        style={[
                            styles.nameSkeleton,
                            {
                                backgroundColor: bgPlaceholder,
                                opacity: shimmerAnim,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.badgeSkeleton,
                            {
                                backgroundColor: bgPlaceholder,
                                opacity: shimmerAnim,
                            },
                        ]}
                    />
                </View>

                {/* Specialization / Category pill placeholder */}
                <Animated.View
                    style={[
                        styles.categorySkeleton,
                        {
                            backgroundColor: bgPlaceholder,
                            opacity: shimmerAnim,
                        },
                    ]}
                />

                {/* Location + Rating placeholder */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Animated.View
                        style={[
                            styles.locationSkeleton,
                            {
                                backgroundColor: bgPlaceholder,
                                opacity: shimmerAnim,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.ratingSkeleton,
                            {
                                backgroundColor: bgPlaceholder,
                                opacity: shimmerAnim,
                            },
                        ]}
                    />
                </View>
            </View>

            {/* Far Right: Follow button pill skeleton */}
            <Animated.View
                style={[
                    styles.followBtnSkeleton,
                    {
                        backgroundColor: bgPlaceholder,
                        opacity: shimmerAnim,
                    },
                ]}
            />
        </View>
    );
};

export const AgentSkeletonList = ({ count = 5 }: { count?: number }) => {
    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
            {Array.from({ length: count }).map((_, i) => (
                <AgentRowSkeleton key={i} index={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    avatarSkeleton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 14,
    },
    centerWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    nameSkeleton: {
        width: '55%',
        height: 15,
        borderRadius: 6,
    },
    badgeSkeleton: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    categorySkeleton: {
        width: '40%',
        height: 12,
        borderRadius: 5,
    },
    locationSkeleton: {
        width: '32%',
        height: 10,
        borderRadius: 4,
    },
    ratingSkeleton: {
        width: '20%',
        height: 10,
        borderRadius: 4,
    },
    followBtnSkeleton: {
        width: 78,
        height: 32,
        borderRadius: RADIUS.full,
        marginLeft: 10,
    },
});

export default AgentSkeletonList;
