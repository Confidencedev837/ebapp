// src/screens/CustomerDashboardScreen.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useUserStore } from '@/store/useUserStore';
import { useBookings } from '@/hooks/useBookings';
import { COLORS, FONTS, RADIUS, SHADOWS, UNIVERSAL_BLURHASH } from '@/constants/theme';
import { formatTime12Hour, formatFriendlyDate } from '@/utils/timeFormat';
import { useTheme } from '@/context/ThemeContext';
import { Booking } from '@/types';
import { useNavigation } from '@react-navigation/native';
import { EmptyState } from '@/components/EmptyState';
import BrandedSpinner from '@/components/BrandedSpinner';

const BookingCard = ({ booking, isOverdue }: { booking: Booking; isOverdue?: boolean }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();

    const getStatusColor = (status: string) => {
        if (isOverdue) return '#F59E0B'; // Amber for overdue / awaiting update
        switch (status) {
            case 'confirmed': return COLORS.success;
            case 'pending': return COLORS.gold;
            case 'cancelled':
            case 'rejected': return '#EF4444';
            case 'completed': return COLORS.primary;
            default: return COLORS.textMuted;
        }
    };

    const statusLabel = isOverdue ? 'Awaiting Update' : booking.status;
    const statusColor = getStatusColor(booking.status || '');

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? COLORS.surfaceDark : COLORS.white,
                    borderColor: isOverdue
                        ? (isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)')
                        : (isDark ? COLORS.borderDark : COLORS.border),
                },
                SHADOWS.sm,
            ]}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <View style={styles.metaTimeGroup}>
                    <MaterialIcons name="event" size={15} color={COLORS.textMuted} />
                    <Text style={[styles.metaText, { color: COLORS.textMuted }]}>
                        {formatFriendlyDate(booking.date)}
                    </Text>
                    <View style={styles.dotSeparator} />
                    <MaterialIcons name="schedule" size={15} color={COLORS.textMuted} />
                    <Text style={[styles.metaText, { color: COLORS.textMuted }]}>
                        {formatTime12Hour(booking.time)}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusPill,
                        {
                            backgroundColor: `${statusColor}18`,
                            borderColor: `${statusColor}35`,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusPillText,
                            { color: statusColor },
                        ]}
                    >
                        {statusLabel?.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Image
                    source={{ uri: booking.services?.image_url?.[0] }}
                    style={styles.serviceImage}
                    contentFit="cover"
                    placeholder={{ blurhash: UNIVERSAL_BLURHASH }}
                    transition={200}
                />
                <View style={styles.serviceDetails}>
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.serviceName,
                            { color: isDark ? COLORS.white : COLORS.textDark },
                        ]}
                    >
                        {booking.services?.name || 'Beauty Service'}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={[styles.agentName, { color: COLORS.textMuted }]}
                    >
                        with {booking.profiles?.full_name || 'Specialist'}
                    </Text>
                    {isOverdue && (
                        <Text style={styles.overdueNote}>
                            Appointment day has passed. Tap to view status.
                        </Text>
                    )}
                </View>
                <View style={styles.priceColumn}>
                    <Text style={[styles.priceText, { color: COLORS.primary }]}>
                        ₦{booking.services?.price?.toLocaleString() || '0'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const CustomerDashboardScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState('Upcoming');
    const [refreshing, setRefreshing] = useState(false);

    const { profile } = useUserStore();
    const { bookings, loading, refetch } = useBookings(profile?.id || null);

    const tabs = ['Upcoming', 'Awaiting Update', 'Completed', 'Cancelled'];
    const today = new Date().toISOString().split('T')[0];

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const isPast = b.date ? b.date < today : false;
            const isUnfinished = b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_progress';

            if (activeTab === 'Upcoming') {
                return !isPast && isUnfinished;
            }
            if (activeTab === 'Awaiting Update') {
                return isPast && isUnfinished;
            }
            if (activeTab === 'Completed') {
                return b.status === 'completed';
            }
            if (activeTab === 'Cancelled') {
                return b.status === 'cancelled' || b.status === 'rejected';
            }
            return true;
        });
    }, [bookings, activeTab, today]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } catch (err) {
            console.error('Failed to refetch bookings:', err);
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const getEmptyStateProps = () => {
        switch (activeTab) {
            case 'Upcoming':
                return {
                    title: 'No upcoming appointments',
                    description: 'Ready for your next glow up? Discover and book top beauty specialists.',
                    actionTitle: 'Explore services',
                    onAction: () => navigation.navigate('Services'),
                };
            case 'Awaiting Update':
                return {
                    title: 'No pending updates',
                    description: 'All your past appointments have been marked and updated.',
                };
            case 'Completed':
                return {
                    title: 'No completed bookings yet',
                    description: 'Appointments you finish with beauty specialists will appear here.',
                };
            case 'Cancelled':
                return {
                    title: 'No cancelled bookings',
                    description: 'Cancelled or declined appointments will show up here.',
                };
            default:
                return {
                    title: 'No bookings found',
                    description: 'You have no bookings under this category.',
                };
        }
    };

    const emptyProps = getEmptyStateProps();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? COLORS.bgDark : COLORS.background }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                    My Bookings
                </Text>
                <Text style={[styles.headerSubtitle, { color: COLORS.textMuted }]}>
                    Keep track of your beauty appointments
                </Text>
            </View>

            {/* Tabs */}
            <View
                style={[
                    styles.tabBar,
                    { borderBottomColor: isDark ? COLORS.borderDark : COLORS.border },
                ]}
            >
                <FlatList
                    horizontal
                    data={tabs}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={({ item: tab }) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveTab(tab)}
                                style={[
                                    styles.tabButton,
                                    isActive && styles.activeTabButton,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        {
                                            fontFamily: isActive ? FONTS.sansBold : FONTS.sansMedium,
                                            color: isActive
                                                ? (isDark ? COLORS.white : COLORS.textDark)
                                                : COLORS.textMuted,
                                        },
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Booking List */}
            <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        isOverdue={activeTab === 'Awaiting Update' || (item.date ? item.date < today && item.status !== 'completed' && item.status !== 'cancelled' : false)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                ListEmptyComponent={() => (
                    loading ? (
                        <View style={{ paddingTop: 60, alignItems: 'center' }}>
                            <BrandedSpinner size="large" showLabel labelText="Loading bookings..." />
                        </View>
                    ) : (
                        <View style={{ paddingTop: 30 }}>
                            <EmptyState
                                type="bookings"
                                title={emptyProps.title}
                                description={emptyProps.description}
                                primaryActionTitle={emptyProps.actionTitle}
                                onPrimaryAction={emptyProps.onAction}
                            />
                        </View>
                    )
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontFamily: FONTS.playfairBold,
        fontSize: 28,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontFamily: FONTS.sansRegular,
        fontSize: 13,
        marginTop: 2,
    },
    tabBar: {
        borderBottomWidth: 1,
        paddingTop: 12,
    },
    tabButton: {
        paddingRight: 24,
        paddingBottom: 10,
    },
    activeTabButton: {
        borderBottomWidth: 3,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    card: {
        padding: 14,
        marginBottom: 12,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metaTimeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontFamily: FONTS.sansMedium,
        fontSize: 12,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 4,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
        borderWidth: 1,
    },
    statusPillText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 9,
        letterSpacing: 0.5,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceImage: {
        width: 60,
        height: 60,
        borderRadius: RADIUS.md,
    },
    serviceDetails: {
        marginLeft: 12,
        flex: 1,
    },
    serviceName: {
        fontFamily: FONTS.montserratBold,
        fontSize: 15,
        marginBottom: 2,
    },
    agentName: {
        fontFamily: FONTS.sansRegular,
        fontSize: 12,
    },
    overdueNote: {
        fontFamily: FONTS.sansMedium,
        fontSize: 11,
        color: '#F59E0B',
        marginTop: 4,
    },
    priceColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceText: {
        fontFamily: FONTS.montserratBold,
        fontSize: 15,
    },
});

export default CustomerDashboardScreen;
