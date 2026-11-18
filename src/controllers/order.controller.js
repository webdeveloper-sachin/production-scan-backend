import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { parseId, optionalString, parsePagination, requireBulkArray, failIfErrors } from '../utils/validators.js';
import * as orderService from '../services/order.service.js';

const STATUSES = ['PRODUCTION', 'FOUND_IN_INVENTORY', 'SHIPPED'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateStatus = (status) => {
  if (!STATUSES.includes(status)) throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}`);
  return status;
};

export const syncOrders = asyncHandler(async (req, res) => {
  const orders = requireBulkArray(req.body.orders, 'orders');
  const errors = [];
  const cleaned = [];

  orders.forEach((o, i) => {
    const style_number = typeof o?.style_number === 'string' ? o.style_number.trim() : '';
    const size = typeof o?.size === 'string' ? o.size.trim() : '';
    const channel = typeof o?.channel === 'string' ? o.channel.trim() : '';
    if (!style_number || !size || !channel) {
      errors.push(`Row ${i + 1}: style_number, size and channel are required`);
      return;
    }
    cleaned.push({ style_number, size, channel, color: optionalString(o.color, 'color') ?? 'Other' });
  });
  failIfErrors(errors);

  const result = await orderService.syncOrders(cleaned);
  res.status(201).json(new ApiResponse(201, 'Orders synced', result));
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, style_number, sync_id, channel } = req.query;
  if (status) validateStatus(status);
  if (sync_id && !UUID.test(sync_id)) throw new ApiError(400, 'sync_id must be a valid UUID');

  const { total, orders } = await orderService.listOrders({ status, style_number, sync_id, channel, limit, offset });
  res.status(200).json(
    new ApiResponse(200, 'Orders fetched', {
      orders,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    })
  );
});

export const getOrder = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Order fetched', await orderService.getOrderById(parseId(req.params.id))));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(parseId(req.params.id), validateStatus(req.body.status));
  res.status(200).json(new ApiResponse(200, 'Order status updated', order));
});
