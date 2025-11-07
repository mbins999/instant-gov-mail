import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// دالة لتشفير كلمة المرور باستخدام PBKDF2
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة للتحقق من كلمة المرور
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, hash] = parts;
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'اسم المستخدم وكلمة المرور مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // استخدام دالة الحصول على المستخدم
    const { data: userData, error } = await supabase.rpc('get_user_by_username', {
      username_input: username
    });

    if (error || !userData) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من كلمة المرور
    const isValidPassword = userData.password_hash 
      ? await verifyPassword(password, userData.password_hash)
      : false;

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إنشاء جلسة مخصصة
    const sessionToken = crypto.randomUUID();
    
    // حذف password_hash من الاستجابة
    const userResponse = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      entity_name: userData.entity_name,
      role: userData.role || 'user'
    };

    return new Response(
      JSON.stringify({ 
        session: {
          access_token: sessionToken,
          user: userResponse
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'خطأ في تسجيل الدخول' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
