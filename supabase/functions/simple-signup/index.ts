import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// دالة لتشفير كلمة المرور باستخدام SHA-256
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hash}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, fullName, entityName, role } = await req.json();

    if (!username || !password || !fullName || !entityName) {
      return new Response(
        JSON.stringify({ error: 'جميع الحقول مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // التحقق من أن اسم المستخدم غير موجود
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'اسم المستخدم موجود مسبقاً' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // تشفير كلمة المرور
    const passwordHash = await hashPassword(password);

    // الحصول على معرف المستخدم الحالي إذا كان موجوداً
    const currentUserId = null; // يمكن تمريرها من الطلب إذا لزم الأمر

    // إنشاء المستخدم
    const { data: newUser, error: profileError } = await supabase
      .from('users')
      .insert({
        username: username,
        full_name: fullName,
        password_hash: passwordHash,
        entity_name: entityName,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (profileError || !newUser) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'فشل إنشاء المستخدم' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = newUser.id;

    // إضافة الدور
    const userRole = role || 'user';
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: userRole,
      });

    if (roleError) {
      console.error('Role error:', roleError);
      await supabase.from('users').delete().eq('id', userId);
      return new Response(
        JSON.stringify({ error: 'فشل تعيين الصلاحية' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userId,
          username,
          fullName,
          entityName,
          role: userRole
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
