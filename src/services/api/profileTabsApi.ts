// src/services/api/profileTabsApi.ts
import { supabase } from '../supabase';
import { Profile, Service } from '@/types';

export interface FollowUserItem {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    user_type: string | null;
    specialization: string | null;
    service_type: string | null;
    location: string | null;
    isFollowing: boolean;
}

export interface BookedServiceItem {
    id: string;
    date: string;
    time: string;
    status: string | null;
    total_amount: number | null;
    service: Service | null;
    agent: Profile | null;
}

/**
 * Fetch followers & following count for a given user.
 */
export const fetchFollowCounts = async (userId: string): Promise<{ followersCount: number; followingCount: number }> => {
    try {
        const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
            supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId),
            supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId),
        ]);

        return {
            followersCount: followersCount || 0,
            followingCount: followingCount || 0,
        };
    } catch (err) {
        console.error('[profileTabsApi] fetchFollowCounts error:', err);
        return { followersCount: 0, followingCount: 0 };
    }
};

/**
 * Fetch list of users following the given userId.
 */
export const fetchUserFollowers = async (targetUserId: string, currentUserId: string): Promise<FollowUserItem[]> => {
    try {
        const { data: followsData, error } = await supabase
            .from('follows')
            .select(`
                follower_id,
                profiles:follower_id (
                    id,
                    full_name,
                    avatar_url,
                    user_type,
                    specialization,
                    service_type,
                    location
                )
            `)
            .eq('following_id', targetUserId);

        if (error) throw error;
        if (!followsData) return [];

        // Fetch current user's follow list to check isFollowing for each user
        const { data: myFollowing } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId);

        const myFollowingIds = new Set((myFollowing || []).map((f: any) => f.following_id));

        return followsData
            .map((item: any) => {
                const p = item.profiles;
                if (!p) return null;
                return {
                    id: p.id,
                    full_name: p.full_name,
                    avatar_url: p.avatar_url,
                    user_type: p.user_type,
                    specialization: p.specialization,
                    service_type: p.service_type,
                    location: p.location,
                    isFollowing: myFollowingIds.has(p.id),
                };
            })
            .filter((p): p is FollowUserItem => p !== null);
    } catch (err) {
        console.error('[profileTabsApi] fetchUserFollowers error:', err);
        return [];
    }
};

/**
 * Fetch list of users that the given userId is following.
 */
export const fetchUserFollowing = async (targetUserId: string, currentUserId: string): Promise<FollowUserItem[]> => {
    try {
        const { data: followsData, error } = await supabase
            .from('follows')
            .select(`
                following_id,
                profiles:following_id (
                    id,
                    full_name,
                    avatar_url,
                    user_type,
                    specialization,
                    service_type,
                    location
                )
            `)
            .eq('follower_id', targetUserId);

        if (error) throw error;
        if (!followsData) return [];

        const { data: myFollowing } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId);

        const myFollowingIds = new Set((myFollowing || []).map((f: any) => f.following_id));

        return followsData
            .map((item: any) => {
                const p = item.profiles;
                if (!p) return null;
                return {
                    id: p.id,
                    full_name: p.full_name,
                    avatar_url: p.avatar_url,
                    user_type: p.user_type,
                    specialization: p.specialization,
                    service_type: p.service_type,
                    location: p.location,
                    isFollowing: myFollowingIds.has(p.id),
                };
            })
            .filter((p): p is FollowUserItem => p !== null);
    } catch (err) {
        console.error('[profileTabsApi] fetchUserFollowing error:', err);
        return [];
    }
};

/**
 * Fetch services liked (favorited) by userId.
 */
export const fetchUserLikedServices = async (userId: string): Promise<Service[]> => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                service_id,
                services:service_id (
                    *,
                    profiles:agent_id (
                        id,
                        full_name,
                        avatar_url,
                        specialization,
                        location
                    )
                )
            `)
            .eq('customer_id', userId);

        if (error) throw error;
        if (!data) return [];

        return data
            .map((item: any) => item.services)
            .filter((s): s is Service => s !== null && s !== undefined);
    } catch (err) {
        console.error('[profileTabsApi] fetchUserLikedServices error:', err);
        return [];
    }
};

/**
 * Fetch customer's booked services with full details.
 */
export const fetchCustomerBookedServices = async (userId: string): Promise<BookedServiceItem[]> => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                date,
                time,
                status,
                total_amount,
                services:service_id (
                    *,
                    profiles:agent_id (
                        id,
                        full_name,
                        avatar_url,
                        specialization,
                        location
                    )
                )
            `)
            .eq('customer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        return data.map((b: any) => ({
            id: b.id,
            date: b.date,
            time: b.time,
            status: b.status,
            total_amount: b.total_amount,
            service: b.services || null,
            agent: b.services?.profiles || null,
        }));
    } catch (err) {
        console.error('[profileTabsApi] fetchCustomerBookedServices error:', err);
        return [];
    }
};

/**
 * Fetch all published services by an agent.
 */
export const fetchAgentServices = async (agentId: string): Promise<Service[]> => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select(`
                *,
                profiles:agent_id (
                    id,
                    full_name,
                    avatar_url,
                    specialization,
                    location
                )
            `)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as Service[]) || [];
    } catch (err) {
        console.error('[profileTabsApi] fetchAgentServices error:', err);
        return [];
    }
};
