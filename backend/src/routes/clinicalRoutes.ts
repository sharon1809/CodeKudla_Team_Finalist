import { Router } from 'express';
import { analyzeClinicalCase, getClinicalSessions } from '../controllers/clinicalController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// POST /api/clinical/analyze
router.post('/analyze', analyzeClinicalCase);

// GET /api/clinical/sessions
router.get('/sessions', getClinicalSessions);

export default router;
