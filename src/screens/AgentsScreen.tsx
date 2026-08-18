// src/screens/AgentsScreen.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAgents } from '@/hooks/useProfile';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import CategoryChips from '@/components/CategoryChips';
import ThemedTextInput from '@/components/ThemedTextInput';
import VerifiedBadge from '@/components/VerifiedBadge';
import OnlineIndicator from '@/components/OnlineIndicator';
import AnimatedSection from '@/components/AnimatedSection';
import AgentSkeletonList from '@/components/AgentSkeleton';
import { getAvatarUrl } from '@/services/avatarUtils';
import { checkIsFollowing, followAgent, unfollowAgent } from '@/services/api/followsApi';
import { fetchAgentRating } from '@/services/api/reviewsApi';
import { Profile } from '@/types';

// Helper for native avatar fallback
const getInitials = (name: string | null) =>
    name
        ? name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
        : 'U';

const stringToColor = (str: string | null) => {
    let hash = 0;
    const safeStr = str || 'User';
    for (let i = 0; i < safeStr.length; i++) hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
};

// ── 1. Default Visual Mode: High-Clarity Card with Large Avatar & Clear Fonts ──
const AgentBannerCard = React.memo(({ agent, index }: { agent: Profile; index: number }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [ratingStats, setRatingStats] = useState<{ averageRating: number; reviewCount: number }>({
        averageRating: 4.9,
        reviewCount: 28,
    });

    useEffect(() => {
        let mounted = true;
        fetchAgentRating(agent.id)
            .then((res) => {
                if (mounted) setRatingStats(res);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [agent.id]);

    useEffect(() => {
        let mounted = true;
        checkIsFollowing(agent.id)
            .then((res) => {
                if (mounted) setIsFollowing(res);
            })
            .catch((err) => console.warn('[AgentBannerCard] follow check error:', err));
        return () => {
            mounted = false;
        };
    }, [agent.id]);

    const handleToggleFollow = async (e: any) => {
        e?.stopPropagation?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowAgent(agent.id);
                setIsFollowing(false);
            } else {
                await followAgent(agent.id);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('[AgentBannerCard] Toggle follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const distanceKm = useMemo(() => (Math.random() * 4 + 0.8).toFixed(1), []);

    return (
        <AnimatedSection delay={Math.min(80 + index * 60, 360)} direction="up" distance={20}>
            <TouchableOpacity
                onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('AgentProfile', { agentId: agent.id });
                }}
                activeOpacity={0.9}
                style={[
                    styles.bannerCard,
                    {
                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                    },
                    SHADOWS.md,
                ]}
            >
                {/* 1. Banner Image */}
                <View style={styles.bannerWrap}>
                    {agent.banner_url ? (
                        <Image
                            source={{ uri: agent.banner_url }}
                            style={styles.bannerImg as any}
                            contentFit="cover"
                            transition={250}
                        />
                    ) : (
                        <View
                            style={[
                                styles.bannerImg,
                                { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                            ]}
                        />
                    )}
                    <View style={styles.bannerOverlay} />
                </View>

                {/* 2. Info Section */}
                <View style={styles.infoWrap}>
                    {/* Top Row: Follow Button on Far Right */}
                    <View style={styles.infoTopSpacer}>
                        <TouchableOpacity
                            onPress={handleToggleFollow}
                            disabled={followLoading}
                            style={[
                                styles.followBtnPill,
                                isFollowing
                                    ? [
                                          styles.followingBtnPill,
                                          {
                                              borderColor: isDark
                                                  ? COLORS.borderDark
                                                  : COLORS.border,
                                          },
                                      ]
                                    : [
                                          styles.unfollowedBtnPill,
                                          { backgroundColor: COLORS.primary },
                                      ],
                            ]}
                            activeOpacity={0.8}
                        >
                            {followLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={isFollowing ? COLORS.textMuted : '#FFF'}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.followBtnPillTxt,
                                        {
                                            color: isFollowing
                                                ? isDark
                                                    ? COLORS.white
                                                    : COLORS.textDark
                                                : '#FFF',
                                        },
                                    ]}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Name & Verified Badge (Clear 20px typography) */}
                    <View style={styles.nameRow}>
                        <Text
                            style={[
                                styles.nameTxt,
                                { color: isDark ? COLORS.white : COLORS.textDark },
                            ]}
                            numberOfLines={1}
                        >
                            {agent.full_name}
                        </Text>
                        {agent.verification_status === 'verified' && (
                            <View style={styles.verifiedWrap}>
                                <VerifiedBadge />
                            </View>
                        )}
                    </View>

                    {/* Bio (Clear 14px typography with comfortable line height) */}
                    {agent.bio ? (
                        <Text
                            style={[
                                styles.prominentBioTxt,
                                { color: isDark ? '#E5E7EB' : '#374151' },
                            ]}
                            numberOfLines={2}
                        >
                            {agent.bio}
                        </Text>
                    ) : null}

                    {/* Specialty, Experience & Rating Row */}
                    <View style={styles.detailsRow}>
                        <Text style={styles.specTxt} numberOfLines={1}>
                            {agent.specialization || 'Beauty Expert'}
                        </Text>

                        <View
                            style={[
                                styles.blueExpBadge,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(37, 99, 235, 0.2)'
                                        : '#EFF6FF',
                                },
                            ]}
                        >
                            <Ionicons name="ribbon-outline" size={13} color="#2563EB" />
                            <Text style={styles.blueExpTxt}>
                                {agent.years_exp ?? 1}+ Yrs Exp
                            </Text>
                        </View>

                        <View style={styles.ratingWrap}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text
                                style={[
                                    styles.ratingValTxt,
                                    { color: isDark ? COLORS.white : COLORS.textDark },
                                ]}
                            >
                                {ratingStats.averageRating.toFixed(1)}
                            </Text>
                            <Text style={[styles.ratingCountTxt, { color: COLORS.textMuted }]}>
                                ({ratingStats.reviewCount})
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.locTxt, { color: COLORS.textMuted }]} numberOfLines={1}>
                        {agent.location || 'Lagos'} · {distanceKm} km near me
                    </Text>
                </View>

                {/* 3. Generous Clear View Profile Avatar (96x96) */}
                <View style={styles.avatarOffsetWrap}>
                    {agent.avatar_url ? (
                        <Image
                            source={{ uri: agent.avatar_url }}
                            style={[
                                styles.avatarOffsetImg,
                                {
                                    borderColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                } as any,
                            ]}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View
                            style={[
                                styles.avatarFallback,
                                {
                                    backgroundColor: stringToColor(agent.full_name),
                                    borderColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                },
                            ]}
                        >
                            <Text style={styles.avatarFallbackTxt}>
                                {getInitials(agent.full_name)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.onlineBadgeWrap}>
                        <OnlineIndicator lastSeen={agent.last_seen} size={14} />
                    </View>
                </View>
            </TouchableOpacity>
        </AnimatedSection>
    );
});

// ── 2. Search Mode: Clear View Row (64x64 Avatar & 16px Font) ─────────────────
const AgentSearchRow = React.memo(({ agent, index }: { agent: Profile; index: number }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        checkIsFollowing(agent.id)
            .then((res) => {
                if (mounted) setIsFollowing(res);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [agent.id]);

    const handleToggleFollow = async (e: any) => {
        e?.stopPropagation?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowAgent(agent.id);
                setIsFollowing(false);
            } else {
                await followAgent(agent.id);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('[AgentSearchRow] follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const avatarUri = getAvatarUrl(agent.full_name, agent.avatar_url);

    return (
        <AnimatedSection delay={Math.min(index * 45, 300)} direction="up" distance={15}>
            <TouchableOpacity
                onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('AgentProfile', { agentId: agent.id });
                }}
                activeOpacity={0.8}
                style={[
                    styles.searchRowContainer,
                    {
                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    },
                    SHADOWS.sm,
                ]}
            >
                {/* Clear 64x64 Avatar with Online Dot */}
                <View style={styles.searchAvatarWrapper}>
                    <Image
                        source={{ uri: avatarUri }}
                        style={styles.searchAvatarImg}
                        contentFit="cover"
                        transition={200}
                    />
                    <View style={styles.searchOnlineDot}>
                        <OnlineIndicator lastSeen={agent.last_seen} size={12} />
                    </View>
                </View>

                {/* Middle info with 16px title */}
                <View style={styles.searchMiddleInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[
                                styles.searchNameTxt,
                                { color: isDark ? COLORS.white : COLORS.textDark },
                            ]}
                            numberOfLines={1}
                        >
                            {agent.full_name}
                        </Text>
                        {agent.verification_status === 'verified' && (
                            <View style={{ marginLeft: 5 }}>
                                <VerifiedBadge />
                            </View>
                        )}
                    </View>

                    <Text
                        style={[styles.searchCategoryTxt, { color: COLORS.primary }]}
                        numberOfLines={1}
                    >
                        {agent.specialization || 'Beauty Expert'}
                        {agent.location ? ` · ${agent.location}` : ''}
                    </Text>
                </View>

                {/* Follow Button */}
                <TouchableOpacity
                    onPress={handleToggleFollow}
                    disabled={followLoading}
                    style={[
                        styles.searchFollowBtn,
                        isFollowing
                            ? [
                                  styles.searchFollowingBtn,
                                  {
                                      borderColor: isDark
                                          ? COLORS.borderDark
                                          : COLORS.border,
                                      backgroundColor: isDark ? '#262626' : '#F4F4F5',
                                  },
                              ]
                            : [
                                  styles.searchUnfollowedBtn,
                                  { backgroundColor: COLORS.primary },
                              ],
                    ]}
                >
                    {followLoading ? (
                        <ActivityIndicator
                            size="small"
                            color={isFollowing ? COLORS.textMuted : '#FFF'}
                        />
                    ) : (
                        <Text
                            style={[
                                styles.searchFollowBtnTxt,
                                {
                                    color: isFollowing
                                        ? isDark
                                            ? COLORS.white
                                            : COLORS.textDark
                                        : '#FFF',
                                },
                            ]}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </AnimatedSection>
    );
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export const AgentsScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    const { agents, loading, refetch } = useAgents(searchQuery, activeCategory);

    const handleCategorySelect = useCallback((category: string) => {
        Haptics.selectionAsync();
        setActiveCategory(category);
    }, []);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        try {
            await refetch();
        } catch (err) {
            console.error('Failed to refetch agents:', err);
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const isSearching = searchQuery.trim().length > 0;

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}
            edges={['top', 'left', 'right']}
        >
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* ── Header ────────────────────────────────────────────────────────── */}
                <AnimatedSection delay={0} direction="down" distance={20} style={styles.headerArea}>
                    <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                        Beauty Pros
                    </Text>
                    <Text style={[styles.headerSub, { color: COLORS.textMuted }]}>
                        Discover top certified artists & beauty creators near you
                    </Text>
                </AnimatedSection>

                {/* ── Full-Width Search & Filter Bar ───────────────────────────────── */}
                <AnimatedSection
                    delay={80}
                    direction="down"
                    distance={15}
                    style={[
                        styles.filterBar,
                        {
                            backgroundColor: isDark ? COLORS.bgDark : COLORS.background,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                        },
                    ]}
                >
                    <View style={styles.searchWrap}>
                        <View
                            style={[
                                styles.searchBox,
                                {
                                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                },
                            ]}
                        >
                            <MaterialIcons name="search" size={22} color={COLORS.textMuted} />
                            <ThemedTextInput
                                placeholder="Search by name, category, or location..."
                                style={[
                                    styles.searchInput,
                                    { color: isDark ? COLORS.white : COLORS.textDark },
                                ]}
                                placeholderTextColor={COLORS.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Category Chips */}
                    <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />
                </AnimatedSection>

                {/* ── Search Active Counter ── */}
                {isSearching && (
                    <View style={styles.searchResultsBar}>
                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13.5, color: COLORS.textMuted }}>
                            {agents.length} specialist{agents.length !== 1 ? 's' : ''} found for "{searchQuery}"
                        </Text>
                    </View>
                )}

                {/* ── Agents List / Skeleton Loader ─────────────────────────────────── */}
                {loading ? (
                    <AgentSkeletonList count={6} />
                ) : (
                    <FlatList
                        data={agents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) =>
                            isSearching ? (
                                <AgentSearchRow agent={item} index={index} />
                            ) : (
                                <AgentBannerCard agent={item} index={index} />
                            )
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => (
                            <View style={{ height: isSearching ? 10 : 14 }} />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={COLORS.primary}
                                colors={[COLORS.primary]}
                            />
                        }
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <View
                                    style={[
                                        styles.emptyIconCircle,
                                        { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush },
                                    ]}
                                >
                                    <MaterialIcons name="person-search" size={38} color={COLORS.primary} />
                                </View>
                                <Text
                                    style={[
                                        styles.emptyTitle,
                                        { color: isDark ? COLORS.white : COLORS.textDark },
                                    ]}
                                >
                                    No beauty pros found
                                </Text>
                                <Text style={[styles.emptyTxt, { color: COLORS.textMuted }]}>
                                    Try adjusting your search terms or category filter to discover specialists.
                                </Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerArea: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 14,
        paddingBottom: 4,
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 30,
        letterSpacing: -0.5,
    },
    headerSub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13.5,
        marginTop: 2,
    },
    filterBar: {
        paddingTop: 10,
        paddingBottom: 2,
    },
    searchWrap: {
        paddingHorizontal: SPACING.screen,
        marginBottom: 4,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: FONTS.sansMedium,
        fontSize: 15,
    },
    searchResultsBar: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 8,
        paddingBottom: 4,
    },
    listContent: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 8,
        paddingBottom: 110,
    },

    // ── Banner Card Styles ───────────────────────────────────────────────────
    bannerCard: {
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    bannerWrap: {
        height: 114,
        width: '100%',
        position: 'relative',
    },
    bannerImg: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    infoWrap: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 14,
    },
    infoTopSpacer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height: 44,
        alignItems: 'center',
    },
    followBtnPill: {
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 86,
    },
    unfollowedBtnPill: {
        ...SHADOWS.pink,
    },
    followingBtnPill: {
        borderWidth: 1,
    },
    followBtnPillTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    nameTxt: {
        fontFamily: FONTS.playfairBold,
        fontSize: 20,
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    verifiedWrap: {
        marginLeft: 6,
    },
    prominentBioTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 5,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    specTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13.5,
        color: COLORS.primary,
    },
    blueExpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    blueExpTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 11.5,
        color: '#2563EB',
    },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingValTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13.5,
    },
    ratingCountTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
    },
    locTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12.5,
        marginTop: 7,
    },
    avatarOffsetWrap: {
        position: 'absolute',
        top: 54,
        left: 16,
    },
    avatarOffsetImg: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
    },
    avatarFallback: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallbackTxt: {
        fontFamily: FONTS.montserratBold,
        fontSize: 28,
        color: '#FFF',
    },
    onlineBadgeWrap: {
        position: 'absolute',
        bottom: 3,
        right: 3,
    },

    // ── Search Row Styles ────────────────────────────────────────────────────
    searchRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    searchAvatarWrapper: {
        position: 'relative',
        marginRight: 14,
    },
    searchAvatarImg: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    searchOnlineDot: {
        position: 'absolute',
        bottom: -1,
        right: -1,
    },
    searchMiddleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    searchNameTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        letterSpacing: -0.2,
        flexShrink: 1,
    },
    searchCategoryTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 13.5,
        marginTop: 3,
    },
    searchFollowBtn: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        marginLeft: 10,
    },
    searchUnfollowedBtn: {
        ...SHADOWS.pink,
    },
    searchFollowingBtn: {
        borderWidth: 1,
    },
    searchFollowBtnTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12.5,
    },

    // ── Empty State Styles ───────────────────────────────────────────────────
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
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
    emptyTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13.5,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default AgentsScreen;
