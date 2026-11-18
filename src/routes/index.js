import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import authRoutes from './auth.routes.js';
import scanRoutes from './scan.routes.js';
import meRoutes from './me.routes.js';
import roleRoutes from './role.routes.js';
import employeeRoutes from './employee.routes.js';
import patternRoutes from './pattern.routes.js';
import styleMappingRoutes from './style-mapping.routes.js';
import orderRoutes from './order.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

// Public
router.use('/auth', authRoutes);

// Login zaroori (employee ya admin, har route apna role check karta hai)
router.use(authenticate);
router.use('/scans', scanRoutes);
router.use('/me', meRoutes);

// Sirf admin
router.use(requireAdmin);
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);
router.use('/patterns', patternRoutes);
router.use('/style-mappings', styleMappingRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);

export default router;
