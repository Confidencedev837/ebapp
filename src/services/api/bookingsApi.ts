// src/services/api/bookingsApi.ts
import { supabase } from '../supabase';
import { BookingRow, BookingInsert, BookingUpdate } from '@/types/supabase';
import { sendRemotePushNotification, scheduleReminderNotification } from '../notificationService';

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

    // --- Notifications & Reminders ---
    try {
      // 1. Fetch Agent's push token
      const { data: serviceData } = await supabase
        .from('services')
        .select('name, agent_id, profiles!agent_id(push_token)')
        .eq('id', booking.service_id)
        .single() as any;

      const agentPushToken = serviceData?.profiles?.push_token;
      const serviceName = serviceData?.name || 'a service';

      // bookingId from the newly created row
      const createdBookingId = data.id;
      const bookingNavData = { screen: 'BookingDetail', params: { bookingId: createdBookingId } };

      if (agentPushToken) {
        // Agent taps this -> goes to their BookingDetail to Accept/Reject
        await sendRemotePushNotification(
          agentPushToken,
          'New Booking Request',
          `You have a new booking request for ${serviceName}. Tap to review.`,
          bookingNavData
        );
      }

      // 2. Schedule Local Reminders for the Customer (the current device)
      if (booking.date && booking.time) {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const reminderData = { screen: 'BookingDetail', params: { bookingId: createdBookingId } };

        // 1 hour before
        await scheduleReminderNotification(
          'Upcoming Appointment',
          `Your ${serviceName} appointment is in 1 hour.`,
          new Date(bookingDateTime.getTime() - 60 * 60 * 1000),
          reminderData
        );

        // 30 mins before
        await scheduleReminderNotification(
          'Upcoming Appointment',
          `Your ${serviceName} appointment is in 30 minutes.`,
          new Date(bookingDateTime.getTime() - 30 * 60 * 1000),
          reminderData
        );

        // 10 mins before
        await scheduleReminderNotification(
          'Appointment Starting Soon',
          `Your ${serviceName} appointment is in 10 minutes.`,
          new Date(bookingDateTime.getTime() - 10 * 60 * 1000),
          reminderData
        );

        // Exact start time
        await scheduleReminderNotification(
          'Service Started',
          `Your ${serviceName} appointment is starting now.`,
          bookingDateTime,
          reminderData
        );
      }
    } catch (notifErr) {
      console.warn('[bookingsApi] Failed to send notifications:', notifErr);
    }

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

    // --- Notifications & Reminders ---
    try {
      // Fetch full booking details to get customer token, agent details, etc.
      const { data: bookingDetails } = await supabase
        .from('bookings')
        .select(`
          date, time,
          services ( name ),
          profiles!customer_id ( push_token )
        `)
        .eq('id', bookingId)
        .single() as any;

      const customerPushToken = bookingDetails?.profiles?.push_token;
      const serviceName = bookingDetails?.services?.name || 'your service';
      const bookingNavData = { screen: 'BookingDetail', params: { bookingId } };

      if (status === 'confirmed') {
        if (customerPushToken) {
          // Customer taps this -> goes to BookingDetail to see confirmation details
          await sendRemotePushNotification(
            customerPushToken,
            'Booking Confirmed',
            `Your booking for ${serviceName} has been confirmed. Tap to view details.`,
            bookingNavData
          );
        }

        // Schedule Local Reminders for the Agent (the current device confirming it)
        if (bookingDetails?.date && bookingDetails?.time) {
          const bookingDateTime = new Date(`${bookingDetails.date}T${bookingDetails.time}`);
          const reminderData = { screen: 'BookingDetail', params: { bookingId } };

          await scheduleReminderNotification('Upcoming Service', `Your appointment for ${serviceName} is in 1 hour.`, new Date(bookingDateTime.getTime() - 60 * 60 * 1000), reminderData);
          await scheduleReminderNotification('Upcoming Service', `Your appointment for ${serviceName} is in 30 minutes.`, new Date(bookingDateTime.getTime() - 30 * 60 * 1000), reminderData);
          await scheduleReminderNotification('Service Starting Soon', `Your appointment for ${serviceName} is in 10 minutes.`, new Date(bookingDateTime.getTime() - 10 * 60 * 1000), reminderData);
          await scheduleReminderNotification('Service Started', `Your appointment for ${serviceName} is starting now.`, bookingDateTime, reminderData);
        }
      } else if (status === 'completed') {
        if (customerPushToken) {
          // Customer taps this -> goes to BookingDetail where they can leave a review
          await sendRemotePushNotification(
            customerPushToken,
            'Service Completed',
            `Your ${serviceName} service is complete. Tap to leave a review.`,
            bookingNavData
          );
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        if (customerPushToken) {
          // Customer taps this -> goes to BookingDetail to see what happened
          await sendRemotePushNotification(
            customerPushToken,
            'Booking Update',
            `Your booking for ${serviceName} was ${status}. Tap to view details.`,
            bookingNavData
          );
        }
      }
    } catch (notifErr) {
      console.warn('[bookingsApi] Failed to send status update notification:', notifErr);
    }

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
      .select('*, services:service_id(*, profiles:agent_id(*))')
      .eq('customer_id', customerId)
      .gte('date', today)
      .lte('date', futureDate)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as BookingRow[];
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
