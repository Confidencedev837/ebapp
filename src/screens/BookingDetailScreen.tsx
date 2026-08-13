// src/screens/BookingDetailScreen.tsx
//
// ESCROW & MULTI-STEP SERVICE WORKFLOW:
//   pending     → "Waiting for agent confirmation"
//   confirmed   → "Agent confirmed — payment held in escrow"
//   on_the_way  → "Agent is on their way (ETA: 5-10 mins)"
//   in_progress → "Service in progress"
//   completed   → "Service done — customer confirms & funds release to agent wallet"
//   cancelled   → "Booking cancelled — refund processed"
//   no_show     → "Agent no-show reported — full refund issued"

import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { COLORS, FONTS, RADIUS, SHADOWS, FONT_SIZE } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { scheduleSystemPushNotification } from '@/services/notificationService';
import { getAvatarUrl } from '@/services/avatarUtils';
import Snackbar from '@/components/Snackbar';
import * as Haptics from 'expo-haptics';

type RootStackParamList = { BookingDetail: { bookingId: string } };
type BookingDetailRouteProp = RouteProp<RootStackParamList, 'BookingDetail'>;

// ── Status config — one place to control all status display ─────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; description: string }> = {
    pending:     { label: 'Pending',      icon: 'hourglass-top',     color: '#F59E0B', bg: '#FFF8E1', description: 'Waiting for the agent to confirm your appointment.' },
    confirmed:   { label: 'Confirmed',    icon: 'check-circle',      color: COLORS.success, bg: '#E8F5E9', description: 'Your appointment is confirmed. Payment is held securely in escrow.' },
    on_the_way:  { label: 'On The Way',   icon: 'navigation',        color: '#2563EB', bg: '#EFF6FF', description: 'Agent is on their way to your location (approx. 5–10 mins).' },
    in_progress: { label: 'In Progress',  icon: 'play-circle-filled',color: COLORS.primary, bg: '#FFF0F3', description: 'Your service is currently underway.' },
    completed:   { label: 'Completed',    icon: 'done-all',          color: COLORS.success, bg: '#E8F5E9', description: 'Service completed! Confirm completion below to release funds to agent.' },
    cancelled:   { label: 'Cancelled',    icon: 'cancel',            color: COLORS.error,   bg: '#FFEBEE', description: 'This booking has been cancelled.' },
    no_show:     { label: 'Agent No-Show',icon: 'person-off',        color: COLORS.error,   bg: '#FFEBEE', description: 'Agent did not show up. A full refund has been initiated.' },
};

const BookingDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingDetailRouteProp>();
    const { bookingId } = route.params;
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const bg     = isDark ? COLORS.bgDark      : COLORS.background;
    const card   = isDark ? COLORS.surfaceDark : COLORS.white;
    const text   = isDark ? COLORS.white       : COLORS.textDark;
    const muted  = isDark ? COLORS.textMutedDark : COLORS.textMuted;
    const border = isDark ? COLORS.borderDark  : COLORS.border;

    const [booking, setBooking]       = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [snackbar, setSnackbar]     = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false, message: '', type: 'info',
    });

    // Determine user role relative to this booking
    const isCustomer = profile?.id === booking?.customer_id;
    const isAgent    = profile?.id === booking?.services?.agent_id || profile?.user_type === 'agent';

    // ── Load booking + subscribe for real-time status changes ────────────
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (
                        id, name, price, image_url, duration_mins, category, agent_id,
                        profiles:agent_id ( id, full_name, avatar_url, location, specialization )
                    )
                `)
                .eq('id', bookingId)
                .single();

            if (!cancelled) {
                setBooking(error ? null : data);
                setLoading(false);
            }
        };

        load();

        // Real-time subscription — if agent or customer changes status, updates live
        const channel = supabase
            .channel(`booking-detail-${bookingId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings',
                filter: `id=eq.${bookingId}`,
            }, (payload) => {
                if (!cancelled) {
                    setBooking((prev: any) => ({ ...prev, ...payload.new }));
                    const cfg = STATUS_CONFIG[payload.new.status as string];
                    if (cfg) {
                        setSnackbar({ visible: true, message: `Status updated: ${cfg.label}`, type: 'info' });
                        useNotificationStore.getState().addNotification({
                            type: 'booking',
                            title: `Booking Status: ${cfg.label}`,
                            body: cfg.description,
                            actionRoute: 'BookingDetail',
                            actionParams: { bookingId },
                        });

                        // Trigger native system push notification (lock screen & system banner)
                        scheduleSystemPushNotification(
                            `Booking Update: ${cfg.label}`,
                            cfg.description,
                            { bookingId }
                        );
                    }
                }
            })
            .subscribe();

        return () => {
            cancelled = true;
            channel.unsubscribe();
        };
    }, [bookingId]);

    // ── Generic Status Updater with Exact Audit Logging ─────────────────────
    const handleUpdateStatus = async (newStatus: string, successMsg: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);
        try {
            const nowIso = new Date().toISOString();
            const updatePayload: Record<string, any> = {
                status: newStatus,
                updated_at: nowIso,
            };

            if (newStatus === 'confirmed') updatePayload.accepted_at = nowIso;
            if (newStatus === 'in_progress') updatePayload.started_at = nowIso;
            if (newStatus === 'completed') updatePayload.completed_at = nowIso;
            if (newStatus === 'cancelled') updatePayload.cancelled_at = nowIso;

            const { error } = await supabase
                .from('bookings')
                .update(updatePayload)
                .eq('id', bookingId);

            if (error) throw error;
            setBooking((prev: any) => ({ ...prev, ...updatePayload }));
            setSnackbar({ visible: true, message: successMsg, type: 'success' });
        } catch (err: any) {
            setSnackbar({ visible: true, message: err?.message || 'Action failed.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    // ── Confirm Completion & Release Payout to Agent ──────────────────────
    const handleConfirmCompletionAndPayout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            'Confirm Completion',
            'Are you sure the beauty service was completed to your satisfaction? This will release the funds to the agent.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm & Release Payment',
                    style: 'default',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            const nowIso = new Date().toISOString();
                            const { error: bErr } = await supabase
                                .from('bookings')
                                .update({
                                    status: 'completed',
                                    escrow_status: 'released',
                                    completed_at: nowIso,
                                    escrow_released_at: nowIso,
                                    updated_at: nowIso,
                                })
                                .eq('id', bookingId);

                            if (bErr) throw bErr;

                            setBooking((prev: any) => ({
                                ...prev,
                                status: 'completed',
                                escrow_status: 'released',
                                completed_at: nowIso,
                                escrow_released_at: nowIso,
                            }));
                            setSnackbar({ visible: true, message: 'Service confirmed! Payment released to agent wallet.', type: 'success' });
                        } catch (err: any) {
                            setSnackbar({ visible: true, message: err?.message || 'Completion failed', type: 'error' });
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <MaterialIcons name="event-busy" size={52} color={COLORS.textMuted} />
                <Text style={{ fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.h2, color: text, marginTop: 16 }}>Booking not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.full }}>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.md, color: COLORS.white }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const service   = booking.services;
    const agent     = service?.profiles;
    const status    = booking.status ?? 'pending';
    const cfg       = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
    const canCancel = ['pending', 'confirmed'].includes(status);
    const canReport = status === 'confirmed';

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* ── Header ── */}
                <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: card, borderBottomWidth: 1, borderColor: border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="arrow-back" size={22} color={text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.lg, color: text }}>Booking Details</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs, color: muted }}>#{bookingId.slice(-8).toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Status badge ── */}
                <View style={{ margin: 20, padding: 18, borderRadius: RADIUS.lg, backgroundColor: isDark ? card : cfg.bg, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: border }}>
                    <MaterialIcons name={cfg.icon as any} size={28} color={cfg.color} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.lg, color: cfg.color, marginBottom: 4 }}>{cfg.label}</Text>
                        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.base, color: muted, lineHeight: 20 }}>{cfg.description}</Text>
                    </View>
                </View>

                {/* ── Service info ── */}
                {service && (
                    <View style={{ marginHorizontal: 20, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, overflow: 'hidden', ...SHADOWS.sm }}>
                        {service.image_url?.[0] && (
                            <Image source={{ uri: service.image_url[0] }} style={{ width: '100%', height: 180 }} contentFit="cover" />
                        )}
                        <View style={{ padding: 16 }}>
                            <Text style={{ fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.h3, color: text, marginBottom: 8 }}>{service.name}</Text>
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <InfoChip icon="schedule" label={`${service.duration_mins} min`} muted={muted} />
                                <InfoChip icon="category" label={service.category || 'Beauty'} muted={muted} />
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Booking details ── */}
                <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, ...SHADOWS.sm }}>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.tiny, color: muted, letterSpacing: 3, textTransform: 'uppercase', margin: 16, marginBottom: 12 }}>Appointment</Text>
                    <DetailRow icon="event" label="Date" value={new Date(booking.date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} text={text} muted={muted} border={border} />
                    <DetailRow icon="schedule" label="Time" value={booking.time} text={text} muted={muted} border={border} />
                    {booking.customer_notes && <DetailRow icon="notes" label="Special Requests" value={booking.customer_notes} text={text} muted={muted} border={border} />}
                </View>

                {/* ── Agent info ── */}
                {agent && (
                    <View style={{ marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOWS.sm }}>
                        <Image source={{ uri: getAvatarUrl(agent.full_name, agent.avatar_url) }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.roseMid }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.lg, color: text }}>{agent.full_name}</Text>
                            <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: muted, marginTop: 2 }}>{agent.specialization} · {agent.location}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: `${COLORS.primary}15` }}
                        >
                            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.sm, color: COLORS.primary }}>View Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Payment / escrow info ── */}
                <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border, ...SHADOWS.sm }}>
                    <Text style={{ fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.tiny, color: muted, letterSpacing: 3, textTransform: 'uppercase', margin: 16, marginBottom: 12 }}>Payment & Escrow</Text>
                    <DetailRow icon="payments" label="Total Amount" value={`₦${(booking.total_amount ?? service?.price ?? 0).toLocaleString()}`} text={text} muted={muted} border={border} valueColor={COLORS.primary} />
                    <DetailRow
                        icon="security"
                        label="Escrow Status"
                        value={booking.escrow_status === 'released' ? 'Released to agent wallet' : booking.escrow_status === 'refunded' ? 'Refunded to customer' : 'Held securely in escrow'}
                        text={text} muted={muted} border={border}
                        valueColor={booking.escrow_status === 'released' ? COLORS.success : booking.escrow_status === 'refunded' ? COLORS.error : COLORS.primary}
                    />
                </View>

                {/* ── Live Status Actions (Agent & Customer Workflow) ── */}
                <View style={{ marginHorizontal: 20, marginTop: 24, gap: 12 }}>
                    {/* AGENT ACTIONS */}
                    {isAgent && status === 'confirmed' && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('on_the_way', 'Customer notified that you are on the way!')}
                            disabled={actionLoading}
                            style={{ padding: 16, borderRadius: RADIUS.lg, backgroundColor: '#2563EB', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        >
                            {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <>
                                    <Ionicons name="navigate-outline" size={20} color="#FFF" />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: '#FFF' }}>Mark "On The Way"</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {isAgent && status === 'on_the_way' && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('in_progress', 'Service status updated to In Progress.')}
                            disabled={actionLoading}
                            style={{ padding: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        >
                            {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <>
                                    <Ionicons name="play-circle-outline" size={20} color="#FFF" />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: '#FFF' }}>Start Service ("In Progress")</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {isAgent && status === 'in_progress' && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('completed', 'Service marked completed! Waiting for customer confirmation.')}
                            disabled={actionLoading}
                            style={{ padding: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.success, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        >
                            {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <>
                                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#FFF" />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: '#FFF' }}>Mark Service Completed</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* CUSTOMER COMPLETION & PAYOUT CONFIRMATION */}
                    {(booking.escrow_status !== 'released' && ['completed', 'in_progress'].includes(status)) && (
                        <TouchableOpacity
                            onPress={handleConfirmCompletionAndPayout}
                            disabled={actionLoading}
                            style={{ padding: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.success, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, ...SHADOWS.md }}
                        >
                            {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: '#FFF' }}>Confirm & Release Agent Payment</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {canReport && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('no_show', 'No-show reported. Customer support notified.')}
                            disabled={actionLoading}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: RADIUS.lg, backgroundColor: isDark ? '#2A1A1A' : '#FFEBEE', borderWidth: 1, borderColor: `${COLORS.error}30` }}
                        >
                            {actionLoading
                                ? <ActivityIndicator size="small" color={COLORS.error} />
                                : <>
                                    <MaterialIcons name="person-off" size={20} color={COLORS.error} />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: COLORS.error }}>Report Agent No-Show</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}
                    {canCancel && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('cancelled', 'Booking cancelled.')}
                            disabled={actionLoading}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: RADIUS.lg, backgroundColor: card, borderWidth: 1, borderColor: border }}
                        >
                            {actionLoading
                                ? <ActivityIndicator size="small" color={muted} />
                                : <>
                                    <MaterialIcons name="cancel" size={20} color={muted} />
                                    <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md, color: muted }}>Cancel Booking</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                duration={4000}
                onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
            />
        </View>
    );
};

// ── Micro components ─────────────────────────────────────────────────────────
const InfoChip = ({ icon, label, muted }: { icon: string; label: string; muted: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <MaterialIcons name={icon as any} size={14} color={muted} />
        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm, color: muted }}>{label}</Text>
    </View>
);

const DetailRow = ({ icon, label, value, text, muted, border, valueColor }: {
    icon: string; label: string; value: string;
    text: string; muted: string; border: string; valueColor?: string;
}) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: border }}>
        <MaterialIcons name={icon as any} size={16} color={muted} style={{ marginTop: 2, marginRight: 12 }} />
        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.md, color: muted, width: 100 }}>{label}</Text>
        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.md, color: valueColor ?? text, flex: 1, flexWrap: 'wrap' }}>{value}</Text>
    </View>
);

export default BookingDetailScreen;
