import { Router } from 'express';
import {
  analyzeClinicalCase,
  getClinicalHistory,
  getClinicalSessionById,
  deleteClinicalSession,
} from '../controllers/clinicalController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Real-time clinical decision support endpoint
router.post('/analyze', analyzeClinicalCase);
router.get('/history', getClinicalHistory);
router.get('/session/:id', getClinicalSessionById);
router.delete('/session/:id', deleteClinicalSession);

export default router;
