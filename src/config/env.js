import 'dotenv/config';

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ADMIN_USERNAME / ADMIN_PASSWORD sirf pehli baar admin account banane ke liye chahiye
for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[key]) throw new Error(`Missing required env variable: ${key}`);
}
if (JWT_SECRET.length < 16) throw new Error('JWT_SECRET must be at least 16 characters');
