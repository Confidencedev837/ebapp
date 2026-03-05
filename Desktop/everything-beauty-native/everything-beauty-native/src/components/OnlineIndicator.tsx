// src/components/OnlineIndicator.tsx
import React from 'react';
import { View } from 'react-native';
import { COLORS } from '@/constants/theme';

const OnlineIndicator = () => (
    <View
        className="w-3 h-3 rounded-full border-2"
        style={{ backgroundColor: COLORS.success, borderColor: COLORS.white }}
    />
);

export default OnlineIndicator;
