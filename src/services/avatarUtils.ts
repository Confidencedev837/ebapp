// src/services/avatarUtils.ts

export const getAvatarUrl = (name: string | null | undefined, avatarUrl?: string | null): string => {
    if (avatarUrl) return avatarUrl;
    const displayName = name || 'mok';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F43F5E&color=fff&bold=true&format=svg`;
};

// A user is considered online if their last_seen is within the last 4 minutes.
// Heartbeat fires every 90s, so 4 minutes gives a safe 2-beat buffer.
const ONLINE_THRESHOLD_MS = 4 * 60 * 1000;

export const isOnline = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
};

// Returns a human-readable "last seen" label for offline agents
export const lastSeenLabel = (lastSeen: string | null | undefined): string => {
    if (!lastSeen) return 'Offline';
    if (isOnline(lastSeen)) return 'Online now';
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};
