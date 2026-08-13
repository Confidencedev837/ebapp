// src/screens/CreateServiceScreen.tsx
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    StyleSheet,
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import Snackbar from '@/components/Snackbar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '@/store/useUserStore';
import { createService } from '@/services/api/servicesApi';
import { uploadToStorage, getPublicStorageUrl } from '@/services/supabase';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
    { label: 'Hair Styling', value: 'Hair Styling', icon: 'content-cut' as const },
    { label: 'Makeup Artistry', value: 'Makeup Artistry', icon: 'brush' as const },
    { label: 'Nail Technician', value: 'Nail Technician', icon: 'spa' as const },
    { label: 'Braiding & Locs', value: 'Braiding & Locs', icon: 'nature' as const },
    { label: 'Lash & Brow', value: 'Lash & Brow', icon: 'visibility' as const },
    { label: 'Barbering', value: 'Barbering', icon: 'face' as const },
    { label: 'Skincare & Facials', value: 'Skincare & Facials', icon: 'face-retouching-natural' as const },
    { label: 'Spa & Massage', value: 'Spa & Massage', icon: 'self-improvement' as const },
    { label: 'Waxing', value: 'Waxing', icon: 'cleaning-services' as const },
    { label: 'Bridal Beauty', value: 'Bridal Beauty', icon: 'diamond' as const },
];

const DURATION_OPTIONS = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: 'Half day (5 hrs)', value: 300 },
    { label: 'Full day (8 hrs)', value: 480 },
];

const STEPS = ['Basics', 'Details', 'Media', 'Review'];

const STEP_ICONS: Record<number, keyof typeof MaterialIcons.glyphMap> = {
    0: 'assignment',
    1: 'list-alt',
    2: 'photo-library',
    3: 'check-circle',
};

// ── Picker Modal ──────────────────────────────────────────────────────────

interface PickerOption { label: string; value: any; icon?: keyof typeof MaterialIcons.glyphMap; }

