// src/store/useNotificationStore.ts
import { create } from 'zustand';

export type NotificationType = 'booking' | 'message' | 'promo' | 'system' | 'review';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timestamp: number; // ms since epoch
    read: boolean;
    actionRoute?: string; // optional navigation target
    actionParams?: Record<string, any>;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [
        // Seed with a couple of demo notifications so the system isn't empty on first open
        {
            id: 'demo-1',
            type: 'promo',
            title: 'Welcome to Everything Beauty',
            body: 'Discover amazing beauty services near you and book in seconds.',
            timestamp: Date.now() - 1000 * 60 * 5,
            read: false,
        },
        {
            id: 'demo-2',
            type: 'system',
            title: 'Complete your profile',
            body: 'Agents with full profiles get up to 3× more bookings.',
            timestamp: Date.now() - 1000 * 60 * 60,
            read: false,
        },
    ],

    addNotification: (n) =>
        set((state) => ({
            notifications: [
                {
                    ...n,
                    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    timestamp: Date.now(),
                    read: false,
                },
                ...state.notifications,
            ],
        })),

    markRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        })),

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),

    clearAll: () => set({ notifications: [] }),

    unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
