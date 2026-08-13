// src/hooks/useServices.ts
import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/types';
import * as servicesApi from '@/services/api/servicesApi';

interface UseServicesOptions {
  category?: string;
  agentId?: string;
  limit?: number;
  offset?: number;
}

interface UseServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook for fetching services with optional filters
 */
export const useServices = (options?: UseServicesOptions): UseServicesReturn => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchServices = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        const data = await servicesApi.fetchServices({
          ...options,
          forceRefresh,
        });
        setServices(data as unknown as Service[]);
        setHasMore((data?.length || 0) >= (options?.limit || 50));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch services';
        setError(message);
        console.error('[useServices] Error:', message);
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    hasMore,
  };
};

/**
 * Hook for fetching a single service
 */
export const useService = (serviceId: string | null) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(async () => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await servicesApi.fetchServiceById(serviceId);
      if (data) {
        setService(data as unknown as Service);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch service';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  return { service, loading, error, refetch: fetchService };
};

/**
 * Hook for searching services
 */
export const useSearchServices = () => {
  const [results, setResults] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, limit?: number) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await servicesApi.searchServices(query, limit || 20);
      setResults(data as unknown as Service[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
};

/**
 * Hook for fetching services by category
 */
export const useServicesByCategory = (category: string | null) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!category) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await servicesApi.fetchServicesByCategory(category);
      setServices(data as unknown as Service[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch services';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { services, loading, error, refetch: fetch };
};

/**
 * Hook for fetching agent's services
 */
export const useAgentServices = (agentId: string | null) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await servicesApi.fetchAgentServices(agentId);
      setServices(data as unknown as Service[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch services';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { services, loading, error, refetch: fetch };
};
