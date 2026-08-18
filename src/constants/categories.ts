// src/constants/categories.ts
// Single source of truth for all categories across the entire app.
// ServicesScreen tiles, CategoryChips, CreateServiceScreen, OnboardingScreen
// all import from here — never define their own category arrays.

import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CategoryMeta {
    key: string;           // stored in DB (service.category, profile.service_type)
    label: string;         // display name
    icon: string;          // MaterialCommunityIcons name
    colors: [string, string]; // gradient: [from, to]
}

export const CATEGORY_META: CategoryMeta[] = [
    { key: 'Makeup',        label: 'Makeup',        icon: 'palette',                  colors: ['#FF5F85', '#FF90AB'] },
    { key: 'Hair Styling',  label: 'Hair',           icon: 'content-cut',              colors: ['#F59E0B', '#FBBF24'] },
    { key: 'Barbing',       label: 'Barbing',        icon: 'face-man-shimmer-outline', colors: ['#3B82F6', '#60A5FA'] },
    { key: 'Nails',         label: 'Nails',          icon: 'hand-heart-outline',       colors: ['#8B5CF6', '#A78BFA'] },
    { key: 'Spa & Massage', label: 'Spa & Massage',  icon: 'spa',                      colors: ['#10B981', '#34D399'] },
    { key: 'Skincare',      label: 'Skincare',        icon: 'water-circle-outline',     colors: ['#F97316', '#FB923C'] },
    { key: 'Photography',   label: 'Photography',    icon: 'camera-outline',           colors: ['#374151', '#6B7280'] },
    { key: 'Bridal',        label: 'Bridal',         icon: 'diamond-stone',            colors: ['#B8860B', '#D4A827'] },
    { key: 'Other',         label: 'Other',          icon: 'dots-grid',                colors: ['#64748B', '#94A3B8'] },
];

// Plain string array for CategoryChips and filter dropdowns (includes 'All')
export const CATEGORIES = ['All', ...CATEGORY_META.map(c => c.key)] as const;

export type ServiceCategory = typeof CATEGORIES[number];

// Duration options shared between CreateServiceScreen and anywhere else
export const SERVICE_DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 300, 480];

export const SERVICE_DURATION_LABELS: Record<number, string> = {
    15:  '15 minutes',
    30:  '30 minutes',
    45:  '45 minutes',
    60:  '1 hour',
    90:  '1.5 hours',
    120: '2 hours',
    180: '3 hours',
    240: '4 hours',
    300: 'Half day (5 hrs)',
    480: 'Full day (8 hrs)',
};
