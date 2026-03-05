// src/screens/ServiceDetailScreen.tsx
import React, { useRef, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Dimensions,
    FlatList, NativeSyntheticEvent, NativeScrollEvent,
    Animated, PanResponder, StatusBar, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockServices, mockReviews } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import VerifiedBadge from '@/components/VerifiedBadge';
import { getAvatarUrl } from '@/services/avatarUtils';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 500;

type RootStackParamList = { ServiceDetail: { serviceId: string } };
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

/* ─────────────────────────────────────────────
   Fullscreen Gallery — tap to open, swipe down to close
───────────────────────────────────────────── */
const FullscreenGallery = ({
    images, initialIndex, visible, onClose,
}: { images: string[]; initialIndex: number; visible: boolean; onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const dragY = useRef(new Animated.Value(0)).current;

    const bgOpacity = dragY.interpolate({
        inputRange: [0, SCREEN_HEIGHT * 0.45],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    React.useEffect(() => {
        if (visible) {
            setActiveIdx(initialIndex);
            dragY.setValue(0);
            slideY.setValue(SCREEN_HEIGHT);
            Animated.spring(slideY, {
                toValue: 0, useNativeDriver: true, damping: 26, stiffness: 220,
            }).start();
        }
    }, [visible, initialIndex]);

    const closeGallery = () => {
        Animated.timing(slideY, {
            toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true,
        }).start(onClose);
    };

    const swipePan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
        onPanResponderRelease: (_, g) => {
            if (g.dy > 100 || g.vy > 1.0) {
                closeGallery();
            } else {
                Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
            }
        },
    })).current;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View
                style={{
                    flex: 1, backgroundColor: '#000',
                    opacity: bgOpacity,
                    transform: [{ translateY: slideY }, { translateY: dragY }],
                }}
                {...swipePan.panHandlers}
            >
                {/* Dismiss pill */}
                <View style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0, alignItems: 'center', zIndex: 20 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                </View>

                {/* Top bar */}
                <View style={{ position: 'absolute', top: insets.top + 14, left: 16, right: 16, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity onPress={closeGallery} style={NAV_BTN} activeOpacity={0.8}>
                        <MaterialIcons name="close" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONTS.sansMedium, fontSize: 13 }}>
                            {activeIdx + 1} / {images.length}
                        </Text>
                    </View>
                    <View style={{ width: 48 }} />
                </View>

                <FlatList
                    data={images} horizontal pagingEnabled
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                        setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
                    scrollEventThrottle={16}
                    renderItem={({ item }: { item: string }) => (
                        <View style={{ width, height: SCREEN_HEIGHT, justifyContent: 'center' }}>
                            <Image source={{ uri: item }} style={{ width, height: SCREEN_HEIGHT }} contentFit="contain" />
                        </View>
                    )}
                />

                {images.length > 1 && (
                    <View style={{ position: 'absolute', bottom: insets.bottom + 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
                        {images.map((_, i) => (
                            <View key={i} style={{ height: 4, borderRadius: 2, width: i === activeIdx ? 24 : 6, backgroundColor: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.35)' }} />
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

    const service = mockServices.find(s => s.id === serviceId);

    if (!service) {
        return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Service not found</Text></View>;
    }

    const agent = service.profiles;

    const openGallery = (index: number) => {
        setGalleryStartIndex(index);
        setGalleryOpen(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FullscreenGallery
                images={service.image_url}
                initialIndex={galleryStartIndex}
                visible={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* ── HERO ── */}
                <View style={{ height: HERO_HEIGHT }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => openGallery(activeSlide)}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <FlatList
                            data={service.image_url}
                            horizontal pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                                setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
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

                    {/* Nav buttons */}
                    <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={NAV_BTN} activeOpacity={0.75}>
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={NAV_BTN} activeOpacity={0.75}>
                                <MaterialIcons name="share" size={22} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[NAV_BTN, isFavourite && { backgroundColor: COLORS.primary, borderColor: `${COLORS.primary}88` }]}
                                activeOpacity={0.75}
                                onPress={() => setIsFavourite(v => !v)}
                            >
                                <MaterialIcons name={isFavourite ? 'favorite' : 'favorite-border'} size={22} color="white" />
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
                                    {service.image_url.length} photos
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {service.image_url.length > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                                {service.image_url.map((_, i) => (
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
                    const reviews = mockReviews.filter(r => r.service_id === service.id);
                    if (reviews.length === 0) return null;
                    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
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
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, marginTop: 4 }}>{reviews.length} review{reviews.length > 1 ? 's' : ''}</Text>
                                </View>
                                <View style={{ width: 1, height: 60, backgroundColor: isDark ? COLORS.borderDark : COLORS.border }} />
                                <View style={{ flex: 1, gap: 5 }}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = reviews.filter(r => r.rating === star).length;
                                        const pct = reviews.length > 0 ? count / reviews.length : 0;
                                        return (
                                            <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, width: 8 }}>{star}</Text>
                                                <MaterialIcons name="star" size={10} color={COLORS.gold} />
                                                <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                                    <View style={{ width: `${pct * 100}%`, height: 4, borderRadius: 2, backgroundColor: COLORS.gold }} />
                                                </View>
                                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 10, color: isDark ? COLORS.textMutedDark : COLORS.textMuted, width: 14 }}>{count}</Text>
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
                                                    <MaterialIcons key={s} name={s <= review.rating ? 'star' : 'star-border'} size={12} color={COLORS.gold} />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                                            {new Date(review.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
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