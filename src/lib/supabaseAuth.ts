import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let authenticatedClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAuthenticatedSupabaseClient() {
  const customSession = localStorage.getItem('custom_session');
  
  if (!customSession) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const sessionData = JSON.parse(customSession);
  const token = sessionData.access_token;

  // إعادة استخدام نفس الـ client إذا كان موجوداً
  if (authenticatedClient) {
    return authenticatedClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  authenticatedClient = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  return authenticatedClient;
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
