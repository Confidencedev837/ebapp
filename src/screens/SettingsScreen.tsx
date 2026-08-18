// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemeStore } from '@/store/useThemeStore';
import { useUserStore } from '@/store/useUserStore';
import { getAvatarUrl } from '@/services/avatarUtils';
import { ThemeMode } from '@/types';
import AnimatedSection from '@/components/AnimatedSection';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { themeMode: mode, setThemeMode } = useThemeStore();
    const { profile, signOut } = useUserStore();
    const isDark = theme === 'dark';

    // Settings Toggles
    const [pushNotifs, setPushNotifs] = useState(true);
    const [locationServices, setLocationServices] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(false);

    const avatarUrl = getAvatarUrl(profile?.full_name, profile?.avatar_url);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out of your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (err) {
                            console.error('[SettingsScreen] Error logging out:', err);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const cardBg = isDark ? COLORS.surfaceDark : COLORS.white;
    const borderColor = isDark ? COLORS.borderDark : COLORS.border;
    const textColor = isDark ? COLORS.white : COLORS.textDark;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <AnimatedSection delay={0} direction="down" distance={15} style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: cardBg, borderColor }]}>
                    <Ionicons name="arrow-back" size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </AnimatedSection>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* ── User Profile Card ────────────────────────────────────────────── */}
                <AnimatedSection delay={100} direction="up" distance={25}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.navigate('EditProfile');
                        }}
                        style={[styles.profileCard, { backgroundColor: cardBg, borderColor }, SHADOWS.sm]}
                        activeOpacity={0.85}
                    >
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={[styles.profileName, { color: textColor }]}>
                                {profile?.full_name || 'Beauty User'}
                            </Text>
                            <Text style={[styles.profileEmail, { color: COLORS.textMuted }]}>
                                {profile?.phone || 'Tap to edit your profile details'}
                            </Text>
                            <View style={styles.editBadge}>
                                <Text style={styles.editBadgeTxt}>Edit Profile</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </AnimatedSection>

                {/* ── Theme & Appearance ────────────────────────────────────────────── */}
                <AnimatedSection delay={200} direction="up" distance={25}>
                    <Text style={[styles.sectionTitle, { color: COLORS.textMuted }]}>APPEARANCE</Text>
                    <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
                        {([
                            { key: ThemeMode.LIGHT, label: 'Light Theme', icon: 'wb-sunny' },
                            { key: ThemeMode.DARK, label: 'Dark Theme', icon: 'nights-stay' },
                            { key: ThemeMode.SYSTEM, label: 'System Automatic', icon: 'settings-brightness' },
                        ] as const).map((tItem, i) => (
                            <TouchableOpacity
                                key={tItem.key}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setThemeMode(tItem.key);
                                }}
                                style={[
                                    styles.rowItem,
                                    i > 0 && { borderTopWidth: 1, borderTopColor: borderColor },
                                ]}
                            >
                                <View style={[styles.rowIconWrap, { backgroundColor: mode === tItem.key ? 'rgba(255,98,137,0.15)' : (isDark ? '#2C2C2E' : '#F3F4F6') }]}>
                                    <MaterialIcons name={tItem.icon as any} size={18} color={mode === tItem.key ? COLORS.primary : COLORS.textMuted} />
                                </View>
                                <Text style={[styles.rowLabel, { color: textColor, fontFamily: mode === tItem.key ? FONTS.sansBold : FONTS.sansMedium }]}>
                                    {tItem.label}
                                </Text>
                                {mode === tItem.key && (
                                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </AnimatedSection>

                {/* ── Notifications & Preferences ─────────────────────────────────── */}
                <AnimatedSection delay={300} direction="up" distance={25}>
                    <Text style={[styles.sectionTitle, { color: COLORS.textMuted }]}>PREFERENCES</Text>
                    <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
                        <View style={styles.rowItem}>
                            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(108,99,255,0.12)' }]}>
                                <MaterialIcons name="notifications" size={18} color="#6C63FF" />
                            </View>
                            <Text style={[styles.rowLabel, { color: textColor }]}>Push Notifications</Text>
                            <Switch
                                value={pushNotifs}
                                onValueChange={(val) => {
                                    Haptics.selectionAsync();
                                    setPushNotifs(val);
                                }}
                                trackColor={{ false: '#767577', true: COLORS.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <View style={[styles.rowItem, { borderTopWidth: 1, borderTopColor: borderColor }]}>
                            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                                <MaterialIcons name="place" size={18} color="#10B981" />
                            </View>
                            <Text style={[styles.rowLabel, { color: textColor }]}>Location Services</Text>
                            <Switch
                                value={locationServices}
                                onValueChange={(val) => {
                                    Haptics.selectionAsync();
                                    setLocationServices(val);
                                }}
                                trackColor={{ false: '#767577', true: COLORS.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <View style={[styles.rowItem, { borderTopWidth: 1, borderTopColor: borderColor }]}>
                            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                                <MaterialIcons name="email" size={18} color="#F59E0B" />
                            </View>
                            <Text style={[styles.rowLabel, { color: textColor }]}>Email Marketing</Text>
                            <Switch
                                value={emailNotifs}
                                onValueChange={(val) => {
                                    Haptics.selectionAsync();
                                    setEmailNotifs(val);
                                }}
                                trackColor={{ false: '#767577', true: COLORS.primary }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </AnimatedSection>

                {/* ── Support & Info ──────────────────────────────────────────────── */}
                <AnimatedSection delay={400} direction="up" distance={25}>
                    <Text style={[styles.sectionTitle, { color: COLORS.textMuted }]}>SUPPORT & ABOUT</Text>
                    <View style={[styles.sectionGroup, { backgroundColor: cardBg, borderColor }]}>
                        <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
                            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(0,180,216,0.12)' }]}>
                                <MaterialIcons name="help-outline" size={18} color="#00B4D8" />
                            </View>
                            <Text style={[styles.rowLabel, { color: textColor }]}>Help & Support Center</Text>
                            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.rowItem, { borderTopWidth: 1, borderTopColor: borderColor }]} activeOpacity={0.7}>
                            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(156,163,175,0.12)' }]}>
                                <MaterialIcons name="lock-outline" size={18} color="#9CA3AF" />
                            </View>
                            <Text style={[styles.rowLabel, { color: textColor }]}>Privacy Policy & Terms</Text>
                            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                </AnimatedSection>

                {/* ── Log Out Button ──────────────────────────────────────────────── */}
                <AnimatedSection delay={500} direction="up" distance={25}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={[styles.logoutBtn, SHADOWS.sm]}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                        <Text style={styles.logoutTxt}>Log Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.appVerTxt}>Everything Beauty v1.0.4</Text>
                </AnimatedSection>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.screen,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 22,
    },
    scrollContent: {
        paddingHorizontal: SPACING.screen,
        paddingTop: 12,
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        marginBottom: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    profileName: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
    },
    profileEmail: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        marginTop: 2,
    },
    editBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,98,137,0.12)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
        marginTop: 6,
    },
    editBadgeTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
        color: COLORS.primary,
    },
    sectionTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 4,
    },
    sectionGroup: {
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        marginBottom: 24,
        overflow: 'hidden',
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    rowIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    rowLabel: {
        flex: 1,
        fontFamily: FONTS.sansMedium,
        fontSize: 14,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: RADIUS.full,
        paddingVertical: 14,
        gap: 8,
        marginTop: 8,
    },
    logoutTxt: {
        fontFamily: FONTS.sansBold,
        fontSize: 15,
        color: '#EF4444',
    },
    appVerTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 16,
    },
});

export default SettingsScreen;
