import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { username, password } = await req.json();

    // Normalize inputs
    const uname = String(username ?? '').trim();
    const pwd = String(password ?? '').trim();

    if (!uname || !pwd) {
      return new Response(
        JSON.stringify({ error: 'اسم المستخدم وكلمة المرور مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== RATE LIMITING CHECK =====
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit (5 attempts per 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', clientIP)
      .eq('endpoint', 'login')
      .gte('created_at', fifteenMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة لاحقاً' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user by username using RPC function
    const { data: userData, error } = await supabase.rpc('get_user_by_username', {
      username_input: uname
    });

    console.log('User lookup result:', { 
      found: !!userData, 
      error: error?.message,
      username: uname 
    });

    if (error || !userData) {
      // Log failed attempt
      await supabase.from('rate_limits').insert([{
        identifier: clientIP,
        endpoint: 'login',
        created_at: new Date().toISOString()
      }]);

      return new Response(
        JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== VERIFY PASSWORD WITH BCRYPT =====
    console.log('Comparing password with hash length:', userData.password_hash?.length);
    const isValidPassword = await bcrypt.compare(pwd, userData.password_hash);
    console.log('Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      // Log failed attempt
      await supabase.from('rate_limits').insert([{
        identifier: clientIP,
        endpoint: 'login',
        created_at: new Date().toISOString()
      }]);

      return new Response(
        JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear old rate limit records on successful login
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', clientIP)
      .eq('endpoint', 'login');

    // إنشاء جلسة مخصصة
    const sessionToken = crypto.randomUUID();
    
    // حفظ الجلسة في قاعدة البيانات
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userData.id,
        token: sessionToken,
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'خطأ في إنشاء الجلسة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id)
      .maybeSingle();
    
    // حذف password_hash من الاستجابة
    const userResponse = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      entity_name: userData.entity_name,
      role: roleData?.role || 'user'
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
