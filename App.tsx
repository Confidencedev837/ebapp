// App.tsx - Root of the app. Provides navigation, theme, and safe area context.
import './global.css';
import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
    Montserrat_400Regular,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { ThemeProvider } from './src/context/ThemeContext';
import ThemedStatusBar from './src/components/ThemedStatusBar';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef, navigateTo } from './src/navigation/navigationRef';

export default function App() {
    const [fontsLoaded] = useFonts({
        Montserrat_400Regular,
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
        PlayfairDisplay_400Regular_Italic,
        PlayfairDisplay_700Bold,
    });

    // --- Notification Tap (CTA) Listener ---
    useEffect(() => {
        // Fires when the user taps a notification banner (foreground, background, or killed state)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data as Record<string, any>;

            if (!data?.screen) return;

            const { screen, params } = data;

            // Delay navigation slightly to ensure the navigator is ready after app resume
            setTimeout(() => {
                navigateTo(screen, params);
            }, 500);
        });

        return () => subscription.remove();
    }, []);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer ref={navigationRef}>
                    <ThemedStatusBar />
                    <RootNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}