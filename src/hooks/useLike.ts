// src/hooks/useLike.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/useUserStore';
import {
    fetchServiceLikeStatus,
    likeService,
    unlikeService,
} from '@/services/api/likesApi';

interface UseLikeReturn {
    isLiked: boolean;
    likeCount: number;
    loading: boolean;
    toggleLike: () => Promise<void>;
}

/**
 * Hook that wires up the like state for a given service.
 *
 * - Loads real state from Supabase on mount.
 * - Optimistic UI: toggles instantly, rolls back on failure.
 * - Prevents concurrent double-taps.
 * - No-ops if user is unauthenticated.
 */
export const useLike = (serviceId: string | null | undefined): UseLikeReturn => {
    const { user } = useUserStore();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const inFlight = useRef(false);

    // ── Load initial state ──────────────────────────────────────────────────
    useEffect(() => {
        if (!serviceId) return;
        let cancelled = false;

        fetchServiceLikeStatus(serviceId)
            .then(({ isLiked: liked, likeCount: count }) => {
                if (!cancelled) {
                    setIsLiked(liked);
                    setLikeCount(count);
                }
            })
            .catch((err) =>
                console.warn('[useLike] initial load error:', err?.message)
            );

        return () => { cancelled = true; };
    }, [serviceId, user?.id]);

    // ── Toggle ──────────────────────────────────────────────────────────────
    const toggleLike = useCallback(async () => {
        if (!serviceId || !user?.id || inFlight.current) return;

        inFlight.current = true;
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Snapshot for rollback
        const prevLiked = isLiked;
        const prevCount = likeCount;

        // Optimistic update
        const nextLiked = !isLiked;
        const nextCount = isLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
        
        setIsLiked(nextLiked);
        setLikeCount(nextCount);

        // Defer network call to ensure UI updates immediately
        setTimeout(async () => {
            try {
                if (prevLiked) {
                    await unlikeService(serviceId);
                } else {
                    await likeService(serviceId);
                }
            } catch (err) {
                // Rollback on failure
                console.warn('[useLike] toggleLike error:', (err as Error)?.message);
                setIsLiked(prevLiked);
                setLikeCount(prevCount);
            } finally {
                inFlight.current = false;
                setLoading(false);
            }
        }, 0);
    }, [serviceId, user?.id, isLiked, likeCount]);

    return { isLiked, likeCount, loading, toggleLike };
};
