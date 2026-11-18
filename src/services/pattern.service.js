import pool from '../db.js';
import { ApiError } from '../utils/api-error.js';

export const createPattern = async ({ pattern_number, rate }) => {
  const { rows } = await pool.query(
    'INSERT INTO pattern_and_rates (pattern_number, rate) VALUES ($1, $2) RETURNING *',
    [pattern_number, rate]
  );
  return rows[0];
};

// CSV upload: naya pattern add, purane ka rate update
export const bulkUpsertPatterns = async (entries) => {
  const { rows } = await pool.query(
    `INSERT INTO pattern_and_rates (pattern_number, rate)
     SELECT * FROM UNNEST($1::text[], $2::numeric[])
     ON CONFLICT (pattern_number) DO UPDATE SET rate = EXCLUDED.rate
     RETURNING (xmax = 0) AS inserted`,
    [entries.map((e) => e[0]), entries.map((e) => e[1])]
  );
  const created = rows.filter((r) => r.inserted).length;
  return { total: rows.length, created, updated: rows.length - created };
};

export const listPatterns = async () => {
  const { rows } = await pool.query('SELECT * FROM pattern_and_rates ORDER BY pattern_number');
  return rows;
};

export const getPatternById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM pattern_and_rates WHERE id = $1', [id]);
  if (!rows.length) throw new ApiError(404, 'Pattern not found');
  return rows[0];
};

export const updatePatternRate = async (id, rate) => {
  const { rows } = await pool.query('UPDATE pattern_and_rates SET rate = $1 WHERE id = $2 RETURNING *', [rate, id]);
  if (!rows.length) throw new ApiError(404, 'Pattern not found');
  return rows[0];
};

export const deletePattern = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM pattern_and_rates WHERE id = $1', [id]);
  if (!rowCount) throw new ApiError(404, 'Pattern not found');
};
