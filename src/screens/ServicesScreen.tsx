// src/screens/ServicesScreen.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Pressable,
    TextInput,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import Snackbar from '@/components/Snackbar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Service } from '@/types';
import { useServices, useSearchServices } from '@/hooks/useServices';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/services/supabase';
import { getAvatarUrl } from '@/services/avatarUtils';
import BrandedSpinner from '@/components/BrandedSpinner';
import { CATEGORY_META } from '@/constants/categories';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const TILE_GAP = 12;
const TILE_WIDTH = (width - 48 - TILE_GAP) / 2;
const RECENT_SEARCHES_KEY = '@eb_recent_searches';

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'rating';

// CATEGORY_META is now imported from @/constants/categories as CATEGORY_META
// Do not define categories locally — always import from the single source of truth.

// ── Featured Agents Hook ───────────────────────────────────────────────────────
const useFeaturedAgents = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('profiles')
            .select('id, full_name, avatar_url, specialization, location, verification_status')
            .eq('user_type', 'agent')
            .limit(12)
            .then(({ data }) => {
                setAgents(data || []);
                setLoading(false);
            });
    }, []);

    return { agents, loading };
};

// ── Category Tile ──────────────────────────────────────────────────────────────
const CategoryTile = React.memo(({
    cat,
    count,
    onPress,
    entranceDelay,
    focusKey = 0,
}: {
    cat: typeof CATEGORY_META[0];
    count: number;
    onPress: () => void;
    entranceDelay: number;
    focusKey?: number;
}) => {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        scaleAnim.setValue(0.85);
        opacityAnim.setValue(0);
        translateY.setValue(24);

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: entranceDelay,
                useNativeDriver: true,
                friction: 6,
                tension: 90,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                delay: entranceDelay,
                duration: 280,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: entranceDelay,
                useNativeDriver: true,
                friction: 7,
                tension: 80,
            }),
        ]).start();
    }, [focusKey]);

    const handlePressIn = () => {
        Animated.spring(pressScale, {
            toValue: 0.93,
            useNativeDriver: true,
            friction: 5,
            tension: 140,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 3,
            tension: 80,
        }).start();
    };

    return (
        <Animated.View
            style={{
                opacity: opacityAnim,
                transform: [
                    { scale: Animated.multiply(scaleAnim, pressScale) },
                    { translateY },
                ],
                width: TILE_WIDTH,
                marginBottom: TILE_GAP,
            }}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{ borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.md }}
            >
                <LinearGradient
                    colors={cat.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 134, justifyContent: 'flex-end', padding: 14 }}
                >
                    {/* Ghost icon for texture */}
                    <View style={{ position: 'absolute', top: 12, right: 12, opacity: 0.22 }}>
                        <MaterialCommunityIcons name={cat.icon as any} size={52} color="white" />
                    </View>

                    {/* Service count badge */}
                    {count > 0 && (
                        <View style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            backgroundColor: 'rgba(255,255,255,0.28)',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: RADIUS.full,
                        }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 10, color: 'white' }}>
                                {count}
                            </Text>
                        </View>
                    )}

                    {/* Bottom content */}
                    <MaterialCommunityIcons name={cat.icon as any} size={24} color="white" style={{ marginBottom: 5 }} />
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 14, color: 'white', letterSpacing: 0.2 }}>
                        {cat.label}
                    </Text>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
});

// ── Featured Agent Card ────────────────────────────────────────────────────────
const AgentCard = React.memo(({ agent, delay }: { agent: any; delay: number }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const entranceAnim = useRef(new Animated.Value(0)).current;
    const entranceX = useRef(new Animated.Value(35)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(entranceAnim, { toValue: 1, delay, useNativeDriver: true, friction: 7, tension: 70 }),
            Animated.spring(entranceX, { toValue: 0, delay, useNativeDriver: true, friction: 7, tension: 70 }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: entranceAnim, transform: [{ translateX: entranceX }, { scale: pressScale }] }}>
            <Pressable
                onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                onPressIn={() => Animated.spring(pressScale, { toValue: 0.93, useNativeDriver: true, friction: 5, tension: 140 }).start()}
                onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 3, tension: 80 }).start()}
                style={{ width: 90, marginRight: 16, alignItems: 'center' }}
            >
                <View style={{ position: 'relative', marginBottom: 7 }}>
                    <View style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        borderWidth: 2.5,
                        borderColor: COLORS.roseMid,
                        padding: 2,
                    }}>
                        <Image
                            source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }}
                            style={{ width: 62, height: 62, borderRadius: 31 }}
                            contentFit="cover"
                            placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                        />
                    </View>
                    {agent.verification_status === 'verified' && (
                        <View style={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            backgroundColor: COLORS.primary,
                            borderRadius: 10,
                            width: 19,
                            height: 19,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: isDark ? COLORS.bgDark : COLORS.background,
                        }}>
                            <MaterialIcons name="check" size={11} color="white" />
                        </View>
                    )}
                </View>
                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: isDark ? COLORS.white : COLORS.textDark, textAlign: 'center' }} numberOfLines={1}>
                    {agent.full_name?.split(' ')[0] || 'Agent'}
                </Text>
                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 1 }} numberOfLines={1}>
                    {agent.specialization || 'Beauty Pro'}
                </Text>
            </Pressable>
        </Animated.View>
    );
});

