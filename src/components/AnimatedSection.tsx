// src/components/AnimatedSection.tsx
import React, { useRef, useCallback } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface AnimatedSectionProps {
    children: React.ReactNode;
    delay?: number;
    style?: StyleProp<ViewStyle>;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
    children, 
    delay = 0, 
    style, 
    direction = 'up',
    distance = 40
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    
    // Determine starting position based on direction
    const getInitialTranslate = () => {
        switch (direction) {
            case 'up': return distance;
            case 'down': return -distance;
            case 'left': return distance;
            case 'right': return -distance;
            default: return distance;
        }
    };
    
    const translateVal = useRef(new Animated.Value(getInitialTranslate())).current;

    useFocusEffect(
        useCallback(() => {
            opacity.setValue(0);
            translateVal.setValue(getInitialTranslate());

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateVal, {
                        toValue: 0,
                        bounciness: 12,
                        speed: 14,
                        useNativeDriver: true,
                    })
                ]).start();
            }, delay);

            return () => {
                clearTimeout(timer);
                opacity.setValue(0);
                translateVal.setValue(getInitialTranslate());
            };
        }, [delay, direction, distance])
    );

    const transformStyle = () => {
        if (direction === 'up' || direction === 'down') {
            return [{ translateY: translateVal }];
        }
        return [{ translateX: translateVal }];
    };

    return (
        <Animated.View style={[style, { opacity, transform: transformStyle() }]}>
            {children}
        </Animated.View>
    );
};

export default AnimatedSection;
