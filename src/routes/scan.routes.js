import { Router } from 'express';
import { requireAdmin, requireEmployee } from '../middlewares/auth.js';
import * as c from '../controllers/scan.controller.js';

const router = Router();
router.post('/', requireEmployee, c.createScan); // sirf employee scan karta hai
router.get('/', requireAdmin, c.listScans);
export default router;
