// src/screens/AgentProfileScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mockAgents, mockServices, mockReviews } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAvatarUrl } from '@/services/avatarUtils';
import VerifiedBadge from '@/components/VerifiedBadge';
import OnlineIndicator from '@/components/OnlineIndicator';

type RootStackParamList = { AgentProfile: { agentId: string } };
type AgentProfileRouteProp = RouteProp<RootStackParamList, 'AgentProfile'>;

const AgentProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<AgentProfileRouteProp>();
    const { agentId } = route.params;
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const agent = useMemo(() => mockAgents.find(a => a.id === agentId), [agentId]);
    const agentServices = useMemo(() => mockServices.filter(s => s.agent_id === agentId), [agentId]);

    const agentReviews = useMemo(() => {
        const serviceIds = agentServices.map(s => s.id);
        return mockReviews.filter(r => serviceIds.includes(r.service_id));
    }, [agentServices]);

    const avgRating = useMemo(() => {
        if (agentReviews.length === 0) return 4.9;
        return agentReviews.reduce((acc, r) => (acc + r.rating), 0) / agentReviews.length;
    }, [agentReviews]);

    if (!agent) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text>Agent not found</Text>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Banner */}
                <View className="relative h-64">
                    <Image
                        source={{ uri: agent.banner_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000' }}
                        className="w-full h-full"
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']}
                        className="absolute inset-0"
                    />

                    {/* Header Nav */}
                    <View className="absolute top-12 left-6 right-6 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="w-10 h-10 items-center justify-center rounded-full"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name="share" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Main Content - Overlapping Profile */}
                <View className="px-6 -mt-16">
                    {/* Profile Header Row */}
                    <View className="flex-row items-end justify-between">
                        <View className="relative">
                            <View
                                className="p-1 rounded-full"
                                style={[{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white }, SHADOWS.md]}
                            >
                                <Image
                                    source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }}
                                    style={{ width: 110, height: 110, borderRadius: RADIUS.full }}
                                />
                            </View>
                            <View className="absolute bottom-1 right-1">
                                <VerifiedBadge />
                            </View>
                            <View className="absolute top-2 right-2">
                                <OnlineIndicator lastSeen={agent.last_seen} />
                            </View>
                        </View>

                        <View className="flex-row gap-2 mb-2">
                            <TouchableOpacity
                                className="w-12 h-12 rounded-full items-center justify-center border"
                                style={{
                                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white
                                }}
                            >
                                <MaterialIcons name="chat-bubble-outline" size={20} color={isDark ? COLORS.white : COLORS.textDark} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="px-8 py-3.5 rounded-full"
                                style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}
                            >
                                <Text className="text-white" style={{ fontFamily: FONTS.montserratBold, fontSize: 13 }}>Follow</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Identity */}
                    <View className="mt-6">
                        <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                            {agent.full_name}
                        </Text>
                        <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 8 }}>
                            <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: `${COLORS.primary}15` }}>
                                <MaterialIcons name="auto-awesome" size={12} color={COLORS.primary} />
                                <Text className="ml-1.5 text-xs" style={{ fontFamily: FONTS.sansMedium, color: COLORS.primary }}>
                                    {agent.specialization}
                                </Text>
                            </View>
                            <View className="w-1 h-1 rounded-full bg-gray-400" />
                            <View className="flex-row items-center">
                                <MaterialIcons name="place" size={14} color={COLORS.textMuted} />
                                <Text className="ml-1 text-sm" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                                    {agent.location}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row items-center justify-between mt-8 py-6 border-y" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                        <View className="items-center flex-1">
                            <Text className="text-xl" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                                {agent.years_exp}+
                            </Text>
                            <Text className="text-[10px] uppercase tracking-[2px] mt-1" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                                Years
                            </Text>
                        </View>
                        <View className="w-px h-8" style={{ backgroundColor: isDark ? COLORS.borderDark : COLORS.border }} />
                        <View className="items-center flex-1">
                            <Text className="text-xl" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                                {agentServices.length}
                            </Text>
                            <Text className="text-[10px] uppercase tracking-[2px] mt-1" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                                Services
                            </Text>
                        </View>
                        <View className="w-px h-8" style={{ backgroundColor: isDark ? COLORS.borderDark : COLORS.border }} />
                        <View className="items-center flex-1">
                            <View className="flex-row items-center">
                                <Text className="text-xl" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                                    {avgRating.toFixed(1)}
                                </Text>
                                <MaterialIcons name="star" size={16} color={COLORS.gold} style={{ marginLeft: 4 }} />
                            </View>
                            <Text className="text-[10px] uppercase tracking-[2px] mt-1" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                                Reviews
                            </Text>
                        </View>
                    </View>

                    {/* Bio */}
                    <View className="mt-8">
                        <Text className="text-[10px] uppercase tracking-[4px] mb-3" style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary }}>
                            The Artist
                        </Text>
                        <Text className="text-base leading-7" style={{ fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textDark }}>
                            {agent.bio}
                        </Text>
                    </View>

                    {/* Portfolio */}
                    {agent.gallery && agent.gallery.length > 0 && (
                        <View className="mt-10">
                            <Text className="text-[10px] uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                                Featured Work
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                {agent.gallery.map((item, idx) => (
                                    <TouchableOpacity key={idx} className="mr-3" activeOpacity={0.9}>
                                        <Image
                                            source={{ uri: item.url }}
                                            className="w-44 h-56"
                                            style={{ borderRadius: RADIUS.lg }}
                                            contentFit="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Services List */}
                    <View className="mt-12 mb-32">
                        <Text className="text-[10px] uppercase tracking-[4px] mb-6" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                            Offered Services
                        </Text>
                        {agentServices.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                                className="flex-row items-center p-4 mb-4 border"
                                style={{
                                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    borderRadius: RADIUS.lg
                                }}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: service.image_url[0] }}
                                    className="w-24 h-24"
                                    style={{ borderRadius: RADIUS.md }}
                                    contentFit="cover"
                                />
                                <View className="ml-4 flex-1">
                                    <Text className="text-base" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                                        {service.name}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                        <Text className="ml-1 text-[11px]" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                                            {service.duration_mins} mins
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center justify-between mt-3">
                                        <Text className="text-lg" style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary }}>
                                            ₦{service.price.toLocaleString()}
                                        </Text>
                                        <View
                                            className="w-8 h-8 items-center justify-center rounded-full"
                                            style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.surface }}
                                        >
                                            <MaterialIcons name="arrow-forward" size={16} color={COLORS.textMuted} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Call Button */}
            <View
                className="absolute bottom-10 left-6 right-6 p-1 rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
                <TouchableOpacity
                    className="flex-row items-center justify-center py-4 rounded-full"
                    style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}
                    activeOpacity={0.9}
                >
                    <MaterialIcons name="event" size={20} color="white" />
                    <Text className="ml-2 text-white" style={{ fontFamily: FONTS.montserratBold }}>Book Session</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AgentProfileScreen;