// ── Service List Card ──────────────────────────────────────────────────────────
const ServiceListCard = React.memo(({ service, index, focusKey = 0 }: { service: Service; index: number; focusKey?: number }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const entranceAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(26)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        entranceAnim.setValue(0);
        translateY.setValue(26);

        Animated.parallel([
            Animated.timing(entranceAnim, {
                toValue: 1,
                duration: 280,
                delay: Math.min(index * 55, 380),
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: Math.min(index * 55, 380),
                useNativeDriver: true,
                friction: 8,
                tension: 80,
            }),
        ]).start();
    }, [focusKey, index]);

    const firstImage = Array.isArray(service.image_url) ? service.image_url[0] : service.image_url;
    const catInfo = CATEGORY_META.find(c => c.key === service.category);

    return (
        <Animated.View style={{
            opacity: entranceAnim,
            transform: [{ translateY }, { scale: pressScale }],
            marginHorizontal: 24,
            marginBottom: 12,
        }}>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('ServiceDetail', { serviceId: service.id });
                }}
                onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, friction: 6, tension: 130 }).start()}
                onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 3, tension: 70 }).start()}
                style={{
                    flexDirection: 'row',
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    overflow: 'hidden',
                    ...SHADOWS.sm,
                }}
            >
                {/* Thumbnail */}
                <View style={{ position: 'relative' }}>
                    <Image
                        source={{ uri: firstImage }}
                        style={{ width: 105, height: 105 }}
                        contentFit="cover"
                        placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                        transition={400}
                    />
                    {/* Category color bar */}
                    {catInfo && (
                        <LinearGradient
                            colors={[catInfo.colors[0] + 'CC', catInfo.colors[1] + '00']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32 }}
                        />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            {service.profiles?.verification_status === 'verified' && (
                                <MaterialIcons name="verified" size={11} color={COLORS.primary} />
                            )}
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted, flex: 1 }} numberOfLines={1}>
                                {service.profiles?.full_name}
                            </Text>
                        </View>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 14, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 4 }} numberOfLines={2}>
                            {service.name}
                        </Text>
                        {service.duration_mins && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="schedule" size={11} color={COLORS.textMuted} />
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                                    {service.duration_mins} min
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.primary }}>
                            {'\u20A6'}{service.price.toLocaleString()}
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: isDark ? COLORS.bgDark : COLORS.blush,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: RADIUS.full,
                        }}>
                            <MaterialIcons name="star" size={11} color={COLORS.gold} />
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 11, color: isDark ? COLORS.white : COLORS.textDark }}>
                                {((service as any).rating ?? 4.8).toFixed(1)}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
});

