// src/screens/AgentDashboardScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { mockBookings, mockCurrentUser, mockServices } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View
            className="flex-1 p-4 mr-3 last:mr-0 border"
            style={{
                backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                borderColor: isDark ? COLORS.borderDark : COLORS.border,
                borderRadius: RADIUS.lg,
                ...SHADOWS.sm
            }}
        >
            <View className="w-10 h-10 items-center justify-center rounded-full mb-3" style={{ backgroundColor: `${color}15` }}>
                <MaterialIcons name={icon as any} size={20} color={color} />
            </View>
            <Text className="text-[10px] uppercase tracking-wider" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                {title}
            </Text>
            <Text className="text-lg mt-1" style={{ fontFamily: FONTS.montserratBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                {value}
            </Text>
        </View>
    );
};

const AgentDashboardScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();

    const user = mockCurrentUser;
    const myServices = mockServices.filter(s => s.agent_id === user.id);
    const myBookings = mockBookings.filter(b => b.services?.agent_id === user.id);
    const pendingBookings = myBookings.filter(b => b.status === 'pending');

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
                {/* Header */}
                <View className="flex-row items-center justify-between py-6">
                    <View>
                        <Text className="text-sm" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                            Good morning,
                        </Text>
                        <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                            {user.full_name?.split(' ')[0]}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 items-center justify-center rounded-full border"
                        style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}
                    >
                        <MaterialIcons name="notifications-none" size={24} color={isDark ? COLORS.white : COLORS.textDark} />
                        <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500" />
                    </TouchableOpacity>
                </View>

                {/* Performance Summary */}
                <View className="flex-row mt-4">
                    <StatCard title="Earnings" value="₦245k" icon="payments" color={COLORS.success} />
                    <StatCard title="Bookings" value={myBookings.length.toString()} icon="event" color={COLORS.primary} />
                    <StatCard title="Rating" value="4.9" icon="star" color={COLORS.gold} />
                </View>

                {/* Quick Actions */}
                <View className="mt-10">
                    <Text className="text-[12px] uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                        Quick Actions
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                        {[
                            { label: 'Add Service', icon: 'add-circle-outline', color: COLORS.primary },
                            { label: 'View Schedule', icon: 'calendar-today', color: '#6366F1' },
                            { label: 'Chat', icon: 'chat-bubble-outline', color: '#10B981' },
                            { label: 'Payouts', icon: 'account-balance-wallet', color: '#F59E0B' }
                        ].map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                className="w-[47%] p-4 border flex-row items-center"
                                style={{
                                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                    borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    borderRadius: RADIUS.lg
                                }}
                            >
                                <MaterialIcons name={action.icon as any} size={22} color={action.color} />
                                <Text className="ml-3 text-xs" style={{ fontFamily: FONTS.sansBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Pending Requests */}
                <View className="mt-10 mb-20">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[12px] uppercase tracking-[4px]" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                            Pending Requests
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-xs" style={{ fontFamily: FONTS.sansBold, color: COLORS.primary }}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingBookings.length > 0 ? (
                        pendingBookings.map((b, i) => (
                            <View
                                key={i}
                                className="p-4 mb-3 border rounded-2xl"
                                style={{
                                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                    borderColor: isDark ? COLORS.borderDark : COLORS.border
                                }}
                            >
                                <View className="flex-row items-center mb-3">
                                    <View className="w-10 h-10 rounded-full bg-gray-200" />
                                    <View className="ml-3 flex-1">
                                        <Text style={{ fontFamily: FONTS.sansBold, color: isDark ? COLORS.white : COLORS.textDark }}>{b.profiles?.full_name}</Text>
                                        <Text className="text-xs" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>{b.services?.name}</Text>
                                    </View>
                                    <Text className="text-xs" style={{ fontFamily: FONTS.sansBold, color: COLORS.primary }}>₦{b.services?.price?.toLocaleString() || '0'}</Text>
                                </View>
                                <View className="flex-row" style={{ gap: 8 }}>
                                    <TouchableOpacity className="flex-1 py-2 rounded-lg items-center" style={{ backgroundColor: COLORS.primary }}>
                                        <Text className="text-white text-xs" style={{ fontFamily: FONTS.sansBold }}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="flex-1 py-2 rounded-lg items-center border" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                                        <Text className="text-xs" style={{ fontFamily: FONTS.sansBold, color: COLORS.textMuted }}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-8 items-center border-2 border-dashed rounded-3xl" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                            <MaterialIcons name="event-available" size={32} color={COLORS.textMuted} />
                            <Text className="mt-2 text-sm" style={{ fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>No pending requests</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AgentDashboardScreen;
