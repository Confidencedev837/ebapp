// src/screens/ServicesScreen.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import CategoryChips from '@/components/CategoryChips';
import Snackbar from '@/components/Snackbar';
import { useNavigation } from '@react-navigation/native';
import { Service } from '@/types';
import { useServices } from '@/hooks/useServices';
import { useSearchServices } from '@/hooks/useServices';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type ViewMode = 'grid' | 'list';
type SortOption = 'recommended' | 'price_low' | 'price_high' | 'rating' | 'nearest';

const RECENT_SEARCHES_KEY = '@eb_recent_searches';
const AVAILABLE_BADGE_COLOR = '#22C55E'; // Green for "available" — since COLORS.positive doesn't exist

// ─── Rich Service Card (Grid + List modes) ───────────────────────────────────
const ServiceCard = ({
    service,
    viewMode,
    index,
}: {
    service: Service;
    viewMode: ViewMode;
    index: number;
}) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [saved, setSaved] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('ServiceDetail', { serviceId: service.id });
    };

    const handleSave = (e: any) => {
        e.stopPropagation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSaved(!saved);
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
        }).start();
    };

    const isAvailableToday = Math.random() > 0.3;
    const distance = `${(Math.random() * 8 + 0.5).toFixed(1)} km`;
    const duration = `${Math.floor(Math.random() * 90 + 30)} min`;
    const reviewCount = Math.floor(Math.random() * 200 + 5);
    const rating = (service as any).rating ?? 4.7; // Fallback since Service type doesn't have rating

    if (viewMode === 'list') {
        return (
            <AnimatedSection delay={300 + index * 50} direction="up" distance={30}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Pressable
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={{
                        flexDirection: 'row',
                        marginHorizontal: SPACING.screen,
                        marginBottom: 12,
                        padding: 12,
                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                        borderRadius: RADIUS.lg,
                        borderWidth: 1,
                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                        ...SHADOWS.sm,
                    }}
                >
                    <View style={{ position: 'relative' }}>
                        <Image
                            source={{ uri: service.image_url[0] }}
                            style={{ width: 100, height: 100, borderRadius: RADIUS.md }}
                            contentFit="cover"
                        />
                        {isAvailableToday && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 6,
                                    left: 6,
                                    backgroundColor: AVAILABLE_BADGE_COLOR + 'E6',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: RADIUS.full,
                                }}
                            >
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 9, color: '#fff' }}>
                                    Available
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text
                                    style={{
                                        fontFamily: FONTS.montserratBold,
                                        fontSize: 14,
                                        color: isDark ? COLORS.white : COLORS.textDark,
                                        flex: 1,
                                    }}
                                    numberOfLines={1}
                                >
                                    {service.name}
                                </Text>
                                <TouchableOpacity onPress={handleSave} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                    <Ionicons
                                        name={saved ? 'heart' : 'heart-outline'}
                                        size={18}
                                        color={saved ? COLORS.primary : COLORS.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="verified" size={12} color={COLORS.primary} />
                                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 11, color: COLORS.primary, marginLeft: 2 }}>
                                        Verified
                                    </Text>
                                </View>
                                <Text style={{ color: COLORS.border, fontSize: 10 }}>•</Text>
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                                    {service.profiles?.full_name}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    <MaterialIcons name="schedule" size={11} color={COLORS.textMuted} />
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                                        {duration}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    <MaterialIcons name="place" size={11} color={COLORS.textMuted} />
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                                        {distance}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary, fontSize: 15 }}>
                                ₦{service.price.toLocaleString()}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="star" size={13} color={COLORS.gold} />
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: isDark ? COLORS.white : COLORS.textDark }}>
                                    {rating.toFixed(1)}
                                </Text>
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                                    ({reviewCount})
                                </Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
            </AnimatedSection>
        );
    }

    // ─── Grid Mode ───────────────────────────────────────────────────────────
    return (
        <AnimatedSection delay={300 + index * 50} direction="up" distance={30} style={index % 2 === 0 ? { marginLeft: SPACING.screen } : { marginRight: SPACING.screen }}>
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }], width: CARD_WIDTH },
            ]}
        >
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                    marginBottom: 16,
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    overflow: 'hidden',
                    ...SHADOWS.sm,
                }}
            >
                <View style={{ position: 'relative' }}>
                    <Image
                        source={{ uri: service.image_url[0] }}
                        style={{ width: '100%', height: 140 }}
                        contentFit="cover"
                    />
                    <TouchableOpacity
                        onPress={handleSave}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                        <Ionicons
                            name={saved ? 'heart' : 'heart-outline'}
                            size={14}
                            color={saved ? COLORS.primary : isDark ? COLORS.white : COLORS.textDark}
                        />
                    </TouchableOpacity>

                    {isAvailableToday && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                backgroundColor: AVAILABLE_BADGE_COLOR + 'E6',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: RADIUS.full,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' }} />
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 10, color: '#fff' }}>
                                Available today
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ padding: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <MaterialIcons name="verified" size={11} color={COLORS.primary} />
                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 10, color: COLORS.primary }}>
                            Verified
                        </Text>
                    </View>

                    <Text
                        style={{ fontFamily: FONTS.montserratBold, fontSize: 13, color: isDark ? COLORS.white : COLORS.textDark, marginBottom: 2 }}
                        numberOfLines={1}
                    >
                        {service.name}
                    </Text>

                    <Text
                        style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}
                        numberOfLines={1}
                    >
                        {service.profiles?.full_name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary, fontSize: 14 }}>
                            ₦{service.price.toLocaleString()}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <MaterialIcons name="star" size={11} color={COLORS.gold} />
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 11, color: isDark ? COLORS.white : COLORS.textDark }}>
                                {rating.toFixed(1)}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
        </AnimatedSection>
    );
};

