import pool from '../db.js';

export const getAllRoles = async () => {
  const { rows } = await pool.query('SELECT * FROM roles ORDER BY id');
  return rows;
};
