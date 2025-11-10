import { Request, Response } from 'express';
import { clickhouse } from '../clickhouse/client';

export async function listEntities(req: Request, res: Response) {
  try {
    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM entities
        ORDER BY name ASC
      `,
      format: 'JSONEachRow',
    });

    const entities = await result.json();
    res.json(entities);
  } catch (error) {
    console.error('List entities error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
}
