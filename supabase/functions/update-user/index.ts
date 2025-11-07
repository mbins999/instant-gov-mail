import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { genSalt, hash } from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, fullName, password, entityName } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'معرف المستخدم مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: any = {};

    // ===== INPUT VALIDATION =====
    if (fullName !== undefined) {
      if (fullName.length < 3) {
        return new Response(
          JSON.stringify({ error: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (fullName.length > 100) {
        return new Response(
          JSON.stringify({ error: 'الاسم الكامل طويل جداً (الحد الأقصى 100 حرف)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updateData.full_name = fullName;
    }

    if (entityName !== undefined) {
      if (entityName.length < 3) {
        return new Response(
          JSON.stringify({ error: 'اسم الجهة يجب أن يكون 3 أحرف على الأقل' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (entityName.length > 100) {
        return new Response(
          JSON.stringify({ error: 'اسم الجهة طويل جداً (الحد الأقصى 100 حرف)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updateData.entity_name = entityName;
    }

    if (password !== undefined) {
      // ===== STRONG PASSWORD VALIDATION =====
      const passwordErrors: string[] = [];
      if (password.length < 8) passwordErrors.push('8 أحرف على الأقل');
      if (!/[A-Z]/.test(password)) passwordErrors.push('حرف كبير');
      if (!/[a-z]/.test(password)) passwordErrors.push('حرف صغير');
      if (!/[0-9]/.test(password)) passwordErrors.push('رقم');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push('رمز خاص');

      if (passwordErrors.length > 0) {
        return new Response(
          JSON.stringify({ error: `كلمة المرور يجب أن تحتوي على: ${passwordErrors.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ===== SECURE PASSWORD HASHING WITH BCRYPT =====
      const salt = await genSalt(12);
      updateData.password_hash = await hash(password, salt);
    }

    // التحقق من وجود حقول للتحديث
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'لا توجد بيانات للتحديث' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // تحديث بيانات المستخدم
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'فشل تحديث بيانات المستخدم' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'تم تحديث بيانات المستخدم بنجاح'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'خطأ في تحديث المستخدم' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
