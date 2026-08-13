// src/components/OnlineIndicator.tsx
import React from 'react';
import { View } from 'react-native';
import { COLORS } from '@/constants/theme';
import { isOnline } from '@/services/avatarUtils';

interface Props {
    lastSeen?: string | null;
}

const OnlineIndicator: React.FC<Props> = ({ lastSeen }) => {
    if (!isOnline(lastSeen)) return null;

    return (
        <View
            className="w-3.5 h-3.5 rounded-full border-2"
            style={{ backgroundColor: COLORS.success, borderColor: COLORS.white }}
        />
    );
};

export default OnlineIndicator;
