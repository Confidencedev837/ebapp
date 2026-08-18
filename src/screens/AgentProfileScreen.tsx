// src/screens/AgentProfileScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { COLORS, FONTS, RADIUS, SHADOWS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAvatarUrl, isOnline, lastSeenLabel } from '@/services/avatarUtils';
import VerifiedBadge from '@/components/VerifiedBadge';
import OnlineIndicator from '@/components/OnlineIndicator';
import { followAgent, unfollowAgent, checkIsFollowing } from '@/services/api/followsApi';
import { fetchFollowCounts } from '@/services/api/profileTabsApi';
import { fetchAgentRating, fetchServiceReviews } from '@/services/api/reviewsApi';
import { shareProfile } from '@/utils/shareUtils';
import { useUserStore } from '@/store/useUserStore';
import { Profile, Service, Review } from '@/types';
import AgentSkeletonList from '@/components/AgentSkeleton';
import BrandedSpinner from '@/components/BrandedSpinner';
import AnimatedSection from '@/components/AnimatedSection';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

type RootStackParamList = { AgentProfile: { agentId: string } };
type AgentProfileRouteProp = RouteProp<RootStackParamList, 'AgentProfile'>;

type GuestTabType = 'services' | 'portfolio' | 'reviews' | 'about';
type MediaItem = { url: string; type: 'image' | 'video' };

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m3u8)(\?.*)?$/i.test(url);

const FullscreenVideoSlide = ({
    uri,
    shouldPlay,
    onRef,
}: {
    uri: string;
    shouldPlay: boolean;
    onRef: (ref: Video | null) => void;
}) => {
    const [isReady, setIsReady] = useState(false);

    return (
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <Video
                ref={onRef}
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={shouldPlay}
                isLooping={false}
                usePoster={true}
                posterSource={{ uri }}
                posterStyle={{ resizeMode: 'contain' }}
                progressUpdateIntervalMillis={100}
                onLoadStart={() => setIsReady(false)}
                onReadyForDisplay={() => setIsReady(true)}
                onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && !isReady) {
                        setIsReady(true);
                    }
                }}
            />
            {!isReady && (
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                    <BrandedSpinner size="medium" showLabel labelText="Buffering video..." />
                </View>
            )}
        </View>
    );
};

/* ─────────────────────────────────────────────
   Fullscreen Portfolio Viewer with Pinch & Video
───────────────────────────────────────────── */
const FullscreenPortfolioViewer = ({
    media,
    initialIndex,
    visible,
    onClose,
}: {
    media: MediaItem[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
}) => {
    const insets = useSafeAreaInsets();
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const videoRefs = useRef<Record<number, Video | null>>({});

    useEffect(() => {
        if (visible) {
            setActiveIdx(initialIndex);
        } else {
            Object.values(videoRefs.current).forEach((ref) => ref?.pauseAsync());
        }
    }, [visible, initialIndex]);

    useEffect(() => {
        Object.entries(videoRefs.current).forEach(([idx, ref]) => {
            if (Number(idx) !== activeIdx) ref?.pauseAsync();
        });
    }, [activeIdx]);

    const closeViewer = () => {
        Object.values(videoRefs.current).forEach((ref) => ref?.pauseAsync());
        onClose();
    };

    const imageUrls = media.map((m) => ({ url: m.url, props: { type: m.type } }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={closeViewer}
        >
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <ImageViewer
                    imageUrls={imageUrls}
                    index={initialIndex}
                    onChange={(index) => setActiveIdx(index || 0)}
                    enableSwipeDown={true}
                    onSwipeDown={closeViewer}
                    swipeDownThreshold={90}
                    saveToLocalByLongPress={false}
                    renderHeader={(currentIndex) => (
                        <View
                            style={{
                                position: 'absolute',
                                top: insets.top + 14,
                                left: 16,
                                right: 16,
                                zIndex: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <TouchableOpacity
                                onPress={closeViewer}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                }}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="close" size={22} color="white" />
                            </TouchableOpacity>
                            <View
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                    paddingHorizontal: 14,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.15)',
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'rgba(255,255,255,0.95)',
                                        fontFamily: FONTS.sansBold,
                                        fontSize: 13,
                                    }}
                                >
                                    {(currentIndex || 0) + 1} / {media.length}
                                </Text>
                            </View>
                            <View style={{ width: 40 }} />
                        </View>
                    )}
                    renderIndicator={() => <View />}
                    renderImage={(props) => {
                        const { source } = props as any;
                        const itemProps = imageUrls.find((i) => i.url === source.uri)?.props as any;
                        if (itemProps?.type === 'video') {
                            const index = imageUrls.findIndex((i) => i.url === source.uri);
                            return (
                                <FullscreenVideoSlide
                                    uri={source.uri}
                                    shouldPlay={index === activeIdx}
                                    onRef={(r) => { videoRefs.current[index] = r; }}
                                />
                            );
                        }
                        return (
                            <Image
                                source={{ uri: source.uri }}
                                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                                contentFit="contain"
                            />
                        );
                    }}
                />
            </View>
        </Modal>
    );
};

const AgentProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<AgentProfileRouteProp>();
    const { agentId } = route.params;
    const { theme } = useTheme();
    const { user } = useUserStore();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { animStyle } = useScreenAnimation();
    const scrollViewRef = useRef<ScrollView>(null);

    const [loading, setLoading] = useState(true);
    const [agent, setAgent] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [ratingStats, setRatingStats] = useState<{ averageRating: number; reviewCount: number }>({
        averageRating: 4.9,
        reviewCount: 28,
    });
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<GuestTabType>('services');
    const [serviceSelectModal, setServiceSelectModal] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    const portfolioMedia = React.useMemo<MediaItem[]>(() => {
        const rawUrls: string[] = [];
        // 1. Collect all images and videos from services
        services.forEach((s) => {
            if (Array.isArray(s.image_url)) {
                rawUrls.push(...s.image_url);
            } else if (s.image_url) {
                rawUrls.push(s.image_url);
            }
        });
        // 2. Collect from agent's gallery if available
        if (Array.isArray((agent as any)?.gallery)) {
            (agent as any).gallery.forEach((g: any) => {
                if (typeof g === 'string') rawUrls.push(g);
                else if (g?.url) rawUrls.push(g.url);
            });
        }
        return Array.from(new Set(rawUrls.filter(Boolean))).map((url) => ({
            url,
            type: isVideoUrl(url) ? 'video' : 'image',
        }));
    }, [services, agent]);

    const isOwnProfile = user?.id === agentId;

    // ── Fetch agent profile, services, reviews, follow counts ────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                // 1. Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', agentId)
                    .single();

                if (profileError || !profileData) {
                    if (!cancelled) setAgent(null);
                    return;
                }
                if (!cancelled) setAgent(profileData as Profile);

                // 2. Services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('agent_id', agentId)
                    .order('created_at', { ascending: false });

                if (!cancelled && servicesData) {
                    setServices(servicesData as Service[]);
                }

                // 3. Follow Counts
                const counts = await fetchFollowCounts(agentId);
                if (!cancelled) {
                    setFollowersCount(counts.followersCount);
                    setFollowingCount(counts.followingCount);
                }

                // 4. Rating stats
                const rating = await fetchAgentRating(agentId);
                if (!cancelled) {
                    setRatingStats(rating);
                }

                // 5. Follow state
                if (user?.id && user.id !== agentId) {
                    const following = await checkIsFollowing(agentId);
                    if (!cancelled) setIsFollowing(following);
                }
            } catch (err) {
                console.error('[AgentProfile] Error loading profile data:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [agentId, user?.id]);

    // ── Follow / Unfollow Toggle ─────────────────────────────────────────
    const handleFollowToggle = useCallback(async () => {
        if (!user?.id || isOwnProfile || followLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowAgent(agentId);
                setIsFollowing(false);
                setFollowersCount((prev) => Math.max(0, prev - 1));
            } else {
                await followAgent(agentId);
                setIsFollowing(true);
                setFollowersCount((prev) => prev + 1);
            }
        } catch (err) {
            console.error('[AgentProfile] Follow toggle error:', err);
        } finally {
            setFollowLoading(false);
        }
    }, [isFollowing, followLoading, agentId, user?.id, isOwnProfile]);

    // ── Share Profile ────────────────────────────────────────────────────
    const handleShare = () => {
        shareProfile(agent);
    };

    // ── "Book a Session" CTA Flow ────────────────────────────────────────
    const handleBookSessionPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (services.length === 1) {
            // Exactly 1 service offered -> Navigate directly to booking screen
            navigation.navigate('Booking', { serviceId: services[0].id });
        } else if (services.length > 1) {
            // Multiple services -> Open direct quick-selector modal or switch to services tab
            setActiveTab('services');
            setServiceSelectModal(true);
        } else {
            // Switch to services tab
            setActiveTab('services');
            scrollViewRef.current?.scrollTo({ y: 360, animated: true });
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <BrandedSpinner size="large" showLabel labelText="Loading specialist..." />
            </View>
        );
    }

    if (!agent) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <MaterialIcons name="person-off" size={56} color={COLORS.textMuted} />
                <Text style={[styles.notFoundTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    Specialist not found
                </Text>
                <Text style={[styles.notFoundSub, { color: COLORS.textMuted }]}>
                    This profile may have been removed or is currently unavailable.
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                    <Text style={styles.goBackTxt}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(agent.full_name, agent.avatar_url);
    const bannerUrl = agent.banner_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200';

    return (
        <View style={[styles.root, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
            <Animated.View style={[{ flex: 1 }, animStyle]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                <FullscreenPortfolioViewer
                    media={portfolioMedia}
                    initialIndex={galleryStartIndex}
                    visible={galleryOpen}
                    onClose={() => setGalleryOpen(false)}
                />

                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 130 }}
                >
                    {/* ── 1. Top Cover Banner ────────────────────────────────────── */}
                    <View style={styles.heroBanner}>
                        <Image
                            source={{ uri: bannerUrl }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                            transition={300}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Top Header Action Buttons */}
                        <View style={[styles.heroNav, { top: insets.top + 10 }]}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.navIconBtn}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="arrow-back" size={22} color="#FFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleShare}
                                style={styles.navIconBtn}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="share" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── 2. Profile Identity Section ────────────────────────────── */}
                    <View style={styles.profileContentWrap}>
                        {/* Avatar row with action buttons */}
                        <View style={styles.avatarRow}>
                            <View
                                style={[
                                    styles.avatarRing,
                                    { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white },
                                    SHADOWS.md,
                                ]}
                            >
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                                {agent.verification_status === 'verified' && (
                                    <View style={styles.verifiedWrap}>
                                        <VerifiedBadge />
                                    </View>
                                )}
                                <View style={styles.onlineWrap}>
                                    <OnlineIndicator lastSeen={agent.last_seen} size={14} />
                                </View>
                            </View>

                            {/* Actions: Follow button + Share Button */}
                            {!isOwnProfile && (
                                <View style={styles.actionBtns}>
                                    <TouchableOpacity
                                        onPress={handleShare}
                                        style={[
                                            styles.shareSmallBtn,
                                            {
                                                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                            },
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialIcons name="share" size={18} color={isDark ? COLORS.white : COLORS.textDark} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleFollowToggle}
                                        disabled={followLoading}
                                        style={[
                                            styles.followBtn,
                                            isFollowing ? styles.followingBtn : styles.notFollowingBtn,
                                            !isFollowing && SHADOWS.pink,
                                        ]}
                                        activeOpacity={0.85}
                                    >
                                        {followLoading ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <>
                                                {isFollowing && (
                                                    <MaterialIcons name="check" size={15} color={COLORS.white} style={{ marginRight: 4 }} />
                                                )}
                                                <Text style={styles.followBtnText}>
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Name & Specialization */}
                        <AnimatedSection delay={100} direction="up" distance={15} style={styles.identity}>
                            <View style={styles.nameHeaderRow}>
                                <Text
                                    style={[
                                        styles.agentName,
                                        { color: isDark ? COLORS.white : COLORS.textDark },
                                    ]}
                                >
                                    {agent.full_name}
                                </Text>
                            </View>

                            <View style={styles.tagsRow}>
                                {agent.specialization && (
                                    <View style={[styles.specializationBadge, { backgroundColor: `${COLORS.primary}18` }]}>
                                        <MaterialIcons name="auto-awesome" size={12} color={COLORS.primary} />
                                        <Text style={styles.specializationBadgeText}>
                                            {agent.specialization}
                                        </Text>
                                    </View>
                                )}

                                {agent.location && (
                                    <View style={styles.locationChip}>
                                        <MaterialIcons name="place" size={13} color={COLORS.textMuted} />
                                        <Text style={[styles.locationChipText, { color: COLORS.textMuted }]}>
                                            {agent.location}
                                        </Text>
                                    </View>
                                )}

                                <View style={[styles.presenceBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                    <View
                                        style={[
                                            styles.presenceDot,
                                            { backgroundColor: isOnline(agent.last_seen) ? COLORS.success : COLORS.textMuted },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.presenceText,
                                            { color: isOnline(agent.last_seen) ? COLORS.success : COLORS.textMuted },
                                        ]}
                                    >
                                        {lastSeenLabel(agent.last_seen)}
                                    </Text>
                                </View>
                            </View>

                            {/* Bio */}
                            {agent.bio ? (
                                <Text
                                    style={[
                                        styles.bioText,
                                        { color: isDark ? '#D1D5DB' : '#4B5563' },
                                    ]}
                                >
                                    {agent.bio}
                                </Text>
                            ) : null}
                        </AnimatedSection>

                        {/* ── 3. Stats Row (Followers, Following, Rating, Services — NO completed sessions count) ── */}
                        <AnimatedSection delay={150} direction="up" distance={20}>
                            <View
                                style={[
                                    styles.statsRow,
                                    {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    },
                                    SHADOWS.sm,
                                ]}
                            >
                                <View style={styles.statBox}>
                                    <Text style={[styles.statNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {followersCount}
                                    </Text>
                                    <Text style={styles.statLabel}>Followers</Text>
                                </View>

                                <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                                <View style={styles.statBox}>
                                    <Text style={[styles.statNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {followingCount}
                                    </Text>
                                    <Text style={styles.statLabel}>Following</Text>
                                </View>

                                <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                                <View style={styles.statBox}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text style={[styles.statNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            {ratingStats.averageRating.toFixed(1)}
                                        </Text>
                                    </View>
                                    <Text style={styles.statLabel}>Rating ({ratingStats.reviewCount})</Text>
                                </View>

                                <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                                <View style={styles.statBox}>
                                    <Text style={[styles.statNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {services.length}
                                    </Text>
                                    <Text style={styles.statLabel}>Services</Text>
                                </View>
                            </View>
                        </AnimatedSection>

                        {/* ── 4. Guest Tabs Bar ──────────────────────────────────── */}
                        <View
                            style={[
                                styles.tabsBar,
                                { borderBottomColor: isDark ? COLORS.borderDark : COLORS.border },
                            ]}
                        >
                            {[
                                { key: 'services', label: 'Services', icon: 'spa' },
                                { key: 'portfolio', label: 'Portfolio', icon: 'grid-view' },
                                { key: 'reviews', label: 'Reviews', icon: 'star' },
                                { key: 'about', label: 'About', icon: 'info-outline' },
                            ].map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <TouchableOpacity
                                        key={tab.key}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setActiveTab(tab.key as GuestTabType);
                                        }}
                                        style={[
                                            styles.tabItem,
                                            isActive && styles.activeTabItem,
                                        ]}
                                    >
                                        <MaterialIcons
                                            name={tab.icon as any}
                                            size={16}
                                            color={isActive ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <Text
                                            style={[
                                                styles.tabLabel,
                                                {
                                                    color: isActive
                                                        ? (isDark ? COLORS.white : COLORS.textDark)
                                                        : COLORS.textMuted,
                                                    fontFamily: isActive ? FONTS.sansBold : FONTS.sansMedium,
                                                },
                                            ]}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* ── 5. Tab Content ─────────────────────────────────────── */}
                        {/* Tab 1: Services */}
                        {activeTab === 'services' && (
                            <View style={styles.tabContentArea}>
                                {services.length === 0 ? (
                                    <View style={styles.emptyTabBox}>
                                        <MaterialIcons name="spa" size={38} color={COLORS.textMuted} />
                                        <Text style={[styles.emptyTabTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            No services listed yet
                                        </Text>
                                        <Text style={[styles.emptyTabSub, { color: COLORS.textMuted }]}>
                                            This beauty specialist hasn't published active services yet.
                                        </Text>
                                    </View>
                                ) : (
                                    services.map((service, idx) => {
                                        const firstImage = Array.isArray(service.image_url) ? service.image_url[0] : service.image_url;
                                        return (
                                            <AnimatedSection key={service.id} delay={idx * 60} direction="up" distance={15}>
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                                                    style={[
                                                        styles.serviceCard,
                                                        {
                                                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                                        },
                                                        SHADOWS.sm,
                                                    ]}
                                                    activeOpacity={0.85}
                                                >
                                                    {firstImage && (
                                                        <Image
                                                            source={{ uri: firstImage }}
                                                            style={styles.serviceThumb}
                                                            contentFit="cover"
                                                            placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                                                            transition={200}
                                                        />
                                                    )}
                                                    <View style={styles.serviceMeta}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={[
                                                                styles.serviceTitle,
                                                                { color: isDark ? COLORS.white : COLORS.textDark },
                                                            ]}
                                                        >
                                                            {service.name}
                                                        </Text>
                                                        <View style={styles.serviceDetailRow}>
                                                            <MaterialIcons name="schedule" size={13} color={COLORS.textMuted} />
                                                            <Text style={styles.serviceDetailTxt}>
                                                                {service.duration_mins} mins
                                                            </Text>
                                                        </View>
                                                        <View style={styles.serviceBottomRow}>
                                                            <Text style={[styles.servicePrice, { color: COLORS.primary }]}>
                                                                ₦{service.price?.toLocaleString()}
                                                            </Text>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    Haptics.selectionAsync();
                                                                    navigation.navigate('Booking', { serviceId: service.id });
                                                                }}
                                                                style={[styles.bookNowBtn, SHADOWS.pink]}
                                                                activeOpacity={0.8}
                                                            >
                                                                <Text style={styles.bookNowBtnTxt}>Book Now</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </AnimatedSection>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* Tab 2: Portfolio / Gallery */}
                        {activeTab === 'portfolio' && (
                            <View style={styles.tabContentArea}>
                                <View style={styles.portfolioGrid}>
                                    {portfolioMedia.length === 0 ? (
                                        <View style={styles.emptyTabBox}>
                                            <MaterialIcons name="photo-library" size={38} color={COLORS.textMuted} />
                                            <Text style={[styles.emptyTabTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                                Portfolio coming soon
                                            </Text>
                                            <Text style={[styles.emptyTabSub, { color: COLORS.textMuted }]}>
                                                Work photos and video showcase will be displayed here.
                                            </Text>
                                        </View>
                                    ) : (
                                        portfolioMedia.map((item, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setGalleryStartIndex(i);
                                                    setGalleryOpen(true);
                                                }}
                                                style={[styles.portfolioTile, { width: (SCREEN_WIDTH - 48) / 3 }]}
                                                activeOpacity={0.88}
                                            >
                                                <Image
                                                    source={{ uri: item.url }}
                                                    style={styles.portfolioImg}
                                                    contentFit="cover"
                                                    placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                                                    transition={200}
                                                />
                                                {item.type === 'video' && (
                                                    <View style={styles.portfolioVideoBadge}>
                                                        <MaterialIcons name="play-arrow" size={18} color="#FFF" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Tab 3: Reviews */}
                        {activeTab === 'reviews' && (
                            <View style={styles.tabContentArea}>
                                <View
                                    style={[
                                        styles.reviewSummaryCard,
                                        {
                                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                        },
                                        SHADOWS.sm,
                                    ]}
                                >
                                    <View style={styles.reviewSummaryScore}>
                                        <Text style={[styles.bigRatingText, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            {ratingStats.averageRating.toFixed(1)}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 2, marginVertical: 3 }}>
                                            {Array.from({ length: 5 }).map((_, idx) => (
                                                <Ionicons key={idx} name="star" size={14} color="#F59E0B" />
                                            ))}
                                        </View>
                                        <Text style={[styles.reviewSummaryCount, { color: COLORS.textMuted }]}>
                                            {ratingStats.reviewCount} client reviews
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Tab 4: About */}
                        {activeTab === 'about' && (
                            <View style={styles.tabContentArea}>
                                <View
                                    style={[
                                        styles.aboutCard,
                                        {
                                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                        },
                                        SHADOWS.sm,
                                    ]}
                                >
                                    <Text style={[styles.aboutSectionHeading, { color: COLORS.primary }]}>
                                        Specialist Bio
                                    </Text>
                                    <Text style={[styles.aboutSectionBody, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                                        {agent.bio || 'Professional beauty artist dedicated to delivering top-tier experiences.'}
                                    </Text>

                                    <View style={[styles.aboutDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                                    <Text style={[styles.aboutSectionHeading, { color: COLORS.primary }]}>
                                        Experience & Verification
                                    </Text>
                                    <View style={styles.aboutMetaRow}>
                                        <MaterialIcons name="workspace-premium" size={18} color={COLORS.primary} />
                                        <Text style={[styles.aboutMetaText, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            {agent.years_exp ? `${agent.years_exp}+ years industry experience` : 'Certified beauty specialist'}
                                        </Text>
                                    </View>
                                    <View style={styles.aboutMetaRow}>
                                        <MaterialIcons name="verified" size={18} color="#3B82F6" />
                                        <Text style={[styles.aboutMetaText, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                            {agent.verification_status === 'verified' ? 'Identity & Credentials Verified' : 'Under verified review'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* ── 6. Bottom Sticky "Book a Session" Action Strip ──────── */}
                <View
                    style={[
                        styles.bottomStickyBar,
                        {
                            paddingBottom: insets.bottom + 12,
                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                            borderTopColor: isDark ? COLORS.borderDark : COLORS.border,
                        },
                        SHADOWS.md,
                    ]}
                >
                    <View style={styles.bottomStickyInner}>
                        <View>
                            <Text style={[styles.bottomStartingFrom, { color: COLORS.textMuted }]}>
                                {services.length} available service{services.length !== 1 ? 's' : ''}
                            </Text>
                            <Text style={[styles.bottomPriceTag, { color: COLORS.primary }]}>
                                {services.length > 0
                                    ? `From ₦${Math.min(...services.map((s) => s.price || 0)).toLocaleString()}`
                                    : 'Available for bookings'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleBookSessionPress}
                            style={[styles.bookSessionBtn, SHADOWS.pink]}
                            activeOpacity={0.88}
                        >
                            <MaterialIcons name="calendar-today" size={17} color="#FFF" />
                            <Text style={styles.bookSessionBtnTxt}>Book a Session</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── 7. Quick Service Selector Modal (Rich Mini Preview Cards) ── */}
                <Modal
                    visible={serviceSelectModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setServiceSelectModal(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setServiceSelectModal(false)}>
                        <View style={styles.modalBackdrop}>
                            <TouchableWithoutFeedback>
                                <View
                                    style={[
                                        styles.modalSheet,
                                        {
                                            backgroundColor: isDark ? '#1C1C1E' : COLORS.white,
                                            paddingBottom: insets.bottom + 20,
                                        },
                                    ]}
                                >
                                    <View style={styles.modalHandle} />
                                    <View style={styles.modalHeaderRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.modalTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                                Select a Service
                                            </Text>
                                            <Text style={[styles.modalSubtitle, { color: COLORS.textMuted }]}>
                                                {services.length} available service{services.length !== 1 ? 's' : ''} by {agent.full_name}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setServiceSelectModal(false)}
                                            style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                                        >
                                            <MaterialIcons name="close" size={20} color={isDark ? '#FFF' : '#374151'} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                                        {services.map((s) => {
                                            const thumb = Array.isArray(s.image_url) ? s.image_url[0] : s.image_url;
                                            return (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        setServiceSelectModal(false);
                                                        navigation.navigate('Booking', { service: s, serviceId: s.id });
                                                    }}
                                                    style={[
                                                        styles.modalServiceCard,
                                                        {
                                                            backgroundColor: isDark ? '#262628' : '#F9FAFB',
                                                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                                        },
                                                        SHADOWS.sm,
                                                    ]}
                                                    activeOpacity={0.85}
                                                >
                                                    {thumb && (
                                                        <Image
                                                            source={{ uri: thumb }}
                                                            style={styles.modalServiceThumb}
                                                            contentFit="cover"
                                                            placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                                                        />
                                                    )}
                                                    <View style={styles.modalServiceInfo}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={[styles.modalServiceName, { color: isDark ? COLORS.white : COLORS.textDark }]}
                                                        >
                                                            {s.name}
                                                        </Text>
                                                        <View style={styles.modalMetaRow}>
                                                            <View style={styles.modalDurationChip}>
                                                                <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                                                <Text style={styles.modalDurationTxt}>
                                                                    {s.duration_mins} mins
                                                                </Text>
                                                            </View>
                                                            {s.category && (
                                                                <Text style={[styles.modalCategoryTxt, { color: COLORS.primary }]}>
                                                                    • {s.category}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <View style={styles.modalCardBottomRow}>
                                                            <Text style={[styles.modalServicePrice, { color: COLORS.primary }]}>
                                                                ₦{s.price?.toLocaleString()}
                                                            </Text>
                                                            <View style={[styles.modalBookNowPill, SHADOWS.pink]}>
                                                                <Text style={styles.modalBookNowTxt}>Book</Text>
                                                                <MaterialIcons name="arrow-forward" size={13} color="#FFF" />
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    notFoundTitle: { fontFamily: FONTS.playfairBold, fontSize: 22, marginTop: 16 },
    notFoundSub: { fontFamily: FONTS.sansRegular, fontSize: 14, textAlign: 'center', marginTop: 8 },
    goBackBtn: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
    goBackTxt: { fontFamily: FONTS.montserratBold, fontSize: 14, color: COLORS.white },

    // Hero Banner
    heroBanner: { height: BANNER_HEIGHT, width: '100%', position: 'relative' },
    heroNav: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    navIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

    // Profile Identity
    profileContentWrap: { paddingHorizontal: 20, marginTop: -50 },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
    avatarRing: { width: 104, height: 104, borderRadius: 52, padding: 3, position: 'relative' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 49 },
    verifiedWrap: { position: 'absolute', bottom: 2, right: 2 },
    onlineWrap: { position: 'absolute', top: 4, right: 4 },

    actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    shareSmallBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full, minWidth: 105 },
    notFollowingBtn: { backgroundColor: COLORS.primary },
    followingBtn: { backgroundColor: '#10B981' },
    followBtnText: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#FFF' },

    identity: { marginBottom: 16 },
    nameHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    agentName: { fontFamily: FONTS.playfairBold, fontSize: 26, letterSpacing: -0.4 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
    specializationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
    specializationBadgeText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary },
    locationChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationChipText: { fontFamily: FONTS.sansRegular, fontSize: 12.5 },
    presenceBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, gap: 5 },
    presenceDot: { width: 6, height: 6, borderRadius: 3 },
    presenceText: { fontFamily: FONTS.sansMedium, fontSize: 11 },
    bioText: { fontFamily: FONTS.sansRegular, fontSize: 13.5, lineHeight: 20, marginTop: 10 },

    // Stats Row
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 20 },
    statBox: { alignItems: 'center', flex: 1 },
    statNumber: { fontFamily: FONTS.montserratBold, fontSize: 17 },
    statLabel: { fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    statDivider: { width: 1, height: 26 },

    // Tabs
    tabsBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 16 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 12, gap: 5 },
    activeTabItem: { borderBottomWidth: 2.5, borderBottomColor: COLORS.primary },
    tabLabel: { fontSize: 13 },

    // Tab Content
    tabContentArea: { minHeight: 200 },
    emptyTabBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyTabTitle: { fontFamily: FONTS.playfairBold, fontSize: 17, marginTop: 10 },
    emptyTabSub: { fontFamily: FONTS.sansRegular, fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },

    // Services Tab Cards
    serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 12 },
    serviceThumb: { width: 84, height: 84, borderRadius: RADIUS.md },
    serviceMeta: { flex: 1, marginLeft: 14 },
    serviceTitle: { fontFamily: FONTS.sansBold, fontSize: 15, marginBottom: 4 },
    serviceDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    serviceDetailTxt: { fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted },
    serviceBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    servicePrice: { fontFamily: FONTS.montserratBold, fontSize: 16 },
    bookNowBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
    bookNowBtnTxt: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#FFF' },

    // Portfolio Grid
    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    portfolioTile: { height: 115, borderRadius: RADIUS.sm, overflow: 'hidden', position: 'relative' },
    portfolioImg: { width: '100%', height: '100%' },
    portfolioVideoBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },

    // Reviews Tab
    reviewSummaryCard: { padding: 20, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
    reviewSummaryScore: { alignItems: 'center' },
    bigRatingText: { fontFamily: FONTS.montserratBold, fontSize: 36 },
    reviewSummaryCount: { fontFamily: FONTS.sansRegular, fontSize: 12, marginTop: 4 },

    // About Tab
    aboutCard: { padding: 18, borderRadius: RADIUS.lg, borderWidth: 1 },
    aboutSectionHeading: { fontFamily: FONTS.montserratBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    aboutSectionBody: { fontFamily: FONTS.sansRegular, fontSize: 13.5, lineHeight: 21 },
    aboutDivider: { height: 1, marginVertical: 14 },
    aboutMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    aboutMetaText: { fontFamily: FONTS.sansMedium, fontSize: 13 },

    // Bottom Sticky Bar
    bottomStickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
    bottomStickyInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bottomStartingFrom: { fontFamily: FONTS.sansRegular, fontSize: 11 },
    bottomPriceTag: { fontFamily: FONTS.montserratBold, fontSize: 15 },
    bookSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: RADIUS.full, gap: 6 },
    bookSessionBtnTxt: { fontFamily: FONTS.sansBold, fontSize: 14, color: '#FFF' },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', alignSelf: 'center', marginBottom: 12 },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontFamily: FONTS.playfairBold, fontSize: 20, marginBottom: 2 },
    modalSubtitle: { fontFamily: FONTS.sansRegular, fontSize: 13 },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    modalServiceCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 10 },
    modalServiceThumb: { width: 70, height: 70, borderRadius: RADIUS.md },
    modalServiceInfo: { flex: 1, marginLeft: 12 },
    modalServiceName: { fontFamily: FONTS.sansBold, fontSize: 14, marginBottom: 3 },
    modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    modalDurationChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    modalDurationTxt: { fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted },
    modalCategoryTxt: { fontFamily: FONTS.sansMedium, fontSize: 11 },
    modalCardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalServicePrice: { fontFamily: FONTS.montserratBold, fontSize: 15 },
    modalBookNowPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, gap: 3 },
    modalBookNowTxt: { fontFamily: FONTS.sansBold, fontSize: 11, color: '#FFF' },
});

export default AgentProfileScreen;
