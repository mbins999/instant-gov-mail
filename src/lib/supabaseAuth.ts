import { supabase } from '@/integrations/supabase/client';

// تم تبسيط النظام - نستخدم الـ client العادي بدون authentication معقد
export function getAuthenticatedSupabaseClient() {
  return supabase;
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
