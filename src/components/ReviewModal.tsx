import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, TextInput,
    ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, FONT_SIZE } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose, onSubmit }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    
    // Animations
    const slideY = useRef(new Animated.Value(500)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const starScales = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        if (visible) {
            setRating(0);
            setComment('');
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(slideY, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideY, { toValue: 500, duration: 250, useNativeDriver: true })
            ]).start();
        }
    }, [visible]);

    const handleStarPress = (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRating(index + 1);
        
        // Spring animation for the selected star
        Animated.sequence([
            Animated.timing(starScales[index], { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.spring(starScales[index], { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start();
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        Keyboard.dismiss();
        setLoading(true);
        try {
            await onSubmit(rating, comment.trim());
        } finally {
            setLoading(false);
        }
    };

    const bg = isDark ? COLORS.surfaceDark : COLORS.white;
    const text = isDark ? COLORS.white : COLORS.textDark;
    const muted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
    const border = isDark ? COLORS.borderDark : COLORS.border;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.overlayContainer}>
                    {/* Backdrop */}
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fade }]}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
                    </Animated.View>

                    {/* Modal Content */}
                    <Animated.View style={[styles.modalSheet, { backgroundColor: bg, transform: [{ translateY: slideY }] }]}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={24} color={text} />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: text }]}>Rate your experience</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.starsContainer}>
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => handleStarPress(index)} style={{ padding: 6 }}>
                                        <Animated.View style={{ transform: [{ scale: starScales[index] }] }}>
                                            <MaterialIcons
                                                name={rating > index ? 'star' : 'star-border'}
                                                size={44}
                                                color={rating > index ? COLORS.gold : muted}
                                            />
                                        </Animated.View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: text }]}>Share more details (optional)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background, color: text, borderColor: border }]}
                                    placeholder="What did you like or dislike?"
                                    placeholderTextColor={muted}
                                    multiline
                                    maxLength={500}
                                    value={comment}
                                    onChangeText={setComment}
                                    textAlignVertical="top"
                                />
                                <Text style={[styles.charCount, { color: muted }]}>{comment.length}/500</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                                disabled={rating === 0 || loading}
                                onPress={handleSubmit}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.submitBtnText}>Submit Review</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    title: {
        fontFamily: FONTS.playfairBold,
        fontSize: FONT_SIZE.xl,
    },
    closeBtn: {
        padding: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 32,
    },
    inputLabel: {
        fontFamily: FONTS.sansMedium,
        fontSize: FONT_SIZE.base,
        marginBottom: 10,
    },
    input: {
        fontFamily: FONTS.sansRegular,
        fontSize: FONT_SIZE.base,
        height: 120,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        padding: 16,
    },
    charCount: {
        fontFamily: FONTS.sansRegular,
        fontSize: FONT_SIZE.xs,
        textAlign: 'right',
        marginTop: 6,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        ...SHADOWS.pink,
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.textMuted,
        shadowOpacity: 0,
    },
    submitBtnText: {
        color: COLORS.white,
        fontFamily: FONTS.montserratBold,
        fontSize: FONT_SIZE.md,
    },
});

export default ReviewModal;
