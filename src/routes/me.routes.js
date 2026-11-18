import { Router } from 'express';
import { requireEmployee } from '../middlewares/auth.js';
import { myEarnings } from '../controllers/scan.controller.js';

const router = Router();
router.get('/earnings', requireEmployee, myEarnings);
export default router;
