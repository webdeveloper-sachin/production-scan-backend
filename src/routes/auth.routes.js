import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { ApiError } from '../utils/api-error.js';
import * as c from '../controllers/auth.controller.js';

const router = Router();

// Admin password guess rokne ke liye: sirf fail hue attempts count hote hain
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new ApiError(429, 'Too many failed attempts. Try again in 15 minutes')),
});

router.post('/employee/lookup', c.lookupEmployee);
router.post('/employee/login', c.employeeLogin);
router.post('/admin/login', adminLimiter, c.adminLogin);
router.post('/admin/change-password', adminLimiter, authenticate, requireAdmin, c.changePassword);
router.get('/me', authenticate, c.me);

export default router;
