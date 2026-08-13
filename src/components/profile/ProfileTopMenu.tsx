// src/components/profile/ProfileTopMenu.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    StyleSheet,
    Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemeStore } from '@/store/useThemeStore';
import { useUserStore } from '@/store/useUserStore';
import { ThemeMode } from '@/types';
import * as Haptics from 'expo-haptics';

interface ProfileTopMenuProps {
    onOpenSettings: () => void;
    buttonColor?: string;
}

export const ProfileTopMenu: React.FC<ProfileTopMenuProps> = ({ onOpenSettings, buttonColor }) => {
    const [visible, setVisible] = useState(false);
    const { theme, mode } = useTheme();
    const { setThemeMode } = useThemeStore();
    const { signOut } = useUserStore();
    const isDark = theme === 'dark';

    const handleSelectTheme = (selectedMode: ThemeMode) => {
        Haptics.selectionAsync();
        setThemeMode(selectedMode);
        setVisible(false);
    };

    const handleSettingsClick = () => {
        Haptics.selectionAsync();
        setVisible(false);
        onOpenSettings();
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
                        setVisible(false);
                        try {
                            await signOut();
                        } catch (err) {
                            console.error('[ProfileTopMenu] Error signing out:', err);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisible(true);
                }}
                style={[
                    styles.menuBtn,
                    { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.85)' },
                ]}
                activeOpacity={0.8}
            >
                <MaterialIcons name="more-vert" size={22} color={buttonColor || (isDark ? COLORS.white : COLORS.textDark)} />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.backdrop}>
                        <TouchableWithoutFeedback>
                            <View
                                style={[
                                    styles.dropdown,
                                    {
                                        backgroundColor: isDark ? '#1C1C1E' : COLORS.white,
                                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    },
                                    SHADOWS.md,
                                ]}
                            >
                                <Text style={[styles.menuHeader, { color: COLORS.textMuted }]}>
                                    Account & Settings
                                </Text>

                                {/* Full Settings */}
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleSettingsClick}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrap, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                                        <MaterialIcons name="settings" size={18} color={COLORS.primary} />
                                    </View>
                                    <Text style={[styles.menuItemText, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        Edit Profile & Settings
                                    </Text>
                                    <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
                                </TouchableOpacity>

                                {/* Log Out */}
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleLogout}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                        <MaterialIcons name="logout" size={18} color="#EF4444" />
                                    </View>
                                    <Text style={[styles.menuItemText, { color: '#EF4444', fontFamily: FONTS.sansBold }]}>
                                        Log Out
                                    </Text>
                                </TouchableOpacity>

                                <View style={[styles.divider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />

                                <Text style={[styles.menuHeader, { color: COLORS.textMuted }]}>
                                    Theme Preference
                                </Text>

                                {/* Light */}
                                <TouchableOpacity
                                    style={[
                                        styles.menuItem,
                                        mode === ThemeMode.LIGHT && styles.activeItem,
                                    ]}
                                    onPress={() => handleSelectTheme(ThemeMode.LIGHT)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrap, { backgroundColor: mode === ThemeMode.LIGHT ? `${COLORS.primary}20` : (isDark ? '#2C2C2E' : '#F3F4F6') }]}>
                                        <MaterialIcons name="wb-sunny" size={18} color={mode === ThemeMode.LIGHT ? COLORS.primary : COLORS.textMuted} />
                                    </View>
                                    <Text style={[styles.menuItemText, { color: isDark ? COLORS.white : COLORS.textDark, fontFamily: mode === ThemeMode.LIGHT ? FONTS.sansBold : FONTS.sansMedium }]}>
                                        Light Theme
                                    </Text>
                                    {mode === ThemeMode.LIGHT && (
                                        <MaterialIcons name="check" size={18} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>

                                {/* Dark */}
                                <TouchableOpacity
                                    style={[
                                        styles.menuItem,
                                        mode === ThemeMode.DARK && styles.activeItem,
                                    ]}
                                    onPress={() => handleSelectTheme(ThemeMode.DARK)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrap, { backgroundColor: mode === ThemeMode.DARK ? `${COLORS.primary}20` : (isDark ? '#2C2C2E' : '#F3F4F6') }]}>
                                        <MaterialIcons name="nights-stay" size={18} color={mode === ThemeMode.DARK ? COLORS.primary : COLORS.textMuted} />
                                    </View>
                                    <Text style={[styles.menuItemText, { color: isDark ? COLORS.white : COLORS.textDark, fontFamily: mode === ThemeMode.DARK ? FONTS.sansBold : FONTS.sansMedium }]}>
                                        Dark Theme
                                    </Text>
                                    {mode === ThemeMode.DARK && (
                                        <MaterialIcons name="check" size={18} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>

                                {/* System */}
                                <TouchableOpacity
                                    style={[
                                        styles.menuItem,
                                        mode === ThemeMode.SYSTEM && styles.activeItem,
                                    ]}
                                    onPress={() => handleSelectTheme(ThemeMode.SYSTEM)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrap, { backgroundColor: mode === ThemeMode.SYSTEM ? `${COLORS.primary}20` : (isDark ? '#2C2C2E' : '#F3F4F6') }]}>
                                        <MaterialIcons name="settings-brightness" size={18} color={mode === ThemeMode.SYSTEM ? COLORS.primary : COLORS.textMuted} />
                                    </View>
                                    <Text style={[styles.menuItemText, { color: isDark ? COLORS.white : COLORS.textDark, fontFamily: mode === ThemeMode.SYSTEM ? FONTS.sansBold : FONTS.sansMedium }]}>
                                        System Preference
                                    </Text>
                                    {mode === ThemeMode.SYSTEM && (
                                        <MaterialIcons name="check" size={18} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    menuBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    dropdown: {
        width: 250,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    menuHeader: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: RADIUS.md,
        gap: 10,
    },
    activeItem: {
        backgroundColor: 'rgba(255,98,137,0.06)',
    },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemText: {
        flex: 1,
        fontFamily: FONTS.sansMedium,
        fontSize: 13,
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginHorizontal: 8,
    },
});

export default ProfileTopMenu;
