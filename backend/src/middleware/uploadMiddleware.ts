import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure local uploads directory exists
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});

// File filter: PDF, DOCX, and image formats (JPG, PNG, TIFF) for lab report scans
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExts = /pdf|docx|jpg|jpeg|png|tiff|tif/;
  const mimetype = file.mimetype;
  const extname = path.extname(file.originalname).toLowerCase().replace(/^\./, '');

  const isValidMime =
    mimetype === 'application/pdf' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype.startsWith('image/');

  const isValidExt = allowedExts.test(extname);

  if (isValidMime && isValidExt) {
    return cb(null, true);
  }

  cb(new Error('Supported file formats: PDF, Word (.docx), and Images (.jpg, .png, .tiff).'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10)) * 1024 * 1024, // 20MB limit
  },
});