// ─── Sort Bottom Sheet ──────────────────────────────────────────────────────
const SortSheet = ({
    visible,
    current,
    onSelect,
    onClose,
    isDark,
}: {
    visible: boolean;
    current: SortOption;
    onSelect: (s: SortOption) => void;
    onClose: () => void;
    isDark: boolean;
}) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    const options: { key: SortOption; label: string; icon: string }[] = [
        { key: 'recommended', label: 'Recommended', icon: 'thumb-up' },
        { key: 'price_low', label: 'Price: Low to High', icon: 'arrow-downward' },
        { key: 'price_high', label: 'Price: High to Low', icon: 'arrow-upward' },
        { key: 'rating', label: 'Top Rated', icon: 'star' },
        { key: 'nearest', label: 'Nearest First', icon: 'place' },
    ];

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}>
            <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', opacity: fadeAnim }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderTopLeftRadius: RADIUS.xl,
                    borderTopRightRadius: RADIUS.xl,
                    paddingTop: 12,
                    paddingBottom: 32,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? COLORS.borderDark : COLORS.border, alignSelf: 'center', marginBottom: 16 }} />
                <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 18, color: isDark ? COLORS.white : COLORS.textDark, textAlign: 'center', marginBottom: 16 }}>
                    Sort by
                </Text>

                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onSelect(opt.key);
                            onClose();
                        }}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 24,
                            paddingVertical: 14,
                            backgroundColor: current === opt.key ? (isDark ? COLORS.primary + '15' : COLORS.blush) : 'transparent',
                        }}
                    >
                        <MaterialIcons name={opt.icon as any} size={20} color={current === opt.key ? COLORS.primary : COLORS.textMuted} />
                        <Text
                            style={{
                                fontFamily: current === opt.key ? FONTS.sansBold : FONTS.sansRegular,
                                fontSize: 15,
                                color: current === opt.key ? COLORS.primary : isDark ? COLORS.white : COLORS.textDark,
                                marginLeft: 16,
                            }}
                        >
                            {opt.label}
                        </Text>
                        {current === opt.key && (
                            <MaterialIcons name="check" size={20} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                        )}
                    </TouchableOpacity>
                ))}
            </Animated.View>
        </View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ServicesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [showSort, setShowSort] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showRecents, setShowRecents] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    
    // ── API state ───────────────────────────────────────────────────────────
    const { services, error: servicesError } = useServices();
    const { results: searchResults, loading: searchLoading, error: searchError, search } = useSearchServices();
    const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    
    useEffect(() => {
        if (servicesError || searchError) {
            setSnackbar({ visible: true, message: servicesError || searchError || 'Error', type: 'error' });
        }
    }, [servicesError, searchError]);

    // Load recent searches
    useEffect(() => {
        AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((data) => {
            if (data) setRecentSearches(JSON.parse(data));
        });
    }, []);
    
    // Trigger search when query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            search(searchQuery);
        }
    }, [searchQuery, search]);

    const saveSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 8);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    const filteredServices = useMemo(() => {
        // Use search results if query exists, otherwise use services from API
        let result = searchQuery.trim() ? searchResults : services;
        
        // Filter by category
        if (activeCategory !== 'All') {
            result = result.filter(s => s.category === activeCategory);
        }

        switch (sortBy) {
            case 'price_low':
                result = [...result].sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                result = [...result].sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                result = [...result].sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
                break;
            case 'nearest':
                result = [...result].sort(() => Math.random() - 0.5);
                break;
            default:
                break;
        }

        return result;
    }, [searchQuery, activeCategory, sortBy, searchResults, services]);

    const handleCategorySelect = useCallback((category: string) => {
        Haptics.selectionAsync();
        setActiveCategory(category);
    }, []);

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            search(searchQuery);
            saveSearch(searchQuery);
            setShowRecents(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setShowRecents(false);
        searchInputRef.current?.blur();
    };

    const sortLabel: Record<SortOption, string> = {
        recommended: 'Recommended',
        price_low: 'Price: Low - High',
        price_high: 'Price: High - Low',
        rating: 'Top Rated',
        nearest: 'Nearest',
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <AnimatedSection delay={0} direction="down" distance={20} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
                <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                    Discover
                </Text>
                <Text className="text-sm mt-1" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                    {filteredServices.length} specialist{filteredServices.length !== 1 ? 's' : ''} available
                </Text>
            </AnimatedSection>

            {/* Sticky Search & Categories */}
            <AnimatedSection delay={100} direction="down" distance={20} style={{ paddingTop: 16, borderBottomWidth: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background, borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                <View className="px-6 mb-3">
                    <View
                        className="flex-row items-center px-4 py-3 border"
                        style={{
                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                            borderRadius: RADIUS.full,
                        }}
                    >
                        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
                        <TextInput
                            ref={searchInputRef}
                            placeholder="Search services, artists, styles..."
                            className="flex-1 ml-3 text-sm"
                            style={{ fontFamily: FONTS.sansRegular, color: isDark ? COLORS.white : COLORS.textDark }}
                            placeholderTextColor={COLORS.textMuted}
                            value={searchQuery}
                            onChangeText={(text: string) => {
                                setSearchQuery(text);
                                setShowRecents(text.length === 0 && recentSearches.length > 0);
                            }}
                            onFocus={() => {
                                if (searchQuery.length === 0 && recentSearches.length > 0) {
                                    setShowRecents(true);
                                }
                            }}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={clearSearch}>
                                <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowSort(true);
                                }}
                            >
                                <MaterialIcons name="tune" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Recent Searches Dropdown */}
                {showRecents && (
                    <View
                        style={{
                            marginHorizontal: SPACING.screen,
                            marginBottom: 12,
                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                            borderRadius: RADIUS.lg,
                            borderWidth: 1,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                            ...SHADOWS.md,
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10 }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Recent searches
                            </Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    setRecentSearches([]);
                                    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
                                }}
                            >
                                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.primary }}>
                                    Clear
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {recentSearches.map((search, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    setSearchQuery(search);
                                    setShowRecents(false);
                                    saveSearch(search);
                                }}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}
                            >
                                <MaterialIcons name="history" size={16} color={COLORS.textMuted} />
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 14, color: isDark ? COLORS.white : COLORS.textDark, marginLeft: 10 }}>
                                    {search}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />
            </AnimatedSection>

            {/* Results Bar */}
            <AnimatedSection
                delay={200} direction="up" distance={20}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: SPACING.screen,
                    paddingVertical: 10,
                    backgroundColor: isDark ? COLORS.bgDark : COLORS.background,
                }}
            >
                <TouchableOpacity
                    onPress={() => setShowSort(true)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: RADIUS.full,
                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                        borderWidth: 1,
                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                    }}
                >
                    <MaterialIcons name="sort" size={14} color={COLORS.textMuted} />
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted }}>
                        {sortLabel[sortBy]}
                    </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setViewMode('grid'); }}
                        style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: viewMode === 'grid' ? COLORS.primary : 'transparent' }}
                    >
                        <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : COLORS.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setViewMode('list'); }}
                        style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: viewMode === 'list' ? COLORS.primary : 'transparent' }}
                    >
                        <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
            </AnimatedSection>

            {/* Service List */}
            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                numColumns={viewMode === 'grid' ? 2 : 1}
                key={viewMode}
                renderItem={({ item, index }) => <ServiceCard service={item} viewMode={viewMode} index={index} />}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-20 px-8">
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <MaterialIcons name="search-off" size={32} color={COLORS.textMuted} />
                        </View>
                        <Text className="text-base" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark, textAlign: 'center', marginBottom: 6 }}>
                            No services found
                        </Text>
                        <Text style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                            Try adjusting your search or filters to find what you're looking for.
                        </Text>
                        <TouchableOpacity
                            onPress={() => { setSearchQuery(''); setActiveCategory('All'); setSortBy('recommended'); }}
                            style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.full }}
                        >
                            <Text style={{ fontFamily: FONTS.sansBold, color: '#fff', fontSize: 14 }}>
                                Clear all filters
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Sort Bottom Sheet */}
            <SortSheet visible={showSort} current={sortBy} onSelect={setSortBy} onClose={() => setShowSort(false)} isDark={isDark} />
            
            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type as any}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
            />
        </View>
        </SafeAreaView>
    );
};

export default ServicesScreen;