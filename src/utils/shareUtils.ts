// src/utils/shareUtils.ts
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Profile } from '@/types';

/**
 * Share a user or agent profile using native share sheet
 */
export const shareProfile = async (profile: Profile | null | undefined) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
        const isAgent = profile.user_type === 'agent';
        const name = profile.full_name || 'Beauty Specialist';
        const specialization = profile.specialization ? ` (${profile.specialization})` : '';
        const link = `https://everythingbeauty.app/profile/${profile.id}`;

        let message = '';
        if (isAgent) {
            message = `Check out ${name}${specialization} on Everything Beauty!\n\n`;
            if (profile.bio) {
                message += `${profile.bio}\n\n`;
            }
            if (profile.location) {
                message += `Location: ${profile.location}\n`;
            }
            message += `Book appointments and view portfolio:\n${link}`;
        } else {
            message = `Connect with ${name} on Everything Beauty!\n\n${link}`;
        }

        await Share.share({
            title: `${name} on Everything Beauty`,
            message,
            url: link,
        });
    } catch (err) {
        console.warn('[shareProfile] error:', err);
    }
};
