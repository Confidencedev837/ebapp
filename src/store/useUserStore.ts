// src/store/useUserStore.ts
import { create } from 'zustand';
import { Profile, UserType } from '../types';

interface UserState {
    user: any | null; // Supabase user object
    profile: Profile | null;
    isAdmin: boolean;
    loading: boolean;
    setUser: (user: any | null) => void;
    setProfile: (profile: Profile | null) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile, isAdmin: profile?.user_type === 'admin' }),
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setLoading: (loading) => set({ loading }),
    signOut: async () => {
        // Supabase sign out logic will be implemented in authService
        set({ user: null, profile: null, isAdmin: false, loading: false });
    },
}));
