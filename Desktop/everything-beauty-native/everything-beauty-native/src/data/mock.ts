// src/data/mock.ts
import { Profile, Service, Booking, Review, GalleryItem } from '../types';

export const mockAgents: Profile[] = [
    {
        id: 'agent-1',
        user_type: 'agent',
        full_name: 'Chioma Adebayo',
        avatar_url: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=200&h=200&auto=format&fit=crop',
        location: 'Lekki Phase 1, Lagos',
        bio: 'Professional bridal makeup artist with 8 years of experience. specialized in natural and glam looks.',
        specialization: 'Bridal Makeup',
        service_type: 'Makeup',
        years_exp: 8,
        verification_status: 'verified',
        phone: '+234 801 234 5678',
        license_url: null,
        banner_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
        gallery: [
            { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&h=400&auto=format&fit=crop', type: 'image' },
            { url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&h=400&auto=format&fit=crop', type: 'image' }
        ],
        last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // Online
        updated_at: new Date().toISOString()
    },
    {
        id: 'agent-2',
        user_type: 'agent',
        full_name: 'Oluwaseun Balogun',
        avatar_url: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?q=80&w=200&h=200&auto=format&fit=crop',
        location: 'Victoria Island, Lagos',
        bio: 'Expert hair stylist specializing in wigs, weaves, and natural hair care.',
        specialization: 'Hair Styling',
        service_type: 'Hair',
        years_exp: 5,
        verification_status: 'verified',
        phone: '+234 802 345 6789',
        license_url: null,
        banner_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
        gallery: [
            { url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=400&h=400&auto=format&fit=crop', type: 'image' },
            { url: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=400&h=400&auto=format&fit=crop', type: 'image' }
        ],
        last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'agent-3',
        user_type: 'agent',
        full_name: 'Amaka Eze',
        avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&h=200&auto=format&fit=crop',
        location: 'Surulere, Lagos',
        bio: 'Professional nail technician. Acrylics, gel, and custom nail art designs.',
        specialization: 'Nail Art',
        service_type: 'Nails',
        years_exp: 4,
        verification_status: 'verified',
        phone: '+234 803 456 7890',
        license_url: null,
        banner_url: 'https://images.unsplash.com/photo-1604654894610-df4906821603?q=80&w=1000&auto=format&fit=crop',
        gallery: [
            { url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=400&h=400&auto=format&fit=crop', type: 'image' }
        ],
        last_seen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'agent-4',
        user_type: 'agent',
        full_name: 'Ibrahim Musa',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
        location: 'Ikeja, Lagos',
        bio: 'Premium barber and grooming expert for the modern man.',
        specialization: 'Barbing',
        service_type: 'Barbing',
        years_exp: 6,
        verification_status: 'verified',
        phone: '+234 804 567 8901',
        license_url: null,
        banner_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop',
        gallery: [],
        last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'agent-5',
        user_type: 'agent',
        full_name: 'Zainab Usman',
        avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=200&h=200&auto=format&fit=crop',
        location: 'Victoria Island, Lagos',
        bio: 'Skincare specialist and therapist. Facials, organic treatments, and spa services.',
        specialization: 'Skincare',
        service_type: 'Spa & Massage',
        years_exp: 7,
        verification_status: 'verified',
        phone: '+234 805 678 9012',
        license_url: null,
        banner_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecee?q=80&w=1000&auto=format&fit=crop',
        gallery: [],
        last_seen: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    }
];

export const mockServices: Service[] = [
    {
        id: 'service-1',
        agent_id: 'agent-1',
        name: 'Full Bridal Glow Up',
        description: 'A complete luxury makeup session for your special day. Includes lashes and touch-up kit.',
        price: 65000,
        category: 'Bridal',
        image_url: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 120,
        features: ['Includes lashes', 'Premium products', 'Touch-up kit provided'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[0]
    },
    {
        id: 'service-2',
        agent_id: 'agent-1',
        name: 'Glam Evening Look',
        description: 'Sophisticated makeup for weddings, galas, and special events.',
        price: 25000,
        category: 'Makeup',
        image_url: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 60,
        features: ['HD makeup', 'Waterproof', 'Contouring'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[0]
    },
    {
        id: 'service-3',
        agent_id: 'agent-2',
        name: 'Wig Installation & Styling',
        description: 'Flat braid-down, lace customization, and style of your choice.',
        price: 15000,
        category: 'Hair Styling',
        image_url: ['https://images.unsplash.com/photo-1562315115-af334af45716?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 90,
        features: ['Lace glue application', 'Baby hair styling', 'Heat protection'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[1]
    },
    {
        id: 'service-4',
        agent_id: 'agent-3',
        name: 'Acrylic Full Set',
        description: 'Quality acrylic extensions with gel polish and two accent nails.',
        price: 12000,
        category: 'Nails',
        image_url: ['https://images.unsplash.com/photo-1604654894610-df4906821603?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 75,
        features: ['Gel top coat', 'Length customization', 'Free repair within 3 days'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[2]
    },
    {
        id: 'service-5',
        agent_id: 'agent-4',
        name: 'Gentleman\'s Luxury Cut',
        description: 'Precision haircut, beard grooming, and hot towel treatment.',
        price: 8000,
        category: 'Barbing',
        image_url: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 45,
        features: ['Hair wash', 'Beard oil application', 'Aftershave treatment'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[3]
    },
    {
        id: 'service-6',
        agent_id: 'agent-5',
        name: 'Organic Hydrating Facial',
        description: 'Deep cleansing and hydration using natural African botanicals.',
        price: 35000,
        category: 'Spa & Massage',
        image_url: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 90,
        features: ['Natural products', 'Face massage', 'Extraction included'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[4]
    },
    {
        id: 'service-7',
        agent_id: 'agent-2',
        name: 'Silk Press & Treatment',
        description: 'Straightening treatment for natural hair without harsh chemicals.',
        price: 22000,
        category: 'Hair Styling',
        image_url: ['https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?q=80&w=600&h=400&auto=format&fit=crop'],
        duration_mins: 120,
        features: ['Steam treatment', 'Trim included', 'Heat protection'],
        created_at: new Date().toISOString(),
        profiles: mockAgents[1]
    }
];

export const mockCurrentUser: Profile = {
    id: 'agent-0',
    user_type: 'agent',
    full_name: 'Kafayat Ibrahim',
    avatar_url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=200&h=200&auto=format&fit=crop',
    location: 'Yaba, Lagos',
    bio: 'Beauty enthusiast and regular customer.',
    specialization: null,
    service_type: null,
    years_exp: null,
    verification_status: 'verified',
    phone: '+234 812 345 6789',
    license_url: null,
    banner_url: null,
    gallery: [],
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

export const mockBookings: Booking[] = [
    {
        id: 'booking-1',
        customer_id: 'customer-1',
        service_id: 'service-1',
        date: '2024-06-15',
        time: '09:00:00',
        status: 'pending',
        created_at: new Date().toISOString(),
        services: mockServices[0],
        profiles: mockAgents[0]
    },
    {
        id: 'booking-2',
        customer_id: 'customer-1',
        service_id: 'service-3',
        date: '2024-06-10',
        time: '11:00:00',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        services: mockServices[2],
        profiles: mockAgents[1]
    }
];

export const mockReviews: Review[] = [
    {
        id: 'review-1',
        customer_id: 'customer-1',
        service_id: 'service-1',
        rating: 5,
        comment: 'Chioma is absolutely amazing! My wedding makeup was perfect.',
        created_at: new Date().toISOString()
    }
];

export const mockFavoriteIds: string[] = ['service-1', 'service-3'];
