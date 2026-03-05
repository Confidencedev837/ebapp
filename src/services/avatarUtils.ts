// src/services/avatarUtils.ts
export const getAvatarUrl = (name: string | null | undefined, avatarUrl?: string | null): string => {
    if (avatarUrl) return avatarUrl;
    const displayName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F43F5E&color=fff&bold=true&format=svg`;
};

export const isOnline = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    const diffMins = (now - lastSeenDate) / (1000 * 60);
    return diffMins < 5; // Consider online if seen in last 5 mins
};
