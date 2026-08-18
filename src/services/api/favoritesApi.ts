// src/services/api/favoritesApi.ts
// Wraps the existing `favorites` table for bookmark/save functionality.
// The `favorites` table uses `customer_id` as the user FK column name.
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';

/**
 * Add a service to the current user's favorites (bookmarks).
 * Idempotent — ignores unique-violation if already favorited.
 */
export const addFavorite = async (serviceId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('favorites')
        .insert({ customer_id: user.id, service_id: serviceId });

    // 23505 = unique_violation — already favorited, treat as success
    if (error && error.code !== '23505') throw error;
};

/**
 * Remove a service from the current user's favorites.
 */
export const removeFavorite = async (serviceId: string): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('service_id', serviceId);

    if (error) throw error;
};

/**
 * Check if the current user has favorited a specific service.
 */
export const checkIsFavorited = async (serviceId: string): Promise<boolean> => {
    const { user } = useUserStore.getState();
    if (!user?.id) return false;

    const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('customer_id', user.id)
        .eq('service_id', serviceId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get the total favorite/bookmark count for a service.
 */
export const fetchFavoriteCount = async (serviceId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId);

    if (error) return 0;
    return count ?? 0;
};

/**
 * Fetch both the current user's favorite status and the total count in one round trip.
 */
export const fetchServiceFavoriteStatus = async (
    serviceId: string
): Promise<{ isFavorited: boolean; favoriteCount: number }> => {
    const { user } = useUserStore.getState();

    const [countResult, favResult] = await Promise.all([
        supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', serviceId),
        user?.id
            ? supabase
                  .from('favorites')
                  .select('id')
                  .eq('customer_id', user.id)
                  .eq('service_id', serviceId)
                  .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ]);

    return {
        isFavorited: !!favResult.data,
        favoriteCount: countResult.count ?? 0,
    };
};
