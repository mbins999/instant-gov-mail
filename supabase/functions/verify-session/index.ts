import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  userId: number;
  username: string;
  fullName: string;
  entityName: string | null;
  role: string;
  sessionToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session token from request body
    const { sessionToken } = await req.json();

    if (!sessionToken) {
      console.log('[verify-session] No session token provided');
      return new Response(
        JSON.stringify({ error: 'Session token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[verify-session] Verifying session token...');

    // Check if session exists and is valid
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.log('[verify-session] Invalid or expired session:', sessionError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[verify-session] Session valid for user_id:', session.user_id);

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name, entity_name')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      console.log('[verify-session] User not found:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role from user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user_id)
      .single();

    if (roleError) {
      console.log('[verify-session] Error fetching role:', roleError.message);
    }

    const role = userRole?.role || 'user';

    console.log('[verify-session] User verified successfully:', {
      userId: user.id,
      username: user.username,
      role: role
    });

    // Return user data with role from database
    const responseData: SessionData = {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      entityName: user.entity_name,
      role: role,
      sessionToken: sessionToken
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[verify-session] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});