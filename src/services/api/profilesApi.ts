// src/services/api/profilesApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ProfileRow, ProfileUpdate } from '@/types/supabase';

const CACHE_KEY = 'profiles_cache';

/**
 * Explicitly remove a user's profile from the AsyncStorage cache.
 * Call this whenever you write to the profiles table outside of updateProfile()
 * (e.g. after onboarding completes) so the next app launch fetches fresh data.
 */
export const invalidateProfileCache = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${CACHE_KEY}:${userId}`);
    console.log('[profilesApi] Cache invalidated for user:', userId);
  } catch (err) {
    // Non-critical — worst case the cache is stale until TTL expires
    console.warn('[profilesApi] Failed to invalidate profile cache:', err);
  }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedProfile {
  data: ProfileRow;
  timestamp: number;
}

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

/**
 * Fetch current user's profile
 * Includes offline caching with stale-while-revalidate
 */
export const fetchCurrentProfile = async (userId: string): Promise<ProfileRow | null> => {
  try {
    // Try to get from cache first
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}:${userId}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as CachedProfile;
      if (isCacheValid(timestamp)) {
        return data;
      }
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Cache the result
    if (data) {
      await AsyncStorage.setItem(
        `${CACHE_KEY}:${userId}`,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    }

    return data;
  } catch (error) {
    console.error('[profilesApi] fetchCurrentProfile error:', error);
    // Return stale cache if available
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}:${userId}`);
    if (cached) {
      return JSON.parse(cached).data;
    }
    throw error;
  }
};

/**
 * Fetch agent profile with full details
 */
export const fetchAgentProfile = async (agentId: string): Promise<ProfileRow | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[profilesApi] fetchAgentProfile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<ProfileRow> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    await AsyncStorage.removeItem(`${CACHE_KEY}:${userId}`);

    return data;
  } catch (error) {
    console.error('[profilesApi] updateProfile error:', error);
    throw error;
  }
};

/**
 * Search agents by name, location, or specialization
 */
export const searchAgents = async (
  query: string,
  limit: number = 20
): Promise<ProfileRow[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'agent')
      .or(
        `full_name.ilike.%${query}%,location.ilike.%${query}%,specialization.ilike.%${query}%`
      )
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[profilesApi] searchAgents error:', error);
    throw error;
  }
};

/**
 * Get agents by verification status
 */
export const fetchVerifiedAgents = async (limit: number = 50): Promise<ProfileRow[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'agent')
      .eq('verification_status', 'verified')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[profilesApi] fetchVerifiedAgents error:', error);
    throw error;
  }
};

/**
 * Update last_seen timestamp (track online status)
 */
export const updateLastSeen = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('[profilesApi] updateLastSeen error:', error);
    // Non-critical, don't throw
  }
};
