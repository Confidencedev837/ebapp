// src/constants/categories.ts

export const CATEGORIES = [
    'All',
    'Makeup',
    'Hair Styling',
    'Barbing',
    'Nails',
    'Spa & Massage',
    'Skincare',
    'Tattoos',
    'Photography',
    'Bridal',
    'Other',
] as const;

export type ServiceCategory = typeof CATEGORIES[number];

export const SERVICE_DURATIONS = [10, 15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180];
