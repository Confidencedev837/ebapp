// src/services/avatarUtils.ts
export const getAvatarUrl = (name: string | null | undefined, avatarUrl?: string | null): string => {
    if (avatarUrl) return avatarUrl;
    const displayName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F43F5E&color=fff&bold=true&format=svg`;
};
