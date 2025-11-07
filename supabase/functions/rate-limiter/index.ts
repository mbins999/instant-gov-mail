import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'login': { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  'signup': { maxAttempts: 3, windowMinutes: 60, blockMinutes: 120 },
  'api': { maxAttempts: 100, windowMinutes: 1, blockMinutes: 5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, endpoint } = await req.json();

    if (!identifier || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Identifier and endpoint are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['api'];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if blocked
    const { data: blocked } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('blocked_until', new Date().toISOString())
      .single();

    if (blocked) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          blocked: true,
          blockedUntil: blocked.blocked_until,
          message: 'تم حظر هذا الطلب مؤقتاً'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);
    
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (existing) {
      const newCount = existing.attempt_count + 1;
      
      if (newCount > config.maxAttempts) {
        // Block user
        const blockedUntil = new Date(Date.now() + config.blockMinutes * 60 * 1000);
        
        await supabase
          .from('rate_limits')
          .update({ 
            attempt_count: newCount,
            blocked_until: blockedUntil.toISOString()
          })
          .eq('id', existing.id);

        return new Response(
          JSON.stringify({ 
            allowed: false, 
            blocked: true,
            blockedUntil: blockedUntil.toISOString(),
            message: 'تم تجاوز الحد الأقصى للطلبات'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update count
      await supabase
        .from('rate_limits')
        .update({ attempt_count: newCount })
        .eq('id', existing.id);

      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: config.maxAttempts - newCount 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new record
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        attempt_count: 1,
        window_start: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: config.maxAttempts - 1 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});