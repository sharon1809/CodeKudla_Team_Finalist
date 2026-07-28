import { Router } from 'express';
import {
  createChat,
  getChats,
  getChatById,
  askQuestion,
  renameChat,
  deleteChat,
} from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChatById);
router.post('/:id/question', askQuestion);
router.put('/:id/rename', renameChat);
router.delete('/:id', deleteChat);

export default router;
