// src/screens/ServiceDetailScreen.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import {
    View, Text, ScrollView, TouchableOpacity, Dimensions,
    FlatList, NativeSyntheticEvent, NativeScrollEvent,
    Animated, PanResponder, StatusBar, Modal,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import VerifiedBadge from '@/components/VerifiedBadge';
import Snackbar from '@/components/Snackbar';
import { getAvatarUrl } from '@/services/avatarUtils';
import { useService } from '@/hooks/useServices';
import { useReviews, useServiceRating } from '@/hooks/useReviews';
import { useFavorite } from '@/hooks/useFavorite';
import { useShare } from '@/hooks/useShare';
import { useLike } from '@/hooks/useLike';
import * as Haptics from 'expo-haptics';
import BrandedSpinner from '@/components/BrandedSpinner';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 500;

type RootStackParamList = { ServiceDetail: { serviceId: string } };
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

/* ─────────────────────────────────────────────
   Media helpers — image vs video detection
───────────────────────────────────────────── */
type MediaItem = { url: string; type: 'image' | 'video' };

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m3u8)(\?.*)?$/i.test(url);

const normalizeMedia = (urls: string[]): MediaItem[] =>
    (urls || []).map((url) => ({ url, type: isVideoUrl(url) ? 'video' : 'image' }));

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
        <View style={{ width, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <Video
                ref={onRef}
                source={{ uri }}
                style={{ width, height: SCREEN_HEIGHT }}
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
   Fullscreen Gallery — tap to open, swipe down OR
   Android back button to close
───────────────────────────────────────────── */
const FullscreenGallery = ({
    media, initialIndex, visible, onClose,
}: { media: MediaItem[]; initialIndex: number; visible: boolean; onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const videoRefs = useRef<Record<number, Video | null>>({});

    React.useEffect(() => {
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

    const closeGallery = () => {
        Object.values(videoRefs.current).forEach((ref) => ref?.pauseAsync());
        onClose();
    };

    const imageUrls = media.map(m => ({ url: m.url, props: { type: m.type } }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={closeGallery}
        >
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <ImageViewer
                    imageUrls={imageUrls}
                    index={initialIndex}
                    onChange={(index) => setActiveIdx(index || 0)}
                    enableSwipeDown={true}
                    onSwipeDown={closeGallery}
                    swipeDownThreshold={100}
                    saveToLocalByLongPress={false}
                    renderHeader={(currentIndex) => (
                        <View style={{ position: 'absolute', top: insets.top + 14, left: 16, right: 16, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={closeGallery} style={NAV_BTN} activeOpacity={0.8}>
                                <MaterialIcons name="close" size={22} color="white" />
                            </TouchableOpacity>
                            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONTS.sansMedium, fontSize: 13 }}>
                                    {(currentIndex || 0) + 1} / {media.length}
                                </Text>
                            </View>
                            <View style={{ width: 48 }} />
                        </View>
                    )}
                    renderIndicator={() => <View />}
                    renderImage={(props) => {
                        const { source } = props as any;
                        const itemProps = imageUrls.find(i => i.url === source.uri)?.props as any;
                        if (itemProps?.type === 'video') {
                            const index = imageUrls.findIndex(i => i.url === source.uri);
                            return (
                                <FullscreenVideoSlide
                                    uri={source.uri}
                                    shouldPlay={index === activeIdx}
                                    onRef={(r) => { videoRefs.current[index] = r; }}
                                />
                            );
                        }
                        return <Image source={{ uri: source.uri }} style={{ width, height: SCREEN_HEIGHT }} contentFit="contain" />;
                    }}
                />
            </View>
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   Hero Video Item with Audio & Fullscreen
───────────────────────────────────────────── */
const HeroVideoItem = ({ url, isCurrent, onOpenFullscreen }: { url: string; isCurrent: boolean; onOpenFullscreen: () => void }) => {
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (!isCurrent) {
            videoRef.current?.pauseAsync();
            setIsPlaying(false);
        } else {
            videoRef.current?.playAsync();
            setIsPlaying(true);
        }
    }, [isCurrent]);

    const togglePlay = (e: any) => {
        e?.stopPropagation?.();
        Haptics.selectionAsync();
        if (isPlaying) {
            videoRef.current?.pauseAsync();
            setIsPlaying(false);
        } else {
            videoRef.current?.playAsync();
            setIsPlaying(true);
        }
    };

    const toggleMute = (e: any) => {
        e?.stopPropagation?.();
        Haptics.selectionAsync();
        setIsMuted((prev) => !prev);
    };

    return (
        <View style={{ width, height: HERO_HEIGHT, position: 'relative' }}>
            <Video
                ref={videoRef}
                source={{ uri: url }}
                style={{ width, height: HERO_HEIGHT }}
                resizeMode={ResizeMode.COVER}
                isMuted={isMuted}
                shouldPlay={isCurrent}
                isLooping
            />

            {/* Top Right Video Audio & Fullscreen Buttons */}
            <View style={{ position: 'absolute', top: 88, right: 16, flexDirection: 'column', gap: 10, zIndex: 10 }}>
                <TouchableOpacity
                    onPress={toggleMute}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.25)',
                    }}
                    activeOpacity={0.8}
                >
                    <MaterialIcons
                        name={isMuted ? 'volume-off' : 'volume-up'}
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        onOpenFullscreen();
                    }}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.25)',
                    }}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="fullscreen" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {/* Play/Pause center overlay button */}
            <TouchableOpacity
                onPress={togglePlay}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: -26,
                    marginLeft: -26,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.3)',
                    opacity: isPlaying ? 0.3 : 1,
                    zIndex: 5,
                }}
                activeOpacity={0.8}
            >
                <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={30}
                    color="white"
                />
            </TouchableOpacity>

            {/* Video Preview Tag */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 124,
                    left: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                }}
            >
                <MaterialIcons name="videocam" size={13} color={COLORS.primary} />
                <Text style={{ color: 'white', fontFamily: FONTS.montserratBold, fontSize: 9.5, letterSpacing: 1.2 }}>
                    VIDEO PREVIEW
                </Text>
            </View>
        </View>
    );
};

