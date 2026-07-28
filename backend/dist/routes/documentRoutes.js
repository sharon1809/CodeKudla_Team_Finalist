"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all document routes
router.use(authMiddleware_1.authenticateToken);
router.post('/upload', uploadMiddleware_1.upload.single('file'), documentController_1.uploadDocument);
router.get('/', documentController_1.getDocuments);
router.put('/:id', documentController_1.renameDocument);
router.delete('/:id', documentController_1.deleteDocument);
exports.default = router;
