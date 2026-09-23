import { createClient } from '@supabase/supabase-js';

// Default project configuration fallback credentials
const DEFAULT_SUPABASE_URL = 'https://jwphdtforsqrojhkcyrb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_key_until_env_configured';

const metaEnv = (import.meta as any).env || {};
const rawUrl = metaEnv.VITE_SUPABASE_URL || '';
const rawKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

function sanitizeUrl(candidate?: string): string {
  if (!candidate || typeof candidate !== 'string') return DEFAULT_SUPABASE_URL;
  const trimmed = candidate.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  }
  return DEFAULT_SUPABASE_URL;
}

export const SUPABASE_URL = sanitizeUrl(rawUrl);
export const SUPABASE_ANON_KEY = (rawKey && !rawKey.includes('MY_SUPABASE') && rawKey.length > 20)
  ? rawKey
  : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  !rawUrl.includes('MY_SUPABASE') &&
  rawKey &&
  !rawKey.includes('MY_SUPABASE') &&
  rawKey.length > 20
);

// Initialize Supabase Client with safe browser storage configuration
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'jeevancare_supabase_auth_token',
    },
  }
);

export const SUPABASE_STORAGE_BUCKETS = {
  MEDICAL_DOCUMENTS: 'medical-documents',
  PRESCRIPTIONS: 'prescriptions',
  AVATARS: 'user-avatars',
};


