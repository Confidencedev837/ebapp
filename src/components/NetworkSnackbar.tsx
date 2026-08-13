// src/components/NetworkSnackbar.tsx
// Global, self-contained offline indicator.
// Mount this ONCE at the root (RootNavigator) — it listens to NetInfo
// itself and shows/hides the Snackbar automatically everywhere in the app.
import React, { useEffect, useState, useRef } from 'react';
import { Animated, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NetworkState = 'online' | 'offline' | 'back_online';

const NetworkSnackbar: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [networkState, setNetworkState] = useState<NetworkState>('online');
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(200)).current;
    const wasOfflineRef = useRef(false);
    const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Animation helpers ────────────────────────────────────────────────
    const slideIn = () => {
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 130,
        }).start();
    };

    const slideOut = (onDone?: () => void) => {
        Animated.timing(translateY, {
            toValue: 200,
            duration: 280,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            onDone?.();
        });
    };

    // ── NetInfo listener ─────────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const connected = (state.isConnected ?? true) && (state.isInternetReachable !== false);

            if (!connected) {
                // Went offline
                wasOfflineRef.current = true;
                if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
                setNetworkState('offline');
                setVisible(true);
                slideIn();
            } else if (wasOfflineRef.current) {
                // Came back online after being offline
                wasOfflineRef.current = false;
                setNetworkState('back_online');
                setVisible(true);
                slideIn();

                // Auto-dismiss "Back online" after 2.5s
                backOnlineTimerRef.current = setTimeout(() => {
                    slideOut();
                }, 2500);
            }
        });

        return () => {
            unsubscribe();
            if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
        };
    }, []);

    if (!visible) return null;

    const isOffline = networkState === 'offline';
    const bgColor = isOffline ? '#1E293B' : '#16A34A';
    const icon: keyof typeof MaterialIcons.glyphMap = isOffline ? 'wifi-off' : 'wifi';
    const message = isOffline
        ? 'No internet connection'
        : 'Back online';
    const subtext = isOffline
        ? 'Some features may not be available'
        : undefined;

    // Sits above the bottom tab bar (height 68) + safe area bottom
    const bottomOffset = insets.bottom + 68 + 12;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    backgroundColor: bgColor,
                    bottom: bottomOffset,
                    transform: [{ translateY }],
                },
                SHADOWS.md,
            ]}
        >
            {/* Left: icon + text */}
            <View style={styles.left}>
                <View style={[styles.iconWrap, { backgroundColor: isOffline ? '#334155' : '#15803D' }]}>
                    <MaterialIcons name={icon} size={18} color={COLORS.white} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.title}>{message}</Text>
                    {subtext && (
                        <Text style={styles.sub}>{subtext}</Text>
                    )}
                </View>
            </View>

            {/* Right: dismiss (only when offline — persistent but dismissible) */}
            {isOffline && (
                <TouchableOpacity
                    onPress={() => slideOut()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeBtn}
                >
                    <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: RADIUS.lg,
        zIndex: 99999,
        elevation: 20,
    },
    left: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        color: COLORS.white,
        lineHeight: 17,
    },
    sub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 1,
    },
    closeBtn: {
        marginLeft: 8,
        padding: 4,
    },
});

export default NetworkSnackbar;
