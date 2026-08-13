// src/services/api/bookingsApi.ts
import { supabase } from '../supabase';
import { BookingRow, BookingInsert, BookingUpdate } from '@/types/supabase';

/**
 * Create a new booking
 */
export const createBooking = async (booking: BookingInsert): Promise<BookingRow> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[bookingsApi] createBooking error:', error);
    throw error;
  }
};

/**
 * Fetch customer's bookings
 */
export const fetchCustomerBookings = async (customerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          price,
          image_url,
          duration_mins,
          agent_id,
          profiles:agent_id (
            id,
            full_name,
            avatar_url,
            specialization,
            location
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    if (error) throw error;

    // Map so the profiles field represents the agent profile
    return data?.map(item => ({
      ...item,
      profiles: item.services?.profiles || null
    })) || [];
  } catch (error) {
    console.error('[bookingsApi] fetchCustomerBookings error:', error);
    throw error;
  }
};

/**
 * Fetch agent's bookings (by service)
 */
export const fetchAgentBookings = async (agentId: string): Promise<any[]> => {
  try {
    // 1. Fetch all service IDs created by this agent
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('agent_id', agentId);

    if (servicesError) throw servicesError;
    const serviceIds = servicesData?.map(s => s.id) || [];

    if (serviceIds.length === 0) return [];

    // 2. Fetch bookings corresponding to those services, joining customer profiles
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          price,
          agent_id
        ),
        profiles:customer_id (
          id,
          full_name,
          avatar_url,
          location
        )
      `)
      .in('service_id', serviceIds)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[bookingsApi] fetchAgentBookings error:', error);
    throw error;
  }
};

/**
 * Fetch single booking
 */
export const fetchBookingById = async (bookingId: string): Promise<BookingRow | null> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[bookingsApi] fetchBookingById error:', error);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: string
): Promise<BookingRow> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[bookingsApi] updateBookingStatus error:', error);
    throw error;
  }
};

/**
 * Get bookings for a specific service
 */
export const fetchServiceBookings = async (serviceId: string): Promise<BookingRow[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_id', serviceId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[bookingsApi] fetchServiceBookings error:', error);
    throw error;
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('[bookingsApi] cancelBooking error:', error);
    throw error;
  }
};

/**
 * Get upcoming bookings (next 30 days)
 */
export const fetchUpcomingBookings = async (
  customerId: string,
  daysAhead: number = 30
): Promise<BookingRow[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .gte('date', today)
      .lte('date', futureDate)
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[bookingsApi] fetchUpcomingBookings error:', error);
    throw error;
  }
};

/**
 * Set up real-time subscription for booking status changes
 */
export const subscribeToBookingUpdates = (
  bookingId: string,
  callback: (booking: BookingRow) => void
) => {
  const channel = supabase
    .channel(`booking-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as BookingRow);
        }
      }
    )
    .subscribe();

  return channel;
};
