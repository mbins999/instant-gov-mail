import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, connectionId, correspondenceId, data } = await req.json();
    
    console.log('External sync request:', { action, connectionId, correspondenceId });

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('external_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      console.error('Connection not found:', connError);
      return new Response(
        JSON.stringify({ error: 'Connection not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate with external system
    let token = connection.api_token;
    const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();

    if (!token || !tokenExpiry || tokenExpiry < now) {
      console.log('Token expired or missing, authenticating...');
      
      const authResponse = await fetch(`${connection.base_url}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: connection.username,
          userPassword: connection.password_encrypted, // In production, decrypt this
        }),
      });

      if (!authResponse.ok) {
        console.error('Authentication failed:', await authResponse.text());
        return new Response(
          JSON.stringify({ error: 'Failed to authenticate with external system' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authData = await authResponse.json();
      token = authData.token;

      // Update token in database
      await supabase
        .from('external_connections')
        .update({
          api_token: token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .eq('id', connectionId);
    }

    let result;
    let endpoint = '';
    let method = '';
    let requestPayload: any = {};

    // Execute the requested action
    switch (action) {
      case 'export':
        endpoint = `${connection.base_url}/user/correspondence/export`;
        method = 'PUT';
        
        // Get correspondence details
        const { data: correspondence } = await supabase
          .from('correspondences')
          .select('*')
          .eq('id', correspondenceId)
          .single();

        if (!correspondence) {
          throw new Error('Correspondence not found');
        }

        // Prepare metadata
        requestPayload = {
          metadata: JSON.stringify({
            number: correspondence.number,
            date: correspondence.date,
            subject: correspondence.subject,
            from_entity: correspondence.from_entity,
            to_entity: correspondence.received_by_entity,
            content: correspondence.content,
          }),
        };

        const formData = new FormData();
        formData.append('metadata', JSON.stringify(requestPayload.metadata));
        
        // If there's a PDF, add it
        if (correspondence.pdf_url) {
          // In production, fetch the PDF and add it to form data
          console.log('PDF URL:', correspondence.pdf_url);
        }

        const exportResponse = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        result = await exportResponse.json();
        
        // Update correspondence with external doc ID
        if (exportResponse.ok && result.docId) {
          await supabase
            .from('correspondences')
            .update({
              external_doc_id: result.docId,
              external_connection_id: connectionId,
            })
            .eq('id', correspondenceId);
        }
        break;

      case 'receive':
        endpoint = `${connection.base_url}/user/correspondence/receive`;
        method = 'PUT';
        requestPayload = {
          docId: data.externalDocId,
          messagingHistoryId: data.messagingHistoryId,
          comments: data.comments || '',
          receivedByName: data.receivedByName,
          receiveByOuName: data.receiveByOuName,
        };

        const receiveFormData = new FormData();
        Object.keys(requestPayload).forEach(key => {
          receiveFormData.append(key, requestPayload[key]);
        });

        const receiveResponse = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: receiveFormData,
        });

        result = await receiveResponse.json();
        break;

      case 'return':
        endpoint = `${connection.base_url}/user/correspondence/return`;
        method = 'PUT';
        requestPayload = {
          docId: data.externalDocId,
          messagingHistoryId: data.messagingHistoryId,
        };

        const returnFormData = new FormData();
        Object.keys(requestPayload).forEach(key => {
          returnFormData.append(key, requestPayload[key]);
        });

        const returnResponse = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: returnFormData,
        });

        result = await returnResponse.json();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log the sync operation
    await supabase.from('sync_log').insert({
      connection_id: connectionId,
      correspondence_id: correspondenceId,
      operation: action,
      status: 'success',
      external_doc_id: result.docId || data.externalDocId,
      request_payload: requestPayload,
      response_payload: result,
    });

    console.log('Sync completed successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    
    // Log the failed sync operation
    const { connectionId, correspondenceId, action } = await req.json().catch(() => ({}));
    if (connectionId && correspondenceId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('sync_log').insert({
        connection_id: connectionId,
        correspondence_id: correspondenceId,
        operation: action,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});