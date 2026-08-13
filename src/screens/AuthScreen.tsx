// src/screens/AuthScreen.tsx - Single source of truth for auth logic and UI view management
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Modal,
    FlatList,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_800ExtraBold, Montserrat_700Bold, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';
import Snackbar from '../components/Snackbar';

const SCREEN_HEIGHT = Dimensions.get('window').height;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AuthView = 'landing' | 'signup' | 'login';
type Role = 'customer' | 'agent';

// ── Static option sets ──────────────────────────────────────────────
const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
    'Zamfara', 'FCT (Abuja)',
].map((s) => ({ label: s, value: s }));

const SPECIALIZATIONS = [
    'Hair Styling', 'Braiding & Locs', 'Makeup Artistry', 'Nail Technician',
    'Lash & Brow Technician', 'Barbering', 'Skincare & Facials', 'Spa & Massage Therapy',
    'Waxing', 'Bridal Beauty',
].map((s) => ({ label: s, value: s }));

const EXPERIENCE_RANGES = [
    { label: 'Less than 1 year', value: '<1' },
    { label: '1–2 years', value: '1-2' },
    { label: '3–5 years', value: '3-5' },
    { label: '6–10 years', value: '6-10' },
    { label: '10+ years', value: '10+' },
];

type SelectOption = { label: string; value: string };

const SLIDESHOW_IMAGES = [
   "https://anaiviacademy.com/wp-content/uploads/2023/08/20230815182432_fpdl.in_female-hairdresser-makes-bride-hairstyle_118086-3478_large.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS768tof-DwuD7JR8li7yBx4eqh3JLQAHqOadMVYI3YA&s=10",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS768tof-DwuD7JR8li7yBx4eqh3JLQAHqOadMVYI3YA&s=10",
]