/* ─────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────── */
const ServiceDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<ServiceDetailRouteProp>();
    const { serviceId } = route.params;
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const { service, loading: serviceLoading, error: serviceError } = useService(serviceId);
    const { reviews, loading: reviewsLoading, error: reviewsError } = useReviews(serviceId);
    const { stats: ratingStats } = useServiceRating(serviceId);
    const { animStyle } = useScreenAnimation();

    const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

    React.useEffect(() => {
        if (serviceError) {
            setSnackbar({ visible: true, message: serviceError, type: 'error' });
        }
    }, [serviceError]);

    const [activeSlide, setActiveSlide] = useState(0);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    // ── Real Supabase-backed interactions ────────────────────────────────────
    const { isFavorited, toggleFavorite } = useFavorite(serviceId);
    const { share, isSharing } = useShare(service);
    const { isLiked, likeCount, toggleLike } = useLike(serviceId);

    const media = useMemo(
        () => normalizeMedia(service?.image_url ?? []),
        [service?.image_url]
    );

    const openGallery = (index: number) => {
        setGalleryStartIndex(index);
        setGalleryOpen(true);
    };

    if (serviceLoading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
                <BrandedSpinner size="large" showLabel labelText="Loading service..." />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
                <MaterialIcons name="warning" size={32} color={COLORS.primary} />
                <Text style={{ marginTop: 12, color: isDark ? COLORS.white : COLORS.textDark }}>Service not found</Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.full }}
                >
                    <Text style={{ color: 'white', fontFamily: FONTS.sansBold }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const agent = service.profiles;

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FullscreenGallery
                media={media}
                initialIndex={galleryStartIndex}
                visible={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* ── HERO ── */}
                <View style={{ height: HERO_HEIGHT }}>
                    <FlatList
                        data={media}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => i.toString()}
                        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                            setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))
                        }
                        scrollEventThrottle={16}
                        renderItem={({ item, index }: { item: MediaItem; index: number }) => (
                            item.type === 'video' ? (
                                <HeroVideoItem
                                    url={item.url}
                                    isCurrent={index === activeSlide}
                                    onOpenFullscreen={() => openGallery(index)}
                                />
                            ) : (
                                <TouchableOpacity
                                    activeOpacity={0.95}
                                    onPress={() => openGallery(index)}
                                >
                                    <Image
                                        source={{ uri: item.url }}
                                        style={{ width, height: HERO_HEIGHT }}
                                        contentFit="cover"
                                        placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                                        transition={400}
                                    />
                                </TouchableOpacity>
                            )
                        )}
                    />

                    {/* Gradient */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.52)', 'transparent', 'transparent', 'rgba(0,0,0,0.84)']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        pointerEvents="none"
                    />

                    {/* Nav buttons */}
                    <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={NAV_BTN} activeOpacity={0.75}>
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[NAV_BTN, { opacity: isSharing ? 0.5 : 1 }]}
                                activeOpacity={0.75}
                                onPress={share}
                                disabled={isSharing}
                            >
                                <MaterialIcons name="share" size={22} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[NAV_BTN, isFavorited && { backgroundColor: COLORS.primary, borderColor: `${COLORS.primary}88` }]}
                                activeOpacity={0.75}
                                onPress={toggleFavorite}
                            >
                                <MaterialIcons name={isFavorited ? 'bookmark' : 'bookmark-border'} size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Hero info */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 22 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.primary }}>
                                <Text style={{ color: 'white', fontSize: 10, fontFamily: FONTS.montserratBold, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                    {service.category}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 }}>
                                <MaterialIcons name="star" size={13} color={COLORS.gold} />
                                <Text style={{ color: 'white', fontSize: 12, fontFamily: FONTS.sansBold }}>4.9</Text>
                            </View>
                        </View>

                        <Text style={{ color: 'white', fontSize: 30, fontFamily: FONTS.playfairBold, lineHeight: 38, marginBottom: 10 }}>
                            {service.name}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONTS.sansMedium }}>
                                    {service.duration_mins} min session
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => openGallery(activeSlide)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 }}
                            >
                                <MaterialIcons name="photo-library" size={14} color="white" />
                                <Text style={{ color: 'white', fontFamily: FONTS.sansMedium, fontSize: 12 }}>
                                    {media.length} {media.length === 1 ? 'item' : 'items'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {media.length > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                                {media.map((_, i) => (
                                    <View key={i} style={{ height: 4, width: i === activeSlide ? 24 : 6, borderRadius: 2, backgroundColor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.4)' }} />
                                ))}
                            </View>
                        )}
                    </View>
                </View>
                {/* ── end hero ── */}

                {/* Agent Card */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('AgentProfile', { agentId: service.agent_id })}
                    activeOpacity={0.85}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 8, padding: 16, borderRadius: 20, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderWidth: 1, borderColor: isDark ? COLORS.borderDark : COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 10, elevation: 4 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ position: 'relative' }}>
                            <View style={{ padding: 2.5, backgroundColor: COLORS.roseMid, borderRadius: RADIUS.full }}>
                                <Image source={{ uri: getAvatarUrl(agent?.full_name, agent?.avatar_url) }} style={{ width: 56, height: 56, borderRadius: RADIUS.full }} />
                            </View>
                            <View style={{ position: 'absolute', bottom: 0, right: 0 }}><VerifiedBadge /></View>
                        </View>
                        <View style={{ marginLeft: 14, flex: 1 }}>
                            <Text style={{ fontSize: 16, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 3 }}>{agent?.full_name}</Text>
                            <Text style={{ fontSize: 12, fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>{agent?.specialization} · {agent?.location}</Text>
                        </View>
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? COLORS.bgDark : COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: isDark ? COLORS.borderDark : COLORS.border, marginHorizontal: 20, marginTop: 16, marginBottom: 8 }} />

                {/* Like strip — engagement row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 20 }}>
                    <TouchableOpacity
                        onPress={toggleLike}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                        <MaterialIcons
                            name={isLiked ? 'favorite' : 'favorite-border'}
                            size={22}
                            color={isLiked ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark)}
                        />
                        {likeCount > 0 && (
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: isDark ? COLORS.white : COLORS.textDark }}>
                                {likeCount}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={share}
                        disabled={isSharing}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: isSharing ? 0.5 : 1 }}
                    >
                        <MaterialIcons
                            name="share"
                            size={22}
                            color={isDark ? COLORS.white : COLORS.textDark}
                        />
                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 13, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                            Share
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* The Experience */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 }}>
                    <Text style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontFamily: FONTS.montserratBold, color: COLORS.primary, marginBottom: 14 }}>
                        The Experience
                    </Text>
                    <Text style={{ fontSize: 15, lineHeight: 26, fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textDark }}>
                        {service.description}
                    </Text>
                </View>

                {/* Key Benefits */}
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="auto-awesome" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>Key Benefits</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {service.features.map((feature, idx) => (
                            <View key={idx} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1, backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)', borderColor: isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.35)' }}>
                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: isDark ? '#4ade80' : '#16a34a' }}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* What to Expect */}
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="content-cut" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>What to Expect</Text>
                    </View>
                    <Text style={{ fontSize: 14, lineHeight: 24, fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                        Your session begins with a professional consultation to understand your unique needs. We only use premium, dermatologically tested products for all our procedures to ensure maximum safety and glamour.
                    </Text>
                </View>

                {/* Customer Reviews */}
                {(() => {
                    if (reviewsLoading) {
                        return (
                            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, alignItems: 'center' }}>
                                <BrandedSpinner size="small" showLabel labelText="Loading reviews..." />
                            </View>
                        );
                    }

                    if (!reviews || reviews.length === 0) return null;

                    const avg = ratingStats.averageRating;
                    const count = reviews.length;

                    return (
                        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="star" size={18} color={COLORS.primary} />
                                </View>
                                <Text style={{ fontSize: 18, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>Customer Reviews</Text>
                            </View>

                            {/* Rating summary bar */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, padding: 16, borderRadius: RADIUS.lg, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderWidth: 1, borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontFamily: FONTS.montserratExtraBold, fontSize: 40, color: COLORS.primary, lineHeight: 44 }}>{avg.toFixed(1)}</Text>
                                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <MaterialIcons key={s} name={s <= Math.round(avg) ? 'star' : 'star-border'} size={13} color={COLORS.gold} />
                                        ))}
                                    </View>
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, marginTop: 4 }}>{count} review{count > 1 ? 's' : ''}</Text>
                                </View>
                                <View style={{ width: 1, height: 60, backgroundColor: isDark ? COLORS.borderDark : COLORS.border }} />
                                <View style={{ flex: 1, gap: 5 }}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const cnt = reviews.filter(r => r.rating === star).length;
                                        const pct = count > 0 ? cnt / count : 0;
                                        return (
                                            <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, width: 8 }}>{star}</Text>
                                                <MaterialIcons name="star" size={10} color={COLORS.gold} />
                                                <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                                    <View style={{ width: `${pct * 100}%`, height: 4, borderRadius: 2, backgroundColor: COLORS.gold }} />
                                                </View>
                                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 10, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, width: 14 }}>{cnt}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Individual review cards */}
                            {reviews.map((review, idx) => (
                                <View key={review.id} style={{ marginBottom: idx < reviews.length - 1 ? 14 : 0, padding: 16, borderRadius: RADIUS.lg, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderWidth: 1, borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ padding: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.blush }}>
                                            <Image
                                                source={{ uri: review.reviewer_avatar ?? getAvatarUrl(review.reviewer_name) }}
                                                style={{ width: 38, height: 38, borderRadius: RADIUS.full }}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 14, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 2 }}>
                                                {review.reviewer_name ?? 'Anonymous'}
                                            </Text>
                                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <MaterialIcons key={s} name={s <= (review.rating || 0) ? 'star' : 'star-border'} size={12} color={COLORS.gold} />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                                            {new Date(review.created_at || '').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 13, color: isDark ? COLORS.textMutedDark : COLORS.textDark, lineHeight: 21 }}>
                                        {review.comment}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    );
                })()}

                {/* Location */}
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 130 }}>
                    <Text style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 14 }}>
                        Location
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, gap: 14 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="place" size={22} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontFamily: FONTS.sansBold, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 4 }}>{agent?.location}</Text>
                            <Text style={{ fontSize: 12, fontFamily: FONTS.sansRegular, color: COLORS.textMuted, lineHeight: 18 }}>
                                Accurate address provided after booking confirmation
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 18, paddingBottom: insets.bottom + 16, borderTopWidth: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View className='py-4 mr-3' style={{ gap: 2 }}>
                        <Text style={{ fontSize: 11, fontFamily: FONTS.sansMedium, color: COLORS.textMuted, letterSpacing: 0.5 }}>Total Price</Text>
                        <Text style={{ fontSize: 26, fontFamily: FONTS.montserratBold, color: COLORS.primary, lineHeight: 30 }}>
                            ₦{service.price.toLocaleString()}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Booking', { service })}
                        activeOpacity={0.85}
                        style={[{ paddingHorizontal: 17, paddingVertical: 17, borderRadius: RADIUS.full, backgroundColor: COLORS.primary }, SHADOWS.pink]}
                    >
                        <Text style={{ color: 'white', fontSize: 15, fontFamily: FONTS.montserratBold, letterSpacing: 0.3 }}>Book Appointment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
        </View>
    );
};

const NAV_BTN = {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.44)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
};

export default ServiceDetailScreen;