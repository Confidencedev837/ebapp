// src/components/UpcomingBookingBanner.tsx
import React, { useRef } from 'react';
import { View, Text, Animated, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Booking } from '@/types';
import { COLORS, RADIUS, SHADOWS, FONTS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { formatTime12Hour, formatFriendlyDate } from '@/utils/timeFormat';
import { getAvatarUrl } from '@/services/avatarUtils';
import * as Haptics from 'expo-haptics';

interface Props {
    booking: Booking;
    onPress?: () => void;
}

const UpcomingBookingBanner: React.FC<Props> = ({ booking, onPress }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isConfirmed = (booking.status as string) === 'confirmed';
    const statusColor = isConfirmed ? '#10B981' : COLORS.primary;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 6,
            tension: 140,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 70,
        }).start();
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    const friendlyDate = formatFriendlyDate(booking.date);
    const friendlyTime = formatTime12Hour(booking.time);
    const service = booking.services;
    const agent = service?.profiles;
    const serviceImage = Array.isArray(service?.image_url) ? service.image_url[0] : service?.image_url;
    const agentAvatar = getAvatarUrl(agent?.full_name, agent?.avatar_url);

    // Gradient colors for luxury card aesthetic
    const gradientColors: [string, string] = isDark
        ? ['#201219', '#141416']
        : ['#FFF5F7', '#FFFFFF'];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }],
                    borderColor: isDark ? 'rgba(255, 98, 137, 0.25)' : 'rgba(255, 98, 137, 0.2)',
                },
                SHADOWS.md,
            ]}
        >
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.pressable}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                >
                    {/* Top Accent Ribbon */}
                    <View style={styles.topRibbon}>
                        <View style={styles.ribbonTag}>
                            <MaterialCommunityIcons name="sparkles" size={13} color={COLORS.primary} />
                            <Text style={styles.ribbonTagText}>
                                UPCOMING APPOINTMENT
                            </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: isDark
                                        ? `${statusColor}22`
                                        : `${statusColor}15`,
                                    borderColor: `${statusColor}40`,
                                },
                            ]}
                        >
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {booking.status?.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Middle: Service Info + Image Thumbnail */}
                    <View style={styles.mainContentRow}>
                        {/* Service Thumbnail / Agent Picture */}
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: serviceImage || agentAvatar }}
                                style={styles.serviceImage}
                                contentFit="cover"
                                placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                                transition={250}
                            />
                            {agent && (
                                <View style={styles.agentMiniBadge}>
                                    <Image
                                        source={{ uri: agentAvatar }}
                                        style={styles.agentMiniAvatar}
                                        contentFit="cover"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Text Details */}
                        <View style={styles.detailsColumn}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.serviceTitle,
                                    { color: isDark ? COLORS.white : COLORS.textDark },
                                ]}
                            >
                                {service?.name || 'Beauty Service'}
                            </Text>

                            {agent?.full_name && (
                                <Text
                                    numberOfLines={1}
                                    style={[styles.agentName, { color: COLORS.textMuted }]}
                                >
                                    with <Text style={{ fontFamily: FONTS.sansBold, color: isDark ? '#F3F4F6' : COLORS.textDark }}>{agent.full_name}</Text>
                                </Text>
                            )}

                            {/* Schedule Pill */}
                            <View
                                style={[
                                    styles.schedulePill,
                                    {
                                        backgroundColor: isDark ? '#2B1C22' : '#FFEBF0',
                                        borderColor: isDark ? 'rgba(255, 98, 137, 0.3)' : 'rgba(255, 98, 137, 0.2)',
                                    },
                                ]}
                            >
                                <MaterialIcons name="event" size={13} color={COLORS.primary} />
                                <Text style={styles.schedulePillDate}>
                                    {friendlyDate}
                                </Text>
                                <Text style={styles.schedulePillDivider}>•</Text>
                                <MaterialIcons name="schedule" size={13} color={COLORS.primary} />
                                <Text style={styles.schedulePillTime}>
                                    {friendlyTime}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Bottom Action Footer Strip */}
                    <View
                        style={[
                            styles.footerStrip,
                            {
                                borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                            },
                        ]}
                    >
                        <Text style={[styles.footerPrompt, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                            Tap to view appointment details & directions
                        </Text>
                        <View style={styles.chevronPill}>
                            <MaterialIcons name="arrow-forward" size={15} color={COLORS.primary} />
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        borderRadius: RADIUS.xl,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    pressable: {
        borderRadius: RADIUS.xl,
    },
    gradientBackground: {
        padding: 16,
        borderRadius: RADIUS.xl,
    },
    topRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ribbonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ribbonTagText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 10,
        color: COLORS.primary,
        letterSpacing: 1.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    mainContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    imageWrapper: {
        position: 'relative',
    },
    serviceImage: {
        width: 72,
        height: 72,
        borderRadius: RADIUS.lg,
    },
    agentMiniBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    agentMiniAvatar: {
        width: '100%',
        height: '100%',
    },
    detailsColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 17,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    agentName: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginBottom: 8,
    },
    schedulePill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        gap: 4,
    },
    schedulePillDate: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.primary,
    },
    schedulePillDivider: {
        color: COLORS.primary,
        fontSize: 9,
        opacity: 0.6,
    },
    schedulePillTime: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.primary,
    },
    footerStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    footerPrompt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 11,
    },
    chevronPill: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 98, 137, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default UpcomingBookingBanner;
