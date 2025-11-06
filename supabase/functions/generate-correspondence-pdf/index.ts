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
      <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 16px; color: #111827; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">المرفقات</h3>
        <div style="display: grid; gap: 12px;">
          ${correspondence.attachments.map((url, index) => {
            const fileName = url.split('/').pop() || `مرفق ${index + 1}`;
            const fileExt = fileName.split('.').pop()?.toLowerCase();
            const isPDF = fileExt === 'pdf';
            
            return `
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <span style="font-size: 24px;">${isPDF ? '📄' : '📎'}</span>
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #111827;">${fileName}</div>
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
        @page {
          margin: 20mm;
          size: A4;
        }
        
        body {
          font-family: 'Arial', 'Tahoma', sans-serif;
          background: white;
          color: #000;
          line-height: 1.8;
          margin: 0;
          padding: 0;
        }
        
        .page-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
        }
        
        /* Header with logo */
        .header {
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo-section {
          flex: 0 0 100px;
          height: 100px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 12px;
          text-align: center;
          padding: 10px;
        }
        
        .header-content {
          flex: 1;
          text-align: center;
          padding: 0 20px;
        }
        
        .header-title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          font-size: 16px;
          color: #6b7280;
          font-weight: 600;
        }
        
        .document-type-badge {
          display: inline-block;
          padding: 8px 20px;
          background: #3b82f6;
          color: white;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          margin-top: 8px;
        }
        
        /* Info section */
        .info-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .info-item {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          min-width: 100px;
        }
        
        .info-value {
          color: #111827;
          font-weight: 500;
        }
        
        /* Content section */
        .content-section {
          margin-top: 30px;
          line-height: 2;
        }
        
        .subject-box {
          padding: 16px;
          margin: 24px 0;
          background: #eff6ff;
          border-right: 4px solid #3b82f6;
          border-radius: 4px;
        }
        
        .subject-label {
          font-weight: bold;
          font-size: 16px;
          color: #1e40af;
        }
        
        .subject-text {
          font-weight: bold;
          font-size: 18px;
          color: #111827;
          margin-right: 8px;
        }
        
        .greeting {
          margin: 24px 0;
          white-space: pre-wrap;
          line-height: 2;
          padding: 16px;
          background: #fefce8;
          border-radius: 4px;
        }
        
        .main-content {
          white-space: pre-wrap;
          line-height: 2.2;
          margin: 24px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          min-height: 200px;
        }
        
        /* Signature section */
        .signature-section {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
        }
        
        .signature-image {
          max-width: 250px;
          height: auto;
          margin: 0 auto 16px;
          border: 1px solid #e5e7eb;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        
        .responsible-person {
          font-weight: bold;
          font-size: 16px;
          color: #111827;
          margin-top: 16px;
        }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        @media print {
          .page-container {
            padding: 0;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header with Logo -->
        <div class="header">
          <div class="logo-section">
            مكان الشعار
          </div>
          <div class="header-content">
            <div class="header-title">نظام إدارة المراسلات</div>
            <div class="header-subtitle">Correspondence Management System</div>
            <div class="document-type-badge">
              مراسلة ${correspondence.type === 'incoming' ? 'واردة' : 'صادرة'}
            </div>
          </div>
          <div class="logo-section">
            <!-- Space for second logo if needed -->
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
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
        </div>

        ${isContentType ? `
          <!-- Content Section -->
          <div class="content-section">
            <div class="subject-box">
              <span class="subject-label">الموضوع:</span>
              <span class="subject-text">${correspondence.subject}</span>
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
        
        <!-- Footer -->
        <div class="footer">
          <p>تم إنشاء هذه المراسلة بواسطة نظام إدارة المراسلات</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
        </div>
      </div>
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
