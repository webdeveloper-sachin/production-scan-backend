import app from './app.js';
import pool from './db.js';
import { PORT } from './config/env.js';
import { seedAdmin } from './services/auth.service.js';

await pool.query('SELECT 1'); // warm-up: connection pehle se ready
await seedAdmin(); // pehli baar .env se admin account banta hai

const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
