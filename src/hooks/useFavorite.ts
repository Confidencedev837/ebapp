// src/hooks/useFavorite.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/useUserStore';
import {
    fetchServiceFavoriteStatus,
    addFavorite,
    removeFavorite,
} from '@/services/api/favoritesApi';

interface UseFavoriteReturn {
    isFavorited: boolean;
    favoriteCount: number;
    loading: boolean;
    toggleFavorite: () => Promise<void>;
}

/**
 * Hook that wires up the favorite/bookmark state for a given service.
 *
 * - Loads real state from Supabase on mount.
 * - Optimistic UI: toggles instantly, rolls back on failure.
 * - Prevents concurrent double-taps.
 * - No-ops if user is unauthenticated.
 *
 * NOTE: Writes to the existing `favorites` table (customer_id + service_id),
 * which is the same table displayed in the Profile "Liked" tab — so adding/
 * removing a favorite here is immediately reflected in that tab on next load.
 */
export const useFavorite = (serviceId: string | null | undefined): UseFavoriteReturn => {
    const { user } = useUserStore();
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const inFlight = useRef(false);

    // ── Load initial state ──────────────────────────────────────────────────
    useEffect(() => {
        if (!serviceId) return;
        let cancelled = false;

        fetchServiceFavoriteStatus(serviceId)
            .then(({ isFavorited: fav, favoriteCount: count }) => {
                if (!cancelled) {
                    setIsFavorited(fav);
                    setFavoriteCount(count);
                }
            })
            .catch((err) =>
                console.warn('[useFavorite] initial load error:', err?.message)
            );

        return () => { cancelled = true; };
    }, [serviceId, user?.id]);

    // ── Toggle ──────────────────────────────────────────────────────────────
    const toggleFavorite = useCallback(async () => {
        if (!serviceId || !user?.id || inFlight.current) return;

        inFlight.current = true;
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Snapshot for rollback
        const prevFav = isFavorited;
        const prevCount = favoriteCount;

        // Optimistic update
        const nextFav = !isFavorited;
        const nextCount = isFavorited ? Math.max(0, favoriteCount - 1) : favoriteCount + 1;
        
        setIsFavorited(nextFav);
        setFavoriteCount(nextCount);

        // Defer network call to ensure UI updates immediately
        setTimeout(async () => {
            try {
                if (prevFav) {
                    await removeFavorite(serviceId);
                } else {
                    await addFavorite(serviceId);
                }
            } catch (err) {
                // Rollback on failure
                console.warn('[useFavorite] toggleFavorite error:', (err as Error)?.message);
                setIsFavorited(prevFav);
                setFavoriteCount(prevCount);
            } finally {
                inFlight.current = false;
                setLoading(false);
            }
        }, 0);
    }, [serviceId, user?.id, isFavorited, favoriteCount]);

    return { isFavorited, favoriteCount, loading, toggleFavorite };
};
