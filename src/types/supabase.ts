// src/types/supabase.ts
// Generated from Supabase schema
// DO NOT EDIT MANUALLY - regenerate from schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: string | null;
          full_name: string | null;
          avatar_url: string | null;
          location: string | null;
          bio: string | null;
          specialization: string | null;
          years_exp: number | null;
          verification_status: string | null;
          updated_at: string | null;
          phone: string | null;
          license_url: string | null;
          banner_url: string | null;
          service_type: string | null;
          last_seen: string | null;
          gallery: GalleryItem[];
          onboarding_complete: boolean | null;
          email: string | null;
          push_token: string | null;
        };
        Insert: {
          id?: string;
          user_type?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          bio?: string | null;
          specialization?: string | null;
          years_exp?: number | null;
          verification_status?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          license_url?: string | null;
          banner_url?: string | null;
          service_type?: string | null;
          last_seen?: string | null;
          gallery?: GalleryItem[];
          onboarding_complete?: boolean | null;
          email?: string | null;
          push_token?: string | null;
        };
        Update: {
          id?: string;
          user_type?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          bio?: string | null;
          specialization?: string | null;
          years_exp?: number | null;
          verification_status?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          license_url?: string | null;
          banner_url?: string | null;
          service_type?: string | null;
          last_seen?: string | null;
          gallery?: GalleryItem[];
          onboarding_complete?: boolean | null;
          email?: string | null;
          push_token?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          agent_id: string | null;
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          image_url: string[];
          duration_mins: number | null;
          created_at: string | null;
          features: string[];
        };
        Insert: {
          id?: string;
          agent_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          category?: string | null;
          image_url?: string[];
          duration_mins?: number | null;
          created_at?: string | null;
          features?: string[];
        };
        Update: {
          id?: string;
          agent_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          category?: string | null;
          image_url?: string[];
          duration_mins?: number | null;
          created_at?: string | null;
          features?: string[];
        };
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string | null;
          service_id: string | null;
          date: string;
          time: string;
          status: string | null;
          created_at: string | null;
          booking_reference: string | null;
          agent_id: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          customer_notes: string | null;
          agent_notes: string | null;
          total_amount: number | null;
          travel_fee: number | null;
          platform_fee: number | null;
          discount: number | null;
          currency: string | null;
          payment_reference: string | null;
          payment_method: string | null;
          payment_status: string | null;
          escrow_status: string | null;
          escrow_release_at: string | null;
          escrow_released_at: string | null;
          accepted_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          otp_code: string | null;
          otp_verified: boolean | null;
          otp_verified_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          date: string;
          time: string;
          status?: string | null;
          created_at?: string | null;
          booking_reference?: string | null;
          agent_id?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          customer_notes?: string | null;
          agent_notes?: string | null;
          total_amount?: number | null;
          travel_fee?: number | null;
          platform_fee?: number | null;
          discount?: number | null;
          currency?: string | null;
          payment_reference?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          escrow_status?: string | null;
          escrow_release_at?: string | null;
          escrow_released_at?: string | null;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          otp_code?: string | null;
          otp_verified?: boolean | null;
          otp_verified_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          date?: string;
          time?: string;
          status?: string | null;
          created_at?: string | null;
          booking_reference?: string | null;
          agent_id?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          customer_notes?: string | null;
          agent_notes?: string | null;
          total_amount?: number | null;
          travel_fee?: number | null;
          platform_fee?: number | null;
          discount?: number | null;
          currency?: string | null;
          payment_reference?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          escrow_status?: string | null;
          escrow_release_at?: string | null;
          escrow_released_at?: string | null;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          otp_code?: string | null;
          otp_verified?: boolean | null;
          otp_verified_at?: string | null;
          updated_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          customer_id: string | null;
          service_id: string | null;
          booking_id: string | null;
          rating: number | null;
          comment: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          booking_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          booking_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          customer_id: string | null;
          service_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          service_id?: string | null;
          created_at?: string | null;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number | null;
          created_at?: string | null;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string | null;
        };
      };
      service_likes: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_id?: string;
          created_at?: string;
        };
      };
      service_shares: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          share_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: string;
          share_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_id?: string;
          share_type?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types
export type GalleryItem = {
  url: string;
  type: 'image' | 'video';
};

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];
export type FavoriteUpdate = Database['public']['Tables']['favorites']['Update'];

export type WalletRow = Database['public']['Tables']['wallets']['Row'];
export type WalletInsert = Database['public']['Tables']['wallets']['Insert'];
export type WalletUpdate = Database['public']['Tables']['wallets']['Update'];

export type FollowRow = Database['public']['Tables']['follows']['Row'];
export type FollowInsert = Database['public']['Tables']['follows']['Insert'];
export type FollowUpdate = Database['public']['Tables']['follows']['Update'];

export type ServiceLikeRow = Database['public']['Tables']['service_likes']['Row'];
export type ServiceLikeInsert = Database['public']['Tables']['service_likes']['Insert'];

export type ServiceShareRow = Database['public']['Tables']['service_shares']['Row'];
export type ServiceShareInsert = Database['public']['Tables']['service_shares']['Insert'];
