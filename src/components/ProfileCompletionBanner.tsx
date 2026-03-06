// src/components/ProfileCompletionBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';

const ProfileCompletionBanner = () => {
    const { profile } = useUserStore();
    const navigation = useNavigation<any>();

    // Check if critical info is missing based on user type
    const isAgent = profile?.user_type === 'agent';
    const isMissingInfo = isAgent
        ? (!profile?.specialization || !profile?.location || !profile?.bio || !profile?.years_exp)
        : (!profile?.location || !profile?.service_type);

    if (!isMissingInfo) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EditProfile')} // Direct to Edit Profile screen
            className="mx-4 mt-2 mb-4 p-4 flex-row items-center border"
            style={[
                {
                    backgroundColor: '#76ff0eff', // Very light rose
                    borderColor: COLORS.primary + '30',
                    borderRadius: RADIUS.xl,
                },
                SHADOWS.sm
            ]}
        >
            <View className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.primary }}>
                <MaterialIcons name="error-outline" size={24} color="white" />
            </View>

            <View className="ml-3 flex-1">
                <Text style={{ fontFamily: FONTS.montserratBold, color: COLORS.textDark, fontSize: 14 }}>
                    Complete your profile
                </Text>
                <Text style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted, fontSize: 12, marginTop: 1 }}>
                    {isAgent
                        ? "Add your specialization to get 3x more bookings."
                        : "Add your location to see beauty pros near you."}
                </Text>
            </View>

            <MaterialIcons name="chevron-right" size={20} color={COLORS.primary} />
        </TouchableOpacity>
    );
};

export default ProfileCompletionBanner;
