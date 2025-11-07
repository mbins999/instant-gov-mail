import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, fullName, entityName, role } = await req.json();

    // ===== COMPREHENSIVE INPUT VALIDATION =====
    const errors: string[] = [];

    // Username validation
    if (!username || username.length < 3) {
      errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    } else if (username.length > 50) {
      errors.push('اسم المستخدم طويل جداً (الحد الأقصى 50 حرف)');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط');
    }

    // Password validation - STRONG requirements
    if (!password || password.length < 8) {
      errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    } else {
      if (!/[A-Z]/.test(password)) errors.push('كلمة المرور يجب أن تحتوي على حرف كبير');
      if (!/[a-z]/.test(password)) errors.push('كلمة المرور يجب أن تحتوي على حرف صغير');
      if (!/[0-9]/.test(password)) errors.push('كلمة المرور يجب أن تحتوي على رقم');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('كلمة المرور يجب أن تحتوي على رمز خاص');
    }

    // Full name validation
    if (!fullName || fullName.length < 3) {
      errors.push('الاسم الكامل يجب أن يكون 3 أحرف على الأقل');
    } else if (fullName.length > 100) {
      errors.push('الاسم الكامل طويل جداً (الحد الأقصى 100 حرف)');
    }

    // Entity name validation
    if (!entityName || entityName.length < 3) {
      errors.push('اسم الجهة يجب أن يكون 3 أحرف على الأقل');
    } else if (entityName.length > 100) {
      errors.push('اسم الجهة طويل جداً (الحد الأقصى 100 حرف)');
    }

    // Role validation
    if (role && !['user', 'admin'].includes(role)) {
      errors.push('الصلاحية غير صحيحة');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join(', ') }),
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

    // ===== SECURE PASSWORD HASHING WITH BCRYPT =====
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

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
