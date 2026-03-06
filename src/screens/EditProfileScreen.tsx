// src/screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';
import { COLORS, FONTS, RADIUS } from '@/constants/theme';
import ThemedTextInput from '@/components/ThemedTextInput';
import { Profile } from '@/types';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { profile, setProfile } = useUserStore();
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [specialization, setSpecialization] = useState(profile?.specialization || '');
    const [yearsExp, setYearsExp] = useState(profile?.years_exp?.toString() || '');

    const handleSave = async () => {
        if (!profile?.id) return;

        setLoading(true);
        try {
            const updates = {
                full_name: fullName,
                location: location,
                bio: bio,
                specialization: specialization,
                years_exp: yearsExp ? parseInt(yearsExp, 10) : null,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id)
                .select()
                .single();

            if (error) throw error;

            setProfile(data as Profile);
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.white }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center justify-between border-b" style={{ borderColor: COLORS.border }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                        <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 18, color: COLORS.textDark }}>
                        Edit Profile
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.primary }}>
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    {/* Full Name */}
                    <View className="mb-6">
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Full Name
                        </Text>
                        <ThemedTextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your full name"
                            className="bg-gray-50 px-4 py-4 rounded-2xl border"
                            style={{ fontFamily: FONTS.sansRegular, borderColor: COLORS.border }}
                        />
                    </View>

                    {/* Location */}
                    <View className="mb-6">
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Location
                        </Text>
                        <ThemedTextInput
                            value={location}
                            onChangeText={setLocation}
                            placeholder="e.g. Victoria Island, Lagos"
                            className="bg-gray-50 px-4 py-4 rounded-2xl border"
                            style={{ fontFamily: FONTS.sansRegular, borderColor: COLORS.border }}
                        />
                    </View>

                    {/* Specialization (if Agent) */}
                    {profile?.user_type === 'agent' && (
                        <>
                            <View className="mb-6">
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Specialization
                                </Text>
                                <ThemedTextInput
                                    value={specialization}
                                    onChangeText={setSpecialization}
                                    placeholder="e.g. Professional Makeup Artist"
                                    className="bg-gray-50 px-4 py-4 rounded-2xl border"
                                    style={{ fontFamily: FONTS.sansRegular, borderColor: COLORS.border }}
                                />
                            </View>

                            <View className="mb-6">
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Years of Experience
                                </Text>
                                <ThemedTextInput
                                    value={yearsExp}
                                    onChangeText={setYearsExp}
                                    placeholder="e.g. 5"
                                    keyboardType="numeric"
                                    className="bg-gray-50 px-4 py-4 rounded-2xl border"
                                    style={{ fontFamily: FONTS.sansRegular, borderColor: COLORS.border }}
                                />
                            </View>
                        </>
                    )}

                    {/* Bio */}
                    <View className="mb-10">
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Bio
                        </Text>
                        <ThemedTextInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell the world about yourself..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-gray-50 px-4 py-4 rounded-2xl border min-h-[120]"
                            style={{ fontFamily: FONTS.sansRegular, borderColor: COLORS.border }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;
