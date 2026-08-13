// src/services/api/followsApi.ts
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';

/**
 * Follow an agent by inserting into the follows table.
 */
export const followAgent = async (followingId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: followingId });

    if (error && error.code !== '23505') throw error; // 23505 = unique violation (already following)
};

/**
 * Unfollow an agent by deleting from the follows table.
 */
export const unfollowAgent = async (followingId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

    if (error) throw error;
};

/**
 * Check if the current user is following a given agent.
 */
export const checkIsFollowing = async (followingId: string): Promise<boolean> => {
    const { user } = useUserStore.getState();
    if (!user?.id) return false;

    const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};
