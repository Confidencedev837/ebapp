// src/screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    StatusBar,
    Animated,
} from 'react-native';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase, uploadToStorage, getPublicStorageUrl } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useUserStore } from '@/store/useUserStore';
import { COLORS, FONTS, RADIUS, SHADOWS, FONT_SIZE } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import ThemedTextInput from '@/components/ThemedTextInput';
import Snackbar from '@/components/Snackbar';
import { Profile } from '@/types';

const EditProfileScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { profile, setProfile } = useUserStore();
    const isDark = theme === 'dark';

    const bg = isDark ? COLORS.bgDark : COLORS.background;
    const card = isDark ? COLORS.surfaceDark : COLORS.white;
    const text = isDark ? COLORS.white : COLORS.textDark;
    const muted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
    const border = isDark ? COLORS.borderDark : COLORS.border;
    const surface = isDark ? '#1E1E1E' : COLORS.surface;

    const [loading, setLoading] = useState(false);
    const [avatarUriLocal, setAvatarUriLocal] = useState<string | null>(null);
    const [licenseUriLocal, setLicenseUriLocal] = useState<string | null>(null);

    // Form state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [specialization, setSpecialization] = useState(profile?.specialization || '');
    const [yearsExp, setYearsExp] = useState(profile?.years_exp?.toString() || '');
    const [serviceType, setServiceType] = useState(profile?.service_type || '');

    // Snackbar notification state
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false, message: '', type: 'success'
    });

    const isAgent = profile?.user_type === 'agent';

    const handleSave = async () => {
        if (!profile?.id) return;
        if (!fullName.trim()) {
            setSnackbar({ visible: true, message: 'Full name is required', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const updates: Record<string, any> = {
                full_name: fullName.trim(),
                phone: phone.trim() || null,
                location: location.trim() || null,
                bio: bio.trim() || null,
                updated_at: new Date().toISOString(),
            };

            if (isAgent) {
                updates.specialization = specialization.trim() || null;
                updates.years_exp = yearsExp ? parseInt(yearsExp, 10) : null;
            } else {
                updates.service_type = serviceType.trim() || null;
            }

            // Upload avatar if a new one was selected
            if (avatarUriLocal) {
                const extMatch = avatarUriLocal.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
                const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
                const filename = `avatars/${profile.id}/avatar-${Date.now()}.${ext}`;
                const storagePath = await uploadToStorage('avatars', filename, avatarUriLocal);
                const { data: publicUrlData } = getPublicStorageUrl('avatars', storagePath);
                updates['avatar_url'] = publicUrlData.publicUrl;
            }

            // Upload license if selected (agents only)
            if (isAgent && licenseUriLocal) {
                const extMatch = licenseUriLocal.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
                const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
                const filename = `licenses/${profile.id}/license-${Date.now()}.${ext}`;
                const storagePath = await uploadToStorage('licenses', filename, licenseUriLocal);
                const { data: publicUrlData } = getPublicStorageUrl('licenses', storagePath);
                updates['license_url'] = publicUrlData.publicUrl;
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id)
                .select()
                .single();

            if (error) throw error;

            setProfile(data as Profile);
            setSnackbar({ visible: true, message: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (error: any) {
            setSnackbar({ visible: true, message: error.message || 'Failed to save changes', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const pickFromLibrary = async (onPick: (uri: string) => void) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setSnackbar({ visible: true, message: 'Permission to access media library is required', type: 'error' });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            onPick(result.assets[0].uri);
        }
    };

    const handlePickAvatar = async () => pickFromLibrary((uri) => setAvatarUriLocal(uri));
    const handlePickLicense = async () => pickFromLibrary((uri) => setLicenseUriLocal(uri));

    const { animStyle } = useScreenAnimation();

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top', 'bottom']}>
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {/* ── Header ── */}
                <View style={[styles.header, { borderColor: border, backgroundColor: card }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <MaterialIcons name="close" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>
                        {isAgent ? 'Professional Profile' : 'Personal Profile'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.saveTxt}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Guided Setup Message */}
                    <View style={[styles.setupCard, { backgroundColor: `${COLORS.primary}0D`, borderColor: `${COLORS.primary}20` }]}>
                        <MaterialIcons name="account-circle" size={24} color={COLORS.primary} />
                        <Text style={[styles.setupTxt, { color: isDark ? COLORS.textMutedDark : COLORS.textDark }]}>
                            {isAgent 
                                ? "Complete your portfolio details, skills, and license documentation to acquire verified status and gain bookings."
                                : "Add your phone number, location, and style preferences to get recommended local artists instantly."}
                        </Text>
                    </View>

                    {/* Avatar Upload */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarFrame, { borderColor: COLORS.primary }]}>
                            <Image 
                                source={{ uri: avatarUriLocal || profile?.avatar_url || 'https://ui-avatars.com/api/?name=Profile&background=F43F5E&color=fff' }} 
                                style={StyleSheet.absoluteFill} 
                                contentFit="cover" 
                            />
                        </View>
                        <TouchableOpacity onPress={handlePickAvatar} style={[styles.avatarEditBtn, SHADOWS.pink]}>
                            <MaterialIcons name="photo-camera" size={16} color="white" />
                        </TouchableOpacity>
                        <Text style={[styles.avatarLabel, { color: muted }]}>Profile Photo</Text>
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeading, { color: COLORS.primary }]}>General Info</Text>

                        {/* Full Name */}
                        <Text style={[styles.inputLabel, { color: muted }]}>Full Name *</Text>
                        <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                            <ThemedTextInput
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                style={[styles.textInput, { color: text }]}
                            />
                        </View>

                        {/* Phone Number */}
                        <Text style={[styles.inputLabel, { color: muted }]}>Phone Number</Text>
                        <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                            <ThemedTextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. +234 80 1234 5678"
                                keyboardType="phone-pad"
                                style={[styles.textInput, { color: text }]}
                            />
                        </View>

                        {/* Location */}
                        <Text style={[styles.inputLabel, { color: muted }]}>Location / Neighborhood</Text>
                        <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                            <ThemedTextInput
                                value={location}
                                onChangeText={setLocation}
                                placeholder="e.g. Lekki Phase 1, Lagos"
                                style={[styles.textInput, { color: text }]}
                            />
                        </View>
                    </View>

                    {/* Differentiated Screens: Agent vs Customer */}
                    {isAgent ? (
                        <View style={styles.section}>
                            <Text style={[styles.sectionHeading, { color: COLORS.primary }]}>Professional Details</Text>

                            {/* Specialization */}
                            <Text style={[styles.inputLabel, { color: muted }]}>Specialization</Text>
                            <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                                <ThemedTextInput
                                    value={specialization}
                                    onChangeText={setSpecialization}
                                    placeholder="e.g. Bridal & Editorial Makeup Artist"
                                    style={[styles.textInput, { color: text }]}
                                />
                            </View>

                            {/* Years Experience */}
                            <Text style={[styles.inputLabel, { color: muted }]}>Years of Experience</Text>
                            <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                                <ThemedTextInput
                                    value={yearsExp}
                                    onChangeText={setYearsExp}
                                    placeholder="e.g. 5"
                                    keyboardType="numeric"
                                    style={[styles.textInput, { color: text }]}
                                />
                            </View>

                            {/* License uploads */}
                            <Text style={[styles.inputLabel, { color: muted }]}>Professional License / Certification</Text>
                            <TouchableOpacity 
                                onPress={handlePickLicense} 
                                style={[styles.licenseBox, { backgroundColor: surface, borderColor: border }]}
                            >
                                {licenseUriLocal || profile?.license_url ? (
                                    <View style={StyleSheet.absoluteFill}>
                                        <Image source={{ uri: licenseUriLocal || profile?.license_url || '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                        <View style={styles.licenseOverlay}>
                                            <MaterialIcons name="cloud-done" size={24} color="white" />
                                            <Text style={styles.licenseOverlayTxt}>Tap to replace file</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.licenseEmpty}>
                                        <MaterialIcons name="upload-file" size={32} color={muted} />
                                        <Text style={[styles.licenseEmptyTxt, { color: muted }]}>Upload certification or license document</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={[styles.sectionHeading, { color: COLORS.primary }]}>Beauty Preferences</Text>

                            {/* Preferred styles / service type */}
                            <Text style={[styles.inputLabel, { color: muted }]}>Preferred Style Interests</Text>
                            <View style={[styles.inputContainer, { backgroundColor: surface, borderColor: border }]}>
                                <ThemedTextInput
                                    value={serviceType}
                                    onChangeText={setServiceType}
                                    placeholder="e.g. Wig styling, Natural glam, Braids"
                                    style={[styles.textInput, { color: text }]}
                                />
                            </View>
                        </View>
                    )}

                    {/* Bio */}
                    <View style={[styles.section, { marginBottom: 60 }]}>
                        <Text style={[styles.sectionHeading, { color: COLORS.primary }]}>About Me</Text>
                        <View style={[styles.bioContainer, { backgroundColor: surface, borderColor: border }]}>
                            <ThemedTextInput
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Write a short summary about your beauty style, services, or expectations..."
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                style={[styles.bioInput, { color: text }]}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                duration={3000}
                onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
            />
        </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    closeBtn: { padding: 4 },
    headerTitle: { fontFamily: FONTS.montserratBold, fontSize: 16 },
    saveBtn: { paddingHorizontal: 12, paddingVertical: 4 },
    saveTxt: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.primary },
    container: { flex: 1, paddingHorizontal: 20 },
    
    // Guided message
    setupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        marginTop: 16,
        gap: 12,
    },
    setupTxt: { flex: 1, fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, lineHeight: 18 },

    // Avatar
    avatarSection: { alignItems: 'center', marginVertical: 24, position: 'relative' },
    avatarFrame: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 2.5, backgroundColor: '#E5E7EB' },
    avatarEditBtn: {
        position: 'absolute',
        bottom: 24,
        right: '37%',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLabel: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.xs, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Inputs
    section: { marginTop: 16 },
    sectionHeading: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.sm, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    inputLabel: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 2 },
    inputContainer: { borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
    textInput: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.base, padding: 0 },
    
    // Bio
    bioContainer: { borderRadius: RADIUS.md, borderWidth: 1.5, padding: 14, minHeight: 90 },
    bioInput: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.base, minHeight: 70 },

    // License
    licenseBox: { height: 110, borderRadius: RADIUS.md, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    licenseEmpty: { alignItems: 'center', padding: 12 },
    licenseEmptyTxt: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: 4 },
    licenseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    licenseOverlayTxt: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.xs, color: 'white', marginTop: 4 },
});

export default EditProfileScreen;
