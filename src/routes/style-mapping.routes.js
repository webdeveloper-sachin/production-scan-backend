import { Router } from 'express';
import * as c from '../controllers/style-mapping.controller.js';
const router = Router();
router.route('/').get(c.listStyles).post(c.saveMapping);
router.post('/bulk', c.bulkMappings);
router.get('/style/:styleNumber', c.getStyleDetails);
router.delete('/:id', c.deleteMapping);
export default router;
