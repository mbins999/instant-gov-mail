import { Request, Response } from 'express';
import { clickhouse } from '../clickhouse/client';

export async function listUsers(req: Request, res: Response) {
  try {
    const sessionToken = req.body.sessionToken || req.headers['x-session-token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify session and check if admin
    const sessionResult = await clickhouse.query({
      query: `
        SELECT s.user_id, ur.role
        FROM sessions s
        LEFT JOIN user_roles ur ON s.user_id = ur.user_id
        WHERE s.token = {token:String}
          AND s.expires_at > now()
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { token: sessionToken },
    });

    const sessions = await sessionResult.json();

    if (!sessions || sessions.length === 0 || sessions[0].role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get all users with their roles and entities
    const usersResult = await clickhouse.query({
      query: `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.entity_id,
          e.name as entity_name,
          ur.role
        FROM users u
        LEFT JOIN entities e ON u.entity_id = e.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        ORDER BY u.created_at DESC
      `,
      format: 'JSONEachRow',
    });

    const users = await usersResult.json();

    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await clickhouse.query({
      query: `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.entity_id,
          u.entity_name,
          u.signature_base64,
          u.job_title,
          ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = {id:Int64}
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { id: parseInt(id) },
    });

    const users = await result.json();

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { userId, fullName, entityId, password } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const updates: string[] = [];
    
    if (fullName) {
      updates.push(`full_name = '${fullName}'`);
    }
    
    if (entityId) {
      // Get entity name
      const entityResult = await clickhouse.query({
        query: `SELECT name FROM entities WHERE id = {id:String} LIMIT 1`,
        format: 'JSONEachRow',
        query_params: { id: entityId },
      });
      const entities = await entityResult.json();
      
      if (entities && entities.length > 0) {
        updates.push(`entity_id = '${entityId}'`);
        updates.push(`entity_name = '${entities[0].name}'`);
      }
    }
    
    if (password) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = '${passwordHash}'`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE users 
        UPDATE ${updates.join(', ')}
        WHERE id = ${userId}
      `,
    });

    res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}
