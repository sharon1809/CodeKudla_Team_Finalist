import { Router } from 'express';
import { uploadXray, getStudies, getStudyById, techSubmit, doctorApprove, getXrayImageFile } from '../controllers/xrayController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Apply auth middleware to all X-ray routes
router.use(authenticate);

router.post('/upload', upload.single('image'), uploadXray);
router.get('/studies', getStudies);
router.get('/studies/:id', getStudyById);
router.get('/studies/:id/image', getXrayImageFile);
router.put('/studies/:id/tech-submit', techSubmit);
router.put('/studies/:id/doctor-approve', doctorApprove);

export default router;
