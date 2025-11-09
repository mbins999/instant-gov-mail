import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// إنشاء Supabase client مع session token في headers
export function getAuthenticatedSupabaseClient() {
  const sessionToken = localStorage.getItem('session_token');
  
  if (sessionToken) {
    // إنشاء client جديد مع custom headers
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }
    });
  }
  
  // إذا لم يكن هناك session token، استخدم الـ client العادي
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
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
