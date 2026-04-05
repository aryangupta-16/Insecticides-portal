import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../config/env.js';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseStorageConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey && env.supabaseStorageBucket);
}

export function getSupabaseClient() {
  if (!isSupabaseStorageConfigured()) {
    throw new Error('Supabase Storage is not fully configured');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}