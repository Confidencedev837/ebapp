// src/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { Profile } from '@/types';
import * as profilesApi from '@/services/api/profilesApi';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
}

/**
 * Custom hook for fetching and managing current user profile
 */
export const useProfile = (userId: string | null): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await profilesApi.fetchCurrentProfile(userId);
      if (data) {
        setProfile(data as unknown as Profile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
      console.error('[useProfile] Error:', message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<Profile> => {
      if (!userId) throw new Error('No user ID');

      try {
        setError(null);
        const updated = await profilesApi.updateProfile(userId, updates);
        setProfile(updated as unknown as Profile);
        return updated as unknown as Profile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        throw err;
      }
    },
    [userId]
  );

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile: handleUpdateProfile,
  };
};

/**
 * Hook for fetching a specific agent's profile
 */
export const useAgentProfile = (agentId: string | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await profilesApi.fetchAgentProfile(agentId);
      if (data) {
        setProfile(data as unknown as Profile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agent profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

/**
 * Hook for listing and searching agents
 */
export const useAgents = (query?: string, category?: string) => {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: any[];
      if (query && query.trim()) {
        data = await profilesApi.searchAgents(query);
      } else {
        data = await profilesApi.fetchVerifiedAgents();
      }
      
      let filtered = data as unknown as Profile[];
      if (category && category !== 'All') {
        filtered = filtered.filter(a => a.service_type === category);
      }
      
      setAgents(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { agents, loading, error, refetch: fetch };
};
