// src/components/AgentStoryBubble.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // For the '+' icon
import { Profile } from '@/types';
import OnlineIndicator from './OnlineIndicator';
import { getAvatarUrl } from '@/services/avatarUtils';
import { COLORS, FONTS, RADIUS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

import { useNavigation } from '@react-navigation/native';

interface Props {
    agent?: Profile;
    isCurrentUser?: boolean;
}

const AgentStoryBubble: React.FC<Props> = React.memo(({ agent, isCurrentUser }) => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isOnline = (lastSeen: string | null | undefined): boolean => {
        if (!lastSeen) return false;
        return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
    };

    const online = isOnline(agent?.last_seen);
    const firstName = agent?.full_name?.split(' ')[0] || "You";

    return (
        <TouchableOpacity
            onPress={() => {
                if (isCurrentUser) {
                    // Placeholder for Add Story action
                } else if (agent) {
                    navigation.navigate('AgentProfile', { agentId: agent.id });
                }
            }}
            activeOpacity={0.7}
            className="items-center mr-5 w-[72px]"
        >
            <View className="relative">
                {/* 🌈 Ring Gradient: Different for 'Add' vs 'Active' vs 'Inactive' */}
                <LinearGradient
                    colors={
                        isCurrentUser
                            ? ['#FF6289', '#FFD1DC', '#FF6289'] // Vibrant shimmer
                            : (online ? [COLORS.primary, COLORS.roseMid] : ['#E2E8F0', '#E2E8F0'])
                    }
                    style={{
                        padding: 2.5,
                        borderRadius: RADIUS.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <View style={{ padding: 2, backgroundColor: isDark ? COLORS.bgDark : 'white', borderRadius: RADIUS.full }}>
                        {/* 🖼️ Profile Image or Placeholder */}
                        <View
                            className="items-center justify-center"
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: RADIUS.full,
                                backgroundColor: isDark ? COLORS.surfaceDark : '#F1F5F9',
                                overflow: 'hidden'
                            }}
                        >
                            {agent?.avatar_url ? (
                                <Image
                                    source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            ) : (
                                // 🔠 Initial Placeholder if no image
                                <Text style={{ fontFamily: FONTS.montserratBold, color: COLORS.textMuted, fontSize: 20 }}>
                                    {firstName.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* ➕ Circle Plus Icon for Current User */}
                {isCurrentUser && (
                    <View
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Ionicons name="add" size={18} color="white" />
                    </View>
                )}

                {/* 🟢 Online Status Dot (Only for others) */}
                {!isCurrentUser && online && (
                    <View className="absolute bottom-1 right-1 border-2 border-white rounded-full">
                        <OnlineIndicator />
                    </View>
                )}
            </View>

            {/* 👤 Name Label */}
            <Text
                className="mt-2 text-[12px]"
                style={{
                    fontFamily: isCurrentUser ? FONTS.sansBold : FONTS.sansMedium,
                    color: isCurrentUser ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark)
                }}
                numberOfLines={1}
            >
                {isCurrentUser ? "Your Story" : firstName}
            </Text>
        </TouchableOpacity>
    );
});

export default AgentStoryBubble;