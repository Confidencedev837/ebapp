// src/hooks/useShare.ts
import { useState, useCallback, useRef } from 'react';
import { Share, ShareAction } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/useUserStore';
import { trackShare } from '@/services/api/sharesApi';
import { Service } from '@/types';

interface UseShareReturn {
    share: () => Promise<void>;
    isSharing: boolean;
}

// Minimum milliseconds between tracked share events (debounce guard).
// Prevents duplicate DB rows from rapid taps.
const SHARE_DEBOUNCE_MS = 3000;

/**
 * Hook that opens the native share sheet for a service and persists
 * a share event to Supabase only on successful user action.
 *
 * - Opens React Native's Share.share() — works on iOS and Android.
 * - Only writes to DB when user completes a share (not just opens sheet).
 * - 3-second debounce guard prevents rapid duplicate DB records.
 * - Handles cancellation: no DB write if user dismisses sheet.
 * - Never crashes if Supabase write fails.
 */
export const useShare = (
    service: Service | null | undefined
): UseShareReturn => {
    const { user } = useUserStore();
    const [isSharing, setIsSharing] = useState(false);
    const lastShareAt = useRef<number>(0);

    const share = useCallback(async () => {
        if (!service?.id || isSharing) return;

        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const title = service.name
                ? `Check out "${service.name}" on Everything Beauty`
                : 'Check out this service on Everything Beauty';

            const providerName = service.profiles?.full_name || 'an expert';
            
            let message = `I found an amazing service by ${providerName} on Everything Beauty!\n\n`;
            message += `${service.name}\n`;
            if (service.description) {
                message += `${service.description.substring(0, 150)}${service.description.length > 150 ? '...' : ''}\n\n`;
            }
            message += `Price: ₦${service.price?.toLocaleString()}\n`;
            message += `Duration: ${service.duration_mins} mins\n\n`;
            
            const link = `https://everythingbeauty.app/service/${service.id}`;
            message += `Book it now on the app:\n${link}`;

            const result = await Share.share({ message, title, url: link });

            // On iOS, result.action === Share.sharedAction means user completed share.
            // On Android, dismissed === user cancelled; sharedAction = completed.
            if (result.action === Share.sharedAction) {
                const now = Date.now();
                const timeSinceLast = now - lastShareAt.current;

                if (timeSinceLast >= SHARE_DEBOUNCE_MS) {
                    lastShareAt.current = now;

                    // Determine share type from activityType (iOS only)
                    const shareType =
                        result.activityType
                            ? String(result.activityType)
                            : 'native';

                    // Fire-and-forget — never blocks the UI
                    if (user?.id) {
                        trackShare(service.id, shareType).catch((err) =>
                            console.warn('[useShare] trackShare failed:', err?.message)
                        );
                    }
                }
            }
            // result.action === Share.dismissedAction → user cancelled → no DB write
        } catch (err) {
            // Share sheet error — do not crash
            console.warn('[useShare] share error:', (err as Error)?.message);
        } finally {
            setIsSharing(false);
        }
    }, [service, user?.id, isSharing]);

    return { share, isSharing };
};
