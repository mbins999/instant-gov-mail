import { createClient } from '@clickhouse/client';

const CLICKHOUSE_HOST = '192.168.203.134';
const CLICKHOUSE_PORT = 8123;

export const clickhouse = createClient({
  host: `http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`,
  database: 'correspondence_system',
  username: 'default',
  password: '',
  compression: {
    request: false,
    response: false,
  },
});

export async function initializeDatabase() {
  try {
    // Create database if not exists
    await clickhouse.command({
      query: 'CREATE DATABASE IF NOT EXISTS correspondence_system',
    });

    console.log('ClickHouse database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ClickHouse database:', error);
    throw error;
  }
}
