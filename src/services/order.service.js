import { randomUUID } from 'crypto';
import pool from '../db.js';
import { ApiError } from '../utils/api-error.js';

// Bulk sync: poore batch ki ek hi sync_id
export const syncOrders = async (orders) => {
  const sync_id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO orders (style_number, size, color, channel, sync_id)
     SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::uuid[])
     RETURNING order_id`,
    [
      orders.map((o) => o.style_number),
      orders.map((o) => o.size),
      orders.map((o) => o.color),
      orders.map((o) => o.channel),
      orders.map(() => sync_id),
    ]
  );
  return { sync_id, total_synced: rows.length, order_ids: rows.map((r) => r.order_id) };
};

// Latest synced pehle: created_at DESC
export const listOrders = async ({ status, style_number, sync_id, channel, limit, offset }) => {
  const conditions = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace('?', `$${params.length}`));
  };

  if (status) add('status = ?', status);
  if (style_number) add('style_number = ?', style_number);
  if (sync_id) add('sync_id = ?::uuid', sync_id);
  if (channel) add('channel = ?', channel);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM orders ${where}`, params),
    pool.query(
      `SELECT * FROM orders ${where}
       ORDER BY created_at DESC, order_id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
  ]);
  return { total: countRes.rows[0].total, orders: dataRes.rows };
};

export const getOrderById = async (id) => {
  const orderRes = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
  if (!orderRes.rows.length) throw new ApiError(404, 'Order not found');

  const scansRes = await pool.query(
    `SELECT s.id, s.employee_id, e.name AS employee_name, r.role_name, s.scanned_at
     FROM scan_tracking s
     LEFT JOIN employees e ON e.id = s.employee_id
     LEFT JOIN roles r ON r.id = COALESCE(s.role_id, e.role_id)
     WHERE s.order_id = $1
     ORDER BY s.scanned_at`,
    [id]
  );
  return { ...orderRes.rows[0], scans: scansRes.rows };
};

export const updateOrderStatus = async (id, status) => {
  const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', [status, id]);
  if (!rows.length) throw new ApiError(404, 'Order not found');
  return rows[0];
};
