import { Router } from 'express';
import { analyzeClinicalCase, getClinicalSessions, deleteClinicalSession } from '../controllers/clinicalController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// POST /api/clinical/analyze
router.post('/analyze', analyzeClinicalCase);

// GET /api/clinical/sessions
router.get('/sessions', getClinicalSessions);

// DELETE /api/clinical/sessions/:id
router.delete('/sessions/:id', deleteClinicalSession);

export default router;

