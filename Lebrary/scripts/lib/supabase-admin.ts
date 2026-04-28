import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service_role key. Bypasses RLS —
 * only used by ingest / delete flows in dev. Never import this from the
 * browser bundle.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Supabase admin client requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