// ── Reusable bottom-sheet select field ──────────────────────────────
// Native RN has no <select>; this renders a tappable field that opens
// a modal sheet with the option list (optionally searchable).
const SelectField = ({
    label,
    icon,
    placeholder,
    value,
    options,
    onChange,
    searchable = false,
}: {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    placeholder: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    searchable?: boolean;
}) => {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState('');

    const selected = options.find((o) => o.value === value);
    const filtered = searchable
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const close = () => {
        setVisible(false);
        setQuery('');
    };

    return (
        <>
            <Text className="text-xs mb-2" style={{ color: '#1A1A1A', fontFamily: 'DMSans_700Bold' }}>
                {label}
            </Text>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                activeOpacity={0.75}
                className="flex-row items-center rounded-2xl px-4 mb-5"
                style={{
                    backgroundColor: '#F8F9FA',
                    borderWidth: 1.5,
                    borderColor: '#E9ECEF',
                    height: 52,
                }}
            >
                <MaterialIcons name={icon} size={18} color="#FF6289" style={{ marginRight: 10 }} />
                <Text
                    className="flex-1"
                    style={{
                        fontSize: 15,
                        color: selected ? '#1A1A1A' : '#6C757D',
                        fontFamily: selected ? 'DMSans_500Medium' : 'DMSans_400Regular',
                    }}
                    numberOfLines={1}
                >
                    {selected ? selected.label : placeholder}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={22} color="#6C757D" />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
                <View style={{ flex: 1, backgroundColor: 'rgba(20,8,14,0.55)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        activeOpacity={1}
                        onPress={close}
                    />
                    <View
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            maxHeight: SCREEN_HEIGHT * 0.65,
                            paddingBottom: insets.bottom + 16,
                        }}
                    >
                        <View className="self-center w-10 h-1 rounded-full bg-gray-200 mt-3 mb-4" />

                        <View className="flex-row items-center justify-between px-6 mb-3">
                            <Text style={{ fontSize: 17, color: '#1A1A1A', fontFamily: 'Montserrat_700Bold' }}>
                                {label}
                            </Text>
                            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialIcons name="close" size={20} color="#6C757D" />
                            </TouchableOpacity>
                        </View>

                        {searchable && (
                            <View
                                className="flex-row items-center rounded-2xl px-4 mx-6 mb-3"
                                style={{ backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E9ECEF', height: 46 }}
                            >
                                <MaterialIcons name="search" size={18} color="#6C757D" style={{ marginRight: 8 }} />
                                <TextInput
                                    className="flex-1"
                                    style={{ fontSize: 14, color: '#1A1A1A', fontFamily: 'DMSans_400Regular' }}
                                    placeholder="Search"
                                    placeholderTextColor="#6C757D"
                                    value={query}
                                    onChangeText={setQuery}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <FlatList
                            data={filtered}
                            keyExtractor={(item) => item.value}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <Text
                                    className="text-center py-6"
                                    style={{ color: '#6C757D', fontFamily: 'DMSans_400Regular', fontSize: 14 }}
                                >
                                    No matches found
                                </Text>
                            }
                            renderItem={({ item }) => {
                                const isSelected = item.value === value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onChange(item.value);
                                            close();
                                        }}
                                        activeOpacity={0.7}
                                        className="flex-row items-center justify-between px-6"
                                        style={{ paddingVertical: 14 }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                color: isSelected ? '#FF6289' : '#1A1A1A',
                                                fontFamily: isSelected ? 'DMSans_700Bold' : 'DMSans_400Regular',
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                        {isSelected && <MaterialIcons name="check" size={18} color="#FF6289" />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const AuthScreen = () => {
    const [fontsLoaded] = useFonts({
        Montserrat_800ExtraBold,
        Montserrat_700Bold,
        Montserrat_400Regular,
        PlayfairDisplay_700Bold,
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
    });

    const insets = useSafeAreaInsets();
    const [screen, setScreen] = useState<AuthView>('landing');
    const [role, setRole] = useState<Role>('customer');

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [yearsExperience, setYearsExperience] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [stateOfResidence, setStateOfResidence] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({
        visible: false,
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    // Focus & visibility states
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [roleToggleWidth, setRoleToggleWidth] = useState(0);
    const roleAnim = useRef(new Animated.Value(role === 'customer' ? 0 : 1)).current;
    const [activeSlide, setActiveSlide] = useState(0);
    const [previousSlide, setPreviousSlide] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (screen === 'signup' || screen === 'login') {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 22,
                stiffness: 180,
            }).start();
        }
    }, [screen]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((current) => {
                const next = (current + 1) % SLIDESHOW_IMAGES.length;
                setPreviousSlide(current);
                fadeAnim.setValue(0);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }).start();
                return next;
            });
        }, 6500);

        return () => clearInterval(interval);
    }, []);

    // Resets form and slides sheet down before switching view
    const switchSheet = (next: AuthView) => {
        setError('');
        setEmail('');
        setPassword('');
        setFullName('');
        setYearsExperience('');
        setSpecialization('');
        setStateOfResidence('');
        setShowPassword(false);
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => setScreen(next));
    };

    const selectRole = (r: Role) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setError('');
        Animated.spring(roleAnim, {
            toValue: r === 'customer' ? 0 : 1,
            useNativeDriver: true,
            damping: 18,
            stiffness: 200,
        }).start();
        setRole(r);
    };

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

    const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ visible: true, message, type });
    };

    const hideSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, visible: false }));
    };

    const triggerHaptic = async (kind: 'success' | 'warning' | 'error' = 'error') => {
        try {
            if (kind === 'success') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (kind === 'warning') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch {
            // Ignore haptics support issues on unsupported devices
        }
    };

    const showAuthFeedback = async (message: string, type: 'success' | 'error' | 'info' = 'error', haptic: 'success' | 'warning' | 'error' = 'error') => {
        setError(message);
        showSnackbar(message, type);
        await triggerHaptic(haptic);
    };

    const getAuthErrorMessage = (err: unknown, fallback: string) => {
        if (err instanceof Error) {
            const lower = err.message.toLowerCase();
            if (lower.includes('invalid login credentials') || lower.includes('incorrect') || lower.includes('password')) {
                return 'Incorrect email or password. Please try again.';
            }
            if (lower.includes('email not confirmed')) {
                return 'Please confirm your email before signing in.';
            }
            if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('offline') || lower.includes('request failed')) {
                return 'No internet connection. Please check your connection and try again.';
            }
            return err.message;
        }
        return fallback;
    };

    const handleSignup = async () => {
        setError('');
        if (!fullName.trim()) {
            void showAuthFeedback('Please enter your full name', 'info', 'warning');
            return;
        }
        if (!isValidEmail(email)) {
            void showAuthFeedback('Please enter a valid email address', 'info', 'warning');
            return;
        }
        if (password.length < 8) {
            void showAuthFeedback('Password must be at least 8 characters', 'info', 'warning');
            return;
        }
        if (role === 'agent') {
            if (!yearsExperience) {
                void showAuthFeedback('Please select your years of experience', 'info', 'warning');
                return;
            }
            if (!specialization) {
                void showAuthFeedback('Please select your specialization', 'info', 'warning');
                return;
            }
            if (!stateOfResidence) {
                void showAuthFeedback('Please select your state', 'info', 'warning');
                return;
            }
        }

        setLoading(true);
        try {
            const trimmedEmail = email.trim().toLowerCase();

            console.log('[AuthScreen] Attempting signup for:', trimmedEmail);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: trimmedEmail,
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        user_type: role,
                        ...(role === 'agent' && {
                            years_experience: yearsExperience,
                            specialization,
                            state: stateOfResidence,
                        }),
                    },
                },
            });

            if (signUpError) {
                console.error('[AuthScreen] Supabase signUp error:', signUpError.message, signUpError);
                throw signUpError;
            }

            if (!data.user) {
                console.error('[AuthScreen] signUp returned no user — data:', data);
                throw new Error('Account creation failed. Please try again.');
            }

            console.log('[AuthScreen] User created:', data.user.id);

            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName.trim(),
                email: trimmedEmail,
                user_type: role,
                verification_status: role === 'agent' ? 'pending' : 'verified',
                ...(role === 'agent' && {
                    years_experience: yearsExperience,
                    specialization,
                    state: stateOfResidence,
                }),
            });

            if (profileError) {
                console.error('[AuthScreen] Profile upsert error:', profileError.message, profileError);
                throw profileError;
            }

            console.log('[AuthScreen] Profile created successfully');
            await showAuthFeedback('Account created successfully. Please check your inbox.', 'success', 'success');
            // Navigation is handled by RootNavigator watching auth state

        } catch (err: unknown) {
            console.error('[AuthScreen] handleSignup caught error:', err);
            const message = getAuthErrorMessage(err, 'Something went wrong. Please try again.');
            await showAuthFeedback(message, 'error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setError('');
        if (!isValidEmail(email)) {
            void showAuthFeedback('Please enter a valid email address', 'info', 'warning');
            return;
        }
        if (!password.trim()) {
            void showAuthFeedback('Please enter your password', 'info', 'warning');
            return;
        }

        setLoading(true);
        try {
            const trimmedEmail = email.trim().toLowerCase();

            console.log('[AuthScreen] Attempting login for:', trimmedEmail);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });

            if (signInError) {
                console.error('[AuthScreen] Supabase signIn error:', signInError.message, signInError);
                throw signInError;
            }

            console.log('[AuthScreen] Login successful, user:', data.user?.id);
            await showAuthFeedback('Signed in successfully.', 'success', 'success');
            // Navigation is handled by RootNavigator watching auth state

        } catch (err: unknown) {
            console.error('[AuthScreen] handleLogin caught error:', err);
            const message = getAuthErrorMessage(err, 'Something went wrong. Please try again.');
            await showAuthFeedback(message, 'error', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded) return null;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <Animated.Image
                source={{ uri: SLIDESHOW_IMAGES[previousSlide] }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                resizeMode="cover"
                blurRadius={2}
            />
            <Animated.Image
                source={{ uri: SLIDESHOW_IMAGES[activeSlide] }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: fadeAnim }}
                resizeMode="cover"
            />

            {/* Gradient overlay — a subtle brand background without the image grid */}
            <LinearGradient
                colors={screen === 'landing'
                    ? ['rgba(20,8,14,0.60)', 'rgba(20,8,14,0.18)', 'rgba(20,8,14,0.18)', 'rgba(20,8,14,0.88)']
                    : ['rgba(20,8,14,0.80)', 'rgba(20,8,14,0.80)']}
                locations={screen === 'landing' ? [0, 0.25, 0.55, 1] : [0, 1]}
                className="absolute inset-0"
            />

            {/* ── Landing View ── */}
            {screen === 'landing' && (
                <View className="flex-1">
                    <View className="flex-1 items-center justify-center px-8">
                        <Text
                            style={{
                                textAlign: 'center',
                                color: '#FF6289',
                                fontSize: 47,
                                fontFamily: 'PlayfairDisplay_700Bold',
                                letterSpacing: 1.8,
                            }}
                        >
                            Everything 
                              Beauty
                        </Text>
                        <Text
                            className="text-center mt-3"
                            style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, fontFamily: 'DMSans_500Medium' }}
                        >
                            Top beauty professionals,{'\n'}at your door.
                        </Text>
                    </View>

                    <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
                        <TouchableOpacity
                            onPress={() => setScreen('signup')}
                            className="w-full items-center py-5 rounded-full"
                            style={{
                                backgroundColor: '#FF6289',
                                shadowColor: '#FF6289',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.38,
                                shadowRadius: 16,
                                elevation: 8,
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Montserrat_700Bold' }}>
                                Get Started
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setScreen('login')}
                            className="w-full items-center py-4 rounded-full mt-3"
                            style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' }}
                            activeOpacity={0.75}
                        >
                            <Text style={{ color: 'white', fontSize: 15, fontFamily: 'DMSans_500Medium' }}>
                                I already have an account
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Signup / Login Sheet ── */}
            {(screen === 'signup' || screen === 'login') && (
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: SCREEN_HEIGHT * 0.6789,
                            borderTopLeftRadius: 38,
                            borderTopRightRadius: 38,
                            backgroundColor: '#FFFFFF',
                            
                        },
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Close button */}
                    <TouchableOpacity
                        onPress={() => switchSheet('landing')}
                        className="absolute top-4 right-5 z-10 p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="close" size={22} color="#6C757D" />
                    </TouchableOpacity>

                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior="padding"
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: insets.bottom + 24 }}
                        >
                            <View className="px-6 pt-3 pb-2">

                                {/* Drag handle */}
                                <View className="self-center w-10 h-1 rounded-full bg-gray-200 mb-6" />

                                {/* Title */}
                                <Text
                                    className="text-2xl mb-1"
                                    style={{ color: '#1A1A1A', fontFamily: 'Montserrat_700Bold' }}
                                >
                                    {screen === 'signup' ? 'Create Account' : 'Welcome back'}
                                </Text>

                                {/* Subtitle */}
                                <Text
                                    className="text-sm mb-7"
                                    style={{ color: '#6C757D', fontFamily: 'DMSans_400Regular' }}
                                >
                                    {screen === 'signup'
                                        ? 'Join thousands of beauty lovers in Lagos'
                                        : 'Sign in to your account'}
                                </Text>

                                {/* Role Toggle — signup only */}
                                {screen === 'signup' && (
                                    <View
                                        className="flex-row p-1 mb-7"
                                        style={{ backgroundColor: '#FFE6EA', borderRadius: 999, overflow: 'hidden' }}
                                        onLayout={(event) => setRoleToggleWidth(event.nativeEvent.layout.width)}
                                    >
                                        <Animated.View
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: roleToggleWidth / 2,
                                                height: '100%',
                                                backgroundColor: '#FF6289',
                                                borderRadius: 999,
                                                transform: [
                                                    {
                                                        translateX: roleAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, roleToggleWidth / 2],
                                                        }),
                                                    },
                                                ],
                                            }}
                                        />
                                        {(['customer', 'agent'] as const).map((r) => {
                                            const isSelected = role === r;
                                            return (
                                                <TouchableOpacity
                                                    key={r}
                                                    onPress={() => selectRole(r)}
                                                    className="flex-1 items-center py-3"
                                                    activeOpacity={0.8}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            color: isSelected ? 'white' : '#FF6289',
                                                            fontFamily: isSelected ? 'Montserrat_700Bold' : 'DMSans_500Medium',
                                                        }}
                                                    >
                                                        {r === 'customer' ? 'Customer' : 'Beauty Pro'}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Full Name — signup only */}
                                {screen === 'signup' && (
                                    <>
                                        <Text
                                            className="text-xs mb-2"
                                            style={{ color: '#1A1A1A', fontFamily: 'DMSans_700Bold' }}
                                        >
                                            Full Name
                                        </Text>
                                        <View
                                            className="flex-row items-center rounded-2xl px-4 mb-5"
                                            style={{
                                                backgroundColor: '#F8F9FA',
                                                borderWidth: 1.5,
                                                borderColor: nameFocused ? '#FF6289' : '#E9ECEF',
                                                height: 52,
                                            }}
                                        >
                                            <MaterialIcons name="person-outline" size={18} color="#FF6289" style={{ marginRight: 10 }} />
                                            <TextInput
                                                className="flex-1"
                                                style={{ color: '#1A1A1A', fontSize: 15, fontFamily: 'DMSans_400Regular' }}
                                                placeholder="Adaeze Okonkwo"
                                                placeholderTextColor="#6C757D"
                                                value={fullName}
                                                onChangeText={setFullName}
                                                onFocus={() => setNameFocused(true)}
                                                onBlur={() => setNameFocused(false)}
                                                autoCapitalize="words"
                                                returnKeyType="next"
                                            />
                                        </View>
                                    </>
                                )}

                                {/* Email */}
                                <Text
                                    className="text-xs mb-2"
                                    style={{ color: '#1A1A1A', fontFamily: 'DMSans_700Bold' }}
                                >
                                    Email
                                </Text>
                                <View
                                    className="flex-row items-center rounded-2xl px-4 mb-5"
                                    style={{
                                        backgroundColor: '#F8F9FA',
                                        borderWidth: 1.5,
                                        borderColor: emailFocused ? '#FF6289' : '#E9ECEF',
                                        height: 52,
                                    }}
                                >
                                    <MaterialIcons name="mail-outline" size={18} color="#FF6289" style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="flex-1"
                                        style={{ color: '#1A1A1A', fontSize: 15, fontFamily: 'DMSans_400Regular' }}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#6C757D"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                    />
                                </View>

                                {/* Password */}
                                <Text
                                    className="text-xs mb-2"
                                    style={{ color: '#1A1A1A', fontFamily: 'DMSans_700Bold' }}
                                >
                                    Password
                                </Text>
                                <View
                                    className="flex-row items-center rounded-2xl px-4 mb-5"
                                    style={{
                                        backgroundColor: '#F8F9FA',
                                        borderWidth: 1.5,
                                        borderColor: passwordFocused ? '#FF6289' : '#E9ECEF',
                                        height: 52,
                                    }}
                                >
                                    <MaterialIcons name="lock-outline" size={18} color="#FF6289" style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="flex-1"
                                        style={{ color: '#1A1A1A', fontSize: 15, fontFamily: 'DMSans_400Regular' }}
                                        placeholder={screen === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
                                        placeholderTextColor="#6C757D"
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        returnKeyType={screen === 'signup' && role === 'agent' ? 'next' : 'done'}
                                        onSubmitEditing={screen === 'signup' ? handleSignup : handleLogin}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(v => !v)}
                                        className="ml-2 p-1"
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color="#6C757D"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Professional Details — beauty pro signup only */}
                                {screen === 'signup' && role === 'agent' && (
                                    <>
                                        <Text
                                            className="text-xs mb-3 mt-1"
                                            style={{ color: '#FF6289', fontFamily: 'DMSans_700Bold', letterSpacing: 0.5 }}
                                        >
                                            PROFESSIONAL DETAILS
                                        </Text>

                                        <SelectField
                                            label="Years of Experience"
                                            icon="work-outline"
                                            placeholder="Select a range"
                                            value={yearsExperience}
                                            options={EXPERIENCE_RANGES}
                                            onChange={setYearsExperience}
                                        />

                                        <SelectField
                                            label="Specialization"
                                            icon="palette"
                                            placeholder="Select your specialty"
                                            value={specialization}
                                            options={SPECIALIZATIONS}
                                            onChange={setSpecialization}
                                        />

                                        <SelectField
                                            label="State"
                                            icon="location-on"
                                            placeholder="Select your state"
                                            value={stateOfResidence}
                                            options={NIGERIAN_STATES}
                                            onChange={setStateOfResidence}
                                            searchable
                                        />
                                    </>
                                )}

                                {/* Inline error */}
                                {error.length > 0 && (
                                    <View className="flex-row items-center mb-4 px-1">
                                        <MaterialIcons name="error-outline" size={15} color="#FF3B30" />
                                        <Text
                                            className="text-xs ml-2 flex-1"
                                            style={{ color: '#FF3B30', fontFamily: 'DMSans_400Regular' }}
                                        >
                                            {error}
                                        </Text>
                                    </View>
                                )}

                                {/* CTA Button */}
                                <TouchableOpacity
                                    onPress={screen === 'signup' ? handleSignup : handleLogin}
                                    disabled={loading}
                                    className="w-full items-center justify-center py-5 rounded-full mt-2"
                                    style={{
                                        backgroundColor: loading ? 'rgba(255,98,137,0.7)' : '#FF6289',
                                        shadowColor: '#FF6289',
                                        shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.35,
                                        shadowRadius: 14,
                                        elevation: 8,
                                    }}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Montserrat_700Bold' }}>
                                            {screen === 'signup' ? 'Create Account' : 'Sign In'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Forgot password — login only */}
                                {screen === 'login' && (
                                    <TouchableOpacity className="items-center mt-5">
                                        <Text style={{ color: '#6C757D', fontSize: 13, fontFamily: 'DMSans_400Regular' }}>
                                            Forgot password?
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Switch between signup and login */}
                                <View className="flex-row items-center justify-center mt-5">
                                    <Text style={{ color: '#6C757D', fontSize: 14, fontFamily: 'DMSans_400Regular' }}>
                                        {screen === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => switchSheet(screen === 'signup' ? 'login' : 'signup')}
                                    >
                                        <Text style={{ color: '#FF6289', fontSize: 14, fontFamily: 'DMSans_700Bold' }}>
                                            {screen === 'signup' ? 'Sign In' : 'Create one'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            )}

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                duration={3200}
                onDismiss={hideSnackbar}
            />
        </View>
    );
};

export default AuthScreen;