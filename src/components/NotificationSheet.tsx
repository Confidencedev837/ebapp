// src/components/NotificationSheet.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotificationStore, AppNotification, NotificationType } from '@/store/useNotificationStore';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.78;

// ── Notification type → icon mapping ─────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
    booking: { icon: 'calendar-today', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' },
    message: { icon: 'chat-bubble-outline', color: '#00B4D8', bg: 'rgba(0,180,216,0.12)' },
    promo: { icon: 'local-offer', color: COLORS.primary, bg: 'rgba(255,98,137,0.12)' },
    system: { icon: 'info-outline', color: '#FFCC00', bg: 'rgba(255,204,0,0.12)' },
    review: { icon: 'star-outline', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
};

// ── Time-ago formatter ────────────────────────────────────────────────────────
const timeAgo = (ms: number): string => {
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

// ── Single notification row ───────────────────────────────────────────────────
const NotificationRow = ({
    item,
    isDark,
    onPress,
    onDismiss,
}: {
    item: AppNotification;
    isDark: boolean;
    onPress: (n: AppNotification) => void;
    onDismiss: (id: string) => void;
}) => {
    const cfg = TYPE_CONFIG[item.type];
    const rowAnim = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    const handleDismiss = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(translateX, { toValue: 400, duration: 240, useNativeDriver: true }),
            Animated.timing(rowAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]).start(() => onDismiss(item.id));
    };

    return (
        <Animated.View
            style={{
                opacity: rowAnim,
                transform: [{ translateX }],
                height: rowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 76] }),
                overflow: 'hidden',
            }}
        >
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onPress(item)}
                style={[
                    styles.row,
                    {
                        backgroundColor: isDark
                            ? item.read ? COLORS.surfaceDark : '#1E1E1E'
                            : item.read ? COLORS.white : COLORS.background,
                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    },
                ]}
            >
                {/* Unread dot */}
                {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />
                )}

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialIcons name={cfg.icon as any} size={20} color={cfg.color} />
                </View>

                {/* Text */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                        style={[styles.rowTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text
                        style={[styles.rowBody, { color: COLORS.textMuted }]}
                        numberOfLines={2}
                    >
                        {item.body}
                    </Text>
                    <Text style={[styles.rowTime, { color: COLORS.textMuted }]}>
                        {timeAgo(item.timestamp)}
                    </Text>
                </View>

                {/* Dismiss */}
                <TouchableOpacity
                    onPress={handleDismiss}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ marginLeft: 8 }}
                >
                    <Ionicons name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Main NotificationSheet ────────────────────────────────────────────────────
interface NotificationSheetProps {
    visible: boolean;
    onClose: () => void;
}

const NotificationSheet: React.FC<NotificationSheetProps> = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markRead, markAllRead, removeNotification } = useNotificationStore();

    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    // ── Open / close animations ─────────────────────────────────────────────
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 10,
                    tension: 65,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 260,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SHEET_HEIGHT,
                    duration: 280,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleNotificationPress = useCallback((n: AppNotification) => {
        Haptics.selectionAsync();
        markRead(n.id);
        // Future: navigate to actionRoute
    }, [markRead]);

    const handleMarkAll = useCallback(() => {
        Haptics.selectionAsync();
        markAllRead();
    }, [markAllRead]);

    const unread = notifications.filter(n => !n.read).length;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.backdrop,
                        { opacity: backdropAnim },
                    ]}
                />
            </TouchableWithoutFeedback>

            {/* Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    {
                        backgroundColor: isDark ? '#111111' : COLORS.white,
                        transform: [{ translateY: slideAnim }],
                    },
                    SHADOWS.md,
                ]}
            >
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                {/* Header */}
                <View style={styles.sheetHeader}>
                    <View>
                        <Text style={[styles.sheetTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            Notifications
                        </Text>
                        {unread > 0 && (
                            <Text style={[styles.sheetSub, { color: COLORS.primary }]}>
                                {unread} unread
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        {unread > 0 && (
                            <TouchableOpacity onPress={handleMarkAll}>
                                <Text style={[styles.markAllBtn, { color: COLORS.primary }]}>
                                    Mark all read
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface }]}>
                            <Ionicons name="close" size={18} color={isDark ? COLORS.white : COLORS.textDark} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                {/* List */}
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush }]}>
                            <Ionicons name="notifications-off-outline" size={32} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            All caught up!
                        </Text>
                        <Text style={[styles.emptySub, { color: COLORS.textMuted }]}>
                            No new notifications right now.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: SPACING.screen, paddingTop: 6, paddingBottom: insets.bottom + 60 }}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                        renderItem={({ item }) => (
                            <NotificationRow
                                item={item}
                                isDark={isDark}
                                onPress={handleNotificationPress}
                                onDismiss={removeNotification}
                            />
                        )}
                    />
                )}
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SHEET_HEIGHT,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingTop: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.screen,
        marginBottom: 12,
    },
    sheetTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 22,
        letterSpacing: -0.3,
    },
    sheetSub: {
        fontFamily: FONTS.sansMedium,
        fontSize: 12,
        marginTop: 2,
    },
    markAllBtn: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: RADIUS.md,
        borderWidth: StyleSheet.hairlineWidth,
        minHeight: 70,
    },
    unreadDot: {
        position: 'absolute',
        top: 10,
        left: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        marginBottom: 2,
    },
    rowBody: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        lineHeight: 16,
    },
    rowTime: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 60,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 20,
        marginBottom: 6,
    },
    emptySub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default NotificationSheet;
