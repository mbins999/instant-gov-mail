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
    const { username, password, fullName, entityId, role, createdBy } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== RATE LIMITING CHECK =====
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit (3 signups per hour per IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', clientIP)
      .eq('endpoint', 'signup')
      .gte('created_at', oneHourAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'تم تجاوز الحد الأقصى لمحاولات التسجيل. يرجى المحاولة لاحقاً' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Password validation - ENHANCED with strict policy
    if (!password || password.length < 12) {
      errors.push('كلمة المرور يجب أن تكون 12 حرفاً على الأقل');
    } else {
      // Check for uppercase
      if (!/[A-Z]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على حرف كبير (A-Z) على الأقل');
      }
      // Check for lowercase
      if (!/[a-z]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على حرف صغير (a-z) على الأقل');
      }
      // Check for numbers
      if (!/[0-9]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على رقم (0-9) على الأقل');
      }
      // Check for special characters
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على رمز خاص (!@#$%^&*) على الأقل');
      }
      // Check for common passwords
      const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password123'];
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        errors.push('كلمة المرور ضعيفة وسهلة التخمين');
      }
      // Check if password contains username
      if (password.toLowerCase().includes(username.toLowerCase())) {
        errors.push('كلمة المرور يجب ألا تحتوي على اسم المستخدم');
      }
      // Check if password contains full name parts
      if (fullName) {
        const nameParts = fullName.toLowerCase().split(' ');
        if (nameParts.some((part: string) => part.length > 2 && password.toLowerCase().includes(part))) {
          errors.push('كلمة المرور يجب ألا تحتوي على اسمك');
        }
      }
    }

    // Check password history (if user exists - for update scenario)
    // This is handled at database level via trigger

    // Full name validation
    if (!fullName || fullName.length < 3) {
      errors.push('الاسم الكامل يجب أن يكون 3 أحرف على الأقل');
    } else if (fullName.length > 100) {
      errors.push('الاسم الكامل طويل جداً (الحد الأقصى 100 حرف)');
    }

    // Entity ID validation
    if (!entityId) {
      errors.push('معرف الجهة مطلوب');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(entityId)) {
        errors.push('معرف الجهة (UUID) غير صحيح');
      }
    }

    // Role validation
    if (role && !['user', 'admin'].includes(role)) {
      errors.push('الصلاحية غير صحيحة');
    }

    if (errors.length > 0) {
      // Log failed attempt
      await supabase.from('rate_limits').insert([{
        identifier: clientIP,
        endpoint: 'signup',
        created_at: new Date().toISOString()
      }]);

      return new Response(
        JSON.stringify({ error: errors.join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      // Log failed attempt
      await supabase.from('rate_limits').insert([{
        identifier: clientIP,
        endpoint: 'signup',
        created_at: new Date().toISOString()
      }]);

      return new Response(
        JSON.stringify({ error: 'اسم المستخدم موجود بالفعل' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== SECURE PASSWORD HASHING WITH BCRYPT =====
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error: profileError } = await supabase
      .from('users')
      .insert({
        username: username,
        full_name: fullName,
        password_hash: passwordHash,
        entity_id: entityId,
        created_by: createdBy || null,
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

    // Assign role (default to 'user')
    const userRole = role && (role === 'admin' || role === 'user') ? role : 'user';
    const { error: roleError } = await supabase.from('user_roles').insert([{
      user_id: userId,
      role: userRole
    }]);

    if (roleError) {
      console.error('Role error:', roleError);
      await supabase.from('users').delete().eq('id', userId);
      return new Response(
        JSON.stringify({ error: 'فشل تعيين الصلاحية' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear rate limit on successful signup
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', clientIP)
      .eq('endpoint', 'signup');

    return new Response(
      JSON.stringify({ 
        user: {
          id: newUser.id,
          username: newUser.username,
          full_name: newUser.full_name,
          entity_id: newUser.entity_id,
          role: userRole
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ في التسجيل' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
