// src/navigation/RootNavigator.tsx - Root routing logic with auth state listener
import React, { useEffect } from 'react';
import { View, Text, AppState, AppStateStatus } from 'react-native';
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
import BrandedSpinner from '@/components/BrandedSpinner';

const Stack = createNativeStackNavigator();

const SplashScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FF6289', fontSize: 32, fontFamily: 'Montserrat_800ExtraBold' }}>
            Everything Beauty
        </Text>
        <View style={{ marginTop: 24 }}>
            <BrandedSpinner size="large" />
        </View>
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

    // Presence heartbeat — updates last_seen so other users see accurate online status.
    // Fires immediately on mount, every 90s while active, and whenever the app
    // returns to foreground from background (AppState change).
    useEffect(() => {
        if (!user?.id) return;

        const updatePresence = async () => {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', user.id);
            } catch (err) {
                console.warn('[RootNavigator] Presence heartbeat failed:', err);
            }
        };

        // Fire immediately on mount
        updatePresence();

        // Regular interval every 90s (online threshold is 4 min = 2.6 heartbeat cycles)
        const interval = setInterval(updatePresence, 90_000);

        // Also fire when app returns to foreground so there is never a
        // stale last_seen from a long background session
        const handleAppState = (nextState: AppStateStatus) => {
            if (nextState === 'active') updatePresence();
        };
        const sub = AppState.addEventListener('change', handleAppState);

        return () => {
            clearInterval(interval);
            sub.remove();
        };
    }, [user?.id]);

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            // Safety timeout: if everything hangs (e.g. Supabase unreachable), stop loading after 10s
            const timeout = setTimeout(() => {
                if (isMounted) {
                    console.warn('[RootNavigator] Session init timed out — stopping loading');
                    setLoading(false);
                }
            }, 10000);

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

                    // Only re-fetch the full profile on genuine sign-in events.
                    // TOKEN_REFRESHED and USER_UPDATED do not require a full profile
                    // re-fetch and calling setLoading(true) here would show the
                    // splash screen mid-session (causing the stuck loading bug after
                    // onboarding completes).
                    const isFreshSignIn = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
                    const alreadyHasProfile = useUserStore.getState().profile !== null;

                    if (isFreshSignIn && !alreadyHasProfile) {
                        await fetchProfile(currentSession.user.id);
                    }

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
