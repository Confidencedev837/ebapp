// src/components/ThemedTextInput.tsx
import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { COLORS } from '@/constants/theme';

const ThemedTextInput: React.FC<TextInputProps> = (props) => (
    <TextInput
        cursorColor={COLORS.primary}
        selectionColor={`${COLORS.primary}40`}
        {...props}
    />
);

export default ThemedTextInput;
