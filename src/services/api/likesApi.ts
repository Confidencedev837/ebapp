// src/services/api/likesApi.ts
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';

/**
 * Like a service. Ignores unique-violation (idempotent).
 */
export const likeService = async (serviceId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('service_likes')
        .insert({ user_id: user.id, service_id: serviceId });

    // 23505 = unique_violation — already liked, treat as success
    if (error && error.code !== '23505') throw error;
};

/**
 * Unlike a service.
 */
export const unlikeService = async (serviceId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('service_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId);

    if (error) throw error;
};

/**
 * Check if the current user has liked a service.
 */
export const checkIsLiked = async (serviceId: string): Promise<boolean> => {
    const { user } = useUserStore.getState();
    if (!user?.id) return false;

    const { data, error } = await supabase
        .from('service_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_id', serviceId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get the total like count for a service.
 */
export const fetchLikeCount = async (serviceId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('service_likes')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId);

    if (error) return 0;
    return count ?? 0;
};

/**
 * Fetch both the current user's like status and the total count in one round trip.
 */
export const fetchServiceLikeStatus = async (
    serviceId: string
): Promise<{ isLiked: boolean; likeCount: number }> => {
    const { user } = useUserStore.getState();

    const [countResult, likedResult] = await Promise.all([
        supabase
            .from('service_likes')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', serviceId),
        user?.id
            ? supabase
                  .from('service_likes')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('service_id', serviceId)
                  .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ]);

    return {
        isLiked: !!likedResult.data,
        likeCount: countResult.count ?? 0,
    };
};
