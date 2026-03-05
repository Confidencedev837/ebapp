// src/types/index.ts

export type UserType = 'customer' | 'agent' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

export interface GalleryItem {
    url: string;
    type: 'image' | 'video';
}

export interface Profile {
    id: string;
    user_type: UserType;
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
    specialization: string | null;
    service_type: string | null;
    years_exp: number | null;
    verification_status: VerificationStatus;
    phone: string | null;
    license_url: string | null;
    banner_url: string | null;
    gallery: GalleryItem[];
    last_seen: string | null;
    updated_at: string | null;
}

export interface Service {
    id: string;
    agent_id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    image_url: string[];
    duration_mins: number;
    features: string[];
    created_at: string;
    profiles?: Partial<Profile>;
}

export interface Booking {
    id: string;
    customer_id: string;
    service_id: string;
    date: string;
    time: string;
    status: BookingStatus;
    created_at: string;
    services?: Partial<Service>;
    profiles?: Partial<Profile>;
}

export interface Review {
    id: string;
    customer_id: string;
    service_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export interface Favorite {
    id: string;
    customer_id: string;
    service_id: string;
    created_at: string;
}
