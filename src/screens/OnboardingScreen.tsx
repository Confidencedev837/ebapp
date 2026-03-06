// src/screens/OnboardingScreen.tsx - Multi-step onboarding for Agents and Customers
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFonts, Montserrat_700Bold, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/useUserStore';
import { Profile } from '../types';
import ThemedTextInput from '@/components/ThemedTextInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOCATIONS = ['Victoria Island', 'Lekki', 'Surulere', 'Ikeja', 'Yaba', 'Ajah', 'Other'];
const CATEGORIES = ['Makeup', 'Hair Styling', 'Nails', 'Spa & Massage', 'Bridal', 'Skincare', 'Barbing', 'Tattoos', 'Photography'];
const SPECIALIZATIONS = [
    { label: 'Makeup', icon: 'face-retouching-natural' },
    { label: 'Hair Styling', icon: 'content-cut' },
    { label: 'Nails', icon: 'back-hand' },
    { label: 'Spa & Massage', icon: 'spa' },
    { label: 'Bridal', icon: 'favorite' },
    { label: 'Skincare', icon: 'face' },
    { label: 'Barbing', icon: 'content-cut' },
];

const OnboardingScreen = () => {
    const insets = useSafeAreaInsets();
    const profile = useUserStore((state) => state.profile);
    const setProfile = useUserStore((state) => state.setProfile);

    const [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
        PlayfairDisplay_700Bold,
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
    });

    const isAgent = profile?.user_type === 'agent';
    const totalSteps = isAgent ? 3 : 2;

    const [step, setStep] = useState(0);
    const [finishLoading, setFinishLoading] = useState(false);

    // State variables
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [yearsExp, setYearsExp] = useState('1');

    const slideAnim = useRef(new Animated.Value(0)).current;

    const goToStep = (nextStep: number) => {
        const direction = nextStep > step ? -SCREEN_WIDTH : SCREEN_WIDTH;
        Animated.timing(slideAnim, {
            toValue: direction,
            duration: 280,
            useNativeDriver: true,
        }).start(() => {
            setStep(nextStep);
            slideAnim.setValue(-direction);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }).start();
        });
    };

    const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[OnboardingScreen] Camera permission denied');
                return false;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[OnboardingScreen] Gallery permission denied');
                return false;
            }
        }
        return true;
    };

    const handleGallery = async () => {
        const granted = await requestPermission('gallery');
        if (!granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            console.log('[OnboardingScreen] Photo selected from gallery:', result.assets[0].uri);
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleCamera = async () => {
        const granted = await requestPermission('camera');
        if (!granted) return;
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            console.log('[OnboardingScreen] Photo captured from camera:', result.assets[0].uri);
            setPhotoUri(result.assets[0].uri);
        }
    };

    const completeOnboarding = async (updates: Record<string, unknown>) => {
        setFinishLoading(true);
        try {
            const userId = profile?.id;
            if (!userId) throw new Error('No user ID found in profile');

            console.log('[OnboardingScreen] Completing onboarding for:', userId, 'updates:', updates);

            const { data, error } = await supabase
                .from('profiles')
                .update({ ...updates, onboarding_complete: true })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('[OnboardingScreen] Supabase update error:', error.message, error);
                throw error;
            }

            console.log('[OnboardingScreen] Onboarding complete — profile updated:', data);
            setProfile(data as Profile);

        } catch (err: unknown) {
            console.error('[OnboardingScreen] completeOnboarding error:', err);
            if (profile) {
                setProfile({ ...profile, onboarding_complete: true, ...updates } as Profile);
            }
        } finally {
            setFinishLoading(false);
        }
    };

    const handleSkip = async () => {
        console.log('[OnboardingScreen] User skipped onboarding');
        await completeOnboarding({});
    };

    const handleFinish = async () => {
        if (!isAgent) {
            await completeOnboarding({
                location: selectedLocation,
                service_type: selectedCategories.join(', '),
            });
        } else {
            await completeOnboarding({
                specialization: selectedSpecialization,
                gallery: photoUri ? [{ url: photoUri, type: 'image' }] : [],
                bio: bio,
                years_exp: parseInt(yearsExp, 10),
            });
        }
    };

    const canProceed = (): boolean => {
        if (!isAgent) {
            if (step === 0) return selectedLocation !== null;
            if (step === 1) return selectedCategories.length > 0;
        } else {
            if (step === 0) return selectedSpecialization !== null;
            if (step === 1) return true; // Photo is optional but encouraged
            if (step === 2) return bio.trim().length > 10;
        }
        return false;
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    if (!fontsLoaded) return null;

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
                <View className="px-6 pt-4 pb-2">
                    <Text style={styles.progressText}>
                        {step + 1} of {totalSteps}
                    </Text>
                </View>
            </SafeAreaView>

            <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* ── CUSTOMER VIEWS ── */}
                    {!isAgent && step === 0 && (
                        <View>
                            <Text style={styles.title}>Where are you based?</Text>
                            <Text style={styles.subtitle}>We'll show you beauty pros near you</Text>
                            <View style={styles.chipContainer}>
                                {LOCATIONS.map((loc) => (
                                    <TouchableOpacity
                                        key={loc}
                                        onPress={() => setSelectedLocation(loc)}
                                        style={[styles.chip, selectedLocation === loc ? styles.chipSelected : styles.chipUnselected]}
                                    >
                                        <Text style={[styles.chipText, selectedLocation === loc ? styles.chipTextSelected : styles.chipTextUnselected]}>
                                            {loc}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {!isAgent && step === 1 && (
                        <View>
                            <Text style={styles.title}>What do you love?</Text>
                            <Text style={styles.subtitle}>Pick everything that interests you</Text>
                            <View style={styles.chipContainer}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => toggleCategory(cat)}
                                        style={[styles.chip, selectedCategories.includes(cat) ? styles.chipSelected : styles.chipUnselected]}
                                    >
                                        <Text style={[styles.chipText, selectedCategories.includes(cat) ? styles.chipTextSelected : styles.chipTextUnselected]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── AGENT VIEWS ── */}
                    {isAgent && step === 0 && (
                        <View>
                            <Text style={styles.title}>What's your specialization?</Text>
                            <Text style={styles.subtitle}>Pick your primary service</Text>
                            <View style={styles.gridContainer}>
                                {SPECIALIZATIONS.map((spec) => (
                                    <TouchableOpacity
                                        key={spec.label}
                                        onPress={() => setSelectedSpecialization(spec.label)}
                                        style={[styles.card, selectedSpecialization === spec.label ? styles.cardSelected : styles.cardUnselected]}
                                    >
                                        <MaterialIcons
                                            name={spec.icon as any}
                                            size={28}
                                            color={selectedSpecialization === spec.label ? '#FF6289' : '#6C757D'}
                                        />
                                        <Text style={[styles.cardLabel, selectedSpecialization === spec.label ? styles.cardLabelSelected : styles.cardLabelUnselected]}>
                                            {spec.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {isAgent && step === 1 && (
                        <View>
                            <Text style={styles.title}>Show your best work</Text>
                            <Text style={styles.subtitle}>Add a photo so customers can see your skill</Text>

                            <View style={styles.uploadContainer}>
                                {photoUri ? (
                                    <View style={styles.photoPreview}>
                                        <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="cover" />
                                        <TouchableOpacity
                                            onPress={() => setPhotoUri(null)}
                                            style={styles.removeButton}
                                        >
                                            <MaterialIcons name="close" size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.dashedBox}>
                                        <MaterialIcons name="add-photo-alternate" size={40} color="#6C757D" />
                                        <Text style={styles.uploadText}>Tap to add a photo</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row gap-3 mt-4">
                                <TouchableOpacity
                                    onPress={handleGallery}
                                    className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
                                    style={{ backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E9ECEF' }}
                                >
                                    <MaterialIcons name="photo-library" size={20} color="#6C757D" />
                                    <Text style={{ fontFamily: 'DMSans_500Medium', color: '#1A1A1A', fontSize: 14, marginLeft: 8 }}>Gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleCamera}
                                    className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
                                    style={{ backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E9ECEF' }}
                                >
                                    <MaterialIcons name="camera-alt" size={20} color="#6C757D" />
                                    <Text style={{ fontFamily: 'DMSans_500Medium', color: '#1A1A1A', fontSize: 14, marginLeft: 8 }}>Camera</Text>
                                </TouchableOpacity>
                            </View>

                            {!photoUri && (
                                <View className="mt-6 px-2">
                                    <Text style={styles.helperText}>
                                        You can add more photos from your profile after setup. Agents with photos get 3x more bookings.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {isAgent && step === 2 && (
                        <View>
                            <Text style={styles.title}>Tell your story</Text>
                            <Text style={styles.subtitle}>Help customers trust your expertise</Text>

                            <View className="mb-8">
                                <Text style={styles.label}>Years of Experience</Text>
                                <View style={styles.yearsGrid}>
                                    {['1', '2', '3', '5', '8', '10+'].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => setYearsExp(val)}
                                            style={[
                                                styles.yearBtn,
                                                yearsExp === val ? styles.yearBtnSelected : styles.yearBtnUnselected
                                            ]}
                                        >
                                            <Text style={[
                                                styles.yearBtnText,
                                                yearsExp === val ? styles.yearBtnTextSelected : styles.yearBtnTextUnselected
                                            ]}>
                                                {val}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Bio</Text>
                                <View style={styles.bioInputContainer}>
                                    <ThemedTextInput
                                        multiline
                                        numberOfLines={5}
                                        placeholder="I specialize in bridal transformations and editorial looks..."
                                        placeholderTextColor="#ADB5BD"
                                        value={bio}
                                        onChangeText={setBio}
                                        style={styles.bioInput}
                                    />
                                    <View style={styles.charCount}>
                                        <Text style={{ fontSize: 10, color: bio.length > 10 ? '#4ADE80' : '#6C757D', fontFamily: 'DMSans_500Medium' }}>
                                            {bio.length < 10 ? `${10 - bio.length} more characters` : 'Looking good!'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>

            {/* ── Bottom Bar ── */}
            <View
                className="flex-row items-center justify-between px-6"
                style={{ paddingBottom: insets.bottom + 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E9ECEF', backgroundColor: '#FFFFFF' }}
            >
                <TouchableOpacity onPress={handleSkip} style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: '#6C757D', fontSize: 15 }}>Skip</Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: i === step ? 20 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: i === step ? '#FF6289' : i < step ? '#FF8A9D' : '#E9ECEF',
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={step === totalSteps - 1 ? handleFinish : () => goToStep(step + 1)}
                    disabled={!canProceed()}
                    style={{
                        backgroundColor: canProceed() ? '#FF6289' : '#E9ECEF',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 100,
                    }}
                >
                    {finishLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={{
                            fontFamily: 'Montserrat_700Bold',
                            color: canProceed() ? 'white' : '#6C757D',
                            fontSize: 14,
                        }}>
                            {step === totalSteps - 1 ? 'Finish' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    progressText: {
        fontFamily: 'DMSans_400Regular',
        color: '#6C757D',
        fontSize: 13,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'DMSans_400Regular',
        color: '#6C757D',
        marginBottom: 32,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        borderRadius: 100,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    chipUnselected: {
        backgroundColor: '#FFE6EA',
    },
    chipSelected: {
        backgroundColor: '#FF6289',
    },
    chipText: {
        fontSize: 14,
    },
    chipTextUnselected: {
        color: '#FF6289',
        fontFamily: 'DMSans_500Medium',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat_700Bold',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: (SCREEN_WIDTH - 60) / 2,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardUnselected: {
        backgroundColor: '#F8F9FA',
        borderColor: '#E9ECEF',
    },
    cardSelected: {
        backgroundColor: '#FFE6EA',
        borderColor: '#FF6289',
    },
    cardLabel: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    cardLabelUnselected: {
        fontFamily: 'DMSans_500Medium',
        color: '#1A1A1A',
    },
    cardLabelSelected: {
        fontFamily: 'DMSans_700Bold',
        color: '#FF6289',
    },
    uploadContainer: {
        height: 220,
        width: '100%',
        marginBottom: 16,
    },
    dashedBox: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderStyle: 'dashed',
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        marginTop: 8,
        fontFamily: 'DMSans_400Regular',
        color: '#6C757D',
        fontSize: 14,
    },
    photoPreview: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    helperText: {
        fontFamily: 'DMSans_400Regular',
        color: '#6C757D',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    label: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 12,
        color: '#1A1A1A',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    yearsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    yearBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        minWidth: 60,
        alignItems: 'center',
    },
    yearBtnUnselected: {
        borderColor: '#E9ECEF',
        backgroundColor: '#F8F9FA',
    },
    yearBtnSelected: {
        borderColor: '#FF6289',
        backgroundColor: '#FFE6EA',
    },
    yearBtnText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 14,
    },
    yearBtnTextUnselected: {
        color: '#6C757D',
    },
    yearBtnTextSelected: {
        color: '#FF6289',
    },
    bioInputContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E9ECEF',
    },
    bioInput: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 16,
        color: '#1A1A1A',
        height: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
});

export default OnboardingScreen;
