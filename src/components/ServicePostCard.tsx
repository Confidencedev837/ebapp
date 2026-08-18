import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Service } from '@/types';
import VerifiedBadge from './VerifiedBadge';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS, SHADOWS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { followAgent, unfollowAgent, checkIsFollowing } from '@/services/api/followsApi';
import { useUserStore } from '@/store/useUserStore';
import { useLike } from '@/hooks/useLike';
import { useFavorite } from '@/hooks/useFavorite';
import { useShare } from '@/hooks/useShare';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// How many characters before "...See more"
const DESCRIPTION_LIMIT = 100;

interface Props {
    service: Service;
}

const ServicePostCard: React.FC<Props> = React.memo(({ service }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { user } = useUserStore();
    const isDark = theme === 'dark';

    // ── Real Supabase-backed interactions ────────────────────────────────
    const { isLiked, likeCount, toggleLike } = useLike(service.id);
    const { isFavorited, toggleFavorite } = useFavorite(service.id);
    const { share, isSharing } = useShare(service);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    const agentId = service.agent_id;
    const agentName = service.profiles?.full_name || 'Service Provider';
    const agentLocation = service.profiles?.location;
    const agentAvatar = getAvatarUrl(agentName, service.profiles?.avatar_url);

    const mediaList = Array.isArray(service.image_url) ? service.image_url : [];
    const isOwnProfile = user?.id === agentId;

    // ── Load initial follow state ────────────────────────────────────────
    useEffect(() => {
        if (!user?.id || isOwnProfile) return;
        let cancelled = false;
        checkIsFollowing(agentId).then(val => {
            if (!cancelled) setIsFollowing(val);
        });
        return () => { cancelled = true; };
    }, [agentId, user?.id]);

    // ── Follow / Unfollow ────────────────────────────────────────────────
    const handleFollowToggle = useCallback(async () => {
        if (!user?.id || isOwnProfile || followLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowAgent(agentId);
                setIsFollowing(false);
            } else {
                await followAgent(agentId);
                setIsFollowing(true);
            }
        } catch (_) {
            // silent — don't crash the feed
        } finally {
            setFollowLoading(false);
        }
    }, [isFollowing, followLoading, agentId, user?.id]);

    const goToAgentProfile = () =>
        navigation.navigate('AgentProfile', { agentId });

    const handlePress = () =>
        navigation.navigate('ServiceDetail', { serviceId: service.id });

    // ── FB-style dynamic media grid ──────────────────────────────────────
    const renderMediaGrid = () => {
        const count = mediaList.length;

        if (count === 0) {
            return (
                <View style={[styles.mediaSingle, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="image-not-supported" size={48} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textMuted, fontFamily: FONTS.sansRegular, fontSize: 12, marginTop: 8 }}>
                        No media attached
                    </Text>
                </View>
            );
        }

        if (count === 1) {
            return (
                <Image
                    source={{ uri: mediaList[0] }}
                    style={styles.mediaSingle}
                    contentFit="cover"
                    placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                    transition={500}
                />
            );
        }

        if (count === 2) {
            return (
                <View style={styles.mediaRow}>
                    <Image source={{ uri: mediaList[0] }} style={styles.mediaHalf} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                    <View style={styles.mediaDivider} />
                    <Image source={{ uri: mediaList[1] }} style={styles.mediaHalf} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                </View>
            );
        }

        if (count === 3) {
            return (
                <View style={styles.mediaRow}>
                    <Image source={{ uri: mediaList[0] }} style={styles.mediaMainLeft} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                    <View style={styles.mediaDivider} />
                    <View style={styles.mediaStackedRight}>
                        <Image source={{ uri: mediaList[1] }} style={styles.mediaStackedTop} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                        <View style={styles.mediaDividerH} />
                        <Image source={{ uri: mediaList[2] }} style={styles.mediaStackedTop} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                    </View>
                </View>
            );
        }

        // 4+
        return (
            <View style={styles.mediaRow}>
                <Image source={{ uri: mediaList[0] }} style={styles.mediaMainLeft} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                <View style={styles.mediaDivider} />
                <View style={styles.mediaStackedRight}>
                    <Image source={{ uri: mediaList[1] }} style={styles.mediaStackedTop} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                    <View style={styles.mediaDividerH} />
                    <Image source={{ uri: mediaList[2] }} style={styles.mediaStackedTop} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                    <View style={styles.mediaDividerH} />
                    <View style={styles.mediaStackedTopExtra}>
                        <Image source={{ uri: mediaList[3] }} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={{ blurhash: UNIVERSAL_BLURHASH }} transition={500} />
                        {count > 4 && (
                            <View style={styles.moreOverlay}>
                                <Text style={styles.moreOverlayText}>+{count - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // ── Description with truncation ──────────────────────────────────────
    const fullDesc = service.description || '';
    const isTruncatable = fullDesc.length > DESCRIPTION_LIMIT;
    const displayedDesc = !descExpanded && isTruncatable
        ? fullDesc.slice(0, DESCRIPTION_LIMIT)
        : fullDesc;

    return (
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white }]}>

            {/* ── 1. AGENT HEADER ─────────────────────────────────────── */}
            <TouchableOpacity onPress={goToAgentProfile} activeOpacity={0.85}>
                <View style={styles.header}>
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        <Image source={{ uri: agentAvatar }} style={styles.avatar} contentFit="cover" />
                        <View style={styles.verifiedBadge}><VerifiedBadge /></View>
                    </View>

                    {/* Name + location */}
                    <View style={styles.headerMeta}>
                        <Text style={[styles.agentName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            {agentName}
                        </Text>
                        {agentLocation ? (
                            <View style={styles.locationRow}>
                                <MaterialIcons name="place" size={11} color={COLORS.primary} />
                                <Text style={styles.locationTxt}>{agentLocation}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Follow button — hidden for own profile */}
                    {!isOwnProfile && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleFollowToggle();
                            }}
                            disabled={followLoading}
                            style={[
                                styles.followBtn,
                                isFollowing ? styles.followingBtn : styles.notFollowingBtn,
                            ]}
                        >
                            {isFollowing
                                ? <MaterialIcons name="check" size={12} color={COLORS.white} style={{ marginRight: 3 }} />
                                : <MaterialIcons name="add" size={12} color={COLORS.primary} style={{ marginRight: 3 }} />
                            }
                            <Text style={[styles.followBtnTxt, { color: isFollowing ? COLORS.white : COLORS.primary }]}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {/* ── 2. SERVICE NAME + DESCRIPTION (prominent, before media) ─ */}
            <View style={styles.titleBlock}>
                {/* Service name — bold, prominent */}
                <Text style={[styles.serviceName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    {service.name}
                </Text>

                {/* Category badge inline */}
                <View style={[styles.categoryBadge, { backgroundColor: COLORS.blush }]}>
                    <Text style={styles.categoryTxt}>{service.category}</Text>
                </View>
            </View>

            {/* Description — less prominent, truncated */}
            {fullDesc.length > 0 && (
                <View style={styles.descBlock}>
                    <Text style={[styles.descTxt, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
                        {displayedDesc}
                        {!descExpanded && isTruncatable && (
                            <Text
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setDescExpanded(true);
                                }}
                                style={styles.seeMore}
                            >
                                {'...'}
                                <Text style={styles.seeMoreLabel}> See more</Text>
                            </Text>
                        )}
                    </Text>
                    {descExpanded && isTruncatable && (
                        <Text
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setDescExpanded(false);
                            }}
                            style={[styles.seeMore, { marginTop: 4 }]}
                        >
                            See less
                        </Text>
                    )}
                </View>
            )}

            {/* ── 3. MEDIA GRID ───────────────────────────────────────── */}
            <TouchableOpacity activeOpacity={0.96} onPress={handlePress} style={styles.mediaWrapper}>
                <View style={styles.mediaZoomContainer}>
                    {renderMediaGrid()}
                </View>

                {/* Price + Duration overlay — prominent, bottom of media */}
                <View style={styles.detailsOverlay}>
                    <View>
                        <Text style={styles.priceLabel}>PRICE</Text>
                        <Text style={styles.priceValue}>₦{service.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.durationPill}>
                        <MaterialIcons name="schedule" size={14} color={COLORS.white} />
                        <Text style={styles.durationTxt}>{service.duration_mins} mins</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* ── 4. ACTION BAR — underneath, Facebook-style ──────────── */}
            <View style={[styles.actionBar, { borderTopColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                {/* Left actions */}
                <View style={styles.actionLeft}>
                    {/* Like button with count */}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={toggleLike}
                    >
                        <MaterialIcons
                            name={isLiked ? 'favorite' : 'favorite-border'}
                            size={24}
                            color={isLiked ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark)}
                        />
                    </TouchableOpacity>
                    {likeCount > 0 && (
                        <Text style={[styles.countLabel, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
                            {likeCount}
                        </Text>
                    )}

                    {/* Share button */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { opacity: isSharing ? 0.5 : 1 }]}
                        onPress={share}
                        disabled={isSharing}
                    >
                        <MaterialIcons
                            name="share"
                            size={23}
                            color={isDark ? COLORS.white : COLORS.textDark}
                        />
                    </TouchableOpacity>
                </View>

                {/* Right: Bookmark + Book Now */}
                <View style={styles.actionRight}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={toggleFavorite}
                    >
                        <MaterialIcons
                            name={isFavorited ? 'bookmark' : 'bookmark-border'}
                            size={24}
                            color={isFavorited ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark)}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handlePress}
                        style={[styles.bookNowBtn, SHADOWS.pink]}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.bookNowTxt}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const MEDIA_HEIGHT = 280;

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        overflow: 'hidden',
    },

    // ── Header ──────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 10,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        borderColor: COLORS.roseMid,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
    },
    headerMeta: {
        flex: 1,
    },
    agentName: {
        fontFamily: FONTS.sansBold,
        fontSize: 15,
        lineHeight: 19,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        color: COLORS.textMuted,
        marginLeft: 2,
    },
    followBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
        borderWidth: 1.5,
    },
    notFollowingBtn: {
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    followingBtn: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    followBtnTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
    },

    // ── Title block ──────────────────────────────────────────────────────
    titleBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingBottom: 6,
        flexWrap: 'wrap',
        gap: 8,
    },
    serviceName: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
        flex: 1,
        lineHeight: 22,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    categoryTxt: {
        fontFamily: FONTS.montserratBold,
        fontSize: 9,
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },

    // ── Description ──────────────────────────────────────────────────────
    descBlock: {
        paddingHorizontal: 14,
        paddingBottom: 10,
    },
    descTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        lineHeight: 19,
    },
    seeMore: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        color: COLORS.textMuted,
    },
    seeMoreLabel: {
        fontFamily: FONTS.sansBold,
        color: COLORS.primary,
    },

    // ── Media grid ───────────────────────────────────────────────────────
    mediaWrapper: {
        position: 'relative',
        height: MEDIA_HEIGHT,
    },
    mediaZoomContainer: {
        width: '100%',
        height: MEDIA_HEIGHT,
        overflow: 'hidden',
        transform: [{ scale: 1.04 }],
    },
    mediaSingle: {
        width: '100%',
        height: MEDIA_HEIGHT,
    },
    mediaRow: {
        flex: 1,
        flexDirection: 'row',
        height: MEDIA_HEIGHT,
    },
    mediaHalf: {
        flex: 1,
        height: MEDIA_HEIGHT,
    },
    mediaMainLeft: {
        flex: 1.4,
        height: MEDIA_HEIGHT,
    },
    mediaStackedRight: {
        flex: 1,
        height: MEDIA_HEIGHT,
    },
    mediaStackedTop: {
        flex: 1,
        width: '100%',
    },
    mediaStackedTopExtra: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    mediaDivider: {
        width: 2,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    mediaDividerH: {
        height: 2,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    moreOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.52)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreOverlayText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 20,
        color: COLORS.white,
    },
    detailsOverlay: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 14,
        backgroundColor: 'rgba(0,0,0,0.68)',
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        fontFamily: FONTS.sansRegular,
        fontSize: 9,
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: 1,
    },
    priceValue: {
        fontFamily: FONTS.montserratBold,
        fontSize: 22,
        color: '#4ADE80', // vivid green — price must stand out
        lineHeight: 26,
    },
    durationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: RADIUS.full,
    },
    durationTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        color: COLORS.white,
    },

    // ── Action bar ───────────────────────────────────────────────────────
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    bookNowBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: RADIUS.full,
        marginLeft: 6,
    },
    bookNowTxt: {
        fontFamily: FONTS.montserratBold,
        fontSize: 13,
        color: COLORS.white,
    },
    countLabel: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        marginLeft: 2,
        marginRight: 4,
    },
});

export default ServicePostCard;