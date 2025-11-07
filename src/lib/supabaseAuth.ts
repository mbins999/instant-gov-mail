import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export function getAuthenticatedSupabaseClient() {
  const customSession = localStorage.getItem('custom_session');
  
  if (!customSession) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const sessionData = JSON.parse(customSession);
  const token = sessionData.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

export function getSessionToken(): string | null {
  try {
    const customSession = localStorage.getItem('custom_session');
    if (!customSession) return null;
    
    const sessionData = JSON.parse(customSession);
    return sessionData.access_token || null;
  } catch {
    return null;
  }
}

export function getUserFromSession() {
  try {
    const customSession = localStorage.getItem('custom_session');
    if (!customSession) return null;
    
    const sessionData = JSON.parse(customSession);
    return sessionData.user || null;
  } catch {
    return null;
  }
}
