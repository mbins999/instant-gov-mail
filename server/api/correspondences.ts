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
        SELECT 
          id,
          number,
          type,
          subject,
          date,
          from_entity,
          received_by_entity,
          greeting,
          content,
          responsible_person,
          signature_url,
          attachments,
          notes,
          received_by,
          received_at,
          created_by,
          created_at,
          updated_at,
          archived,
          status,
          pdf_url,
          external_doc_id,
          external_connection_id
        FROM correspondences
        WHERE id = {id:String}
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { id },
    });

    const correspondences = await result.json();

    if (!correspondences || correspondences.length === 0) {
      return res.status(404).json({ error: 'Correspondence not found' });
    }

    const c = correspondences[0];
    
    // Transform response to match expected format
    res.json({
      id: c.id,
      number: c.number,
      type: c.type,
      subject: c.subject,
      date: c.date,
      from_entity: c.from_entity,
      received_by_entity: c.received_by_entity,
      greeting: c.greeting,
      content: c.content,
      responsible_person: c.responsible_person,
      signature_url: c.signature_url || '',
      attachments: c.attachments || [],
      notes: c.notes,
      received_by: c.received_by,
      received_at: c.received_at,
      created_by: c.created_by,
      created_at: c.created_at,
      updated_at: c.updated_at,
      archived: c.archived === 1,
      status: c.status,
      pdf_url: c.pdf_url,
      external_doc_id: c.external_doc_id,
      external_connection_id: c.external_connection_id
    });
  } catch (error) {
    console.error('Get correspondence error:', error);
    res.status(500).json({ error: 'Failed to fetch correspondence' });
  }
}
