import { DATABASE_URL } from './config/env.js';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => console.error('Idle DB client error:', err.message));

export default pool;
