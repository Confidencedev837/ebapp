// src/screens/CustomerDashboardScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { mockBookings, mockCurrentUser } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAvatarUrl } from '@/services/avatarUtils';
import { Booking } from '@/types';

const BookingCard = ({ booking }: { booking: Booking }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return COLORS.success;
            case 'pending': return COLORS.gold;
            case 'cancelled': return '#EF4444';
            case 'completed': return COLORS.primary;
            default: return COLORS.textMuted;
        }
    };

    return (
        <TouchableOpacity
            className="p-4 mb-4 border"
            style={{
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                borderRadius: RADIUS.lg,
                ...SHADOWS.sm
            }}
            activeOpacity={0.8}
        >
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <MaterialIcons name="event" size={16} color={COLORS.textMuted} />
                    <Text className="ml-2 text-xs" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                        {new Date(booking.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
                    <MaterialIcons name="schedule" size={16} color={COLORS.textMuted} />
                    <Text className="ml-1 text-xs" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                        {booking.time}
                    </Text>
                </View>
                <View
                    className="px-2 py-1 rounded-md"
                    style={{ backgroundColor: `${getStatusColor(booking.status)}15` }}
                >
                    <Text
                        className="text-[10px] uppercase tracking-wider"
                        style={{ fontFamily: FONTS.montserratBold, color: getStatusColor(booking.status) }}
                    >
                        {booking.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center">
                <Image
                    source={{ uri: booking.services?.image_url?.[0] }}
                    className="w-16 h-16"
                    style={{ borderRadius: RADIUS.md }}
                    contentFit="cover"
                />
                <View className="ml-4 flex-1">
                    <Text
                        className="text-base"
                        style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}
                    >
                        {booking.services?.name}
                    </Text>
                    <Text
                        className="text-sm mt-1"
                        style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}
                    >
                        with {booking.profiles?.full_name}
                    </Text>
                </View>
                <View className="items-end">
                    <Text
                        className="text-base"
                        style={{ fontFamily: FONTS.montserratBold, color: COLORS.primary }}
                    >
                        ₦{booking.services?.price?.toLocaleString() || '0'}
                    </Text>
                    <TouchableOpacity className="mt-2 p-1">
                        <MaterialIcons name="more-horiz" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const CustomerDashboardScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('Upcoming');

    const tabs = ['Upcoming', 'Completed', 'Cancelled'];

    const filteredBookings = useMemo(() => {
        return mockBookings.filter(b => {
            const isMine = b.customer_id === mockCurrentUser.id;
            if (!isMine) return false;

            if (activeTab === 'Upcoming') return b.status === 'pending' || b.status === 'confirmed';
            if (activeTab === 'Completed') return b.status === 'completed';
            if (activeTab === 'Cancelled') return b.status === 'cancelled';
            return true;
        });
    }, [activeTab]);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View className="px-6 pt-4 pb-2">
                <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                    My Bookings
                </Text>
                <Text className="text-sm mt-1" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                    Keep track of your beauty appointments
                </Text>
            </View>

            {/* Tabs */}
            <View
                className="flex-row px-6 mt-6 pb-2"
                style={{ borderBottomWidth: 1, borderColor: isDark ? COLORS.borderDark : COLORS.border }}
            >
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className="mr-6 pb-3"
                        style={{
                            borderBottomWidth: activeTab === tab ? 3 : 0,
                            borderColor: COLORS.primary
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: activeTab === tab ? FONTS.sansBold : FONTS.sansMedium,
                                color: activeTab === tab ? (isDark ? COLORS.white : COLORS.textDark) : COLORS.textMuted
                            }}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Booking List */}
            <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <BookingCard booking={item} />}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-20">
                        <View
                            className="w-16 h-16 items-center justify-center rounded-full mb-4"
                            style={{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface }}
                        >
                            <MaterialIcons name="event-busy" size={32} color={COLORS.textMuted} />
                        </View>
                        <Text className="text-base" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                            No {activeTab.toLowerCase()} bookings
                        </Text>
                        <TouchableOpacity
                            className="mt-6 px-8 py-3 rounded-full"
                            style={{ backgroundColor: COLORS.primary }}
                            onPress={() => {/* Navigate to home/discovery */ }}
                        >
                            <Text className="text-white" style={{ fontFamily: FONTS.montserratBold }}>Explore Services</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

export default CustomerDashboardScreen;
