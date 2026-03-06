// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { mockCurrentUser } from '@/data/mock';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemeStore } from '@/store/useThemeStore';
import { getAvatarUrl } from '@/services/avatarUtils';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase';
import { Alert } from 'react-native';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';

const ProfileItem = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    rightElement
}: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center justify-between py-4 border-b"
            style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <View
                    className="w-10 h-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDark ? COLORS.surfaceDark : `${COLORS.primary}10` }}
                >
                    <MaterialIcons name={icon as any} size={22} color={COLORS.primary} />
                </View>
                <View className="ml-4">
                    <Text
                        className="text-[15px]"
                        style={{ fontFamily: FONTS.sansMedium, color: isDark ? COLORS.white : COLORS.textDark }}
                    >
                        {label}
                    </Text>
                    {value && (
                        <Text
                            className="text-[12px] mt-0.5"
                            style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}
                        >
                            {value}
                        </Text>
                    )}
                </View>
            </View>
            <View className="flex-row items-center">
                {rightElement}
                {showChevron && (
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} className="ml-2" />
                )}
            </View>
        </TouchableOpacity>
    );
};

const ProfileScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { toggleTheme } = useThemeStore();
    const navigation = useNavigation<any>();

    const user = mockCurrentUser;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
                {/* Header */}
                <View className="flex-row items-center justify-between py-6">
                    <Text className="text-3xl" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                        Profile
                    </Text>
                    <TouchableOpacity
                        className="w-10 h-10 items-center justify-center rounded-full border"
                        style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}
                    >
                        <MaterialIcons name="settings" size={20} color={isDark ? COLORS.white : COLORS.textDark} />
                    </TouchableOpacity>
                </View>

                <ProfileCompletionBanner />

                {/* User Info */}
                <View className="items-center py-6">
                    <View className="relative">
                        <Image
                            source={{ uri: getAvatarUrl(user.full_name, user.avatar_url) }}
                            className="w-24 h-24"
                            style={{ borderRadius: RADIUS.full, borderWidth: 3, borderColor: COLORS.primary }}
                        />
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-md"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <MaterialIcons name="edit" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-2xl mt-4" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                        {user.full_name}
                    </Text>
                    <Text className="text-sm mt-1" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                        {user.location}
                    </Text>
                </View>

                {/* Dashboard Switch */}
                <View className="my-4">
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-5 rounded-3xl"
                        style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}
                        onPress={() => navigation.navigate(user.user_type === 'agent' ? 'AgentDashboard' : 'CustomerDashboard')}
                    >
                        <View className="flex-row items-center">
                            <MaterialIcons name="dashboard" size={24} color="white" />
                            <View className="ml-4">
                                <Text className="text-white text-base" style={{ fontFamily: FONTS.montserratBold }}>
                                    {user.user_type === 'agent' ? 'Agent Dashboard' : 'My Bookings'}
                                </Text>
                                <Text className="text-white/80 text-xs" style={{ fontFamily: FONTS.sansRegular }}>
                                    Manage your activity and schedule
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Settings Sections */}
                <View className="mt-8">
                    <Text className="text-[10px] uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                        Account
                    </Text>
                    <ProfileItem icon="person-outline" label="Personal Information" value="Name, location, and bio" />
                    <ProfileItem icon="favorite-border" label="Favorites" value="Your saved services and artists" />
                    <ProfileItem icon="payment" label="Payments" value="Transactions and wallet" />
                </View>

                <View className="mt-8">
                    <Text className="text-[10px] uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                        Preferences
                    </Text>
                    <ProfileItem
                        icon="dark-mode"
                        label="Dark Mode"
                        showChevron={false}
                        rightElement={
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                                thumbColor="white"
                            />
                        }
                    />
                    <ProfileItem icon="notifications-none" label="Notifications" />
                    <ProfileItem icon="language" label="Language" value="English (Default)" />
                </View>

                <View className="mt-8 mb-32">
                    <Text className="text-[10px] uppercase tracking-[4px] mb-4" style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted }}>
                        Support
                    </Text>
                    <ProfileItem icon="help-outline" label="Help Center" />
                    <ProfileItem icon="info-outline" label="About Everything Beauty" />
                    <TouchableOpacity
                        className="flex-row items-center py-6"
                        onPress={async () => {
                            Alert.alert(
                                "Sign Out",
                                "Are you sure you want to sign out?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Sign Out",
                                        style: "destructive",
                                        onPress: async () => {
                                            const { error } = await supabase.auth.signOut();
                                            if (error) Alert.alert("Error", error.message);
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <MaterialIcons name="logout" size={22} color="#EF4444" />
                        <Text className="ml-4 text-base" style={{ fontFamily: FONTS.sansBold, color: '#EF4444' }}>
                            Sign Out
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