const PickerModal = ({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
    isDark,
}: {
    visible: boolean;
    title: string;
    options: PickerOption[];
    selectedValue: any;
    onSelect: (v: any) => void;
    onClose: () => void;
    isDark: boolean;
}) => {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 180,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <Animated.View
                    style={[
                        styles.modalSheet,
                        {
                            backgroundColor: isDark ? '#1A1A1A' : COLORS.white,
                            paddingBottom: insets.bottom + 16,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <MaterialIcons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={options}
                        keyExtractor={(item) => String(item.value)}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const isSelected = item.value === selectedValue;
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        onSelect(item.value);
                                        onClose();
                                    }}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.optionRow,
                                        isSelected && {
                                            backgroundColor: isDark ? '#2D1520' : COLORS.blush,
                                        },
                                    ]}
                                >
                                    {item.icon && (
                                        <View style={[styles.optionIcon, { backgroundColor: isSelected ? COLORS.primary + '20' : (isDark ? '#2D2D2D' : COLORS.surface) }]}>
                                            <MaterialIcons
                                                name={item.icon}
                                                size={18}
                                                color={isSelected ? COLORS.primary : COLORS.textMuted}
                                            />
                                        </View>
                                    )}
                                    <Text
                                        style={[
                                            styles.optionLabel,
                                            {
                                                color: isSelected ? COLORS.primary : (isDark ? COLORS.white : COLORS.textDark),
                                                fontFamily: isSelected ? FONTS.sansBold : FONTS.sansRegular,
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

// ── Select Field ──────────────────────────────────────────────────────────

const SelectField = ({
    label,
    icon,
    placeholder,
    value,
    displayValue,
    onPress,
    isDark,
}: {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    placeholder: string;
    value: any;
    displayValue?: string;
    onPress: () => void;
    isDark: boolean;
}) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={[styles.fieldLabel, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
            {label}
        </Text>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.selectTrigger,
                {
                    backgroundColor: isDark ? '#1C1C1C' : COLORS.surface,
                    borderColor: value ? COLORS.primary + '60' : (isDark ? COLORS.borderDark : COLORS.border),
                },
            ]}
        >
            <View style={[styles.fieldIconWrap, { backgroundColor: value ? COLORS.primary + '15' : (isDark ? '#2D2D2D' : '#F0F0F0') }]}>
                <MaterialIcons name={icon} size={18} color={value ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text
                style={[
                    styles.selectText,
                    { color: value ? (isDark ? COLORS.white : COLORS.textDark) : COLORS.textMuted },
                    value && { fontFamily: FONTS.sansMedium },
                ]}
                numberOfLines={1}
            >
                {displayValue || (value ? String(value) : placeholder)}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
    </View>
);

// ── Text Field ────────────────────────────────────────────────────────────

const TextField = ({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    multiline = false,
    keyboardType = 'default' as any,
    prefix,
    isDark,
    maxLength,
}: {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    multiline?: boolean;
    keyboardType?: any;
    prefix?: string;
    isDark: boolean;
    maxLength?: number;
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.fieldLabel, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
                    {label}
                </Text>
                {maxLength && (
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>
                        {value.length}/{maxLength}
                    </Text>
                )}
            </View>
            <View
                style={[
                    styles.inputWrap,
                    multiline && { height: 110, alignItems: 'flex-start', paddingTop: 14 },
                    {
                        backgroundColor: isDark ? '#1C1C1C' : COLORS.surface,
                        borderColor: focused ? COLORS.primary : (isDark ? COLORS.borderDark : COLORS.border),
                    },
                ]}
            >
                <View style={[styles.fieldIconWrap, { backgroundColor: focused ? COLORS.primary + '15' : (isDark ? '#2D2D2D' : '#F0F0F0') }, multiline && { marginTop: 0 }]}>
                    <MaterialIcons name={icon} size={18} color={focused ? COLORS.primary : COLORS.textMuted} />
                </View>
                {prefix && (
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.primary, marginRight: 4 }}>
                        {prefix}
                    </Text>
                )}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    style={[
                        styles.textInput,
                        { color: isDark ? COLORS.white : COLORS.textDark },
                        multiline && { textAlignVertical: 'top', height: 82 },
                    ]}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                />
            </View>
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────

const CreateServiceScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { profile } = useUserStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    // Step management
    const [currentStep, setCurrentStep] = useState(0);
    const stepAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);

    // Snackbar states
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [snackbarDuration, setSnackbarDuration] = useState(3000);

    const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000) => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarDuration(duration);
        setSnackbarVisible(true);
    };

    // Form state — Step 1: Basics
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [durationMins, setDurationMins] = useState<number | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    // Form state — Step 2: Details
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState<string[]>(['']);
    const [whatToExpect, setWhatToExpect] = useState('');

    // Submission
    const [submitting, setSubmitting] = useState(false);

    // ── Step animation ───────────────────────────────────────────────────

    const animateToStep = (step: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.spring(stepAnim, { toValue: step, useNativeDriver: false, damping: 18, stiffness: 120 }),
            Animated.timing(progressAnim, { toValue: step / (STEPS.length - 1), duration: 400, useNativeDriver: false }),
        ]).start();
        setCurrentStep(step);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // ── Features list helpers ────────────────────────────────────────────

    const addFeature = () => {
        Haptics.selectionAsync();
        setFeatures(prev => [...prev, '']);
    };

    const updateFeature = (index: number, text: string) => {
        setFeatures(prev => { const next = [...prev]; next[index] = text; return next; });
    };

    const removeFeature = (index: number) => {
        Haptics.selectionAsync();
        setFeatures(prev => prev.filter((_, i) => i !== index));
    };

    // Form state — Step 3: Media (Multimedia: Images & Videos)
    const [mediaItems, setMediaItems] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
    const [uploading, setUploading] = useState(false);

    // ── Media picking ────────────────────────────────────────────────────

    const pickMedia = async () => {
        if (mediaItems.length >= 5) {
            showToast('You can upload up to 5 photos or videos in total.', 'warning', 4000);
            return;
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Please allow access to your media library in your settings.', 'error', 4000);
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: 5 - mediaItems.length,
            quality: 0.85,
        });
        if (!result.canceled) {
            const chosen = result.assets.map(a => ({
                uri: a.uri,
                type: (a.type || 'image') as 'image' | 'video',
            }));
            setMediaItems(prev => [...prev, ...chosen].slice(0, 5));
        }
    };

    const removeMediaItem = (index: number) => {
        Haptics.selectionAsync();
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    // ── Validation ───────────────────────────────────────────────────────

    const step1Valid = name.trim().length >= 3 && category && price.trim() && durationMins !== null;
    const step2Valid = description.trim().length >= 20;
    const step3Valid = true; // images optional

    const canNext = [step1Valid, step2Valid, step3Valid, false];
    const canProceed = currentStep < STEPS.length - 1 ? canNext[currentStep] : false;

    // ── Submit ───────────────────────────────────────────────────────────

    const handlePublish = async () => {
        if (!profile?.id) {
            showToast('You must be logged in as an agent to publish services.', 'error', 4000);
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitting(true);

        try {
            let uploadedUrls: string[] = [];

            // Upload media items to Supabase storage
            if (mediaItems.length > 0) {
                setUploading(true);
                uploadedUrls = await Promise.all(
                    mediaItems.map(async (item, i) => {
                        const ext = item.uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1] || (item.type === 'video' ? 'mp4' : 'jpg');
                        const path = `services/${profile.id}/${Date.now()}-${i}.${ext}`;
                        const storagePath = await uploadToStorage('service_media', path, item.uri);
                        const { data } = getPublicStorageUrl('service_media', storagePath);
                        return data.publicUrl;
                    })
                );
                setUploading(false);
            }

            // Build features JSONB — combine benefits + what_to_expect
            const validFeatures = features.filter(f => f.trim().length > 0);
            const featuresJson = [
                ...validFeatures,
                ...(whatToExpect.trim() ? [`What to expect: ${whatToExpect.trim()}`] : []),
            ];

            await createService({
                agent_id: profile.id,
                name: name.trim(),
                description: description.trim() || null,
                price: parseFloat(price),
                category: category || null,
                duration_mins: durationMins,
                image_url: uploadedUrls,
                features: featuresJson,
            });

            showToast('Service published successfully!', 'success', 3000);
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (err: any) {
            showToast(err.message || 'Publishing failed. Please try again.', 'error', 5000);
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    // ── Step content ─────────────────────────────────────────────────────

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <View style={styles.stepIntro}>
                <MaterialIcons name="assignment" size={32} color={COLORS.primary} />
                <Text style={[styles.stepTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    Service Basics
                </Text>
                <Text style={[styles.stepSubtitle, { color: COLORS.textMuted }]}>
                    Give your service a name that clients will remember
                </Text>
            </View>

            <TextField
                label="Service Name"
                icon="spa"
                placeholder="e.g. Luxury Bridal Makeup"
                value={name}
                onChangeText={setName}
                isDark={isDark}
                maxLength={60}
            />

            <SelectField
                label="Category"
                icon="category"
                placeholder="Select service category"
                value={category}
                onPress={() => setShowCategoryPicker(true)}
                isDark={isDark}
            />

            <TextField
                label="Price (₦)"
                icon="payments"
                placeholder="e.g. 25000"
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                prefix="₦"
                isDark={isDark}
            />

            <SelectField
                label="Duration"
                icon="schedule"
                placeholder="How long does this service take?"
                value={durationMins}
                displayValue={DURATION_OPTIONS.find(d => d.value === durationMins)?.label}
                onPress={() => setShowDurationPicker(true)}
                isDark={isDark}
            />

            {/* Price hint */}
            {price && parseFloat(price) > 0 && (
                <View style={[styles.hintCard, { backgroundColor: isDark ? '#1C2A1C' : '#F0FFF4' }]}>
                    <MaterialIcons name="info-outline" size={16} color={COLORS.success} />
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: isDark ? '#86EFAC' : '#166534', flex: 1 }}>
                        Clients will see this as ₦{parseFloat(price).toLocaleString()}. You keep 90% after platform fee.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <View style={styles.stepIntro}>
                <MaterialIcons name="list-alt" size={32} color={COLORS.primary} />
                <Text style={[styles.stepTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    Service Details
                </Text>
                <Text style={[styles.stepSubtitle, { color: COLORS.textMuted }]}>
                    Help clients understand exactly what they are getting
                </Text>
            </View>

            <TextField
                label="Description"
                icon="description"
                placeholder="Describe your service in detail. What makes it special?"
                value={description}
                onChangeText={setDescription}
                multiline
                isDark={isDark}
                maxLength={500}
            />

            {/* Key Benefits */}
            <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={[styles.fieldLabel, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
                        Key Benefits
                    </Text>
                    <TouchableOpacity
                        onPress={addFeature}
                        style={[styles.addBtn, { backgroundColor: COLORS.blush }]}
                        activeOpacity={0.75}
                    >
                        <MaterialIcons name="add" size={16} color={COLORS.primary} />
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary }}>Add</Text>
                    </TouchableOpacity>
                </View>

                {features.map((feature, index) => (
                    <View key={index} style={[styles.featureRow, { backgroundColor: isDark ? '#1C1C1C' : COLORS.surface, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                        <MaterialIcons name="stars" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <TextInput
                            value={feature}
                            onChangeText={(t) => updateFeature(index, t)}
                            placeholder={`Benefit ${index + 1} — e.g. Long-lasting finish`}
                            placeholderTextColor={COLORS.textMuted}
                            style={[styles.featureInput, { color: isDark ? COLORS.white : COLORS.textDark }]}
                        />
                        {features.length > 1 && (
                            <TouchableOpacity onPress={() => removeFeature(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <MaterialIcons name="remove-circle" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </View>

            {/* What to Expect */}
            <TextField
                label="What to Expect"
                icon="auto-awesome"
                placeholder="Walk clients through the experience — e.g. consultation, preparation, aftercare..."
                value={whatToExpect}
                onChangeText={setWhatToExpect}
                multiline
                isDark={isDark}
                maxLength={400}
            />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <View style={styles.stepIntro}>
                <MaterialIcons name="photo-library" size={32} color={COLORS.primary} />
                <Text style={[styles.stepTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    Photos & Videos
                </Text>
                <Text style={[styles.stepSubtitle, { color: COLORS.textMuted }]}>
                    Great multimedia portfolios attract booking engagements. Add up to 5 photos or videos.
                </Text>
            </View>

            {/* Multimedia grid */}
            <View style={styles.imageGrid}>
                {mediaItems.map((item, index) => (
                    <View key={item.uri} style={styles.imageSlot}>
                        <Image source={{ uri: item.uri }} style={styles.imageThumb} contentFit="cover" />
                        
                        {/* Video overlay icon */}
                        {item.type === 'video' && (
                            <View style={styles.videoOverlayBadge}>
                                <MaterialIcons name="play-circle-outline" size={24} color="white" />
                            </View>
                        )}

                        {index === 0 && (
                            <View style={styles.coverBadge}>
                                <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 9, color: COLORS.white }}>COVER</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => removeMediaItem(index)}
                            style={styles.removeImageBtn}
                        >
                            <MaterialIcons name="close" size={14} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                ))}

                {mediaItems.length < 5 && (
                    <TouchableOpacity
                        onPress={pickMedia}
                        activeOpacity={0.75}
                        style={[styles.addImageSlot, {
                            backgroundColor: isDark ? '#1C1C1C' : COLORS.surface,
                            borderColor: isDark ? COLORS.borderDark : COLORS.border,
                        }]}
                    >
                        <MaterialIcons name="add-to-photos" size={28} color={COLORS.primary} />
                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' }}>
                            Add Media
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.hintCard, { backgroundColor: isDark ? '#1C1C1C' : COLORS.surface, marginTop: 8 }]}>
                <MaterialIcons name="video-camera-back" size={16} color={COLORS.textMuted} />
                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted, flex: 1 }}>
                    The first item is the service cover photo. Standard limits apply: up to 5 items total (images/videos).
                </Text>
            </View>
        </View>
    );

    const renderStep4 = () => {
        const durationLabel = DURATION_OPTIONS.find(d => d.value === durationMins)?.label ?? '-';
        const categoryData = CATEGORIES.find(c => c.value === category);

        return (
            <View style={styles.stepContent}>
                <View style={styles.stepIntro}>
                    <MaterialIcons name="check-circle" size={32} color={COLORS.primary} />
                    <Text style={[styles.stepTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                        Review & Publish
                    </Text>
                    <Text style={[styles.stepSubtitle, { color: COLORS.textMuted }]}>
                        Everything looks good? Publish your service now.
                    </Text>
                </View>

                {/* Preview card */}
                <View style={[styles.reviewCard, { backgroundColor: isDark ? '#1A1A1A' : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                    {/* Cover image */}
                    {mediaItems[0] ? (
                        <View>
                            <Image source={{ uri: mediaItems[0].uri }} style={styles.reviewCover} contentFit="cover" />
                            {mediaItems[0].type === 'video' && (
                                <View style={styles.videoOverlayBadge}>
                                    <MaterialIcons name="play-circle-outline" size={32} color="white" />
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.reviewCoverPlaceholder, { backgroundColor: isDark ? '#2D2D2D' : COLORS.surface }]}>
                            <MaterialIcons name="image-not-supported" size={40} color={COLORS.textMuted} />
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>No cover photo</Text>
                        </View>
                    )}

                    <View style={{ padding: 16 }}>
                        {/* Category badge */}
                        {category && (
                            <View style={[styles.categoryBadge, { backgroundColor: COLORS.blush }]}>
                                {categoryData && <MaterialIcons name={categoryData.icon} size={12} color={COLORS.primary} style={{ marginRight: 4 }} />}
                                <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 10, color: COLORS.primary, letterSpacing: 0.5 }}>
                                    {category.toUpperCase()}
                                </Text>
                            </View>
                        )}

                        <Text style={[styles.reviewName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            {name || 'Service Name'}
                        </Text>

                        {description && (
                            <Text style={[styles.reviewDesc, { color: COLORS.textMuted }]} numberOfLines={3}>
                                {description}
                            </Text>
                        )}

                        {/* Stats row */}
                        <View style={styles.reviewStats}>
                            <View style={styles.reviewStat}>
                                <MaterialIcons name="payments" size={18} color={COLORS.primary} />
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 16, color: isDark ? COLORS.white : COLORS.textDark }}>
                                        ₦{price ? parseFloat(price).toLocaleString() : '0'}
                                    </Text>
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>Price</Text>
                                </View>
                            </View>
                            <View style={[styles.reviewStatDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
                            <View style={styles.reviewStat}>
                                <MaterialIcons name="schedule" size={18} color={COLORS.primary} />
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 16, color: isDark ? COLORS.white : COLORS.textDark }}>
                                        {durationLabel}
                                    </Text>
                                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: COLORS.textMuted }}>Duration</Text>
                                </View>
                            </View>
                        </View>

                        {/* Features */}
                        {features.filter(f => f.trim()).length > 0 && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Key Benefits
                                </Text>
                                {features.filter(f => f.trim()).map((f, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                                        <MaterialIcons name="check-circle" size={14} color={COLORS.success} style={{ marginRight: 8, marginTop: 2 }} />
                                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 13, color: isDark ? COLORS.white : COLORS.textDark, flex: 1 }}>{f}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Photo/Media count */}
                        <View style={[styles.photoCountRow, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                            <MaterialIcons name="perm-media" size={16} color={COLORS.textMuted} />
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted, marginLeft: 6 }}>
                                {mediaItems.length} media item{mediaItems.length !== 1 ? 's' : ''} attached
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Terms note */}
                <View style={[styles.hintCard, { backgroundColor: isDark ? '#1A1A2E' : '#EFF6FF' }]}>
                    <MaterialIcons name="policy" size={16} color="#3B82F6" />
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: isDark ? '#93C5FD' : '#1D4ED8', flex: 1 }}>
                        By publishing, you agree to our Service Provider Terms. Customers can book this service directly.
                    </Text>
                </View>
            </View>
        );
    };

    const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

    const { animStyle } = useScreenAnimation();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
        <Animated.View style={[{ flex: 1, overflow: 'hidden' }, animStyle]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? COLORS.bgDark : COLORS.white, borderBottomColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.selectionAsync();
                        if (currentStep > 0) animateToStep(currentStep - 1);
                        else navigation.goBack();
                    }}
                    style={[styles.headerBack, { backgroundColor: isDark ? '#1C1C1C' : COLORS.surface }]}
                >
                    <MaterialIcons name="arrow-back" size={20} color={isDark ? COLORS.white : COLORS.textDark} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                        New Service
                    </Text>
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted }}>
                        Step {currentStep + 1} of {STEPS.length}
                    </Text>
                </View>

                <View style={{ width: 38 }} />
            </View>

            {/* Step pills */}
            <View style={[styles.stepPills, { backgroundColor: isDark ? COLORS.bgDark : COLORS.white }]}>
                {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;
                    return (
                        <TouchableOpacity
                            key={step}
                            onPress={() => {
                                if (index < currentStep || (index === currentStep + 1 && canNext[currentStep])) {
                                    animateToStep(index);
                                }
                            }}
                            style={[
                                styles.stepPill,
                                {
                                    backgroundColor: isActive
                                        ? COLORS.primary
                                        : isDone
                                            ? COLORS.primary + '25'
                                            : (isDark ? '#1C1C1C' : COLORS.surface),
                                    flex: isActive ? 2 : 1,
                                },
                            ]}
                        >
                            <MaterialIcons
                                name={isDone ? 'check' : STEP_ICONS[index]}
                                size={14}
                                color={isActive || isDone ? (isActive ? COLORS.white : COLORS.primary) : COLORS.textMuted}
                            />
                            {isActive && (
                                <Text style={{ fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.white, marginLeft: 4 }}>
                                    {step}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {/* Content */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {steps[currentStep]()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom action bar */}
            <View style={[styles.actionBar, {
                backgroundColor: isDark ? COLORS.bgDark : COLORS.white,
                borderTopColor: isDark ? COLORS.borderDark : COLORS.border,
                paddingBottom: insets.bottom + 8,
            }]}>
                {currentStep < STEPS.length - 1 ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (canNext[currentStep]) {
                                animateToStep(currentStep + 1);
                            } else {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                showToast('Please fill in all required fields to proceed.', 'warning', 4000);
                            }
                        }}
                        activeOpacity={0.85}
                        style={[
                            styles.nextBtn,
                            { opacity: canNext[currentStep] ? 1 : 0.6 },
                            SHADOWS.pink,
                        ]}
                    >
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.white }}>
                            Continue
                        </Text>
                        <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handlePublish}
                        disabled={submitting}
                        activeOpacity={0.85}
                        style={[styles.publishBtn, SHADOWS.pink]}
                    >
                        {submitting ? (
                            <>
                                <ActivityIndicator color={COLORS.white} size="small" />
                                <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.white, marginLeft: 8 }}>
                                    {uploading ? 'Uploading photos...' : 'Publishing...'}
                                </Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="rocket-launch" size={20} color={COLORS.white} />
                                <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.white, marginLeft: 8 }}>
                                    Publish Service
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Pickers */}
            <PickerModal
                visible={showCategoryPicker}
                title="Service Category"
                options={CATEGORIES}
                selectedValue={category}
                onSelect={setCategory}
                onClose={() => setShowCategoryPicker(false)}
                isDark={isDark}
            />
            <PickerModal
                visible={showDurationPicker}
                title="Session Duration"
                options={DURATION_OPTIONS}
                selectedValue={durationMins}
                onSelect={setDurationMins}
                onClose={() => setShowDurationPicker(false)}
                isDark={isDark}
            />

            <Snackbar
                visible={snackbarVisible}
                message={snackbarMessage}
                type={snackbarType}
                duration={snackbarDuration}
                onDismiss={() => setSnackbarVisible(false)}
            />
        </Animated.View>
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerBack: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 18,
    },
    stepPills: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 6,
    },
    stepPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    progressTrack: {
        height: 3,
        marginHorizontal: 16,
        borderRadius: 2,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    stepContent: {
        padding: SPACING.screen,
        paddingTop: 20,
    },
    stepIntro: {
        alignItems: 'center',
        marginBottom: 28,
        paddingTop: 4,
    },
    stepTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 22,
        marginTop: 12,
        marginBottom: 6,
    },
    stepSubtitle: {
        fontFamily: FONTS.sansRegular,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    fieldLabel: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    selectTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        height: 54,
        gap: 10,
    },
    fieldIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectText: {
        fontFamily: FONTS.sansRegular,
        fontSize: 15,
        flex: 1,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        height: 54,
        gap: 10,
    },
    textInput: {
        fontFamily: FONTS.sansRegular,
        fontSize: 15,
        flex: 1,
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        borderRadius: RADIUS.md,
        marginTop: 4,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    featureInput: {
        fontFamily: FONTS.sansRegular,
        fontSize: 14,
        flex: 1,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    imageSlot: {
        width: (SCREEN_WIDTH - 32 - 20) / 3,
        height: (SCREEN_WIDTH - 32 - 20) / 3,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    imageThumb: {
        width: '100%',
        height: '100%',
    },
    coverBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageSlot: {
        width: (SCREEN_WIDTH - 32 - 20) / 3,
        height: (SCREEN_WIDTH - 32 - 20) / 3,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewCard: {
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 16,
        ...SHADOWS.md,
    },
    reviewCover: {
        width: '100%',
        height: 180,
    },
    reviewCoverPlaceholder: {
        width: '100%',
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewName: {
        fontFamily: FONTS.playfairBold,
        fontSize: 20,
        marginTop: 10,
        marginBottom: 6,
    },
    reviewDesc: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    reviewStats: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginVertical: 8,
    },
    reviewStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewStatDivider: {
        width: 1,
        height: 32,
        marginHorizontal: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        marginBottom: 4,
    },
    photoCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 12,
        marginTop: 12,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    nextBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    publishBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    modalTitle: {
        fontFamily: FONTS.montserratBold,
        fontSize: 17,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 13,
        gap: 12,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 15,
        flex: 1,
    },
    videoOverlayBadge: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CreateServiceScreen;
