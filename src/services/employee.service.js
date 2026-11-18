import pool from '../db.js';
import { ApiError } from '../utils/api-error.js';

const BASE_SELECT = `
  SELECT e.id, e.name, e.role_id, r.role_name, e.created_at, e.updated_at
  FROM employees e
  JOIN roles r ON r.id = e.role_id
`;

export const createEmployee = async ({ name, role_id }) => {
  const { rows } = await pool.query('INSERT INTO employees (name, role_id) VALUES ($1, $2) RETURNING id', [name, role_id]);
  return getEmployeeById(rows[0].id);
};

export const listEmployees = async ({ role_id }) => {
  const params = [];
  let where = '';
  if (role_id) {
    params.push(role_id);
    where = 'WHERE e.role_id = $1';
  }
  const { rows } = await pool.query(`${BASE_SELECT} ${where} ORDER BY e.name`, params);
  return rows;
};

export const getEmployeeById = async (id) => {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE e.id = $1`, [id]);
  if (!rows.length) throw new ApiError(404, 'Employee not found');
  return rows[0];
};

export const updateEmployee = async (id, { name, role_id }) => {
  const { rowCount } = await pool.query(
    `UPDATE employees SET name = COALESCE($1, name), role_id = COALESCE($2, role_id), updated_at = NOW() WHERE id = $3`,
    [name ?? null, role_id ?? null, id]
  );
  if (!rowCount) throw new ApiError(404, 'Employee not found');
  return getEmployeeById(id);
};

export const deleteEmployee = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  if (!rowCount) throw new ApiError(404, 'Employee not found');
};
