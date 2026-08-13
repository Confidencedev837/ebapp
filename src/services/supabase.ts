// src/services/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Storage helpers --------------------------------------------------------
const guessContentType = (uri: string, override?: string) => {
    if (override) return override;
    const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = match?.[1]?.toLowerCase() || '';
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'heic':
        case 'heif':
            return 'image/heic';
        case 'mp4':
            return 'video/mp4';
        case 'mov':
            return 'video/quicktime';
        case 'webm':
            return 'video/webm';
        case 'mkv':
            return 'video/x-matroska';
        default:
            return 'application/octet-stream';
    }
};

export const uploadToStorage = async (
    bucket: string,
    path: string,
    uri: string,
    contentTypeOverride?: string
) => {
    try {
        const ct = guessContentType(uri, contentTypeOverride);

        // Fetch and load local resource as a binary Uint8Array via XMLHttpRequest base64 conversion
        const base64Data: string = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = function () {
                reject(new TypeError("Local file read failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });

        // Convert base64 string to Uint8Array/ArrayBuffer
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const { data, error } = await supabase.storage.from(bucket).upload(path, bytes.buffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: ct,
        });

        if (error) throw error;
        return data.path;
    } catch (err) {
        console.error('[supabase] uploadToStorage error:', err);
        throw err;
    }
};

export const getPublicStorageUrl = (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path);
};

export const removeFromStorage = async (bucket: string, path: string) => {
    try {
        const { data, error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[supabase] removeFromStorage error:', err);
        throw err;
    }
};

