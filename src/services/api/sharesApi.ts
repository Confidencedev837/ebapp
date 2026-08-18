// src/services/api/sharesApi.ts
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/useUserStore';

/**
 * Track a share event in Supabase.
 * Only call this AFTER the native share sheet confirms success (user completed action).
 * @param serviceId  The service that was shared.
 * @param shareType  Optional label (e.g. 'native', 'copy', 'message').
 */
export const trackShare = async (
    serviceId: string,
    shareType?: string
): Promise<void> => {
    const { user } = useUserStore.getState();
    if (!user?.id) return; // silent — unauthenticated users shouldn't reach here

    const { error } = await supabase
        .from('service_shares')
        .insert({
            user_id: user.id,
            service_id: serviceId,
            share_type: shareType ?? 'native',
        });

    if (error) {
        // Log but do not throw — share tracking failure must not block the UI
        console.warn('[sharesApi] trackShare error:', error.message);
    }
};

/**
 * Get the total share count for a service across all users.
 */
export const fetchShareCount = async (serviceId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('service_shares')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId);

    if (error) return 0;
    return count ?? 0;
};
