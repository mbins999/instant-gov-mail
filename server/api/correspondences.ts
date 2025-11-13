import { Request, Response } from 'express';
import { clickhouse } from '../clickhouse/client';

export async function listCorrespondences(req: Request, res: Response) {
  try {
    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM correspondences
        ORDER BY date DESC
      `,
      format: 'JSONEachRow',
    });

    const correspondences = await result.json();

    // Transform data to match frontend expectations
    const transformed = correspondences.map((c: any) => ({
      ...c,
      from: c.from_entity,
      attachments: c.attachments || [],
      archived: c.archived === 1,
    }));

    res.json(transformed);
  } catch (error) {
    console.error('List correspondences error:', error);
    res.status(500).json({ error: 'Failed to fetch correspondences' });
  }
}

export async function getCorrespondence(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM correspondences
        WHERE id = {id:String}
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { id },
    });

    const rows = await result.json();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Correspondence not found' });
    }

    const row = rows[0];
    
    console.log('Raw ClickHouse row:', row);
    
    // Explicitly map each field to ensure correct parsing
    const response = {
      id: row.id,
      number: row.number,
      type: row.type,
      subject: row.subject,
      date: row.date, // Keep original date from DB
      from_entity: row.from_entity,
      received_by_entity: row.received_by_entity,
      greeting: row.greeting || '',
      content: row.content || '',
      responsible_person: row.responsible_person || '',
      signature_url: row.signature_url || '',
      attachments: Array.isArray(row.attachments) ? row.attachments : [],
      notes: row.notes || '',
      received_by: row.received_by,
      received_at: row.received_at,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived === 1 || row.archived === true,
      status: row.status || 'draft',
      pdf_url: row.pdf_url,
      external_doc_id: row.external_doc_id,
      external_connection_id: row.external_connection_id,
      display_type: row.display_type || 'content'
    };
    
    console.log('Mapped response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Get correspondence error:', error);
    res.status(500).json({ error: 'Failed to fetch correspondence' });
  }
}
