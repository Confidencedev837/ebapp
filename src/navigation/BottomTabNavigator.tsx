// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import AgentsScreen from '../screens/AgentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: isDark ? COLORS.textMutedDark : COLORS.textMuted,
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: isDark ? COLORS.bgDark : COLORS.white,
                    borderTopColor: isDark ? COLORS.borderDark : COLORS.border,
                    height: 60,
                    paddingTop: 8,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="home" color={color} size={28} />
                    ),
                }}
            />
            <Tab.Screen
                name="Services"
                component={ServicesScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="auto-awesome" color={color} size={28} />
                    ),
                }}
            />
            <Tab.Screen
                name="Agents"
                component={AgentsScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="people" color={color} size={28} />
                    ),
                }}
            />
            <Tab.Screen
                name="Me"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="person" color={color} size={28} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;
