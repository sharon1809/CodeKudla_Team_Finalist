import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the local uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
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
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /pdf|docx/;
  const mimetype = file.mimetype;
  const extname = path.extname(file.originalname).toLowerCase();

  const isPdf = mimetype === 'application/pdf' || extname === '.pdf';
  const isDocx = 
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    extname === '.docx';

  if (isPdf || isDocx) {
    return cb(null, true);
  }

  cb(new Error('Only PDF and Word (.docx) documents are supported.'));
};

// Expose Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
});
