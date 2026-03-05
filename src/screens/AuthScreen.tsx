// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import ThemedTextInput from '@/components/ThemedTextInput';

const AuthScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isLogin, setIsLogin] = useState(true);
    const [userType, setUserType] = useState<'customer' | 'agent'>('customer');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.white }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="px-6"
                >
                    {/* Hero Section */}
                    <View className="items-center py-10">
                        <View className="w-20 h-20 items-center justify-center rounded-3xl" style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}>
                            <MaterialIcons name="auto-awesome" size={40} color="white" />
                        </View>
                        <Text className="text-4xl mt-6" style={{ fontFamily: FONTS.playfairBold, color: isDark ? COLORS.white : COLORS.textDark }}>
                            Everything Beauty
                        </Text>
                        <Text className="text-sm mt-2" style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                            {isLogin ? 'Welcome back, gorgeous!' : 'Join the beauty revolution in Nigeria'}
                        </Text>
                    </View>

                    {/* Role Selection (Only for Signup) */}
                    {!isLogin && (
                        <View className="flex-row mb-8 p-1 rounded-2xl" style={{ backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface }}>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl items-center"
                                style={{ backgroundColor: userType === 'customer' ? COLORS.primary : 'transparent' }}
                                onPress={() => setUserType('customer')}
                            >
                                <Text style={{ fontFamily: FONTS.sansBold, color: userType === 'customer' ? 'white' : COLORS.textMuted }}>Customer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl items-center"
                                style={{ backgroundColor: userType === 'agent' ? COLORS.primary : 'transparent' }}
                                onPress={() => setUserType('agent')}
                            >
                                <Text style={{ fontFamily: FONTS.sansBold, color: userType === 'agent' ? 'white' : COLORS.textMuted }}>Beauty Expert</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Form */}
                    <View className="gap-y-5">
                        {!isLogin && (
                            <View>
                                <Text className="text-xs mb-2 ml-1" style={{ fontFamily: FONTS.sansBold, color: COLORS.textMuted }}>FULL NAME</Text>
                                <View
                                    className="flex-row items-center px-4 py-4 border"
                                    style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.xl, backgroundColor: isDark ? COLORS.surfaceDark : 'white' }}
                                >
                                    <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} />
                                    <ThemedTextInput
                                        className="flex-1 ml-3 text-sm"
                                        placeholder="Enter your full name"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                        style={{ color: isDark ? COLORS.white : COLORS.textDark }}
                                    />
                                </View>
                            </View>
                        )}

                        <View>
                            <Text className="text-xs mb-2 ml-1" style={{ fontFamily: FONTS.sansBold, color: COLORS.textMuted }}>EMAIL ADDRESS</Text>
                            <View
                                className="flex-row items-center px-4 py-4 border"
                                style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.xl, backgroundColor: isDark ? COLORS.surfaceDark : 'white' }}
                            >
                                <MaterialIcons name="mail-outline" size={20} color={COLORS.textMuted} />
                                <ThemedTextInput
                                    className="flex-1 ml-3 text-sm"
                                    placeholder="yourname@gmail.com"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    style={{ color: isDark ? COLORS.white : COLORS.textDark }}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-xs mb-2 ml-1" style={{ fontFamily: FONTS.sansBold, color: COLORS.textMuted }}>PASSWORD</Text>
                            <View
                                className="flex-row items-center px-4 py-4 border"
                                style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border, borderRadius: RADIUS.xl, backgroundColor: isDark ? COLORS.surfaceDark : 'white' }}
                            >
                                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} />
                                <ThemedTextInput
                                    className="flex-1 ml-3 text-sm"
                                    placeholder="Enter secure password"
                                    placeholderTextColor={COLORS.textMuted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    style={{ color: isDark ? COLORS.white : COLORS.textDark }}
                                />
                                <TouchableOpacity>
                                    <MaterialIcons name="visibility-off" size={20} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isLogin && (
                            <TouchableOpacity className="items-end">
                                <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.primary }}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                        className="mt-10 py-5 rounded-3xl items-center"
                        style={[{ backgroundColor: COLORS.primary }, SHADOWS.pink]}
                    >
                        <Text className="text-white text-lg" style={{ fontFamily: FONTS.montserratBold }}>
                            {isLogin ? 'Login' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-xs font-sansMedium" style={{ color: COLORS.textMuted }}>or continue with</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Social Logic */}
                    <View className="flex-row justify-center gap-x-6 pb-10">
                        <TouchableOpacity className="w-14 h-14 items-center justify-center rounded-2xl border" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                            <FontAwesome5 name="google" size={24} color={isDark ? COLORS.white : COLORS.textDark} />
                        </TouchableOpacity>
                        <TouchableOpacity className="w-14 h-14 items-center justify-center rounded-2xl border" style={{ borderColor: isDark ? COLORS.borderDark : COLORS.border }}>
                            <FontAwesome5 name="apple" size={24} color={isDark ? COLORS.white : COLORS.textDark} />
                        </TouchableOpacity>
                    </View>

                    {/* Footer Toggle */}
                    <View className="flex-row justify-center pb-12">
                        <Text style={{ fontFamily: FONTS.sansRegular, color: COLORS.textMuted }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.primary }}>
                                {isLogin ? "Sign Up" : "Login"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AuthScreen;
