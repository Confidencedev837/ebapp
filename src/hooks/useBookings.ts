// src/hooks/useBookings.ts
import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types';
import * as bookingsApi from '@/services/api/bookingsApi';

interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching customer's bookings
 */
export const useBookings = (customerId: string | null): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bookingsApi.fetchCustomerBookings(customerId);
      setBookings(data as unknown as Booking[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      console.error('[useBookings] Error:', message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
};

/**
 * Hook for fetching agent's bookings
 */
export const useAgentBookings = (agentId: string | null): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bookingsApi.fetchAgentBookings(agentId);
      setBookings(data as unknown as Booking[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
};

/**
 * Hook for creating a booking
 */
export const useCreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCallback(
    async (data: {
      customerId: string;
      serviceId: string;
      date: string;
      time: string;
    }): Promise<Booking | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await bookingsApi.createBooking({
          customer_id: data.customerId,
          service_id: data.serviceId,
          date: data.date,
          time: data.time,
          status: 'pending',
        });
        return result as unknown as Booking;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createBooking, loading, error };
};

/**
 * Hook for updating booking status
 */
export const useUpdateBookingStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (bookingId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bookingsApi.updateBookingStatus(bookingId, status);
      return result as unknown as Booking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, error };
};

/**
 * Hook for fetching upcoming bookings
 */
export const useUpcomingBookings = (customerId: string | null, daysAhead: number = 30) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bookingsApi.fetchUpcomingBookings(customerId, daysAhead);
      setBookings(data as unknown as Booking[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [customerId, daysAhead]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { bookings, loading, error, refetch: fetch };
};

/**
 * Hook for cancelling a booking
 */
export const useCancelBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);
      await bookingsApi.cancelBooking(bookingId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancel, loading, error };
};
