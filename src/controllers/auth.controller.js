import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { parseId, requireString } from '../utils/validators.js';
import * as authService from '../services/auth.service.js';

export const lookupEmployee = asyncHandler(async (req, res) => {
  const e = await authService.lookupEmployee(parseId(req.body.employee_id, 'employee_id'));
  res.status(200).json(new ApiResponse(200, 'Employee found', { id: e.id, name: e.name, role: e.role }));
});

export const employeeLogin = asyncHandler(async (req, res) => {
  const data = await authService.employeeLogin(parseId(req.body.employee_id, 'employee_id'));
  res.status(200).json(new ApiResponse(200, 'Logged in', data));
});

// Password trim nahi hota (spaces password ka hissa ho sakte hain)
const rawPassword = (value, field) => {
  if (typeof value !== 'string' || !value) throw new ApiError(400, `${field} is required`);
  return value;
};

export const adminLogin = asyncHandler(async (req, res) => {
  const data = await authService.adminLogin({
    username: requireString(req.body.username, 'username'),
    password: rawPassword(req.body.password, 'password'),
  });
  res.status(200).json(new ApiResponse(200, 'Logged in', data));
});

export const changePassword = asyncHandler(async (req, res) => {
  const current = rawPassword(req.body.current_password, 'current_password');
  const next = rawPassword(req.body.new_password, 'new_password');
  if (next.length < 10) throw new ApiError(400, 'New password must be at least 10 characters');
  if (next.length > 200) throw new ApiError(400, 'New password is too long');

  const data = await authService.changeAdminPassword(req.user.adminId, current, next);
  res.status(200).json(new ApiResponse(200, 'Password changed', data));
});

export const me = (req, res) => res.status(200).json(new ApiResponse(200, 'OK', req.user));
