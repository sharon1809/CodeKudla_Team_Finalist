import { Router } from 'express';
import {
  generatePatientReport,
  getPatientReports,
  getPatientReportById,
  createPatient,
  getPatients,
} from '../controllers/opdController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Patient Management Routes
router.post('/patients', createPatient);
router.get('/patients', getPatients);

// Patient Report Routes
router.post('/reports/generate', generatePatientReport);
router.get('/patients/:patientId/reports', getPatientReports);
router.get('/reports/:id', getPatientReportById);

export default router;
