// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AuthScreen from '../screens/AuthScreen';
import AgentProfileScreen from '../screens/AgentProfileScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';
import AgentDashboardScreen from '../screens/AgentDashboardScreen';
import { useUserStore } from '../store/useUserStore';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, loading } = useUserStore();

    if (loading) {
        // You might want a Splash screen here
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={BottomTabNavigator} />
                        <Stack.Screen name="AgentProfile" component={AgentProfileScreen} />
                        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
                        <Stack.Screen name="Booking" component={BookingScreen} />
                        <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} />
                        <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
