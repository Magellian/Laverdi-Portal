'use client';

import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

export type Database = {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string;
          phone_number: string;
          duration: number;
          transcript: string;
          created_at: string;
          status: string;
        };
      };
      leads: {
        Row: {
          id: string;
          caller_name: string;
          phone: string;
          email: string;
          rv_type: string;
          budget: string;
          timeline: string;
          trade_in: string;
          appointment_requested: boolean;
          notes: string;
          created_at: string;
          contacted: boolean;
        };
      };
      channel_config: {
        Row: {
          id: string;
          recipient_email: string;
          active: boolean;
          created_at: string;
        };
      };
      schedule_config: {
        Row: {
          id: string;
          day_of_week: string;
          start_time: string;
          end_time: string;
          enabled: boolean;
          created_at: string;
        };
      };
    };
  };
};
