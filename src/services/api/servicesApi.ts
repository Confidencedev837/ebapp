// src/services/api/servicesApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ServiceRow, ServiceInsert, ServiceUpdate } from '@/types/supabase';

const SERVICES_CACHE_KEY = 'services_cache';
const SERVICES_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

// Full select — joins agent profile so cards can display name/avatar/location
const SERVICE_SELECT = '*, profiles!agent_id(id, full_name, avatar_url, location, verification_status, specialization)';

interface CachedServices {
  data: ServiceRow[];
  timestamp: number;
}

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < SERVICES_CACHE_DURATION;
};

/**
 * Fetch all services with optional filters
 * Includes offline caching with stale-while-revalidate
 */
export const fetchServices = async (
  options?: {
    category?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
    forceRefresh?: boolean;
  }
): Promise<ServiceRow[]> => {
  try {
    const cacheKey = `${SERVICES_CACHE_KEY}:${JSON.stringify(options || {})}`;

    // Try cache first (unless forceRefresh)
    if (!options?.forceRefresh) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached) as CachedServices;
        if (isCacheValid(timestamp)) {
          return data;
        }
      }
    }

    // Build query — join profiles via agent_id FK
    let query = supabase.from('services').select(SERVICE_SELECT);

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.agentId) {
      query = query.eq('agent_id', options.agentId);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    const services = data || [];

    // Cache the result
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: services, timestamp: Date.now() })
    );

    return services;
  } catch (error) {
    console.error('[servicesApi] fetchServices error:', error);
    // Return stale cache if available
    const cacheKey = `${SERVICES_CACHE_KEY}:${JSON.stringify(options || {})}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached).data;
    }
    throw error;
  }
};

/**
 * Fetch single service by ID with agent profile
 */
export const fetchServiceById = async (serviceId: string): Promise<ServiceRow | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_SELECT)
      .eq('id', serviceId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[servicesApi] fetchServiceById error:', error);
    throw error;
  }
};

/**
 * Search services by name or description
 */
export const searchServices = async (
  query: string,
  limit: number = 20
): Promise<ServiceRow[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_SELECT)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[servicesApi] searchServices error:', error);
    throw error;
  }
};

/**
 * Get services by category
 */
export const fetchServicesByCategory = async (
  category: string,
  limit: number = 50
): Promise<ServiceRow[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_SELECT)
      .eq('category', category)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[servicesApi] fetchServicesByCategory error:', error);
    throw error;
  }
};

/**
 * Get services by agent
 */
export const fetchAgentServices = async (agentId: string): Promise<ServiceRow[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_SELECT)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[servicesApi] fetchAgentServices error:', error);
    throw error;
  }
};

/**
 * Create new service (agent only)
 */
export const createService = async (service: ServiceInsert): Promise<ServiceRow> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;

    // Invalidate services cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(SERVICES_CACHE_KEY));
    await AsyncStorage.multiRemove(cacheKeys);

    return data;
  } catch (error) {
    console.error('[servicesApi] createService error:', error);
    throw error;
  }
};

/**
 * Update service
 */
export const updateService = async (
  serviceId: string,
  updates: ServiceUpdate
): Promise<ServiceRow> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(SERVICES_CACHE_KEY));
    await AsyncStorage.multiRemove(cacheKeys);

    return data;
  } catch (error) {
    console.error('[servicesApi] updateService error:', error);
    throw error;
  }
};

/**
 * Delete service
 */
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) throw error;

    // Invalidate cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(SERVICES_CACHE_KEY));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('[servicesApi] deleteService error:', error);
    throw error;
  }
};

/**
 * Get all categories
 */
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('category', { count: 'exact' })
      .not('category', 'is', null);

    if (error) throw error;

    const categories = [...new Set(data?.map(d => d.category).filter(Boolean) || [])].sort();
    return categories as string[];
  } catch (error) {
    console.error('[servicesApi] fetchCategories error:', error);
    throw error;
  }
};
