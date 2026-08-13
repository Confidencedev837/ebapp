// src/navigation/RootNavigator.tsx - Root routing logic with auth state listener
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../services/supabase';
import { fetchCurrentProfile } from '../services/api/profilesApi';
import { useUserStore } from '../store/useUserStore';
import { Profile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/theme';
import AuthScreen from '@/screens/AuthScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ServiceDetailScreen from '@/screens/ServiceDetailScreen';
import AgentProfileScreen from '@/screens/AgentProfileScreen';
import AgentDashboardScreen from '@/screens/AgentDashboardScreen';
import CustomerDashboardScreen from '@/screens/CustomerDashboardScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import CreateServiceScreen from '@/screens/CreateServiceScreen';
import BookingScreen from '@/screens/BookingScreen';
import BookingDetailScreen from '@/screens/BookingDetailScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import NetworkSnackbar from '@/components/NetworkSnackbar';
import { registerForPushNotificationsAsync } from '@/services/notificationService';

const Stack = createNativeStackNavigator();

const SplashScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FF6289', fontSize: 32, fontFamily: 'Montserrat_800ExtraBold' }}>
            Everything Beauty
        </Text>
        <ActivityIndicator color="#ee4670" size="large" style={{ marginTop: 20 }} />
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
            // Uses profilesApi which has AsyncStorage cache + stale fallback for offline support
            const data = await fetchCurrentProfile(userId);

            if (!data) {
                console.warn('[RootNavigator] No profile found for user (online or cache)');
                setLoading(false);
                return;
            }

            console.log('[RootNavigator] Profile loaded:', data.user_type, 'onboarded:', data.onboarding_complete);
            setProfile(data as Profile);
            registerForPushNotificationsAsync(userId);
        } catch (err) {
            console.warn('[RootNavigator] fetchProfile error (offline with no cache):', err);
        } finally {
            setLoading(false);
        }
    };

    // Heartbeat to update last_seen online presence
    useEffect(() => {
        if (!user?.id) return;

        const updatePresence = async () => {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', user.id);
            } catch (err) {
                console.warn('[RootNavigator] Failed to update presence heartbeat:', err);
            }
        };

        updatePresence();
        const interval = setInterval(updatePresence, 120000); // every 2 minutes
        return () => clearInterval(interval);
    }, [user?.id]);

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            // Safety timeout: if everything hangs (e.g. Supabase unreachable), stop loading after 6s
            const timeout = setTimeout(() => {
                if (isMounted) {
                    console.warn('[RootNavigator] Session init timed out — stopping loading');
                    setLoading(false);
                }
            }, 6000);

            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                console.log('[RootNavigator] Initial session:', currentSession?.user?.id ?? 'none');
                if (!isMounted) return;

                if (currentSession) {
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('[RootNavigator] initSession error:', err);
                if (isMounted) setLoading(false);
            } finally {
                clearTimeout(timeout);
            }
        };

        initSession();

        let profileChannel: any = null;

        const subscribeToProfile = (userId: string) => {
            if (profileChannel) {
                profileChannel.unsubscribe();
            }
            
            console.log('[RootNavigator] Subscribing to realtime updates for profile:', userId);
            profileChannel = supabase
                .channel(`public:profiles:id=eq.${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${userId}`,
                    },
                    (payload) => {
                        console.log('[RootNavigator] Realtime profile update received:', payload.new);
                        setProfile(payload.new as Profile);
                    }
                )
                .subscribe();
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('[RootNavigator] Auth event:', event, currentSession?.user?.id ?? 'none');
                if (!isMounted) return;

                if (currentSession) {
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id);
                    subscribeToProfile(currentSession.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    if (profileChannel) {
                        profileChannel.unsubscribe();
                        profileChannel = null;
                    }
                    console.log('[RootNavigator] User signed out — cleared store');
                }
            }
        );

        // Subscribe to initial session if it exists
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession?.user?.id && isMounted) {
                subscribeToProfile(currentSession.user.id);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (profileChannel) {
                profileChannel.unsubscribe();
            }
        };
    }, []);

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const cardBg = isDark ? COLORS.bgDark : COLORS.background;

    if (loading || !fontsLoaded) return <SplashScreen />;

    return (
        <View style={{ flex: 1, backgroundColor: cardBg }}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    // No navigator-level animation — our useScreenAnimation handles it
                    animation: 'none',
                    contentStyle: { backgroundColor: cardBg },
                }}
            >
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
                        <Stack.Screen name="CreateService" component={CreateServiceScreen} />
                        <Stack.Screen name="Booking" component={BookingScreen} />
                        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </>
                )}
            </Stack.Navigator>

            {/* Global offline snackbar — visible across all screens */}
            <NetworkSnackbar />
        </View>
    );
};

export default RootNavigator;
