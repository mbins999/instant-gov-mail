// Admin-only function to list all users with roles
// Uses service role to bypass RLS but validates admin via custom session token

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AppRole = 'admin' | 'user' | 'moderator';

type UserRow = {
  id: number;
  username: string;
  full_name: string;
  entity_id: string | null;
  entity_name: string | null;
  role: AppRole;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken: bodyToken } = await req.json().catch(() => ({ sessionToken: null }));
    const headerToken = req.headers.get('x-session-token');
    const sessionToken = (bodyToken || headerToken || '').toString();

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'missing session token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Validate session and get user id
    const { data: sessionRow, error: sessionErr } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionErr || !sessionRow?.user_id) {
      return new Response(JSON.stringify({ error: 'invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentUserId = sessionRow.user_id as number;

    // 2) Ensure requester is admin
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (roleRow?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Fetch users list
    const { data: usersRows, error: usersErr } = await supabase
      .from('users')
      .select('id, username, full_name, entity_id, entity_name');

    if (usersErr) {
      return new Response(JSON.stringify({ error: usersErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = (usersRows || []).map((u) => u.id);
    let rolesByUser: Record<number, AppRole> = {};

    if (ids.length > 0) {
      const { data: rolesRows } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', ids);

      for (const r of rolesRows || []) {
        rolesByUser[r.user_id as number] = r.role as AppRole;
      }
    }

    const users: UserRow[] = (usersRows || []).map((r: any) => ({
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      entity_id: r.entity_id,
      entity_name: r.entity_name,
      role: rolesByUser[r.id] || 'user',
    }));

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'unexpected_error', details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
