// src/screens/HomeScreen.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
    mockAgents,
    mockServices,
    mockBookings,
    mockCurrentUser
} from '@/data/mock';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import AgentStoryBubble from '@/components/AgentStoryBubble';
import AvailableTodayCard from '@/components/AvailableTodayCard';
import UpcomingBookingBanner from '@/components/UpcomingBookingBanner';
import CategoryChips from '@/components/CategoryChips';
import ServicePostCard from '@/components/ServicePostCard';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemeMode } from '@/types';
import ThemedTextInput from '@/components/ThemedTextInput';
import { useTheme } from '@/context/ThemeContext';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';

const HomeScreen = () => {
    const { themeMode, toggleTheme } = useThemeStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredServices = useMemo(() =>
        activeCategory === 'All'
            ? mockServices
            : mockServices.filter(s => s.category === activeCategory),
        [activeCategory]
    );

    const handleCategorySelect = useCallback((category: string) => {
        setActiveCategory(category);
    }, []);

    const upcomingBooking = useMemo(() =>
        mockBookings.find(b =>
            b.customer_id === mockCurrentUser.id &&
            (b.status === 'pending' || b.status === 'confirmed')
        ),
        []
    );

    /**
     * 📌 1. STICKY HEADER PART
     * This stays fixed at the top.
     */
    const renderStickyHeader = () => (
        <View
            className="border-b"
            style={{
                zIndex: 10,
                backgroundColor: isDark ? COLORS.bgDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border
            }}
        >
            {/* Header Bar */}
            <View className="flex-row items-center justify-between px-6 py-5">
                <View>
                    <Text className="text-2xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.primary }}>
                        EverythingBeauty
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <MaterialIcons name="place" size={14} style={{ color: COLORS.primary }} />
                        <Text className="text-xs ml-1" style={{ fontFamily: FONTS.sansMedium, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                            Victoria Island, Lagos
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center">
                    {/* Single Theme Toggle Button */}
                    <TouchableOpacity
                        onPress={toggleTheme}
                        className="p-2 border mr-3"
                        style={[{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.full }, SHADOWS.sm]}
                    >
                        <Ionicons
                            name={themeMode === ThemeMode.LIGHT ? "sunny" : themeMode === ThemeMode.DARK ? "moon" : "contrast"}
                            size={20}
                            style={{ color: COLORS.primary }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="p-2 border mr-3"
                        style={[{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.full }, SHADOWS.sm]}
                    >
                        <Ionicons name="notifications-outline" size={20} style={{ color: isDark ? COLORS.white : COLORS.textDark }} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image
                            source={{ uri: getAvatarUrl(mockCurrentUser.full_name, mockCurrentUser.avatar_url) }}
                            style={{ width: 44, height: 44, borderRadius: RADIUS.full }}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar Section */}
            <View className="px-4 pb-4">
                <View
                    className="flex-row items-center px-4 py-3 border"
                    style={[{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.md }, SHADOWS.sm]}
                >
                    <MaterialIcons name="search" size={20} style={{ color: COLORS.textMuted }} />
                    <ThemedTextInput
                        placeholder="Search services, agents..."
                        className="flex-1 ml-3 text-sm"
                        style={{ fontFamily: FONTS.sansRegular, color: isDark ? COLORS.white : COLORS.textDark }}
                        placeholderTextColor={COLORS.textMuted}
                    />
                    <TouchableOpacity className="ml-2">
                        <MaterialIcons name="tune" size={20} style={{ color: COLORS.primary }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    /**
     * 📜 2. SCROLLABLE HEADER PART
     * Memoized to prevent re-calculating the entire header on every list scroll or category change.
     */
    const listHeader = useMemo(() => (
        <View style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.white }}>
            {/* Profile Completion Warning */}
            <ProfileCompletionBanner />

            {/* Upcoming Booking (Scrollable) */}
            {upcomingBooking && (
                <View className="mb-4 mt-2">
                    <UpcomingBookingBanner booking={upcomingBooking} />
                </View>
            )}

            {/* Category Chips (Scrollable) */}
            <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />

            {/* Verified Agents (Stories) */}
            <View className="mb-10">
                <Text className="px-4 text-xs uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                    Verified Agents
                </Text>
                <FlatList
                    data={mockCurrentUser.user_type === 'agent' ? [{ ...mockCurrentUser, isAddSlot: true } as any, ...mockAgents] : mockAgents}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    renderItem={({ item }) => (
                        <AgentStoryBubble
                            agent={item}
                            isCurrentUser={!!(item as any).isAddSlot}
                        />
                    )}
                />
            </View>

            {/* Available Today (Horizontal Strip) */}
            <View className="mb-6">
                <View className="flex-row items-center justify-between px-4 mb-4">
                    <Text className="text-xs uppercase tracking-[4px]" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                        Available Today
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-xs uppercase tracking-[1px]" style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary }}>
                            See All
                        </Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={mockServices.slice(0, 5)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    renderItem={({ item }) => (
                        <AvailableTodayCard service={item} />
                    )}
                />
            </View>

            {/* Service Feed Label */}
            <View className="px-4 mb-4 mt-6">
                <View className="flex-row items-center justify-between pb-4 border-b" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                    <View className="flex-row items-center">
                        <Text className="text-sm uppercase tracking-[4px]" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                            Service Feed
                        </Text>
                        <View className="ml-3 px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.blush }}>
                            <Text className="text-[11px] font-sansBold" style={{ color: COLORS.primary }}>
                                {filteredServices.length} Total
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <MaterialIcons name="sort" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    ), [activeCategory, upcomingBooking, handleCategorySelect, filteredServices.length, isDark]);

    const renderServiceItem = useCallback(({ item }: { item: any }) => (
        <ServicePostCard service={item} />
    ), []);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['left', 'right']}>

            {/* 🏗️ FIXED TOP SECTION */}
            {renderStickyHeader()}

            {/* 🌊 SCROLLABLE SECTION */}
            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={listHeader}
                renderItem={renderServiceItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            // Tip: If you wanted the chips to be sticky too, you'd use stickyHeaderIndices={[index]}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;