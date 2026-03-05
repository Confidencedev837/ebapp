// src/screens/ServicesScreen.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { mockServices } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import CategoryChips from '@/components/CategoryChips';
import ThemedTextInput from '@/components/ThemedTextInput';
import { useNavigation } from '@react-navigation/native';
import { Service } from '@/types';

const CompactServiceCard = ({ service }: { service: Service }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
            className="flex-1 m-2 p-3 border"
            style={{
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                borderRadius: RADIUS.lg,
                ...SHADOWS.sm
            }}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: service.image_url[0] }}
                className="w-full h-32 mb-3"
                style={{ borderRadius: RADIUS.md }}
                contentFit="cover"
            />
            <Text
                className="text-sm mb-1"
                style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}
                numberOfLines={1}
            >
                {service.name}
            </Text>
            <Text
                className="text-[11px] mb-3"
                style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}
                numberOfLines={1}
            >
                {service.profiles?.full_name}
            </Text>
            <View className="flex-row items-center justify-between">
                <Text style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary, fontSize: 13 }}>
                    ₦{service.price.toLocaleString()}
                </Text>
                <View className="flex-row items-center">
                    <MaterialIcons name="star" size={12} color={COLORS.gold} />
                    <Text className="ml-1 text-[10px]" style={{ fontFamily: FONTS.sansBold, color: isDark ? COLORS.white : COLORS.textDark }}>4.9</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const ServicesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredServices = useMemo(() => {
        return mockServices.filter(s => {
            const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
            const matchesSearch = (s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory]);

    const handleCategorySelect = useCallback((category: string) => {
        setActiveCategory(category);
    }, []);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View className="px-6 pt-4 pb-2">
                <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                    Discover
                </Text>
                <Text className="text-sm mt-1" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                    Find the best beauty specialists in Nigeria
                </Text>
            </View>

            {/* Sticky Search & Categories */}
            <View
                className="pt-4 border-b"
                style={{
                    backgroundColor: isDark ? COLORS.bgDark : COLORS.background,
                    borderColor: isDark ? COLORS.borderDark : COLORS.border
                }}
            >
                <View className="px-6 mb-2">
                    <View
                        className="flex-row items-center px-4 py-3 border"
                        style={{
                            backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                            borderRadius: RADIUS.full
                        }}
                    >
                        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
                        <ThemedTextInput
                            placeholder="Search for services or artists..."
                            className="flex-1 ml-3 text-sm"
                            style={{ fontFamily: FONTS.sansRegular, color: isDark ? COLORS.white : COLORS.textDark }}
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
                </View>

                <CategoryChips activeCategory={activeCategory} onSelect={handleCategorySelect} />
            </View>

            {/* Service Grid */}
            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                numColumns={2}
                renderItem={({ item }) => <CompactServiceCard service={item} />}
                contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-20">
                        <MaterialIcons name="search-off" size={48} color={COLORS.textMuted} />
                        <Text className="mt-4 text-base" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                            No services found
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

export default ServicesScreen;
