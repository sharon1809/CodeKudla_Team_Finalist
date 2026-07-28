"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all chat routes
router.use(authMiddleware_1.authenticateToken);
router.post('/', chatController_1.createChat);
router.get('/', chatController_1.getChats);
router.get('/:id', chatController_1.getChatById);
router.post('/:id/question', chatController_1.askQuestion);
router.put('/:id', chatController_1.renameChat);
router.delete('/:id', chatController_1.deleteChat);
exports.default = router;