// ── Main Screen ────────────────────────────────────────────────────────────────
const ServicesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // ── State ─────────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [showGrid, setShowGrid] = useState(true);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showRecents, setShowRecents] = useState(false);
    const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    const searchInputRef = useRef<TextInput>(null);

    // ── Animation values ──────────────────────────────────────────────────────
    const headerAnim = useRef(new Animated.Value(0)).current;
    const gridOpacity = useRef(new Animated.Value(1)).current;
    const chipEntranceAnim = useRef(new Animated.Value(0)).current;
    const chipTranslateY = useRef(new Animated.Value(-14)).current;
    const searchFocusAnim = useRef(new Animated.Value(0)).current;
    const filterChipsEntrance = useRef(new Animated.Value(0)).current;
    const filterChipsTranslate = useRef(new Animated.Value(10)).current;

    // ── API hooks ─────────────────────────────────────────────────────────────
    const { services, loading, loadingMore, hasMore, loadMore, error: servicesError } = useServices({
        category: activeCategory === 'All' ? undefined : activeCategory,
    });
    const { results: searchResults, search } = useSearchServices();
    const { agents } = useFeaturedAgents();

    const [focusCount, setFocusCount] = useState(0);

    // ── Animate every time the user navigates / focuses this screen ──────────
    useFocusEffect(
        useCallback(() => {
            headerAnim.setValue(0);
            Animated.spring(headerAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,
                tension: 65,
            }).start();

            setFocusCount((c) => c + 1);
        }, [])
    );

    useEffect(() => {
        if (servicesError) setSnackbar({ visible: true, message: servicesError, type: 'error' });
    }, [servicesError]);

    useEffect(() => {
        AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((data) => {
            if (data) setRecentSearches(JSON.parse(data));
        });
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) search(searchQuery);
    }, [searchQuery, search]);

    const saveSearch = useCallback(async (q: string) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 6);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    // ── Category press: grid collapses, chip slides in ────────────────────────
    const handleCategoryPress = useCallback((key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        filterChipsEntrance.setValue(0);
        filterChipsTranslate.setValue(10);

        Animated.timing(gridOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            LayoutAnimation.configureNext({
                duration: 340,
                update: { type: 'spring', springDamping: 0.82 },
                delete: { type: 'easeOut', property: 'opacity', duration: 200 },
            });
            setShowGrid(false);
            setActiveCategory(key);
            chipTranslateY.setValue(-14);
            chipEntranceAnim.setValue(0);

            Animated.parallel([
                Animated.spring(chipEntranceAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
                Animated.spring(chipTranslateY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 80 }),
                // Stagger the filter chips in
                Animated.sequence([
                    Animated.delay(80),
                    Animated.parallel([
                        Animated.spring(filterChipsEntrance, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
                        Animated.spring(filterChipsTranslate, { toValue: 0, useNativeDriver: true, friction: 7, tension: 80 }),
                    ]),
                ]),
            ]).start();
        });
    }, []);

    // ── Clear category: chip fades out, grid slides back in ──────────────────
    const handleClearCategory = useCallback(() => {
        Haptics.selectionAsync();
        Animated.parallel([
            Animated.timing(chipEntranceAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(filterChipsEntrance, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]).start(() => {
            chipTranslateY.setValue(-14);
            gridOpacity.setValue(0);
            LayoutAnimation.configureNext({
                duration: 340,
                update: { type: 'spring', springDamping: 0.82 },
                create: { type: 'spring', property: 'opacity', springDamping: 0.82 },
            });
            setShowGrid(true);
            setActiveCategory('All');
            setSortBy('recommended');
            Animated.spring(gridOpacity, { toValue: 1, useNativeDriver: true, friction: 6, tension: 55, delay: 80 }).start();
        });
    }, []);

    // ── Filtered + sorted services ────────────────────────────────────────────
    const displayServices = useMemo(() => {
        const base = searchQuery.trim() ? searchResults : services;
        switch (sortBy) {
            case 'price_low':  return [...base].sort((a, b) => a.price - b.price);
            case 'price_high': return [...base].sort((a, b) => b.price - a.price);
            case 'rating':     return [...base].sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
            default:           return base;
        }
    }, [searchQuery, sortBy, searchResults, services]);

    // ── Category service counts ───────────────────────────────────────────────
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        services.forEach((s) => {
            if (s.category) counts[s.category] = (counts[s.category] || 0) + 1;
        });
        return counts;
    }, [services]);

    const activeCatInfo = CATEGORY_META.find((c) => c.key === activeCategory);

    // ── Sort chip data ────────────────────────────────────────────────────────
    const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
        { key: 'recommended', label: 'Recommended', icon: 'star-circle-outline' },
        { key: 'price_low',   label: 'Price: Low',  icon: 'trending-down' },
        { key: 'price_high',  label: 'Price: High', icon: 'trending-up' },
        { key: 'rating',      label: 'Top Rated',   icon: 'star-outline' },
    ];

    // ── List Header ───────────────────────────────────────────────────────────
    const ListHeaderComponent = (
        <View>
            {/* Category Grid */}
            {showGrid && (
                <Animated.View style={{ opacity: gridOpacity, paddingHorizontal: 24, paddingTop: 18 }}>
                    <Text style={{
                        fontFamily: FONTS.sansBold,
                        fontSize: 11,
                        color: COLORS.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 1.4,
                        marginBottom: 14,
                    }}>
                        Browse by category
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP }}>
                        {CATEGORY_META.map((cat, i) => (
                            <CategoryTile
                                key={cat.key}
                                cat={cat}
                                count={categoryCounts[cat.key] || 0}
                                onPress={() => handleCategoryPress(cat.key)}
                                entranceDelay={70 + i * 48}
                                focusKey={focusCount}
                            />
                        ))}
                    </View>
                </Animated.View>
            )}

            {/* Active Category Chip + Filter Chips (visible after category selected) */}
            {!showGrid && activeCategory !== 'All' && (
                <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
                    {/* Selected category pill */}
                    <Animated.View style={{
                        opacity: chipEntranceAnim,
                        transform: [{ translateY: chipTranslateY }],
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <TouchableOpacity
                            onPress={handleClearCategory}
                            activeOpacity={0.8}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 7,
                                paddingHorizontal: 14,
                                paddingVertical: 9,
                                backgroundColor: activeCatInfo?.colors[0] ?? COLORS.primary,
                                borderRadius: RADIUS.full,
                                ...SHADOWS.pink,
                            }}
                        >
                            <MaterialCommunityIcons
                                name={(activeCatInfo?.icon ?? 'grid') as any}
                                size={15}
                                color="white"
                            />
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: 'white' }}>
                                {activeCatInfo?.label ?? activeCategory}
                            </Text>
                            <MaterialIcons name="close" size={14} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>

                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted, marginLeft: 12 }}>
                            {displayServices.length} result{displayServices.length !== 1 ? 's' : ''}
                        </Text>
                    </Animated.View>

                    {/* Filter chips */}
                    <Animated.View style={{
                        opacity: filterChipsEntrance,
                        transform: [{ translateY: filterChipsTranslate }],
                        marginBottom: 16,
                    }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {SORT_OPTIONS.map((opt) => {
                                const isActive = sortBy === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        onPress={() => { Haptics.selectionAsync(); setSortBy(opt.key); }}
                                        activeOpacity={0.75}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 5,
                                            paddingHorizontal: 13,
                                            paddingVertical: 8,
                                            marginRight: 8,
                                            borderRadius: RADIUS.full,
                                            backgroundColor: isActive
                                                ? (isDark ? COLORS.primary + '22' : COLORS.blush)
                                                : (isDark ? COLORS.surfaceDark : COLORS.white),
                                            borderWidth: 1,
                                            borderColor: isActive ? COLORS.primary : (isDark ? COLORS.borderDark : COLORS.border),
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={opt.icon as any}
                                            size={13}
                                            color={isActive ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <Text style={{
                                            fontFamily: isActive ? FONTS.sansBold : FONTS.sansRegular,
                                            fontSize: 12,
                                            color: isActive ? COLORS.primary : COLORS.textMuted,
                                        }}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: isDark ? COLORS.borderDark : COLORS.border, marginBottom: 16 }} />
                </View>
            )}

            {/* Featured Specialists strip (only in browse mode) */}
            {showGrid && agents.length > 0 && (
                <View style={{ paddingTop: 6, paddingBottom: 6 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 24,
                        marginBottom: 16,
                    }}>
                        <Text style={{
                            fontFamily: FONTS.sansBold,
                            fontSize: 11,
                            color: COLORS.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: 1.4,
                        }}>
                            Featured Specialists
                        </Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
                    >
                        {agents.map((agent, i) => (
                            <AgentCard key={agent.id} agent={agent} delay={i * 65} />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* All services header */}
            {showGrid && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 24,
                    paddingTop: 18,
                    paddingBottom: 14,
                    marginTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? COLORS.borderDark : COLORS.border,
                }}>
                    <Text style={{
                        fontFamily: FONTS.sansBold,
                        fontSize: 11,
                        color: COLORS.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 1.4,
                    }}>
                        All Services
                    </Text>
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted }}>
                        {displayServices.length} available
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}
            edges={['top']}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* ── Header ───────────────────────────────────────────────────────── */}
            <Animated.View style={{
                opacity: headerAnim,
                transform: [{
                    translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
                }],
                paddingHorizontal: 24,
                paddingTop: 16,
                paddingBottom: 14,
            }}>
                <Text style={{
                    fontFamily: FONTS.playfairBold,
                    fontSize: 32,
                    color: isDark ? COLORS.white : COLORS.textDark,
                    letterSpacing: 0.2,
                }}>
                    Explore
                </Text>
                <Text style={{
                    fontFamily: FONTS.sansRegular,
                    fontSize: 13,
                    color: COLORS.textMuted,
                    marginTop: 2,
                }}>
                    Find the perfect beauty specialist
                </Text>
            </Animated.View>

            {/* ── Search Bar ────────────────────────────────────────────────────── */}
            <Animated.View style={{
                opacity: headerAnim,
                paddingHorizontal: 24,
                paddingBottom: 12,
                zIndex: 10,
            }}>
                <Animated.View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderRadius: RADIUS.full,
                    borderWidth: 1.5,
                    borderColor: searchFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [isDark ? COLORS.borderDark : COLORS.border, COLORS.primary],
                    }),
                    ...SHADOWS.sm,
                }}>
                    <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
                    <TextInput
                        ref={searchInputRef}
                        placeholder="Search services, styles..."
                        style={{
                            flex: 1,
                            marginLeft: 10,
                            fontFamily: FONTS.sansRegular,
                            fontSize: 14,
                            color: isDark ? COLORS.white : COLORS.textDark,
                        }}
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            setShowRecents(text.length === 0 && recentSearches.length > 0);
                        }}
                        onFocus={() => {
                            Animated.spring(searchFocusAnim, { toValue: 1, useNativeDriver: false, friction: 7, tension: 80 }).start();
                            if (!searchQuery && recentSearches.length > 0) setShowRecents(true);
                        }}
                        onBlur={() => {
                            Animated.timing(searchFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                            setTimeout(() => setShowRecents(false), 150);
                        }}
                        onSubmitEditing={() => {
                            if (searchQuery.trim()) { search(searchQuery); saveSearch(searchQuery); setShowRecents(false); }
                        }}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setShowRecents(false); searchInputRef.current?.blur(); }}>
                            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Recent Searches dropdown */}
                {showRecents && (
                    <View style={{
                        position: 'absolute',
                        top: 58,
                        left: 24,
                        right: 24,
                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                        borderRadius: RADIUS.lg,
                        borderWidth: 1,
                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                        zIndex: 200,
                        ...SHADOWS.md,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Recent
                            </Text>
                            <TouchableOpacity onPress={async () => { setRecentSearches([]); await AsyncStorage.removeItem(RECENT_SEARCHES_KEY); setShowRecents(false); }}>
                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.primary }}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                        {recentSearches.map((s, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => { setSearchQuery(s); setShowRecents(false); saveSearch(s); }}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}
                            >
                                <MaterialIcons name="history" size={15} color={COLORS.textMuted} />
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 13, color: isDark ? COLORS.white : COLORS.textDark, marginLeft: 10 }}>
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.View>

            {/* ── Divider under search ──────────────────────────────────────────── */}
            <View style={{ height: 1, backgroundColor: isDark ? COLORS.borderDark : COLORS.border, marginHorizontal: 0 }} />

            {/* ── Main FlatList ─────────────────────────────────────────────────── */}
            <FlatList
                data={displayServices}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <ServiceListCard service={item} index={index} focusKey={focusCount} />}
                ListHeaderComponent={ListHeaderComponent}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    if (hasMore && !loadingMore && !searchQuery.trim()) loadMore();
                }}
                onEndReachedThreshold={0.4}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <BrandedSpinner size="small" />
                        </View>
                    ) : null
                }
                ListEmptyComponent={() => (
                    loading ? (
                        <View style={{ paddingTop: 60, alignItems: 'center' }}>
                            <BrandedSpinner size="large" />
                        </View>
                    ) : (
                        <View style={{ paddingTop: 16 }}>
                            <EmptyState
                                type="search"
                                title={activeCategory !== 'All' ? `No ${activeCatInfo?.label ?? activeCategory} services yet` : 'No services found'}
                                description={
                                    activeCategory !== 'All'
                                        ? 'Be the first to offer this service or try another category.'
                                        : 'Try adjusting your search to find what you are looking for.'
                                }
                                primaryActionTitle={activeCategory !== 'All' ? 'Browse all categories' : undefined}
                                onPrimaryAction={activeCategory !== 'All' ? handleClearCategory : undefined}
                            />
                        </View>
                    )
                )}
            />

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type as any}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
            />
        </SafeAreaView>
    );
};

export default ServicesScreen;
