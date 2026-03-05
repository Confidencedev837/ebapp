// src/screens/BookingScreen.tsx
import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    Animated, StatusBar, Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { mockCurrentUser } from '@/data/mock';
import { getAvatarUrl } from '@/services/avatarUtils';
import { Service } from '@/types';
import ThemedTextInput from '@/components/ThemedTextInput';

type RootStackParamList = { Booking: { service: Service } };
type BookingRouteProp = RouteProp<RootStackParamList, 'Booking'>;

const LOCATION_FEE = 2500;

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00',
];

const getDaysArray = (): { label: string; day: string; date: string }[] => {
    const days: { label: string; day: string; date: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()],
            day: d.getDate().toString(),
            date: d.toISOString().split('T')[0],
        });
    }
    return days;
};

const BookingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingRouteProp>();
    const { service } = route.params;
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const isAgent = mockCurrentUser.user_type === 'agent';

    const days = getDaysArray();
    const [selectedDate, setSelectedDate] = useState(days[0].date);
    const [selectedTime, setSelectedTime] = useState('10:00');
    const [address, setAddress] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const successScale = useRef(new Animated.Value(0)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    const bg = isDark ? COLORS.bgDark : COLORS.background;
    const card = isDark ? COLORS.surfaceDark : COLORS.white;
    const text = isDark ? COLORS.white : COLORS.textDark;
    const muted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
    const border = isDark ? COLORS.borderDark : COLORS.border;
    const surface = isDark ? '#1E1E1E' : COLORS.surface;

    const agent = service.profiles;
    const total = service.price + LOCATION_FEE;

    const handleBook = () => {
        if (!address.trim()) return;
        setSubmitted(true);
        Animated.parallel([
            Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
            Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start(() => {
            setTimeout(() => navigation.goBack(), 2800);
        });
    };

    if (isAgent) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <MaterialIcons name="block" size={38} color={COLORS.primary} />
                </View>
                <Text style={{ fontFamily: FONTS.playfairBold, fontSize: 22, color: text, textAlign: 'center', marginBottom: 12 }}>
                    Agents Can't Book
                </Text>
                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 14, color: muted, textAlign: 'center', lineHeight: 22 }}>
                    Only customers can book services. Switch to a customer account to book appointments.
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginTop: 36, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, ...SHADOWS.pink }}
                >
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 14, color: COLORS.white }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (submitted) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <Animated.View style={{ alignItems: 'center', opacity: successOpacity, transform: [{ scale: successScale }] }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: `${COLORS.success}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                        <MaterialIcons name="check-circle" size={60} color={COLORS.success} />
                    </View>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 24, color: text, textAlign: 'center', marginBottom: 10 }}>
                        Booking Requested!
                    </Text>
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 14, color: muted, textAlign: 'center', lineHeight: 22 }}>
                        {agent?.full_name} will confirm your appointment shortly. Check your bookings for updates.
                    </Text>
                    <View style={{ marginTop: 28, paddingHorizontal: 24, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: muted, letterSpacing: 0.5 }}>{service.name}</Text>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 16, color: COLORS.primary }}>
                            {selectedDate} · {selectedTime}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Hero image + nav ── */}
                    <View style={{ height: 280, position: 'relative' }}>
                        <Image
                            source={{ uri: service.image_url[0] }}
                            style={{ width: '100%', height: 280 }}
                            contentFit="cover"
                        />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' }} />

                        <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.44)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}
                                activeOpacity={0.75}
                            >
                                <MaterialIcons name="arrow-back" size={22} color="white" />
                            </TouchableOpacity>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: 'white', letterSpacing: 0.3 }}>Book Appointment</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 20, color: 'white', marginBottom: 6 }}>{service.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <MaterialIcons name="schedule" size={13} color="rgba(255,255,255,0.85)" />
                                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{service.duration_mins} min</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <MaterialIcons name="place" size={13} color="rgba(255,255,255,0.85)" />
                                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{agent?.location ?? 'Lagos'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Agent banner ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 20, padding: 14, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOWS.sm }}>
                        <View style={{ padding: 2.5, borderRadius: RADIUS.full, backgroundColor: COLORS.roseMid }}>
                            <Image
                                source={{ uri: getAvatarUrl(agent?.full_name, agent?.avatar_url) }}
                                style={{ width: 48, height: 48, borderRadius: RADIUS.full }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.playfairBold, fontSize: 15, color: text, marginBottom: 2 }}>{agent?.full_name}</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: muted }}>{agent?.specialization} · {agent?.location}</Text>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: `${COLORS.success}18` }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.success }}>Verified</Text>
                        </View>
                    </View>

                    {/* ── Date picker ── */}
                    <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
                        <SectionLabel label="Select Date" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                            {days.map((d) => {
                                const active = selectedDate === d.date;
                                return (
                                    <TouchableOpacity
                                        key={d.date}
                                        onPress={() => setSelectedDate(d.date)}
                                        activeOpacity={0.8}
                                        style={{
                                            width: 62, paddingVertical: 12, borderRadius: RADIUS.md,
                                            alignItems: 'center', borderWidth: 1.5,
                                            backgroundColor: active ? COLORS.primary : card,
                                            borderColor: active ? COLORS.primary : border,
                                            ...(active ? SHADOWS.pink : {}),
                                        }}
                                    >
                                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : muted, marginBottom: 4 }}>{d.label}</Text>
                                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 18, color: active ? COLORS.white : text }}>{d.day}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* ── Time picker ── */}
                    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                        <SectionLabel label="Select Time" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {TIME_SLOTS.map((slot) => {
                                const active = selectedTime === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        onPress={() => setSelectedTime(slot)}
                                        activeOpacity={0.8}
                                        style={{
                                            paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.full,
                                            borderWidth: 1.5,
                                            backgroundColor: active ? COLORS.primary : card,
                                            borderColor: active ? COLORS.primary : border,
                                            ...(active ? SHADOWS.pink : {}),
                                        }}
                                    >
                                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: active ? COLORS.white : text }}>{slot}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Address ── */}
                    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                        <SectionLabel label="Your Address" required />
                        <View style={{ borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: address.length > 0 ? COLORS.primary : border, backgroundColor: surface, flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 }}>
                            <MaterialIcons name="place" size={20} color={address.length > 0 ? COLORS.primary : muted} style={{ marginTop: 1 }} />
                            <ThemedTextInput
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Enter your full address for the appointment"
                                placeholderTextColor={muted}
                                multiline
                                numberOfLines={3}
                                style={{ flex: 1, fontFamily: FONTS.sansRegular, fontSize: 14, color: text, lineHeight: 22, minHeight: 64 }}
                            />
                        </View>
                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 11, color: muted, marginTop: 6, marginLeft: 4 }}>
                            A ₦2,500 location fee applies for at-home service
                        </Text>
                    </View>

                    {/* ── Special requests ── */}
                    <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                        <SectionLabel label="Special Requests" subtitle="Optional" />
                        <View style={{ borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: specialRequests.length > 0 ? COLORS.primary : border, backgroundColor: surface, padding: 14 }}>
                            <ThemedTextInput
                                value={specialRequests}
                                onChangeText={setSpecialRequests}
                                placeholder="Any specific requirements or allergies..."
                                placeholderTextColor={muted}
                                multiline
                                numberOfLines={3}
                                style={{ fontFamily: FONTS.sansRegular, fontSize: 14, color: text, lineHeight: 22, minHeight: 64 }}
                            />
                        </View>
                    </View>

                    {/* ── Price breakdown ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 28, padding: 20, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, ...SHADOWS.sm }}>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 11, color: muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Price Summary</Text>
                        <PriceLine label={service.name} amount={service.price} color={text} font={FONTS.sansMedium} />
                        <PriceLine label="Location fee" amount={LOCATION_FEE} color={muted} font={FONTS.sansRegular} />
                        <View style={{ height: 1, backgroundColor: border, marginVertical: 14 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 15, color: text }}>Total</Text>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 22, color: COLORS.primary }}>₦{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* ── Policy note ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <MaterialIcons name="info-outline" size={16} color={muted} style={{ marginTop: 1 }} />
                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: muted, lineHeight: 18, flex: 1 }}>
                            Payment is collected after the service is completed. Free cancellation up to 4 hours before the appointment.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Sticky CTA ── */}
            <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                paddingHorizontal: 20, paddingTop: 16,
                paddingBottom: insets.bottom + 16,
                backgroundColor: card,
                borderTopWidth: 1, borderColor: border,
                ...SHADOWS.md,
            }}>
                <TouchableOpacity
                    onPress={handleBook}
                    activeOpacity={0.85}
                    style={[{
                        borderRadius: RADIUS.full,
                        paddingVertical: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: address.trim() ? COLORS.primary : (isDark ? '#2A2A2A' : COLORS.border),
                        flexDirection: 'row',
                        gap: 10,
                    }, address.trim() ? SHADOWS.pink : {}]}
                >
                    <MaterialIcons name="event" size={18} color={address.trim() ? COLORS.white : muted} />
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: 15, color: address.trim() ? COLORS.white : muted, letterSpacing: 0.3 }}>
                        Confirm Booking · ₦{total.toLocaleString()}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const SectionLabel = ({ label, required, subtitle }: { label: string; required?: boolean; subtitle?: string }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Text style={{ fontFamily: FONTS.sansBold, fontSize: 14, color: isDark ? COLORS.white : COLORS.textDark }}>
                {label}
            </Text>
            {required && <Text style={{ fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.primary }}>*</Text>}
            {subtitle && <Text style={{ fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted }}>{subtitle}</Text>}
        </View>
    );
};

const PriceLine = ({ label, amount, color, font }: { label: string; amount: number; color: string; font: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontFamily: font, fontSize: 14, color }}>{label}</Text>
        <Text style={{ fontFamily: font, fontSize: 14, color }}>₦{amount.toLocaleString()}</Text>
    </View>
);

export default BookingScreen;
