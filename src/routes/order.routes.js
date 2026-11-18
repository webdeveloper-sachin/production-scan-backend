import { Router } from 'express';
import * as c from '../controllers/order.controller.js';
const router = Router();
router.post('/sync', c.syncOrders);
router.get('/', c.listOrders);
router.get('/:id', c.getOrder);
router.patch('/:id/status', c.updateOrderStatus);
export default router;
