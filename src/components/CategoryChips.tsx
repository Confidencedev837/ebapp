// src/components/CategoryChips.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
    activeCategory: string;
    onSelect: (category: string) => void;
}

const CategoryChips: React.FC<Props> = React.memo(({ activeCategory, onSelect }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
            style={{ backgroundColor: 'transparent' }}
        >
            {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onSelect(cat)}
                        style={{
                            marginRight: 8,
                            paddingHorizontal: 18,
                            paddingVertical: 8,
                            borderWidth: 1,
                            backgroundColor: isActive ? COLORS.primary : (isDark ? COLORS.surfaceDark : COLORS.white),
                            borderColor: isActive ? COLORS.primary : (isDark ? COLORS.borderDark : COLORS.border),
                            borderRadius: RADIUS.full,
                        }}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={{
                                fontFamily: isActive ? FONTS.sansBold : FONTS.sansMedium,
                                fontSize: 13,
                                color: isActive ? COLORS.white : (isDark ? COLORS.textMutedDark : COLORS.textMuted),
                            }}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
});

export default CategoryChips;
