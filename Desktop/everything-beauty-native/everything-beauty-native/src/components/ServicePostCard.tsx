// src/components/ServicePostCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Service } from '@/types';
import VerifiedBadge from './VerifiedBadge';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface Props {
    service: Service;
}

const ServicePostCard: React.FC<Props> = React.memo(({ service }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isLiked, setIsLiked] = React.useState(false);

    const handlePress = () => {
        navigation.navigate('ServiceDetail', { serviceId: service.id });
    };

    return (
        <View className="mb-10" style={{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white }}>
            {/* 👤 Agent Header */}
            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity
                    className="relative"
                    onPress={() => navigation.navigate('AgentProfile', { agentId: service.agent_id })}
                >
                    <View style={{ padding: 2, backgroundColor: COLORS.roseMid, borderRadius: RADIUS.full }}>
                        <Image
                            source={{ uri: getAvatarUrl(service.profiles?.full_name, service.profiles?.avatar_url) }}
                            style={{ width: 44, height: 44, borderRadius: RADIUS.full }}
                        />
                    </View>
                    <View className="absolute -bottom-1 -right-1">
                        <VerifiedBadge />
                    </View>
                </TouchableOpacity>

                <View className="ml-3 flex-1">
                    <Text className="text-base" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                        {service.profiles?.full_name}
                    </Text>
                    <Text className="text-[11px] mt-0.5" style={{ fontFamily: FONTS.sansRegular, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                        {service.profiles?.location}
                    </Text>
                </View>

                <View className="px-3 py-1.5" style={{ backgroundColor: COLORS.blush, borderRadius: RADIUS.full }}>
                    <Text className="text-[10px] uppercase tracking-[1.5px]" style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary }}>
                        {service.category}
                    </Text>
                </View>

                <TouchableOpacity className="ml-2 p-1">
                    <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* 🖼️ Main Image with Overlays */}
            <TouchableOpacity activeOpacity={0.9} onPress={handlePress} className="relative">
                <Image
                    source={{ uri: service.image_url[0] || 'https://via.placeholder.com/400' }}
                    style={{ width: '100%', height: 420 }}
                    contentFit="cover"
                />

                <View className="absolute top-4 left-4 gap-y-2">
                    {/* ⏱️ Duration Tag */}
                    <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                        <MaterialIcons name="schedule" size={14} color="white" />
                        <Text className="text-white text-xs ml-1 font-sansMedium">
                            {service.duration_mins} mins
                        </Text>
                    </View>
                    <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', alignSelf: 'flex-start' }}
                    >
                        <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
                        <Text className="text-xs ml-1" style={{ color: COLORS.textDark, fontFamily: FONTS.sansMedium }}>
                            2.5 km
                        </Text>
                    </View>
                </View>

                {/* 💰 Price Badge Overlay top-right */}
                <View className="absolute top-4 right-4 px-4 py-2 rounded-full" style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}>
                    <Text className="text-white text-sm" style={{ fontFamily: FONTS.montserratBold }}>
                        ₦{service.price.toLocaleString()}
                    </Text>
                </View>

                {/* 🚥 Image Carousel Indicators */}
                {service.image_url.length > 1 && (
                    <View className="absolute top-4 right-1/2 translate-x-1/2 flex-row gap-1 bg-black/30 px-2 py-1 rounded-full">
                        {service.image_url.map((_, index) => (
                            <View
                                key={index}
                                className={`h-1.5 rounded-full ${index === 0 ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </View>
                )}

                {/* 🌄 Premium Gradient Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                    className="absolute bottom-0 left-0 right-0 p-6 pt-24"
                >
                    <Text
                        className="text-white text-2xl mb-1.5"
                        style={{
                            fontFamily: FONTS.playfairBold,
                            letterSpacing: 0.2
                        }}
                    >
                        {service.name}
                    </Text>

                    <Text
                        className="text-white/90 text-sm leading-5"
                        style={{
                            fontFamily: FONTS.sansRegular,
                        }}
                        numberOfLines={2}
                    >
                        {service.description}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* 👍 Action Row */}
            <View className="flex-row items-center justify-between px-4 py-5 border-t" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                <View className="flex-row items-center">
                    <TouchableOpacity
                        className="mr-5"
                        onPress={() => setIsLiked(!isLiked)}
                        activeOpacity={0.6}
                    >
                        <MaterialIcons
                            name={isLiked ? "favorite" : "favorite-border"}
                            size={28}
                            style={{ color: isLiked ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark) }}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity className="mr-5" activeOpacity={0.6}>
                        <MaterialIcons name="chat-bubble-outline" size={24} style={{ color: isDark ? COLORS.white : COLORS.textDark }} />
                    </TouchableOpacity>
                    <TouchableOpacity className="mr-5" activeOpacity={0.6}>
                        <MaterialIcons name="share" size={24} style={{ color: isDark ? COLORS.white : COLORS.textDark }} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.6}>
                        <MaterialIcons name="bookmark-border" size={24} style={{ color: isDark ? COLORS.white : COLORS.textDark }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handlePress}
                    className="px-8 py-3.5"
                    style={[{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full }, SHADOWS.pink]}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-[13px]" style={{ fontFamily: FONTS.montserratBold }}>
                        Book Now
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ⭐ Footer Info */}
            <View className="px-4 pb-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="flex-row items-center px-2 py-1 rounded-md" style={{ backgroundColor: isDark ? COLORS.borderDark : COLORS.surface }}>
                        <MaterialIcons name="star" size={14} style={{ color: COLORS.gold }} />
                        <Text className="ml-1 text-xs" style={{ fontFamily: FONTS.montserratExtraBold, color: isDark ? COLORS.white : COLORS.textDark }}>4.9</Text>
                    </View>
                    <Text className="ml-3 text-xs" style={{ fontFamily: FONTS.sansMedium, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}>
                        (120+ reviews)
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <MaterialIcons name="verified-user" size={14} style={{ color: COLORS.success }} />
                    <Text className="ml-1 text-[11px]" style={{ fontFamily: FONTS.sansBold, color: COLORS.success, textTransform: 'uppercase' }}>
                        Trusted
                    </Text>
                </View>
            </View>
        </View>
    );
});

export default ServicePostCard;