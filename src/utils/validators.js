import { ApiError } from './api-error.js';

export const MAX_BULK = 5000;

export const parseId = (value, field = 'id') => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `${field} must be a positive integer`);
  return n;
};

export const requireString = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, `${field} is required`);
  return value.trim();
};

export const optionalString = (value, field) => {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, field);
};

export const requireRate = (value, field = 'rate') => {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(n) || n < 0) {
    throw new ApiError(400, `${field} must be a number >= 0`);
  }
  return n;
};

export const requireDate = (value, field) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${field} must be in YYYY-MM-DD format`);
  }
  return value;
};

export const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

// Bulk (CSV) rows ke liye: array check + size limit
export const requireBulkArray = (value, field) => {
  if (!Array.isArray(value) || value.length === 0) throw new ApiError(400, `${field} must be a non-empty array`);
  if (value.length > MAX_BULK) throw new ApiError(400, `Max ${MAX_BULK} rows per upload`);
  return value;
};

export const failIfErrors = (errors) => {
  if (errors.length) throw new ApiError(400, 'CSV has invalid rows', errors.slice(0, 20));
};
