// src/screens/AgentsScreen.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { mockAgents } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import CategoryChips from '@/components/CategoryChips';
import ThemedTextInput from '@/components/ThemedTextInput';
import { useNavigation } from '@react-navigation/native';
import { Profile } from '@/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import { getAvatarUrl } from '@/services/avatarUtils';

const AgentDetailCard = ({ agent }: { agent: Profile }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
            className="flex-row items-center p-4 mb-4 border"
            style={{
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                borderRadius: RADIUS.lg,
                ...SHADOWS.sm
            }}
            activeOpacity={0.8}
        >
            <View className="relative">
                <Image
                    source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }}
                    className="w-20 h-20"
                    style={{ borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.roseMid }}
                    contentFit="cover"
                />
                <View className="absolute -bottom-1 -right-1">
                    <VerifiedBadge />
                </View>
            </View>

            <View className="ml-4 flex-1">
                <View className="flex-row items-center justify-between">
                    <Text
                        className="text-lg"
                        style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}
                    >
                        {agent.full_name}
                    </Text>
                    <View className="flex-row items-center">
                        <MaterialIcons name="star" size={14} color={COLORS.gold} />
                        <Text className="ml-1 text-xs" style={{ fontFamily: FONTS.sansBold, color: isDark ? COLORS.white : COLORS.textDark }}>4.9</Text>
                    </View>
                </View>

                <Text
                    className="text-sm mt-1"
                    style={{ fontFamily: FONTS.sansMedium, color: COLORS.primary }}
                >
                    {agent.specialization}
                </Text>

                <View className="flex-row items-center mt-2">
                    <MaterialIcons name="place" size={12} color={COLORS.textMuted} />
                    <Text className="ml-1 text-[11px]" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                        {agent.location}
                    </Text>
                </View>

                <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
                    <View className="px-2 py-1 rounded" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.surface }}>
                        <Text className="text-[10px]" style={{ fontFamily: FONTS.sansBold, color: COLORS.textMuted }}>{agent.years_exp}+ Years Exp</Text>
                    </View>
                </View>
            </View>

            <MaterialIcons name="chevron-right" size={24} color={COLORS.textMuted} />
        </TouchableOpacity>
    );
};

const AgentsScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredAgents = useMemo(() => {
        return mockAgents.filter(a => {
            const matchesCategory = activeCategory === 'All' || a.service_type === activeCategory;
            const matchesSearch = (a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.specialization?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
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
                    Experts
                </Text>
                <Text className="text-sm mt-1" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                    Verified beauty professionals ready to serve you
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
                            placeholder="Find a specialist..."
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

            {/* Agent List */}
            <FlatList
                data={filteredAgents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AgentDetailCard agent={item} />}
                contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-20">
                        <MaterialIcons name="people-outline" size={48} color={COLORS.textMuted} />
                        <Text className="mt-4 text-base" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                            No experts found
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

export default AgentsScreen;
