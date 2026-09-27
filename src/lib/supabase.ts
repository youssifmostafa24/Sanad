import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Normalizes a user-provided Supabase URL.
 * Handles common user inputs like:
 * - Trailing slashes: `https://xyz.supabase.co/`
 * - Direct REST endpoint copy-paste: `https://xyz.supabase.co/rest/v1` or `https://xyz.supabase.co/rest/v1/`
 * - Trailing paths accidentally copied from the dashboard
 */
export const normalizeSupabaseUrl = (url: string | undefined): string => {
  if (!url) return '';
  let cleaned = url.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip /rest/v1 if the user copied the REST URL from Supabase dashboard
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  // Strip trailing slashes again just in case
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
};

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = rawSupabaseAnonKey?.trim() || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('placeholder')
  );
};

// Lazy initialization or fallback dummy client to avoid crashes if keys aren't added yet
let client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

