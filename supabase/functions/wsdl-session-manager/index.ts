import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseStringPromise } from "https://esm.sh/xml2js@0.6.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WSDLConnection {
  id: string;
  name: string;
  base_url: string;
  username: string;
  password_encrypted: string;
  session_token: string | null;
  session_expires_at: string | null;
  is_active: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, connectionId } = await req.json();

    if (action === 'authenticate') {
      // Authenticate and get session token
      const result = await authenticateConnection(supabase, connectionId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'sync') {
      // Sync data with WSDL endpoint
      const result = await syncConnection(supabase, connectionId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'check_all') {
      // Check all active connections (used by cron)
      const result = await checkAllConnections(supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in wsdl-session-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authenticateConnection(supabase: any, connectionId: string) {
  console.log(`Authenticating connection: ${connectionId}`);
  
  // Get connection details
  const { data: connection, error: fetchError } = await supabase
    .from('external_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchError || !connection) {
    throw new Error('Connection not found');
  }

  try {
    // Build SOAP authentication request
    const authSoapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Login xmlns="http://tempuri.org/">
      <username>${connection.username}</username>
      <password>${connection.password_encrypted}</password>
    </Login>
  </soap:Body>
</soap:Envelope>`;

    console.log(`Sending auth request to: ${connection.base_url}/Login`);

    // Send authentication request
    const response = await fetch(`${connection.base_url}/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/Login',
      },
      body: authSoapEnvelope,
    });

    const responseText = await response.text();
    console.log('Auth response received');

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} - ${responseText}`);
    }

    // Parse SOAP response
    const parsedResponse = await parseStringPromise(responseText);
    const sessionToken = parsedResponse?.['soap:Envelope']?.['soap:Body']?.[0]?.LoginResponse?.[0]?.LoginResult?.[0];

    if (!sessionToken) {
      throw new Error('No session token in response');
    }

    // Calculate session expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update connection with session info
    const { error: updateError } = await supabase
      .from('external_connections')
      .update({
        session_token: sessionToken,
        session_expires_at: expiresAt.toISOString(),
        last_sync_at: new Date().toISOString(),
        sync_status: 'connected',
        sync_error: null,
      })
      .eq('id', connectionId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Authentication successful for connection: ${connectionId}`);

    return {
      success: true,
      message: 'تم المصادقة بنجاح',
      sessionToken,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    // Update connection with error
    await supabase
      .from('external_connections')
      .update({
        sync_status: 'error',
        sync_error: error.message,
      })
      .eq('id', connectionId);

    throw error;
  }
}

async function syncConnection(supabase: any, connectionId: string) {
  console.log(`Syncing connection: ${connectionId}`);

  // Get connection details
  const { data: connection, error: fetchError } = await supabase
    .from('external_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchError || !connection) {
    throw new Error('Connection not found');
  }

  // Check if session is expired
  if (!connection.session_token || !connection.session_expires_at) {
    console.log('No session token, authenticating first...');
    await authenticateConnection(supabase, connectionId);
    
    // Refresh connection data
    const { data: refreshedConnection } = await supabase
      .from('external_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    
    if (!refreshedConnection?.session_token) {
      throw new Error('Failed to authenticate');
    }
    
    Object.assign(connection, refreshedConnection);
  } else {
    const expiresAt = new Date(connection.session_expires_at);
    if (expiresAt < new Date()) {
      console.log('Session expired, re-authenticating...');
      await authenticateConnection(supabase, connectionId);
      
      const { data: refreshedConnection } = await supabase
        .from('external_connections')
        .select('*')
        .eq('id', connectionId)
        .single();
      
      Object.assign(connection, refreshedConnection);
    }
  }

  try {
    // Build SOAP request to get correspondence data
    const syncSoapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthToken xmlns="http://tempuri.org/">${connection.session_token}</AuthToken>
  </soap:Header>
  <soap:Body>
    <GetCorrespondences xmlns="http://tempuri.org/">
      <lastSyncTime>${connection.last_sync_at || new Date(0).toISOString()}</lastSyncTime>
    </GetCorrespondences>
  </soap:Body>
</soap:Envelope>`;

    console.log(`Sending sync request to: ${connection.base_url}/GetCorrespondences`);

    const response = await fetch(`${connection.base_url}/GetCorrespondences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetCorrespondences',
      },
      body: syncSoapEnvelope,
    });

    const responseText = await response.text();
    console.log('Sync response received');

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} - ${responseText}`);
    }

    // Parse response
    const parsedResponse = await parseStringPromise(responseText);
    const correspondences = parsedResponse?.['soap:Envelope']?.['soap:Body']?.[0]?.GetCorrespondencesResponse?.[0]?.Correspondences || [];

    console.log(`Found ${correspondences.length} correspondences to sync`);

    // Log sync operation
    await supabase
      .from('sync_log')
      .insert({
        connection_id: connectionId,
        operation: 'sync',
        status: 'success',
        request_payload: { action: 'GetCorrespondences' },
        response_payload: { count: correspondences.length },
      });

    // Update last sync time
    await supabase
      .from('external_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
        sync_error: null,
      })
      .eq('id', connectionId);

    return {
      success: true,
      message: 'تمت المزامنة بنجاح',
      count: correspondences.length,
    };
  } catch (error: any) {
    console.error('Sync error:', error);
    
    // Log error
    await supabase
      .from('sync_log')
      .insert({
        connection_id: connectionId,
        operation: 'sync',
        status: 'error',
        error_message: error.message,
      });

    await supabase
      .from('external_connections')
      .update({
        sync_status: 'error',
        sync_error: error.message,
      })
      .eq('id', connectionId);

    throw error;
  }
}

async function checkAllConnections(supabase: any) {
  console.log('Checking all active connections...');

  // Get all active connections
  const { data: connections, error } = await supabase
    .from('external_connections')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  const results = [];

  for (const connection of connections || []) {
    try {
      // Check if session needs refresh
      const needsAuth = !connection.session_token || 
                        !connection.session_expires_at ||
                        new Date(connection.session_expires_at) < new Date(Date.now() + 60 * 60 * 1000); // 1 hour before expiry

      if (needsAuth) {
        console.log(`Re-authenticating connection: ${connection.name}`);
        await authenticateConnection(supabase, connection.id);
      }

      // Perform sync
      await syncConnection(supabase, connection.id);
      
      results.push({
        connectionId: connection.id,
        name: connection.name,
        status: 'success',
      });
    } catch (error: any) {
      console.error(`Error checking connection ${connection.id}:`, error);
      results.push({
        connectionId: connection.id,
        name: connection.name,
        status: 'error',
        error: error.message,
      });
    }
  }

  console.log(`Checked ${results.length} connections`);

  return {
    success: true,
    checked: results.length,
    results,
  };
}