// src/navigation/RootNavigator.tsx - Root routing logic with auth state listener
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/useUserStore';
import { Profile } from '../types';
import AuthScreen from '@/screens/AuthScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ServiceDetailScreen from '@/screens/ServiceDetailScreen';
import AgentProfileScreen from '@/screens/AgentProfileScreen';
import AgentDashboardScreen from '@/screens/AgentDashboardScreen';
import CustomerDashboardScreen from '@/screens/CustomerDashboardScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

const SplashScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FF6289', fontSize: 32, fontFamily: 'Montserrat_800ExtraBold' }}>
            everythingbeauty
        </Text>
        <ActivityIndicator color="#FF6289" size="small" style={{ marginTop: 20 }} />
    </View>
);

const RootNavigator = () => {
    const { user, profile, loading, setUser, setProfile, setLoading } = useUserStore();

    const [fontsLoaded] = useFonts({
        Montserrat_800ExtraBold,
    });

    const onboardingComplete = profile?.onboarding_complete ?? false;
    const userType = profile?.user_type;
    const session = user !== null;

    const fetchProfile = async (userId: string) => {
        try {
            console.log('[RootNavigator] Fetching profile for:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, user_type, onboarding_complete, full_name, avatar_url, phone, location, specialization, verification_status')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('[RootNavigator] Profile fetch failed (possibly offline):', error.message);
                return;
            }

            console.log('[RootNavigator] Profile loaded:', data.user_type, 'onboarded:', data.onboarding_complete);
            setProfile(data as Profile);
        } catch (err) {
            console.error('[RootNavigator] fetchProfile unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            console.log('[RootNavigator] Initial session:', currentSession?.user?.id ?? 'none');
            if (!isMounted) return;

            if (currentSession) {
                setUser(currentSession.user);
                await fetchProfile(currentSession.user.id);
            } else {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('[RootNavigator] Auth event:', event, currentSession?.user?.id ?? 'none');
                if (!isMounted) return;

                if (currentSession) {
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    console.log('[RootNavigator] User signed out — cleared store');
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    if (loading || !fontsLoaded) return <SplashScreen />;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            {!session ? (
                <Stack.Screen name="Auth" component={AuthScreen} />
            ) : !onboardingComplete ? (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
                <>
                    <Stack.Screen name="MainApp" component={BottomTabNavigator} />
                    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
                    <Stack.Screen name="AgentProfile" component={AgentProfileScreen} />
                    <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} />
                    <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;
