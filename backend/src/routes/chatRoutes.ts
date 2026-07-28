import { Router } from 'express';
import {
  createChat,
  getChats,
  getChatById,
  askQuestion,
  renameChat,
  deleteChat,
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all chat routes
router.use(authenticateToken);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChatById);
router.post('/:id/question', askQuestion);
router.put('/:id', renameChat);
router.delete('/:id', deleteChat);

export default router;
