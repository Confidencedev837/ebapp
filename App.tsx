// App.tsx - Root of the app. Provides navigation, theme, and safe area context.
import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
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

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer>
                    <ThemedStatusBar />
                    <RootNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}