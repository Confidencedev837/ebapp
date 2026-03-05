import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { useUserStore } from './src/store/useUserStore';
import { mockCurrentUser } from './src/data/mock';
import { useFonts } from 'expo-font';
import ThemedStatusBar from './src/components/ThemedStatusBar';

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

export default function App() {
    const { setUser, setProfile, setLoading } = useUserStore();

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

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            setTimeout(() => {
                setUser({ id: mockCurrentUser.id, email: 'customer@example.com' });
                setProfile(mockCurrentUser);
                setLoading(false);
            }, 1000);
        };

        initializeApp();
    }, []);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <ThemedStatusBar />
                <RootNavigator />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}