import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentFile,
  renameDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id/file', getDocumentFile);
router.put('/:id/rename', renameDocument);
router.delete('/:id', deleteDocument);

export default router;
