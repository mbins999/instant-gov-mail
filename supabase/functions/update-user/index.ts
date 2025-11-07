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

    // بناء كائن التحديث
    const updateData: any = {};
    
    if (fullName) updateData.full_name = fullName;
    if (entityName) updateData.entity_name = entityName;
    
    // تشفير كلمة المرور الجديدة إذا تم توفيرها
    if (password) {
      if (password.length < 3) {
        return new Response(
          JSON.stringify({ error: 'كلمة المرور يجب أن تكون 3 أحرف على الأقل' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updateData.password_hash = await hashPassword(password);
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
