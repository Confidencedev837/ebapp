// src/components/CategoryChips.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { COLORS, RADIUS } from '../constants/theme';
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
            className="py-4"
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.white }}
        >
            {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onSelect(cat)}
                        className="mr-2 px-6 py-2 border"
                        style={{
                            backgroundColor: isActive ? COLORS.primary : (isDark ? COLORS.surfaceDark : COLORS.white),
                            borderColor: isActive ? COLORS.primary : (isDark ? COLORS.borderDark : COLORS.border),
                            borderRadius: RADIUS.full
                        }}
                    >
                        <Text
                            className="text-xs font-sansMedium"
                            style={{ color: isActive ? COLORS.white : (isDark ? COLORS.textMutedDark : COLORS.textMuted) }}
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
