import { Router } from 'express';
import {
  analyzeLabReport,
  getLabReportAnalysis,
  getAllReportAnalyses,
} from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Lab Report OCR + RAG analysis endpoints
router.post('/analyze/:documentId', analyzeLabReport);
router.get('/analysis/:documentId', getLabReportAnalysis);
router.get('/analyses', getAllReportAnalyses);

export default router;
