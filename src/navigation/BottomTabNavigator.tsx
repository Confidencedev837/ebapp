// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import AgentsScreen from '../screens/AgentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateServiceScreen from '../screens/CreateServiceScreen';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store/useUserStore';
import { getAvatarUrl } from '../services/avatarUtils';

const Tab = createBottomTabNavigator();

// ── Custom "Create" tab button — raised pill ─────────────────────────────
const CreateTabButton = ({ onPress }: { onPress: (e?: any) => void }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.createBtn}
    >
        <View style={[styles.createBtnInner, SHADOWS.pink]}>
            <MaterialIcons name="add" size={28} color={COLORS.white} />
        </View>
    </TouchableOpacity>
);

// ── Avatar tab icon ──────────────────────────────────────────────────────
const AvatarTabIcon = ({ focused }: { focused: boolean }) => {
    const { profile } = useUserStore();
    const avatarUri = getAvatarUrl(profile?.full_name, profile?.avatar_url);

    return (
        <View style={[
            styles.avatarWrapper,
            focused && styles.avatarWrapperActive,
        ]}>
            <Image
                source={{ uri: avatarUri }}
                style={styles.avatarIcon}
                contentFit="cover"
            />
        </View>
    );
};

const BottomTabNavigator = () => {
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const isDark = theme === 'dark';

    const isAgent = profile?.user_type === 'agent';

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: isDark ? '#6C6C6C' : COLORS.textMuted,
                headerShown: false,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: isDark ? '#111111' : COLORS.white,
                    borderTopColor: isDark ? COLORS.borderDark : COLORS.border,
                    borderTopWidth: 1,
                    height: 68,
                    paddingTop: 6,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    marginTop: 2,
                },
            }}
            // Prevent white flash on tab switches in dark mode
            sceneContainerStyle={{
                backgroundColor: isDark ? COLORS.bgDark : COLORS.background,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name={focused ? 'home' : 'home'} color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="Services"
                component={ServicesScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="spa" color={color} size={26} />
                    ),
                }}
            />

            {/* ── Create Tab — visible only for registered Specialists/Agents ── */}
            {isAgent && (
                <Tab.Screen
                    name="Create"
                    component={CreateServiceScreen}
                    options={{
                        tabBarLabel: () => null,
                        tabBarIcon: () => null,
                        tabBarButton: (props) => (
                            <CreateTabButton onPress={() => props.onPress?.({} as any)} />
                        ),
                    }}
                />
            )}

            <Tab.Screen
                name="Agents"
                component={AgentsScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="people" color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="Me"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <AvatarTabIcon focused={focused} />
                    ),
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    createBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20, // raises the button above the tab bar
    },
    createBtnInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    avatarWrapper: {
        width: 30,
        height: 30,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    avatarWrapperActive: {
        borderColor: COLORS.primary,
    },
    avatarIcon: {
        width: '100%',
        height: '100%',
    },
});

export default BottomTabNavigator;
