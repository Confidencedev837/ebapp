// src/screens/ServiceDetailScreen.tsx
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Animated,
    PanResponder,
    StatusBar,
    Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockServices } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import VerifiedBadge from '@/components/VerifiedBadge';
import { getAvatarUrl } from '@/services/avatarUtils';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 500;
const PULL_THRESHOLD = 60; // px to pull before snapping open

type RootStackParamList = { ServiceDetail: { serviceId: string } };
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

/* ─────────────────────────────────────────────
   Full-Screen Gallery Modal
───────────────────────────────────────────── */
const FullscreenGallery = ({
    images,
    initialIndex,
    visible,
    onClose,
}: {
    images: string[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
}) => {
    const insets = useSafeAreaInsets();
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    React.useEffect(() => {
        if (visible) {
            setActiveIdx(initialIndex);
            slideAnim.setValue(SCREEN_HEIGHT);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 22,
                stiffness: 180,
            }).start();
        }
    }, [visible, initialIndex]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(onClose);
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIdx(idx);
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={{ flex: 1, backgroundColor: '#000', transform: [{ translateY: slideAnim }] }}>
                {/* Close + counter */}
                <View style={{
                    position: 'absolute', top: insets.top + 12, left: 16, right: 16,
                    zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <TouchableOpacity onPress={handleClose} style={prominentBtnStyle} activeOpacity={0.8}>
                        <MaterialIcons name="close" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.sansMedium, fontSize: 13 }}>
                            {activeIdx + 1} / {images.length}
                        </Text>
                    </View>
                    <View style={{ width: 48 }} />
                </View>

                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    renderItem={({ item }: { item: string }) => (
                        <View style={{ width, height: SCREEN_HEIGHT, justifyContent: 'center' }}>
                            <Image source={{ uri: item }} style={{ width, height: SCREEN_HEIGHT }} contentFit="contain" />
                        </View>
                    )}
                />

                {/* Dot indicators */}
                {images.length > 1 && (
                    <View style={{ position: 'absolute', bottom: insets.bottom + 32, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
                        {images.map((_, i) => (
                            <View key={i} style={{ height: 4, width: i === activeIdx ? 24 : 6, borderRadius: 2, backgroundColor: i === activeIdx ? 'white' : 'rgba(255,255,255,0.35)' }} />
                        ))}
                    </View>
                )}
            </Animated.View>
        </Modal>
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

    const [activeSlide, setActiveSlide] = useState(0);
    const [isFavourite, setIsFavourite] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    // Pull-to-fullscreen animation values
    const pullAnim = useRef(new Animated.Value(0)).current;          // non-native: drives opacity/scaleX
    const heroScale = useRef(new Animated.Value(1)).current;          // native: transform scale
    const heroTranslateY = useRef(new Animated.Value(0)).current;     // native: transform translateY
    const heroBrightAnim = useRef(new Animated.Value(0)).current;     // non-native: overlay opacity

    const scrollAtTop = useRef(true);
    const isPulling = useRef(false);

    const openGallery = (index: number) => {
        setGalleryStartIndex(index);
        setGalleryOpen(true);
    };

    const snapBack = () => {
        Animated.parallel([
            Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, damping: 20 }),
            Animated.spring(heroTranslateY, { toValue: 0, useNativeDriver: true, damping: 20 }),
        ]).start();
        Animated.parallel([
            Animated.spring(pullAnim, { toValue: 0, useNativeDriver: false, damping: 20 }),
            Animated.spring(heroBrightAnim, { toValue: 0, useNativeDriver: false, damping: 20 }),
        ]).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                scrollAtTop.current && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
            onPanResponderGrant: () => { isPulling.current = true; },
            onPanResponderMove: (_, g) => {
                if (!isPulling.current) return;
                const pull = Math.max(0, Math.min(g.dy, PULL_THRESHOLD * 2.5));
                pullAnim.setValue(pull);                                          // non-native
                heroScale.setValue(1 + (pull / (PULL_THRESHOLD * 2.5)) * 0.055); // native
                heroTranslateY.setValue(pull * 0.18);                             // native
                heroBrightAnim.setValue(pull / (PULL_THRESHOLD * 2.5));           // non-native
            },
            onPanResponderRelease: (_, g) => {
                isPulling.current = false;
                if (g.dy >= PULL_THRESHOLD) {
                    Animated.parallel([
                        Animated.spring(heroScale, { toValue: 1, useNativeDriver: true }),
                        Animated.spring(heroTranslateY, { toValue: 0, useNativeDriver: true }),
                    ]).start();
                    Animated.parallel([
                        Animated.spring(pullAnim, { toValue: 0, useNativeDriver: false }),
                        Animated.spring(heroBrightAnim, { toValue: 0, useNativeDriver: false }),
                    ]).start(() => openGallery(activeSlide));
                } else {
                    snapBack();
                }
            },
            onPanResponderTerminate: snapBack,
        })
    ).current;

    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
        return (
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Service not found</Text>
            </SafeAreaView>
        );
    }
    const agent = service.profiles;

    // Derived animated values — all numeric, native-driver safe
    const pullIndicatorOpacity = pullAnim.interpolate({ inputRange: [0, PULL_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
    // Use scaleX on a fixed-width view instead of animating width (not supported by native driver)
    const pullIndicatorScaleX = pullAnim.interpolate({ inputRange: [0, PULL_THRESHOLD], outputRange: [0.28, 1], extrapolate: 'clamp' });
    const hintLabelOpacity = pullAnim.interpolate({ inputRange: [PULL_THRESHOLD * 0.4, PULL_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} {...panResponder.panHandlers}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FullscreenGallery
                images={service.image_url}
                initialIndex={galleryStartIndex}
                visible={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    scrollAtTop.current = e.nativeEvent.contentOffset.y <= 2;
                }}
                scrollEventThrottle={16}
                bounces={false}
            >
                {/* ─── Hero ─── */}
                {/* Outer: transform only → useNativeDriver safe */}
                <Animated.View style={{ height: HERO_HEIGHT, transform: [{ scale: heroScale }, { translateY: heroTranslateY }] }}>

                    {/* Carousel */}
                    <TouchableOpacity activeOpacity={0.95} onPress={() => openGallery(activeSlide)}>
                        <FlatList
                            data={service.image_url}
                            horizontal pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                                setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))
                            }
                            scrollEventThrottle={16}
                            renderItem={({ item }: { item: string }) => (
                                <Image source={{ uri: item }} style={{ width, height: HERO_HEIGHT }} contentFit="cover" />
                            )}
                        />
                    </TouchableOpacity>

                    {/* Gradient */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.52)', 'transparent', 'transparent', 'rgba(0,0,0,0.84)']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        pointerEvents="none"
                    />

                    {/* Pull brightness wash */}
                    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.1)', opacity: heroBrightAnim }} pointerEvents="none" />

                    {/* Pull indicator pill at very top — scaleX avoids non-native 'width' animation */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 10 }} pointerEvents="none">
                        <Animated.View style={{ height: 4, width: width * 0.55, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)', opacity: pullIndicatorOpacity, transform: [{ scaleX: pullIndicatorScaleX }] }} />
                    </View>

                    {/* "View gallery" hint that fades in mid-pull */}
                    <Animated.View
                        style={{ position: 'absolute', top: insets.top + 64, left: 0, right: 0, alignItems: 'center', opacity: hintLabelOpacity }}
                        pointerEvents="none"
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22 }}>
                            <MaterialIcons name="fullscreen" size={17} color="white" />
                            <Text style={{ color: 'white', fontFamily: FONTS.sansMedium, fontSize: 13 }}>View gallery</Text>
                        </View>
                    </Animated.View>

                    {/* ── Top Nav: Back · Share · Favourite ── */}
                    <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Back */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={prominentBtnStyle} activeOpacity={0.75}>
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        {/* Right cluster */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={prominentBtnStyle} activeOpacity={0.75}>
                                <MaterialIcons name="ios-share" size={22} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[prominentBtnStyle, isFavourite && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                                activeOpacity={0.75}
                                onPress={() => setIsFavourite(v => !v)}
                            >
                                <MaterialIcons name={isFavourite ? 'favorite' : 'favorite-border'} size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Hero bottom info */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 22 }}>
                        {/* Category + Rating */}
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
                            {/* Photo count tappable chip */}
                            <TouchableOpacity
                                onPress={() => openGallery(activeSlide)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 }}
                            >
                                <MaterialIcons name="photo-library" size={14} color="white" />
                                <Text style={{ color: 'white', fontFamily: FONTS.sansMedium, fontSize: 12 }}>
                                    {service.image_url.length} photos
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Slide dots */}
                        {service.image_url.length > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                                {service.image_url.map((_, i) => (
                                    <View key={i} style={{ height: 4, width: i === activeSlide ? 24 : 6, borderRadius: 2, backgroundColor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.4)' }} />
                                ))}
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* ─── Agent Card ─── */}
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
                            <Text style={{ fontSize: 16, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 3 }}>
                                {agent?.full_name}
                            </Text>
                            <Text style={{ fontSize: 12, fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                                {agent?.specialization} · {agent?.location}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? COLORS.bgDark : COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: isDark ? COLORS.borderDark : COLORS.border, marginHorizontal: 20, marginTop: 16, marginBottom: 8 }} />

                {/* ─── The Experience ─── */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 }}>
                    <Text style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontFamily: FONTS.montserratBold, color: COLORS.primary, marginBottom: 14 }}>
                        The Experience
                    </Text>
                    <Text style={{ fontSize: 15, lineHeight: 26, fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textDark }}>
                        {service.description}
                    </Text>
                </View>

                {/* ─── Key Benefits ─── */}
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="auto-awesome" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>Key Benefits</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {service.features.map((feature, idx) => (
                            <View key={idx} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: isDark ? COLORS.white : COLORS.textDark }}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ─── What to Expect ─── */}
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

                {/* ─── Location ─── */}
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

            {/* ─── Sticky Footer ─── */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 18, paddingBottom: insets.bottom + 16, borderTopWidth: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontFamily: FONTS.sansMedium, color: COLORS.textMuted, letterSpacing: 0.5 }}>Total Price</Text>
                        <Text style={{ fontSize: 26, fontFamily: FONTS.montserratBold, color: COLORS.primary, lineHeight: 30 }}>
                            ₦{service.price.toLocaleString()}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Booking', { service })}
                        activeOpacity={0.85}
                        style={[{ paddingHorizontal: 36, paddingVertical: 17, borderRadius: RADIUS.full, backgroundColor: COLORS.primary }, SHADOWS.pink]}
                    >
                        <Text style={{ color: 'white', fontSize: 15, fontFamily: FONTS.montserratBold, letterSpacing: 0.3 }}>Book Appointment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

/* ─── Shared prominent button style ─── */
const prominentBtnStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.44)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
};

export default ServiceDetailScreen;