// src/components/profile/ProfileTabs.tsx
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { getAvatarUrl } from '@/services/avatarUtils';
import { Service } from '@/types';
import { FollowUserItem, BookedServiceItem } from '@/services/api/profileTabsApi';
import { followAgent, unfollowAgent } from '@/services/api/followsApi';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMN_COUNT = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 32 - 16) / GRID_COLUMN_COUNT;

// ── Generic Empty State Component ─────────────────────────────────────────────
export const TabEmptyState: React.FC<{
    icon: string;
    title: string;
    description: string;
    isDark: boolean;
    actionLabel?: string;
    onAction?: () => void;
}> = ({ icon, title, description, isDark, actionLabel, onAction }) => (
    <View style={styles.emptyWrap}>
        <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}12` }]}>
            <MaterialIcons name={icon as any} size={32} color={COLORS.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
            {title}
        </Text>
        <Text style={[styles.emptySub, { color: COLORS.textMuted }]}>
            {description}
        </Text>
        {actionLabel && onAction && (
            <TouchableOpacity
                onPress={onAction}
                style={[styles.emptyActionBtn, SHADOWS.pink]}
                activeOpacity={0.85}
            >
                <Text style={styles.emptyActionTxt}>{actionLabel}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ── Agent Posts / Services Grid Tab ──────────────────────────────────────────
export const AgentPostsGridTab: React.FC<{
    services: Service[];
    loading: boolean;
    isDark: boolean;
}> = ({ services, loading, isDark }) => {
    const navigation = useNavigation<any>();

    if (loading) {
        return (
            <View style={styles.tabLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (services.length === 0) {
        return (
            <TabEmptyState
                icon="grid-off"
                title="No published posts yet"
                description="Published service posts will appear here for clients to discover and book."
                isDark={isDark}
                actionLabel="Create Service Post"
                onAction={() => navigation.navigate('CreateService')}
            />
        );
    }

    return (
        <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMN_COUNT}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
                const coverImage = item.image_url?.[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500';
                const hasMultipleMedia = item.image_url && item.image_url.length > 1;

                return (
                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: isDark ? COLORS.surfaceDark : '#F3F4F6' }]}
                        activeOpacity={0.88}
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.navigate('ServiceDetail', { serviceId: item.id });
                        }}
                    >
                        <Image
                            source={{ uri: coverImage }}
                            style={styles.gridImage}
                            contentFit="cover"
                            transition={200}
                        />

                        {/* Media count badge */}
                        {hasMultipleMedia && (
                            <View style={styles.mediaBadge}>
                                <MaterialIcons name="collections" size={12} color="#FFF" />
                                <Text style={styles.mediaBadgeTxt}>{item.image_url.length}</Text>
                            </View>
                        )}

                        {/* Price tag */}
                        <View style={styles.gridPriceBadge}>
                            <Text style={styles.gridPriceTxt}>₦{item.price?.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                );
            }}
        />
    );
};

// ── Customer Booked Services Tab ──────────────────────────────────────────────
export const BookedServicesTab: React.FC<{
    bookings: BookedServiceItem[];
    loading: boolean;
    isDark: boolean;
}> = ({ bookings, loading, isDark }) => {
    const navigation = useNavigation<any>();

    if (loading) {
        return (
            <View style={styles.tabLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (bookings.length === 0) {
        return (
            <TabEmptyState
                icon="event-note"
                title="No booked services yet"
                description="Explore top beauty services and schedule your first appointment."
                isDark={isDark}
                actionLabel="Explore Services"
                onAction={() => navigation.navigate('Services')}
            />
        );
    }

    const getStatusStyle = (status: string | null) => {
        switch (status) {
            case 'confirmed':
                return { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', label: 'Confirmed' };
            case 'completed':
                return { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', label: 'Completed' };
            case 'cancelled':
                return { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Cancelled' };
            default:
                return { bg: 'rgba(234,179,8,0.12)', text: '#EAB308', label: 'Pending' };
        }
    };

    return (
        <View style={styles.listContainer}>
            {bookings.map((b) => {
                const service = b.service;
                const agent = b.agent;
                const statusStyle = getStatusStyle(b.status);

                return (
                    <TouchableOpacity
                        key={b.id}
                        style={[
                            styles.bookedCard,
                            {
                                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                            },
                            SHADOWS.sm,
                        ]}
                        activeOpacity={0.9}
                        onPress={() => {
                            if (service?.id) {
                                Haptics.selectionAsync();
                                navigation.navigate('ServiceDetail', { serviceId: service.id });
                            }
                        }}
                    >
                        <Image
                            source={{ uri: service?.image_url?.[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500' }}
                            style={styles.bookedThumb}
                            contentFit="cover"
                        />

                        <View style={styles.bookedMeta}>
                            <View style={styles.bookedHeaderRow}>
                                <Text
                                    style={[styles.bookedTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}
                                    numberOfLines={1}
                                >
                                    {service?.name || 'Beauty Appointment'}
                                </Text>
                                <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
                                    <Text style={[styles.statusChipTxt, { color: statusStyle.text }]}>
                                        {statusStyle.label}
                                    </Text>
                                </View>
                            </View>

                            {agent && (
                                <View style={styles.agentSubRow}>
                                    <Image
                                        source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }}
                                        style={styles.agentMiniAvatar}
                                    />
                                    <Text style={[styles.agentSubTxt, { color: COLORS.textMuted }]} numberOfLines={1}>
                                        {agent.full_name || 'Beauty Pro'}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.bookedFooterRow}>
                                <View style={styles.dateMetaRow}>
                                    <MaterialIcons name="schedule" size={13} color={COLORS.textMuted} />
                                    <Text style={[styles.dateMetaTxt, { color: COLORS.textMuted }]}>
                                        {b.date} · {b.time}
                                    </Text>
                                </View>
                                {b.total_amount && (
                                    <Text style={styles.bookedPriceTxt}>
                                        ₦{b.total_amount.toLocaleString()}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ── Follow List Tab (Followers / Following) ──────────────────────────────────
export const FollowListTab: React.FC<{
    users: FollowUserItem[];
    loading: boolean;
    isDark: boolean;
    emptyTitle: string;
    emptySub: string;
    currentUserId: string;
    onToggleFollowSuccess?: (targetId: string, nextState: boolean) => void;
}> = ({ users, loading, isDark, emptyTitle, emptySub, currentUserId, onToggleFollowSuccess }) => {
    const navigation = useNavigation<any>();
    const [followStateMap, setFollowStateMap] = useState<Record<string, boolean>>({});

    const isUserFollowing = (userItem: FollowUserItem) => {
        return followStateMap[userItem.id] !== undefined ? followStateMap[userItem.id] : userItem.isFollowing;
    };

    const handleFollowToggle = async (userItem: FollowUserItem) => {
        const currentlyFollowing = isUserFollowing(userItem);
        const nextState = !currentlyFollowing;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setFollowStateMap((prev) => ({ ...prev, [userItem.id]: nextState }));

        try {
            if (currentlyFollowing) {
                await unfollowAgent(userItem.id);
            } else {
                await followAgent(userItem.id);
            }
            if (onToggleFollowSuccess) {
                onToggleFollowSuccess(userItem.id, nextState);
            }
        } catch (err) {
            // Revert state on error
            setFollowStateMap((prev) => ({ ...prev, [userItem.id]: currentlyFollowing }));
        }
    };

    if (loading) {
        return (
            <View style={styles.tabLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (users.length === 0) {
        return (
            <TabEmptyState
                icon="people-outline"
                title={emptyTitle}
                description={emptySub}
                isDark={isDark}
            />
        );
    }

    return (
        <View style={styles.listContainer}>
            {users.map((u) => {
                const isAgent = u.user_type === 'agent';
                const followingThisUser = isUserFollowing(u);
                const isSelf = u.id === currentUserId;

                return (
                    <TouchableOpacity
                        key={u.id}
                        style={[
                            styles.userRow,
                            { borderColor: isDark ? COLORS.borderDark : COLORS.border },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                            Haptics.selectionAsync();
                            if (isAgent) {
                                navigation.navigate('AgentProfile', { agentId: u.id });
                            }
                        }}
                    >
                        <Image
                            source={{ uri: getAvatarUrl(u.full_name, u.avatar_url) }}
                            style={styles.userAvatar}
                        />

                        <View style={styles.userMeta}>
                            <Text style={[styles.userName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                {u.full_name || 'Beauty User'}
                            </Text>

                            {/* Badge Label: Beauty Agent vs Customer */}
                            <View style={styles.roleBadgeRow}>
                                <View
                                    style={[
                                        styles.roleBadge,
                                        {
                                            backgroundColor: isAgent
                                                ? 'rgba(255,98,137,0.12)'
                                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                                        },
                                    ]}
                                >
                                    <MaterialIcons
                                        name={isAgent ? 'verified' : 'person'}
                                        size={11}
                                        color={isAgent ? COLORS.primary : COLORS.textMuted}
                                    />
                                    <Text
                                        style={[
                                            styles.roleBadgeTxt,
                                            { color: isAgent ? COLORS.primary : COLORS.textMuted },
                                        ]}
                                    >
                                        {isAgent ? (u.specialization || 'Beauty Agent') : 'Customer'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action: Follow / Unfollow */}
                        {!isSelf && (
                            <TouchableOpacity
                                style={[
                                    styles.followBtn,
                                    followingThisUser
                                        ? [styles.followingBtn, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]
                                        : [styles.notFollowingBtn, SHADOWS.pink],
                                ]}
                                onPress={() => handleFollowToggle(u)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.followBtnTxt,
                                        { color: followingThisUser ? (isDark ? COLORS.white : COLORS.textDark) : COLORS.white },
                                    ]}
                                >
                                    {followingThisUser ? 'Following' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ── Liked Posts Tab ───────────────────────────────────────────────────────────
export const LikedPostsTab: React.FC<{
    likedServices: Service[];
    loading: boolean;
    isDark: boolean;
}> = ({ likedServices, loading, isDark }) => {
    const navigation = useNavigation<any>();

    if (loading) {
        return (
            <View style={styles.tabLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (likedServices.length === 0) {
        return (
            <TabEmptyState
                icon="favorite-border"
                title="No saved favorites yet"
                description="Tap the heart icon on services you love to save them for later."
                isDark={isDark}
                actionLabel="Discover Services"
                onAction={() => navigation.navigate('Services')}
            />
        );
    }

    return (
        <FlatList
            data={likedServices}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMN_COUNT}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
                const coverImage = item.image_url?.[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500';

                return (
                    <TouchableOpacity
                        style={[styles.gridItem, { backgroundColor: isDark ? COLORS.surfaceDark : '#F3F4F6' }]}
                        activeOpacity={0.88}
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.navigate('ServiceDetail', { serviceId: item.id });
                        }}
                    >
                        <Image
                            source={{ uri: coverImage }}
                            style={styles.gridImage}
                            contentFit="cover"
                        />
                        <View style={styles.likedHeartTag}>
                            <Ionicons name="heart" size={14} color={COLORS.primary} />
                        </View>
                        <View style={styles.gridPriceBadge}>
                            <Text style={styles.gridPriceTxt}>₦{item.price?.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                );
            }}
        />
    );
};

const styles = StyleSheet.create({
    tabLoadingWrap: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    // Empty state
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 280,
    },
    emptyActionBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
    },
    emptyActionTxt: {
        fontFamily: FONTS.montserratBold,
        fontSize: 13,
        color: '#FFF',
    },
    // Grid
    gridContainer: {
        paddingTop: 12,
        paddingBottom: 40,
    },
    gridRow: {
        gap: 8,
        marginBottom: 8,
    },
    gridItem: {
        width: GRID_ITEM_SIZE,
        height: GRID_ITEM_SIZE,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    mediaBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3,
    },
    mediaBadgeTxt: {
        color: '#FFF',
        fontFamily: FONTS.sansBold,
        fontSize: 10,
    },
    likedHeartTag: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridPriceBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    gridPriceTxt: {
        color: '#FFF',
        fontFamily: FONTS.montserratBold,
        fontSize: 10,
    },
    // Booked List
    listContainer: {
        paddingVertical: 12,
        paddingBottom: 40,
        gap: 12,
    },
    bookedCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        gap: 12,
    },
    bookedThumb: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.lg,
    },
    bookedMeta: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bookedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    bookedTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        flex: 1,
    },
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    statusChipTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
    },
    agentSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    agentMiniAvatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    agentSubTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
    },
    bookedFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    dateMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateMetaTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
    },
    bookedPriceTxt: {
        fontFamily: FONTS.montserratBold,
        fontSize: 14,
        color: COLORS.primary,
    },
    // User Row
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    userAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    userMeta: {
        flex: 1,
    },
    userName: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    roleBadgeRow: {
        flexDirection: 'row',
        marginTop: 3,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
    },
    roleBadgeTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 10,
    },
    followBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
    },
    notFollowingBtn: {
        backgroundColor: COLORS.primary,
    },
    followingBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    followBtnTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
});
