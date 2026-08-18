// src/components/OnlineIndicator.tsx
// Animated pulsing green dot — clearly communicates live online status.
// Shows nothing when the agent is offline (returns null).
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { COLORS } from '@/constants/theme';
import { isOnline } from '@/services/avatarUtils';

interface Props {
    lastSeen?: string | null;
    size?: number;
    borderColor?: string;
}

const OnlineIndicator: React.FC<Props> = ({
    lastSeen,
    size = 11,
    borderColor = COLORS.white,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Only run the animation if actually online
        if (!isOnline(lastSeen)) return;

        const pulse = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.55,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacityAnim, {
                        toValue: 0.15,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.5,
                        duration: 900,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [lastSeen]);

    if (!isOnline(lastSeen)) return null;

    const dotSize = size;
    const ringSize = dotSize + 6;

    return (
        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulsing outer ring */}
            <Animated.View
                style={{
                    position: 'absolute',
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    backgroundColor: COLORS.success,
                    opacity: opacityAnim,
                    transform: [{ scale: pulseAnim }],
                }}
            />
            {/* Solid inner dot */}
            <View
                style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: COLORS.success,
                    borderWidth: 1.5,
                    borderColor,
                }}
            />
        </View>
    );
};

export default OnlineIndicator;
