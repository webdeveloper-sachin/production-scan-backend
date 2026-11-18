import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import * as roleService from '../services/role.service.js';

export const getRoles = asyncHandler(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, 'Roles fetched', await roleService.getAllRoles()));
});
