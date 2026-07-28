import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  renameDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Apply auth middleware to all document routes
router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.put('/:id', renameDocument);
router.delete('/:id', deleteDocument);

export default router;
