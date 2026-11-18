import { Router } from 'express';
import * as c from '../controllers/pattern.controller.js';
const router = Router();
router.route('/').get(c.listPatterns).post(c.createPattern);
router.post('/bulk', c.bulkPatterns);
router.route('/:id').get(c.getPattern).patch(c.updatePatternRate).delete(c.deletePattern);
export default router;
