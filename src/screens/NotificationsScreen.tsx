// src/screens/NotificationsScreen.tsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useNotificationStore, AppNotification, NotificationType } from '@/store/useNotificationStore';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import AnimatedSection from '@/components/AnimatedSection';

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string; label: string }> = {
    booking: { icon: 'calendar-today', color: '#6C63FF', bg: 'rgba(108,99,255,0.14)', label: 'Bookings' },
    message: { icon: 'chat-bubble-outline', color: '#00B4D8', bg: 'rgba(0,180,216,0.14)', label: 'Messages' },
    promo: { icon: 'local-offer', color: COLORS.primary, bg: 'rgba(255,98,137,0.14)', label: 'Offers' },
    system: { icon: 'info-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', label: 'System' },
    review: { icon: 'star-outline', color: '#10B981', bg: 'rgba(16,185,129,0.14)', label: 'Reviews' },
};

const timeAgo = (ms: number): string => {
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
};

const NotificationItemRow = ({
    item,
    isDark,
    index,
    onPress,
    onDismiss,
}: {
    item: AppNotification;
    isDark: boolean;
    index: number;
    onPress: (n: AppNotification) => void;
    onDismiss: (id: string) => void;
}) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const rowAnim = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    const handleDismiss = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(translateX, { toValue: 400, duration: 250, useNativeDriver: true }),
            Animated.timing(rowAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismiss(item.id));
    };

    return (
        <AnimatedSection delay={150 + index * 40} direction="up" distance={25}>
            <Animated.View
                style={{
                    opacity: rowAnim,
                    transform: [{ translateX }],
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onPress(item)}
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark
                                ? item.read ? COLORS.surfaceDark : '#1E1B24'
                                : item.read ? COLORS.white : '#FFF5F7',
                            borderColor: isDark
                                ? item.read ? COLORS.borderDark : 'rgba(255,98,137,0.3)'
                                : item.read ? COLORS.border : 'rgba(255,98,137,0.25)',
                        },
                        SHADOWS.sm,
                    ]}
                >
                    {/* Unread Indicator Bar */}
                    {!item.read && (
                        <View style={styles.unreadBar} />
                    )}

                    {/* Icon Container */}
                    <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                        <MaterialIcons name={cfg.icon as any} size={20} color={cfg.color} />
                    </View>

                    {/* Text Container */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.rowHeader}>
                            <Text
                                style={[
                                    styles.rowTitle,
                                    { color: isDark ? COLORS.white : COLORS.textDark },
                                    !item.read && { fontFamily: FONTS.sansBold },
                                ]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            <Text style={[styles.rowTime, { color: COLORS.textMuted }]}>
                                {timeAgo(item.timestamp)}
                            </Text>
                        </View>

                        <Text
                            style={[
                                styles.rowBody,
                                { color: isDark ? COLORS.textMutedDark : COLORS.textMuted },
                            ]}
                            numberOfLines={2}
                        >
                            {item.body}
                        </Text>
                    </View>

                    {/* Dismiss Button */}
                    <TouchableOpacity
                        onPress={handleDismiss}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.dismissBtn}
                    >
                        <Ionicons name="close" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        </AnimatedSection>
    );
};

export const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markRead, markAllRead, removeNotification, clearAll } = useNotificationStore();

    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
    };

    const handlePressNotification = useCallback((n: AppNotification) => {
        Haptics.selectionAsync();
        markRead(n.id);
    }, [markRead]);

    const handleMarkAllRead = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        markAllRead();
    }, [markAllRead]);

    const handleClearAll = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        clearAll();
    }, [clearAll]);

    const filteredNotifications = useMemo(() => {
        if (selectedFilter === 'all') return notifications;
        if (selectedFilter === 'unread') return notifications.filter(n => !n.read);
        return notifications.filter(n => n.type === selectedFilter);
    }, [notifications, selectedFilter]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: `Unread (${unreadCount})` },
        { key: 'booking', label: 'Bookings' },
        { key: 'message', label: 'Messages' },
        { key: 'promo', label: 'Offers' },
        { key: 'system', label: 'System' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* ── Top Header ──────────────────────────────────────────────────────── */}
            <AnimatedSection delay={0} direction="down" distance={20} style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={[
                        styles.backBtn,
                        {
                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                        },
                    ]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={20} color={isDark ? COLORS.white : COLORS.textDark} />
                </TouchableOpacity>

                <View style={styles.titleWrap}>
                    <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                        Notifications
                    </Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount} new</Text>
                        </View>
                    )}
                </View>

                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
                        <Text style={styles.actionTxt}>Mark read</Text>
                    </TouchableOpacity>
                ) : notifications.length > 0 ? (
                    <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                        <Text style={[styles.actionTxt, { color: COLORS.textMuted }]}>Clear all</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </AnimatedSection>

            {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
            <AnimatedSection delay={100} direction="down" distance={15}>
                <FlatList
                    horizontal
                    data={filters}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => {
                        const isActive = selectedFilter === item.key;
                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedFilter(item.key);
                                }}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: isActive
                                            ? COLORS.primary
                                            : isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isActive
                                            ? COLORS.primary
                                            : isDark ? COLORS.borderDark : COLORS.border,
                                    },
                                ]}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.filterChipTxt,
                                        {
                                            color: isActive
                                                ? COLORS.white
                                                : isDark ? COLORS.textMutedDark : COLORS.textMuted,
                                            fontFamily: isActive ? FONTS.sansBold : FONTS.sansMedium,
                                        },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </AnimatedSection>

            {/* ── Notification List ──────────────────────────────────────────────── */}
            {filteredNotifications.length === 0 ? (
                <AnimatedSection delay={200} direction="up" distance={30} style={styles.emptyContainer}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush }]}>
                        <Ionicons name="notifications-off-outline" size={36} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                        No notifications found
                    </Text>
                    <Text style={[styles.emptySub, { color: COLORS.textMuted }]}>
                        {selectedFilter === 'all'
                            ? "You're all caught up! Updates about your bookings, messages, and offers will appear here."
                            : `There are no ${selectedFilter} notifications to show.`}
                    </Text>
                </AnimatedSection>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    renderItem={({ item, index }) => (
                        <NotificationItemRow
                            item={item}
                            isDark={isDark}
                            index={index}
                            onPress={handlePressNotification}
                            onDismiss={removeNotification}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.screen,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 22,
    },
    badge: {
        backgroundColor: 'rgba(255,98,137,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    badgeText: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.primary,
    },
    actionTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        color: COLORS.primary,
    },
    filterList: {
        paddingHorizontal: SPACING.screen,
        paddingVertical: 10,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
        borderWidth: 1,
    },
    filterChipTxt: {
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 8,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    unreadBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.primary,
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    rowTitle: {
        fontFamily: FONTS.sansMedium,
        fontSize: 14,
        flex: 1,
        marginRight: 6,
    },
    rowTime: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
    },
    rowBody: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        lineHeight: 18,
    },
    dismissBtn: {
        padding: 4,
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
});

export default NotificationsScreen;
