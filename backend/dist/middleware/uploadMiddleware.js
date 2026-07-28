"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure the local uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename to prevent collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});
// File filter for PDF and DOCX only
const fileFilter = (req, file, cb) => {
    const filetypes = /pdf|docx/;
    const mimetype = file.mimetype;
    const extname = path_1.default.extname(file.originalname).toLowerCase();
    const isPdf = mimetype === 'application/pdf' || extname === '.pdf';
    const isDocx = mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extname === '.docx';
    if (isPdf || isDocx) {
        return cb(null, true);
    }
    cb(new Error('Only PDF and Word (.docx) documents are supported.'));
};
// Expose Multer instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB size limit
    },
});
