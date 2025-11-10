import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { clickhouse } from '../clickhouse/client';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    // Get user with role
    const userResult = await clickhouse.query({
      query: `
        SELECT u.*, ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.username = {username:String}
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { username: username.trim() },
    });

    const users = await userResult.json();
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password.trim(), user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Create session
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await clickhouse.insert({
      table: 'sessions',
      values: [{
        id: uuidv4(),
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }],
      format: 'JSONEachRow',
    });

    res.json({
      session: {
        access_token: sessionToken,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          entity_name: user.entity_name,
          role: user.role || 'user',
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
}

export async function verifySession(req: Request, res: Response) {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const sessionResult = await clickhouse.query({
      query: `
        SELECT s.*, u.username, u.full_name, u.entity_name, ur.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE s.token = {token:String}
          AND s.expires_at > now()
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: { token: sessionToken },
    });

    const sessions = await sessionResult.json();

    if (!sessions || sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const session = sessions[0];

    res.json({
      userId: session.user_id,
      username: session.username,
      fullName: session.full_name,
      entityName: session.entity_name,
      role: session.role || 'user',
      sessionToken: session.token,
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
}
