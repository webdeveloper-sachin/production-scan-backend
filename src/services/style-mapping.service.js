import pool from '../db.js';
import { ApiError } from '../utils/api-error.js';

const SELECT = `
  SELECT m.id AS mapping_id, m.style_number, m.pattern_number, p.rate
  FROM style_and_pattern_mapping m
  JOIN pattern_and_rates p ON p.pattern_number = m.pattern_number
`;

// Ek style ka ek hi pattern: dobara save karne par pattern replace ho jata hai
export const saveMapping = async ({ style_number, pattern_number }) => {
  try {
    await pool.query(
      `INSERT INTO style_and_pattern_mapping (style_number, pattern_number) VALUES ($1, $2)
       ON CONFLICT (style_number) DO UPDATE SET pattern_number = EXCLUDED.pattern_number`,
      [style_number, pattern_number]
    );
  } catch (err) {
    if (err.code === '23503') throw new ApiError(404, 'Pattern not found. Create the pattern first');
    throw err;
  }
  return getStyleDetails(style_number);
};

export const bulkSaveMappings = async (entries) => {
  const patterns = [...new Set(entries.map((e) => e[1]))];
  const { rows } = await pool.query(
    'SELECT pattern_number FROM pattern_and_rates WHERE pattern_number = ANY($1::text[])',
    [patterns]
  );
  const have = new Set(rows.map((r) => r.pattern_number));
  const missing = patterns.filter((p) => !have.has(p));
  if (missing.length) {
    throw new ApiError(400, 'Some patterns do not exist. Upload the rates first', missing.slice(0, 20).map((p) => `Pattern not found: ${p}`));
  }

  const res = await pool.query(
    `INSERT INTO style_and_pattern_mapping (style_number, pattern_number)
     SELECT * FROM UNNEST($1::text[], $2::text[])
     ON CONFLICT (style_number) DO UPDATE SET pattern_number = EXCLUDED.pattern_number
     RETURNING (xmax = 0) AS inserted`,
    [entries.map((e) => e[0]), entries.map((e) => e[1])]
  );
  const created = res.rows.filter((r) => r.inserted).length;
  return { total: res.rowCount, created, updated: res.rowCount - created };
};

export const getStyleDetails = async (style_number) => {
  const { rows } = await pool.query(`${SELECT} WHERE m.style_number = $1`, [style_number]);
  if (!rows.length) throw new ApiError(404, 'No pattern mapped for this style');
  return rows[0];
};

export const listStyles = async () => {
  const { rows } = await pool.query(`${SELECT} ORDER BY m.style_number`);
  return rows;
};

export const deleteMapping = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM style_and_pattern_mapping WHERE id = $1', [id]);
  if (!rowCount) throw new ApiError(404, 'Mapping not found');
};
