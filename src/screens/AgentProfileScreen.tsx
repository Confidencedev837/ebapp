// src/screens/AgentProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAvatarUrl } from '@/services/avatarUtils';
import VerifiedBadge from '@/components/VerifiedBadge';
import OnlineIndicator from '@/components/OnlineIndicator';
import { followAgent, unfollowAgent, checkIsFollowing } from '@/services/api/followsApi';
import { useUserStore } from '@/store/useUserStore';
import { Profile, Service } from '@/types';
import * as Haptics from 'expo-haptics';

type RootStackParamList = { AgentProfile: { agentId: string } };
type AgentProfileRouteProp = RouteProp<RootStackParamList, 'AgentProfile'>;

const AgentProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<AgentProfileRouteProp>();
    const { agentId } = route.params;
    const { theme } = useTheme();
    const { user } = useUserStore();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { animStyle } = useScreenAnimation();

    const [loading, setLoading] = useState(true);
    const [agent, setAgent] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = user?.id === agentId;

    // ── Fetch agent profile + services ──────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                // Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', agentId)
                    .single();

                if (profileError || !profileData) {
                    console.warn('[AgentProfile] Profile not found:', profileError?.message);
                    if (!cancelled) setAgent(null);
                    return;
                }

                if (!cancelled) setAgent(profileData as Profile);

                // Fetch services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('agent_id', agentId)
                    .order('created_at', { ascending: false });

                if (!cancelled && servicesData) {
                    setServices(servicesData as Service[]);
                }

                // Check follow state
                if (user?.id && user.id !== agentId) {
                    const following = await checkIsFollowing(agentId);
                    if (!cancelled) setIsFollowing(following);
                }
            } catch (err) {
                console.error('[AgentProfile] Error loading:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [agentId, user?.id]);

    // ── Follow / Unfollow ────────────────────────────────────────────────
    const handleFollowToggle = useCallback(async () => {
        if (!user?.id || isOwnProfile || followLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowAgent(agentId);
                setIsFollowing(false);
            } else {
                await followAgent(agentId);
                setIsFollowing(true);
            }
        } catch (_) { /* silent */ } finally {
            setFollowLoading(false);
        }
    }, [isFollowing, followLoading, agentId, user?.id]);

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────
    if (!agent) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <MaterialIcons name="person-off" size={56} color={COLORS.textMuted} />
                <Text style={[styles.notFoundTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    Agent not found
                </Text>
                <Text style={[styles.notFoundSub, { color: COLORS.textMuted }]}>
                    This profile may have been removed or is unavailable.
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                    <Text style={styles.goBackTxt}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(agent.full_name, agent.avatar_url);

    return (
        <View style={[styles.root, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* ── Hero Banner ───────────────────────────────────────── */}
                <View style={styles.heroBanner}>
                    <Image
                        source={{ uri: (agent as any).banner_url || `https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000` }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.75)']}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Header nav */}
                    <View style={[styles.heroNav, { paddingTop: insets.top + 12 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroNavBtn}>
                            <MaterialIcons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.heroNavBtn}>
                            <MaterialIcons name="share" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Overlapping profile section ───────────────────────── */}
                <View style={styles.profileSection}>
                    <View style={styles.profileHeaderRow}>
                        {/* Avatar */}
                        <View style={[styles.avatarRing, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white }, SHADOWS.md]}>
                            <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} contentFit="cover" />
                            <View style={styles.verifiedWrap}><VerifiedBadge /></View>
                            <View style={styles.onlineWrap}>
                                <OnlineIndicator lastSeen={(agent as any).last_seen} />
                            </View>
                        </View>

                        {/* Follow + Message buttons */}
                        {!isOwnProfile && (
                            <View style={styles.actionBtns}>
                                <TouchableOpacity
                                    style={[styles.msgBtn, { borderColor: isDark ? COLORS.borderDark : COLORS.border, backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white }]}
                                >
                                    <MaterialIcons name="chat-bubble-outline" size={20} color={isDark ? COLORS.white : COLORS.textDark} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleFollowToggle}
                                    disabled={followLoading}
                                    style={[
                                        styles.followBtn,
                                        isFollowing ? styles.followingBtn : styles.notFollowingBtn,
                                        SHADOWS.pink,
                                    ]}
                                >
                                    {isFollowing
                                        ? <MaterialIcons name="check" size={14} color={COLORS.white} />
                                        : null
                                    }
                                    <Text style={[styles.followBtnTxt, { color: COLORS.white, marginLeft: isFollowing ? 4 : 0 }]}>
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Identity */}
                    <View style={styles.identity}>
                        <Text style={[styles.agentName, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            {agent.full_name}
                        </Text>

                        <View style={styles.tagRow}>
                            {(agent as any).specialization && (
                                <View style={[styles.specBadge, { backgroundColor: `${COLORS.primary}18` }]}>
                                    <MaterialIcons name="auto-awesome" size={11} color={COLORS.primary} />
                                    <Text style={styles.specTxt}>{(agent as any).specialization}</Text>
                                </View>
                            )}
                            {agent.location && (
                                <View style={styles.locationChip}>
                                    <MaterialIcons name="place" size={13} color={COLORS.textMuted} />
                                    <Text style={styles.locationChipTxt}>{agent.location}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Stats row */}
                    <View style={[styles.statsRow, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                {(agent as any).years_exp ?? '—'}+
                            </Text>
                            <Text style={styles.statLabel}>Years</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                {services.length}
                            </Text>
                            <Text style={styles.statLabel}>Services</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
                        <View style={styles.statItem}>
                            <View style={styles.ratingRow}>
                                <Text style={[styles.statValue, { color: isDark ? COLORS.white : COLORS.textDark }]}>4.9</Text>
                                <MaterialIcons name="star" size={15} color={COLORS.gold} style={{ marginLeft: 3 }} />
                            </View>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>

                    {/* Bio */}
                    {(agent as any).bio && (
                        <View style={styles.bioSection}>
                            <Text style={styles.sectionHeading}>About</Text>
                            <Text style={[styles.bioTxt, { color: isDark ? COLORS.textMutedDark : COLORS.textDark }]}>
                                {(agent as any).bio}
                            </Text>
                        </View>
                    )}

                    {/* Services */}
                    <View style={styles.servicesSection}>
                        <Text style={styles.sectionHeading}>Services Offered</Text>

                        {services.length === 0 ? (
                            <View style={styles.emptyServices}>
                                <MaterialIcons name="spa" size={36} color={COLORS.textMuted} />
                                <Text style={{ color: COLORS.textMuted, fontFamily: FONTS.sansRegular, marginTop: 8 }}>
                                    No services listed yet
                                </Text>
                            </View>
                        ) : (
                            services.map((service) => (
                                <TouchableOpacity
                                    key={service.id}
                                    onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                                    style={[styles.serviceCard, {
                                        backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                                        borderColor: isDark ? COLORS.borderDark : COLORS.border,
                                    }]}
                                    activeOpacity={0.8}
                                >
                                    {service.image_url?.[0] && (
                                        <Image
                                            source={{ uri: service.image_url[0] }}
                                            style={styles.serviceThumb}
                                            contentFit="cover"
                                        />
                                    )}
                                    <View style={styles.serviceMeta}>
                                        <Text style={[styles.serviceTitle, { color: isDark ? COLORS.white : COLORS.textDark }]} numberOfLines={1}>
                                            {service.name}
                                        </Text>
                                        <View style={styles.serviceDetailRow}>
                                            <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                            <Text style={styles.serviceDetailTxt}>{service.duration_mins} mins</Text>
                                        </View>
                                        <View style={styles.servicePriceRow}>
                                            <Text style={styles.servicePrice}>₦{service.price.toLocaleString()}</Text>
                                            <View style={styles.arrowChip}>
                                                <MaterialIcons name="arrow-forward" size={14} color={COLORS.textMuted} />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Sticky Book Session button */}
            <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16, borderTopColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                <TouchableOpacity
                    style={[styles.bookSessionBtn, SHADOWS.pink]}
                    activeOpacity={0.9}
                >
                    <MaterialIcons name="event" size={20} color="white" />
                    <Text style={styles.bookSessionTxt}>Book a Session</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    notFoundTitle: { fontFamily: FONTS.playfairBold, fontSize: 22, marginTop: 16 },
    notFoundSub: { fontFamily: FONTS.sansRegular, fontSize: 14, textAlign: 'center', marginTop: 8 },
    goBackBtn: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
    goBackTxt: { fontFamily: FONTS.montserratBold, fontSize: 14, color: COLORS.white },

    // Hero
    heroBanner: { height: 240, position: 'relative' },
    heroNav: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
    heroNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },

    // Profile
    profileSection: { paddingHorizontal: 20, marginTop: -56 },
    profileHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    avatarRing: { width: 116, height: 116, borderRadius: 58, padding: 3, position: 'relative' },
    avatarLarge: { width: '100%', height: '100%', borderRadius: 55 },
    verifiedWrap: { position: 'absolute', bottom: 2, right: 2 },
    onlineWrap: { position: 'absolute', top: 6, right: 6 },

    // Action buttons
    actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    msgBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    followBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, borderRadius: RADIUS.full },
    notFollowingBtn: { backgroundColor: COLORS.primary },
    followingBtn: { backgroundColor: '#16A34A' },
    followBtnTxt: { fontFamily: FONTS.montserratBold, fontSize: 13 },

    // Identity
    identity: { marginTop: 18 },
    agentName: { fontFamily: FONTS.playfairBold, fontSize: 28, lineHeight: 32 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
    specBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, gap: 4 },
    specTxt: { fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.primary },
    locationChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationChipTxt: { fontFamily: FONTS.sansRegular, fontSize: 13, color: COLORS.textMuted },

    // Stats
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: FONTS.montserratBold, fontSize: 20 },
    statLabel: { fontFamily: FONTS.montserratBold, fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
    statDivider: { width: 1, height: 32 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },

    // Bio
    bioSection: { marginTop: 24 },
    sectionHeading: { fontFamily: FONTS.montserratBold, fontSize: 10, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 },
    bioTxt: { fontFamily: FONTS.sansRegular, fontSize: 15, lineHeight: 24 },

    // Services
    servicesSection: { marginTop: 28 },
    emptyServices: { alignItems: 'center', paddingVertical: 32 },
    serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12, borderWidth: 1, borderRadius: RADIUS.lg },
    serviceThumb: { width: 90, height: 90, borderRadius: RADIUS.md },
    serviceMeta: { flex: 1, marginLeft: 14 },
    serviceTitle: { fontFamily: FONTS.sansBold, fontSize: 15, marginBottom: 5 },
    serviceDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    serviceDetailTxt: { fontFamily: FONTS.sansRegular, fontSize: 12, color: COLORS.textMuted },
    servicePriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    servicePrice: { fontFamily: FONTS.montserratBold, fontSize: 18, color: COLORS.primary },
    arrowChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },

    // Sticky bottom
    stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent' },
    bookSessionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, gap: 8 },
    bookSessionTxt: { fontFamily: FONTS.montserratBold, fontSize: 15, color: COLORS.white },
});

export default AgentProfileScreen;
