import { Router } from 'express';
import { earningsReport, employeeEarnings, topStyles } from '../controllers/scan.controller.js';

const router = Router();
router.get('/earnings', earningsReport);
router.get('/earnings/:employeeId', employeeEarnings);
router.get('/top-styles', topStyles);
export default router;
