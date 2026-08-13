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
    Animated,
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
import { getAvatarUrl } from '@/services/avatarUtils';
import { checkIsFollowing, followAgent, unfollowAgent } from '@/services/api/followsApi';
import { fetchAgentRating } from '@/services/api/reviewsApi';
import { Profile } from '@/types';

// Helper for native avatar fallback
const getInitials = (name: string | null) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
const stringToColor = (str: string | null) => {
    let hash = 0;
    const safeStr = str || 'User';
    for (let i = 0; i < safeStr.length; i++) hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`; // Rich, readable colors
};

// ── iOS Premium Cuboidal Agent Card (Full Row) ───────────────────────────────
const AgentRowCard = React.memo(({ agent, index }: { agent: Profile; index: number }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [ratingStats, setRatingStats] = useState<{ averageRating: number; reviewCount: number }>({ averageRating: 4.9, reviewCount: 28 });

    useEffect(() => {
        let mounted = true;
        fetchAgentRating(agent.id)
            .then((res) => { if (mounted) setRatingStats(res); })
            .catch(() => {});
        return () => { mounted = false; };
    }, [agent.id]);

    // Check follow state on mount
    useEffect(() => {
        let mounted = true;
        checkIsFollowing(agent.id)
            .then((res) => { if (mounted) setIsFollowing(res); })
            .catch((err) => console.warn('[AgentRowCard] follow check error:', err));
        return () => { mounted = false; };
    }, [agent.id]);

    const handleToggleFollow = async () => {
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
            console.error('[AgentRowCard] Toggle follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const distanceKm = useMemo(() => (Math.random() * 4 + 0.8).toFixed(1), []);

    return (
        <AnimatedSection delay={150 + index * 100} direction="up" distance={30}>
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
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    }
                ]}
            >
                {/* 1. Banner Image */}
                <View style={styles.bannerWrap}>
                    {agent.banner_url ? (
                        <Image
                            source={{ uri: agent.banner_url }}
                            style={styles.bannerImg as any}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <View style={[styles.bannerImg, { backgroundColor: isDark ? '#3F3F46' : '#E4E4E7' }]} />
                    )}
                    {/* Dark overlay for premium feel */}
                    <View style={styles.bannerOverlay} />
                </View>

                {/* 2. Info Section */}
                <View style={styles.infoWrap}>
                    {/* Top Row: Spacer for Avatar + Follow Button on Right */}
                    <View style={styles.infoTopSpacer}>
                        <TouchableOpacity
                            onPress={handleToggleFollow}
                            disabled={followLoading}
                            style={[
                                styles.followBtnPill,
                                isFollowing
                                    ? [styles.followingBtnPill, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]
                                    : [styles.unfollowedBtnPill, { backgroundColor: COLORS.primary }],
                            ]}
                            activeOpacity={0.8}
                        >
                            {followLoading ? (
                                <ActivityIndicator size="small" color={isFollowing ? COLORS.textMuted : '#FFF'} />
                            ) : (
                                <Text
                                    style={[
                                        styles.followBtnPillTxt,
                                        { color: isFollowing ? (isDark ? COLORS.white : COLORS.textDark) : '#FFF' },
                                    ]}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Name & Badges */}
                    <View style={styles.nameRow}>
                        <Text
                            style={[styles.nameTxt, { color: isDark ? COLORS.white : COLORS.textDark }]}
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

                    {/* Bio (Immediately after name - Bold & Prominent) */}
                    {agent.bio ? (
                        <Text
                            style={[
                                styles.prominentBioTxt,
                                { color: isDark ? COLORS.white : COLORS.textDark }
                            ]}
                            numberOfLines={2}
                        >
                            {agent.bio}
                        </Text>
                    ) : null}

                    {/* Specialty, Blue Experience & Rating Row */}
                    <View style={styles.detailsRow}>
                        <Text style={styles.specTxt} numberOfLines={1}>
                            {agent.specialization || 'Beauty Expert'}
                        </Text>

                        <View style={[styles.blueExpBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' }]}>
                            <Ionicons name="ribbon-outline" size={12} color="#2563EB" />
                            <Text style={styles.blueExpTxt}>
                                {agent.years_exp ?? 1}+ Yrs Exp
                            </Text>
                        </View>

                        <View style={styles.ratingWrap}>
                            <Ionicons name="star" size={13} color="#F59E0B" />
                            <Text style={[styles.ratingValTxt, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                {ratingStats.averageRating}
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

                {/* 3. Absolute Offset Avatar */}
                <View style={styles.avatarOffsetWrap}>
                    {agent.avatar_url ? (
                        <Image
                            source={{ uri: agent.avatar_url }}
                            style={[styles.avatarOffsetImg, { borderColor: isDark ? COLORS.surfaceDark : COLORS.white } as any]}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: stringToColor(agent.full_name), borderColor: isDark ? COLORS.surfaceDark : COLORS.white }]}>
                            <Text style={styles.avatarFallbackTxt}>{getInitials(agent.full_name)}</Text>
                        </View>
                    )}
                    <View style={styles.onlineBadgeWrap}>
                        <OnlineIndicator lastSeen={agent.last_seen} />
                    </View>
                </View>
            </TouchableOpacity>
        </AnimatedSection>
    );
});

export const AgentsScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [nearMeOnly, setNearMeOnly] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { agents, loading, refetch } = useAgents(searchQuery, activeCategory);

    const handleCategorySelect = useCallback((category: string) => {
        Haptics.selectionAsync();
        setActiveCategory(category);
    }, []);

    const toggleNearMe = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNearMeOnly(prev => !prev);
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

    // Filter agents list with Near me toggle
    const filteredAgents = useMemo(() => {
        if (!agents) return [];
        if (!nearMeOnly) return agents;
        return agents.filter((a) =>
            a.location?.toLowerCase().includes('lekki') ||
            a.location?.toLowerCase().includes('victoria') ||
            a.location?.toLowerCase().includes('yaba') ||
            a.location?.toLowerCase().includes('ikeja') ||
            !a.location
        );
    }, [agents, nearMeOnly]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top', 'left', 'right']}>
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

                {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
                <AnimatedSection delay={80} direction="down" distance={15} style={[styles.filterBar, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                    <View style={styles.searchWrap}>
                        <View style={[styles.searchBox, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                            <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
                            <ThemedTextInput
                                placeholder="Search makeup, hair, lash pros..."
                                style={[styles.searchInput, { color: isDark ? COLORS.white : COLORS.textDark }]}
                                placeholderTextColor={COLORS.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Near Me Toggle Button */}
                        <TouchableOpacity
                            onPress={toggleNearMe}
                            style={[
                                styles.nearMeBtn,
                                {
                                    backgroundColor: nearMeOnly ? COLORS.primary : isDark ? COLORS.surfaceDark : COLORS.white,
                                    borderColor: nearMeOnly ? COLORS.primary : isDark ? COLORS.borderDark : COLORS.border,
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="my-location" size={16} color={nearMeOnly ? '#FFF' : COLORS.primary} />
                            <Text style={[styles.nearMeTxt, { color: nearMeOnly ? '#FFF' : isDark ? COLORS.white : COLORS.textDark }]}>
                                Near me
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Chips */}
                    <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />
                </AnimatedSection>

                {/* ── Agent Row Cards List ───────────────────────────────────────────── */}
                <FlatList
                    data={filteredAgents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => <AgentRowCard agent={item} index={index} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ListEmptyComponent={() => (
                        loading ? (
                            <View style={styles.emptyContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={[styles.emptyTxt, { color: COLORS.textMuted }]}>
                                    Loading beauty pros...
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.blush }]}>
                                    <MaterialIcons name="person-search" size={36} color={COLORS.primary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                    No beauty pros found
                                </Text>
                                <Text style={[styles.emptyTxt, { color: COLORS.textMuted }]}>
                                    Try clearing your search or category filters to discover more creators.
                                </Text>
                            </View>
                        )
                    )}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    headerArea: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 14,
        paddingBottom: 8,
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 28,
    },
    headerSub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        marginTop: 2,
    },
    filterBar: {
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.screen,
        marginBottom: 10,
        gap: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: RADIUS.full,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
    },
    nearMeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        gap: 4,
    },
    nearMeTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 12,
        paddingBottom: 100,
    },
    bannerCard: {
        width: '100%',
        borderRadius: RADIUS.xl, // Fixed RADIUS.2xl
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden', // to clip the banner corners
        marginBottom: 8,
    },
    bannerWrap: {
        width: '100%',
        height: 90,
        position: 'relative',
    },
    bannerImg: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    infoWrap: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    infoTopSpacer: {
        height: 46, // Spacer height allows the avatar to overlap gracefully
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    avatarOffsetWrap: {
        position: 'absolute',
        top: 90 - 38, // banner height - half of avatar height
        left: 16,
        width: 76,
        height: 76,
        zIndex: 10,
    },
    avatarOffsetImg: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        backgroundColor: '#E5E7EB',
    },
    avatarFallback: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallbackTxt: {
        fontFamily: FONTS.playfairBold,
        fontSize: 26,
        color: '#FFFFFF',
    },
    onlineBadgeWrap: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    nameTxt: {
        fontFamily: FONTS.playfairBold,
        fontSize: 19,
        letterSpacing: 0.2,
    },
    verifiedWrap: {
        marginTop: 2,
    },
    prominentBioTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        lineHeight: 19,
        marginTop: 2,
        marginBottom: 6,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    specTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 13,
        color: COLORS.primary,
    },
    blueExpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.25)',
    },
    blueExpTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: '#2563EB',
    },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingValTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    ratingCountTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
    },
    locTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginTop: 2,
    },
    followBtnPill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unfollowedBtnPill: {},
    followingBtnPill: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    followBtnPillTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 30,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
        marginBottom: 6,
    },
    emptyTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default AgentsScreen;
