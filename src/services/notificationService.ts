// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure system notification behavior (display banner, sound, badge even when app is active or in background)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register device for Push Notifications & save push_token to user profile in Supabase
 */
export const registerForPushNotificationsAsync = async (userId?: string): Promise<string | null> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6289',
            });
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

        let token: string | null = null;
        try {
            const tokenData = projectId
                ? await Notifications.getExpoPushTokenAsync({ projectId })
                : await Notifications.getExpoPushTokenAsync();
            token = tokenData.data;
        } catch (e) {
            // Local dev mode without EAS Project ID fallback
            console.log('[NotificationService] Local push notifications active. Remote push token requires EAS build.');
        }

        if (userId && token) {
            await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', userId);
        }

        return token;
    } catch (error) {
        return null;
    }
};

/**
 * Schedule a native System Push Notification (Lock screen banner & sound)
 */
export const scheduleSystemPushNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: 'default',
            },
            trigger: null, // trigger immediately
        });
    } catch (err) {
        console.warn('[NotificationService] Error scheduling local push notification:', err);
    }
};
