import express from 'express';
import cors from 'cors';
import { initializeDatabase, clickhouse } from './clickhouse/client';
import { createTables } from './clickhouse/schema';
import { login, verifySession } from './api/auth';
import { listUsers, updateUser } from './api/users';
import { listCorrespondences, getCorrespondence } from './api/correspondences';
import { listEntities } from './api/entities';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', login);
app.post('/api/auth/verify-session', verifySession);

// User routes
app.post('/api/users/list', listUsers);
app.post('/api/users/update', updateUser);

// Correspondence routes
app.get('/api/correspondences', listCorrespondences);
app.get('/api/correspondences/:id', getCorrespondence);

// Entity routes
app.get('/api/entities', listEntities);

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing ClickHouse database...');
    await initializeDatabase();
    
    console.log('Creating tables...');
    await createTables();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://192.168.203.134:${PORT}`);
      console.log(`ClickHouse connected successfully`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await clickhouse.close();
  process.exit(0);
});

startServer();
