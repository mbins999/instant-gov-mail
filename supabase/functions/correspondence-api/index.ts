import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  token?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config, data } = await req.json() as {
      action: string;
      config: ApiConfig;
      data?: any;
    };

    console.log('API Request:', { action, baseUrl: config.baseUrl });

    let response;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization if token is provided
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    switch (action) {
      case 'login':
        response = await fetch(`${config.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: config.username,
            userPassword: config.password,
          }),
        });
        break;

      case 'export-correspondence':
        const formData = new FormData();
        formData.append('metadata', JSON.stringify(data.metadata));
        if (data.file) {
          formData.append('file', data.file);
        }
        
        response = await fetch(`${config.baseUrl}/user/correspondence/export`, {
          method: 'PUT',
          headers: { 'Authorization': headers['Authorization'] || '' },
          body: formData,
        });
        break;

      case 'return-correspondence':
        response = await fetch(`${config.baseUrl}/user/correspondence/return`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
        break;

      case 'resend-correspondence':
        response = await fetch(`${config.baseUrl}/user/correspondence/resend`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
        break;

      case 'receive-correspondence':
        response = await fetch(`${config.baseUrl}/user/correspondence/receive`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
        break;

      case 'add-attachment':
        const attachmentFormData = new FormData();
        attachmentFormData.append('metadata', data.metadata);
        attachmentFormData.append('content', data.content);
        
        response = await fetch(`${config.baseUrl}/user/correspondence/attachment/add`, {
          method: 'POST',
          headers: { 'Authorization': headers['Authorization'] || '' },
          body: attachmentFormData,
        });
        break;

      case 'get-transaction-log':
        response = await fetch(
          `${config.baseUrl}/user/transaction-log/messaging-history/${data.docId}`,
          {
            method: 'GET',
            headers,
          }
        );
        break;

      case 'get-incoming-attachment':
        response = await fetch(
          `${config.baseUrl}/user/correspondence/incoming/docId/${data.docId}`,
          {
            method: 'GET',
            headers,
          }
        );
        break;

      case 'get-attachment-content':
        response = await fetch(
          `${config.baseUrl}/user/correspondence/attachment/docId/content/${data.docId}`,
          {
            method: 'GET',
            headers,
          }
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    const responseData = await response.json();
    console.log('API Response:', { status: response.status, ok: response.ok });

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in correspondence-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
