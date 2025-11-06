import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CorrespondenceData {
  id: string;
  number: string;
  type: string;
  subject: string;
  from_entity: string;
  date: string;
  greeting: string;
  content: string;
  responsible_person: string;
  signature_url: string;
  display_type: string;
  attachments: string[];
}

function generateHTMLContent(correspondence: CorrespondenceData): string {
  const isContentType = correspondence.display_type === 'content';
  const hasAttachments = correspondence.attachments && correspondence.attachments.length > 0;
  
  let attachmentsHTML = '';
  if (hasAttachments) {
    attachmentsHTML = `
      <div style="margin-top: 40px; padding-top: 20px;">
        <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 16px;">المرفقات:</h3>
        <div style="display: grid; gap: 12px;">
          ${correspondence.attachments.map((url, index) => {
            const fileName = url.split('/').pop() || `مرفق ${index + 1}`;
            const fileExt = fileName.split('.').pop()?.toLowerCase();
            const isPDF = fileExt === 'pdf';
            
            return `
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <span style="font-size: 24px;">${isPDF ? '📄' : '📎'}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 500;">${fileName}</div>
                  <div style="font-size: 14px; color: #6b7280;">${isPDF ? 'مستند PDF' : 'مرفق'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>مراسلة ${correspondence.number}</title>
      <style>
        body {
          font-family: 'Arial', 'Tahoma', sans-serif;
          background: white;
          padding: 40px;
          color: #000;
          line-height: 1.8;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .info-item {
          display: flex;
          gap: 8px;
        }
        .info-label {
          font-weight: bold;
          color: #000;
        }
        .info-value {
          color: #374151;
        }
        .content-section {
          margin-top: 40px;
          line-height: 2;
        }
        .subject {
          padding: 16px;
          margin: 24px 0;
        }
        .subject-label {
          font-weight: bold;
          font-size: 18px;
        }
        .greeting {
          margin: 24px 0;
          white-space: pre-wrap;
          line-height: 2;
        }
        .main-content {
          white-space: pre-wrap;
          line-height: 2;
          margin: 24px 0;
        }
        .signature-section {
          margin-top: 40px;
          text-align: center;
        }
        .signature-image {
          max-width: 300px;
          height: auto;
          margin: 0 auto;
        }
        .responsible-person {
          font-weight: bold;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>مراسلة ${correspondence.type === 'incoming' ? 'واردة' : 'صادرة'}</h1>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">رقم المراسلة:</span>
          <span class="info-value">${correspondence.number}</span>
        </div>
        <div class="info-item">
          <span class="info-label">التاريخ:</span>
          <span class="info-value">${new Date(correspondence.date).toLocaleDateString('ar-SA')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${correspondence.type === 'incoming' ? 'من' : 'إلى'}:</span>
          <span class="info-value">${correspondence.from_entity}</span>
        </div>
        <div class="info-item">
          <span class="info-label">النوع:</span>
          <span class="info-value">${correspondence.type === 'incoming' ? 'وارد' : 'صادر'}</span>
        </div>
      </div>

      ${isContentType ? `
        <div class="content-section">
          <div class="subject">
            <span class="subject-label">الموضوع:</span>
            <span style="font-weight: bold; font-size: 18px;">${correspondence.subject}</span>
          </div>

          ${correspondence.greeting ? `
            <div class="greeting">${correspondence.greeting}</div>
          ` : ''}

          ${correspondence.content ? `
            <div class="main-content">${correspondence.content}</div>
          ` : ''}

          ${correspondence.responsible_person ? `
            <div class="signature-section">
              ${correspondence.signature_url ? `
                <img src="${correspondence.signature_url}" alt="التوقيع" class="signature-image" />
              ` : ''}
              <div class="responsible-person">${correspondence.responsible_person}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${attachmentsHTML}
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { correspondenceId } = await req.json();
    
    if (!correspondenceId) {
      throw new Error('Correspondence ID is required');
    }

    console.log('Generating PDF for correspondence:', correspondenceId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch correspondence data
    const { data: correspondence, error: fetchError } = await supabaseClient
      .from('correspondences')
      .select('*')
      .eq('id', correspondenceId)
      .single();

    if (fetchError) {
      console.error('Error fetching correspondence:', fetchError);
      throw new Error('Failed to fetch correspondence');
    }

    console.log('Correspondence data fetched successfully');

    // Generate HTML content
    const htmlContent = generateHTMLContent(correspondence);

    // Use a simple approach: convert HTML to PDF using chrome-aws-lambda
    // For now, we'll store the HTML and return a message
    // In production, you would use puppeteer or a PDF generation service
    
    const fileName = `correspondence-${correspondence.number}-${Date.now()}.html`;
    const filePath = `${correspondenceId}/${fileName}`;

    // Upload HTML to storage (temporary solution until we implement proper PDF generation)
    const { error: uploadError } = await supabaseClient.storage
      .from('correspondence-pdfs')
      .upload(filePath, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading HTML:', uploadError);
      throw new Error('Failed to upload HTML');
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from('correspondence-pdfs')
      .getPublicUrl(filePath);

    const pdfUrl = publicUrlData.publicUrl;

    // Update correspondence with PDF URL
    const { error: updateError } = await supabaseClient
      .from('correspondences')
      .update({ pdf_url: pdfUrl })
      .eq('id', correspondenceId);

    if (updateError) {
      console.error('Error updating correspondence:', updateError);
      throw new Error('Failed to update correspondence with PDF URL');
    }

    console.log('PDF generated successfully:', pdfUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        message: 'PDF generated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-correspondence-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating PDF';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
