import { Router } from 'express';
import * as c from '../controllers/employee.controller.js';
const router = Router();
router.route('/').get(c.listEmployees).post(c.createEmployee);
router.route('/:id').get(c.getEmployee).patch(c.updateEmployee).delete(c.deleteEmployee);
export default router;
