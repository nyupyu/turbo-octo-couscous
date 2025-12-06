import { Router } from 'express';
import { createLog, getLogs, getStats } from '../controllers/log.controller';

const router = Router();

router.post('/', createLog);
router.get('/', getLogs);
router.get('/stats', getStats);

export default router;
