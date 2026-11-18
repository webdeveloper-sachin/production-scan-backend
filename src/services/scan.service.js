import pool from '../db.js';
import { ApiError } from '../utils/api-error.js';

// Har order ka sirf sabse latest scan. Rate usi employee ko milta hai.
const LATEST_SCAN = `
  SELECT DISTINCT ON (order_id) id, order_id, employee_id, scanned_at
  FROM scan_tracking
  ORDER BY order_id, scanned_at DESC, id DESC
`;
const IST_DATE = `(l.scanned_at AT TIME ZONE 'Asia/Kolkata')::date`;

// Ek hi round trip. Role employee ke registered role se save hota hai.
export const createScan = async ({ order_id, employee_id }) => {
  const { rows } = await pool.query(
    `WITH ins AS (
       INSERT INTO scan_tracking (order_id, employee_id, role_id)
       SELECT o.order_id, e.id, e.role_id
       FROM orders o, employees e
       WHERE o.order_id = $1 AND e.id = $2
         AND o.status = 'PRODUCTION'
         AND NOT EXISTS (
           SELECT 1 FROM scan_tracking s WHERE s.order_id = o.order_id AND s.employee_id = e.id
         )
       RETURNING id, order_id, employee_id, role_id, scanned_at
     )
     SELECT ins.*, o.style_number, o.size, o.color
     FROM ins JOIN orders o ON o.order_id = ins.order_id`,
    [order_id, employee_id]
  );
  if (rows.length) return rows[0];

  const { rows: chk } = await pool.query(
    `SELECT o.status, EXISTS (SELECT 1 FROM employees WHERE id = $2) AS emp_exists
     FROM orders o WHERE o.order_id = $1`,
    [order_id, employee_id]
  );
  if (!chk.length) throw new ApiError(404, 'Order not found');
  if (!chk[0].emp_exists) throw new ApiError(404, 'Employee not found');
  if (chk[0].status !== 'PRODUCTION') throw new ApiError(409, `Order is already ${chk[0].status}, scan not allowed`);
  throw new ApiError(409, 'You have already scanned this order');
};

export const listScans = async ({ order_id, employee_id, from, to, limit, offset }) => {
  const conditions = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace('?', `$${params.length}`));
  };
  if (order_id) add('s.order_id = ?', order_id);
  if (employee_id) add('s.employee_id = ?', employee_id);
  if (from) add(`(s.scanned_at AT TIME ZONE 'Asia/Kolkata')::date >= ?::date`, from);
  if (to) add(`(s.scanned_at AT TIME ZONE 'Asia/Kolkata')::date <= ?::date`, to);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM scan_tracking s ${where}`, params),
    pool.query(
      `SELECT s.id, s.order_id, o.style_number, o.size, o.color,
              s.employee_id, e.name AS employee_name, r.role_name, s.scanned_at
       FROM scan_tracking s
       JOIN orders o ON o.order_id = s.order_id
       LEFT JOIN employees e ON e.id = s.employee_id
       LEFT JOIN roles r ON r.id = COALESCE(s.role_id, e.role_id)
       ${where}
       ORDER BY s.scanned_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
  ]);
  return { total: countRes.rows[0].total, scans: dataRes.rows };
};

export const earningsReport = async ({ from, to }) => {
  const { rows } = await pool.query(
    `WITH latest_scan AS (${LATEST_SCAN})
     SELECT e.id AS employee_id, e.name, r.role_name,
            COUNT(l.id)::int AS total_scans,
            COALESCE(SUM(p.rate), 0)::numeric(12,2) AS total_earning
     FROM latest_scan l
     JOIN employees e ON e.id = l.employee_id
     JOIN roles r ON r.id = e.role_id
     JOIN orders o ON o.order_id = l.order_id
     LEFT JOIN style_and_pattern_mapping m ON m.style_number = o.style_number
     LEFT JOIN pattern_and_rates p ON p.pattern_number = m.pattern_number
     WHERE ${IST_DATE} BETWEEN $1::date AND $2::date
     GROUP BY e.id, e.name, r.role_name
     ORDER BY e.name`,
    [from, to]
  );
  return rows;
};

// Ek employee ka date-wise detail (admin statement aur employee ka apna earning page)
export const employeeEarningsDetail = async ({ employee_id, from, to }) => {
  const empRes = await pool.query(
    `SELECT e.id, e.name, r.role_name FROM employees e JOIN roles r ON r.id = e.role_id WHERE e.id = $1`,
    [employee_id]
  );
  if (!empRes.rows.length) throw new ApiError(404, 'Employee not found');

  const { rows } = await pool.query(
    `WITH latest_scan AS (
       SELECT DISTINCT ON (order_id) id, order_id, employee_id, scanned_at
       FROM scan_tracking
       WHERE order_id IN (SELECT order_id FROM scan_tracking WHERE employee_id = $1)
       ORDER BY order_id, scanned_at DESC, id DESC
     )
     SELECT to_char(l.scanned_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS work_date,
            o.style_number, m.pattern_number,
            COALESCE(p.rate, 0) AS rate,
            COUNT(*)::int AS pcs,
            (COUNT(*) * COALESCE(p.rate, 0))::numeric(12,2) AS amount
     FROM latest_scan l
     JOIN orders o ON o.order_id = l.order_id
     LEFT JOIN style_and_pattern_mapping m ON m.style_number = o.style_number
     LEFT JOIN pattern_and_rates p ON p.pattern_number = m.pattern_number
     WHERE l.employee_id = $1 AND ${IST_DATE} BETWEEN $2::date AND $3::date
     GROUP BY 1, o.style_number, m.pattern_number, p.rate
     ORDER BY 1, o.style_number`,
    [employee_id, from, to]
  );

  const days = [];
  for (const r of rows) {
    let day = days[days.length - 1];
    if (!day || day.date !== r.work_date) {
      day = { date: r.work_date, pcs: 0, amount: 0, items: [] };
      days.push(day);
    }
    const amount = Number(r.amount);
    day.items.push({ style_number: r.style_number, pattern_number: r.pattern_number, rate: Number(r.rate), pcs: r.pcs, amount });
    day.pcs += r.pcs;
    day.amount = Number((day.amount + amount).toFixed(2));
  }

  const total_pcs = days.reduce((s, d) => s + d.pcs, 0);
  const total_amount = Number(days.reduce((s, d) => s + d.amount, 0).toFixed(2));
  const working_days = days.length;

  return {
    employee: empRes.rows[0],
    from,
    to,
    total_pcs,
    total_amount,
    working_days,
    avg_per_day: working_days ? Number((total_amount / working_days).toFixed(2)) : 0,
    days,
  };
};

// Production mein sabse zyada bane styles
export const topStyles = async ({ from, to, limit }) => {
  const { rows } = await pool.query(
    `WITH latest_scan AS (${LATEST_SCAN})
     SELECT o.style_number, m.pattern_number,
            COUNT(*)::int AS pcs,
            COUNT(DISTINCT l.employee_id)::int AS workers,
            COALESCE(SUM(p.rate), 0)::numeric(12,2) AS amount
     FROM latest_scan l
     JOIN orders o ON o.order_id = l.order_id
     LEFT JOIN style_and_pattern_mapping m ON m.style_number = o.style_number
     LEFT JOIN pattern_and_rates p ON p.pattern_number = m.pattern_number
     WHERE ${IST_DATE} BETWEEN $1::date AND $2::date
     GROUP BY o.style_number, m.pattern_number
     ORDER BY pcs DESC, amount DESC, o.style_number
     LIMIT $3`,
    [from, to, limit]
  );
  return rows;
};
