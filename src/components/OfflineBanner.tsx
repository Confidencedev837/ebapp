// src/components/OfflineBanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { COLORS, FONTS } from '@/constants/theme';

const BANNER_HEIGHT = 44;

const OfflineBanner: React.FC = () => {
    const { isConnected, isInternetReachable } = useNetworkStatus();
    const isOffline = !isConnected || !isInternetReachable;

    const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
    const [isVisible, setIsVisible] = useState(false);
    const [showBackOnline, setShowBackOnline] = useState(false);
    const prevOfflineRef = useRef(false);

    useEffect(() => {
        if (isOffline) {
            // Was previously online → now offline
            prevOfflineRef.current = true;
            setIsVisible(true);
            setShowBackOnline(false);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
                stiffness: 150,
            }).start();
        } else if (prevOfflineRef.current) {
            // Was offline → back online
            prevOfflineRef.current = false;
            setShowBackOnline(true);
            // Keep banner visible briefly showing "Back online"
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
                stiffness: 150,
            }).start(() => {
                // Auto-dismiss after 2.5s
                setTimeout(() => {
                    Animated.timing(translateY, {
                        toValue: -BANNER_HEIGHT,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        setIsVisible(false);
                        setShowBackOnline(false);
                    });
                }, 2500);
            });
        }
    }, [isOffline]);

    if (!isVisible) return null;

    const bgColor = showBackOnline ? COLORS.success : '#1A1A2E';
    const iconName = showBackOnline ? 'wifi' : 'wifi-off';
    const message = showBackOnline ? 'Back online' : 'No internet connection';

    return (
        <Animated.View
            style={[
                styles.banner,
                { backgroundColor: bgColor, transform: [{ translateY }] },
            ]}
        >
            <MaterialIcons name={iconName} size={16} color={COLORS.white} />
            <Text style={styles.text}>{message}</Text>
            {!showBackOnline && (
                <View style={styles.dot} />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        height: BANNER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        // Sits on top — positioned by parent SafeAreaView naturally
        zIndex: 9999,
    },
    text: {
        fontFamily: FONTS.sansMedium,
        fontSize: 13,
        color: COLORS.white,
        letterSpacing: 0.2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6B6B',
        marginLeft: 4,
    },
});

export default OfflineBanner;
