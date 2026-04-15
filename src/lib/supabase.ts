import { createClient } from '@supabase/supabase-js';
import type { GoTrueClient } from '@supabase/auth-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

// SupabaseAuthClient extends GoTrueClient via a `declare const` alias, which the
// TypeScript language server can't resolve through. We cast auth here once so all
// call sites (signInWithPassword, getUser, getSession, etc.) are properly typed.
const _client = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = _client as Omit<typeof _client, 'auth'> & { auth: GoTrueClient };