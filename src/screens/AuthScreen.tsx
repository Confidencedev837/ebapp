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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_800ExtraBold, Montserrat_700Bold, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { supabase } from '../services/supabase';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type AuthView = 'landing' | 'signup' | 'login';

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
    const [role, setRole] = useState<'customer' | 'agent'>('customer');

    // Form states
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Focus & visibility states
    const [nameFocused, setNameFocused] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

    // Resets form and slides sheet down before switching view
    const switchSheet = (next: AuthView) => {
        setError('');
        setPhone('');
        setPassword('');
        setFullName('');
        setShowPassword(false);
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => setScreen(next));
    };

    const handleSignup = async () => {
        setError('');
        if (!fullName.trim()) { setError('Please enter your full name'); return; }
        if (!phone.trim() || phone.trim().length < 8) { setError('Please enter a valid phone number'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

        setLoading(true);
        try {
            const emailAlias = `${phone.trim().replace(/\D/g, '')}@everythingbeauty.app`;

            console.log('[AuthScreen] Attempting signup for:', emailAlias);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: emailAlias,
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        phone: phone.trim(),
                        user_type: role,
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
                phone: phone.trim(),
                user_type: role,
                verification_status: role === 'agent' ? 'pending' : 'verified',
            });

            if (profileError) {
                console.error('[AuthScreen] Profile upsert error:', profileError.message, profileError);
                throw profileError;
            }

            console.log('[AuthScreen] Profile created successfully');
            // Navigation is handled by RootNavigator watching auth state

        } catch (err: unknown) {
            console.error('[AuthScreen] handleSignup caught error:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setError('');
        if (!phone.trim()) { setError('Please enter your phone number'); return; }
        if (!password.trim()) { setError('Please enter your password'); return; }

        setLoading(true);
        try {
            const emailAlias = `${phone.trim().replace(/\D/g, '')}@everythingbeauty.app`;

            console.log('[AuthScreen] Attempting login for:', emailAlias);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailAlias,
                password,
            });

            if (signInError) {
                console.error('[AuthScreen] Supabase signIn error:', signInError.message, signInError);
                throw signInError;
            }

            console.log('[AuthScreen] Login successful, user:', data.user?.id);
            // Navigation is handled by RootNavigator watching auth state

        } catch (err: unknown) {
            console.error('[AuthScreen] handleLogin caught error:', err);
            if (err instanceof Error) {
                // Show a friendlier message for the common wrong password case
                if (err.message.toLowerCase().includes('invalid login credentials')) {
                    setError('Incorrect phone number or password. Please try again.');
                } else if (err.message.toLowerCase().includes('email not confirmed')) {
                    setError('Please confirm your email before signing in.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded) return null;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Background image — always visible */}
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800' }}
                className="absolute inset-0 w-full h-full"
                contentFit="cover"
            />

            {/* Gradient overlay — lighter for landing, darker for sheets */}
            <LinearGradient
                colors={screen === 'landing'
                    ? ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.82)']
                    : ['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.72)']}
                locations={screen === 'landing' ? [0, 0.25, 0.55, 1] : [0, 1]}
                className="absolute inset-0"
            />

            {/* ── Landing View ── */}
            {screen === 'landing' && (
                <View className="flex-1">
                    <View className="flex-1 items-center justify-center px-8">
                        <Text style={{ color: '#FF6289', fontSize: 36, fontFamily: 'Montserrat_800ExtraBold' }}>
                            everythingbeauty
                        </Text>
                        <Text
                            className="text-center mt-3"
                            style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold' }}
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
                    className="absolute bottom-0 left-0 right-0"
                    style={[
                        {
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            backgroundColor: '#FFFFFF',
                            maxHeight: SCREEN_HEIGHT * 0.92,
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
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                                        className="flex-row p-1 rounded-full mb-7"
                                        style={{ backgroundColor: '#FFE6EA' }}
                                    >
                                        {(['customer', 'agent'] as const).map((r) => (
                                            <TouchableOpacity
                                                key={r}
                                                onPress={() => setRole(r)}
                                                className="flex-1 items-center py-3 rounded-full"
                                                style={role === r ? { backgroundColor: '#FF6289' } : {}}
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        color: role === r ? 'white' : '#FF6289',
                                                        fontFamily: role === r ? 'Montserrat_700Bold' : 'DMSans_500Medium',
                                                    }}
                                                >
                                                    {r === 'customer' ? 'Customer' : 'Beauty Pro'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
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
                                                paddingVertical: Platform.OS === 'ios' ? 14 : 0,
                                            }}
                                        >
                                            <TextInput
                                                className="flex-1"
                                                style={{ color: '#1A1A1A', fontSize: 15, height: 48, fontFamily: 'DMSans_400Regular' }}
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

                                {/* Phone Number */}
                                <Text
                                    className="text-xs mb-2"
                                    style={{ color: '#1A1A1A', fontFamily: 'DMSans_700Bold' }}
                                >
                                    Phone Number
                                </Text>
                                <View
                                    className="flex-row items-center rounded-2xl px-4 mb-5"
                                    style={{
                                        backgroundColor: '#F8F9FA',
                                        borderWidth: 1.5,
                                        borderColor: phoneFocused ? '#FF6289' : '#E9ECEF',
                                        paddingVertical: Platform.OS === 'ios' ? 14 : 0,
                                    }}
                                >
                                    <Text style={{ color: '#1A1A1A', fontSize: 15, marginRight: 8, fontFamily: 'DMSans_700Bold' }}>
                                        +234
                                    </Text>
                                    <View style={{ width: 1, height: 18, backgroundColor: '#E9ECEF', marginRight: 10 }} />
                                    <TextInput
                                        className="flex-1"
                                        style={{ color: '#1A1A1A', fontSize: 15, height: 48, fontFamily: 'DMSans_400Regular' }}
                                        placeholder="08012345678"
                                        placeholderTextColor="#6C757D"
                                        value={phone}
                                        onChangeText={setPhone}
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                        keyboardType="phone-pad"
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
                                        paddingVertical: Platform.OS === 'ios' ? 14 : 0,
                                    }}
                                >
                                    <TextInput
                                        className="flex-1"
                                        style={{ color: '#1A1A1A', fontSize: 15, height: 48, fontFamily: 'DMSans_400Regular' }}
                                        placeholder={screen === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
                                        placeholderTextColor="#6C757D"
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        returnKeyType="done"
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
        </View>
    );
};

export default AuthScreen;