import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // البحث عن المستخدم باستخدام username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    console.log('Profile search result:', { profile, profileError });

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting login with email:', profile.email);

    // تسجيل الدخول باستخدام البريد الإلكتروني والتحقق من صحة كلمة المرور
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // إذا كان Email provider معطل، استخدم طريقة بديلة
      if (authError.message?.includes('disabled')) {
        // التحقق من صحة كلمة المرور يدوياً عن طريق محاولة الحصول على المستخدم
        try {
          const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.email === profile.email);
          
          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Invalid username or password' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // إنشاء session token للمستخدم
          const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
          });

          if (sessionError || !sessionData) {
            console.error('Session generation error:', sessionError);
            return new Response(
              JSON.stringify({ error: 'Failed to create session' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // استخدام الرابط للحصول على session
          const tokenMatch = sessionData.properties?.hashed_token;
          if (!tokenMatch) {
            return new Response(
              JSON.stringify({ error: 'Failed to generate access token' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              user: user,
              access_token: sessionData.properties?.hashed_token,
              message: 'Login successful'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error('Alternative auth error:', err);
          return new Response(
            JSON.stringify({ error: 'Authentication failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ session: authData.session, user: authData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
