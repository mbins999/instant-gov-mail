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

    const correspondences = await result.json();

    if (!correspondences || correspondences.length === 0) {
      return res.status(404).json({ error: 'Correspondence not found' });
    }

    const correspondence = correspondences[0];
    
    // Transform response to match expected format
    res.json({
      ...correspondence,
      from: correspondence.from_entity,
      to: correspondence.received_by_entity,
      attachments: correspondence.attachments || [],
      archived: correspondence.archived === 1,
      // Ensure signature_url is included
      signature_url: correspondence.signature_url || '',
    });
  } catch (error) {
    console.error('Get correspondence error:', error);
    res.status(500).json({ error: 'Failed to fetch correspondence' });
  }
}
