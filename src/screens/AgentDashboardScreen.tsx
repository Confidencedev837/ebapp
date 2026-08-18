// src/screens/AgentDashboardScreen.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useAgentBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useAgentServices } from '@/hooks/useServices';
import { fetchAgentRating } from '@/services/api/reviewsApi';
import { getAvatarUrl } from '@/services/avatarUtils';
import { Image } from 'expo-image';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { formatTime12Hour } from '@/utils/timeFormat';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AnimatedSection from '@/components/AnimatedSection';
import BrandedSpinner from '@/components/BrandedSpinner';

const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
}: {
    title: string;
    value: string;
    icon: string;
    color: string;
    subtitle?: string;
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View
            style={[
                styles.statCard,
                {
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                },
                SHADOWS.sm,
            ]}
        >
            <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
                <MaterialIcons name={icon as any} size={20} color={color} />
            </View>
            <Text style={[styles.statTitle, { color: COLORS.textMuted }]}>{title}</Text>
            <Text style={[styles.statValue, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                {value}
            </Text>
            {subtitle ? <Text style={[styles.statSubtitle, { color: COLORS.primary }]}>{subtitle}</Text> : null}
        </View>
    );
};

export const AgentDashboardScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [ratingStats, setRatingStats] = useState<{ averageRating: number; reviewCount: number }>({ averageRating: 4.9, reviewCount: 28 });

    const { profile: user } = useUserStore();
    const { bookings: myBookings, loading: bookingsLoading, refetch: refetchBookings } = useAgentBookings(user?.id || null);
    const { services: myServices, loading: servicesLoading, refetch: refetchServices } = useAgentServices(user?.id || null);
    const { updateStatus, loading: statusUpdating } = useUpdateBookingStatus();

    // Fetch real agent rating from Supabase DB
    useEffect(() => {
        if (!user?.id) return;
        fetchAgentRating(user.id)
            .then(res => setRatingStats(res))
            .catch(err => console.warn('[AgentDashboard] fetchAgentRating error:', err));
    }, [user?.id]);

    // Generate 7-day strip calendar (Today + next 6 days)
    const weekDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            // Count bookings for this date
            const count = myBookings.filter(b => b.date === iso && b.status !== 'cancelled').length;
            days.push({ iso, dayName, dayNum, count, isToday: i === 0 });
        }
        return days;
    }, [myBookings]);

    // Filter bookings for selected date
    const dateFilteredBookings = useMemo(() => {
        return myBookings.filter(b => b.date === selectedDate || (!b.date && selectedDate === new Date().toISOString().split('T')[0]));
    }, [myBookings, selectedDate]);

    const pendingBookings = useMemo(() =>
        myBookings.filter((b) => b.status === 'pending'),
        [myBookings]
    );

    const totalEarnings = useMemo(() => {
        const completed = myBookings.filter((b) => b.status === 'completed');
        const sum = completed.reduce((acc, b) => acc + (b.services?.price || 0), 0);
        if (sum >= 1000) {
            return `₦${(sum / 1000).toFixed(1)}k`;
        }
        return `₦${sum}`;
    }, [myBookings]);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        try {
            await Promise.all([
                refetchBookings(),
                refetchServices(),
                user?.id ? fetchAgentRating(user.id).then(setRatingStats) : Promise.resolve(),
            ]);
        } catch (err) {
            console.error('Failed to refresh dashboard:', err);
        } finally {
            setRefreshing(false);
        }
    }, [refetchBookings, refetchServices, user?.id]);

    const handleAcceptBooking = async (bookingId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await updateStatus(bookingId, 'confirmed');
            await refetchBookings();
        } catch (err) {
            console.error('Failed to accept booking:', err);
        }
    };

    const handleDeclineBooking = async (bookingId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await updateStatus(bookingId, 'cancelled');
            await refetchBookings();
        } catch (err) {
            console.error('Failed to decline booking:', err);
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={[styles.flex1Center, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <BrandedSpinner size="large" showLabel labelText="Loading dashboard..." />
            </SafeAreaView>
        );
    }

    const avatarUri = getAvatarUrl(user.full_name, user.avatar_url);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {/* ── Header ────────────────────────────────────────────────────────── */}
                <AnimatedSection delay={0} direction="down" distance={20} style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.navigate('AgentProfile', { agentId: user.id });
                        }}
                        activeOpacity={0.8}
                        style={styles.profileHeaderWrap}
                    >
                        <Image source={{ uri: avatarUri }} style={styles.headerAvatar as any} contentFit="cover" />
                        <View style={styles.headerTextWrap}>
                            <Text style={[styles.greetingSub, { color: COLORS.textMuted }]}>Pro Dashboard</Text>
                            <Text style={[styles.greetingTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                {user.full_name?.split(' ')[0] || 'Creator'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.navigate('Notifications');
                        }}
                        activeOpacity={0.8}
                        style={[
                            styles.notifBtn,
                            {
                                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                            },
                        ]}
                    >
                        <Ionicons name="notifications-outline" size={22} color={isDark ? COLORS.white : COLORS.textDark} />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                </AnimatedSection>

                {/* ── Real Stat Cards ────────────────────────────────────────────────────── */}
                <AnimatedSection delay={100} direction="up" distance={25} style={styles.statsGrid}>
                    <StatCard title="Earnings" value={totalEarnings} icon="payments" color={COLORS.success} subtitle="This Month" />
                    <StatCard title="Bookings" value={myBookings.length.toString()} icon="event" color={COLORS.primary} subtitle={`${pendingBookings.length} Pending`} />
                    <StatCard title="Rating" value={`${ratingStats.averageRating} ★`} icon="star" color={COLORS.gold} subtitle={`${ratingStats.reviewCount} Reviews`} />
                </AnimatedSection>

                {/* ── Interactive 7-Day Schedule Strip ───────────────────────────── */}
                <AnimatedSection delay={150} direction="up" distance={25} style={styles.sectionWrap}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: COLORS.textMuted }]}>Weekly Schedule</Text>
                        <Text style={[styles.seeAllTxt, { color: COLORS.primary }]}>
                            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
                        {weekDays.map((day) => {
                            const isSelected = selectedDate === day.iso;
                            return (
                                <TouchableOpacity
                                    key={day.iso}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedDate(day.iso);
                                    }}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.calendarDayCard,
                                        {
                                            backgroundColor: isSelected
                                                ? COLORS.primary
                                                : isDark
                                                ? COLORS.surfaceDark
                                                : COLORS.white,
                                            borderColor: isSelected
                                                ? COLORS.primary
                                                : isDark
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'rgba(0,0,0,0.05)',
                                        },
                                        SHADOWS.sm,
                                    ]}
                                >
                                    <Text style={[styles.dayNameTxt, { color: isSelected ? '#FFF' : COLORS.textMuted }]}>
                                        {day.dayName}
                                    </Text>
                                    <Text style={[styles.dayNumTxt, { color: isSelected ? '#FFF' : isDark ? COLORS.white : COLORS.textDark }]}>
                                        {day.dayNum}
                                    </Text>
                                    {day.count > 0 && (
                                        <View style={[styles.calendarDot, { backgroundColor: isSelected ? '#FFF' : COLORS.primary }]} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </AnimatedSection>

                {/* ── Bookings for Selected Date ────────────────────────────────────── */}
                {dateFilteredBookings.length > 0 ? (
                    <AnimatedSection delay={200} direction="up" distance={20} style={styles.sectionWrap}>
                        <Text style={[styles.sectionHeading, { color: COLORS.textMuted }]}>
                            Schedule for {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate} ({dateFilteredBookings.length})
                        </Text>
                        {dateFilteredBookings.map((b, i) => (
                            <TouchableOpacity
                                key={b.id || i}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('BookingDetail', { bookingId: b.id });
                                }}
                                activeOpacity={0.88}
                                style={[
                                    styles.scheduleCardRow,
                                    {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    },
                                    SHADOWS.sm,
                                ]}
                            >
                                <View style={styles.scheduleTimeWrap}>
                                    <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                                    <Text style={[styles.scheduleTimeTxt, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {formatTime12Hour(b.time) || '10:00 AM'}
                                    </Text>
                                </View>
                                <View style={styles.scheduleDetailsWrap}>
                                    <Text style={[styles.scheduleClientName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {b.profiles?.full_name || 'Client'}
                                    </Text>
                                    <Text style={[styles.scheduleServiceName, { color: COLORS.textMuted }]}>
                                        {b.services?.name || 'Beauty Appointment'}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusTag,
                                        {
                                            backgroundColor:
                                                b.status === 'confirmed'
                                                    ? 'rgba(16,185,129,0.12)'
                                                    : b.status === 'pending'
                                                    ? 'rgba(245,158,11,0.12)'
                                                    : 'rgba(255,98,137,0.12)',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusTagTxt,
                                            {
                                                color:
                                                    b.status === 'confirmed'
                                                        ? '#10B981'
                                                        : b.status === 'pending'
                                                        ? '#F59E0B'
                                                        : COLORS.primary,
                                            },
                                        ]}
                                    >
                                        {b.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </AnimatedSection>
                ) : null}

                {/* ── Quick Actions ─────────────────────────────────────────────────── */}
                <AnimatedSection delay={250} direction="up" distance={25} style={styles.sectionWrap}>
                    <Text style={[styles.sectionHeading, { color: COLORS.textMuted }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {[
                            {
                                label: 'Add Service',
                                icon: 'add-circle-outline',
                                color: COLORS.primary,
                                onPress: () => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('CreateService');
                                },
                            },
                            {
                                label: 'Schedule',
                                icon: 'calendar-today',
                                color: '#6366F1',
                                onPress: () => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('MainApp', { screen: 'BookingsTab' });
                                },
                            },
                            {
                                label: 'Notifications',
                                icon: 'notifications-none',
                                color: '#10B981',
                                onPress: () => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('Notifications');
                                },
                            },
                            {
                                label: 'Settings',
                                icon: 'settings',
                                color: '#F59E0B',
                                onPress: () => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('Settings');
                                },
                            },
                        ].map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={action.onPress}
                                activeOpacity={0.8}
                                style={[
                                    styles.quickActionBtn,
                                    {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    },
                                    SHADOWS.sm,
                                ]}
                            >
                                <MaterialIcons name={action.icon as any} size={22} color={action.color} />
                                <Text style={[styles.quickActionTxt, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </AnimatedSection>

                {/* ── Pending Booking Requests ──────────────────────────────────────── */}
                <AnimatedSection delay={300} direction="up" distance={25} style={styles.sectionWrap}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: COLORS.textMuted }]}>Pending Requests</Text>
                        {pendingBookings.length > 0 && (
                            <Text style={[styles.badgeCountTxt, { color: COLORS.primary }]}>
                                {pendingBookings.length} New
                            </Text>
                        )}
                    </View>

                    {bookingsLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                    ) : pendingBookings.length > 0 ? (
                        pendingBookings.map((b, i) => (
                            <View
                                key={b.id || i}
                                style={[
                                    styles.bookingCard,
                                    {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    },
                                    SHADOWS.sm,
                                ]}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        navigation.navigate('BookingDetail', { bookingId: b.id });
                                    }}
                                    activeOpacity={0.7}
                                    style={styles.bookingCardHeader}
                                >
                                    <Image
                                        source={{ uri: getAvatarUrl(b.profiles?.full_name, b.profiles?.avatar_url) }}
                                        style={styles.clientAvatar as any}
                                        contentFit="cover"
                                    />
                                    <View style={styles.clientInfoWrap}>
                                        <Text style={[styles.clientName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            {b.profiles?.full_name || 'Client'}
                                        </Text>
                                        <Text style={[styles.serviceTitle, { color: COLORS.textMuted }]}>
                                            {b.services?.name || 'Beauty Service'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.bookingPrice, { color: COLORS.primary }]}>
                                        ₦{b.services?.price?.toLocaleString() || '0'}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.bookingActionRow}>
                                    <TouchableOpacity
                                        disabled={statusUpdating}
                                        onPress={() => handleAcceptBooking(b.id)}
                                        style={[styles.acceptBtn, { backgroundColor: COLORS.primary }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.acceptBtnTxt}>Accept Request</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={statusUpdating}
                                        onPress={() => handleDeclineBooking(b.id)}
                                        style={[
                                            styles.declineBtn,
                                            { borderColor: isDark ? COLORS.borderDark : COLORS.border },
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.declineBtnTxt, { color: COLORS.textMuted }]}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View
                            style={[
                                styles.emptyStateBox,
                                { borderColor: isDark ? COLORS.borderDark : COLORS.border },
                            ]}
                        >
                            <MaterialIcons name="event-available" size={32} color={COLORS.textMuted} />
                            <Text style={[styles.emptyStateTxt, { color: COLORS.textMuted }]}>
                                No pending booking requests right now
                            </Text>
                        </View>
                    )}
                </AnimatedSection>

                {/* ── Active Services Overview ──────────────────────────────────────── */}
                <AnimatedSection delay={350} direction="up" distance={25} style={styles.sectionWrap}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: COLORS.textMuted }]}>My Services ({myServices.length})</Text>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.selectionAsync();
                                navigation.navigate('CreateService');
                            }}
                        >
                            <Text style={[styles.seeAllTxt, { color: COLORS.primary }]}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {servicesLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                    ) : myServices.length > 0 ? (
                        myServices.slice(0, 3).map((s, i) => (
                            <TouchableOpacity
                                key={s.id || i}
                                onPress={() => navigation.navigate('ServiceDetail', { serviceId: s.id })}
                                activeOpacity={0.8}
                                style={[
                                    styles.serviceRowCard,
                                    {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    },
                                    SHADOWS.sm,
                                ]}
                            >
                                <View style={styles.serviceRowLeft}>
                                    <Text style={[styles.serviceRowName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {s.name}
                                    </Text>
                                    <Text style={[styles.serviceRowDuration, { color: COLORS.textMuted }]}>
                                        {s.duration_mins} mins · {s.category || 'General'}
                                    </Text>
                                </View>
                                <Text style={[styles.serviceRowPrice, { color: COLORS.primary }]}>
                                    ₦{s.price?.toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateService')}
                            style={[styles.emptyServiceBox, { borderColor: COLORS.primary }]}
                        >
                            <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
                            <Text style={[styles.emptyServiceTxt, { color: COLORS.primary }]}>
                                Create your first beauty service to start earning
                            </Text>
                        </TouchableOpacity>
                    )}
                </AnimatedSection>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex1Center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 12,
        paddingBottom: 100,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    profileHeaderWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#E5E7EB',
    },
    headerTextWrap: {
        justifyContent: 'center',
    },
    greetingSub: {
        fontFamily: FONTS.sansMedium,
        fontSize: 12,
    },
    greetingTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 22,
    },
    notifBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        position: 'relative',
    },
    notifBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
    },
    statIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statTitle: {
        fontFamily: FONTS.montserratBold,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statValue: {
        fontFamily: FONTS.montserratBold,
        fontSize: 18,
        marginTop: 2,
    },
    statSubtitle: {
        fontFamily: FONTS.sansMedium,
        fontSize: 10,
        marginTop: 4,
    },
    sectionWrap: {
        marginTop: 24,
    },
    sectionHeading: {
        fontFamily: FONTS.montserratBold,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    badgeCountTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    seeAllTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
    },
    calendarStrip: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 4,
    },
    calendarDayCard: {
        width: 60,
        height: 76,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    dayNameTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 11,
        textTransform: 'uppercase',
    },
    dayNumTxt: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
    },
    calendarDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 2,
    },
    scheduleCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    scheduleTimeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 80,
    },
    scheduleTimeTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    scheduleDetailsWrap: {
        flex: 1,
    },
    scheduleClientName: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    scheduleServiceName: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginTop: 1,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    statusTagTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    quickActionBtn: {
        width: '48%',
        padding: 14,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    quickActionTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
    },
    bookingCard: {
        padding: 16,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        marginBottom: 10,
    },
    bookingCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    clientAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E5E7EB',
    },
    clientInfoWrap: {
        flex: 1,
        marginLeft: 12,
    },
    clientName: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    serviceTitle: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginTop: 1,
    },
    bookingPrice: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    bookingActionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtnTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        color: '#FFFFFF',
    },
    declineBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineBtnTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    emptyStateBox: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: RADIUS.xl,
    },
    emptyStateTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 13,
        marginTop: 8,
    },
    serviceRowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        marginBottom: 8,
    },
    serviceRowLeft: {
        flex: 1,
    },
    serviceRowName: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    serviceRowDuration: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginTop: 2,
    },
    serviceRowPrice: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    emptyServiceBox: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: RADIUS.xl,
        gap: 8,
    },
    emptyServiceTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        textAlign: 'center',
    },
});

export default AgentDashboardScreen;
