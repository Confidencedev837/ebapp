// src/screens/HomeScreen.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, SIZES, TYPOGRAPHY } from '@/constants/theme';
import AgentStoryBubble from '@/components/AgentStoryBubble';
import AvailableTodayCard from '@/components/AvailableTodayCard';
import UpcomingBookingBanner from '@/components/UpcomingBookingBanner';
import CategoryChips from '@/components/CategoryChips';
import VerifiedBadge from '@/components/VerifiedBadge';
import BrandedSpinner from '@/components/BrandedSpinner';
import ServicePostCard from '@/components/ServicePostCard';
import Snackbar from '@/components/Snackbar';
import NotificationSheet from '@/components/NotificationSheet';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemeMode } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useServices } from '@/hooks/useServices';
import { useUpcomingBookings } from '@/hooks/useBookings';
import AnimatedSection from '@/components/AnimatedSection';

const { width } = Dimensions.get('window');

const PAGE_SIZE = 10; // items per page

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { themeMode, toggleTheme } = useThemeStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user, profile } = useUserStore();
    const { unreadCount } = useNotificationStore();


    // ── Notification sheet ────────────────────────────────────────────────
    const [notifSheetVisible, setNotifSheetVisible] = useState(false);

    const [activeCategory, setActiveCategory] = useState('All');

    // ── Fetch real data ───────────────────────────────────────────────────
    const { 
        services, 
        loading: servicesLoading, 
        loadingMore,
        hasMore,
        error: servicesError, 
        refetch: refetchServices,
        loadMore 
    } = useServices({
        category: activeCategory === 'All' ? undefined : activeCategory
    });
    
    const { bookings: upcomingBookingsData, error: bookingsError, refetch: refetchUpcoming } = useUpcomingBookings(user?.id ?? profile?.id ?? null, 30);

    useFocusEffect(
        useCallback(() => {
            refetchUpcoming();
        }, [refetchUpcoming])
    );

    // ── Snackbar state ────────────────────────────────────────────────────
    const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        if (servicesError) setSnackbar({ visible: true, message: servicesError, type: 'error' });
    }, [servicesError]);

    useEffect(() => {
        if (bookingsError) setSnackbar({ visible: true, message: bookingsError, type: 'error' });
    }, [bookingsError]);

    const [refreshing, setRefreshing] = useState(false);

    // ── Animated values ───────────────────────────────────────────────────
    const searchScale = useRef(new Animated.Value(1)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerHeight = useRef(new Animated.Value(1)).current;
    const headerHeightValue = useRef(180);;
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    const lastScrollY = useRef(0);
    const isHeaderVisible = useRef(true);

    // ── Header scroll-hide logic ──────────────────────────────────────────
    useEffect(() => {
        const id = scrollY.addListener(({ value }) => {
            const delta = value - lastScrollY.current;
            lastScrollY.current = value;

            if (delta > 5 && value > headerHeightValue.current && isHeaderVisible.current) {
                isHeaderVisible.current = false;
                Animated.timing(headerHeight, { toValue: 0, duration: 250, useNativeDriver: false }).start();
                Animated.spring(headerTranslateY, { toValue: -headerHeightValue.current, useNativeDriver: true, friction: 9, tension: 70 }).start();
            } else if (delta < -3 && !isHeaderVisible.current) {
                isHeaderVisible.current = true;
                Animated.timing(headerHeight, { toValue: 1, duration: 250, useNativeDriver: false }).start();
                Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true, friction: 4, tension: 20 }).start();
            }
        });
        return () => scrollY.removeListener(id);
    }, []);



    const handleCategorySelect = useCallback((category: string) => {
        Haptics.selectionAsync();
        setActiveCategory(category);
    }, []);

    const upcomingBooking = useMemo(() =>
        upcomingBookingsData?.[0] || null,
        [upcomingBookingsData]
    );

    // ── Animated search bar press ─────────────────────────────────────────
    const handleSearchPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.timing(searchScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
            Animated.timing(searchScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start(() => navigation.navigate('Services', { focusSearch: true }));
    }, [navigation]);

    const onRefresh = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        Promise.all([refetchServices()])
            .then(() => setSnackbar({ visible: true, message: 'Refreshed', type: 'success' }))
            .catch(() => setSnackbar({ visible: true, message: 'Refresh failed', type: 'error' }))
            .finally(() => setRefreshing(false));
    }, [refetchServices]);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'User';

    const currentUnread = unreadCount();

    // ─── HEADER ───────────────────────────────────────────────────────────
    const renderHeader = () => (
        <Animated.View
            style={{
                height: headerHeight.interpolate({ inputRange: [0, 1], outputRange: [0, headerHeightValue.current] }),
                overflow: 'hidden',
            }}
        >
            <Animated.View
                style={[
                    styles.headerInner,
                    {
                        transform: [{ translateY: headerTranslateY }],
                        backgroundColor: isDark ? COLORS.bgDark : COLORS.white,
                        borderBottomColor: isDark ? COLORS.borderDark : COLORS.border,
                        borderBottomWidth: 1,
                    },
                ]}
                onLayout={(e) => { headerHeightValue.current = e.nativeEvent.layout.height; }}
            >
                {/* Greeting row */}
                <AnimatedSection delay={0} direction="down" distance={20} style={styles.topRow}>
                    <View>
                        <Text style={[styles.greeting, { color: COLORS.textMuted }]}>{greeting}</Text>
                        <Text style={[styles.name, { color: isDark ? COLORS.white : COLORS.textDark }]}>{firstName}</Text>
                    </View>
                    <View style={styles.iconRow}>
                        {/* Theme toggle */}
                        <TouchableOpacity
                            onPress={() => { Haptics.selectionAsync(); toggleTheme(); }}
                            style={[styles.iconBtn, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                        >
                            <Ionicons
                                name={themeMode === ThemeMode.LIGHT ? 'sunny' : themeMode === ThemeMode.DARK ? 'moon' : 'contrast'}
                                size={18}
                                color={isDark ? COLORS.white : COLORS.textDark}
                            />
                        </TouchableOpacity>

                        {/* Notification bell */}
                        <TouchableOpacity
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Notifications'); }}
                            style={[styles.iconBtn, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                        >
                            <Ionicons name="notifications-outline" size={18} color={isDark ? COLORS.white : COLORS.textDark} />
                            {currentUnread > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>
                                        {currentUnread > 9 ? '9+' : currentUnread}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Avatar */}
                        <TouchableOpacity
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Me'); }}
                        >
                            <Image
                                source={{ uri: getAvatarUrl(profile?.full_name, profile?.avatar_url) }}
                                style={styles.headerAvatar}
                            />
                            <View style={styles.avatarRing} />
                        </TouchableOpacity>
                    </View>
                </AnimatedSection>

                {/* Animated Search Bar */}
                <AnimatedSection delay={100} direction="down" distance={20}>
                    <Animated.View style={{ transform: [{ scale: searchScale }] }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleSearchPress}
                        style={[styles.searchBar, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                    >
                        <View style={[styles.searchIconWrap, { backgroundColor: isDark ? COLORS.primary + '25' : COLORS.blush }]}>
                            <MaterialIcons name="search" size={19} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.searchPlaceholder, { color: COLORS.textMuted }]}>
                            Makeup, hair, nails, massage ...
                        </Text>
                        <View style={styles.searchFilterBtn}>
                            <MaterialIcons name="tune" size={15} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
                </AnimatedSection>

                {/* Location row */}
                <AnimatedSection delay={200} direction="left" distance={20} style={styles.locationRow}>
                    <MaterialIcons name="place" size={14} color={COLORS.primary} />
                    <Text style={[styles.locationText, { color: COLORS.textMuted }]}>
                        {profile?.location ? `${profile.location}, Nigeria` : 'Lagos, Nigeria'}
                    </Text>
                </AnimatedSection>
            </Animated.View>
        </Animated.View>
    );

    // ─── LIST HEADER ──────────────────────────────────────────────────────
    const listHeader = useMemo(() => (
        <View style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.white }}>
            <AnimatedSection delay={300} direction="up" distance={20}>
                <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />
            </AnimatedSection>
            
            {upcomingBooking && (
                <AnimatedSection delay={400} direction="left" distance={30} style={{ marginBottom: 16, marginTop: 8 }}>
                    <UpcomingBookingBanner
                        booking={upcomingBooking}
                        onPress={() => navigation.navigate('BookingDetail', { bookingId: upcomingBooking.id })}
                    />
                </AnimatedSection>
            )}

            {/* Available Today */}
            <AnimatedSection delay={600} direction="up" distance={30} style={{ marginTop: 24, marginBottom: 24 }}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={[TYPOGRAPHY.label, { color: COLORS.textMuted }]}>Available Today</Text>
                        <Text style={styles.sectionSub}>Book an expert for today</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); navigation.navigate('Services'); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={services.slice(0, 5)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 14 }}
                    renderItem={({ item }) => <AvailableTodayCard service={item} />}
                />
            </AnimatedSection>

            {/* Service Feed Label */}
            <AnimatedSection delay={700} direction="up" distance={20} style={[styles.feedHeader, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[TYPOGRAPHY.label, { color: isDark ? COLORS.white : COLORS.textDark }]}>Services</Text>
                    {services.length > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush }]}>
                            <Text style={[styles.countText, { color: COLORS.primary }]}>{services.length}{hasMore ? '+' : ''}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="sort" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
            </AnimatedSection>
        </View>
    ), [activeCategory, upcomingBooking, handleCategorySelect, services.length, isDark, navigation]);

    const renderServiceItem = useCallback(({ item, index }: { item: any, index: number }) => (
        <AnimatedSection delay={800 + index * 50} direction="up" distance={30}>
            <ServicePostCard service={item} />
        </AnimatedSection>
    ), []);

    // ─── PAGINATION FOOTER ────────────────────────────────────────────────
    const renderFooter = () => {
        if (!hasMore && services.length > 0) {
            return (
                <View style={styles.footerEnd}>
                    <View style={[styles.footerLine, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
                    <Text style={[styles.footerText, { color: COLORS.textMuted }]}>You've seen it all</Text>
                    <View style={[styles.footerLine, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
                </View>
            );
        }
        if (loadingMore) {
            return (
                <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={[styles.footerLoadingText, { color: COLORS.textMuted }]}>Loading more...</Text>
                </View>
            );
        }
        if (hasMore) {
            return (
                <TouchableOpacity
                    style={[styles.loadMoreBtn, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush, borderColor: isDark ? COLORS.borderDark : 'rgba(255,98,137,0.2)' }]}
                    onPress={() => { Haptics.selectionAsync(); loadMore(); }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.loadMoreText, { color: COLORS.primary }]}>Load more</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            );
        }
        return null;
    };

    // ─── SCROLL HANDLER ───────────────────────────────────────────────────
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top', 'left', 'right']}>
            <View style={{ flex: 1 }}>
                {renderHeader()}

                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={listHeader}
                    renderItem={renderServiceItem}
                    ListFooterComponent={renderFooter}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    bounces={true}
                    alwaysBounceVertical={true}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    onEndReached={() => { if (hasMore && !loadingMore) loadMore(); }}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ItemSeparatorComponent={() => (
                        <View style={{ height: 10, backgroundColor: isDark ? COLORS.bgDark : COLORS.surface }}>
                            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? COLORS.borderDark : COLORS.border }} />
                        </View>
                    )}
                    ListEmptyComponent={
                        servicesLoading ? (
                            <View style={styles.emptyState}>
                                <BrandedSpinner size="large" showLabel labelText="Loading services..." />
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIcon, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface }]}>
                                    <MaterialIcons name="auto-awesome" size={32} color={COLORS.primary} />
                                </View>
                                <Text style={[TYPOGRAPHY.title, { color: isDark ? COLORS.white : COLORS.textDark, textAlign: 'center', marginBottom: 8 }]}>
                                    No services yet
                                </Text>
                                <Text style={[TYPOGRAPHY.body, { color: COLORS.textMuted, textAlign: 'center' }]}>
                                    Beauty experts will appear here{'\n'}once they join the platform.
                                </Text>
                            </View>
                        )
                    }
                />

                {/* Snackbar */}
                <Snackbar
                    visible={snackbar.visible}
                    message={snackbar.message}
                    type={snackbar.type as any}
                    onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerInner: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 8,
        paddingBottom: 14,
        marginTop: -6,
    },
    topRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
    },
    greeting: { fontFamily: FONTS.sansMedium, fontSize: 13, marginBottom: 2 },
    name: { fontFamily: FONTS.playfairBold, fontSize: 26, letterSpacing: -0.3 },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    notifBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5, borderColor: COLORS.white,
    },
    notifBadgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontFamily: FONTS.montserratBold,
    },
    headerAvatar: { width: 38, height: 38, borderRadius: 19 },
    avatarRing: {
        position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
        borderRadius: 21, borderWidth: 2, borderColor: COLORS.primary,
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 14,
        borderRadius: RADIUS.xl, borderWidth: 1, gap: 10,
    },
    searchIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    searchPlaceholder: { fontFamily: FONTS.sansRegular, fontSize: SIZES.sm, flex: 1 },
    searchFilterBtn: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
    locationText: { fontFamily: FONTS.sansMedium, fontSize: 12 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'flex-start',
        justifyContent: 'space-between', paddingHorizontal: SPACING.screen, marginBottom: 12,
    },
    sectionSub: { fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    seeAll: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.primary, marginTop: 2 },
    feedHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.screen, paddingBottom: SPACING.base,
        borderBottomWidth: 1, marginBottom: 4,
    },
    countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
    countText: { fontFamily: FONTS.sansBold, fontSize: 11 },
    emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.screen },
    emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    // Pagination footer
    footerEnd: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.screen, paddingVertical: 24, gap: 12,
    },
    footerLine: { flex: 1, height: 1 },
    footerText: { fontFamily: FONTS.sansRegular, fontSize: 12 },
    footerLoading: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 20,
    },
    footerLoadingText: { fontFamily: FONTS.sansRegular, fontSize: 13 },
    loadMoreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginHorizontal: SPACING.screen, marginVertical: 16,
        paddingVertical: 12, borderRadius: RADIUS.full, borderWidth: 1,
    },
    loadMoreText: { fontFamily: FONTS.sansBold, fontSize: 13 },
});

export default HomeScreen;