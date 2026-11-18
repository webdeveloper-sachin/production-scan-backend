import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { parseId, requireDate, parsePagination } from '../utils/validators.js';
import * as scanService from '../services/scan.service.js';

// Employee token se aata hai, body se nahi: koi dusre ke naam se scan nahi kar sakta
export const createScan = asyncHandler(async (req, res) => {
  const order_id = parseId(req.body.order_id, 'order_id');
  const scan = await scanService.createScan({ order_id, employee_id: req.user.id });
  res.status(201).json(new ApiResponse(201, 'Scan recorded', scan));
});

export const listScans = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { order_id, employee_id, from, to } = req.query;
  const { total, scans } = await scanService.listScans({
    order_id: order_id ? parseId(order_id, 'order_id') : undefined,
    employee_id: employee_id ? parseId(employee_id, 'employee_id') : undefined,
    from: from ? requireDate(from, 'from') : undefined,
    to: to ? requireDate(to, 'to') : undefined,
    limit,
    offset,
  });
  res.status(200).json(
    new ApiResponse(200, 'Scans fetched', { scans, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } })
  );
});

export const earningsReport = asyncHandler(async (req, res) => {
  const from = requireDate(req.query.from, 'from');
  const to = requireDate(req.query.to, 'to');
  res.status(200).json(new ApiResponse(200, 'Earnings report generated', { from, to, report: await scanService.earningsReport({ from, to }) }));
});

export const employeeEarnings = asyncHandler(async (req, res) => {
  const data = await scanService.employeeEarningsDetail({
    employee_id: parseId(req.params.employeeId, 'employeeId'),
    from: requireDate(req.query.from, 'from'),
    to: requireDate(req.query.to, 'to'),
  });
  res.status(200).json(new ApiResponse(200, 'Employee earnings fetched', data));
});

// Employee apni hi earning dekhta hai (id token se)
export const myEarnings = asyncHandler(async (req, res) => {
  const data = await scanService.employeeEarningsDetail({
    employee_id: req.user.id,
    from: requireDate(req.query.from, 'from'),
    to: requireDate(req.query.to, 'to'),
  });
  res.status(200).json(new ApiResponse(200, 'Earnings fetched', data));
});

export const topStyles = asyncHandler(async (req, res) => {
  const from = requireDate(req.query.from, 'from');
  const to = requireDate(req.query.to, 'to');
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  res.status(200).json(new ApiResponse(200, 'Top styles fetched', { from, to, styles: await scanService.topStyles({ from, to, limit }) }));
});
