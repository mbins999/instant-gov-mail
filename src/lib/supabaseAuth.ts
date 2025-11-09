import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let cachedClient: SupabaseClient<Database> | null = null;
let lastToken: string | null = null;

// إنشاء Supabase client واحد، مع تمرير x-session-token (وليس Authorization)
export function getAuthenticatedSupabaseClient() {
  const sessionToken = localStorage.getItem('session_token');

  // أعد إنشاء العميل فقط إذا تغيّر التوكن
  if (!cachedClient || lastToken !== sessionToken) {
    lastToken = sessionToken;

    if (sessionToken) {
      cachedClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
          headers: {
            'x-session-token': sessionToken,
          },
        },
      });
    } else {
      cachedClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    }
  }

  return cachedClient as SupabaseClient<Database>;
}

export function getUserFromSession() {
  try {
    const userSession = localStorage.getItem('user_session');
    if (!userSession) return null;
    
    const userData = JSON.parse(userSession);
    return userData || null;
  } catch {
    return null;
  }
}
