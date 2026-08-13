// src/components/ProfileCompletionBanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

// Compute completion % based on required fields per user type
const getCompletion = (profile: any): { pct: number; missing: string[] } => {
    if (!profile) return { pct: 0, missing: [] };

    const isAgent = profile.user_type === 'agent';
    const fields: { key: string; label: string }[] = isAgent
        ? [
            { key: 'full_name', label: 'Name' },
            { key: 'bio', label: 'Bio' },
            { key: 'location', label: 'Location' },
            { key: 'specialization', label: 'Specialization' },
            { key: 'years_exp', label: 'Experience' },
            { key: 'avatar_url', label: 'Photo' },
        ]
        : [
            { key: 'full_name', label: 'Name' },
            { key: 'location', label: 'Location' },
            { key: 'service_type', label: 'Service preference' },
            { key: 'avatar_url', label: 'Photo' },
        ];

    const missing = fields.filter(f => !profile[f.key]).map(f => f.label);
    const pct = Math.round(((fields.length - missing.length) / fields.length) * 100);
    return { pct, missing };
};

const ProfileCompletionBanner = () => {
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const navigation = useNavigation<any>();
    const isDark = theme === 'dark';

    const [dismissed, setDismissed] = useState(false);

    const { pct, missing } = getCompletion(profile);
    const isComplete = pct === 100;

    // Animate progress bar on mount
    const progressAnim = useRef(new Animated.Value(0)).current;
    const mountAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isComplete || dismissed) return;

        // Entrance
        Animated.timing(mountAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
        }).start();

        // Progress bar fill
        Animated.timing(progressAnim, {
            toValue: pct / 100,
            duration: 800,
            delay: 250,
            useNativeDriver: false,
        }).start();

        // Shimmer loop
        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        );
        shimmer.start();
        return () => shimmer.stop();
    }, [pct, isComplete, dismissed]);

    if (isComplete || dismissed) return null;

    const missingLabel = missing.slice(0, 2).join(', ') + (missing.length > 2 ? ` +${missing.length - 2} more` : '');

    // Icon based on completion level
    const iconName =
        pct < 30 ? 'person-add-outline'
        : pct < 70 ? 'create-outline'
        : 'checkmark-circle-outline';

    const iconColor =
        pct < 30 ? '#6C63FF'
        : pct < 70 ? COLORS.primary
        : '#4ADE80';

    const iconBg =
        pct < 30 ? 'rgba(108,99,255,0.15)'
        : pct < 70 ? 'rgba(255,98,137,0.15)'
        : 'rgba(74,222,128,0.15)';

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    opacity: mountAnim,
                    transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('EditProfile')}
                style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? '#1A1A1A' : COLORS.white,
                        borderColor: isDark ? 'rgba(255,98,137,0.25)' : 'rgba(255,98,137,0.2)',
                    },
                    isDark ? styles.cardShadowDark : styles.cardShadowLight,
                ]}
            >
                {/* Pink glow strip on left */}
                <View style={[styles.accentStrip, { backgroundColor: COLORS.primary }]} />

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName as any} size={22} color={iconColor} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            Complete your profile
                        </Text>
                        <View style={[styles.pctBadge, { backgroundColor: isDark ? 'rgba(255,98,137,0.2)' : COLORS.blush }]}>
                            <Text style={[styles.pctText, { color: COLORS.primary }]}>{pct}%</Text>
                        </View>
                    </View>

                    <Text style={[styles.subtitle, { color: COLORS.textMuted }]} numberOfLines={1}>
                        Missing: {missingLabel}
                    </Text>

                    {/* Progress bar */}
                    <View style={[styles.barTrack, { backgroundColor: isDark ? COLORS.borderDark : '#F0E6EA' }]}>
                        <Animated.View
                            style={[
                                styles.barFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor: COLORS.primary,
                                },
                            ]}
                        >
                            {/* Shimmer overlay */}
                            <Animated.View
                                style={[
                                    StyleSheet.absoluteFill,
                                    styles.shimmer,
                                    {
                                        opacity: shimmerAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0, 0.35, 0],
                                        }),
                                    },
                                ]}
                            />
                        </Animated.View>
                    </View>
                </View>

                {/* Chevron + Dismiss */}
                <View style={styles.actions}>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); setDismissed(true); }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.dismissBtn}
                    >
                        <Ionicons name="close" size={14} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: SPACING.screen,
        marginTop: 8,
        marginBottom: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 0,
        overflow: 'hidden',
    },
    cardShadowLight: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardShadowDark: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 5,
    },
    accentStrip: {
        width: 4,
        alignSelf: 'stretch',
        borderRadius: 2,
        marginRight: 12,
        marginLeft: 0,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
    },
    title: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        flex: 1,
    },
    pctBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    pctText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 11,
    },
    subtitle: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        marginBottom: 8,
    },
    barTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    shimmer: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 2,
    },
    actions: {
        marginLeft: 8,
        alignItems: 'center',
        gap: 6,
    },
    dismissBtn: {
        marginTop: 4,
    },
});

export default ProfileCompletionBanner;
