// src/components/AvailableTodayCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Service } from '@/types';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

import { useNavigation } from '@react-navigation/native';

interface Props {
    service: Service;
}

const AvailableTodayCard: React.FC<Props> = React.memo(({ service }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handlePress = () => {
        navigation.navigate('ServiceDetail', { serviceId: service.id });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            /* ⬆️ Width increased to w-52 and added mb-6 for shadow breathing room */
            className="p-4 mr-5 mb-3 w-57 border"
            style={[{
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                borderRadius: RADIUS.xl
            }, SHADOWS.md]}
        >
            {/* 👤 Header: Avatar + Availability Dot */}
            <View className="flex-row items-center mb-4">
                <View className="relative">
                    <Image
                        source={{ uri: getAvatarUrl(service.profiles?.full_name, service.profiles?.avatar_url) }}
                        style={{
                            width: 48, // ⬆️ Larger avatar for the wider card
                            height: 48,
                            borderRadius: RADIUS.full,
                            borderWidth: 2,
                            borderColor: COLORS.roseMid
                        }}
                    />
                    {/* 🟢 Status Dot */}
                    <View
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ backgroundColor: '#22C55E' }} // Success Green
                    />
                </View>

                <View className="ml-3 flex-1">
                    <Text
                        className="text-sm"
                        style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}
                        numberOfLines={1}
                    >
                        {service.profiles?.full_name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                        <MaterialIcons name="star" size={12} color={COLORS.gold} />
                        <Text className="text-xs ml-1" style={{ color: COLORS.textMuted, fontFamily: FONTS.sansMedium }}>4.9</Text>
                    </View>
                </View>
            </View>

            {/* 📋 Service Name - Bigger font for wider card */}
            <Text
                className="text-base mb-4"
                style={{ fontFamily: FONTS.sansMedium, color: isDark ? COLORS.white : COLORS.textDark }}
                numberOfLines={1}
            >
                {service.name}
            </Text>

            {/* 💰 Footer: Price + Book Button */}
            <View className="flex-row justify-between items-center border-t pt-4" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                <View>
                    <Text className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.textMuted, fontFamily: FONTS.montserratBold }}>
                        Price
                    </Text>
                    <Text
                        className="text-base"
                        style={{ color: COLORS.primary, fontFamily: FONTS.montserratBold }}
                    >
                        ₦{service.price.toLocaleString()}
                    </Text>
                </View>

                {/* Book CTA */}
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); navigation.navigate('Booking', { service }); }}
                    activeOpacity={0.82}
                    style={[{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10 }, SHADOWS.pink]}
                >
                    <MaterialIcons name="event" size={13} color="white" />
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 12, color: COLORS.white }}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

export default AvailableTodayCard;