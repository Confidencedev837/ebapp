// src/components/UpcomingBookingBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '@/types';
import { COLORS, RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
    booking: Booking;
    onPress?: () => void;
}

const UpcomingBookingBanner: React.FC<Props> = ({ booking, onPress }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const statusColor = (booking.status as string) === 'confirmed' ? COLORS.success : COLORS.primary;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="mx-4 mb-0 p-5 flex-row items-center border"
            style={[{
                borderRadius: RADIUS.lg,
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border
            }, SHADOWS.sm]}
        >
            <View
                className="p-3 rounded-2xl mr-4"
                style={{ backgroundColor: isDark ? 'rgba(255, 98, 137, 0.15)' : COLORS.blush }}
            >
                <MaterialIcons name="event" size={24} color={COLORS.primary} />
            </View>

            <View className="flex-1">
                <Text
                    className="text-[10px] uppercase tracking-[2px] mb-1"
                    style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}
                >
                    Upcoming
                </Text>
                <Text
                    className="text-base mb-1"
                    style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}
                >
                    {booking.services?.name}
                </Text>
                <View className="flex-row items-center">
                    <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                    <Text
                        className="text-xs ml-1"
                        style={{ fontFamily: FONTS.sansMedium, color: isDark ? COLORS.textMutedDark : COLORS.textMuted }}
                    >
                        {new Date(booking.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} • {booking.time.slice(0, 5)}
                    </Text>
                </View>
            </View>

            <View
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: statusColor }}
            >
                <Text className="text-white text-[11px]" style={{ fontFamily: FONTS.montserratBold, textTransform: 'uppercase' }}>
                    {booking.status}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default UpcomingBookingBanner;
