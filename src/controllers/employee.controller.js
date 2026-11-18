import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { parseId, requireString } from '../utils/validators.js';
import * as employeeService from '../services/employee.service.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'name');
  const role_id = parseId(req.body.role_id, 'role_id');
  res.status(201).json(new ApiResponse(201, 'Employee created', await employeeService.createEmployee({ name, role_id })));
});

export const listEmployees = asyncHandler(async (req, res) => {
  const role_id = req.query.role_id ? parseId(req.query.role_id, 'role_id') : undefined;
  res.status(200).json(new ApiResponse(200, 'Employees fetched', await employeeService.listEmployees({ role_id })));
});

export const getEmployee = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Employee fetched', await employeeService.getEmployeeById(parseId(req.params.id))));
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const name = req.body.name !== undefined ? requireString(req.body.name, 'name') : undefined;
  const role_id = req.body.role_id !== undefined ? parseId(req.body.role_id, 'role_id') : undefined;
  if (name === undefined && role_id === undefined) throw new ApiError(400, 'Provide at least one of: name, role_id');
  res.status(200).json(new ApiResponse(200, 'Employee updated', await employeeService.updateEmployee(id, { name, role_id })));
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(parseId(req.params.id));
  res.status(200).json(new ApiResponse(200, 'Employee deleted'));
});
