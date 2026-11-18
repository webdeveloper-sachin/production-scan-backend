import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const stamp = (d) => new Date(d).getTime();
const DUMMY_HASH = await hashPassword('dummy-password'); // user na mile tab bhi same time lagta hai

/* ---------- employee ---------- */
const findEmployee = async (id) => {
  const { rows } = await pool.query(
    `SELECT e.id, e.name, e.role_id, r.role_name AS role
     FROM employees e JOIN roles r ON r.id = e.role_id WHERE e.id = $1`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'Employee ID not found');
  return rows[0];
};

export const lookupEmployee = findEmployee;

export const employeeLogin = async (id) => {
  const e = await findEmployee(id);
  const token = jwt.sign({ kind: 'employee', name: e.name, role: e.role }, JWT_SECRET, { subject: String(e.id), expiresIn: '12h' });
  return { token, user: { kind: 'employee', id: e.id, name: e.name, role: e.role } };
};

/* ---------- admin ---------- */
// Token mein password ka "version" (pv) rehta hai. Password badalte hi purane token bekaar.
const issueAdminToken = (admin) => ({
  token: jwt.sign({ kind: 'admin', name: admin.username, pv: stamp(admin.password_changed_at) }, JWT_SECRET, {
    subject: String(admin.id),
    expiresIn: '8h',
  }),
  user: { kind: 'admin', id: null, name: admin.username, role: null },
});

// Har request par DB na jana pade, isliye 60 second cache (password change par turant update)
const versions = new Map();
const TTL = 60_000;

export const getAdminVersion = async (id) => {
  const hit = versions.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.pv;
  const { rows } = await pool.query('SELECT password_changed_at FROM admins WHERE id = $1', [id]);
  const pv = rows[0] ? stamp(rows[0].password_changed_at) : null;
  versions.set(id, { pv, at: Date.now() });
  return pv;
};

export const adminLogin = async ({ username, password }) => {
  const { rows } = await pool.query('SELECT id, username, password_hash, password_changed_at FROM admins WHERE username = $1', [username]);
  const admin = rows[0];
  const ok = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) throw new ApiError(401, 'Invalid username or password');
  return issueAdminToken(admin);
};

export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  const { rows } = await pool.query('SELECT id, password_hash FROM admins WHERE id = $1', [adminId]);
  if (!rows.length) throw new ApiError(401, 'Admin account not found');
  // 400 (401 nahi): 401 par frontend session clear kar deta hai
  if (!(await verifyPassword(currentPassword, rows[0].password_hash))) throw new ApiError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new ApiError(400, 'New password must be different from the current one');

  const upd = await pool.query(
    `UPDATE admins SET password_hash = $1, password_changed_at = NOW()
     WHERE id = $2 RETURNING id, username, password_changed_at`,
    [await hashPassword(newPassword), adminId]
  );
  versions.set(adminId, { pv: stamp(upd.rows[0].password_changed_at), at: Date.now() });
  return issueAdminToken(upd.rows[0]); // naya token, taki abhi ka session chalta rahe
};

// Pehli baar start par .env se admin banata hai (uske baad .env ka password ignore hota hai)
export const seedAdmin = async () => {
  const { rows } = await pool.query('SELECT 1 FROM admins LIMIT 1');
  if (rows.length) return;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('No admin account yet. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env for the first start.');
  }
  await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [ADMIN_USERNAME, await hashPassword(ADMIN_PASSWORD)]);
  console.log(`Admin account "${ADMIN_USERNAME}" created from .env`);
};
