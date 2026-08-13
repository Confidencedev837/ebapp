// src/screens/BookingScreen.tsx
//
// DESIGN DECISIONS:
// ─ Address field removed — reduces onboarding friction. Agent's location is shown instead.
//   The agent contacts the customer post-confirmation to share precise arrival/meeting point.
//
// ESCROW MODEL:
// ─ Customer pays at the time of booking → money held in platform escrow (escrow_status='held')
// ─ After service is marked 'completed' by the agent, a 24-hour release window begins
// ─ Customer can dispute within 24h if agent was a no-show → refund triggered
// ─ After 24h no dispute → escrow auto-releases to agent (escrow_status='released')
// ─ This prevents agent no-show fraud while keeping trust for the customer

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    Animated, StatusBar, Platform,
    KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS, FONTS, RADIUS, SHADOWS, FONT_SIZE } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/services/supabase';
import Snackbar from '@/components/Snackbar';
import { getAvatarUrl } from '@/services/avatarUtils';
import { Service } from '@/types';

type RootStackParamList = { Booking: { service: Service } };
type BookingRouteProp = RouteProp<RootStackParamList, 'Booking'>;

// ── Time slots shown to users ────────────────────────────────────────────────
const ALL_SLOTS = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00',
];

// ── Generates next 14 days as selectable dates ────────────────────────────────
const getDaysArray = () => {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()],
            day: d.getDate().toString(),
            date: d.toISOString().split('T')[0],
        };
    });
};

// ── Fetch booked slots for a service on a given date ─────────────────────────
const fetchBookedSlots = async (serviceId: string, date: string): Promise<string[]> => {
    const { data } = await supabase
        .from('bookings')
        .select('time')
        .eq('service_id', serviceId)
        .eq('date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']); // only active bookings block slots
    return (data ?? []).map((r: { time: string }) => r.time);
};

const BookingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingRouteProp>();
    const { service } = route.params;
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { animStyle } = useScreenAnimation();

    // ── Theming shortcuts ────────────────────────────────────────────────
    const bg     = isDark ? COLORS.bgDark      : COLORS.background;
    const card   = isDark ? COLORS.surfaceDark : COLORS.white;
    const text   = isDark ? COLORS.white       : COLORS.textDark;
    const muted  = isDark ? COLORS.textMutedDark : COLORS.textMuted;
    const border = isDark ? COLORS.borderDark  : COLORS.border;

    // ── State ────────────────────────────────────────────────────────────
    const days = getDaysArray();
    const [selectedDate, setSelectedDate] = useState(days[0].date);
    const [selectedTime, setSelectedTime] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [paymentMethod, setPaymentMethod]     = useState<'card' | 'bank_transfer' | 'wallet'>('card');
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [newBookingId, setNewBookingId] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'error' | 'success' | 'info' }>({
        visible: false, message: '', type: 'error',
    });

    const successScale   = useRef(new Animated.Value(0)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    const agent    = service.profiles;
    const isAgent  = profile?.user_type === 'agent';
    const total    = service.price;

    // ── Load booked slots when date changes ──────────────────────────────
    useEffect(() => {
        setSlotsLoading(true);
        setSelectedTime(''); // clear time when date changes
        fetchBookedSlots(service.id, selectedDate)
            .then(setBookedSlots)
            .catch(() => setBookedSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedDate]);

    // ── Create booking ────────────────────────────────────────────────────
    const handleBook = async () => {
        if (!selectedTime) {
            setSnackbar({ visible: true, message: 'Please select a time slot', type: 'error' });
            return;
        }
        if (!profile?.id) {
            setSnackbar({ visible: true, message: 'You must be logged in to book', type: 'error' });
            return;
        }

        setBookingLoading(true);
        try {
            // Double-check slot isn't taken (race condition guard)
            const latest = await fetchBookedSlots(service.id, selectedDate);
            if (latest.includes(selectedTime)) {
                setBookedSlots(latest);
                setSelectedTime('');
                setSnackbar({ visible: true, message: 'That slot was just taken — please choose another time', type: 'error' });
                return;
            }

            const { data, error } = await supabase
                .from('bookings')
                .insert({
                    customer_id: profile?.id,
                    service_id: service.id,
                    agent_id: service.agent_id,
                    date: selectedDate,
                    time: selectedTime,
                    status: 'pending',
                    customer_notes: specialRequests || null,
                    total_amount: total,
                    escrow_status: 'held',
                    payment_method: paymentMethod,
                    payment_status: 'paid',
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            setNewBookingId(data.id);
            setSubmitted(true);

            // Success animation, then navigate to BookingDetail
            Animated.parallel([
                Animated.spring(successScale,   { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
                Animated.timing(successOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start(() => {
                setTimeout(() => {
                    // Replace this screen — user shouldn't be able to "go back" to booking form after confirmation
                    navigation.replace('BookingDetail', { bookingId: data.id });
                }, 2000);
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Booking failed — please try again';
            setSnackbar({ visible: true, message: msg, type: 'error' });
        } finally {
            setBookingLoading(false);
        }
    };

    // ── Guard: agents cannot book ─────────────────────────────────────────
    if (isAgent) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <MaterialIcons name="block" size={38} color={COLORS.primary} />
                </View>
                <Text style={{ fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.h2, color: text, textAlign: 'center', marginBottom: 12 }}>Agents Can't Book</Text>
                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, color: muted, textAlign: 'center', lineHeight: 22 }}>
                    Only customers can book services.
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 36, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, ...SHADOWS.pink }}>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.md, color: COLORS.white }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Success state ─────────────────────────────────────────────────────
    if (submitted) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <Animated.View style={{ alignItems: 'center', opacity: successOpacity, transform: [{ scale: successScale }] }}>
                    <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: `${COLORS.success}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                        <MaterialIcons name="check-circle" size={68} color={COLORS.success} />
                    </View>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h2, color: text, textAlign: 'center', marginBottom: 8 }}>Booking Requested!</Text>
                    <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, color: muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                        {agent?.full_name} will confirm shortly.{'\n'}Opening your booking details…
                    </Text>
                    <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.sm, color: muted }}>{service.name}</Text>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.lg, color: COLORS.primary }}>
                            {selectedDate} · {selectedTime}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    // ── Main booking form ──────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Hero ── */}
                    <View style={{ height: 260, position: 'relative' }}>
                        <Image source={{ uri: service.image_url[0] }} style={{ width: '100%', height: 260 }} contentFit="cover" />
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.44)' }} />

                        <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.44)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <MaterialIcons name="arrow-back" size={22} color="white" />
                            </TouchableOpacity>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.lg, color: 'white' }}>Book Appointment</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h3, color: 'white', marginBottom: 6 }}>{service.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <MaterialIcons name="schedule" size={13} color="rgba(255,255,255,0.85)" />
                                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.85)' }}>{service.duration_mins} min</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <MaterialIcons name="place" size={13} color="rgba(255,255,255,0.85)" />
                                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.85)' }}>{agent?.location ?? 'Lagos'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Agent banner ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 20, padding: 14, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOWS.sm }}>
                        <View style={{ padding: 2.5, borderRadius: RADIUS.full, backgroundColor: COLORS.roseMid }}>
                            <Image source={{ uri: getAvatarUrl(agent?.full_name, agent?.avatar_url) }} style={{ width: 48, height: 48, borderRadius: RADIUS.full }} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.lg, color: text, marginBottom: 2 }}>{agent?.full_name}</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: muted }}>{(agent as any)?.specialization} · {agent?.location}</Text>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: `${COLORS.success}18` }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.xs, color: COLORS.success }}>Verified</Text>
                        </View>
                    </View>

                    {/* ── Escrow info banner ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 14, padding: 14, borderRadius: RADIUS.md, backgroundColor: `${COLORS.primary}0F`, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                        <MaterialIcons name="security" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: COLORS.primary, marginBottom: 4 }}>Payment Protected by Escrow</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: muted, lineHeight: 18 }}>
                                Your payment is held securely by the platform and only released to the agent after your service is completed and you're satisfied. If the agent is a no-show, you get a full refund.
                            </Text>
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
                                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, color: active ? 'rgba(255,255,255,0.8)' : muted, marginBottom: 4 }}>{d.label}</Text>
                                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h3, color: active ? COLORS.white : text }}>{d.day}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* ── Time slots ── */}
                    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <SectionLabel label="Select Time" noMargin />
                            {slotsLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {ALL_SLOTS.map((slot) => {
                                const isBooked = bookedSlots.includes(slot);
                                const active   = selectedTime === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        onPress={() => !isBooked && setSelectedTime(slot)}
                                        activeOpacity={isBooked ? 1 : 0.8}
                                        disabled={isBooked}
                                        style={{
                                            paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.full,
                                            borderWidth: 1.5,
                                            // Booked → greyed. Active → brand pink. Default → card
                                            backgroundColor: isBooked ? (isDark ? '#1A1A1A' : '#F0F0F0') : active ? COLORS.primary : card,
                                            borderColor:     isBooked ? (isDark ? '#333' : '#DDD') : active ? COLORS.primary : border,
                                            opacity: isBooked ? 0.5 : 1,
                                            ...(active ? SHADOWS.pink : {}),
                                        }}
                                    >
                                        <Text style={{
                                            fontFamily: FONTS.sansMedium,
                                            fontSize: FONT_SIZE.base,
                                            color: isBooked ? muted : active ? COLORS.white : text,
                                            textDecorationLine: isBooked ? 'line-through' : 'none',
                                        }}>
                                            {slot}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {bookedSlots.length > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                                <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0', borderWidth: 1, borderColor: isDark ? '#333' : '#DDD', opacity: 0.5 }} />
                                <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, color: muted }}>Already booked</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Special requests ── */}
                    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                        <SectionLabel label="Special Requests" subtitle="Optional" />
                        <View style={{ borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: specialRequests.length > 0 ? COLORS.primary : border, backgroundColor: isDark ? '#1E1E1E' : COLORS.surface, padding: 14 }}>
                            <TextInputCompat
                                value={specialRequests}
                                onChangeText={setSpecialRequests}
                                placeholder="Any specific requirements, allergies or preferences…"
                                placeholderTextColor={muted}
                                multiline
                                numberOfLines={3}
                                style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, color: text, lineHeight: 22, minHeight: 72 }}
                            />
                        </View>
                    </View>

                    {/* ── Payment Method Selection ── */}
                    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                        <SectionLabel label="Payment Method" subtitle="Protected by Escrow" />
                        <View style={{ gap: 10 }}>
                            {[
                                { id: 'card', label: 'Card / Paystack', icon: 'credit-card', sub: 'Instant & Secure' },
                                { id: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance', sub: 'Direct Transfer' },
                                { id: 'wallet', label: 'Escrow Wallet', icon: 'account-balance-wallet', sub: 'Available Balance' },
                            ].map((pm) => {
                                const active = paymentMethod === pm.id;
                                return (
                                    <TouchableOpacity
                                        key={pm.id}
                                        onPress={() => setPaymentMethod(pm.id as any)}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 14,
                                            borderRadius: RADIUS.lg,
                                            borderWidth: 1.5,
                                            borderColor: active ? COLORS.primary : border,
                                            backgroundColor: active ? (isDark ? 'rgba(255,98,137,0.12)' : 'rgba(255,98,137,0.06)') : card,
                                            gap: 12,
                                        }}
                                    >
                                        <MaterialIcons name={pm.icon as any} size={22} color={active ? COLORS.primary : muted} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: text }}>{pm.label}</Text>
                                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, color: muted }}>{pm.sub}</Text>
                                        </View>
                                        <View style={{
                                            width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                                            borderColor: active ? COLORS.primary : border,
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Price summary ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 28, padding: 20, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, ...SHADOWS.sm }}>
                        <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.tiny, color: muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Price Summary</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.md, color: text }}>{service.name}</Text>
                            <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.md, color: text }}>₦{service.price.toLocaleString()}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, color: muted }}>Platform fee</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, color: muted }}>Free</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: border, marginVertical: 12 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.lg, color: text }}>Total</Text>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h1, color: COLORS.primary }}>₦{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* ── Cancellation policy ── */}
                    <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <MaterialIcons name="info-outline" size={16} color={muted} style={{ marginTop: 1 }} />
                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: muted, lineHeight: 18, flex: 1 }}>
                            Free cancellation up to 4 hours before your appointment. Payment is held in escrow and released only after service completion.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Sticky CTA ── */}
            <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                paddingHorizontal: 20, paddingTop: 16,
                paddingBottom: insets.bottom + 16,
                backgroundColor: card, borderTopWidth: 1, borderColor: border, ...SHADOWS.md,
            }}>
                <TouchableOpacity
                    onPress={handleBook}
                    disabled={bookingLoading || !selectedTime}
                    activeOpacity={0.85}
                    style={[{
                        borderRadius: RADIUS.full, paddingVertical: 17,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: (selectedTime && !bookingLoading) ? COLORS.primary : (isDark ? '#2A2A2A' : COLORS.border),
                        flexDirection: 'row', gap: 10,
                    }, (selectedTime && !bookingLoading) ? SHADOWS.pink : {}]}
                >
                    {bookingLoading
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <>
                            <MaterialIcons name="event" size={18} color={selectedTime ? COLORS.white : muted} />
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.lg, color: selectedTime ? COLORS.white : muted }}>
                                {selectedTime ? `Confirm · ₦${total.toLocaleString()}` : 'Select a time first'}
                            </Text>
                        </>
                    }
                </TouchableOpacity>
            </View>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
            />
        </Animated.View>
        </View>
    );
};

// Inline compat shim — avoids importing a custom component just for text input
const { TextInput } = require('react-native');
const TextInputCompat = TextInput;
const { StyleSheet } = require('react-native');

// ── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label, required, subtitle, noMargin }: { label: string; required?: boolean; subtitle?: string; noMargin?: boolean }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: noMargin ? 0 : 14 }}>
            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: isDark ? COLORS.white : COLORS.textDark }}>{label}</Text>
            {required && <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: COLORS.primary }}>*</Text>}
            {subtitle && <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: COLORS.textMuted }}>{subtitle}</Text>}
        </View>
    );
};

export default BookingScreen;
