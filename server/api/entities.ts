import { Request, Response } from 'express';
import { clickhouse } from '../clickhouse/client';

export async function listEntities(req: Request, res: Response) {
  try {
    const result = await clickhouse.query({
      query: `
        SELECT 
          id,
          name,
          type,
          created_at
        FROM entities
        GROUP BY id, name, type, created_at
        ORDER BY name ASC
      `,
      format: 'JSONEachRow',
    });

    const entities = await result.json();
    
    // Remove duplicates by name (keep first occurrence)
    const seenNames = new Set<string>();
    const uniqueEntities = entities.filter((entity: any) => {
      if (!entity?.name || seenNames.has(entity.name.trim())) {
        return false;
      }
      seenNames.add(entity.name.trim());
      return true;
    });
    
    res.json(uniqueEntities);
  } catch (error) {
    console.error('List entities error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
}
