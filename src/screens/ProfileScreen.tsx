// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Alert,
} from 'react-native';
import AnimatedSection from '@/components/AnimatedSection';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { getAvatarUrl } from '@/services/avatarUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/services/supabase';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import ProfileTopMenu from '@/components/profile/ProfileTopMenu';
import {
    AgentPostsGridTab,
    BookedServicesTab,
    FollowListTab,
    LikedPostsTab,
} from '@/components/profile/ProfileTabs';
import {
    fetchFollowCounts,
    fetchUserFollowers,
    fetchUserFollowing,
    fetchUserLikedServices,
    fetchCustomerBookedServices,
    fetchAgentServices,
    FollowUserItem,
    BookedServiceItem,
} from '@/services/api/profileTabsApi';
import { Service } from '@/types';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 190;

export const ProfileScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const { profile: user } = useUserStore();

    // ── Tab State ─────────────────────────────────────────────────────────────
    const isAgent = user?.user_type === 'agent';
    const defaultTab = isAgent ? 'posts' : 'liked';
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    // ── Follow Counts State ───────────────────────────────────────────────────
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    // ── Tab Data State ────────────────────────────────────────────────────────
    const [tabLoading, setTabLoading] = useState<boolean>(false);
    const [agentServices, setAgentServices] = useState<Service[]>([]);
    const [likedServices, setLikedServices] = useState<Service[]>([]);
    const [bookedServices, setBookedServices] = useState<BookedServiceItem[]>([]);
    const [followersList, setFollowersList] = useState<FollowUserItem[]>([]);
    const [followingList, setFollowingList] = useState<FollowUserItem[]>([]);


    // ── Fetch Initial Profile Data ────────────────────────────────────────────
    const loadProfileData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const counts = await fetchFollowCounts(user.id);
            setFollowersCount(counts.followersCount);
            setFollowingCount(counts.followingCount);
        } catch (err) {
            console.error('[ProfileScreen] Error loading follow counts:', err);
        }
    }, [user?.id]);

    // ── Fetch Tab Content ─────────────────────────────────────────────────────
    const loadTabData = useCallback(async () => {
        if (!user?.id) return;
        setTabLoading(true);
        try {
            if (activeTab === 'posts' && isAgent) {
                const data = await fetchAgentServices(user.id);
                setAgentServices(data);
            } else if (activeTab === 'liked') {
                const data = await fetchUserLikedServices(user.id);
                setLikedServices(data);
            } else if (activeTab === 'booked' && !isAgent) {
                const data = await fetchCustomerBookedServices(user.id);
                setBookedServices(data);
            } else if (activeTab === 'followers') {
                const data = await fetchUserFollowers(user.id, user.id);
                setFollowersList(data);
            } else if (activeTab === 'following') {
                const data = await fetchUserFollowing(user.id, user.id);
                setFollowingList(data);
            }
        } catch (err) {
            console.error('[ProfileScreen] Error loading tab data:', err);
        } finally {
            setTabLoading(false);
        }
    }, [user?.id, activeTab, isAgent]);

    useFocusEffect(
        useCallback(() => {
            loadProfileData();
            loadTabData();
        }, [loadProfileData, loadTabData])
    );

    useEffect(() => {
        loadTabData();
    }, [activeTab, loadTabData]);

    // ── Tab Config ────────────────────────────────────────────────────────────
    const tabs = useMemo(() => {
        if (isAgent) {
            return [
                { key: 'posts', label: 'Services', icon: 'grid-view' },
                { key: 'followers', label: 'Followers', icon: 'people' },
                { key: 'following', label: 'Following', icon: 'person-add' },
                { key: 'liked', label: 'Liked', icon: 'favorite' },
            ];
        }
        return [
            { key: 'liked', label: 'Liked', icon: 'favorite' },
            { key: 'booked', label: 'Booked', icon: 'event-available' },
            { key: 'following', label: 'Following', icon: 'person-add' },
            { key: 'followers', label: 'Followers', icon: 'people' },
        ];
    }, [isAgent]);

    if (!user) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const defaultBanner = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000';
    const bannerUrl = (user as any).banner_url || defaultBanner;
    const avatarUrl = getAvatarUrl(user.full_name, user.avatar_url);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['bottom', 'left', 'right']}>
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    {/* ── Banner Header ────────────────────────────────────────────── */}
                    <AnimatedSection delay={0} direction="down" distance={20} style={styles.bannerContainer}>
                        <Image
                            source={{ uri: bannerUrl }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Top Action Menu (Three-dot) */}
                        <View style={[styles.topActionsRow, { top: Math.max(insets.top + 8, 16) }]}>
                            <ProfileTopMenu
                                onOpenSettings={() => navigation.navigate('Settings')}
                                buttonColor="#FFF"
                            />
                        </View>
                    </AnimatedSection>

                    {/* ── Profile Meta Section (Overlapping Avatar) ────────────────── */}
                    <View style={[styles.profileHeaderContent, { backgroundColor: isDark ? COLORS.bgDark : COLORS.background }]}>
                        {/* Overlapping Avatar */}
                        <AnimatedSection delay={100} direction="up" distance={30} style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatarImage}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('EditProfile');
                                }}
                                style={[styles.editAvatarBadge, SHADOWS.sm]}
                                activeOpacity={0.85}
                            >
                                <MaterialIcons name="edit" size={14} color="#FFF" />
                            </TouchableOpacity>
                        </AnimatedSection>

                        {/* User Details */}
                        <AnimatedSection delay={200} direction="up" distance={30} style={styles.userInfoWrap}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.userNameTxt, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                    {user.full_name || 'Beauty User'}
                                </Text>
                                {isAgent && (
                                    <View style={styles.verifiedBadge}>
                                        <MaterialIcons name="verified" size={16} color={COLORS.primary} />
                                    </View>
                                )}
                            </View>

                            {/* Role / Specialization Badge */}
                            <View style={styles.badgeRow}>
                                <View style={[styles.typeBadge, { backgroundColor: isAgent ? 'rgba(255,98,137,0.14)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') }]}>
                                    <MaterialIcons
                                        name={isAgent ? 'brush' : 'person-outline'}
                                        size={12}
                                        color={isAgent ? COLORS.primary : COLORS.textMuted}
                                    />
                                    <Text style={[styles.typeBadgeTxt, { color: isAgent ? COLORS.primary : COLORS.textMuted }]}>
                                        {isAgent ? (user.specialization || 'Beauty Professional') : 'Beauty Enthusiast'}
                                    </Text>
                                </View>

                                {user.location && (
                                    <View style={styles.locationBadge}>
                                        <MaterialIcons name="place" size={12} color={COLORS.textMuted} />
                                        <Text style={[styles.locationTxt, { color: COLORS.textMuted }]}>
                                            {user.location}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Bio */}
                            <Text style={[styles.bioTxt, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
                                {user.bio ? user.bio : 'No bio added yet. Edit profile to share your beauty story.'}
                            </Text>

                            {/* Follower & Following Count Cards */}
                            <View style={styles.countsRow}>
                                <TouchableOpacity
                                    style={[styles.countCard, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setActiveTab('followers');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.countNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {followersCount}
                                    </Text>
                                    <Text style={[styles.countLabel, { color: COLORS.textMuted }]}>Followers</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.countCard, { backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setActiveTab('following');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.countNumber, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                                        {followingCount}
                                    </Text>
                                    <Text style={[styles.countLabel, { color: COLORS.textMuted }]}>Following</Text>
                                </TouchableOpacity>
                            </View>
                        </AnimatedSection>

                        {/* Profile Completion Banner if incomplete */}
                        <AnimatedSection delay={300} direction="right" distance={30} style={{ marginTop: 16 }}>
                            <ProfileCompletionBanner />
                        </AnimatedSection>

                        {/* Dashboard Shortcut Switch */}
                        <AnimatedSection delay={400} direction="left" distance={30}>
                            <TouchableOpacity
                            style={[styles.dashboardCard, SHADOWS.pink]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                navigation.navigate(isAgent ? 'AgentDashboard' : 'CustomerDashboard');
                            }}
                            activeOpacity={0.9}
                        >
                            <View style={styles.dashboardCardLeft}>
                                <View style={styles.dashboardIconWrap}>
                                    <MaterialIcons name="dashboard" size={22} color="#FFF" />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.dashboardTitle}>
                                        {isAgent ? 'Agent Dashboard' : 'My Bookings & Schedule'}
                                    </Text>
                                    <Text style={styles.dashboardSub}>
                                        Manage your activity, schedule & appointments
                                    </Text>
                                </View>
                            </View>
                            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </AnimatedSection>

                        {/* ── Tab Bar Navigation ─────────────────────────────────────── */}
                        <AnimatedSection delay={500} direction="up" distance={20} style={[styles.tabBarContainer, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <TouchableOpacity
                                        key={tab.key}
                                        style={[
                                            styles.tabItem,
                                            isActive && [styles.activeTabItem, { borderBottomColor: COLORS.primary }],
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setActiveTab(tab.key);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialIcons
                                            name={tab.icon as any}
                                            size={18}
                                            color={isActive ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <Text
                                            style={[
                                                styles.tabLabel,
                                                {
                                                    color: isActive ? COLORS.primary : COLORS.textMuted,
                                                    fontFamily: isActive ? FONTS.sansBold : FONTS.sansMedium,
                                                },
                                            ]}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </AnimatedSection>

                        {/* ── Tab Content Views ───────────────────────────────────────── */}
                        <AnimatedSection delay={600} direction="up" distance={40} style={styles.tabContentArea}>
                            {activeTab === 'posts' && isAgent && (
                                <AgentPostsGridTab
                                    services={agentServices}
                                    loading={tabLoading}
                                    isDark={isDark}
                                />
                            )}

                            {activeTab === 'booked' && !isAgent && (
                                <BookedServicesTab
                                    bookings={bookedServices}
                                    loading={tabLoading}
                                    isDark={isDark}
                                />
                            )}

                            {activeTab === 'liked' && (
                                <LikedPostsTab
                                    likedServices={likedServices}
                                    loading={tabLoading}
                                    isDark={isDark}
                                />
                            )}

                            {activeTab === 'followers' && (
                                <FollowListTab
                                    users={followersList}
                                    loading={tabLoading}
                                    isDark={isDark}
                                    emptyTitle="No followers yet"
                                    emptySub="When other beauty users follow you, they will be listed here."
                                    currentUserId={user.id}
                                />
                            )}

                            {activeTab === 'following' && (
                                <FollowListTab
                                    users={followingList}
                                    loading={tabLoading}
                                    isDark={isDark}
                                    emptyTitle="Not following anyone yet"
                                    emptySub="Discover and follow top beauty artists to get updates on their latest styles."
                                    currentUserId={user.id}
                                />
                            )}
                        </AnimatedSection>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerContainer: {
        height: BANNER_HEIGHT,
        width: '100%',
        position: 'relative',
    },
    topActionsRow: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
    },
    profileHeaderContent: {
        paddingHorizontal: SPACING.screen,
        paddingBottom: 40,
    },
    avatarWrapper: {
        position: 'relative',
        width: 90,
        height: 90,
        marginTop: -45,
    },
    avatarImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: COLORS.primary,
        backgroundColor: '#E5E7EB',
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userInfoWrap: {
        marginTop: 14,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userNameTxt: {
        fontFamily: FONTS.playfairBold,
        fontSize: 24,
    },
    verifiedBadge: {
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    typeBadgeTxt: {
        fontFamily: FONTS.sansMedium,
        fontSize: 11,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    locationTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
    },
    bioTxt: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 10,
    },
    countsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    countCard: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        alignItems: 'center',
    },
    countNumber: {
        fontFamily: FONTS.montserratBold,
        fontSize: 18,
    },
    countLabel: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        marginTop: 2,
    },
    dashboardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.primary,
        marginTop: 16,
    },
    dashboardCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dashboardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashboardTitle: {
        fontFamily: FONTS.montserratBold,
        fontSize: 14,
        color: '#FFF',
    },
    dashboardSub: {
        fontFamily: FONTS.sansRegular,
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 1,
    },
    tabBarContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginTop: 24,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {},
    tabLabel: {
        fontSize: 12,
    },
    tabContentArea: {
        marginTop: 8,
    },
});

export default ProfileScreen;
