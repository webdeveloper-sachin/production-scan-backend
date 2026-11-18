import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { getAdminVersion } from '../services/auth.service.js';

// Authorization: Bearer <token> verify karta hai aur req.user set karta hai
export const authenticate = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Login required'));

  let p;
  try {
    p = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new ApiError(401, 'Session expired. Please login again'));
  }

  try {
    if (p.kind === 'admin') {
      const adminId = Number(p.sub);
      // Password badal gaya ho to purana token reject
      if (!Number.isInteger(adminId) || (await getAdminVersion(adminId)) !== p.pv) {
        return next(new ApiError(401, 'Session expired. Please login again'));
      }
      req.user = { kind: 'admin', id: null, adminId, name: p.name, role: null };
    } else {
      req.user = { kind: 'employee', id: Number(p.sub), name: p.name, role: p.role ?? null };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req, _res, next) =>
  req.user?.kind === 'admin' ? next() : next(new ApiError(403, 'Admin access only'));

export const requireEmployee = (req, _res, next) =>
  req.user?.kind === 'employee' ? next() : next(new ApiError(403, 'Employee access only'));
