import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const getUploadDir = (): string => {
  return path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
};

/**
 * Move a temp uploaded file to permanent storage with a stable name.
 * Returns the permanent file path.
 */
export const saveUploadedFile = (
  tempPath: string,
  originalName: string,
  userId: string
): string => {
  const uploadDir = getUploadDir();
  const userDir = path.join(uploadDir, userId);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const ext = path.extname(originalName).toLowerCase();
  const safeName = `${uuidv4()}${ext}`;
  const permanentPath = path.join(userDir, safeName);

  fs.renameSync(tempPath, permanentPath);
  return permanentPath;
};

/**
 * Delete a file from local storage.
 */
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted file: ${filePath}`);
    }
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
};

/**
 * Get a public URL path for a stored file (relative, served via Express static).
 * Format: /uploads/{userId}/{filename}
 */
export const getFileUrl = (localPath: string): string => {
  const uploadDir = getUploadDir();
  const relativePath = path.relative(uploadDir, localPath).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};

/**
 * Clean up any temp files that might have been left from failed uploads.
 */
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};
